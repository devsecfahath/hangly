(() => {
  "use strict";
  const NS = globalThis.LittleHang, $ = id => document.getElementById(id);
  const stage = NS.createStage($("preview"), { preview: true });
  let settings = { ...NS.defaults }, customImage = null, writeQueue = Promise.resolve(), ready = false, restricted = false;
  let stopwatch = NS.normalizeStopwatch(), stopwatchInterval = 0, stopwatchBusy = false;
  const status = (message, error = false) => { $("status").textContent = message; $("status").classList.toggle("error", error); };
  const savedMessage = () => restricted ? "Saved. Open a website to see your charm; browser pages don't support charms." : "Saved on this device. Your charm follows you across websites.";
  function render() {
    $("enabled").checked = settings.enabled;
    $("enabled").disabled = !ready;
    for (const key of ["size", "length", "anchor"]) {
      $(key).value = settings[key];
      $(key + "-value").value = Math.round(settings[key]) + (key === "anchor" ? "%" : "");
    }
    $("motion").checked = settings.motion === "reduced";
    $("charm-name").textContent = settings.charm === "custom" ? "Your own little thing" : NS.charms.find(c => c.id === settings.charm)?.name;
    for (const button of document.querySelectorAll("[data-charm]")) button.setAttribute("aria-pressed", String(button.dataset.charm === settings.charm));
    for (const button of document.querySelectorAll("[data-rope]")) button.setAttribute("aria-pressed", String(button.dataset.rope === settings.rope));
    $("remove-image").hidden = !customImage;
    stage.update(settings, customImage, stopwatch);
    renderStopwatch();
  }
  function renderStopwatch() {
    clearInterval(stopwatchInterval); stopwatchInterval = 0;
    const selected = settings.charm === "stopwatch";
    $("stopwatch-panel").hidden = !selected;
    $("stopwatch-toggle").textContent = stopwatch.startedAt === null ? "Start" : "Pause";
    $("stopwatch-toggle").disabled = $("stopwatch-reset").disabled = stopwatchBusy;
    const display = () => { $("stopwatch-readout").textContent = NS.formatStopwatch(NS.stopwatchElapsed(stopwatch)); };
    display();
    if (selected && stopwatch.startedAt !== null) stopwatchInterval = setInterval(display, 100);
  }
  function stopwatchChanged(changes, area) {
    if (area !== "local" || !changes.stopwatch) return;
    stopwatch = NS.normalizeStopwatch(changes.stopwatch.newValue);
    stage.update(settings, customImage, stopwatch); renderStopwatch();
  }
  async function stopwatchAction(action) {
    if (!ready || stopwatchBusy) return;
    stopwatchBusy = true; $("stopwatch-error").hidden = true; renderStopwatch();
    try {
      stopwatch = await NS.requestStopwatchAction(action);
      stage.update(settings, customImage, stopwatch);
    } catch {
      $("stopwatch-error").textContent = "Could not save the stopwatch. Try again.";
      $("stopwatch-error").hidden = false;
    } finally { stopwatchBusy = false; renderStopwatch(); }
  }
  $("stopwatch-toggle").addEventListener("click", () => stopwatchAction("toggle"));
  $("stopwatch-reset").addEventListener("click", () => stopwatchAction("reset"));
  function buildCharms() {
    $("charms").replaceChildren();
    const collection = [...NS.charms, ...(customImage ? [{ id: "custom", name: "Your image" }] : [])];
    for (const charm of collection) {
      const button = document.createElement("button"); button.type = "button"; button.className = "charm-option";
      button.dataset.charm = charm.id; button.title = charm.name; button.setAttribute("aria-label", charm.name);
      const canvas = document.createElement("canvas"); canvas.width = canvas.height = 92;
      const ctx = canvas.getContext("2d"); ctx.translate(46, 46); NS.drawCharm(ctx, charm.id, 70, NS.imageCanvas(customImage));
      button.append(canvas); button.addEventListener("click", () => { if (!ready) return; settings.charm = charm.id; render(); stage.nudge(); save(); });
      $("charms").append(button);
    }
  }
  function save(extra = {}) {
    const payload = { settings: { ...settings }, ...extra };
    status("Saving…");
    writeQueue = writeQueue.catch(() => {}).then(() => chrome.storage.local.set(payload));
    writeQueue.then(() => status(savedMessage()), () => status("Couldn't save. Try again; your previous settings are still stored.", true));
    return writeQueue;
  }
  $("enabled").addEventListener("change", () => { if (!ready) return; settings.enabled = $("enabled").checked; save(); });
  for (const key of ["size", "length", "anchor"]) {
    $(key).addEventListener("input", () => { if (!ready) return; settings[key] = Number($(key).value); render(); });
    $(key).addEventListener("change", () => { if (ready) save(); });
  }
  for (const button of document.querySelectorAll("[data-rope]")) {
    button.addEventListener("click", () => { if (!ready) return; settings.rope = button.dataset.rope; render(); save(); });
  }
  $("motion").addEventListener("change", () => { if (!ready) return; settings.motion = $("motion").checked ? "reduced" : "system"; render(); save(); });
  $("reset").addEventListener("click", () => { if (!ready) return; settings = { ...NS.defaults }; render(); stage.nudge(); save(); });
  $("remove-image").addEventListener("click", async () => {
    if (!ready) return; customImage = null;
    if (settings.charm === "custom") settings.charm = "star";
    buildCharms(); render(); await save({ customImage: null });
  });
  $("upload").addEventListener("change", async event => {
    const file = event.target.files[0]; event.target.value = "";
    if (!file || !ready) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      status("Choose a PNG, JPG, or WebP smaller than 5 MB.", true); return;
    }
    let bitmap;
    try {
      status("Making your charm…");
      bitmap = await createImageBitmap(file, { resizeWidth: 256, resizeQuality: "high" });
      if (bitmap.height > 16384) throw new Error("Image is too tall");
      const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d", { willReadFrequently: true }); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const bytes = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let binary = ""; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      customImage = { width: canvas.width, height: canvas.height, pixels: btoa(binary) };
      settings.charm = "custom"; buildCharms(); render(); stage.nudge(); await save({ customImage });
    } catch { status("Couldn't use that image. Try a smaller PNG, JPG, or WebP.", true); }
    finally { bitmap?.close(); }
  });
  async function init() {
    try {
      const result = await chrome.storage.local.get(["settings", "customImage", "stopwatch"]);
      stopwatch = NS.normalizeStopwatch(result.stopwatch);
      chrome.storage.onChanged.addListener(stopwatchChanged);
      settings = NS.normalize(result.settings); customImage = NS.validImage(result.customImage) ? result.customImage : null;
      if (settings.charm === "custom" && !customImage) settings.charm = "star";
      await Promise.allSettled(["toji-knife", "long-range-rifle", "superbike"].map(id => NS.ensureArt(id)));
      ready = true; buildCharms(); render(); stage.nudge();
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        restricted = !/^https?:/.test(tab?.url || "") || /^https?:\/\/(chromewebstore\.google\.com|microsoftedge\.microsoft\.com)/.test(tab?.url || "");
      } catch { /* Settings still work if current-tab details are unavailable. */ }
      status(restricted ? "Open or refresh a website to meet your charm. Browser pages aren't supported." : "Grab the charm to swing it. Settings stay on this device.");
    } catch { status("Couldn't load your settings. Close and reopen this popup.", true); }
  }
  window.addEventListener("pagehide", () => { stage.destroy(); clearInterval(stopwatchInterval); chrome.storage.onChanged.removeListener(stopwatchChanged); }, { once: true });
  init();
})();

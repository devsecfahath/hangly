(() => {
  "use strict";
  if (globalThis.littleHangContentStarted) return;
  globalThis.littleHangContentStarted = true;
  const NS = globalThis.LittleHang;
  let stage, host, settings, customImage, stopwatch;
  function render() {
    if (!settings.enabled) {
      stage?.destroy(); host?.remove(); stage = host = null; return;
    }
    if (!stage) {
      host = document.createElement("little-hang-companion");
      host.style.cssText = "all:initial!important;position:fixed!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;pointer-events:none!important;z-index:2147483646!important;overflow:hidden!important;color-scheme:light!important;";
      document.documentElement.append(host);
      stage = NS.createStage(host, {
        async onAnchorChange(anchor) {
          const { settings: latest } = await chrome.storage.local.get("settings");
          const updated = { ...NS.normalize(latest), anchor };
          await chrome.storage.local.set({ settings: updated });
        }
      });
      stage.update(settings, customImage, stopwatch); stage.nudge();
    } else stage.update(settings, customImage, stopwatch);
  }
  function changed(changes, area) {
    if (area !== "local") return;
    if (changes.settings) settings = NS.normalize(changes.settings.newValue);
    if (changes.customImage) customImage = changes.customImage.newValue;
    if (changes.stopwatch) stopwatch = NS.normalizeStopwatch(changes.stopwatch.newValue);
    if (changes.settings || changes.customImage || changes.stopwatch) render();
  }
  async function init() {
    try {
      const result = await chrome.storage.local.get(["settings", "customImage", "stopwatch"]);
      settings = NS.normalize(result.settings); customImage = result.customImage; stopwatch = NS.normalizeStopwatch(result.stopwatch);
      // Reloading the extension can leave the previous instance's host in the document.
      document.querySelectorAll("little-hang-companion").forEach(element => element.remove());
      chrome.storage.onChanged.addListener(changed); render();
      chrome.runtime.onMessage.addListener(ping);
    } catch {
      delete globalThis.littleHangContentStarted;
    }
  }
  function ping(message, sender, respond) {
    if (sender.id === chrome.runtime.id && message?.type === "little-hang-overlay-ready") respond(true);
  }
  window.addEventListener("pagehide", event => {
    if (!event.persisted) {
      stage?.destroy();
      chrome.storage.onChanged.removeListener(changed);
      chrome.runtime.onMessage.removeListener(ping);
    }
  });
  return init();
})();

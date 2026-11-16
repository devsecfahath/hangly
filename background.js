importScripts("shared.js", "stopwatch.js");
chrome.runtime.onInstalled.addListener(async () => {
  const state = await chrome.storage.local.get(["settings", "stopwatch"]);
  const initial = {};
  if (!state.settings) initial.settings = LittleHang.defaults;
  if (!state.stopwatch) initial.stopwatch = LittleHang.normalizeStopwatch();
  if (Object.keys(initial).length) await chrome.storage.local.set(initial);
});
// Serialize actions from popup and website tabs so two controls cannot overwrite each other.
let stopwatchQueue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "little-hang-stopwatch") return;
  if (!["toggle", "reset"].includes(message.action)) {
    sendResponse({ ok: false, error: "Unknown stopwatch action" }); return;
  }
  stopwatchQueue = stopwatchQueue.catch(() => {}).then(async () => {
    const { stopwatch } = await chrome.storage.local.get("stopwatch");
    const next = LittleHang.transitionStopwatch(stopwatch, message.action);
    await chrome.storage.local.set({ stopwatch: next });
    sendResponse({ ok: true, stopwatch: next });
  }).catch(() => sendResponse({ ok: false, error: "Could not save stopwatch. Try again." }));
  return true;
});

// Read only known packaged artwork in the extension context, independent of website CSP.
const artFiles = new Map([
  ["toji-knife", "assets/toji-knife.png"],
  ["long-range-rifle", "assets/long-range-rifle.png"],
  ["superbike", "assets/superbike.png"]
]);
const artData = new Map();
function readArtwork(id) {
  if (!artData.has(id)) artData.set(id, (async () => {
    const response = await fetch(chrome.runtime.getURL(artFiles.get(id)));
    if (!response.ok) throw new Error("Packaged artwork missing");
    const bytes = new Uint8Array(await response.arrayBuffer());
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 8192) chunks.push(String.fromCharCode(...bytes.subarray(i, i + 8192)));
    return btoa(chunks.join(""));
  })().catch(error => { artData.delete(id); throw error; }));
  return artData.get(id);
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || message?.type !== "little-hang-art") return;
  if (!artFiles.has(message.id)) { sendResponse({ ok: false }); return; }
  readArtwork(message.id).then(png => sendResponse({ ok: true, png }), () => sendResponse({ ok: false }));
  return true;
});

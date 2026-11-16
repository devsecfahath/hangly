(() => {
  "use strict";
  const NS = globalThis.LittleHang;
  function normalizeStopwatch(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    return {
      elapsedMs: Number.isFinite(value.elapsedMs) ? NS.clamp(Math.floor(value.elapsedMs), 0, Number.MAX_SAFE_INTEGER) : 0,
      startedAt: Number.isFinite(value.startedAt) && value.startedAt >= 0 ? value.startedAt : null
    };
  }
  function stopwatchElapsed(raw, now = Date.now()) {
    const state = normalizeStopwatch(raw);
    return Math.min(Number.MAX_SAFE_INTEGER, state.elapsedMs +
      (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt)));
  }
  function formatStopwatch(milliseconds) {
    const ms = Math.max(0, Number.isFinite(milliseconds) ? milliseconds : 0);
    const seconds = Math.floor(ms / 1000), hours = Math.floor(seconds / 3600);
    const pad = n => String(n).padStart(2, "0");
    return (hours ? pad(hours) + ":" : "") + pad(Math.floor(seconds / 60) % 60) +
      ":" + pad(seconds % 60) + "." + Math.floor(ms / 100) % 10;
  }
  function transitionStopwatch(raw, action, now = Date.now()) {
    const state = normalizeStopwatch(raw);
    if (action === "reset") return { elapsedMs: 0, startedAt: null };
    if (action !== "toggle") throw new Error("Unknown stopwatch action");
    return state.startedAt === null
      ? { elapsedMs: state.elapsedMs, startedAt: now }
      : { elapsedMs: stopwatchElapsed(state, now), startedAt: null };
  }
  async function requestStopwatchAction(action) {
    const reply = await chrome.runtime.sendMessage({ type: "little-hang-stopwatch", action });
    if (!reply?.ok) throw new Error(reply?.error || "Could not update stopwatch");
    return normalizeStopwatch(reply.stopwatch);
  }
  Object.assign(NS, { normalizeStopwatch, stopwatchElapsed, formatStopwatch, transitionStopwatch, requestStopwatchAction });
})();

(() => {
  "use strict";
  const charms = [
    { id: "star", name: "Daydream", color: "#f2bc54" },
    { id: "moon", name: "Moonbeam", color: "#9d9bc9" },
    { id: "sprout", name: "Little leaf", color: "#7c9e78" },
    { id: "ghost", name: "Boo friend", color: "#d6cbc1" },
    { id: "heart", name: "Sweet thing", color: "#df8c87" },
    { id: "spiderman", name: "Spider-Man mask", color: "#e94447" },
    { id: "spiderman-full", name: "Spider-Man", color: "#3565a4" },
    { id: "thor-hammer", name: "Thor hammer", color: "#7fbce3" },
    { id: "captain-shield", name: "Captain America shield", color: "#d62f3c" },
    { id: "madara", name: "Madara", color: "#9b424a" },
    { id: "naruto-rasenshuriken", name: "Naruto Rasenshuriken", color: "#f38b35" },
    { id: "eren-titan", name: "Eren & Attack Titan", color: "#527f66" },
    { id: "gojo-purple", name: "Gojo Hollow Purple", color: "#a25aff" },
    { id: "kitt", name: "Knight Rider KITT", color: "#e43743" },
    { id: "stopwatch", name: "Stopwatch", color: "#75b6bd" },
    { id: "cpts-certificate", name: "CPTS certificate", color: "#9fef00" },
    { id: "glowing-diamond", name: "Glowing diamond", color: "#a6dfff" },
    { id: "toji-knife", name: "Toji knife", color: "#a8c0cc" },
    { id: "long-range-rifle", name: "Long-range rifle", color: "#7b8054" },
    { id: "superbike", name: "Superbike", color: "#e4313b" }
  ];
  const defaults = Object.freeze({ enabled: true, charm: "star", rope: "thread", size: 68, length: 150, anchor: 82, motion: "system" });
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  function normalize(raw = {}) {
    if (!raw || typeof raw !== "object") raw = {};
    const number = (key, min, max) => Number.isFinite(raw[key]) ? clamp(raw[key], min, max) : defaults[key];
    return {
      enabled: typeof raw.enabled === "boolean" ? raw.enabled : defaults.enabled,
      charm: [...charms.map(c => c.id), "custom"].includes(raw.charm) ? raw.charm : defaults.charm,
      rope: ["thread", "chain", "neon"].includes(raw.rope) ? raw.rope : defaults.rope,
      size: number("size", 44, 100), length: number("length", 80, 260), anchor: number("anchor", 8, 92),
      motion: ["system", "reduced"].includes(raw.motion) ? raw.motion : defaults.motion
    };
  }
  function validImage(value) {
    return value && Number.isInteger(value.width) && Number.isInteger(value.height)
      && value.width > 0 && value.height > 0 && value.width <= 256 && value.height <= 256
      && typeof value.pixels === "string"
      && value.pixels.length === Math.ceil(value.width * value.height * 4 / 3) * 4
      && /^[A-Za-z0-9+/]*={0,2}$/.test(value.pixels);
  }
  globalThis.LittleHang = { charms, defaults, clamp, normalize, validImage };
})();

(() => {
  "use strict";
  const NS = globalThis.LittleHang;
  const pending = new Map();
  NS.builtinArt = Object.create(null);
  NS.ensureArt = function(id) {
    if (NS.builtinArt[id]) return Promise.resolve(NS.builtinArt[id]);
    if (pending.has(id)) return pending.get(id);
    const request = (async () => {
      const reply = await chrome.runtime.sendMessage({ type: "little-hang-art", id });
      if (!reply?.ok || typeof reply.png !== "string") throw new Error("Charm artwork could not be loaded");
      const bytes = Uint8Array.from(atob(reply.png), c => c.charCodeAt(0));
      // Decode directly so website img-src rules cannot block packaged artwork.
      NS.builtinArt[id] = await createImageBitmap(new Blob([bytes], { type: "image/png" }), {
        resizeHeight: 512, resizeQuality: "high"
      });
      return NS.builtinArt[id];
    })().catch(error => { pending.delete(id); throw error; });
    pending.set(id, request);
    return request;
  };
})();

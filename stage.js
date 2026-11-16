(() => {
  "use strict";
  const NS = globalThis.LittleHang;
  NS.createStage = function(host, { preview = false, onAnchorChange = () => {} } = {}) {
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host { display: block; }
      canvas { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      button { all:initial; box-sizing:border-box; position:absolute; background:transparent; border:0;
        border-radius:50%; cursor:grab; pointer-events:auto; touch-action:none; user-select:none; }
      button[hidden] { display:none; }
      button:active { cursor:grabbing; }
      .anchor-handle { width:28px; top:0; border-radius:0 0 12px 12px; cursor:ew-resize; }
      .anchor-handle:active { cursor:ew-resize; }
      .anchor-handle:hover, .anchor-handle:focus-visible { background:#71856520; }
      .timer-controls { position:absolute; display:flex; gap:4px; pointer-events:auto; }
      .timer-controls[hidden] { display:none; }
      .timer-controls button { position:static; display:flex; align-items:center; justify-content:center;
        width:36px; height:20px; border:1px solid #a9b7ac; border-radius:5px; background:#f7f8f0;
        color:#405a4b; font:10px "Segoe UI",sans-serif; cursor:pointer; }
      .timer-controls button:disabled { opacity:0.55; cursor:wait; }
      .timer-controls button:focus-visible { outline:2px solid #718565; outline-offset:2px; }
      button:focus-visible { outline:none; }
      .anchor-handle:focus-visible { outline:2px solid #687d57; outline-offset:2px; }
    `;
    const canvas = document.createElement("canvas");
    const button = document.createElement("button");
    button.type = "button"; button.setAttribute("aria-label", "Pull or swing charm. Drag in any direction, or use the arrow keys.");
    button.title = "Grab, swing, let go · Arrow keys to nudge in any direction";
    const anchorButton = document.createElement("button");
    anchorButton.type = "button"; anchorButton.className = "anchor-handle";
    anchorButton.setAttribute("role", "slider");
    anchorButton.setAttribute("aria-label", "Hook position. Drag left or right to move the hanging charm.");
    anchorButton.setAttribute("aria-orientation", "horizontal");
    anchorButton.setAttribute("aria-valuemin", "8"); anchorButton.setAttribute("aria-valuemax", "92");
    anchorButton.title = "Drag the hook left or right. Arrow keys also move it.";
    anchorButton.hidden = true;
    const timerControls = document.createElement("div");
    timerControls.className = "timer-controls"; timerControls.hidden = true;
    const timerToggle = document.createElement("button"), timerReset = document.createElement("button");
    timerToggle.type = timerReset.type = "button";
    timerToggle.className = "timer-toggle"; timerReset.className = "timer-reset";
    timerToggle.textContent = "Start"; timerReset.textContent = "Reset";
    timerReset.setAttribute("aria-label", "Reset stopwatch"); timerReset.title = "Reset stopwatch";
    timerControls.append(timerToggle, timerReset);
    shadow.append(style, canvas, button, anchorButton, timerControls);
    const ctx = canvas.getContext("2d");
    const body = new NS.RopeBody();
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let settings = { ...NS.defaults }, custom = null, width = 1, height = 1, ratio = 1;
    let stopwatch = NS.normalizeStopwatch(), stopwatchBusy = false;
    const loadingArt = new Set();
    let effectTimer = 0;
    let frame = 0, previous = 0, pointer = null, draggedAt = 0, offset = { x: 0, y: 0 }, destroyed = false;
    let anchorPointer = null, anchorGrabOffset = 0, anchorOriginal = settings.anchor, anchorRevision = 0;
    const reduced = () => settings.motion === "reduced" || media.matches;
    const animated = () => ["thor-hammer", "naruto-rasenshuriken", "gojo-purple", "madara", "kitt", "glowing-diamond", "superbike"].includes(settings.charm) && !reduced();
    const clockRunning = () => settings.charm === "stopwatch" && stopwatch.startedAt !== null;
    function geometry() {
      const size = Math.min(settings.size, Math.max(24, width - 20),
        Math.max(24, preview ? (height - 44) / 1.8 : height - 80));
      const margin = Math.min(width / 2, size * 0.65 + 8);
      const anchor = preview ? width / 2 : NS.clamp(width * settings.anchor / 100, margin, Math.max(margin, width - margin));
      const pivotY = 24;
      const mounts = { star: 0.46, moon: 0.44, sprout: 0.48, ghost: 0.41, heart: 0.4,
        spiderman: 0.44, "spiderman-full": 0.43, "thor-hammer": 0.46, "captain-shield": 0.485, madara: 0.5, "naruto-rasenshuriken": 0.45, "eren-titan": 0.48, "gojo-purple": 0.49, kitt: 0.4, stopwatch: 0.492, "cpts-certificate": 0.41, "glowing-diamond": 0.44, "toji-knife": 0.495, "long-range-rifle": 0.57, superbike: 0.30, custom: 0.44 };
      const attachment = size * (mounts[settings.charm] || 0.46);
      // Simulate the chain end at the hanging point; the charm hangs below its joint.
      const bottomMargin = settings.charm === "stopwatch" && !preview ? Math.max(margin, size * 0.43 + 32) : margin;
      const centerLength = Math.max(attachment + 24, Math.min(settings.length, height - bottomMargin - pivotY));
      const length = centerLength - attachment;
      const bounds = {
        minX: margin - anchor, maxX: Math.max(margin, width - margin) - anchor,
        minY: 0, maxY: Math.max(24, height - bottomMargin - pivotY - attachment)
      };
      const angle = Math.atan2(body.x, body.y), tilt = NS.clamp(angle * 0.22, -0.3, 0.3);
      const ropeX = anchor + body.x, ropeY = pivotY + body.y;
      return { size, anchor, pivotY, length, bounds, angle, tilt, attachment, ropeX, ropeY,
        x: ropeX + attachment * Math.sin(tilt), y: ropeY + attachment * Math.cos(tilt) };
    }
    function syncBody() {
      const g = geometry();
      if (body.length !== g.length) body.reset(g.length);
      body.constrain(g.bounds);
    }
    function strokeGlow(strength = 1) {
      ctx.save(); ctx.setLineDash([]); ctx.globalAlpha *= strength;
      ctx.strokeStyle = "rgba(93,241,141,0.15)"; ctx.lineWidth = 7;
      ctx.shadowColor = "#64ed94"; ctx.shadowBlur = 18; ctx.stroke();
      ctx.strokeStyle = "rgba(140,255,178,0.72)"; ctx.lineWidth = 3.8;
      ctx.shadowBlur = 9; ctx.stroke();
      ctx.strokeStyle = "#e4ffe9"; ctx.lineWidth = 1.7;
      ctx.shadowBlur = 3; ctx.stroke();
      ctx.restore();
    }
    function drawHookWrap(g, front) {
      ctx.save(); ctx.translate(g.anchor, g.pivotY); ctx.rotate(-g.angle);
      ctx.lineCap = "round"; ctx.setLineDash([]);
      ctx.beginPath(); ctx.ellipse(0, 0, 4.3, 7.5, 0,
        front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
      if (settings.rope === "neon") strokeGlow(front ? 1 : 0.5);
      else if (settings.rope === "chain") {
        ctx.globalAlpha = front ? 1 : 0.7;
        ctx.strokeStyle = "#3f515f"; ctx.lineWidth = 3.9; ctx.stroke();
        const steel = ctx.createLinearGradient(-5, -5, 5, 6);
        steel.addColorStop(0, "#e8f2f8"); steel.addColorStop(0.5, "#9bafbf"); steel.addColorStop(1, "#6c8190");
        ctx.strokeStyle = steel; ctx.lineWidth = 2.4; ctx.stroke();
      } else {
        ctx.globalAlpha = front ? 1 : 0.65;
        ctx.strokeStyle = "#815d3e"; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = "#d4b18b"; ctx.lineWidth = 1.3; ctx.stroke();
      }
      ctx.restore();
    }
    function paint(now = performance.now()) {
      const g = geometry();
      ctx.clearRect(0, 0, width, height);
      if (!settings.enabled && !preview) { button.hidden = true; anchorButton.hidden = true; timerControls.hidden = true; return; }
      button.hidden = false; anchorButton.hidden = preview;
      anchorButton.style.left = g.anchor - 14 + "px";
      const hookTop = g.pivotY - 24;
      anchorButton.style.top = hookTop + "px";
      anchorButton.style.height = "32px";
      anchorButton.setAttribute("aria-valuenow", String(Math.round(settings.anchor)));
      anchorButton.setAttribute("aria-valuetext", Math.round(settings.anchor) + " percent across the window");
      ctx.save(); ctx.lineCap = "round";
      const tones = { thread: "#bd9870", chain: "#969c9b", neon: "#9fbea0" };
      ctx.strokeStyle = tones[settings.rope]; ctx.lineWidth = settings.rope === "chain" ? 3.4 : 1.6;
      if (settings.rope === "chain") ctx.setLineDash([2, 3]);

      const ropeX = g.ropeX, ropeY = g.ropeY;
      // The free strand starts where the closed loop leaves the hook.
      const joinX = g.anchor + Math.sin(g.angle) * 7.5;
      const joinY = g.pivotY + Math.cos(g.angle) * 7.5;
      const relativeY = ropeY - joinY;
      const distance = Math.hypot(ropeX - joinX, relativeY);
      const restLength = Math.max(1, g.length - 7.5);
      const slack = Math.sqrt(Math.max(0, restLength * restLength - distance * distance)) * 0.6;
      const bend = g.anchor < width / 2 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(joinX, joinY);
      if (slack > 1) {
        ctx.bezierCurveTo(
          NS.clamp(joinX + bend * slack * 1.25, 4, width - 4), joinY + relativeY * 0.4 + slack * 0.65,
          NS.clamp(ropeX + bend * slack * 1.25, 4, width - 4), joinY + relativeY * 0.8 + slack * 0.5,
          ropeX, ropeY);
      } else ctx.lineTo(ropeX, ropeY);
      if (settings.rope === "neon") strokeGlow();
      else ctx.stroke();
      ctx.restore();
      // The upper half goes behind the hook; the lower half passes in front.
      drawHookWrap(g, false);
      ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round";
      const metal = ctx.createLinearGradient(g.anchor - 12, hookTop, g.anchor + 12, g.pivotY);
      metal.addColorStop(0, "#f2f6f8"); metal.addColorStop(0.4, "#a5b6c4");
      metal.addColorStop(0.75, "#61798d"); metal.addColorStop(1, "#dce8ef");
      ctx.fillStyle = "#596e80"; ctx.beginPath(); ctx.roundRect(g.anchor - 15, hookTop, 12, 8, 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(g.anchor - 9, hookTop + 5);
      ctx.lineTo(g.anchor - 9, g.pivotY - 9);
      ctx.arc(g.anchor, g.pivotY - 9, 9, Math.PI, 0, true);
      ctx.lineTo(g.anchor + 9, g.pivotY - 15);
      ctx.strokeStyle = "#405362"; ctx.lineWidth = 5.5; ctx.stroke();
      ctx.strokeStyle = metal; ctx.lineWidth = 3.6; ctx.stroke();
      ctx.fillStyle = "#dce7ef"; ctx.beginPath(); ctx.arc(g.anchor - 9, hookTop + 3.5, 1.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      drawHookWrap(g, true);
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(-g.tilt);
      const elapsedMs = NS.stopwatchElapsed(stopwatch);
      NS.drawCharm(ctx, settings.charm, g.size, custom, {
        time: now / 1000, animated: animated(), elapsedMs, reducedMotion: reduced(), rope: settings.rope
      }); ctx.restore();
      timerControls.hidden = preview || settings.charm !== "stopwatch";
      timerControls.style.left = NS.clamp(g.x - 38, 4, Math.max(4, width - 80)) + "px";
      timerControls.style.top = NS.clamp(g.y + g.size * 0.43 + 8, 0, Math.max(0, height - 24)) + "px";
      timerToggle.textContent = stopwatch.startedAt === null ? "Start" : "Pause";
      timerToggle.setAttribute("aria-label", timerToggle.textContent + " stopwatch");
      timerToggle.title = timerToggle.textContent + " stopwatch";
      timerToggle.disabled = timerReset.disabled = stopwatchBusy;
      if (settings.charm === "stopwatch") button.setAttribute("aria-label",
        "Stopwatch " + NS.formatStopwatch(elapsedMs) + ". Drag to swing. Start and Reset controls below.");
      else button.setAttribute("aria-label", "Pull or swing charm. Drag in any direction, or use the arrow keys.");
      const box = g.size * 1.3;
      button.style.width = button.style.height = box + "px";
      button.style.left = g.x - box / 2 + "px"; button.style.top = g.y - box / 2 + "px";
    }
    function tick(now) {
      frame = 0;
      if (destroyed || document.hidden || (!settings.enabled && !preview)) return;
      const dt = previous ? Math.min((now - previous) / 1000, 0.04) : 1 / 60;
      previous = now;
      if (pointer === null && anchorPointer === null && !reduced()) {
        const g = geometry(); body.step(dt, g.length, g.bounds);
      }
      paint(now);
      if (pointer === null && anchorPointer === null && !reduced() && !body.settled) frame = requestAnimationFrame(tick);
      else {
        previous = 0;
        if (animated() || clockRunning()) effectTimer = setTimeout(() => { effectTimer = 0; wake(); }, clockRunning() ? 100 : 60);
      }
    }
    function wake() {
      clearTimeout(effectTimer); effectTimer = 0;
      if (!destroyed && !frame && !document.hidden) frame = requestAnimationFrame(tick);
    }
    function resize() {
      const rect = host.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
      ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0); syncBody(); wake();
    }
    function down(event) {
      if (event.button !== 0 || anchorPointer !== null) return;
      event.preventDefault(); event.stopPropagation();
      const rect = host.getBoundingClientRect(), g = geometry();
      offset = { x: event.clientX - rect.left - g.x, y: event.clientY - rect.top - g.y };
      pointer = event.pointerId; draggedAt = performance.now(); body.vx = body.vy = 0;
      button.focus({ preventScroll: true });
      button.setPointerCapture(pointer);
    }
    function move(event) {
      if (event.pointerId !== pointer) return;
      event.preventDefault(); event.stopPropagation();
      const rect = host.getBoundingClientRect(), g = geometry(), now = performance.now();
      const centerX = event.clientX - rect.left - offset.x - g.anchor;
      const centerY = event.clientY - rect.top - offset.y - g.pivotY;
      let x = centerX, y = centerY - g.attachment;
      for (let i = 0; i < 6; i++) {
        const tilt = NS.clamp(Math.atan2(x, Math.max(0, y)) * 0.22, -0.3, 0.3);
        x = centerX - g.attachment * Math.sin(tilt);
        y = centerY - g.attachment * Math.cos(tilt);
      }
      body.drag(NS.clamp(x, g.bounds.minX, g.bounds.maxX),
        NS.clamp(y, g.bounds.minY, g.bounds.maxY), (now - draggedAt) / 1000);
      draggedAt = now; paint();
    }
    function release(event) {
      if (event.pointerId !== pointer) return;
      const old = pointer; pointer = null;
      if (button.hasPointerCapture(old)) button.releasePointerCapture(old);
      if (reduced()) body.reset(geometry().length);
      else if (performance.now() - draggedAt > 90) body.vx = body.vy = 0;
      wake();
    }
    function setAnchor(value) {
      settings.anchor = NS.clamp(value, 8, 92);
      body.reset(geometry().length); paint();
    }
    function commitAnchor(previousAnchor) {
      const revision = ++anchorRevision;
      try {
        Promise.resolve(onAnchorChange(settings.anchor)).catch(() => {
          if (destroyed || revision !== anchorRevision || anchorPointer !== null) return;
          setAnchor(previousAnchor);
          anchorButton.title = "Position could not be saved. Try dragging again.";
        });
      } catch {
        if (!destroyed) setAnchor(previousAnchor);
        anchorButton.title = "Position could not be saved. Try dragging again.";
      }
    }
    function anchorDown(event) {
      if (event.button !== 0 || pointer !== null || anchorPointer !== null || preview) return;
      event.preventDefault(); event.stopPropagation();
      anchorOriginal = settings.anchor;
      anchorGrabOffset = event.clientX - host.getBoundingClientRect().left - geometry().anchor;
      anchorPointer = event.pointerId; anchorButton.focus({ preventScroll: true });
      anchorButton.setPointerCapture(anchorPointer);
      anchorButton.title = "Drag the hook left or right. Arrow keys also move it.";
      setAnchor(settings.anchor);
    }
    function anchorMove(event) {
      if (event.pointerId !== anchorPointer) return;
      event.preventDefault(); event.stopPropagation();
      const x = event.clientX - host.getBoundingClientRect().left - anchorGrabOffset;
      setAnchor(Math.round(x / width * 10000) / 100);
    }
    function anchorRelease(event, cancelled = false) {
      if (event.pointerId !== anchorPointer || anchorPointer === null) return;
      event.stopPropagation?.();
      const old = anchorPointer; anchorPointer = null;
      if (anchorButton.hasPointerCapture(old)) anchorButton.releasePointerCapture(old);
      if (cancelled) setAnchor(anchorOriginal);
      else if (settings.anchor !== anchorOriginal) commitAnchor(anchorOriginal);
      wake();
    }
    function anchorKey(event) {
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        if (anchorPointer !== null) anchorRelease({ pointerId: anchorPointer }, true);
        return;
      }
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key) || preview) return;
      event.preventDefault(); event.stopPropagation();
      const old = settings.anchor, step = event.shiftKey ? 5 : 1;
      const value = event.key === "Home" ? 8 : event.key === "End" ? 92
        : settings.anchor + (event.key === "ArrowLeft" ? -step : step);
      setAnchor(value);
      if (settings.anchor !== old) commitAnchor(old);
    }
    async function stopwatchAction(action) {
      if (stopwatchBusy) return;
      stopwatchBusy = true; wake();
      try { stopwatch = await NS.requestStopwatchAction(action); }
      catch { timerToggle.title = "Could not update stopwatch. Reopen the extension and try again."; }
      finally { stopwatchBusy = false; wake(); }
    }
    timerToggle.addEventListener("click", event => { event.stopPropagation(); stopwatchAction("toggle"); });
    timerReset.addEventListener("click", event => { event.stopPropagation(); stopwatchAction("reset"); });
    function key(event) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        if (!reduced()) {
          const horizontal = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
          const vertical = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
          body.nudge(horizontal, vertical);
        }
        wake();
      }
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation();
        const old = pointer; pointer = null;
        if (old !== null && button.hasPointerCapture(old)) button.releasePointerCapture(old);
        body.reset(geometry().length); wake();
      }
    }
    function visibility() {
      previous = 0;
      if (document.hidden) {
        if (anchorPointer !== null) anchorRelease({ pointerId: anchorPointer });
        cancelAnimationFrame(frame); clearTimeout(effectTimer); effectTimer = 0; frame = 0; pointer = null;
      }
      else wake();
    }
    function motionChanged() { if (reduced() && pointer === null) body.reset(geometry().length); wake(); }
    button.addEventListener("pointerdown", down); button.addEventListener("pointermove", move);
    button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release); button.addEventListener("keydown", key);
    anchorButton.addEventListener("pointerdown", anchorDown);
    anchorButton.addEventListener("pointermove", anchorMove);
    anchorButton.addEventListener("pointerup", event => anchorRelease(event));
    anchorButton.addEventListener("pointercancel", event => anchorRelease(event, true));
    anchorButton.addEventListener("lostpointercapture", event => anchorRelease(event));
    anchorButton.addEventListener("keydown", anchorKey);
    document.addEventListener("visibilitychange", visibility); media.addEventListener("change", motionChanged);
    const observer = new ResizeObserver(resize); observer.observe(host); resize();
    return {
      update(next, image, timerState) {
        const nextSettings = NS.normalize(next);
        if (anchorPointer !== null) nextSettings.anchor = settings.anchor;
        settings = nextSettings;
        const artId = settings.charm;
        if (["toji-knife", "long-range-rifle", "superbike"].includes(artId) && !NS.builtinArt[artId] && !loadingArt.has(artId)) {
          loadingArt.add(artId);
          NS.ensureArt(artId).then(() => { if (!destroyed) wake(); }).catch(() => {
            loadingArt.delete(artId);
            button.title = "Could not load charm artwork. Reload the extension and refresh this page.";
          });
        }
        if (image !== undefined) custom = NS.imageCanvas(image);
        if (timerState !== undefined) stopwatch = NS.normalizeStopwatch(timerState);
        syncBody();
        if (reduced() && pointer === null) body.reset(geometry().length);
        wake();
      },
      nudge() { if (!reduced()) body.nudge(settings.anchor >= 50 || preview ? -1 : 1); wake(); },
      destroy() {
        destroyed = true; cancelAnimationFrame(frame); clearTimeout(effectTimer); observer.disconnect();
        document.removeEventListener("visibilitychange", visibility); media.removeEventListener("change", motionChanged);
        shadow.replaceChildren();
      }
    };
  };
})();

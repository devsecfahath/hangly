(() => {
  "use strict";
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const gravity = 1400, stiffness = 90, ropeDamping = 6.5, airDrag = 0.7;
  class RopeBody {
    constructor(length = 150) { this.reset(length); }
    reset(length = this.length) {
      this.length = Math.max(20, length);
      this.x = 0; this.y = this.length; this.vx = 0; this.vy = 0;
    }
    step(seconds, length = this.length, bounds) {
      if (length !== this.length) this.reset(length);
      const dt = clamp(seconds, 0, 0.04);
      const steps = Math.max(1, Math.ceil(dt * 240)), h = dt / steps;
      // Gravity stretches an unloaded rope slightly. Compensate so the size
      // chosen in the popup is the settled hanging distance.
      const unloadedLength = Math.max(1, this.length - gravity / stiffness);
      for (let i = 0; i < steps; i++) {
        const distance = Math.max(0.001, Math.hypot(this.x, this.y));
        const nx = this.x / distance, ny = this.y / distance;
        const stretch = distance - unloadedLength;
        const radialSpeed = this.vx * nx + this.vy * ny;
        // A rope pulls when taut; it never pushes a raised charm downward.
        const tension = stretch > 0 ? Math.max(0, stiffness * stretch + ropeDamping * radialSpeed) : 0;
        this.vx += (-tension * nx - airDrag * this.vx) * h;
        this.vy += (gravity - tension * ny - airDrag * this.vy) * h;
        this.x += this.vx * h; this.y += this.vy * h;
        this.constrain(bounds);
      }
      if (this.settled) this.reset(this.length);
    }
    drag(x, y, seconds) {
      const dt = Math.max(seconds, 0.016);
      this.vx = clamp((x - this.x) / dt, -1000, 1000);
      this.vy = clamp((y - this.y) / dt, -1000, 1000);
      this.x = x; this.y = y;
    }
    constrain(bounds) {
      if (!bounds) return;
      for (const [axis, speed, min, max] of [
        ["x", "vx", bounds.minX, bounds.maxX], ["y", "vy", bounds.minY, bounds.maxY]
      ]) {
        if (this[axis] < min) {
          this[axis] = min; if (this[speed] < 0) this[speed] *= -0.22;
        } else if (this[axis] > max) {
          this[axis] = max; if (this[speed] > 0) this[speed] *= -0.22;
        }
      }
    }
    nudge(horizontal = 1, vertical = 0) {
      this.vx = clamp(this.vx + horizontal * 260, -1000, 1000);
      this.vy = clamp(this.vy + vertical * 220, -1000, 1000);
    }
    get settled() {
      return Math.abs(this.x) < 0.08 && Math.abs(this.y - this.length) < 0.08
        && Math.abs(this.vx) < 0.8 && Math.abs(this.vy) < 0.8;
    }
  }
  globalThis.LittleHang.RopeBody = RopeBody;
})();

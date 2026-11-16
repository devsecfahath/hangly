const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const root = path.join(__dirname, "..");
const context = vm.createContext({});
for (const file of ["shared.js", "stopwatch.js", "physics.js"]) vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
const NS = context.LittleHang;

test("settings reject corrupt values and clamp controls", () => {
  const value = NS.normalize({ enabled: "false", size: -10, length: 900, anchor: Infinity, charm: "<script>", rope: "bad", motion: "none" });
  assert.equal(value.enabled, true); assert.equal(value.size, 44); assert.equal(value.length, 260);
  assert.equal(value.anchor, 82); assert.equal(value.charm, "star"); assert.equal(value.rope, "thread"); assert.equal(value.motion, "system");
});
test("custom pixel images have bounded dimensions and expected encoding size", () => {
  assert.ok(NS.validImage({ width: 1, height: 1, pixels: "AAAAAA==" }));
  assert.ok(!NS.validImage({ width: 257, height: 1, pixels: "" }));
  assert.ok(!NS.validImage({ width: 1, height: 1, pixels: "bad" }));
  assert.ok(!NS.validImage({ width: 1, height: 1, pixels: "!!!!!!!!" }));
});
test("vertical pulls recoil and lifted charms fall, bounce, then settle", () => {
  for (const length of [80, 150, 260]) {
    for (const displacement of [-50, 100]) {
      const p = new NS.RopeBody(length);
      p.drag(0, length + displacement, 0.1); p.vx = p.vy = 0;
      p.step(1 / 60);
      assert.ok(displacement > 0 ? p.vy < 0 : p.vy > 0, "initial restoring direction");
      let crossed = false;
      for (let i = 0; i < 5400; i++) {
        p.step(1 / 60);
        if (displacement > 0 ? p.y < length - 0.2 : p.y > length + 0.2) crossed = true;
        assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
      }
      assert.ok(crossed, "release bounces past equilibrium");
      assert.ok(p.settled); assert.equal(p.x, 0); assert.equal(p.y, length);
    }
  }
});
test("sideways releases swing across the anchor and settle", () => {
  for (const length of [80, 150, 260]) {
    const p = new NS.RopeBody(length); p.drag(70, length, 0.1); p.vx = p.vy = 0;
    let crossed = false;
    for (let i = 0; i < 5400; i++) {
      p.step(1 / 60); if (p.x < -0.2) crossed = true;
    }
    assert.ok(crossed); assert.ok(p.settled);
  }
});
test("a slack rope exerts no compressive force on a raised charm", () => {
  const p = new NS.RopeBody(150);
  p.drag(0, 40, 0.1); p.vx = p.vy = 0;
  p.step(1 / 60);
  assert.ok(p.y > 40); assert.ok(p.vy > 20 && p.vy < 25);
  assert.equal(p.x, 0);
});
test("direct vertical dragging preserves its position and release momentum", () => {
  const p = new NS.RopeBody(150);
  p.drag(0, 240, 0.02);
  assert.equal(p.x, 0); assert.equal(p.y, 240); assert.ok(p.vy > 0);
  p.drag(0, 70, 0.02);
  assert.equal(p.y, 70); assert.ok(p.vy < 0);
  assert.ok(Math.abs(p.vy) <= 1000);
});
test("large frame gaps and repeated throws stay inside viewport bounds", () => {
  const bounds = { minX: -80, maxX: 80, minY: 24, maxY: 280 };
  const p = new NS.RopeBody(150);
  for (let i = 0; i < 500; i++) {
    p.nudge(i % 2 ? 1 : -1, i % 3 ? 1 : -1); p.step(12, 150, bounds);
    assert.ok(p.x >= bounds.minX && p.x <= bounds.maxX);
    assert.ok(p.y >= bounds.minY && p.y <= bounds.maxY);
    assert.ok(Number.isFinite(p.vx) && Number.isFinite(p.vy));
  }
});
test("releases from either horizontal extreme fall inward and settle below the hook", () => {
  const bounds = { minX: -300, maxX: 300, minY: 0, maxY: 350 };
  for (const side of [-1, 1]) {
    const p = new NS.RopeBody(150);
    p.drag(side * 150, 0, 0.1); p.vx = p.vy = 0;
    p.step(1 / 60, 150, bounds);
    assert.ok(p.y > 0, "gravity pulls the horizontal charm down");
    assert.ok(p.vx * side < 0, "rope tension pulls toward the hook");
    for (let i = 0; i < 5400; i++) p.step(1 / 60, 150, bounds);
    assert.ok(p.settled); assert.equal(p.y, 150);
  }
});
test("stopwatch counts hidden time and pauses and resumes without losing elapsed time", () => {
  let timer = NS.transitionStopwatch(undefined, "toggle", 1000);
  assert.equal(NS.stopwatchElapsed(timer, 1700), 700);
  timer = NS.transitionStopwatch(timer, "toggle", 1700);
  assert.equal(timer.startedAt, null);
  assert.equal(NS.stopwatchElapsed(timer, 9000), 700);
  timer = NS.transitionStopwatch(timer, "toggle", 10000);
  assert.equal(NS.stopwatchElapsed(timer, 11500), 2200);
  timer = NS.transitionStopwatch(timer, "reset", 12000);
  assert.equal(timer.startedAt, null); assert.equal(timer.elapsedMs, 0);
});
test("stopwatch validates stored state and formats minutes and hours", () => {
  const bad = NS.normalizeStopwatch({elapsedMs:Infinity,startedAt:NaN});
  assert.equal(bad.elapsedMs,0); assert.equal(bad.startedAt,null);
  assert.equal(NS.normalizeStopwatch({elapsedMs:-20}).elapsedMs,0);
  assert.equal(NS.stopwatchElapsed({elapsedMs:10,startedAt:2000},1000),10);
  assert.equal(NS.formatStopwatch(0),"00:00.0");
  assert.equal(NS.formatStopwatch(61234),"01:01.2");
  assert.equal(NS.formatStopwatch(3600123),"01:00:00.1");
});
test("manifest uses packaged scripts and all referenced files exist", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3); assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.content_scripts[0].all_frames, false);
  for (const file of [...manifest.content_scripts[0].js, manifest.action.default_popup, manifest.background.service_worker, ...Object.values(manifest.icons), "assets/toji-knife.png", "assets/long-range-rifle.png", "assets/superbike.png"]) {
    assert.ok(fs.existsSync(path.join(root, file)), file + " exists");
  }
  assert.ok(!manifest.content_security_policy.extension_pages.includes("unsafe-eval"));
});

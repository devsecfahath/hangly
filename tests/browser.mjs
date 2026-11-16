import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import http from "node:http";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const executable = process.env.LITTLE_HANG_BROWSER || [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"
].find(existsSync);
assert.ok(executable, "A Chrome or Edge executable is required");
const profile = path.join(root, ".browser-test", "profile-" + Date.now());
const artifacts = path.join(root, "artifacts");
await fs.mkdir(profile, { recursive: true }); await fs.mkdir(artifacts, { recursive: true });
const fixture = '<!doctype html><html><head><title>Charm browser check</title></head><body style="margin:0;background:#faf9f5;font:18px system-ui;color:#333c32"><main style="padding:50px"><h1>A little more personality.</h1><p>This is a normal webpage beneath the charm.</p><button id="underlying" style="position:absolute;left:20px;top:400px;padding:20px">This page still works</button><input id="page-input" style="position:absolute;left:20px;top:500px"></main></body></html>';
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html", "Content-Security-Policy": "default-src 'self'; script-src 'none'; img-src 'none'; style-src 'unsafe-inline'" });
  res.end(fixture);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const site = "http://127.0.0.1:" + server.address().port;
let stderr = "", browserClient;
const processHandle = spawn(executable, [
  "--headless=new", "--remote-debugging-port=0", "--remote-allow-origins=*",
  "--user-data-dir=" + profile, "--no-first-run", "--no-default-browser-check",
  "--disable-component-update", "--disable-background-networking",
  "--disable-extensions-except=" + root, "--load-extension=" + root, "about:blank"
], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
processHandle.stderr.on("data", d => { stderr += d; });
let next = 0;
class CDP {
  constructor(socket) {
    this.socket = socket; this.pending = new Map(); this.errors = [];
    socket.addEventListener("message", event => {
      const msg = JSON.parse(event.data);
      if (msg.id) {
        const item = this.pending.get(msg.id); if (!item) return;
        this.pending.delete(msg.id); clearTimeout(item.timer);
        if (msg.error) item.reject(new Error(JSON.stringify(msg.error))); else item.resolve(msg.result);
      } else if (msg.method === "Runtime.exceptionThrown") this.errors.push(msg.params.exceptionDetails.text + ": " + (msg.params.exceptionDetails.exception?.description || ""));
    });
  }
  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => { ws.addEventListener("open", resolve, { once: true }); ws.addEventListener("error", reject, { once: true }); });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = ++next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error("CDP timeout: " + method)); }, 12000);
      this.pending.set(id, { resolve, reject, timer }); this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  close() { this.socket.close(); }
}
const clients = [];
try {
  let portData;
  for (let i = 0; i < 150; i++) {
    try { portData = await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8"); break; } catch {}
    if (processHandle.exitCode !== null) throw new Error("Browser exited: " + stderr.slice(-2000));
    await sleep(100);
  }
  assert.ok(portData, "Browser opened a DevTools port: " + stderr.slice(-1200));
  const [port, socketPath] = portData.trim().split(/\r?\n/);
  const endpoint = "http://127.0.0.1:" + port;
  browserClient = await CDP.connect("ws://127.0.0.1:" + port + socketPath);
  async function targets() { return (await fetch(endpoint + "/json/list")).json(); }
  let worker;
  const candidates = new Map();
  for (let i = 0; i < 100; i++) {
    for (const candidate of (await targets()).filter(t => t.type === "service_worker" && t.url.startsWith("chrome-extension://"))) {
      const check = await CDP.connect(candidate.webSocketDebuggerUrl);
      try {
        const info = await check.eval("({name:chrome.runtime.getManifest().name, popup:chrome.runtime.getManifest().action?.default_popup, id:chrome.runtime.id})");
        candidates.set(candidate.url, info);
        if (info.name.startsWith("Little Hang")) worker = candidate;
      } catch { /* A worker may still be starting; inspect it on the next pass. */ } finally { check.close(); }
      if (worker) break;
    }
    if (worker) break; await sleep(100);
  }
  assert.ok(worker, "Unpacked extension service worker loaded. Browser may prohibit --load-extension. " + stderr.slice(-1200));
  const extensionOrigin = new URL(worker.url).protocol + "//" + new URL(worker.url).host;
  console.log("PASS: unpacked Manifest V3 extension loaded", extensionOrigin);
  async function page(url) {
    const created = await browserClient.send("Target.createTarget", { url });
    let target;
    for (let i = 0; i < 40; i++) { target = (await targets()).find(t => t.id === created.targetId); if (target) break; await sleep(100); }
    assert.ok(target); const client = await CDP.connect(target.webSocketDebuggerUrl); clients.push(client);
    await client.send("Runtime.enable"); await client.send("Page.enable");
    for (let i = 0; i < 60; i++) {
      try { if (await client.eval("document.readyState === 'complete'")) break; } catch {}
      await sleep(100);
    }
    return client;
  }
  const popup = await page(extensionOrigin + "/popup.html");
  await popup.send("Emulation.setDeviceMetricsOverride", { width: 380, height: 850, deviceScaleFactor: 1, mobile: false });
  for (let i = 0; i < 50; i++) { if (await popup.eval("document.querySelectorAll('[data-charm]').length === 20")) break; await sleep(100); }
  assert.equal(await popup.eval("document.querySelectorAll('[data-charm]').length"), 20, JSON.stringify({page: await popup.eval("({url:location.href,text:document.body.innerText.slice(0,1500)})"), errors:popup.errors}));
  assert.equal(await popup.eval("document.getElementById('enabled').disabled"), false);
  console.log("PASS: popup renders original collection and saved defaults");
  const tab = await page(site), second = await page(site + "/second");
  for (const client of [tab, second]) {
    for (let i = 0; i < 50; i++) { if (await client.eval("!!document.querySelector('little-hang-companion')")) break; await sleep(100); }
    assert.ok(await client.eval("!!document.querySelector('little-hang-companion')"));
  }
  console.log("PASS: overlay loads on two websites with a restrictive content security policy");
  async function waitFor(client, expression) {
    for (let i = 0; i < 70; i++) { if (await client.eval(expression)) return; await sleep(100); }
    throw new Error("Timed out: " + expression);
  }
  await popup.eval("document.querySelector('[data-charm=spiderman-full]').click(); document.querySelector('[data-rope=chain]').click(); document.getElementById('size').value='92'; document.getElementById('size').dispatchEvent(new Event('input')); document.getElementById('size').dispatchEvent(new Event('change'));");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='spiderman-full'&&settings.rope==='chain'&&settings.size===92})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Spider-Man' && document.getElementById('size').value==='92'");
  console.log("PASS: Spider-Man selection, rope and size persist after popup reload");
  await popup.send("Page.bringToFront"); await sleep(200);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-spiderman-full.png"), Buffer.from(r.data, "base64")));
  await popup.eval("document.getElementById('enabled').click()");
  for (const client of [tab, second]) await waitFor(client, "!document.querySelector('little-hang-companion')");
  await popup.eval("document.getElementById('enabled').click()");
  for (const client of [tab, second]) await waitFor(client, "!!document.querySelector('little-hang-companion')");
  console.log("PASS: global visibility updates existing tabs immediately");
  await tab.eval("document.getElementById('underlying').addEventListener('click',()=>document.body.dataset.clicked='yes')");
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: 80, y: 430, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: 80, y: 430, button: "left", clickCount: 1 });
  assert.equal(await tab.eval("document.body.dataset.clicked"), "yes");
  console.log("PASS: underlying webpage remains clickable");
  async function shadowButton(client, className) {
    await client.send("DOM.enable");
    const { root: doc } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
    function find(n) {
      if (n.nodeName === "LITTLE-HANG-COMPANION") return n;
      for (const child of [...(n.children || []), ...(n.shadowRoots || [])]) { const hit = find(child); if (hit) return hit; }
    }
    const host = find(doc); assert.ok(host?.shadowRoots?.length);
    function findButton(n) {
      if (n.nodeName === "BUTTON" && (!className || n.attributes?.includes(className))) return n;
      for (const child of n.children || []) { const found = findButton(child); if (found) return found; }
    }
    const buttonNode = findButton(host.shadowRoots[0]);
    const { object } = await client.send("DOM.resolveNode", { nodeId: buttonNode.nodeId });
    return object.objectId;
  }
  async function buttonRect(client, objectId) {
    const result = await client.send("Runtime.callFunctionOn", { objectId, functionDeclaration: "function(){const r=this.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,left:this.style.left}}", returnByValue: true });
    return result.result.value;
  }
  await tab.send("Page.bringToFront");
  await sleep(200);
  const buttonId = await shadowButton(tab), initialRect = await buttonRect(tab, buttonId);
  const cx = initialRect.x + initialRect.width / 2, cy = initialRect.y + initialRect.height / 2;
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx - 90, y: cy - 30, button: "left", buttons: 1 });
  const dragged = await buttonRect(tab, buttonId);
  assert.ok(Math.abs(dragged.x - initialRect.x) > 20, JSON.stringify({initialRect,dragged,hidden:await tab.eval("document.hidden")}));
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx - 90, y: cy - 30, button: "left", clickCount: 1 });
  await sleep(250);
  const swinging = await buttonRect(tab, buttonId); assert.notEqual(swinging.left, dragged.left);
  console.log("PASS: pointer capture, dragging, and release physics");
  async function restCharm() {
    await tab.send("Runtime.callFunctionOn", { objectId: buttonId, functionDeclaration: "function(){this.focus()}" });
    await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
    await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
    await sleep(80); return buttonRect(tab, buttonId);
  }
  async function pullCharm(deltaY) {
    const rect = await restCharm(), x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y: y + deltaY, button: "left", buttons: 1 });
    return { rest: rect, dragged: await buttonRect(tab, buttonId), x, y: y + deltaY };
  }
  async function dropCharm(pull) {
    await sleep(120); // Release after holding still, so this checks restoring force rather than a throw.
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pull.x, y: pull.y, button: "left", clickCount: 1 });
  }
  const downPull = await pullCharm(95);
  assert.ok(downPull.dragged.y - downPull.rest.y > 85);
  assert.ok(Math.abs(downPull.dragged.x - downPull.rest.x) < 2);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "rope-stretched.png"), Buffer.from(r.data, "base64")));
  await dropCharm(downPull); await sleep(200);
  const recoiled = await buttonRect(tab, buttonId);
  assert.ok(recoiled.y < downPull.dragged.y - 15, JSON.stringify({downPull,recoiled}));
  const upPull = await pullCharm(-85);
  assert.ok(upPull.rest.y - upPull.dragged.y > 75);
  assert.ok(Math.abs(upPull.dragged.x - upPull.rest.x) < 2);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "rope-slack.png"), Buffer.from(r.data, "base64")));
  await dropCharm(upPull); await sleep(160);
  const fallen = await buttonRect(tab, buttonId);
  assert.ok(fallen.y > upPull.dragged.y + 3, JSON.stringify({upPull,fallen}));
  await restCharm();
  console.log("PASS: downward stretching recoils and upward lifting creates slack then falls under gravity");
  await popup.eval("document.getElementById('anchor').value='50'; document.getElementById('anchor').dispatchEvent(new Event('input')); document.getElementById('anchor').dispatchEvent(new Event('change'));");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.anchor===50})()");
  await restCharm();
  const hookButton = await shadowButton(tab, "anchor-handle");
  const hookRect = await buttonRect(tab, hookButton);
  const pivotX = hookRect.x + hookRect.width / 2, pivotY = hookRect.y + hookRect.height - 8;
  assert.equal(hookRect.y, 0, "compact hook mounts flush with the top edge");
  assert.equal(hookRect.height, 32, "compact hook keeps its small hit area");
  const extremes = [];
  for (const side of [-1, 1]) {
    const rest = await restCharm(), startX = rest.x + rest.width / 2, startY = rest.y + rest.height / 2;
    const attachment = 92 * 0.43;
    const tilt = side * 0.3;
    const targetX = pivotX + side * 150 + attachment * Math.sin(tilt);
    const targetY = pivotY + attachment * Math.cos(tilt);
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: startX, y: startY });
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: targetX, y: targetY, button: "left", buttons: 1 });
    const extreme = await buttonRect(tab, buttonId);
    const centerX = extreme.x + extreme.width / 2, centerY = extreme.y + extreme.height / 2;
    assert.ok(Math.abs(centerX - targetX) < 1 && Math.abs(centerY - targetY) < 1, JSON.stringify({side,pivotX,pivotY,extreme}));
    assert.ok(extreme.x >= 0 && extreme.y >= 0, "horizontal charm remains in view");
    extremes.push(Math.atan2(centerX - attachment * Math.sin(tilt) - pivotX, centerY - attachment * Math.cos(tilt) - pivotY));
    await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, side < 0 ? "hook-swing-left.png" : "hook-swing-right.png"), Buffer.from(r.data, "base64")));
    await sleep(120);
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: targetX, y: targetY, button: "left", clickCount: 1 });
    await sleep(220);
    const falling = await buttonRect(tab, buttonId);
    assert.ok(falling.y > extreme.y + 2, "horizontal release falls under gravity");
    assert.ok(side < 0 ? falling.x > extreme.x : falling.x < extreme.x, "release swings inward");
  }
  assert.ok(Math.abs(extremes[1] - extremes[0] - Math.PI) < 0.02, "left and right extremes span 180 degrees");
  await restCharm();
  console.log("PASS: compact hook sits at the top edge and its joint supports a 180-degree chain arc");

  await tab.send("Emulation.setDeviceMetricsOverride", { width: 320, height: 600, deviceScaleFactor: 1, mobile: false });
  await sleep(100);
  await tab.send("Runtime.callFunctionOn", { objectId: buttonId, functionDeclaration: "function(){this.focus()}" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight" });
  await sleep(650);
  const narrow = await buttonRect(tab, buttonId);
  assert.ok(narrow.x >= 0 && narrow.x + narrow.width <= 320, JSON.stringify(narrow));
  await tab.send("Emulation.clearDeviceMetricsOverride");
  console.log("PASS: swinging charm stays inside a narrow viewport");
  await tab.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await sleep(100);
  const reducedA = await buttonRect(tab, buttonId);
  await tab.send("Runtime.callFunctionOn", { objectId: buttonId, functionDeclaration: "function(){this.focus()}" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "ArrowRight", code: "ArrowRight" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight" });
  await sleep(200); const reducedB = await buttonRect(tab, buttonId); assert.equal(reducedA.left, reducedB.left);
  console.log("PASS: system reduced-motion prevents autonomous swinging");
  let anchorId = await shadowButton(tab, "anchor-handle");
  const viewWidth = await tab.eval("document.querySelector('little-hang-companion').getBoundingClientRect().width");
  async function dragAnchorTo(x) {
    const rect = await buttonRect(tab, anchorId);
    const startX = rect.x + rect.width / 2, startY = rect.y + 6;
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: startX, y: startY });
    await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: startX, y: startY, button: "left", clickCount: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y: startY, button: "left", buttons: 1 });
    await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y: startY, button: "left", clickCount: 1 });
  }
  await dragAnchorTo(viewWidth * 0.35);
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return Math.abs(settings.anchor-35)<0.1})()");
  const movedLeft = await buttonRect(tab, buttonId);
  assert.ok(Math.abs(movedLeft.x + movedLeft.width / 2 - viewWidth * 0.35) < 2);
  await dragAnchorTo(viewWidth * 0.65);
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return Math.abs(settings.anchor-65)<0.1 && settings.charm==='spiderman-full' && settings.rope==='chain' && settings.size===92})()");
  const movedRight = await buttonRect(tab, buttonId);
  assert.ok(movedRight.x > movedLeft.x);
  assert.ok(Math.abs(movedRight.x + movedRight.width / 2 - viewWidth * 0.65) < 2);
  console.log("PASS: dragging top dot left and right moves the whole charm and saves without changing appearance");
  await second.send("Page.bringToFront"); await sleep(100);
  const secondAnchor = await shadowButton(second, "anchor-handle");
  const secondRect = await buttonRect(second, secondAnchor);
  const secondWidth = await second.eval("document.querySelector('little-hang-companion').getBoundingClientRect().width");
  assert.ok(Math.abs(secondRect.x + secondRect.width / 2 - secondWidth * 0.65) < 2);
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('anchor')?.value==='65'");
  console.log("PASS: saved anchor updates other tabs and the popup slider");
  await tab.send("Page.bringToFront"); await tab.send("Page.reload");
  await waitFor(tab, "!!document.querySelector('little-hang-companion')");
  await sleep(100);
  anchorId = await shadowButton(tab, "anchor-handle");
  const afterReload = await buttonRect(tab, anchorId);
  assert.ok(Math.abs(afterReload.x + afterReload.width / 2 - viewWidth * 0.65) < 2);
  console.log("PASS: dragged anchor survives a webpage refresh");
  await tab.send("Runtime.callFunctionOn", { objectId: anchorId, functionDeclaration: "function(){this.focus()}" });
  for (const key of ["ArrowLeft", "ArrowRight", "Home", "End"]) {
    await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key, code: key });
    await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key, code: key });
    const expected = { ArrowLeft: 64, ArrowRight: 65, Home: 8, End: 92 }[key];
    await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.anchor===" + expected + "})()");
  }
  await dragAnchorTo(-100);
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.anchor===8})()");
  await dragAnchorTo(viewWidth + 100);
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.anchor===92})()");
  console.log("PASS: anchor keyboard controls and pointer edge limits");
  const beforeCancel = await buttonRect(tab, anchorId);
  const cancelX = beforeCancel.x + beforeCancel.width / 2, cancelY = beforeCancel.y + 6;
  await tab.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cancelX, y: cancelY, button: "left", clickCount: 1 });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: viewWidth * 0.4, y: cancelY, button: "left", buttons: 1 });
  await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await tab.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: viewWidth * 0.4, y: cancelY, button: "left", clickCount: 1 });
  const afterCancel = await buttonRect(tab, anchorId);
  assert.ok(Math.abs(afterCancel.x - beforeCancel.x) < 1);
  assert.equal(await popup.eval("(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.anchor})()"), 92);
  console.log("PASS: Escape cancels an anchor drag without saving it");
  await popup.eval("document.querySelector('[data-charm=thor-hammer]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='thor-hammer'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Thor hammer'");
  console.log("PASS: Thor hammer selection persists after popup reload");
  async function charmPixels(client) {
    const { root: doc } = await client.send("DOM.getDocument", { depth: -1, pierce: true });
    function hostNode(n) {
      if (n.nodeName === "LITTLE-HANG-COMPANION") return n;
      for (const child of [...(n.children || []), ...(n.shadowRoots || [])]) {
        const hit = hostNode(child); if (hit) return hit;
      }
    }
    const host = hostNode(doc);
    const canvas = host.shadowRoots[0].children.find(n => n.nodeName === "CANVAS");
    const { object } = await client.send("DOM.resolveNode", { nodeId: canvas.nodeId });
    const result = await client.send("Runtime.callFunctionOn", {
      objectId: object.objectId, functionDeclaration: "function(){return this.toDataURL()}", returnByValue: true
    });
    return result.result.value;
  }
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  const hammerButton = await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", { objectId: hammerButton, functionDeclaration: "function(){this.focus()}" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape" });
  await tab.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape" });
  await sleep(100);
  const hammerRect = await buttonRect(tab, hammerButton), animatedFirst = await charmPixels(tab);
  await sleep(350);
  const animatedSecond = await charmPixels(tab), stillRect = await buttonRect(tab, hammerButton);
  assert.notEqual(animatedFirst, animatedSecond);
  assert.equal(hammerRect.left, stillRect.left); assert.equal(hammerRect.y, stillRect.y);
  console.log("PASS: Thor lightning animates after the hammer settles");
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-thor.png"), Buffer.from(r.data, "base64")));
  await popup.send("Page.bringToFront"); await sleep(100);
  const hiddenFirst = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), hiddenFirst);
  console.log("PASS: Thor lightning pauses in a hidden tab");
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-thor.png"), Buffer.from(r.data, "base64")));
  await tab.send("Page.bringToFront"); await sleep(100);
  const resumedFirst = await charmPixels(tab); await sleep(300);
  assert.notEqual(await charmPixels(tab), resumedFirst);
  await tab.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await sleep(100);
  const staticFirst = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), staticFirst);
  console.log("PASS: Thor lightning resumes when visible and becomes static with reduced motion");
  await popup.eval("document.querySelector('[data-charm=captain-shield]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='captain-shield'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Captain America shield'");
  const palette = await popup.eval("(()=>{const c=document.querySelector('[data-charm=captain-shield] canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let red=0,white=0,blue=0;for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];if(d[i+3]<200)continue;if(r>120&&r>g*1.4&&r>b*1.4)red++;if(r>175&&g>175&&b>175)white++;if(b>80&&b>r*1.4&&b>g*1.05)blue++;}return{red,white,blue}})()");
  assert.ok(palette.red>20 && palette.white>20 && palette.blue>20, JSON.stringify(palette));
  await tab.send("Page.bringToFront"); await sleep(150);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-shield.png"), Buffer.from(r.data, "base64")));
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-shield.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: Captain America shield renders its red, silver, and blue design and persists after reload");
  await popup.eval("document.querySelector('[data-charm=madara]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='madara'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Madara'");
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const madaraButton = await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", {objectId:madaraButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(100);
  const susanooFirst = await charmPixels(tab); await sleep(300);
  assert.notEqual(await charmPixels(tab), susanooFirst);
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(100);
  const susanooStatic = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), susanooStatic);
  console.log("PASS: Madara Susanoo pulses and becomes static with reduced motion");
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-madara.png"), Buffer.from(r.data, "base64")));
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-madara.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: Madara renders in the collection and on the webpage and stays selected after reload");
  await popup.eval("document.querySelector('[data-charm=naruto-rasenshuriken]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='naruto-rasenshuriken'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Naruto Rasenshuriken'");
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const narutoButton = await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", {objectId:narutoButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(100);
  const chakraFirst = await charmPixels(tab); await sleep(300);
  assert.notEqual(await charmPixels(tab), chakraFirst);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-naruto.png"), Buffer.from(r.data, "base64")));
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(100);
  const chakraStatic = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), chakraStatic);
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-naruto.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: Naruto selection persists, Rasenshuriken spins, and reduced motion makes it static");
  await popup.eval("document.querySelector('[data-charm=eren-titan]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='eren-titan'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Eren & Attack Titan'");
  await tab.send("Page.bringToFront"); await sleep(150);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-eren.png"), Buffer.from(r.data, "base64")));
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-eren.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: Eren and Attack Titan render as a combined charm and remain selected after reload");
  await popup.eval("document.querySelector('[data-charm=gojo-purple]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='gojo-purple'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Gojo Hollow Purple'");
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const gojoButton = await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", {objectId:gojoButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(100);
  const purpleFirst = await charmPixels(tab); await sleep(300);
  assert.notEqual(await charmPixels(tab), purpleFirst);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-gojo.png"), Buffer.from(r.data, "base64")));
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(100);
  const purpleStatic = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), purpleStatic);
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-gojo.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: Gojo selection persists, Hollow Purple animates, and reduced motion makes it static");
  await popup.eval("document.querySelector('[data-charm=kitt]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='kitt'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Knight Rider KITT'");
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const kittButton = await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", {objectId:kittButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(100);
  const scannerFirst = await charmPixels(tab); await sleep(300);
  assert.notEqual(await charmPixels(tab), scannerFirst);
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage-kitt.png"), Buffer.from(r.data, "base64")));
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(100);
  const scannerStatic = await charmPixels(tab); await sleep(300);
  assert.equal(await charmPixels(tab), scannerStatic);
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-kitt.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: KITT selection persists, red scanner sweeps, and reduced motion makes it static");
  await popup.eval("document.querySelector('[data-charm=stopwatch]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='stopwatch'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "!document.getElementById('stopwatch-panel')?.hidden && document.getElementById('charm-name')?.textContent==='Stopwatch'");
  async function timerState() {
    return popup.eval("(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');const s=LittleHang.normalizeStopwatch(stopwatch);return {...s,elapsed:LittleHang.stopwatchElapsed(s)}})()");
  }
  async function clickControl(client, objectId) {
    const r=await buttonRect(client,objectId),x=r.x+r.width/2,y=r.y+r.height/2;
    await client.send("Input.dispatchMouseEvent",{type:"mousePressed",x,y,button:"left",clickCount:1});
    await client.send("Input.dispatchMouseEvent",{type:"mouseReleased",x,y,button:"left",clickCount:1});
  }
  await popup.eval("document.getElementById('stopwatch-reset').click()");
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt===null&&stopwatch?.elapsedMs===0})()");
  await tab.send("Page.bringToFront"); await sleep(150);
  const timerToggle = await shadowButton(tab,"timer-toggle");
  await clickControl(tab,timerToggle);
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt!==null})()");
  const started=await timerState(); await sleep(400);
  assert.ok((await timerState()).elapsed>=started.elapsed+250);
  await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-stopwatch.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: hanging stopwatch Start control advances time even with reduced motion");
  await second.send("Page.bringToFront"); await sleep(150);
  const secondToggle=await shadowButton(second,"timer-toggle");
  const secondLabel=await second.send("Runtime.callFunctionOn",{objectId:secondToggle,functionDeclaration:"function(){return this.textContent}",returnByValue:true});
  assert.equal(secondLabel.result.value,"Pause");
  await clickControl(second,secondToggle);
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt===null})()");
  const paused=await timerState(); await sleep(250);
  assert.equal((await timerState()).elapsed,paused.elapsed);
  console.log("PASS: another tab pauses the same stopwatch and paused time remains fixed");
  await popup.eval("document.getElementById('stopwatch-toggle').click()");
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt!==null})()");
  await tab.send("Page.bringToFront"); await tab.send("Page.reload");
  await waitFor(tab,"!!document.querySelector('little-hang-companion')");
  await sleep(300);
  assert.ok((await timerState()).elapsed>paused.elapsed+200);
  await popup.send("Page.reload");
  await waitFor(popup,"document.getElementById('stopwatch-toggle')?.textContent==='Pause'");
  await popup.eval("document.getElementById('stopwatch-toggle').click()");
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt===null})()");
  const resumed=await timerState();
  assert.ok(resumed.elapsed>paused.elapsed);
  await popup.send("Page.bringToFront"); await sleep(150);
  const expectedReadout=await popup.eval("(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return LittleHang.formatStopwatch(LittleHang.stopwatchElapsed(stopwatch))})()");
  assert.equal(await popup.eval("document.getElementById('stopwatch-readout').textContent"),expectedReadout);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-stopwatch.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: stopwatch resumes and survives website and popup refreshes");
  await popup.eval("document.getElementById('stopwatch-reset').click()");
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.startedAt===null&&stopwatch?.elapsedMs===0})()");
  const simultaneous=await popup.eval("Promise.all([chrome.runtime.sendMessage({type:'little-hang-stopwatch',action:'toggle'}),chrome.runtime.sendMessage({type:'little-hang-stopwatch',action:'toggle'})])");
  assert.ok(simultaneous.every(reply=>reply.ok));
  assert.equal((await timerState()).startedAt,null);
  await tab.send("Page.bringToFront"); await sleep(100);
  const timerReset=await shadowButton(tab,"timer-reset");
  await clickControl(tab,timerReset);
  await waitFor(popup,"(async()=>{const {stopwatch}=await chrome.storage.local.get('stopwatch');return stopwatch?.elapsedMs===0&&stopwatch?.startedAt===null})()");
  console.log("PASS: stopwatch Reset clears time and concurrent controls serialize correctly");
  await popup.eval("document.querySelector('[data-charm=cpts-certificate]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='cpts-certificate'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='CPTS certificate'");
  assert.equal(await popup.eval("document.getElementById('stopwatch-panel').hidden"),true);
  await tab.send("Page.bringToFront"); await sleep(150);
  const hiddenTimerControl = await shadowButton(tab,"timer-toggle");
  assert.equal((await buttonRect(tab,hiddenTimerControl)).width,0);
  await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-cpts.png"),Buffer.from(r.data,"base64")));
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-cpts.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: CPTS certificate renders, stays selected after reload, and hides stopwatch controls");
  await popup.eval("document.querySelector('[data-charm=glowing-diamond]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='glowing-diamond'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Glowing diamond'");
  await tab.send("Page.bringToFront");
  await tab.eval("document.body.style.background='#0b111c';document.body.style.color='#e6edf7'");
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const diamondButton=await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn", {objectId:diamondButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent", {type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(100);
  const shineFirst=await charmPixels(tab);await sleep(350);
  assert.notEqual(await charmPixels(tab),shineFirst);
  await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-diamond.png"),Buffer.from(r.data,"base64")));
  await tab.send("Emulation.setEmulatedMedia", {features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(100);
  const shineStatic=await charmPixels(tab);await sleep(300);
  assert.equal(await charmPixels(tab),shineStatic);
  await popup.send("Page.bringToFront");await sleep(150);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-diamond.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: glowing diamond selection persists, light reflection animates, and reduced motion preserves static glow");
  await popup.eval("document.querySelector('[data-charm=toji-knife]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='toji-knife'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Toji knife'");
  await tab.send("Page.bringToFront"); await sleep(150);
  await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-toji.png"),Buffer.from(r.data,"base64")));
  await popup.send("Page.bringToFront"); await sleep(150);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-toji.png"),Buffer.from(r.data,"base64")));
  assert.equal(await popup.eval("LittleHang.builtinArt['toji-knife']?.height"), 512);
  await tab.send("Page.bringToFront"); await sleep(150);
  const tojiButton = await shadowButton(tab);
  const gripPixels = await tab.send("Runtime.callFunctionOn", {
    objectId: tojiButton,
    functionDeclaration: "function(){const c=this.getRootNode().querySelector('canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let red=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>200&&d[i]>45&&d[i]>d[i+1]*1.5&&d[i]>d[i+2]*1.3)red++;return red;}",
    returnByValue: true
  });
  assert.ok(gripPixels.result.value > 5, "Reference knife burgundy grip renders despite img-src none");
  console.log("PASS: realistic Toji artwork loads under restrictive CSP and selection persists");
  await popup.eval("document.querySelector('[data-charm=long-range-rifle]').click()");
  await waitFor(popup, "(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='long-range-rifle'})()");
  await popup.send("Page.reload");
  await waitFor(popup, "document.getElementById('charm-name')?.textContent==='Long-range rifle'");
  assert.equal(await popup.eval("LittleHang.builtinArt['long-range-rifle']?.height"),512);
  await tab.send("Page.reload");
  await tab.send("Page.bringToFront");
  await sleep(400);
  const rifleButton = await shadowButton(tab);
  let olivePixels = 0;
  for (let i=0;i<30&&olivePixels<=5;i++) {
    const pixels = await tab.send("Runtime.callFunctionOn", {
      objectId: rifleButton,
      functionDeclaration: "function(){const c=this.getRootNode().querySelector('canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let olive=0;for(let i=0;i<d.length;i+=4)if(d[i+3]>230&&d[i]>25&&d[i]<140&&d[i+1]>25&&d[i+1]<140&&d[i]>d[i+2]*1.3&&d[i+1]>d[i+2]*1.3)olive++;return olive;}",
      returnByValue:true
    });
    olivePixels=pixels.result.value;
    if(olivePixels<=5) await sleep(100);
  }
  assert.ok(olivePixels>5,"Rifle olive stock renders under restrictive image CSP");
  for(const rope of ["thread","chain","neon"]) {
    await popup.eval("document.querySelector('[data-rope="+rope+"]').click()");
    await waitFor(popup,"(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.rope==='"+rope+"'})()");
    await tab.send("Page.bringToFront");await sleep(120);
    await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-rifle-"+rope+".png"),Buffer.from(r.data,"base64")));
  }
  await popup.send("Page.bringToFront");await sleep(150);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-rifle.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: realistic rifle persists after popup and website reloads, renders under strict CSP, and supports all three ropes");
  await popup.eval("document.querySelector('[data-charm=superbike]').click()");
  await waitFor(popup,"(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='superbike'})()");
  await popup.send("Page.reload");
  await waitFor(popup,"document.getElementById('charm-name')?.textContent==='Superbike'");
  assert.equal(await popup.eval("LittleHang.builtinArt.superbike?.height"),512);
  const bikeArtCheck = await popup.eval(`(()=>{
    const canvas=document.createElement("canvas");canvas.width=800;canvas.height=500;
    const ctx=canvas.getContext("2d",{willReadFrequently:true});
    function frame(time){
      ctx.clearRect(0,0,800,500);ctx.save();ctx.translate(400,250);
      LittleHang.drawCharm(ctx,"superbike",600,null,{animated:true,time});
      ctx.restore();return ctx.getImageData(90,275,100,100).data;
    }
    const first=frame(0),second=frame(Math.PI/32);
    let changes=0;for(let i=0;i<first.length;i+=4)
      if(Math.abs(first[i]-second[i])+Math.abs(first[i+1]-second[i+1])+Math.abs(first[i+2]-second[i+2])>25)changes++;
    return {changes,png:canvas.toDataURL()};
  })()`);
  assert.ok(bikeArtCheck.changes>100,"Wheel texture rotates while the engine is at the same vibration phase");
  await fs.writeFile(path.join(artifacts,"superbike-detail.png"),Buffer.from(bikeArtCheck.png.split(",")[1],"base64"));

  await popup.eval("const size=document.getElementById('size');size.value='100';size.dispatchEvent(new Event('input'));size.dispatchEvent(new Event('change'));document.querySelector('[data-rope=chain]').click()");
  await waitFor(popup,"(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.size===100&&settings.rope==='chain'})()");
  await tab.send("Page.bringToFront");
  await tab.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"no-preference"}]});
  const bikeButton=await shadowButton(tab);
  await tab.send("Runtime.callFunctionOn",{objectId:bikeButton,functionDeclaration:"function(){this.focus()}"});
  await tab.send("Input.dispatchKeyEvent",{type:"keyDown",key:"Escape",code:"Escape"});
  await tab.send("Input.dispatchKeyEvent",{type:"keyUp",key:"Escape",code:"Escape"});
  await sleep(400);
  const bikeRect=await buttonRect(tab,bikeButton),bikeFirst=await charmPixels(tab);
  await sleep(300);
  assert.ok((await charmPixels(tab))!==bikeFirst,"Bike animates after the rope settles");
  const bikeStillRect=await buttonRect(tab,bikeButton);
  assert.equal(bikeRect.left,bikeStillRect.left);
  assert.equal(bikeRect.y,bikeStillRect.y);
  await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-superbike.png"),Buffer.from(r.data,"base64")));
  await popup.send("Page.bringToFront");await sleep(150);
  const bikeHidden=await charmPixels(tab);await sleep(250);
  assert.ok((await charmPixels(tab))===bikeHidden,"Bike pauses in a hidden tab");
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-superbike.png"),Buffer.from(r.data,"base64")));
  await tab.send("Page.bringToFront");await sleep(150);
  const bikeResumed=await charmPixels(tab);await sleep(300);
  assert.ok((await charmPixels(tab))!==bikeResumed,"Bike animation resumes on return");
  await tab.send("Emulation.setEmulatedMedia",{features:[{name:"prefers-reduced-motion",value:"reduce"}]});
  await sleep(150);
  const bikeStatic=await charmPixels(tab);await sleep(300);
  assert.ok((await charmPixels(tab))===bikeStatic,"Reduced motion keeps the bike static");
  console.log("PASS: superbike selection persists, animates with a settled rope, pauses when hidden, resumes, and respects reduced motion");
  await popup.eval("document.querySelector('[data-charm=sprout]').click()");
  await waitFor(popup,"(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.charm==='sprout'})()");
  await tab.eval("document.body.style.background='#0b111c';document.body.style.color='#e6edf7'");
  const sproutButton=await shadowButton(tab);
  for(const rope of ["thread","chain","neon"]) {
    await popup.eval("document.querySelector('[data-rope="+rope+"]').click()");
    await waitFor(popup,"(async()=>{const {settings}=await chrome.storage.local.get('settings');return settings.rope==='"+rope+"'})()");
    await tab.send("Page.bringToFront");await sleep(150);
    const eyelet=await tab.send("Runtime.callFunctionOn",{
      objectId:sproutButton,
      functionDeclaration:"function(){const r=this.getBoundingClientRect(),c=this.getRootNode().querySelector('canvas'),scale=c.width/c.getBoundingClientRect().width;const x=(r.x+r.width/2-6)*scale,y=(r.y+r.height/2-45)*scale;const d=c.getContext('2d').getImageData(Math.round(x),Math.round(y),Math.round(12*scale),Math.round(6*scale)).data;let visible=0;for(let i=3;i<d.length;i+=4)if(d[i]>180)visible++;return visible;}",
      returnByValue:true
    });
    assert.ok(eyelet.result.value>16,"Sprout eyelet connects directly beneath the "+rope+" endpoint");
    await tab.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"webpage-sprout-"+rope+".png"),Buffer.from(r.data,"base64")));
  }
  await popup.send("Page.bringToFront");await sleep(150);
  await popup.send("Page.captureScreenshot").then(r=>fs.writeFile(path.join(artifacts,"popup-sprout.png"),Buffer.from(r.data,"base64")));
  console.log("PASS: sprout eyelet meets the rope and planter supports render with Thread, Chain, and Glow");














  const { root: doc } = await popup.send("DOM.getDocument");
  const { nodeId } = await popup.send("DOM.querySelector", { nodeId: doc.nodeId, selector: "#upload" });
  await popup.send("DOM.setFileInputFiles", { nodeId, files: [path.join(root, "icons", "icon128.png")] });
  await waitFor(popup, "(async()=>{const {settings,customImage}=await chrome.storage.local.get(['settings','customImage']);return settings.charm==='custom'&&customImage?.width>0})()");
  assert.equal(await popup.eval("document.querySelectorAll('[data-charm]').length"), 21);
  console.log("PASS: custom image upload is rasterized and saved locally");
  await tab.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "webpage.png"), Buffer.from(r.data, "base64")));
  await popup.send("Page.bringToFront"); await sleep(200);
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup-custom.png"), Buffer.from(r.data, "base64")));
  await popup.eval("document.getElementById('remove-image').click()");
  await waitFor(popup, "(async()=>{const {settings,customImage}=await chrome.storage.local.get(['settings','customImage']);return settings.charm==='star'&&!customImage})()");
  await popup.eval("document.getElementById('reset').click()");
  await waitFor(popup, "document.getElementById('size').value==='68'");
  await popup.send("Page.captureScreenshot").then(r => fs.writeFile(path.join(artifacts, "popup.png"), Buffer.from(r.data, "base64")));
  console.log("PASS: custom image removal and appearance reset");
  for (const client of clients) assert.deepEqual(client.errors, []);
  console.log("PASS: no uncaught browser exceptions");
  console.log("Screenshots saved to", artifacts);
} finally {
  for (const client of clients) client.close();
  try { await browserClient?.send("Browser.close"); } catch {}
  browserClient?.close(); processHandle.kill(); server.close();
}

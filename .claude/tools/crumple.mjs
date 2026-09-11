// Drive business section 02 (CrumpleReceipt) through all six beats and shoot
// each one. The scene is pointer-driven, so a static screenshot proves nothing
// — this synthesises the real gesture and reports the phase it reached.
//   node .claude/tools/crumple.mjs <url> <outPrefix> [w=1440] [h=900]
// Phases are read off the button label: "Crumple it" -> ready, "Throw it away"
// -> crumpled, no paper -> done.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, prefix, W = "1440", H = "900"] = process.argv.slice(2);
const port = 9400 + Math.floor(Math.random() * 150);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run",
  `--user-data-dir=/tmp/cr-${port}`, `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
const mouse = (type, x, y, extra = {}) => send("Input.dispatchMouseEvent", { type, x, y, button: "left", clickCount: 1, ...extra });
async function shot(name) {
  const r = await ev(`(()=>{const b=document.querySelector('[class*="crStage"]').getBoundingClientRect();return {x:Math.max(0,b.left-10),y:b.top+scrollY-10,w:b.width+20,h:b.height+20}})()`);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, "base64")); console.log(name);
}
const state = async (tag) => console.log(`  [${tag}] btn=${await ev(`document.querySelector('[class*="crStage"]').querySelector("button")?.textContent`)} paper=${await ev(`document.querySelector('[class*="crPaper"]')?"present":"GONE"`)}`);
try {
  let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 768 });
  await send("Page.navigate", { url }); await sleep(4500);
  const top = await ev(`document.querySelector('[class*="crStage"]').getBoundingClientRect().top+scrollY`);
  for (let y = 0; y < top - 200; y += 400) { await ev(`window.scrollTo(0,${y})`); await sleep(110); }
  await ev(`document.querySelector('[class*="crStage"]').scrollIntoView({block:'center'})`);
  await sleep(1300); await shot("1-printing");
  for (let i = 0; i < 40; i++) { await sleep(200); if (await ev(`!document.querySelector('[class*="crStage"]').querySelector("button").disabled`)) break; }
  await sleep(300); await shot("2-ready");

  // beat 1: scribble until it balls up, then stop moving and let go. Releasing
  // without carrying it must NOT throw — that is the flick threshold working.
  const p = await ev(`(()=>{const b=document.querySelector('[class*="crPaper"]').getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  await mouse("mousePressed", p.x, p.y);
  let balled = false;
  for (let i = 0; i < 60 && !balled; i++) {
    await mouse("mouseMoved", p.x + Math.cos(i * 0.8) * 22, p.y + Math.sin(i * 0.8) * 18, { buttons: 1 });
    await sleep(14);
    if (i === 12) await shot("3-crumpling");
    balled = await ev(`/Throw/.test(document.querySelector('[class*="crStage"]').querySelector("button")?.textContent||"")`);
  }
  await mouse("mouseReleased", p.x + 22, p.y);
  await sleep(260); await shot("4-crumpled");
  await state("released after crumple — expect: Throw it away / paper present");

  // beat 2: pick the ball up and flick it at the bin
  const q = await ev(`(()=>{const e=document.querySelector('[class*="crPaper"]');if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}})()`);
  if (!q) throw new Error("paper vanished before the flick — the release threw it, check CARRY_TO_THROW");
  await mouse("mousePressed", q.x, q.y);
  for (let i = 1; i <= 8; i++) { await mouse("mouseMoved", q.x + i * 11, q.y - i * 5, { buttons: 1 }); await sleep(14); }
  await mouse("mouseReleased", q.x + 88, q.y - 40);
  await sleep(300); await shot("5-throwing");
  await sleep(1000); await shot("6-done");
  await state("end — expect: paper GONE");
} catch (e) { console.error("crumple failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

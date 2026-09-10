// Flip-card shots: node shootflip.mjs <url> <prefix> [w] [h] [times=900,2200,5600] [reduced=0]
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, prefix, W = "1440", H = "900", TIMES = "900,2200,5600", REDUCED = "0"] = process.argv.slice(2);
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run",
  `--user-data-dir=/tmp/shoot-${port}`, `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params }));
});
const ev = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
const mobile = +W < 768;
async function shot(name) {
  // clip to the grid (plus margin); captureBeyondViewport so the stacked mobile grid fits in one image
  const r = await ev(`(()=>{const g=document.querySelector('[data-flipcard]').parentElement.getBoundingClientRect();return {x:Math.max(0,g.left-40),y:g.top+window.scrollY-40,w:Math.min(${W},g.width+80),h:g.height+80}})()`);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 } });
  const f = `${prefix}-${name}.png`; writeFileSync(f, Buffer.from(data, "base64")); console.log(f);
}
try {
  let target;
  for (let t = 0; t < 40 && !target; t++) { await sleep(250); try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile });
  if (REDUCED === "1") await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await send("Page.navigate", { url });
  await sleep(4000);
  // scroll down in steps so Reveal observers fire, then park the grid in view
  const top = await ev(`document.querySelector('[data-flipcard]').getBoundingClientRect().top+window.scrollY`);
  for (let y = 0; y < top; y += 400) { await ev(`window.scrollTo(0,${y})`); await sleep(120); }
  await ev(`document.querySelector('[data-flipcard]').parentElement.scrollIntoView({block:'center'})`);
  await sleep(1800);
  // hover the first card on desktop to show pointer light
  if (!mobile) {
    const c = await ev(`(()=>{const b=document.querySelectorAll('[data-flipcard]')[0].getBoundingClientRect();return {x:b.left+b.width*0.3,y:b.top+b.height*0.25}})()`);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: c.x, y: c.y });
    await sleep(500);
  }
  await shot("0-front");
  if (!mobile) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 }); await sleep(400); }
  await ev(`document.querySelectorAll('[data-flipcard]').forEach(b=>b.click())`);
  const t0 = Date.now();
  for (const t of TIMES.split(",").map(Number)) {
    const wait = t - (Date.now() - t0); if (wait > 0) await sleep(wait);
    await shot(`t${String(t).padStart(4, "0")}`);
  }
  // close them again and confirm the front comes back
  await ev(`document.querySelectorAll('[data-flipcard]').forEach(b=>b.click())`);
  await sleep(1300);
  await shot("closed");
  console.log("pressed:", await ev(`[...document.querySelectorAll('[data-flipcard]')].map(b=>b.getAttribute('aria-pressed')).join(',')`));
} catch (e) { console.error("shoot failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

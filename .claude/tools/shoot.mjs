// Real-display screenshots via headless Chrome + raw CDP (no deps; Node 22 WebSocket).
// Usage: node shoot.mjs <url> <outPrefix> [width=1440] [height=900] [maxShots=14]
// Scrolls one viewport at a time (so IntersectionObserver reveals fire), waits, and
// captures each viewport to <outPrefix>-NN.png. Clears localStorage papex.pathChoice.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const [url, prefix, W = "1440", H = "900", MAX = "14"] = process.argv.slice(2);
if (!url || !prefix) { console.error("usage: node shoot.mjs <url> <outPrefix> [w] [h] [max]"); process.exit(1); }
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
try {
  let target;
  for (let t = 0; t < 40 && !target; t++) {
    await sleep(250);
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {}
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 768 });
  await send("Page.navigate", { url });
  await sleep(3500);
  await send("Runtime.evaluate", { expression: "try{localStorage.removeItem('papex.pathChoice')}catch(e){}" });
  const total = (await send("Runtime.evaluate", { expression: "document.documentElement.scrollHeight", returnByValue: true })).result.value;
  const n = Math.min(+MAX, Math.ceil(total / +H));
  for (let k = 0; k < n; k++) {
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, ${k * +H})` });
    await sleep(1400);
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const f = `${prefix}-${String(k).padStart(2, "0")}.png`; writeFileSync(f, Buffer.from(data, "base64")); console.log(f);
  }
  console.log(`pageHeight=${total}`);
} catch (e) { console.error("shoot failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

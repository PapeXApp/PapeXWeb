// Capture specific scroll positions. Usage: node shootAt.mjs <url> <outPrefix> <w> <h> <y1,y2,...|footer:OFFSET,...>
// "footer:600" scrolls so the site footer's top sits 600px from the viewport top.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, prefix, W, H, list] = process.argv.slice(2);
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run", `--user-data-dir=/tmp/shootat-${port}`, `--window-size=${W},${H}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
try {
  let t; for (let k = 0; k < 40 && !t; k++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url }); await sleep(3500);
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true })).result.value;
  // walk the page once so every reveal has fired
  const total = await ev("document.documentElement.scrollHeight");
  for (let y = 0; y < total; y += +H) { await ev(`scrollTo(0,${y})`); await sleep(250); }
  for (const item of list.split(",")) {
    let y;
    if (item.startsWith("footer:")) { const off = +item.split(":")[1]; y = await ev(`document.querySelector('footer').getBoundingClientRect().top + scrollY - ${off}`); }
    else y = +item;
    await ev(`scrollTo(0,${y})`); await sleep(1300);
    const { data } = await send("Page.captureScreenshot", { format: "png" });
    const f = `${prefix}-${item.replace(":", "")}.png`; writeFileSync(f, Buffer.from(data, "base64")); console.log(f, "y=" + Math.round(y));
  }
} catch (e) { console.error("failed:", e.message); process.exitCode = 1; } finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

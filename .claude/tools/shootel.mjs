// Clip a shot to one element, at 2x, with the page scrolled so its reveals fired.
//   node .claude/tools/shootel.mjs <url> <out.png> <selector> [n=0] [w=1440] [h=900] [pad=24]
// `selector` is matched with querySelectorAll and `n` picks the match, so CSS
// Module hashes are reachable as [class*="crPaper"].
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, out, SEL, N = "0", W = "1440", H = "900", PAD = "24"] = process.argv.slice(2);
const port = 9600 + Math.floor(Math.random() * 300);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run",
  `--user-data-dir=/tmp/el-${port}`, `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
const q = JSON.stringify(SEL);
try {
  let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 768 });
  await send("Page.navigate", { url }); await sleep(4500);
  // step down the page so IntersectionObserver reveals fire on the way
  const top = await ev(`document.querySelectorAll(${q})[${N}].getBoundingClientRect().top+window.scrollY`);
  for (let y = 0; y < top - 200; y += 400) { await ev(`window.scrollTo(0,${y})`); await sleep(110); }
  await ev(`document.querySelectorAll(${q})[${N}].scrollIntoView({block:'center'})`);
  await sleep(1600);
  const r = await ev(`(()=>{const b=document.querySelectorAll(${q})[${N}].getBoundingClientRect();return {x:Math.max(0,b.left-${PAD}),y:b.top+window.scrollY-${PAD},w:b.width+${PAD}*2,h:b.height+${PAD}*2}})()`);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 2 } });
  writeFileSync(out, Buffer.from(data, "base64")); console.log(out);
} catch (e) { console.error("shootel failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

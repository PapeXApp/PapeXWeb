// Tile PNGs into one labelled contact sheet, so a whole animation can be read
// in a single image instead of opening frames one at a time.
//   node .claude/tools/sheet.mjs <out.png> <cols> <in.png...>
// Captions come from each file's basename.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
const [out, COLS = "3", ...files] = process.argv.slice(2);
if (!files.length) { console.error("usage: sheet.mjs <out.png> <cols> <in.png...>"); process.exit(1); }
const html = `<style>body{margin:0;background:#111;font:11px monospace;color:#fff}
.g{display:grid;grid-template-columns:repeat(${+COLS},1fr);gap:4px}
figure{margin:0}img{width:100%;display:block}figcaption{padding:3px}</style><div class="g">` +
  files.map((f) => `<figure><img src="file://${resolve(f)}"><figcaption>${basename(f, ".png")}</figcaption></figure>`).join("") + "</div>";
const tmp = `/tmp/sheet-${Date.now()}.html`;
writeFileSync(tmp, html);
const port = 9800 + Math.floor(Math.random() * 150);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run",
  "--allow-file-access-from-files", `--user-data-dir=/tmp/sh-${port}`, "--window-size=1700,1400", "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
try {
  let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 1700, height: 1400, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `file://${tmp}` }); await sleep(2500);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(out, Buffer.from(data, "base64")); console.log(out);
} catch (e) { console.error("sheet failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

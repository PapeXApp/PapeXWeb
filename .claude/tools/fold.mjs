// Drive business section 02 (FoldReceipt) through every beat and shoot each
// one. One tap runs the whole sequence, so unlike the drag-crumple this
// replaces there is no gesture to synthesise — what needs proving is that the
// beats actually READ: that each of the five folds puts a different silhouette
// on screen rather than snapping straight to a dart, and that the paper hands
// over to the plane before it flies.
//   node .claude/tools/fold.mjs <url> <outPrefix> [w=1440] [h=900]
// Burst frames are shot on a fixed interval through the fold run; sheet.mjs
// them afterwards to read the whole animation in one image.
import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";
const [url, prefix, W = "1440", H = "900"] = process.argv.slice(2);
if (!url || !prefix) { console.error("usage: node fold.mjs <url> <outPrefix> [w] [h]"); process.exit(1); }
const port = 9400 + Math.floor(Math.random() * 150);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${port}`, "--hide-scrollbars", "--no-first-run",
  `--user-data-dir=/tmp/fold-${port}`, `--window-size=${W},${H}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
async function shot(name) {
  const r = await ev(`(()=>{const b=document.querySelector('[class*="frStage"]').getBoundingClientRect();return {x:Math.max(0,b.left-10),y:b.top+scrollY-10,w:b.width+20,h:b.height+20}})()`);
  const { data } = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${prefix}-${name}.png`, Buffer.from(data, "base64"));
}
/**
 * The fold silhouette is an inline clip-path, so each beat is readable from the
 * DOM — but a screenshot costs more than a beat lasts, so sampling from here
 * misses folds that really happened. The recorder runs page-side at frame rate
 * and is read back once at the end; the screenshots are just pictures.
 */
const RECORDER = `(()=>{const w=window;w.__fold={seen:[],plane:false};
  const tick=()=>{const p=document.querySelector('[class*="frFold"]');
    const c=p?.style.clipPath||"";
    if(c&&w.__fold.seen[w.__fold.seen.length-1]!==c) w.__fold.seen.push(c);
    if(document.querySelector('[class*="frPlane"]')) w.__fold.plane=true;
    requestAnimationFrame(tick);};
  requestAnimationFrame(tick);})()`;
const paperNow = () => ev(`document.querySelector('[class*="frPaper"]')?"present":"GONE"`);
try {
  let t; for (let i = 0; i < 40 && !t; i++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
  ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } };
  await send("Page.enable"); await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 768 });
  await send("Page.navigate", { url }); await sleep(4500);
  const top = await ev(`document.querySelector('[class*="frStage"]').getBoundingClientRect().top+scrollY`);
  for (let y = 0; y < top - 200; y += 400) { await ev(`window.scrollTo(0,${y})`); await sleep(110); }
  await ev(`document.querySelector('[class*="frStage"]').scrollIntoView({block:'center'})`);
  await sleep(1300); await shot("01-printing");
  for (let i = 0; i < 40; i++) { await sleep(200); if (await ev(`!document.querySelector('[class*="frStage"]').querySelector("button").disabled`)) break; }
  await sleep(300); await shot("02-ready");

  // one tap, then burst the whole run: 5 folds (260ms each) + the plane (320ms)
  // + the flight (980ms) is ~2.9s; frames are shot as fast as a clip allows.
  await ev(RECORDER);
  await ev(`document.querySelector('[class*="frStage"]').querySelector("button").click()`);
  for (let i = 0; i < 18; i++) {
    await sleep(60);
    await shot(`03-run-${String(i).padStart(2, "0")}`);
  }
  await sleep(700); await shot("04-done");

  // the three things a still cannot show
  const silhouettes = await ev(`window.__fold.seen.length`);
  const sawPlane = await ev(`window.__fold.plane`);
  const paper = await paperNow();
  console.log(`silhouettes=${silhouettes} (expect 5: four creases + the fold in half)`);
  console.log(`plane=${sawPlane ? "seen" : "NEVER SEEN"} (expect seen: the paper must become the mark before it flies)`);
  console.log(`paper=${paper} (expect GONE)`);
  const bad = [];
  if (silhouettes < 5) bad.push(`only ${silhouettes} distinct fold silhouettes — beats are being skipped or coalesced`);
  if (!sawPlane) bad.push("the plane never rendered — it flew as folded paper");
  if (paper !== "GONE") bad.push("the paper is still on stage after the flight");
  if (bad.length) { console.error("FAIL:\n  " + bad.join("\n  ")); process.exitCode = 1; }
  else console.log("OK");
} catch (e) { console.error("fold failed:", e.message); process.exitCode = 1; }
finally { try { ws?.close(); } catch {} chrome.kill("SIGKILL"); }

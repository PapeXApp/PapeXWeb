import { spawn } from "node:child_process";
const port = 9960 + Math.floor(Math.random() * 30);
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--no-first-run", `--user-data-dir=/tmp/gap-${port}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pend = new Map();
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
let t; for (let k = 0; k < 40 && !t; k++) { await sleep(250); try { t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:3001/customers" }); await sleep(3500);
const expr = `(()=>{const secs=[...document.querySelectorAll('[data-ground]')].filter(e=>e.tagName==='SECTION'||e.getAttribute('data-index'));
const out=[];const all=[...document.querySelectorAll('section')];
for(let i=0;i<all.length-1;i++){const a=all[i],b=all[i+1];
 const lastContent=[...a.querySelectorAll('h1,h2,h3,p,img,svg,button,[class*=featShot],[class*=quiz]')].filter(e=>e.getBoundingClientRect().height>0).reduce((m,e)=>Math.max(m,e.getBoundingClientRect().bottom+scrollY),0);
 const firstContent=[...b.querySelectorAll('h1,h2,h3,p,[class*=label],[class*=Label]')].filter(e=>e.getBoundingClientRect().height>0).reduce((m,e)=>Math.min(m,e.getBoundingClientRect().top+scrollY),1e9);
 out.push({from:(a.innerText||'').slice(0,18).replace(/\\n/g,' '),to:(b.innerText||'').slice(0,18).replace(/\\n/g,' '),gap:Math.round(firstContent-lastContent),aPadB:getComputedStyle(a).paddingBottom,bPadT:getComputedStyle(b).paddingTop});}
return out})()`;
const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true });
console.log(JSON.stringify(r.result.value, null, 1));
ws.close(); chrome.kill("SIGKILL");

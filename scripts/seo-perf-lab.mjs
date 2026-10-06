// LAB measurements (not field data) in headless Chrome with Lighthouse-like mobile throttling.
// Reports FCP, LCP, CLS, long-task blocking time, request counts, JS/image/total bytes, heavy images and failed requests.
// Field Core Web Vitals (CrUX / Search Console) can only come from real visitors after launch.
//   node node_modules/next/dist/bin/next start -p 3401 ; node scripts/seo-perf-lab.mjs   -> artifacts/seo/perf-lab.json
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const base=process.env.TEST_BASE_URL||'http://localhost:3401';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',port=9351;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-perf-'))}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();const listeners=[];
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}else listeners.forEach(l=>l(m))});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>(await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr})).result.value;
await send('Page.enable');await send('Network.enable');await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride',{width:412,height:823,deviceScaleFactor:2,mobile:true});
await send('Emulation.setCPUThrottlingRate',{rate:4});
await send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1024*1024/8,uploadThroughput:750*1024/8});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__m={lcp:0,cls:0,fcp:0,tbt:0,lcpEl:''};
 new PerformanceObserver(l=>{for(const e of l.getEntries()){window.__m.lcp=e.startTime;window.__m.lcpEl=(e.element&&(e.element.tagName+'.'+String(e.element.className).slice(0,40)))||''}}).observe({type:'largest-contentful-paint',buffered:true});
 new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__m.cls+=e.value}).observe({type:'layout-shift',buffered:true});
 new PerformanceObserver(l=>{for(const e of l.getEntries())if(e.name==='first-contentful-paint')window.__m.fcp=e.startTime}).observe({type:'paint',buffered:true});
 new PerformanceObserver(l=>{for(const e of l.getEntries())window.__m.tbt+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});`});
const pages=['/en','/ar','/en/programmes/canada-express-entry','/ar/programmes/canada-express-entry','/en/consultation','/en/contact'];
const out=[];
for(const path of pages){
 const reqs=new Map();const failed=[];
 const l=m=>{
  if(m.method==='Network.responseReceived')reqs.set(m.params.requestId,{url:m.params.response.url,status:m.params.response.status,type:m.params.type,mime:m.params.response.mimeType});
  if(m.method==='Network.loadingFinished'&&reqs.has(m.params.requestId))reqs.get(m.params.requestId).bytes=m.params.encodedDataLength;
  if(m.method==='Network.loadingFailed')failed.push(m.params.errorText);
 };
 listeners.push(l);
 await send('Network.clearBrowserCache');await send('Page.navigate',{url:base+path});
 await sleep(9000); // lets the splash, hero and deferred work settle under throttling
 const m=await ev('window.__m');
 const list=[...reqs.values()];const sum=f=>list.filter(f).reduce((a,r)=>a+(r.bytes||0),0);
 out.push({path,fcpMs:Math.round(m.fcp),lcpMs:Math.round(m.lcp),lcpElement:m.lcpEl,cls:+m.cls.toFixed(3),longTaskBlockingMs:Math.round(m.tbt),requests:list.length,totalKB:Math.round(sum(()=>true)/1024),jsKB:Math.round(sum(r=>r.type==='Script')/1024),imageKB:Math.round(sum(r=>r.type==='Image')/1024),cssKB:Math.round(sum(r=>r.type==='Stylesheet')/1024),fontKB:Math.round(sum(r=>r.type==='Font')/1024),
  heavyImages:list.filter(r=>r.type==='Image'&&r.bytes>150*1024).map(r=>({url:r.url.replace(base,''),KB:Math.round(r.bytes/1024)})),brokenRequests:list.filter(r=>r.status>=400).map(r=>({url:r.url.replace(base,''),status:r.status})),failedRequests:failed.length});
 listeners.splice(listeners.indexOf(l),1);
}
socket.close();chrome.kill();
mkdirSync('artifacts/seo',{recursive:true});writeFileSync('artifacts/seo/perf-lab.json',JSON.stringify({note:'Lab data: headless Chrome, 412x823 @2x, CPU 4x slowdown, 1.6 Mbps / 150 ms RTT, cold cache, local production build over loopback. Not field data.',results:out},null,1));
console.table(out.map(({heavyImages,brokenRequests,...r})=>r));
for(const r of out){if(r.heavyImages.length)console.log(r.path,'heavy images',JSON.stringify(r.heavyImages));if(r.brokenRequests.length)console.log(r.path,'BROKEN',JSON.stringify(r.brokenRequests))}

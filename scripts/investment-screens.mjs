// Screenshots representative investment pages (desktop + mobile, EN + AR) and the open navigation into artifacts/investment-programmes/.
// Usage: TEST_BASE_URL=http://localhost:3000 node scripts/investment-screens.mjs   (CHROME_PATH optional)
import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=9334,out='artifacts/investment-programmes';mkdirSync(out,{recursive:true});
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,'--no-first-run','--disable-gpu','--hide-scrollbars','--user-data-dir='+process.env.TEMP+'/inv-shots','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<40;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,300))}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const q=pending.get(m.id);pending.delete(m.id);m.error?q.reject(new Error(m.error.message)):q.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const c=++id;pending.set(c,{resolve,reject});socket.send(JSON.stringify({id:c,method,params}))});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async expression=>(await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression})).result.value;
await send('Page.enable');
// Skip the splash screen and the timed popup so screenshots show the page itself.
await send('Page.addScriptToEvaluateOnNewDocument',{source:"try{sessionStorage.setItem('plan-b-assessment-popup-v3','1')}catch{}"});
const report=[];
async function shot(name,url,width,{full=true,before}={}){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width<800?844:900,deviceScaleFactor:1,mobile:width<800});
 await send('Page.navigate',{url:base+url});await wait(1800);
 await evaluate("document.querySelectorAll('[class*=splash]').forEach(e=>e.remove());document.querySelectorAll('[role=dialog]').forEach(e=>e.closest('[class*=popup],[class*=ap-]')?.remove())");
 if(before)await evaluate(before);await wait(500);
 const info=await evaluate(`({scroll:document.documentElement.scrollWidth,w:innerWidth,h:document.documentElement.scrollHeight})`);
 const clip=full?{x:0,y:0,width,height:Math.min(info.h,16000),scale:1}:undefined;
 const {data}=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:full,...(clip?{clip}:{})});
 writeFileSync(`${out}/${name}.png`,Buffer.from(data,'base64'));report.push({name,url,width,...info,overflow:info.scroll>info.w});
}
await shot('overview-citizenship-en-1440','/en/services/citizenship-by-investment',1440);
await shot('overview-residency-ar-390','/ar/services/residency-by-investment',390);
await shot('antigua-en-1440','/en/services/citizenship-by-investment/antigua-and-barbuda',1440);
await shot('antigua-ar-390','/ar/services/citizenship-by-investment/antigua-and-barbuda',390);
await shot('uae-multiple-amounts-en-390','/en/services/residency-by-investment/uae',390);
await shot('uae-multiple-amounts-ar-1440','/ar/services/residency-by-investment/uae',1440);
await shot('italy-long-requirements-ar-390','/ar/services/residency-by-investment/italy',390);
await shot('switzerland-en-1440','/en/services/residency-by-investment/switzerland',1440);
await shot('portugal-image-hero-en-1440','/en/services/residency-by-investment/portugal',1440,{full:false});
await shot('dominica-unlisted-amount-en-390','/en/services/citizenship-by-investment/dominica',390);
// Navigation: open the Business Immigration dropdown at the narrowest desktop width, and the mobile menu.
await shot('nav-investment-en-1440','/en/services/citizenship-by-investment/grenada',1440,{full:false,before:"[...document.querySelectorAll('.nav-button')].find(b=>/Business Immigration/.test(b.textContent)).click()"});
await shot('nav-investment-ar-1440','/ar/services/residency-by-investment/cyprus',1440,{full:false,before:"[...document.querySelectorAll('.nav-button')].find(b=>/هجرة الأعمال/.test(b.textContent)).click()"});
// Anchor offset: jump to #at-a-glance and confirm the heading sits below the sticky header and section nav.
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:base+'/en/services/residency-by-investment/malta'});await wait(1800);
const anchor=await evaluate("document.querySelector('a[href=\"#at-a-glance\"]').click();new Promise(r=>setTimeout(()=>{const h=document.getElementById('glance-h').getBoundingClientRect().top;const mast=document.querySelector('.final-masthead').getBoundingClientRect().bottom;const sub=document.querySelector('.programme-subnav').getBoundingClientRect().bottom;r({headingTop:Math.round(h),mastheadBottom:Math.round(mast),subnavBottom:Math.round(sub),clear:h>=Math.max(mast,sub)})},1500))");
report.push({name:'anchor-offset-malta',...anchor});
// Desktop nav: does the top bar fit at 1440px (the desktop-nav breakpoint) without wrapping or overflowing?
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
for(const l of ['en','ar']){await send('Page.navigate',{url:base+'/'+l});await wait(1500);
 report.push({name:'topbar-fit-'+l,...await evaluate("(()=>{const n=document.querySelector('.final-desktop-nav');const items=[...n.children].map(e=>e.getBoundingClientRect());const tops=new Set(items.map(r=>Math.round(r.top)));return {navScroll:n.scrollWidth,navWidth:n.clientWidth,rows:tops.size,pageScroll:document.documentElement.scrollWidth}})()")})}
writeFileSync(`${out}/screens.json`,JSON.stringify(report,null,1));console.log(JSON.stringify(report.filter(r=>r.overflow||r.name.startsWith('anchor')||r.name.startsWith('topbar')),null,1));
socket.close();chrome.kill();

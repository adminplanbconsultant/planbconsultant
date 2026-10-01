import {mkdirSync,writeFileSync} from 'node:fs';
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const out='artifacts/splash-animation';mkdirSync(out,{recursive:true});const results=[];
for(const locale of ['en','ar'])for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`http://localhost:3000/${locale}`});
 for(let i=0;i<40;i++){if(await evaluate("!!document.querySelector('.splash-emblem')?.naturalWidth"))break;await pause(50)}
 await pause(650);
 const data=await evaluate("(()=>{const img=document.querySelector('.splash-emblem'),ring=document.querySelector('.splash-orbit');return {loaded:!!img?.naturalWidth,ringAnimation:ring?getComputedStyle(ring).animationName:null,overflow:document.documentElement.scrollWidth>innerWidth}})()");
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${locale}-${width}.png`,Buffer.from(shot.data,'base64'));
 await pause(2100);results.push({locale,width,...data,dismissed:await evaluate("!document.querySelector('.brand-splash')")});
}
await send('Emulation.setDeviceMetricsOverride',{width:390,height:720,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:'http://localhost:3000/en'});
for(let i=0;i<40;i++){if(await evaluate("!!document.querySelector('.splash-emblem')?.naturalWidth"))break;await pause(40)}
for(let i=0;i<11;i++){const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/frame-${String(i).padStart(2,'0')}.png`,Buffer.from(shot.data,'base64'));await pause(120)}
await pause(1200);
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await send('Page.reload');await pause(300);
const reduced=await evaluate("(()=>{const ring=document.querySelector('.splash-orbit');return {visible:!!ring,animation:ring?getComputedStyle(ring).animationName:null}})()");
await pause(1000);reduced.dismissed=await evaluate("!document.querySelector('.brand-splash')");
await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.clearDeviceMetricsOverride');
await send('Page.navigate',{url:'http://localhost:3000/en'});socket.close();
writeFileSync(`${out}/results.json`,JSON.stringify({results,reduced},null,2));console.log(JSON.stringify({results,reduced},null,2));
if(results.some(r=>!r.loaded||!r.dismissed||r.overflow||r.ringAnimation!=='splash-orbit-turn')||reduced.animation!=='none'||!reduced.dismissed)process.exitCode=1;

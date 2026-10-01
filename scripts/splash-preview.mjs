import {mkdirSync,writeFileSync} from 'node:fs';
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
const injection=await send('Page.addScriptToEvaluateOnNewDocument',{source:"sessionStorage.removeItem('plan-b-intro-seen-v3');sessionStorage.setItem('plan-b-assessment-offered-v2','1')"});
const out='artifacts/splash-update';mkdirSync(out,{recursive:true});const results=[];
for(const locale of ['en','ar'])for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`http://localhost:3110/${locale}`});
 for(let attempt=0;attempt<30;attempt++){if(await evaluate("!!document.querySelector('.splash-logo')?.complete && !!document.querySelector('.splash-logo')?.naturalWidth"))break;await new Promise(r=>setTimeout(r,50))}
 await new Promise(r=>setTimeout(r,550));
 const data=await evaluate("(()=>{const el=document.querySelector('.splash-logo');if(!el)return null;const r=el.getBoundingClientRect();return {width:r.width,height:r.height,src:el.getAttribute('src'),background:getComputedStyle(el).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth}})()");
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${locale}-${width}.png`,Buffer.from(shot.data,'base64'));
 await new Promise(r=>setTimeout(r,1700));
 const dismissed=await evaluate("!document.querySelector('.brand-splash')");results.push({locale,width,visible:!!data,dismissed,...data});
}
await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injection.identifier});
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await evaluate("sessionStorage.removeItem('plan-b-intro-seen-v3')");await send('Page.reload');await new Promise(r=>setTimeout(r,250));
const reduced=await evaluate("(()=>{const el=document.querySelector('.brand-splash');return {visible:!!el&&getComputedStyle(el).display==='grid',animation:el?getComputedStyle(el).animationName:null}})()");
await new Promise(r=>setTimeout(r,1000));reduced.dismissed=await evaluate("!document.querySelector('.brand-splash')");
await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.clearDeviceMetricsOverride');
await evaluate("sessionStorage.removeItem('plan-b-intro-seen-v3')");
writeFileSync(`${out}/results.json`,JSON.stringify({results,reduced},null,2));socket.close();
console.log(JSON.stringify({results,reduced},null,2));if(results.some(r=>!r.visible||!r.dismissed||r.overflow)||!reduced.visible||!reduced.dismissed)process.exitCode=1;

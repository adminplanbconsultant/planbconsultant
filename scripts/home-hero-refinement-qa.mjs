import {mkdirSync,writeFileSync} from 'node:fs';
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
await send('Page.enable');await send('Emulation.setFocusEmulationEnabled',{enabled:true});
await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Emulation.setEmulatedMedia',{features:[]});
const out='artifacts/hero-refinement';mkdirSync(out,{recursive:true});const results=[];
for(const locale of ['en','ar'])for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`http://localhost:3000/${locale}`});await pause(2900);
 const data=await evaluate(`(()=>{const media=document.querySelector('.home-hero-media'),dots=[...document.querySelectorAll('.home-hero-selectors button')],play=document.querySelector('.home-hero-play'),arch=document.querySelector('.home-hero-arch');const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};const m=rect(arch),d=dots.map(rect),p=rect(play);return {locale:document.documentElement.lang,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,bottomRadius:getComputedStyle(arch).borderBottomLeftRadius,fonts:['.home-hero .eyebrow','.home-hero-guidance','.home-hero-services'].map(s=>getComputedStyle(document.querySelector(s)).fontSize),hiddenPause:getComputedStyle(play).clipPath==='inset(50%)'&&p.width===1&&p.height===1,dotCount:d.length,centred:Math.abs((d[0].x+d[0].width/2+d[2].x+d[2].width/2)/2-(m.x+m.width/2))<1,evenlySpaced:Math.abs((d[1].x-d[0].x)-(d[2].x-d[1].x))<1,geometry:JSON.stringify(document.querySelector('.home-hero').getBoundingClientRect())}})()`);
 if(width<600){const bottom=await evaluate("document.querySelector('.home-hero').getBoundingClientRect().bottom");await send('Emulation.setDeviceMetricsOverride',{width,height:Math.ceil(bottom+100),deviceScaleFactor:1,mobile:true});await pause(100)}
 let shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${locale}-${width}.png`,Buffer.from(shot.data,'base64'));
 const beforeFocus=await evaluate("JSON.stringify(document.querySelector('.home-hero').getBoundingClientRect())");
 await evaluate("document.querySelector('.home-hero-play').focus()");await pause(100);
 data.focusVisible=await evaluate("getComputedStyle(document.querySelector('.home-hero-play')).clipPath==='none'&&document.querySelector('.home-hero-play').getBoundingClientRect().width>80");
 data.noFocusShift=beforeFocus===await evaluate("JSON.stringify(document.querySelector('.home-hero').getBoundingClientRect())");
 shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/focus-${locale}-${width}.png`,Buffer.from(shot.data,'base64'));results.push(data);
}
await send('Emulation.clearDeviceMetricsOverride');await send('Emulation.setFocusEmulationEnabled',{enabled:false});socket.close();
writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.overflow||!r.hiddenPause||!r.centred||!r.evenlySpaced||!r.focusVisible||!r.noFocusShift||r.bottomRadius!=='14px'||r.fonts.some(f=>parseFloat(f)<12)))process.exitCode=1;

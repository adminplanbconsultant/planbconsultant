import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.env.LOGO_PHASE||'before',site=process.env.TEST_BASE_URL||'http://localhost:3108';
const out='artifacts/header-logo';mkdirSync(out,{recursive:true});
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
await send('Page.enable');await send('Page.addScriptToEvaluateOnNewDocument',{source:"sessionStorage.setItem('plan-b-intro-seen-v2','1');sessionStorage.setItem('plan-b-assessment-offered-v2','1')"});
const results=[];
for(const locale of ['en','ar'])for(const width of [320,390,1200,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}`});await new Promise(r=>setTimeout(r,900));
 await evaluate(`(async()=>{await Promise.race([Promise.all([document.fonts.ready,document.querySelector('.header-brand img')?.decode().catch(()=>{})]),new Promise(r=>setTimeout(r,3000))]);await new Promise(r=>setTimeout(r,200))})()`);
 const data=await evaluate(`(()=>{const brand=document.querySelector('.header-brand'),mark=brand.querySelector('img,svg'),nav=document.querySelector('.final-desktop-nav'),cta=document.querySelector('.header-cta');const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};const style=getComputedStyle(mark),b=rect(brand),m=rect(mark),n=rect(nav),c=rect(cta),header=rect(document.querySelector('.header'));return {locale:document.documentElement.lang,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,brand:b,logo:m,header,nav:n,cta:c,overlap:n.width>0&&(document.documentElement.dir==='rtl'?n.right>b.x:b.right>n.x),clippedCTA:c.width>0&&(c.x<0||c.right>innerWidth),style:{background:style.backgroundColor,border:style.borderWidth,shadow:style.boxShadow,blend:style.mixBlendMode,fit:style.objectFit},src:mark.getAttribute('src'),loaded:mark.tagName==='IMG'?mark.complete&&mark.naturalWidth>0:true}})()`);
 results.push(data);
 if([390,1440].includes(width)){
  const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:Math.ceil(data.header.bottom+15),scale:2}});writeFileSync(`${out}/${phase}-${locale}-${width}.png`,Buffer.from(shot.data,'base64'));
  const r=data.brand;const close=await send('Page.captureScreenshot',{format:'png',clip:{x:Math.max(0,r.x-8),y:Math.max(0,r.y-8),width:Math.min(width-r.x+8,r.width+16),height:r.height+16,scale:3}});writeFileSync(`${out}/${phase}-${locale}-${width}-closeup.png`,Buffer.from(close.data,'base64'));
 }
}
writeFileSync(`${out}/${phase}-results.json`,JSON.stringify(results,null,2));socket.close();console.log(JSON.stringify({phase,cases:results.length,failures:results.filter(r=>r.overflow||r.overlap||r.clippedCTA||!r.loaded)},null,2));
if(results.some(r=>r.overflow||r.overlap||r.clippedCTA||!r.loaded))process.exitCode=1;

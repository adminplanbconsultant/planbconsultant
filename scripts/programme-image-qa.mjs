import {writeFileSync} from 'node:fs';
const site=process.env.TEST_BASE_URL||'http://localhost:3108',port=process.env.CHROME_DEBUG_PORT||9228;
const target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const wait=ms=>new Promise(r=>setTimeout(r,ms));await send('Page.enable');const results=[];
for(const slug of ['canada-c11','usa-eb5','usa-e2'])for(const locale of ['en','ar'])for(const width of [390,1440]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}/programmes/${slug}`});await wait(700);
 await evaluate("document.documentElement.style.scrollBehavior='auto';document.querySelector('.programme-story').scrollIntoView();for(const i of document.querySelectorAll('.programme-story img,.programme-benefits img'))i.loading='eager'");await wait(300);
 const checks=await evaluate(`[...document.querySelectorAll('.programme-story-media,.programme-benefit-image')].map(f=>{const c=f.querySelector('figcaption'),i=f.querySelector('img'),cr=c.getBoundingClientRect(),fr=f.getBoundingClientRect();return {text:c.textContent,captionInside:cr.top>=fr.top&&cr.bottom<=fr.bottom+1,imageHeight:i.getBoundingClientRect().height,loaded:i.complete&&i.naturalWidth>0}})`);
 results.push({slug,locale,width,checks});
 if(slug==='usa-eb5'){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`artifacts/content-completion/image-disclosure-${locale}-${width}.png`,Buffer.from(shot.data,'base64'))}
}
const passed=results.every(r=>r.checks.length===2&&r.checks.every(c=>c.captionInside&&c.loaded&&c.imageHeight>150&&c.text.length>20));
writeFileSync('artifacts/content-completion/image-results.json',JSON.stringify({passed,results},null,2));console.log(JSON.stringify({passed,cases:results.length}));socket.close();if(!passed)process.exitCode=1;

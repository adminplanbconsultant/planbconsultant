import {mkdirSync,writeFileSync} from 'node:fs';
const phase=process.env.HERO_PHASE||'before',site=process.env.TEST_BASE_URL||'http://localhost:3000';
const out='artifacts/home-hero';mkdirSync(out,{recursive:true});
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
await send('Emulation.setEmulatedMedia',{features:[]});
await send('Page.addScriptToEvaluateOnNewDocument',{source:"sessionStorage.setItem('plan-b-assessment-offered-v2','1')"});
const results=[];
for(const locale of ['en','ar'])for(const width of [360,390,768,1024,1280,1440,1920]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}`});await pause(2900);
 const data=await evaluate(`(()=>{const hero=document.querySelector('.home-hero,.hero'),h=hero.querySelector('h1'),rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};return {locale:document.documentElement.lang,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,hero:rect(hero),headline:rect(h),font:getComputedStyle(h).fontSize,headerBottom:document.querySelector('.header').getBoundingClientRect().bottom,forms:hero.querySelectorAll('form').length,links:[...hero.querySelectorAll('a')].map(a=>({text:a.innerText,href:a.getAttribute('href'),...rect(a)})),images:[...hero.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),clipped:[...hero.querySelectorAll('h1,p,a,button,img')].filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.x< -1}).map(e=>e.className)}})()`);
 results.push(data);
 if(phase==='after'||[390,1440].includes(width)){
  // Capture the complete mobile hero without the viewport-fixed contact bar
  // cutting across the long-page preview. Layout checks above use 900px height.
  if(width<600){await send('Emulation.setDeviceMetricsOverride',{width,height:Math.ceil(data.hero.bottom+100),deviceScaleFactor:1,mobile:true});await pause(100)}
  const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:Math.ceil(data.hero.bottom+20),scale:1}});
  writeFileSync(`${out}/${phase}-${locale}-${width}.png`,Buffer.from(shot.data,'base64'));
 }
}
writeFileSync(`${out}/${phase}-results.json`,JSON.stringify(results,null,2));socket.close();
const failures=results.filter(r=>r.overflow||r.forms||r.clipped.length||r.images.some(i=>!i.loaded)||r.hero.y<r.headerBottom-1);
console.log(JSON.stringify({phase,cases:results.length,failures},null,2));if(failures.length)process.exitCode=1;

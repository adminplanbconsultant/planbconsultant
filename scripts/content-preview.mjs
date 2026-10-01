import {mkdirSync,writeFileSync} from 'node:fs';
const port=process.env.CHROME_DEBUG_PORT||9228,site=process.env.TEST_BASE_URL||'http://localhost:3000';
const output='artifacts/content-completion';mkdirSync(output,{recursive:true});
const targets=await(await fetch(`http://127.0.0.1:${port}/json`)).json();const target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));await send('Page.enable');await send('Runtime.enable');
const injected=await send('Page.addScriptToEvaluateOnNewDocument',{source:"sessionStorage.setItem('plan-b-intro-seen-v2','1');sessionStorage.setItem('plan-b-assessment-offered-v2','1')"});
const pages=['','about','services/skilled-immigration','services/work-visas','services/business-immigration','services/residency-by-investment','services/citizenship-by-investment','services/study-abroad','services/visit-visas','contact','programmes/usa-eb5'];
const previewPages=['','about','services/business-immigration'];const results=[],links=new Set();
for(const locale of ['en','ar'])for(const page of pages)for(const width of [390,1440]){
 const name=`${page.replaceAll('/','-')||'home'}-${locale}-${width}`;
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}/${page}`});
 for(let i=0;i<60;i++){await wait(150);if(await evaluate(`location.pathname===${JSON.stringify('/'+locale+(page?'/'+page:'/'))}&&!!document.querySelector('footer')&&document.readyState==='complete'`))break;}
 await wait(400);
 await evaluate(`(async()=>{document.documentElement.style.scrollBehavior='auto';for(const img of document.images)img.loading='eager';await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(r=>{img.onload=r;img.onerror=r;setTimeout(r,5000)})));await document.fonts.ready;scrollTo(0,0)})()`);
 const data=await evaluate(`(()=>{const footer=document.querySelector('footer'),header=document.querySelector('.final-masthead');const links=[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h.startsWith('/'));return {path:location.pathname,title:document.title,dir:document.documentElement.dir,h1:document.querySelector('h1')?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,alt:i.alt})),heroForm:!!document.querySelector('.hero form'),footer:{background:getComputedStyle(footer).backgroundColor,logoClip:getComputedStyle(footer.querySelector('.brand-mark')).clipPath,columns:[...footer.querySelectorAll('.footer-main>div')].map(e=>e.textContent.trim().length),credit:footer.textContent.includes('Ticode Technologies')},headerSticky:getComputedStyle(header).position==='sticky',links}})()`);
 data.links.forEach(h=>links.add(h.split('#')[0]));delete data.links;results.push({name,width,...data});
 if(previewPages.includes(page)){
  const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:await evaluate('document.documentElement.scrollHeight'),scale:1}});writeFileSync(`${output}/${name}.png`,Buffer.from(shot.data,'base64'));
  if(!page){await evaluate("document.querySelector('footer').scrollIntoView()");await wait(100);const footer=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`${output}/footer-${locale}-${width}.png`,Buffer.from(footer.data,'base64'))}
 }
 console.log(name,data.overflow?'OVERFLOW':'ok');
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
const reduced=[];
for(const locale of ['en','ar']){await send('Emulation.setDeviceMetricsOverride',{width:320,height:800,deviceScaleFactor:1,mobile:true});await send('Page.navigate',{url:`${site}/${locale}`});await wait(1300);reduced.push(await evaluate(`({locale:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth,animation:getComputedStyle(document.querySelector('.ticker-track')).animationName,visibleCountries:[...document.querySelector('.ticker-group').children].every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth})})`))}
await send('Emulation.setEmulatedMedia',{features:[]});await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:injected.identifier});
const linkResults=[];for(const link of links){const r=await fetch(site+link);linkResults.push({link,status:r.status})}
const failures=results.filter(r=>r.overflow||r.heroForm||!r.h1||!r.headerSticky||!r.footer.credit||r.footer.columns.some(n=>!n)||r.images.some(i=>!i.loaded));
const broken=linkResults.filter(r=>r.status!==200);writeFileSync(`${output}/qa-results.json`,JSON.stringify({results,reduced,linkResults,failures:failures.map(r=>r.name),broken},null,2));
console.log(JSON.stringify({cases:results.length,links:linkResults.length,failures:failures.map(r=>r.name),broken,reduced}));socket.close();
if(failures.length||broken.length||reduced.some(r=>r.overflow||r.animation!=='none'||!r.visibleCountries))process.exitCode=1;

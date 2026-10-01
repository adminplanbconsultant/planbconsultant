import {mkdirSync,writeFileSync} from 'node:fs';
const target=(await(await fetch('http://127.0.0.1:9228/json')).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id)}});
const send=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);socket.send(JSON.stringify({id:n,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const pause=ms=>new Promise(r=>setTimeout(r,ms));const results=[];
const active=()=>evaluate("document.querySelector('.home-hero-slide.is-active')?.querySelector('figcaption').innerText");
await send('Page.enable');await send('Emulation.setEmulatedMedia',{features:[]});await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.addScriptToEvaluateOnNewDocument',{source:"window.heroLayoutShifts=[];new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.heroLayoutShifts.push(entry.value)}).observe({type:'layout-shift',buffered:true})"});
await send('Page.navigate',{url:'http://localhost:3000/en'});await pause(3000);
const initial=await active();const geometry=await evaluate("JSON.stringify(document.querySelector('.home-hero h1').getBoundingClientRect())");
await evaluate("document.querySelector('.home-hero-selectors button').focus()");await pause(7300);
results.push({check:'Focus pauses autoplay',pass:await active()===initial});
await evaluate("document.querySelector('.home-hero-play').click();document.activeElement.blur()");await pause(7300);
results.push({check:'Pause control stops autoplay',pass:await active()===initial});
for(const index of [1,2]){
 await evaluate(`document.querySelectorAll('.home-hero-selectors button')[${index}].click()`);await pause(850);
 const shot=await send('Page.captureScreenshot',{format:'png'});mkdirSync('artifacts/home-hero',{recursive:true});writeFileSync(`artifacts/home-hero/slide-${index}.png`,Buffer.from(shot.data,'base64'));
 results.push({check:'Manual slide '+index,pass:(await active()).startsWith(index===1?'Sydney':'Berlin')});
}
results.push({check:'Headline remains stationary',pass:await evaluate("JSON.stringify(document.querySelector('.home-hero h1').getBoundingClientRect())")===geometry});
await evaluate("document.querySelector('.home-hero-play').click();document.activeElement.blur()");await pause(7300);
results.push({check:'Play resumes seven-second rotation',pass:await active()===initial});
const extra=await send('Target.createTarget',{url:'about:blank'});await send('Target.activateTarget',{targetId:extra.targetId});await pause(200);
const hidden=await evaluate('document.hidden'),beforeHidden=await active();await pause(7300);
results.push({check:'Hidden tab pauses rotation',pass:hidden&&await active()===beforeHidden});
await send('Target.closeTarget',{targetId:extra.targetId});await send('Target.activateTarget',{targetId:target.id});
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.navigate',{url:'http://localhost:3000/ar'});await pause(1500);
const reducedInitial=await active();await pause(7300);
results.push({check:'Reduced motion disables autoplay and transitions',pass:await active()===reducedInitial&&await evaluate("document.querySelector('.home-hero-play').disabled&&getComputedStyle(document.querySelector('.home-hero-slide')).transitionDuration==='0s'")});
await evaluate("document.querySelectorAll('.home-hero-selectors button')[1].click()");results.push({check:'Reduced motion preserves manual selection',pass:(await active()).includes('سيدني')});
for(const locale of ['en','ar']){
 await send('Page.navigate',{url:`http://localhost:3000/${locale}/consultation`});await pause(1300);
 results.push({check:locale+' primary CTA opens full assessment',pass:await evaluate("!!document.querySelector('form.enquiry-form')&&!!document.querySelector('.assessment-buttons')")});
}
await send('Emulation.setEmulatedMedia',{features:[]});await send('Page.navigate',{url:'http://localhost:3000/en'});await pause(3000);
results.push({check:'No unexpected layout shift',pass:await evaluate('window.heroLayoutShifts.reduce((a,b)=>a+b,0)<0.01')});
await evaluate("sessionStorage.removeItem('plan-b-assessment-offered-v2')");await send('Page.reload');await pause(3000);await evaluate('window.scrollTo(0,150)');await pause(200);
results.push({check:'Existing scroll assessment popup preserved',pass:await evaluate("!!document.querySelector('.assessment-dialog .quick-assessment')")});
await evaluate("document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");results.push({check:'Assessment Escape dismissal preserved',pass:await evaluate("!document.querySelector('.assessment-dialog')")});
await evaluate("window.scrollTo(0,0)");await send('Emulation.clearDeviceMetricsOverride');socket.close();
writeFileSync('artifacts/home-hero/interaction-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.pass))process.exitCode=1;

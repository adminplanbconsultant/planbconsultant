// Enquiry forms with JavaScript disabled and delayed: personal details must never enter the URL, nothing may be saved by a
// native submission, and the normal JavaScript flow must still save exactly one enquiry.
// Needs the mock stack:  node scripts/mock-enquiry-stack.mjs   (:3107 → MOCK Apps Script on :3301; no live Google services)
// Usage: node scripts/form-no-js-qa.mjs
import {spawn} from 'node:child_process';
const base=process.env.TEST_BASE_URL||'http://localhost:3107',sheet='http://127.0.0.1:3301';
const NAME='Nojs Tester',PHONE='+96550001234',EMAIL='nojs.tester@example.com';
const leaks=s=>/Nojs|Tester|50001234|nojs\.tester|example\.com|name=|phone=|email=/i.test(decodeURIComponent(String(s||'')));
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9338','--no-first-run','--disable-gpu','--user-data-dir='+process.env.TEMP+'/nojs-'+Date.now(),'about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<40;i++){try{targets=await (await fetch('http://127.0.0.1:9338/json')).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,300))}
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const urlsSeen=[];let holdScripts=false;const held=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const c=++id;pending.set(c,{resolve,reject});ws.send(JSON.stringify({id:c,method,params}))});
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const q=pending.get(m.id);pending.delete(m.id);m.error?q.reject(new Error(m.error.message)):q.resolve(m.result);return}
 if(m.method==='Page.frameNavigated'&&!m.params.frame.parentId)urlsSeen.push(m.params.frame.url+(m.params.frame.urlFragment||''));
 if(m.method==='Page.navigatedWithinDocument')urlsSeen.push(m.params.url);
 if(m.method==='Network.requestWillBeSent'&&m.params.type==='Document')urlsSeen.push(m.params.request.url);
 if(m.method==='Fetch.requestPaused'){if(holdScripts)held.push(m.params.requestId);else send('Fetch.continueRequest',{requestId:m.params.requestId})}
});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result?.value};
const rows=async()=>(await (await fetch(sheet+'/__state')).json());
const rowsWhen=async(pred,ms=15000)=>{let r;for(const end=Date.now()+ms;Date.now()<end;await wait(500)){r=await rows();if(pred(r))return r}return r};
const results=[];const check=(n,c,d='')=>{results.push(c);console.log((c?'ok  ':'FAIL')+'  '+n+(d?'  — '+d:''))};
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true}); // so held scripts cannot be served from cache
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.addScriptToEvaluateOnNewDocument',{source:"try{sessionStorage.setItem('plan-b-assessment-popup-v3','1')}catch{}"});
async function typeInto(selector,value){await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});el.focus();if(el.select)el.select();return !!el})()`);await send('Input.insertText',{text:value})}
/** The assessment inputs carry name attributes; the general enquiry inputs do not (so a native submission could not include them). */
const sel=(form,kind)=>({name:`${form} input[name=name], ${form} input[autocomplete=name]`,phone:`${form} input[name=phone], ${form} input[type=tel]`,email:`${form} input[name=email], ${form} input[type=email]`})[kind];
async function fill(form){await typeInto(sel(form,'name'),NAME);await typeInto(sel(form,'phone'),PHONE);await typeInto(sel(form,'email'),EMAIL)}
async function pressEnter(){for(const type of ['rawKeyDown','char','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:type==='char'?'\r':undefined});await wait(1500)}
async function clickSelector(selector){const r=await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return null;el.scrollIntoView({block:'center',behavior:'instant'});return true})()`);if(!r)return false;await wait(300);const p=await ev(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',clickCount:1});await wait(1500);return true}
const forms=[['assessment (step 1)','/en/consultation','form.assessment-form'],['general enquiry','/en/contact','form.general-enquiry-form'],['assessment AR','/ar/consultation','form.assessment-form']];

// ---------- 1. JavaScript disabled ----------
await send('Emulation.setScriptExecutionDisabled',{value:true});
for(const [label,path,form] of forms){
 const before=await rows();urlsSeen.length=0;
 await send('Page.navigate',{url:base+path});await wait(1800);
 check(`[no JS] ${label}: no-JavaScript notice visible`,await ev(`(()=>{const n=document.querySelector('${form}').innerHTML;return /noscript|needs JavaScript|يحتاج هذا النموذج/.test(n)})()`));
 await fill(form);
 await pressEnter();await clickSelector(`${form} button[type=submit]`);
 const href=await ev('location.href');
 check(`[no JS] ${label}: Enter + click do not navigate or put details in the URL`,!leaks(href)&&!urlsSeen.some(leaks),href);
 // Force a native submission (as an extension or a browser ignoring the disabled button might): must POST, not GET.
 urlsSeen.length=0;await ev(`document.querySelector('${form}').submit()`);await wait(2500);
 const after=await ev('location.href');
 check(`[no JS] ${label}: forced native submit lands on contact notice with a clean URL`,/\/contact#enquiry-needs-javascript$/.test(after)&&!urlsSeen.some(leaks),after+' | '+urlsSeen.join(' , '));
 check(`[no JS] ${label}: forced submit shows the "not sent" notice`,await ev(`getComputedStyle(document.getElementById('enquiry-needs-javascript')).display!=='none'`));
 const now=await rows();check(`[no JS] ${label}: nothing saved, no email`,now.full===before.full&&now.contact===before.contact&&now.emails===before.emails,JSON.stringify(now));
}
await send('Emulation.setScriptExecutionDisabled',{value:false});

// ---------- 2. JavaScript delayed (scripts held for several seconds) ----------
await send('Fetch.enable',{patterns:[{urlPattern:'*/_next/static/chunks/*',requestStage:'Request'}]});
for(const [label,path,form] of forms.slice(0,2)){
 const before=await rows();urlsSeen.length=0;holdScripts=true;held.length=0;
 await send('Page.navigate',{url:base+path});await wait(1500);
 const hydrated=await ev(`!!document.querySelector('${form} button[type=submit]')&&document.querySelector('${form} button[type=submit]').disabled`);
 check(`[JS delayed] ${label}: submit button disabled before scripts load`,hydrated===true);
 await fill(form);
 await pressEnter();await clickSelector(`${form} button[type=submit]`);await wait(1500);
 check(`[JS delayed] ${label}: Enter + click while loading do not navigate or leak`,!leaks(await ev('location.href'))&&!urlsSeen.some(leaks),await ev('location.href'));
 const mid=await rows();check(`[JS delayed] ${label}: nothing saved while loading`,mid.full===before.full&&mid.contact===before.contact);
 holdScripts=false;for(const r of held.splice(0))await send('Fetch.continueRequest',{requestId:r});await wait(3500);
 if(process.env.DEBUG)console.log('DEBUG after release',label,JSON.stringify(await rows()),await ev(`[...document.querySelectorAll('.form-error,[role=alert],.form-success')].map(e=>e.textContent).join('|')`),await ev(`document.querySelector('form')?.dataset.step`));
 check(`[JS delayed] ${label}: form becomes usable after scripts load`,await ev(`!document.querySelector('${form} button[type=submit]').disabled`));
}
await send('Fetch.disable');

// ---------- 3. Normal flow still succeeds (assessment step 1, then contact form) ----------
for(const [label,path,form,kind] of [['assessment','/en/consultation','form.assessment-form','full'],['general enquiry','/en/contact','form.general-enquiry-form','contact']]){
 const before=await rows();urlsSeen.length=0;
 await send('Page.navigate',{url:base+path});await wait(3000);
 await fill(form);
 if(await ev(`!!document.querySelector('${form} textarea')`)){await typeInto(`${form} textarea`,'Testing the enquiry flow.')}
 if(kind==='contact')await ev(`(()=>{const s=document.querySelector('${form} select');if(s&&!s.value){s.value=s.options[1]?.value||'';s.dispatchEvent(new Event('change',{bubbles:true}))}return true})()`);
 await ev(`(()=>{const c=document.querySelector('${form} input[type=checkbox]');if(c&&!c.checked)c.click();return true})()`);
 await clickSelector(`${form} button[type=submit]`);
 if(process.env.DEBUG)console.log('DEBUG validity',label,await ev(`JSON.stringify([...document.querySelector('${form}').elements].filter(e=>e.willValidate&&!e.checkValidity()).map(e=>[e.tagName,e.type,e.value,e.validationMessage]))`),await ev(`JSON.stringify([...document.querySelectorAll('${form} input,${form} textarea')].map(e=>e.type==='checkbox'?e.checked:e.value))`));
 if(process.env.DEBUG)console.log('DEBUG after first click',label,JSON.stringify(await rows()),await ev(`[...document.querySelectorAll('.form-error,[role=alert],.field-error,.form-success')].map(e=>e.textContent).join('|')`),await ev(`JSON.stringify({disabled:document.querySelector('${form} button[type=submit]')?.disabled,step:document.querySelector('${form}')?.dataset.step,name:document.querySelector('${form} input[name=name]')?.value})`));
 const savedPred=r=>kind==='full'?r.full===before.full+1:r.contact===before.contact+1;
 const now=await rowsWhen(savedPred);const saved=savedPred(now);
 check(`[normal] ${label}: success confirmation shown`,await (async()=>{for(let i=0;i<20;i++){if(await ev(`!!document.querySelector('.form-success, [data-step="2"]')`))return true;await wait(500)}return false})());
 check(`[normal] ${label}: enquiry saved once to the MOCK sheet`,saved,JSON.stringify({before,now}));
 // Double-click protection: clicking submit again after success must not create another row.
 await clickSelector(`${form} button[type=submit]`);await wait(2000);const again=await rows();
 check(`[normal] ${label}: no duplicate after another click`,kind==='full'?again.full===now.full:again.contact===now.contact);
 check(`[normal] ${label}: URL never contained personal details`,!leaks(await ev('location.href'))&&!urlsSeen.some(leaks),await ev('location.href'));
}
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed.`);
ws.close();chrome.kill();if(results.includes(false))process.exit(1);

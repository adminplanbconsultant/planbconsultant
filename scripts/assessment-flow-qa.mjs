// Browser QA (real Chrome over CDP) for the contact-first Free Initial Assessment, English + Arabic, desktop + mobile.
// Needs the mock stack:  node scripts/mock-enquiry-stack.mjs   (:3107 → MOCK Google Sheet, :3000 → enquiry storage unconfigured)
// The mock Apps Script runs the real Code.gs in a sandbox; nothing reaches Google and no email is sent.
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const ok=process.env.TEST_BASE_URL||'http://localhost:3107',down=process.env.NODB_BASE_URL||'http://localhost:3000',sheet='http://127.0.0.1:3301';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',port=9402;
const out='artifacts/assessment-flow';mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-flow-'))}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>{const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval failed: '+expr.slice(0,80));return r.result.value};
const waitFor=async(expr,ms=9000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(expr).catch(()=>false))return true;await sleep(120)}return false};
const fill=(sel,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw new Error('missing '+${JSON.stringify(sel)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
const click=sel=>ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
const clickText=text=>ev(`(()=>{const b=[...document.querySelectorAll('.assessment-form button')].find(b=>b.textContent.trim().startsWith(${JSON.stringify(text)}));if(!b)throw new Error('no button '+${JSON.stringify(text)});b.click();return true})()`);
async function mouse(x,y){for(const type of ['mouseMoved','mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x,y,button:'left',clickCount:1});}
/** Opens a Radix select with real pointer input and picks the option whose label starts with `label`. */
async function choose(trigger,label){
 await ev(`document.querySelector(${JSON.stringify(trigger)}).scrollIntoView({block:'center',behavior:'instant'})`);await sleep(200);
 const r=await ev(`(()=>{const b=document.querySelector(${JSON.stringify(trigger)}).getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}})()`);
 await mouse(r.x,r.y);await waitFor(`!!document.querySelector('[data-slot=select-item]')`,3000);
 const found=await ev(`(()=>{const it=[...document.querySelectorAll('[data-slot=select-item]')].find(i=>i.textContent.trim().startsWith(${JSON.stringify(label)}));if(!it)return false;it.focus();return document.activeElement===it})()`);
 if(!found)throw new Error('option not found: '+label);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await waitFor(`document.querySelectorAll('[data-slot=select-item]').length===0`,2000);await sleep(150);
 const picked=await ev(`document.querySelector(${JSON.stringify(trigger)}).textContent.trim()`);
 if(!picked.startsWith(label))throw new Error('picked '+picked+' instead of '+label);
}
const row=async id=>(await fetch(`${sheet}/__row/${id}`)).json();
const results=[];const check=(name,pass,detail='')=>{results.push(pass);console.log((pass?'PASS ':'FAIL ')+name+(!pass&&detail?'  — '+detail:''))};
await send('Page.enable');await send('Runtime.enable');

async function open(base,locale,device){
 await send('Emulation.setDeviceMetricsOverride',{width:device.w,height:device.h,deviceScaleFactor:1,mobile:device.m});
 await send('Page.navigate',{url:`${base}/${locale}/consultation`});await sleep(700);
 await ev(`sessionStorage.setItem('plan-b-assessment-popup-v3','1')`);await waitFor(`document.documentElement.dataset.splash==='done'`,7000);await sleep(300);
 // records every enquiry request; window.__failUpdates makes the next N update calls fail like a network error
 await ev(`sessionStorage.setItem("qa-reqs","[]");window.__failUpdates=0;const f=window.fetch;window.fetch=async(...a)=>{if(String(a[0]).includes('/api/enquiries')){const b=JSON.parse(a[1].body);{const q=JSON.parse(sessionStorage.getItem("qa-reqs")||"[]");q.push(b);sessionStorage.setItem("qa-reqs",JSON.stringify(q))}await new Promise(r=>setTimeout(r,500));if(b.action==='update'&&window.__failUpdates>0){window.__failUpdates--;throw new TypeError('Failed to fetch')}}return f(...a)}`);
 await ev(`document.querySelector('.assessment-form').scrollIntoView({block:'start',behavior:'instant'})`);
}
const stepOf=()=>ev(`document.querySelector('.assessment-form')?.dataset.step||(document.querySelector('.form-success')?'done':'none')`);
const layoutOk=async()=>ev(`(()=>{const W=innerWidth;const f=document.querySelector('.assessment-form');const btns=[...f.querySelectorAll('.assessment-buttons button')].filter(b=>b.offsetParent);return document.documentElement.scrollWidth<=W&&f.getBoundingClientRect().right<=W+1&&btns.every(b=>{const r=b.getBoundingClientRect();return r.height>=40&&r.right<=W+1&&r.left>=-1})})()`);
async function contactStep(locale,name,email){
 await fill('.assessment-form input[name=name]',name);await fill('.assessment-form input[name=phone]','+965 5000 1234');await fill('.assessment-form input[name=email]',email);
 await click('.assessment-form .consent input[type=checkbox]');
}
const ar=l=>l==='ar';
const copy={
 lead:['Send your contact details so our team can get in touch. You can add your plans and profile afterwards—both are optional.','أرسل بيانات التواصل ليتمكن فريقنا من التواصل معك. يمكنك إضافة خططك وملفك بعد ذلك، وكلاهما اختياري.'],
 received:['Your enquiry has been received. Add a few details to help us prepare, or finish now.','تم استلام استفسارك. أضف بعض التفاصيل لمساعدتنا على الاستعداد، أو أنهِ الآن.'],
 done:['Thank you. Your enquiry has been received. Our team will contact you using the details provided.','شكراً لك. تم استلام استفسارك، وسيتواصل معك فريقنا عبر البيانات التي قدّمتها.'],
 send:['Send enquiry & continue','أرسل الاستفسار وتابع'],save:['Save & continue','احفظ وتابع'],skip:['Skip this step','تخطَّ هذه الخطوة'],finishNow:['Finish now','إنهاء الآن'],
 saveFinish:['Save details & finish','احفظ التفاصيل وأنهِ'],skipFinish:['Skip & finish','تخطَّ وأنهِ'],
 progress:[['Contact','Your plans · optional','Profile · optional'],['التواصل','خططك · اختياري','ملفك · اختياري']]
};
const c=(k,l)=>copy[k][ar(l)?1:0];

const scenarios=[
 {locale:'en',device:{n:'desktop',w:1280,h:900,m:false},path:'save-both'},
 {locale:'ar',device:{n:'desktop',w:1280,h:900,m:false},path:'skip-both'},
 {locale:'en',device:{n:'mobile',w:390,h:844,m:true},path:'finish-now'},
 {locale:'ar',device:{n:'mobile',w:390,h:844,m:true},path:'empty-save-then-profile'},
 {locale:'en',device:{n:'tablet',w:820,h:1100,m:true},path:'update-fails-then-retries'}
];
for(const s of scenarios){
 const tag=`[${s.locale}/${s.device.n}/${s.path}]`;const L=s.locale;
 await open(ok,L,s.device);
 check(`${tag} step 1 is Contact with the approved copy`,(await stepOf())==='1'&&await ev(`document.querySelector('.assessment-lead').textContent===${JSON.stringify(c('lead',L))}`));
 check(`${tag} progress shows Contact → Your plans · optional → Profile · optional`,await ev(`JSON.stringify([...document.querySelectorAll('.assessment-progress li')].map(li=>li.textContent.replace(/^\\d/,'')))===${JSON.stringify(JSON.stringify(copy.progress[ar(L)?1:0]))}`));
 check(`${tag} contact fields: autocomplete, keyboards, +965 default`,await ev(`(()=>{const q=n=>document.querySelector('.assessment-form input[name='+n+']');return q('name').autocomplete==='name'&&q('phone').type==='tel'&&q('phone').inputMode==='tel'&&q('phone').autocomplete==='tel'&&q('phone').value.startsWith('+965')&&q('email').type==='email'&&q('email').inputMode==='email'&&q('email').autocomplete==='email'&&q('name').required&&q('phone').required&&q('email').required})()`));
 check(`${tag} layout fits (no overflow, buttons ≥40px)`,await layoutOk());
 {const sh=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${s.locale}-${s.device.n}-step1-contact.png`,Buffer.from(sh.data,'base64'))}
 // validation: nothing is sent while typing or when invalid
 await fill('.assessment-form input[name=name]','Sara');await sleep(400);
 check(`${tag} nothing is sent while typing`,(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===0);
 await clickText(c('send',L));await sleep(300);
 check(`${tag} invalid contact details show an error and send nothing`,(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===0&&await ev(`!!document.querySelector('.assessment-form .form-error')`));
 await contactStep(L,ar(L)?'سارة Test':'Sara Test',`qa+${s.path}@example.com`);
 await ev(`(()=>{const b=[...document.querySelectorAll('.assessment-form button')].find(b=>b.type==='submit');b.click();b.click();b.click()})()`);await sleep(200);
 check(`${tag} sending: button disabled with loading label`,await ev(`(()=>{const b=document.querySelector('.assessment-form button[type=submit]');return b.disabled&&/Sending|جارٍ/.test(b.textContent)})()`));
 check(`${tag} advances to Your plans only after the save is confirmed`,await waitFor(`document.querySelector('.assessment-form')?.dataset.step==='2'`,10000));
 const first=await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]")[0]');const id=first.id;
 check(`${tag} triple click sent ONE request`,(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===1);
 check(`${tag} step-1 payload: contact only, no placeholder answers`,first.stage==='contact'&&first.source==='full-assessment'&&first.consent===true&&!('programme' in first)&&!('destination' in first)&&!('method' in first)&&!('budget' in first));
 let r=await row(id);
 check(`${tag} ONE saved row + ONE notification right after step 1`,r.count===1&&r.emails===1&&r.row['Full name']&&r.row.Phone==='+96550001234'&&r.row.Programme===''&&r.row['Preferred contact method']==='',JSON.stringify(r).slice(0,200));
 check(`${tag} "received" message shown on Your plans`,await ev(`document.querySelector('.assessment-received').textContent.startsWith(${JSON.stringify(c('received',L))})`));
 check(`${tag} plans fields start empty (no default selections)`,await ev(`[...document.querySelectorAll('.assessment-form [data-slot=select-trigger]')].every(t=>!/Help me choose|Still exploring|ساعدني|لا أزال/.test(t.textContent))`));
 check(`${tag} step 2 layout fits`,await layoutOk());
 {const sh=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${s.locale}-${s.device.n}-step2-plans.png`,Buffer.from(sh.data,'base64'))}
 if(s.path==='save-both'){
  await choose('#assessment-programme','Canada Express Entry');
  await clickText(c('save',L));
  check(`${tag} Save & continue opens Profile after saving`,await waitFor(`document.querySelector('.assessment-form')?.dataset.step==='3'`,10000));
  r=await row(id);check(`${tag} plans saved into the SAME row (destination follows programme)`,r.count===1&&r.row.Programme==='Canada Express Entry'&&r.row.Destination==='Canada'&&r.emails===1,JSON.stringify(r.row||{}).slice(0,200));
  await choose('#assessment-age','33–39');await fill('.assessment-form input[name=profession]','Engineer');
  await clickText(c('saveFinish',L));
  check(`${tag} Save details & finish shows the confirmation`,await waitFor(`location.pathname.endsWith('/consultation/thank-you')&&!!document.querySelector('.form-success')`,15000));
  r=await row(id);check(`${tag} profile saved into the same row; plans kept; still one email`,r.count===1&&r.row['Age range']==='33–39'&&r.row['Job designation']==='Engineer'&&r.row.Programme==='Canada Express Entry'&&r.row.Nationality===''&&r.emails===1&&!!r.row['Details updated (UTC)'],JSON.stringify(r.row||{}).slice(0,240));
  const upd=await ev(`JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").filter(b=>b.action==='update')`);check(`${tag} updates carry the token and only filled fields`,upd.length===2&&upd.every(b=>b.id===id&&typeof b.updateToken==='string'&&b.updateToken.length>20)&&!('nationality' in upd[1])&&!('destination' in upd[1]));
 }
 if(s.path==='skip-both'){
  await clickText(c('skip',L));check(`${tag} Skip this step opens Profile without saving`,(await stepOf())==='3'&&(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===1);
  await clickText(c('skipFinish',L));check(`${tag} Skip & finish shows the confirmation`,await waitFor(`location.pathname.endsWith('/consultation/thank-you')&&!!document.querySelector('.form-success')`,15000));
  r=await row(id);check(`${tag} skipped steps leave the saved enquiry intact and blank`,r.count===1&&r.emails===1&&r.row.Programme===''&&r.row['Age range']==='');
 }
 if(s.path==='finish-now'){
  await clickText(c('finishNow',L));check(`${tag} Finish now shows the confirmation immediately`,await waitFor(`location.pathname.endsWith('/consultation/thank-you')&&!!document.querySelector('.form-success')`,15000)&&(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===1);
 }
 if(s.path==='empty-save-then-profile'){
  await clickText(c('save',L));check(`${tag} Save & continue with nothing chosen sends nothing and continues`,await waitFor(`document.querySelector('.assessment-form')?.dataset.step==='3'`,3000)&&(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===1);
  check(`${tag} step 3 layout fits`,await layoutOk());
  await fill('.assessment-form input[name=nationality]','Egyptian');await clickText(c('saveFinish',L));
  check(`${tag} confirmation after saving one profile field`,await waitFor(`location.pathname.endsWith('/consultation/thank-you')&&!!document.querySelector('.form-success')`,15000));
  r=await row(id);check(`${tag} only the supplied field was written`,r.count===1&&r.row.Nationality==='Egyptian'&&r.row['Country of residence']===''&&r.row['Age range']===''&&r.emails===1);
 }
 if(s.path==='update-fails-then-retries'){
  await choose('#assessment-destination',ar(L)?'كندا':'Canada');
  await ev('window.__failUpdates=1');await clickText(c('save',L));
  check(`${tag} failed update: friendly error, stays on Your plans`,await waitFor(`!!document.querySelector('.assessment-form .form-error')`,6000)&&(await stepOf())==='2');
  const err=await ev(`document.querySelector('.assessment-form .form-error').textContent`);
  check(`${tag} error says the enquiry is saved and exposes nothing technical`,/saved/i.test(err)&&!/google|script|sheet|503|token|secret/i.test(err),err);
  check(`${tag} chosen value preserved after the error`,await ev(`/Canada|كندا/.test(document.querySelector('#assessment-destination').textContent)`));
  await clickText(c('save',L));check(`${tag} retry succeeds and continues`,await waitFor(`document.querySelector('.assessment-form')?.dataset.step==='3'`,10000));
  r=await row(id);check(`${tag} retry updated the same row, no duplicate`,r.count===1&&r.row.Destination==='Canada'&&r.emails===1);
 }
 if(await ev(`!!document.querySelector('.form-success')`))check(`${tag} confirmation uses the approved wording and shows the reference`,await ev(`document.querySelector('.form-success').textContent.includes(${JSON.stringify(c('done',L))})&&/PB-[0-9A-F]{8}/.test(document.querySelector('.enquiry-reference').textContent)`));
 const shot=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${s.locale}-${s.device.n}-${s.path}.png`,Buffer.from(shot.data,'base64'));
 // leaving after step 1 never loses the enquiry
 await send('Page.navigate',{url:`${ok}/${L}`});await sleep(400);r=await row(id);check(`${tag} enquiry still saved after leaving the page`,r.count===1);
}

// step 1 failure keeps everything and retries with the same id (unconfigured storage server)
for(const L of ['en','ar']){
 const tag=`[${L}/storage-down]`;
 await open(down,L,{w:390,h:844,m:true});await contactStep(L,'Omar Ali','omar@example.com');await clickText(c('send',L));
 check(`${tag} error shown, still on Contact`,await waitFor(`!!document.querySelector('.assessment-form .form-error')`,10000)&&(await stepOf())==='1');
 check(`${tag} entered details preserved, button enabled`,await ev(`(()=>{const q=n=>document.querySelector('.assessment-form input[name='+n+']').value;return q('name')==='Omar Ali'&&q('email')==='omar@example.com'&&q('phone').includes('5000 1234')&&document.querySelector('.assessment-form .consent input').checked&&!document.querySelector('.assessment-form button[type=submit]').disabled})()`));
 const id0=await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]")[0].id');await clickText(c('send',L));await sleep(1500);
 check(`${tag} retry reuses the same enquiry id`,(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]").length'))===2&&(await ev('JSON.parse(sessionStorage.getItem("qa-reqs")||"[]")[1].id'))===id0);
}
socket.close();chrome.kill();
const failed=results.filter(r=>!r).length;console.log(`\n${results.length-failed}/${results.length} assessment-flow checks passed (mock Google Sheet).`);process.exit(failed?1:0);

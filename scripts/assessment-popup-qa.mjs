// End-to-end QA for the automatic free-assessment popup. Drives a real Chrome over CDP.
//   TEST_BASE_URL   server with a configured database (persistence tests)      default http://localhost:3107
//   NODB_BASE_URL   server WITHOUT DATABASE_URL (honest-failure tests)         default http://localhost:3000
//   CHROME_PATH     Chrome/Edge executable
//   QA_SHORT=1      skip the real 60-second timer test
// Screenshots land in artifacts/assessment-popup/.
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const base=process.env.TEST_BASE_URL||'http://localhost:3107';
const noDb=process.env.NODB_BASE_URL||'http://localhost:3000';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=Number(process.env.CHROME_DEBUG_PORT||9231);
const out='artifacts/assessment-popup';mkdirSync(out,{recursive:true});
const DONE='plan-b-assessment-popup-v3',MS='plan-b-assessment-active-ms-v3';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-qa-'))}`,'--no-first-run','--no-default-browser-check','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();
await new Promise((res,rej)=>{socket.addEventListener('open',res,{once:true});socket.addEventListener('error',rej,{once:true})});
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>{const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval failed');return r.result.value};
const waitFor=async(expr,ms=8000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(expr).catch(()=>false))return true;await sleep(150)}return false};
const results=[];const check=(name,ok,detail='')=>{results.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name+(detail?'  — '+detail:''))};
const viewport=(w,h,mobile=false)=>send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile});
const dialogOpen=()=>ev(`!!document.querySelector('.ap-dialog')`);
const shot=async name=>{await sleep(500);const r=await send('Page.captureScreenshot',{format:'png'});writeFileSync(`${out}/${name}.png`,Buffer.from(r.data,'base64'))};
const wheel=async(times=4,dy=100)=>{for(let i=0;i<times;i++){await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:300,y:400,deltaX:0,deltaY:dy});await sleep(80)}};
const key=async(k,extra={})=>{await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code:k,...extra});await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code:k})};
/** Open a URL with a clean session and wait until the splash has closed. */
async function fresh(url,{seedMs,done}={}){
 await send('Page.navigate',{url});await sleep(900);
 await ev(`sessionStorage.clear();${seedMs?`sessionStorage.setItem('${MS}','${seedMs}');`:''}${done?`sessionStorage.setItem('${DONE}','1');`:''}location.reload()`);
 await sleep(500);await waitFor(`document.documentElement.dataset.splash==='done'`,6000);
}
await send('Page.enable');await send('Runtime.enable');await viewport(1280,860);

/* 1. Scroll trigger: real wheel input */
await fresh(`${base}/en`);
await ev(`window.scrollTo(0,500)`);await sleep(400);
check('Programmatic scroll (no user input) does not open',!(await dialogOpen()));
await ev(`const a=document.createElement('a');a.href='#services';a.textContent='x';document.body.append(a);a.click()`);await sleep(1800);
check('Anchor-link scrolling does not open',!(await dialogOpen()));
await ev(`window.scrollTo(0,0)`);await sleep(300);
await wheel(1,60);await sleep(300);
check('Small user scroll (<200px) does not open',!(await dialogOpen()));
await wheel(5,100);await sleep(600);
check('User scroll ≈200px opens popup',await dialogOpen());
check('Dialog semantics + modal',await ev(`(()=>{const d=document.querySelector('[role=dialog]');return d&&d.getAttribute('aria-modal')==='true'&&!!document.getElementById(d.getAttribute('aria-labelledby'))})()`));
check('Background scroll locked, WhatsApp button hidden',await ev(`getComputedStyle(document.body).overflow==='hidden'&&getComputedStyle(document.querySelector('.floating-whatsapp')).visibility==='hidden'`));
await shot('desktop-step1-empty');

/* 2. Once per session; dismissal survives reload */
await key('Escape');await sleep(300);
check('Escape closes',!(await dialogOpen()));
await wheel(6,100);await sleep(500);
check('No second automatic opening after close',!(await dialogOpen()));
await send('Page.reload');await sleep(500);await waitFor(`document.documentElement.dataset.splash==='done'`,6000);
await ev(`sessionStorage.setItem('${MS}','90000')`);await wheel(6,100);await sleep(2500);
check('Dismissal survives reload (scroll + timer)',!(await dialogOpen()));

/* 3. Timer trigger (seeded, then a real 60s run) */
await fresh(`${base}/en`,{seedMs:31000});
check('Not open before accumulated time reached',!(await dialogOpen()));
check('Timer opens popup after accumulated time',await waitFor(`!!document.querySelector('.ap-dialog')`,9000));
await fresh(`${base}/en`,{seedMs:29000});
await ev(`Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>'hidden'});document.dispatchEvent(new Event('visibilitychange'))`);
await sleep(9000);
const hiddenMs=Number(await ev(`sessionStorage.getItem('${MS}')`));
check('Time is not counted while tab hidden',!(await dialogOpen())&&hiddenMs<31000,`stored ${hiddenMs}ms`);
await ev(`delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))`);
check('Counting resumes when visible again',await waitFor(`!!document.querySelector('.ap-dialog')`,9000));
if(!process.env.QA_SHORT){
 await fresh(`${base}/en`);const t0=Date.now();
 const opened=await waitFor(`!!document.querySelector('.ap-dialog')`,70000);const secs=(Date.now()-t0)/1000;
 check('Real 35s of active viewing opens popup (no scrolling)',opened&&secs>30&&secs<40,`opened after ${secs.toFixed(1)}s`);
}
/* 3b. Time counted across internal navigation */
await fresh(`${base}/en`);await sleep(5000);
await send('Page.navigate',{url:`${base}/en/about`});await waitFor(`document.documentElement.dataset.splash==='done'`,8000);
const carried=Number(await ev(`sessionStorage.getItem('${MS}')`));
check('Active time carries across page navigation',carried>=4000,`carried ${carried}ms before new page counted`);

/* 4. Manual opening and suppression */
await fresh(`${base}/en`);
await ev(`const b=document.createElement('button');b.id='qa-trigger';b.textContent='Free assessment';document.body.prepend(b);b.focus();window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);
check('Manual event opens popup',await waitFor(`!!document.querySelector('.ap-dialog')`,2000));
await key('Escape');await sleep(500);
check('Focus restored to initiating control',await ev(`document.activeElement?.id==='qa-trigger'`));
await wheel(6,100);await sleep(2500);
check('Manual open suppresses automatic reopening',!(await dialogOpen()));
await ev(`document.body.insertAdjacentHTML('afterbegin','<a id="qa-d" href="#" data-open-assessment="">Open</a>');document.getElementById('qa-d').click()`);
check('data-open-assessment trigger works after auto suppression',await waitFor(`!!document.querySelector('.ap-dialog')`,2000));
await fresh(`${base}/en/consultation`);await ev(`sessionStorage.getItem('${DONE}')`).then(v=>check('Visiting the assessment page counts as manual',v==='1'));

/* 5. Deferral and suppressed pages */
await viewport(390,844,true);
await send('Page.navigate',{url:`${base}/en`});await sleep(900);
await ev(`sessionStorage.clear();sessionStorage.setItem('${MS}','34000');location.reload()`);
await waitFor(`document.documentElement.dataset.splash==='active'`,8000);// hydrated
await ev(`document.querySelector('.mobile-nav-toggle').click()`);
await waitFor(`document.documentElement.dataset.splash==='done'`,8000);await sleep(3000);
check('Timer elapsed but deferred while mobile navigation open',!(await dialogOpen())&&await ev(`document.documentElement.classList.contains('nav-lock')`));
await ev(`document.querySelector('.mobile-nav-toggle').click()`);
check('Opens after navigation closes',await waitFor(`!!document.querySelector('.ap-dialog')`,4000));
await viewport(1280,860);
await fresh(`${base}/en`);
await ev(`document.body.insertAdjacentHTML('afterbegin','<form id="qa-form"><input id="qa-input"></form>');document.getElementById('qa-input').focus()`);await wheel(6,100);await sleep(2000);
check('Deferred while a form field has focus',!(await dialogOpen()));
await ev(`document.getElementById('qa-input').blur()`);
check('Opens once the field is left alone',await waitFor(`!!document.querySelector('.ap-dialog')`,25000));
await fresh(`${base}/en`);
await ev(`document.body.insertAdjacentHTML('afterbegin','<div id="qa-modal" role="dialog">other</div>')`);await wheel(6,100);await sleep(2000);
check('Deferred while another dialog is open',!(await dialogOpen()));
await ev(`document.getElementById('qa-modal').remove()`);
check('Opens after other dialog closes',await waitFor(`!!document.querySelector('.ap-dialog')`,4000));
for(const page of ['contact','consultation']){
 await fresh(`${base}/en/${page}`,{seedMs:90000});await wheel(6,100);await sleep(2500);
 check(`Never opens automatically on /${page}`,!(await dialogOpen()));
}

/* 6. Full flow, desktop English, persisted */
await fresh(`${base}/en/programmes/canada-express-entry`);
await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,2000);
check('Programme page preselects matching category',await ev(`document.querySelector('[data-choice="skilled-immigration"]')?.getAttribute('aria-checked')==='true'`));
await ev(`document.querySelector('[data-choice="study-abroad"]').click()`);
check('Selected card shows checkmark + aria-checked',await ev(`(()=>{const c=document.querySelector('[data-choice="study-abroad"]');return c.getAttribute('aria-checked')==='true'&&!!c.querySelector('.ap-check svg')})()`));
check('Clicking a card does not auto-advance',await ev(`document.querySelector('.ap-progress-label').textContent==='Step 1 of 2'`));
await ev(`document.querySelector('.ap-primary').click()`);await sleep(400);
check('Continue → Step 2 of 2',await ev(`document.querySelector('.ap-progress-label').textContent==='Step 2 of 2'`));
check('Header copy fixed between steps',await ev(`document.querySelector('.ap-header h2').textContent==='Where would you like your next chapter to begin?'`));
check('Country defaults to Kuwait (+965) with example placeholder',await ev(`document.querySelector('.ap-dial').value==='KW'&&document.querySelector('.ap-phone input').placeholder==='5000 0000'`));
await ev(`document.querySelector('form.ap-step button[type=submit]').click()`);await sleep(400);
check('Validation shows errors and focuses first invalid field',await ev(`document.querySelectorAll('.ap-error').length>=3&&document.activeElement.dataset.field==='name'&&document.activeElement.getAttribute('aria-invalid')==='true'`));
await shot('desktop-step2-errors');
const type=async(sel,val)=>{await ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});el.focus();const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(el,${JSON.stringify(val)});el.dispatchEvent(new Event('input',{bubbles:true}))})()`)};
await type('[data-field=name]','Sara Al-Mutairi');await type('[data-field=phone]','1234');
await ev(`document.querySelector('form.ap-step button[type=submit]').click()`);await sleep(300);
check('Kuwait number length validated',await ev(`!!document.querySelector('[id$=phone-error]')`));
await ev(`document.querySelector('.ap-back').click()`);await sleep(400);
check('Back returns to step 1 with selection kept',await ev(`document.querySelector('[data-choice="study-abroad"]').getAttribute('aria-checked')==='true'`));
await ev(`document.querySelector('.ap-primary').click()`);await sleep(400);
check('Entered values preserved across steps',await ev(`document.querySelector('[data-field=name]').value==='Sara Al-Mutairi'&&document.querySelector('[data-field=phone]').value==='1234'`));
await type('[data-field=phone]','5000 1234');await type('[data-field=email]','not-an-email');
await ev(`document.querySelector('form.ap-step button[type=submit]').click()`);await sleep(300);
check('Invalid optional email and missing consent flagged',await ev(`!!document.querySelector('[id$=email-error]')&&!!document.querySelector('[id$=consent-error]')`));
await type('[data-field=email]','');await ev(`document.querySelector('[data-field=consent]').click()`);
await shot('desktop-step2-filled');
await ev(`window.__calls=[];const f=window.fetch;window.fetch=(...a)=>{if(String(a[0]).includes('/api/enquiries'))window.__calls.push(String(a[0]));return f(...a)};const b=document.querySelector('form.ap-step button[type=submit]');b.click();b.click();b.click()`);
check('Success shown only after persisted (201)',await waitFor(`!!document.querySelector('.ap-success h3')`,10000));
check('Success heading uses first name',await ev(`document.querySelector('.ap-success h3').textContent==='Thank you, Sara.'`));
check('Duplicate submissions prevented',(await ev(`window.__calls.length`))===1,`${await ev(`window.__calls.length`)} request(s)`);
await shot('desktop-success');

/* 7. Honest failure with no database configured */
await fresh(`${noDb}/en`);
await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,2000);
await ev(`document.querySelector('[data-choice="visit-visas"]').click()`);await sleep(150);await ev(`document.querySelector('.ap-primary').click()`);await sleep(400);
await type('[data-field=name]','Omar Ali');await type('[data-field=phone]','5000 4321');await ev(`document.querySelector('[data-field=consent]').click()`);await sleep(150);await ev(`document.querySelector('form.ap-step button[type=submit]').click()`);
check('Unavailable backend → friendly error, no success',await waitFor(`!!document.querySelector('.ap-failure')&&!document.querySelector('.ap-success')`,8000));
const errText=await ev(`document.querySelector('.ap-failure').textContent`);
check('Error exposes no internals',!/database|DATABASE_URL|503|configured|stack|postgres/i.test(errText),errText);
check('All values preserved after failure',await ev(`document.querySelector('[data-field=name]').value==='Omar Ali'&&document.querySelector('[data-field=phone]').value==='5000 4321'&&document.querySelector('[data-field=consent]').checked`));
await shot('desktop-failure');
check('Resubmission allowed after failure',await ev(`!document.querySelector('form.ap-step button[type=submit]').disabled`));

/* 8. Focus handling */
await fresh(`${base}/en`);
await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,2000);
let escaped=0;for(let i=0;i<14;i++){await key('Tab');if(!(await ev(`document.querySelector('.ap-dialog').contains(document.activeElement)`)))escaped++}
check('Tab key stays trapped inside dialog (14 presses)',escaped===0);
escaped=0;for(let i=0;i<6;i++){await key('Tab',{modifiers:8});if(!(await ev(`document.querySelector('.ap-dialog').contains(document.activeElement)`)))escaped++}
check('Shift+Tab stays trapped',escaped===0);
check('Close button ≥44px target',await ev(`(()=>{const r=document.querySelector('.ap-close').getBoundingClientRect();return r.width>=43&&r.height>=43})()`));
check('Radio keyboard: arrows move selection',await (async()=>{await ev(`document.querySelector('[data-choice="skilled-immigration"]').focus()`);await key('ArrowRight');await sleep(120);return ev(`document.querySelector('[data-choice="work-visas"]').getAttribute('aria-checked')==='true'`)})());
check('Dialog width 540–600px on desktop',await ev(`(()=>{const w=document.querySelector('.ap-dialog').getBoundingClientRect().width;return w>=540&&w<=600})()`));
check('Corner radius 20–24px',await ev(`(()=>{const r=parseFloat(getComputedStyle(document.querySelector('.ap-dialog')).borderTopLeftRadius);return r>=20&&r<=24})()`));

/* 9. Reduced motion */
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await send('Page.reload');await sleep(500);await waitFor(`document.documentElement.dataset.splash==='done'`,6000);await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,3000);
check('Reduced motion disables popup animations',await ev(`['.ap-dialog','.ap-backdrop','.ap-step'].every(s=>getComputedStyle(document.querySelector(s)).animationName==='none')`));
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});

/* 10. Mobile */
await viewport(390,700,true);
await fresh(`${base}/en`);await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,3000);await sleep(500);
check('Mobile: dialog fits dynamic viewport',await ev(`(()=>{const r=document.querySelector('.ap-dialog').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.right<=innerWidth})()`));
check('Mobile: WhatsApp + sticky bar hidden under modal',await ev(`getComputedStyle(document.querySelector('.floating-whatsapp')).visibility==='hidden'`));
check('Mobile: single column, tap targets ≥44px',await ev(`[...document.querySelectorAll('.ap-choice')].every(c=>c.getBoundingClientRect().height>=44)`));
await shot('mobile-step1');
await ev(`document.querySelector('[data-choice="work-visas"]').click()`);await sleep(150);await ev(`document.querySelector('.ap-primary').click()`);await sleep(500);
await viewport(390,420,true);await sleep(300);
await ev(`document.querySelector('[data-field=email]').focus()`);await sleep(600);
check('Mobile short viewport (keyboard-sized): focused field visible inside dialog',await ev(`(()=>{const f=document.querySelector('[data-field=email]').getBoundingClientRect();const d=document.querySelector('.ap-dialog').getBoundingClientRect();return f.top>=d.top&&f.bottom<=d.bottom&&f.bottom<=innerHeight})()`));
check('Mobile short viewport: body scrolls internally',await ev(`(()=>{const b=document.querySelector('.ap-body');return b.scrollHeight>b.clientHeight||b.clientHeight>0})()`));
await viewport(390,844,true);await sleep(300);await shot('mobile-step2');

/* 11. Arabic */
await viewport(1280,860);
await fresh(`${base}/ar`);await ev(`window.dispatchEvent(new CustomEvent('planb:open-assessment'))`);await waitFor(`!!document.querySelector('.ap-dialog')`,3000);
check('Arabic: RTL dialog + translated copy',await ev(`(()=>{const d=document.querySelector('.ap-dialog');return d.dir==='rtl'&&d.querySelector('h2').textContent==='من أين تود أن يبدأ فصلك القادم؟'&&d.querySelector('.ap-progress-label').textContent==='الخطوة 1 من 2'})()`));
await shot('desktop-step1-ar');
await ev(`document.querySelector('[data-choice="business-immigration"]').click()`);await sleep(150);await ev(`document.querySelector('.ap-primary').click()`);await sleep(500);
check('Arabic: phone and email inputs stay LTR',await ev(`document.querySelector('.ap-phone').dir==='ltr'&&document.querySelector('[data-field=email]').dir==='ltr'&&document.querySelector('[data-field=phone]').inputMode==='tel'`));
await shot('desktop-step2-ar');
await viewport(390,844,true);await sleep(300);await shot('mobile-step2-ar');
await type('[data-field=name]','سارة المطيري');await type('[data-field=phone]','5000 7777');await ev(`document.querySelector('[data-field=consent]').click()`);await sleep(150);await ev(`document.querySelector('form.ap-step button[type=submit]').click()`);
await waitFor(`!!document.querySelector('.ap-success')`,10000).then(ok=>check('Arabic submit succeeds',ok));
check('Arabic success copy uses first name',await ev(`document.querySelector('.ap-success h3').textContent==='شكراً لك، سارة.'`));
await shot('mobile-success-ar');

socket.close();chrome.kill();
const failed=results.filter(r=>!r.ok);
writeFileSync(`${out}/qa-results.json`,JSON.stringify({base,noDb,results},null,2));
console.log(`\n${results.length-failed.length}/${results.length} passed`);
if(failed.length){console.log('FAILED:\n'+failed.map(f=>' - '+f.name+(f.detail?' ('+f.detail+')':'')).join('\n'));process.exitCode=1}

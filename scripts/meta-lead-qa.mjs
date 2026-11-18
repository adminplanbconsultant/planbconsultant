// Meta Lead QA against the MOCK enquiry stack, in headless Chrome. Nothing is sent to Meta: fbevents.js is replaced by a stub that
// reports every fbq call to this script (across page loads), and every facebook.com request is blocked.
// Needs: a build made with NEXT_PUBLIC_META_PIXEL_EXTRA_HOSTS=localhost (QA only, never deploy it), then
//        node scripts/mock-enquiry-stack.mjs   (:3107 → MOCK Apps Script, :3000 → enquiry storage unconfigured)
// The mock allows 8 new enquiries per hour per client, so the checks run in two parts; restart the mock stack between them:
//   LEAD_QA_PART=en node scripts/meta-lead-qa.mjs     then restart the mock     LEAD_QA_PART=ar node scripts/meta-lead-qa.mjs
import {spawn} from 'node:child_process';
const base=process.env.TEST_BASE_URL||'http://localhost:3107',noDb=process.env.NODB_BASE_URL||'http://localhost:3000',sheet='http://127.0.0.1:3301';
const part=process.env.LEAD_QA_PART||'en';
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9339','--no-first-run','--disable-gpu','--user-data-dir='+process.env.TEMP+'/lead-qa-'+Date.now(),'about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<40;i++){try{targets=await (await fetch('http://127.0.0.1:9339/json')).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,300))}
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const calls=[];const metaRequests=[];const pageErrors=[];let blockPixel=false;
const send=(method,params={})=>new Promise((resolve,reject)=>{const c=++id;pending.set(c,{resolve,reject});ws.send(JSON.stringify({id:c,method,params}))});
const stub=`(function(){var f=window.fbq;function rep(a){try{window.pbFbq(JSON.stringify({path:location.pathname,args:Array.prototype.slice.call(a)}))}catch(e){}}f.callMethod=function(){rep(arguments)};f.queue.forEach(rep);f.queue=[];})();`;
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const q=pending.get(m.id);pending.delete(m.id);m.error?q.reject(new Error(m.error.message)):q.resolve(m.result);return}
 if(m.method==='Runtime.bindingCalled'&&m.params.name==='pbFbq')calls.push(JSON.parse(m.params.payload));
 if(m.method==='Runtime.exceptionThrown')pageErrors.push(m.params.exceptionDetails?.exception?.description||m.params.exceptionDetails?.text);
 if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params;metaRequests.push(request.url);
  if(!blockPixel&&/connect\.facebook\.net\/.*fbevents\.js/.test(request.url))send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(stub).toString('base64')});
  else send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});}
});
await send('Page.enable');await send('Runtime.enable');await send('Runtime.addBinding',{name:'pbFbq'});
await send('Fetch.enable',{patterns:[{urlPattern:'*facebook.net*'},{urlPattern:'*facebook.com*'}]});
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.addScriptToEvaluateOnNewDocument',{source:"try{sessionStorage.setItem('plan-b-assessment-popup-v3','1')}catch{}"});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error((r.exceptionDetails.exception?.description||'eval failed').slice(0,300));return r.result.value};
const waitFor=async(e,ms=15000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(e).catch(()=>false))return true;await wait(250)}return false};
/** Every page load shows the brand splash for ~2.5 s with the page inert; wait until it reports done. */
const splashDone=async()=>{await wait(400);await waitFor(`document.documentElement.dataset.splash==='done'`,9000);await wait(300)};
const go=async url=>{await send('Page.navigate',{url});await splashDone()};
const rows=async()=>(await (await fetch(sheet+'/__state')).json());
const leads=(from=0)=>calls.slice(from).filter(c=>c.args[0]==='track'&&c.args[1]==='Lead');
const pageViews=(from=0)=>calls.slice(from).filter(c=>c.args[0]==='track'&&c.args[1]==='PageView');
const results=[];const check=(n,c,d='')=>{results.push(!!c);console.log((c?'ok  ':'FAIL')+'  '+n+(d?'  — '+d:''))};
const setConsent=async(origin,marketing)=>{await go(origin+'/en/privacy');await ev(`localStorage.setItem('planb-cookie-consent-v1',JSON.stringify({marketing:${marketing},analytics:false,updatedAt:new Date().toISOString()}));true`)};
const clearTab=()=>ev(`sessionStorage.removeItem('planb-enquiry-completion-v1');true`);
async function typeInto(selector,value){await ev(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});el.scrollIntoView({block:'center',behavior:'instant'});el.focus();if(el.select)el.select();return true})()`);await send('Input.insertText',{text:value})}
async function click(selector){await ev(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'});true`);await wait(250);const p=await ev(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);for(const type of ['mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:p.x,y:p.y,button:'left',clickCount:1})}
const clickText=(scope,re)=>ev(`(()=>{const b=[...document.querySelectorAll(${JSON.stringify(scope)})].find(x=>${re}.test(x.textContent));b.scrollIntoView({block:'center',behavior:'instant'});b.click();return true})()`);
let phoneSeq=Number(String(Date.now()).slice(-5));const nextPhone=()=>'+9655'+String(phoneSeq++).padStart(7,'0');
async function contactForm(origin,locale,{phone=nextPhone(),badPhone=false}={}){
 await go(`${origin}/${locale}/contact`);const f='form.general-enquiry-form';
 await typeInto(`${f} input[autocomplete=name]`,'Lead Tester');await typeInto(`${f} input[type=email]`,'lead.tester@example.com');await typeInto(`${f} input[type=tel]`,badPhone?'12':phone);
 await typeInto(`${f} textarea`,'Testing the Lead event.');await ev(`(()=>{const c=document.querySelector('${f} input[type=checkbox]');if(!c.checked)c.click();return true})()`);
 await click(`${f} button[type=submit]`);
}
const onThankYou=async locale=>{const ok=await waitFor(`location.pathname==='/${locale}/consultation/thank-you'`);if(ok)await splashDone();return ok&&await waitFor(`!!document.querySelector('.thank-you-card')`)};
const urlClean=()=>ev(`!/[?&](name|phone|email|id|ref|reference)=/i.test(location.href)&&!/Lead|Tester|example/.test(decodeURIComponent(location.href))`);
const leadArgsClean=from=>leads(from).every(c=>c.args.length===2);

if(part==='en'){
 // 1. Successful contact-form enquiry with consent → exactly one Lead, on the thank-you page, after init + PageView.
 await setConsent(base,true);let mark=calls.length;let before=await rows();
 await contactForm(base,'en');
 check('[EN contact] success navigates to /en/consultation/thank-you',await onThankYou('en'));await wait(1200);
 const saved=await rows();check('[EN contact] mock sheet saved one enquiry',saved.contact===before.contact+1,JSON.stringify(saved));
 check('[EN contact] exactly one Lead',leads(mark).length===1,JSON.stringify(calls.slice(mark).map(c=>c.path+':'+c.args.slice(0,2).join('/'))));
 check('[EN contact] Lead fired on the thank-you page, not the form page',leads(mark).every(c=>c.path==='/en/consultation/thank-you'));
 const i0=calls.slice(mark).findIndex(c=>c.args[0]==='init'),il=calls.slice(mark).findIndex(c=>c.args[1]==='Lead');
 check('[EN contact] pixel initialised (and PageView sent) before the Lead',i0>=0&&i0<il&&pageViews(mark).some(c=>c.path==='/en/consultation/thank-you'));
 check('[EN contact] Lead has no parameters or user data',leadArgsClean(mark));
 check('[EN contact] reference shown, URL carries no details or identifiers',await ev(`/PB-/.test(document.querySelector('.enquiry-reference')?.textContent||'')`)&&await urlClean(),await ev('location.href'));
 // 2. Refresh, language change, Back/Forward, re-render: no further Lead.
 mark=calls.length;await send('Page.reload');await splashDone();
 check('[EN] refresh: no Lead, PageView still sent',leads(mark).length===0&&pageViews(mark).length===1);
 mark=calls.length;await ev(`document.querySelector('a.language').click();true`);await splashDone();
 check('[EN→AR] language switch keeps the confirmation, no Lead',await ev(`location.pathname==='/ar/consultation/thank-you'&&/PB-/.test(document.querySelector('.enquiry-reference')?.textContent||'')`)&&leads(mark).length===0);
 mark=calls.length;const hist=await send('Page.getNavigationHistory');const back=hist.entries[Math.max(0,hist.currentIndex-1)];await send('Page.navigateToHistoryEntry',{entryId:back.id});await splashDone();
 const fwdHist=await send('Page.getNavigationHistory');await send('Page.navigateToHistoryEntry',{entryId:fwdHist.entries[fwdHist.currentIndex+1].id});await splashDone();
 await ev(`window.dispatchEvent(new Event('resize'));window.scrollTo(0,500);true`);await wait(600);
 check('[EN] Back / Forward / re-render: no Lead',leads(mark).length===0,JSON.stringify(leads(mark)));
 // 3. Direct visit (no completion in this tab): neutral page, no Lead.
 mark=calls.length;await clearTab();await go(base+'/en/consultation/thank-you');
 check('[EN] direct visit: neutral content, no reference, no Lead',await ev(`!!document.querySelector('.thank-you-neutral')&&!document.querySelector('.enquiry-reference')`)&&leads(mark).length===0&&pageViews(mark).length===1);
 // 4. The consultation landing page itself never fires Lead.
 mark=calls.length;await go(base+'/en/consultation');check('[EN] consultation landing page: PageView only, no Lead',leads(mark).length===0&&pageViews(mark).length===1);
 // 5. Invalid submission (validation error): no API save, no navigation, no Lead.
 mark=calls.length;before=await rows();await contactForm(base,'en',{badPhone:true});await splashDone();const inv=await rows();
 check('[EN] invalid submission: stays on form, nothing saved, no Lead',await ev(`location.pathname==='/en/contact'`)&&inv.contact===before.contact&&leads(mark).length===0,await ev('location.pathname'));
 // 6. Failed request (storage unconfigured server): error shown, no Lead.
 await setConsent(noDb,true);mark=calls.length;await contactForm(noDb,'en');await wait(3500);
 check('[EN] failed request: error shown, no thank-you, no Lead',await ev(`location.pathname==='/en/contact'&&!!document.querySelector('.form-error')`)&&leads(mark).length===0);
 // 7. A genuinely new successful enquiry counts once more.
 mark=calls.length;await contactForm(base,'en');check('[EN] second enquiry reaches thank-you',await onThankYou('en'));await wait(1200);
 check('[EN] new successful enquiry: exactly one new Lead',leads(mark).length===1&&leadArgsClean(mark));
 // 8. Consent declined: enquiry works, no pixel, no Lead — and accepting afterwards does not revive the old submission.
 await setConsent(base,false);mark=calls.length;before=await rows();await contactForm(base,'en');
 check('[EN declined] enquiry still succeeds and reaches thank-you',await onThankYou('en')&&(await rows()).contact===before.contact+1);await wait(1000);
 check('[EN declined] no pixel loaded, no Lead',leads(mark).length===0&&calls.slice(mark).length===0);
 await ev(`localStorage.setItem('planb-cookie-consent-v1',JSON.stringify({marketing:true,analytics:false,updatedAt:new Date().toISOString()}));window.dispatchEvent(new CustomEvent('planb:consent-change',{detail:{marketing:true}}));true`);await wait(1200);
 await send('Page.reload');await splashDone();
 check('[EN declined→accepted later] declined submission is not tracked later',leads(mark).length===0);
 // 9. Pixel blocked (fbevents.js fails to load): enquiry still succeeds, no page errors from tracking.
 await setConsent(base,true);blockPixel=true;pageErrors.length=0;before=await rows();await contactForm(base,'en');
 check('[EN blocked pixel] enquiry succeeds and thank-you shows the reference',await onThankYou('en')&&(await rows()).contact===before.contact+1&&await ev(`/PB-/.test(document.querySelector('.enquiry-reference')?.textContent||'')`));
 check('[EN blocked pixel] no uncaught page errors',pageErrors.length===0,pageErrors.join(' | '));blockPixel=false;
}else{
 // 10. Full assessment (AR): Contact saved → optional Plans skipped → optional Profile saved & finish. Lead only at the end.
 await setConsent(base,true);let mark=calls.length;let before=await rows();
 await go(base+'/ar/consultation');const f='form.assessment-form';
 await typeInto(`${f} input[name=name]`,'Lead Tester');await typeInto(`${f} input[name=phone]`,nextPhone());await typeInto(`${f} input[name=email]`,'lead.tester@example.com');
 await ev(`(()=>{const c=document.querySelector('${f} input[type=checkbox]');if(!c.checked)c.click();return true})()`);await click(`${f} button[type=submit]`);
 check('[AR assessment] contact step saved, form moves to optional step 2',await waitFor(`document.querySelector('${f}')?.dataset.step==='2'`)&&(await rows()).full===before.full+1);
 await wait(800);check('[AR assessment] saving contact details: no Lead',leads(mark).length===0&&await ev(`location.pathname==='/ar/consultation'`));
 await clickText(`${f} button`,'/تخطَّ هذه الخطوة/');check('[AR assessment] skip optional plans → step 3',await waitFor(`document.querySelector('${f}')?.dataset.step==='3'`));
 check('[AR assessment] skipping a step: no Lead',leads(mark).length===0);
 await typeInto(`${f} input[name=profession]`,'Engineer');await clickText(`${f} button`,'/احفظ التفاصيل وأنهِ/');
 check('[AR assessment] save profile & finish → /ar/consultation/thank-you',await onThankYou('ar'));await wait(1200);
 check('[AR assessment] optional update did not create a second enquiry row',(await rows()).full===before.full+1);
 check('[AR assessment] exactly one Lead, on the thank-you page, no parameters',leads(mark).length===1&&leads(mark)[0].path==='/ar/consultation/thank-you'&&leadArgsClean(mark));
 check('[AR assessment] URL carries no details or identifiers',await urlClean());
 mark=calls.length;await send('Page.reload');await splashDone();check('[AR] refresh: no Lead',leads(mark).length===0);
 mark=calls.length;await ev(`document.querySelector('a.language').click();true`);await splashDone();check('[AR→EN] language switch: no Lead',await ev(`location.pathname==='/en/consultation/thank-you'`)&&leads(mark).length===0);
 // 11. "Finish now" right after contact (EN programme page): one Lead.
 mark=calls.length;await go(base+'/en/services/residency-by-investment/uae');
 await typeInto(`${f} input[name=name]`,'Lead Tester');await typeInto(`${f} input[name=phone]`,nextPhone());await typeInto(`${f} input[name=email]`,'lead.tester@example.com');
 await ev(`(()=>{const c=document.querySelector('${f} input[type=checkbox]');if(!c.checked)c.click();return true})()`);await click(`${f} button[type=submit]`);
 await waitFor(`document.querySelector('${f}')?.dataset.step==='2'`);await clickText(`${f} button`,'/Finish now/');
 check('[EN programme page] Finish now → thank-you with exactly one Lead',await onThankYou('en')&&(await wait(1200),leads(mark).length===1));
 // 12. Consent withdrawn mid-flow (after contact saved, before finishing): no Lead.
 mark=calls.length;await go(base+'/ar/consultation');
 await typeInto(`${f} input[name=name]`,'Lead Tester');await typeInto(`${f} input[name=phone]`,nextPhone());await typeInto(`${f} input[name=email]`,'lead.tester@example.com');
 await ev(`(()=>{const c=document.querySelector('${f} input[type=checkbox]');if(!c.checked)c.click();return true})()`);await click(`${f} button[type=submit]`);
 await waitFor(`document.querySelector('${f}')?.dataset.step==='2'`);
 await ev(`document.querySelector('.cookie-settings-link').click();true`);await wait(400);await clickText('.cookie-consent button','/رفض/');await wait(500);
 await clickText(`${f} button`,'/إنهاء الآن/');
 check('[AR withdrawn mid-flow] enquiry completes to thank-you',await onThankYou('ar'));await wait(1200);
 check('[AR withdrawn mid-flow] no Lead',leads(mark).length===0,JSON.stringify(leads(mark)));
 // 13. Popup quick assessment, AR and EN: one Lead each.
 for(const l of ['ar','en']){
  await setConsent(base,true);mark=calls.length;await go(`${base}/${l}/services`);
  await ev(`sessionStorage.removeItem('plan-b-assessment-popup-v3');window.dispatchEvent(new CustomEvent('planb:open-assessment'));true`);
  await waitFor(`!!document.querySelector('.ap-dialog')`);await ev(`document.querySelector('.ap-choice').click();true`);await wait(200);await ev(`document.querySelector('.ap-actions .ap-primary').click();true`);
  await waitFor(`!!document.querySelector('.ap-dialog [data-field=name]')`);
  await typeInto('.ap-dialog [data-field=name]','Lead Tester');await typeInto('.ap-dialog [data-field=phone]',String(50000000+(phoneSeq++%9999999)));await typeInto('.ap-dialog [data-field=email]','lead.tester@example.com');
  await ev(`(()=>{const c=document.querySelector('.ap-dialog input[type=checkbox]');if(!c.checked)c.click();return true})()`);await ev(`document.querySelector('.ap-dialog form .ap-primary').click();true`);
  check(`[${l.toUpperCase()} popup] success → /${l}/consultation/thank-you`,await onThankYou(l));await wait(1200);
  check(`[${l.toUpperCase()} popup] exactly one Lead, no parameters`,leads(mark).length===1&&leadArgsClean(mark),JSON.stringify(leads(mark)));
 }
}
check('no Meta request other than the stubbed fbevents.js left the browser',metaRequests.every(u=>/fbevents\.js/.test(u)),[...new Set(metaRequests)].join(' '));
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed (part ${part}). Leads recorded by the stub: ${leads().length}.`);
ws.close();chrome.kill();if(results.includes(false))process.exit(1);

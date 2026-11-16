// Meta Pixel + consent QA in headless Chrome. Every request to Meta is intercepted: fbevents.js is replaced by a local stub that
// records fbq calls, and facebook.com/tr is blocked, so nothing is ever sent to Meta.
//   PIXEL_QA_MODE=disabled  against a normal build: checks that nothing loads on localhost.
//   PIXEL_QA_MODE=enabled   against a QA build made with NEXT_PUBLIC_META_PIXEL_EXTRA_HOSTS=localhost (never deploy that build).
// Usage: TEST_BASE_URL=http://localhost:3100 PIXEL_QA_MODE=enabled node scripts/meta-pixel-qa.mjs
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';const mode=process.env.PIXEL_QA_MODE||'disabled';
const PIXEL='1877133723717615';
const chrome=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--remote-debugging-port=9336','--no-first-run','--disable-gpu','--user-data-dir='+process.env.TEMP+'/pixel-qa-'+Date.now(),'about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<40;i++){try{targets=await (await fetch('http://127.0.0.1:9336/json')).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,300))}
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();const metaRequests=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const c=++id;pending.set(c,{resolve,reject});ws.send(JSON.stringify({id:c,method,params}))});
const stub=`(function(){var f=window.fbq;window.__fbeventsLoads=(window.__fbeventsLoads||0)+1;window.__fbqCalls=window.__fbqCalls||[];window.__disablePushState=f.disablePushState;f.callMethod=function(){window.__fbqCalls.push(Array.prototype.slice.call(arguments))};f.queue.forEach(function(a){window.__fbqCalls.push(Array.prototype.slice.call(a))});f.queue=[];})();`;
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);
 if(m.id&&pending.has(m.id)){const q=pending.get(m.id);pending.delete(m.id);m.error?q.reject(new Error(m.error.message)):q.resolve(m.result);return}
 if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params;metaRequests.push(request.url);
  if(/connect\.facebook\.net\/.*fbevents\.js/.test(request.url))send('Fetch.fulfillRequest',{requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'application/javascript'}],body:Buffer.from(stub).toString('base64')});
  else send('Fetch.failRequest',{requestId,errorReason:'BlockedByClient'});}
});
await send('Page.enable');await send('Runtime.enable');
await send('Fetch.enable',{patterns:[{urlPattern:'*facebook.net*'},{urlPattern:'*facebook.com*'}]});
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
// Suppress the timed enquiry popup so it does not cover the banner.
await send('Page.addScriptToEvaluateOnNewDocument',{source:"try{sessionStorage.setItem('plan-b-assessment-popup-v3','1')}catch{}"});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,300));return r.result.value};
const go=async path=>{metaRequests.length=0;await send('Page.navigate',{url:base+path});await wait(2200)};
const state=()=>ev(`({banner:!!document.querySelector('.cookie-consent'),settings:!!document.querySelector('.cookie-settings-link'),fbq:typeof window.fbq,loads:window.__fbeventsLoads||0,calls:window.__fbqCalls||[],pushState:window.__disablePushState,scripts:document.querySelectorAll('script[src*="fbevents"]').length,noscriptPixel:document.querySelectorAll('noscript img[src*="facebook"]').length,cookies:document.cookie})`);
const pageViews=s=>s.calls.filter(c=>c[0]==='track'&&c[1]==='PageView').length;
const results=[];const check=(name,cond,detail='')=>{results.push({name,pass:!!cond,detail});console.log((cond?'ok  ':'FAIL')+'  '+name+(detail?'  — '+detail:''))};

if(mode==='disabled'){
 for(const p of ['/en','/ar','/en/services/citizenship-by-investment/dominica','/en/privacy']){await go(p);const s=await state();
  check(`${p}: no banner, no settings link`,!s.banner&&!s.settings);check(`${p}: fbq absent, no Meta request`,s.fbq==='undefined'&&metaRequests.length===0,metaRequests.join(' '));check(`${p}: no noscript pixel`,s.noscriptPixel===0)}
 // Even with consent stored, localhost stays off.
 await ev(`localStorage.setItem('planb-cookie-consent-v1',JSON.stringify({marketing:true,updatedAt:'x'}))`);await go('/en');const s=await state();
 check('consent stored but localhost: still nothing loads',s.fbq==='undefined'&&metaRequests.length===0);
}else{
 await go('/en');let s=await state();
 check('first visit: banner shown, nothing loaded before a choice',s.banner&&s.fbq==='undefined'&&metaRequests.length===0);
 check('no noscript pixel in HTML',s.noscriptPixel===0);
 await ev(`[...document.querySelectorAll('.cookie-consent button')].find(b=>/Decline/.test(b.textContent)).click()`);await wait(800);s=await state();
 check('decline: banner closes, nothing loads',!s.banner&&s.fbq==='undefined'&&metaRequests.length===0);
 await go('/ar');s=await state();check('after decline, next page (AR): no banner, nothing loads',!s.banner&&s.fbq==='undefined'&&metaRequests.length===0);
 await ev(`document.querySelector('.cookie-settings-link').click()`);await wait(400);s=await state();check('Cookie settings reopens the banner',s.banner);
 await ev(`[...document.querySelectorAll('.cookie-consent button')].find(b=>/موافقة/.test(b.textContent)).click()`);await wait(1500);s=await state();
 check('accept on AR page: script loads once, one PageView',s.loads===1&&s.scripts===1&&pageViews(s)===1,JSON.stringify(s.calls));
 const init=s.calls.find(c=>c[0]==='init');
 check('init: this Pixel ID only, no advanced matching',init&&init[1]===PIXEL&&init.length===2&&s.calls.filter(c=>c[0]==='init').length===1);
 check('automatic events disabled (autoConfig false)',s.calls.some(c=>c[0]==='set'&&c[1]==='autoConfig'&&c[2]===false&&c[3]===PIXEL));
 check('Meta history auto-PageView disabled',s.pushState===true);
 check('only base pixel + PageView (no other events)',s.calls.every(c=>['consent','set','init'].includes(c[0])||(c[0]==='track'&&c[1]==='PageView')),JSON.stringify(s.calls));
 check('no request to facebook.com/tr left the browser',metaRequests.every(u=>/fbevents\.js/.test(u)),metaRequests.join(' '));
 // Same document: history changes, hash anchors and re-renders must not add PageViews.
 await ev(`history.pushState({},'', location.pathname+'#x');history.replaceState({},'',location.pathname);window.dispatchEvent(new PopStateEvent('popstate'));location.hash='faq';window.dispatchEvent(new Event('resize'));window.scrollTo(0,2000);true`);await wait(1200);s=await state();
 check('pushState/replaceState/hash/re-render: still exactly one PageView',pageViews(s)===1,String(pageViews(s)));
 for(const p of ['/en/services/residency-by-investment/uae','/en/consultation?programme=rbi-uae']){await go(p);s=await state();
  check(`full navigation to ${p}: one script load, one PageView, no banner`,s.loads===1&&pageViews(s)===1&&!s.banner,JSON.stringify(s.calls.map(c=>c[0]+':'+(c[1]||''))))}
 await go('/en/consultation?name=Test+Person&phone=%2B96550000000&email=a%40b.com');s=await state();
 check('URL carrying form data: pixel not loaded, no PageView',s.fbq==='undefined'&&metaRequests.length===0);
 // Withdrawal: plant Meta-style cookies, then decline via Cookie settings.
 await go('/en/privacy');await ev(`document.cookie='_fbp=fb.1.123.456; path=/';document.cookie='_fbc=fb.1.123.abc; path=/';true`);
 await ev(`document.querySelector('.cookie-settings-link').click()`);await wait(400);s=await state();check('settings shows current choice (accepted)',s.banner&&await ev(`/accepted/.test(document.querySelector('.cookie-consent-status').textContent)`));
 await ev(`[...document.querySelectorAll('.cookie-consent button')].find(b=>/Decline/.test(b.textContent)).click()`);await wait(600);s=await state();
 check('withdraw: consent revoke sent to fbq',s.calls.some(c=>c[0]==='consent'&&c[1]==='revoke'));
 check('withdraw: _fbp and _fbc cookies removed',!/_fbp=|_fbc=/.test(s.cookies),s.cookies);
 await go('/en');s=await state();check('after withdrawal, next page: nothing loads',s.fbq==='undefined'&&metaRequests.length===0);
 // Re-accept then reload: still exactly one PageView per page view.
 await ev(`document.querySelector('.cookie-settings-link').click()`);await wait(300);await ev(`[...document.querySelectorAll('.cookie-consent button')].find(b=>/Accept/.test(b.textContent)).click()`);await wait(1200);
 await send('Page.reload');await wait(2200);s=await state();check('re-accepted + reload: one PageView',s.loads===1&&pageViews(s)===1);
 // Forms still work visually with the banner closed: the assessment form is present and interactive.
 check('enquiry form present on consultation page',await (async()=>{await go('/en/consultation');return ev(`!!document.querySelector('form.assessment-form input[name=name]')`)})());
}
const failed=results.filter(r=>!r.pass);console.log(`\n${results.length-failed.length}/${results.length} checks passed (${mode}).`);
ws.close();chrome.kill();if(failed.length)process.exit(1);

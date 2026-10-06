// Browser QA (real Chrome over CDP) for the full-assessment and contact forms, English + Arabic.
// Needs the mock stack:  node scripts/mock-enquiry-stack.mjs   (:3107 wired to a MOCK sheet, :3000 unconfigured)
// The popup has its own suite: scripts/assessment-popup-qa.mjs.
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const ok=process.env.TEST_BASE_URL||'http://localhost:3107',down=process.env.NODB_BASE_URL||'http://localhost:3000';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',port=9342;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-ui-'))}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>{const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval failed');return r.result.value};
const waitFor=async(expr,ms=8000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(expr).catch(()=>false))return true;await sleep(120)}return false};
const fill=(sel,value)=>ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)throw new Error('missing '+${JSON.stringify(sel)});const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
const click=sel=>ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
const results=[];const check=(name,pass,detail='')=>{results.push(pass);console.log((pass?'PASS ':'FAIL ')+name+(detail?'  — '+detail:''))};
await send('Page.enable');await send('Runtime.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});

async function open(base,locale,path){
 await send('Page.navigate',{url:`${base}/${locale}/${path}`});await sleep(800);
 await ev(`sessionStorage.setItem('plan-b-assessment-popup-v3','1');`);await waitFor(`document.documentElement.dataset.splash==='done'`,6000);await sleep(300);
 await ev(`window.__reqs=[];const f=window.fetch;window.fetch=async(...a)=>{if(String(a[0]).includes('/api/enquiries')){window.__reqs.push(JSON.parse(a[1].body));await new Promise(r=>setTimeout(r,700))}return f(...a)}`);
}
const fillContact=async()=>{await fill('.general-enquiry-form input[id$="-name"]','سارة Test');await fill('.general-enquiry-form input[type=email]','qa@example.com');await fill('.general-enquiry-form input[type=tel]','+965 5000 1234');await fill('.general-enquiry-form textarea','Hello, please contact me.');await click('.general-enquiry-form input[type=checkbox]')};
const fillFull=async()=>{await click('.assessment-form button[type=submit]');await sleep(200);await click('.skip-profile');await sleep(200);await fill('.assessment-form input[name=name]','Sara Test');await fill('.assessment-form input[name=phone]','+965 5000 1234');await fill('.assessment-form input[name=email]','qa@example.com');await click('.assessment-form input[type=checkbox]')};

for(const locale of ['en','ar']){
 const ar=locale==='ar';
 for(const [label,path,root,filler] of [['contact form','contact','.general-enquiry-form',fillContact],['full assessment','consultation','.assessment-form',fillFull]]){
  await open(ok,locale,path);await filler();
  await ev(`const b=document.querySelector('${root} button[type=submit]');b.click();b.click();b.click()`);
  await sleep(250);
  check(`[${locale}] ${label}: submit disabled with loading label while sending`,await ev(`(()=>{const b=document.querySelector('${root} button[type=submit]');return b.disabled&&/Sending|جارٍ/.test(b.textContent)})()`));
  check(`[${locale}] ${label}: success only after confirmed save`,await waitFor(`!!document.querySelector('.form-success')`,10000));
  const text=await ev(`document.querySelector('.form-success').textContent`);
  check(`[${locale}] ${label}: required thank-you message`,ar?text.includes('شكراً لك.')&&text.includes('لقد استلمنا استفسارك وسيتواصل معك فريقنا.'):text.includes('Thank you.')&&text.includes('We’ve received your enquiry. Our team will contact you.'),text.slice(0,80));
  check(`[${locale}] ${label}: reference shown`,await ev(`/^PB-[0-9A-F]{8}$/.test(document.querySelector('.enquiry-reference')?.textContent||'')`));
  {const n=await ev('window.__reqs.length');check(`[${locale}] ${label}: triple click sent one request`,n===1,'requests='+n)}
  const body=await ev('window.__reqs[0]');
  check(`[${locale}] ${label}: payload carries source, page path and consent`,body.source===(label==='contact form'?'contact-form':'full-assessment')&&body.pagePath===`/${locale}/${path}`&&body.consent===true&&!('turnstileToken' in body&&body.turnstileToken));
  await open(down,locale,path);await filler();
  await click(`${root} button[type=submit]`);
  check(`[${locale}] ${label}: storage down → error, no success`,await waitFor(`!!document.querySelector('${root} .form-error')&&!document.querySelector('.form-success')`,10000));
  const err=await ev(`document.querySelector('${root} .form-error').textContent`);
  check(`[${locale}] ${label}: error text is friendly and exposes nothing technical`,err.length>20&&!/google|script|sheet|503|configur|secret|stack/i.test(err),err.slice(0,90));
  check(`[${locale}] ${label}: entered values preserved and retry enabled`,await ev(`(()=>{const f=document.querySelector('${root}');const b=f.querySelector('button[type=submit]');const vals=[...f.querySelectorAll('input:not([type=checkbox]):not([tabindex="-1"]),textarea')].map(e=>e.value).join('|');return !b.disabled&&vals.includes('qa@example.com')&&vals.includes('5000 1234')&&f.querySelector('input[type=checkbox]').checked})()`));
  const same=await ev(`window.__reqs[0].id`);await click(`${root} button[type=submit]`);await sleep(1800);
  check(`[${locale}] ${label}: retry reuses the same submission id`,(await ev('window.__reqs.length'))===2&&(await ev('window.__reqs[1].id'))===same);
 }
}
socket.close();chrome.kill();
const failed=results.filter(r=>!r).length;console.log(`\n${results.length-failed}/${results.length} UI checks passed`);process.exit(failed?1:0);

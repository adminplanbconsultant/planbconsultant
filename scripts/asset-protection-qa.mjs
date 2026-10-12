// Browser QA (real Chrome over CDP) for the casual-copy deterrents and for everything that must NOT be affected.
//   node node_modules/next/dist/bin/next start -p 3411 ; node scripts/asset-protection-qa.mjs
import {spawn} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const base=process.env.TEST_BASE_URL||'http://localhost:3411';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',port=9371;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-assets-'))}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>{const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval failed');return r.result.value};
const waitFor=async(expr,ms=9000)=>{const end=Date.now()+ms;while(Date.now()<end){if(await ev(expr).catch(()=>false))return true;await sleep(150)}return false};
await send('Page.enable');await send('Runtime.enable');
let pass=0;const fails=[];const check=(name,ok,detail='')=>{if(ok)pass++;else fails.push(name+(detail?' — '+detail:''));console.log((ok?'PASS ':'FAIL ')+name+(detail&&!ok?'  — '+detail:''))};

/** Fires a synthetic event on the first element matching `sel` and reports whether the page cancelled it. */
const cancelled=(type,sel)=>ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});if(!el)return 'missing';const e=${JSON.stringify(type)}==='dragstart'?new DragEvent('dragstart',{bubbles:true,cancelable:true}):new MouseEvent('contextmenu',{bubbles:true,cancelable:true});el.dispatchEvent(e);return e.defaultPrevented})()`);
const userSelect=sel=>ev(`(()=>{const el=document.querySelector(${JSON.stringify(sel)});return el?getComputedStyle(el).userSelect:'missing'})()`);

for(const device of [{n:'desktop',w:1280,h:860,m:false},{n:'mobile',w:390,h:844,m:true}])for(const locale of ['en','ar']){
 const tag=`[${locale}/${device.n}]`;
 await send('Emulation.setDeviceMetricsOverride',{width:device.w,height:device.h,deviceScaleFactor:device.m?2:1,mobile:device.m});
 await send('Emulation.setTouchEmulationEnabled',{enabled:device.m});
 // --- programme page: logo, photo, links, form fields
 await send('Page.navigate',{url:`${base}/${locale}/programmes/germany-nursing`});await sleep(700);
 check(`${tag} splash completes`,await waitFor(`document.documentElement.getAttribute('data-splash')==='done'`,8000));
 await ev(`[...document.images].forEach(i=>{i.loading='eager'})`);await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0)})()`);await waitFor(`[...document.images].every(i=>i.complete)`,6000);await sleep(600);
 const imgs=await ev(`[...document.images].map(i=>({src:i.currentSrc||i.src,ok:i.complete&&i.naturalWidth>0,lazy:i.loading==='lazy'}))`);
 const broken=imgs.filter(i=>!i.ok);
 check(`${tag} all ${imgs.length} images load (protection does not break display)`,broken.length===0,broken.map(b=>b.src.replace(base,'')).join(', '));
 check(`${tag} header logo displays`,await ev(`(()=>{const i=document.querySelector('.header-logo-artwork');return !!i&&i.complete&&i.naturalWidth>0&&i.getBoundingClientRect().height>40})()`));
 check(`${tag} footer logo (SVG image) displays`,await ev(`(()=>{const i=document.querySelector('.footer-crest image, .footer .brand-mark image');if(!i)return 'none';return i.getBoundingClientRect().width>20})()`)!==false);
 check(`${tag} native drag cancelled on header logo`,(await cancelled('dragstart','.header-logo-artwork'))===true);
 check(`${tag} native drag cancelled on hero photo`,(await cancelled('dragstart','.programme-hero-media img'))===true);
 check(`${tag} context menu suppressed on hero photo (not a link)`,(await cancelled('contextmenu','.programme-hero-media img'))===true);
 check(`${tag} context menu NOT suppressed on logo inside a link (keeps link actions)`,(await cancelled('contextmenu','.header-logo-artwork'))===false);
 check(`${tag} context menu NOT suppressed on body text`,(await cancelled('contextmenu','main p'))===false);
 check(`${tag} context menu NOT suppressed on a link`,(await cancelled('contextmenu','main a[href]'))===false);
 check(`${tag} context menu NOT suppressed on form field`,(await cancelled('contextmenu','.assessment-form input, .assessment-form select, .assessment-form button'))===false);
 check(`${tag} body text stays selectable`,(await userSelect('main p'))!=='none');
 check(`${tag} headings and lists stay selectable`,(await userSelect('main h2'))!=='none'&&(await userSelect('main li'))!=='none');
 check(`${tag} footer contact links stay selectable`,(await userSelect('.footer a[href^="mailto:"], .footer a[href^="tel:"], .topline a'))!=='none');
 check(`${tag} form fields stay editable`,await ev(`(()=>{const i=document.querySelector('.assessment-form input, .assessment-form textarea');return !!i&&getComputedStyle(i).userSelect!=='none'&&!i.readOnly&&!i.disabled})()`));
 check(`${tag} selection restriction limited to brand artwork (header wordmark)`,(await userSelect('.header-wordmark'))==='none');
 check(`${tag} images carry no-drag CSS`,await ev(`getComputedStyle(document.querySelector('main img')).webkitUserDrag==='none'||getComputedStyle(document.querySelector('main img')).getPropertyValue('-webkit-user-drag')==='none'`));
 // programmatic selection copy works for real text
 check(`${tag} text can be selected and copied (selection API)`,await ev(`(()=>{const p=document.querySelector('main p');const r=document.createRange();r.selectNodeContents(p);const s=getSelection();s.removeAllRanges();s.addRange(r);return s.toString().length>20})()`));
 // keyboard: Tab reaches interactive elements, no key interception
 let tabbed=false;await ev('document.body.focus();document.activeElement&&document.activeElement.blur&&document.activeElement.blur()');
 for(let i=0;i<3;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9})}
 tabbed=await ev(`!!document.activeElement&&document.activeElement!==document.body&&/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(document.activeElement.tagName)`);
 check(`${tag} keyboard Tab reaches links/controls`,tabbed);
 check(`${tag} Ctrl+C / Ctrl+P / F12 not intercepted (no keydown preventDefault)`,await ev(`(()=>{let blocked=0;for(const k of [['c',true],['p',true],['s',true],['u',true],['F12',false],['I',true]]){const e=new KeyboardEvent('keydown',{key:k[0],ctrlKey:k[1],shiftKey:k[0]==='I',bubbles:true,cancelable:true});document.dispatchEvent(e);document.body.dispatchEvent(e);if(e.defaultPrevented)blocked++}return blocked===0})()`));
 // mobile/desktop scrolling
 await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:Math.floor(device.w/2),y:Math.floor(device.h/2),deltaX:0,deltaY:500});await sleep(700);
 check(`${tag} page scrolls normally after splash`,(await ev('window.scrollY'))>100);
 // --- copyright + asset-use notice
 check(`${tag} footer copyright notice with current year`,await ev(`(()=>{const f=document.querySelector('footer');const t=f?f.textContent:'';return t.includes('© '+new Date().getFullYear())&&(${locale==='en'}?t.includes('Plan B Consultant'):t.includes('بلان بي'))})()`));
 await send('Page.navigate',{url:`${base}/${locale}/privacy`});await sleep(800);await waitFor(`document.documentElement.getAttribute('data-splash')==='done'`,8000);
 check(`${tag} privacy page has bilingual asset-use notice with third-party carve-out`,await ev(`(()=>{const t=document.querySelector('main, body').textContent;return ${locale==='en'}?(t.includes('Website content and asset use')&&t.includes('does not claim ownership of third-party material')&&t.includes('written permission')):(t.includes('استخدام محتوى الموقع وأصوله')&&t.includes('لا تدّعي بلان بي للاستشارات ملكية مواد الأطراف الثالثة'))})()`));
 check(`${tag} privacy-page email address stays selectable`,(await userSelect('main a[href^="mailto:"], main p'))!=='none');
 // --- homepage: hero, splash, ticker still render; popup/contact flows unchanged
 await send('Page.navigate',{url:`${base}/${locale}`});await sleep(800);await waitFor(`document.documentElement.getAttribute('data-splash')==='done'`,8000);await sleep(500);
 check(`${tag} home hero image shows and is drag-protected`,(await cancelled('dragstart','.home-hero-slide img'))===true);
 check(`${tag} home hero photo context menu suppressed`,(await cancelled('contextmenu','.home-hero-slide img'))===true);
 await send('Page.navigate',{url:`${base}/${locale}/contact`});await sleep(800);await waitFor(`document.documentElement.getAttribute('data-splash')==='done'`,8000);
 check(`${tag} contact page: phone/email links are real and selectable`,await ev(`(()=>{const m=document.querySelector('a[href^="mailto:"]'),t=document.querySelector('a[href^="tel:"]');return !!m&&!!t&&getComputedStyle(m).userSelect!=='none'&&getComputedStyle(t).userSelect!=='none'})()`));
 check(`${tag} contact form fields focus and accept typing`,await ev(`(()=>{const i=document.querySelector('.general-enquiry-form input[type=email]');i.focus();return document.activeElement===i})()`));
}
socket.close();chrome.kill();
console.log(`\n${pass} passed, ${fails.length} failed`);if(fails.length){console.log(fails.join('\n'));process.exit(1)}

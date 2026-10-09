// Splash loading-sequence QA in real Chrome (CDP): cache disabled, throttled network + CPU, desktop and mobile, EN + AR.
// Captures a screencast filmstrip of the load and pixel-checks every frame: the very first frame must be the splash
// (ceramic background, no green utility bar / header), never the website; then splash -> website exactly once.
//   node node_modules/next/dist/bin/next start -p 3405 ; node scripts/splash-filmstrip-qa.mjs
// Frames land in artifacts/splash-filmstrip/. Needs: sharp (dev dependency already present).
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import sharp from 'sharp';
const base=process.env.TEST_BASE_URL||'http://localhost:3405';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',port=9361;
const out='artifacts/splash-filmstrip';mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${mkdtempSync(join(tmpdir(),'pb-splash-'))}`,'--no-first-run','--disable-gpu','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<50;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await sleep(200)}
const socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);let seq=0;const pending=new Map();const listeners=[];
await new Promise(r=>socket.addEventListener('open',r,{once:true}));
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.rej(new Error(m.error.message)):p.res(m.result)}else listeners.forEach(l=>l(m))});
const send=(method,params={})=>new Promise((res,rej)=>{const id=++seq;pending.set(id,{res,rej});socket.send(JSON.stringify({id,method,params}))});
const ev=async expr=>{const r=await send('Runtime.evaluate',{returnByValue:true,awaitPromise:true,expression:expr});if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||'eval failed');return r.result.value};
await send('Page.enable');await send('Network.enable');await send('Runtime.enable');

/** Classifies a frame: 'splash' = ceramic page with no green utility bar; 'site' = green utility bar visible at top; 'blank' = near-white/empty. */
async function classify(buf){
 const {data,info}=await sharp(buf).raw().toBuffer({resolveWithObject:true});
 const px=(x,y)=>{const i=(y*info.width+x)*info.channels;return [data[i],data[i+1],data[i+2]]};
 const greenBar=[...Array(10)].filter((_,k)=>{const [r,g,b]=px(Math.floor(info.width*(0.1+k*0.08)),Math.min(12,info.height-1));return g>r+10&&g>b&&r<70&&g<110}).length>=6;
 const [r,g,b]=px(Math.floor(info.width/2),Math.floor(info.height*0.04));
 const ceramic=r>235&&g>235&&b>225&&r<=255;
 let emblem=0;for(let y=Math.floor(info.height*.25);y<Math.floor(info.height*.6);y+=6)for(let x=Math.floor(info.width*.3);x<Math.floor(info.width*.7);x+=6){const [rr,gg,bb]=px(x,y);if(gg>rr+15&&gg>bb+5&&gg<140)emblem++}
 let white=0,n=0;for(let y=0;y<info.height;y+=24)for(let x=0;x<info.width;x+=24){const [rr,gg,bb]=px(x,y);n++;if(rr>252&&gg>252&&bb>252)white++}
 let dark=0;for(let y=0;y<info.height;y+=24)for(let x=0;x<info.width;x+=24){const [rr,gg,bb]=px(x,y);if(rr<40&&gg<40&&bb<40&&Math.abs(rr-gg)<6&&Math.abs(gg-bb)<6)dark++}
 if(white/n>.97||dark/n>.97)return 'blank';
 return greenBar?'site':(ceramic?(emblem>40?'splash+logo':'splash'):'other');
}

const cases=[];
for(const locale of ['en','ar'])for(const device of [{name:'desktop',w:1280,h:800,mobile:false},{name:'mobile',w:390,h:844,mobile:true}])cases.push({locale,...device});
const results=[];let scriptId=null;
for(const c of cases){
 for(const variant of ['throttled','reduced-motion','no-js']){
  if(variant!=='throttled'&&c.name==='desktop'&&c.locale==='ar')continue;
  await send('Network.setCacheDisabled',{cacheDisabled:true});await send('Network.clearBrowserCache');
  await send('Emulation.setDeviceMetricsOverride',{width:c.w,height:c.h,deviceScaleFactor:c.mobile?2:1,mobile:c.mobile});
  await send('Emulation.setCPUThrottlingRate',{rate:variant==='throttled'?4:1});
  await send('Network.emulateNetworkConditions',{offline:false,latency:variant==='throttled'?150:20,downloadThroughput:variant==='throttled'?(1.6*1024*1024/8):-1,uploadThroughput:-1});
  await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:variant==='reduced-motion'?'reduce':'no-preference'}]});
  await send('Emulation.setScriptExecutionDisabled',{value:variant==='no-js'});
  await send('Page.navigate',{url:'about:blank'});await sleep(300);
  if(scriptId){await send('Page.removeScriptToEvaluateOnNewDocument',{identifier:scriptId});scriptId=null}
  if(variant!=='no-js')scriptId=(await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__log={states:[],activeCount:0};new MutationObserver(()=>{const s=document.documentElement.getAttribute('data-splash');const l=window.__log.states;if(s&&l[l.length-1]!==s){l.push(s);if(s==='active')window.__log.activeCount++}}).observe(document,{attributes:true,subtree:true,attributeFilter:['data-splash']});`})).identifier;
  const frames=[];const t0=Date.now();
  const listener=m=>{if(m.method==='Page.screencastFrame'){frames.push({t:Date.now()-t0,data:m.params.data});send('Page.screencastFrameAck',{sessionId:m.params.sessionId}).catch(()=>{})}};
  listeners.push(listener);
  await send('Page.startScreencast',{format:'jpeg',quality:60,everyNthFrame:1});
  await send('Page.navigate',{url:`${base}/${c.locale}`});
  await sleep(variant==='throttled'?6500:4500);
  await send('Page.stopScreencast');listeners.splice(listeners.indexOf(listener),1);
  const seq_=[];for(const f of frames){const b=Buffer.from(f.data,'base64');seq_.push({t:f.t,kind:await classify(b)})}
  const tag=`${c.locale}-${c.name}-${variant}`;
  [0,1,2,Math.floor(frames.length/2),frames.length-1].filter((v,i,a)=>v>=0&&v<frames.length&&a.indexOf(v)===i).forEach((i,k)=>writeFileSync(`${out}/${tag}-frame${k}.jpg`,Buffer.from(frames[i].data,'base64')));
  const log=variant==='no-js'?null:await ev('window.__log');
  const kinds=seq_.map(f=>f.kind).filter((k,i,a)=>k!=='blank'||a.slice(0,i).some(x=>x!=='blank'));
  while(kinds[0]==='blank')kinds.shift();
  const firstSite=kinds.indexOf('site'),lastSplash=kinds.lastIndexOf('splash')>kinds.lastIndexOf('splash+logo')?kinds.lastIndexOf('splash'):kinds.lastIndexOf('splash+logo');
  const final=await ev(`({splashInDom:!!document.querySelector('.brand-splash'),splashVisible:(()=>{const e=document.querySelector('.brand-splash');return !!e&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&Number(getComputedStyle(e).opacity)>0})(),state:document.documentElement.getAttribute('data-splash'),scrollLocked:getComputedStyle(document.documentElement).overflow,inert:document.getElementById('app-root')?.hasAttribute('inert'),header:!!document.querySelector('.final-masthead,.site-masthead,header'),h1:document.querySelectorAll('h1').length})`);
  const firstReal=seq_.find(f=>f.kind!=='blank');const logoAt=seq_.find(f=>f.kind==='splash+logo')?.t,siteAt=seq_.find(f=>f.kind==='site')?.t;
  const r={firstRealFrameMs:firstReal?.t,logoVisibleMs:logoAt,websiteRevealedMs:siteAt,case:tag,frames:frames.length,firstFrame:kinds[0],firstFrameAt:seq_[0]?.t,sequence:kinds.join(',').replace(/(splash\+logo|splash|site|other)(,\1)+/g,'$1 ×').slice(0,160),
   noWebsiteBeforeSplash:variant==='no-js'?true:(firstSite===-1||lastSplash===-1||lastSplash<firstSite),firstFrameIsNotSite:kinds[0]!=='site',
   splashRevealedOnce:variant==='no-js'?null:(log.activeCount===1&&log.states.join('>')==='active>leaving>done'),states:log?.states.join('>')||'(no JS)',final};
  results.push(r);
  console.log(JSON.stringify({case:r.case,firstFrame:r.firstFrame,firstRealMs:r.firstRealFrameMs,logoMs:r.logoVisibleMs,siteMs:r.websiteRevealedMs,seq:r.sequence,splashThenSite:r.noWebsiteBeforeSplash,states:r.states,final:r.final}));
 }
}
// interaction checks (desktop, normal speed): scroll lock, focus containment, click-through, reveal
await send('Emulation.setCPUThrottlingRate',{rate:1});await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await send('Emulation.setScriptExecutionDisabled',{value:false});await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
await send('Emulation.setDeviceMetricsOverride',{width:1280,height:800,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:`${base}/en`});await sleep(900);
for(let i=0;i<4;i++){await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:640,y:400,deltaX:0,deltaY:300});await sleep(60)}
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'PageDown',code:'PageDown',windowsVirtualKeyCode:34});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'PageDown',code:'PageDown',windowsVirtualKeyCode:34});await sleep(250);
const during=await ev(`(()=>{const ae=document.activeElement;const at=document.elementFromPoint(640,400);return {state:document.documentElement.getAttribute('data-splash'),scrollY:window.scrollY,elementAtCentreInsideSplash:!!at?.closest('.brand-splash'),inert:document.getElementById('app-root').hasAttribute('inert'),focusInApp:!!ae?.closest?.('#app-root'),topmostAtHeader:document.elementFromPoint(300,40)?.closest('.brand-splash')!==null}})()`);
for(let i=0;i<4;i++){await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab'});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab'})}
const focusDuring=await ev(`!!document.activeElement?.closest?.('#app-root')`);
await sleep(2600);
for(let i=0;i<3;i++){await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:640,y:400,deltaX:0,deltaY:300});await sleep(80)}await sleep(700);
const after=await ev(`({state:document.documentElement.getAttribute('data-splash'),splashInDom:!!document.querySelector('.brand-splash'),inert:document.getElementById('app-root').hasAttribute('inert'),scrollY:window.scrollY,overflow:getComputedStyle(document.documentElement).overflow})`);
const skip=await (async()=>{await send('Page.navigate',{url:`${base}/ar`});await sleep(700);await ev(`document.querySelector('.brand-splash').click()`);await sleep(900);return ev(`({state:document.documentElement.getAttribute('data-splash'),splashInDom:!!document.querySelector('.brand-splash')})`)})();
// client-side re-render / strict-mode: splash must never come back after done
await sleep(300);const later=await ev(`({state:document.documentElement.getAttribute('data-splash'),splashInDom:!!document.querySelector('.brand-splash')})`);
const checks={duringSplash:during,tabFocusInAppDuringSplash:focusDuring,afterSplash:after,clickToSkip:skip,staysGone:later};
console.log(JSON.stringify(checks));
socket.close();chrome.kill();
const fail=[];
for(const r of results){if(!r.case.endsWith('no-js')&&!r.firstFrameIsNotSite)fail.push(r.case+': first frame is the website');if(r.case.endsWith('no-js')&&(r.firstFrame!=='site'||r.final.splashVisible||r.final.h1!==1))fail.push(r.case+': no-JS fallback must show the website (and no splash) immediately');if(r.firstFrame==='other')fail.push(r.case+': first frame unclassified');if(r.case.endsWith('throttled')||r.case.endsWith('reduced-motion')){if(!r.noWebsiteBeforeSplash)fail.push(r.case+': website visible before splash ended');if(!r.splashRevealedOnce)fail.push(r.case+': states '+r.states);if(r.final.splashVisible||r.final.state!=='done'||r.final.inert)fail.push(r.case+': final state')}
 }
if(during.scrollY!==0||!during.elementAtCentreInsideSplash||!during.inert||focusDuring)fail.push('splash does not block scroll/interaction/focus');
if(after.state!=='done'||after.splashInDom||after.inert||after.scrollY<=0)fail.push('page not interactive after splash');
if(skip.state!=='done'||skip.splashInDom||later.splashInDom||later.state!=='done')fail.push('skip/re-appear');
writeFileSync(`${out}/results.json`,JSON.stringify({results,checks,fail},null,1));
console.log(fail.length?'FAIL\n'+fail.join('\n'):`PASS (${results.length} loads + interaction checks)`);
process.exit(fail.length?1:0);

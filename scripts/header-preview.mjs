import {writeFileSync} from 'node:fs';

const debuggerPort=Number(process.env.CHROME_DEBUG_PORT||9225);
const site=process.env.TEST_BASE_URL||'http://localhost:3105';
const targets=await (await fetch(`http://127.0.0.1:${debuggerPort}/json`)).json();
const target=targets.find(item=>item.type==='page');
if(!target)throw new Error('No Chrome page target found');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
await send('Page.enable');await send('Runtime.enable');
const cases=[360,390,768,1024,1280,1440].flatMap(width=>['en','ar'].map(locale=>[`${width}-${locale}`,width,width<700?800:900,locale,width<1200]));
const results=[];
for(const [name,width,height,locale,openMobile] of cases){
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}`});
 await new Promise(resolve=>setTimeout(resolve,2300));
 if(openMobile)await send('Runtime.evaluate',{expression:`document.querySelector('.mobile-nav-toggle')?.click()`});
 await new Promise(resolve=>setTimeout(resolve,250));
 const metrics=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const nav=[...document.querySelectorAll('.final-desktop-nav>a,.final-desktop-nav>.nav-dropdown>.nav-button')].map(e=>e.textContent.trim());const mobileRoot=document.querySelector('.mobile-nav-inner');const mobile=mobileRoot?[...mobileRoot.children].map(e=>e.tagName==='DETAILS'?e.querySelector(':scope>summary')?.textContent.trim():e.textContent.trim()):[];const cta=document.querySelector('.header-cta');const mobileCta=document.querySelector('.mobile-consultation');const toggle=document.querySelector('.mobile-nav-toggle');const visible=e=>!!e&&getComputedStyle(e).display!=='none'&&e.getBoundingClientRect().right<=innerWidth&&e.getBoundingClientRect().left>=0;return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth,desktopDisplay:getComputedStyle(document.querySelector('.final-desktop-nav')).display,desktopOrder:nav,mobileOrder:mobile,ctaVisible:visible(cta),mobileCtaVisible:visible(mobileCta),toggleVisible:visible(toggle),mobileOpen:document.querySelector('.final-mobile-panel')!==null,headerHeight:document.querySelector('.final-masthead').getBoundingClientRect().height}})()`});
 let dropdowns=[];if(width>=1200){const drop=await send('Runtime.evaluate',{awaitPromise:true,returnByValue:true,expression:`(async()=>{const out=[];for(const button of document.querySelectorAll('.nav-dropdown>.nav-button')){button.click();await new Promise(r=>setTimeout(r,30));const panel=button.parentElement.querySelector('.nav-panel');const rect=panel?.getBoundingClientRect();out.push({label:button.textContent.trim(),expanded:button.getAttribute('aria-expanded'),insideViewport:!!rect&&rect.left>=0&&rect.right<=innerWidth,top:rect?.top,right:rect?.right,left:rect?.left});button.click();await new Promise(r=>setTimeout(r,20))}return out})()`});dropdowns=drop.result.value}
 results.push({name,width,height,locale,...metrics.result.value,dropdowns});
 const previewNames=new Set(['1440-en','1440-ar','390-en','390-ar','360-ar']);if(previewNames.has(name)){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`artifacts/header-navigation/${name}.png`,Buffer.from(shot.data,'base64'))}
}
writeFileSync('artifacts/header-navigation/qa-results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));socket.close();

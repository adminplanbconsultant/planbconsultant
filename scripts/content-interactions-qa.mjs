import {writeFileSync,readFileSync} from 'node:fs';
const site=process.env.TEST_BASE_URL||'http://localhost:3108',port=process.env.CHROME_DEBUG_PORT||9228;
const target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
const evaluate=async expression=>(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
const wait=ms=>new Promise(r=>setTimeout(r,ms));await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
const results=[];
for(const locale of ['en','ar']){
 await send('Page.navigate',{url:`${site}/${locale}`});await wait(500);await evaluate("sessionStorage.removeItem('plan-b-intro-seen-v2');sessionStorage.setItem('plan-b-assessment-offered-v2','1');location.reload()");await wait(450);
 const splashVisible=await evaluate("!!document.querySelector('.brand-splash')");await wait(1800);const splashDismissed=await evaluate("!document.querySelector('.brand-splash')");
 const transform1=await evaluate("getComputedStyle(document.querySelector('.ticker-track')).transform");await wait(450);const transform2=await evaluate("getComputedStyle(document.querySelector('.ticker-track')).transform");
 await evaluate("document.querySelector('.ticker-control').click()");const paused=await evaluate("getComputedStyle(document.querySelector('.ticker-track')).animationPlayState==='paused'");
 await evaluate("document.querySelector('.ticker-control').click();document.activeElement.blur()");const resumed=await evaluate("getComputedStyle(document.querySelector('.ticker-track')).animationPlayState==='running'");
 const metadata=[];for(const page of ['about','services/business-immigration','services/residency-by-investment']){const html=await(await fetch(`${site}/${locale}/${page}`)).text();const title=html.match(/<title>(.*?)<\/title>/)?.[1];metadata.push({page,title});}
 results.push({locale,splashVisible,splashDismissed,tickerMoves:transform1!==transform2,paused,resumed,metadata});
}
const passed=results.every(r=>r.splashVisible&&r.splashDismissed&&r.tickerMoves&&r.paused&&r.resumed&&r.metadata.every(m=>m.title&&(r.locale!=='ar'||/[\u0600-\u06ff]/.test(m.title))));
writeFileSync('artifacts/content-completion/interaction-results.json',JSON.stringify({passed,results},null,2));
// Refresh metadata evidence after the metadata-only final build; layout captures are unchanged.
const qa=JSON.parse(readFileSync('artifacts/content-completion/qa-results.json','utf8'));
for(const r of qa.results){const html=await(await fetch(site+r.path)).text();r.title=html.match(/<title>(.*?)<\/title>/)?.[1]||r.title;}
writeFileSync('artifacts/content-completion/qa-results.json',JSON.stringify(qa,null,2));
console.log(JSON.stringify({passed,results},null,2));socket.close();if(!passed)process.exitCode=1;

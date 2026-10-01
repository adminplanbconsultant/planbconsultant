import {writeFileSync} from 'node:fs';
const site=process.env.TEST_BASE_URL||'http://localhost:3108',port=process.env.CHROME_DEBUG_PORT||9228;
const target=(await(await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((r,j)=>{socket.addEventListener('open',r,{once:true});socket.addEventListener('error',j,{once:true})});
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(pending.has(m.id)){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await send('Page.enable');await send('Network.enable');
const requests=[],responses=[];
socket.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.method==='Network.requestWillBeSent'&&m.params.request.url.endsWith('/api/enquiries'))requests.push({url:m.params.request.url,body:JSON.parse(m.params.request.postData)});if(m.method==='Network.responseReceived'&&m.params.response.url.endsWith('/api/enquiries'))responses.push(m.params.response.status)});
const fill=async(selector,value)=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('Missing '+${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:e.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event(e.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`);
const results=[];
for(const locale of ['en','ar'])for(const form of ['general','assessment','popup']){
 const path=form==='general'?'contact':form==='assessment'?'consultation?service=business-immigration':'';
 await send('Page.navigate',{url:`${site}/${locale}/${path}`});await wait(1600);
 if(form==='popup'){await evaluate("sessionStorage.removeItem('plan-b-assessment-offered-v2');location.reload()");await wait(2400);await evaluate("scrollTo(0,600);window.dispatchEvent(new Event('scroll'))");await wait(250);}
 if(form==='assessment'){await evaluate("document.querySelector('.assessment-form button[type=submit]').click()");await wait(100);await evaluate("document.querySelector('.skip-profile').click()");await wait(100);}
 const root=form==='general'?'.general-enquiry-form':form==='assessment'?'.assessment-form':'.quick-assessment';
 await fill(`${root} input${form==='assessment'?'[name=name]':'[id$="-name"]'}`,'Local QA Test');
 await fill(`${root} input[type=email]`,'qa@example.invalid');await fill(`${root} input[type=tel]`,'+96555555555');
 if(form==='general')await fill(`${root} textarea`,'Local unconfigured-form validation only.');
 if(form==='popup'){await fill(`${root} select[id$="-age"]`,'21–32');await fill(`${root} select[id$="-education"]`,'Diploma');await fill(`${root} input[id$="-profession"]`,'QA');}
 await evaluate(`document.querySelector('${root} input[type=checkbox]').click()`);
 await evaluate(`document.querySelector('${root} button[type=submit]').click()`);await wait(700);
 const result=await evaluate(`({error:document.querySelector('${root} [role=alert]')?.textContent,success:!!document.querySelector('.form-success,.quick-success')})`);
 results.push({locale,form,...result});
}
const passed=requests.length===6&&responses.length===6&&responses.every(s=>s===503)&&results.every(r=>r.error&&!r.success)&&requests.filter(r=>r.body.service==='business-immigration').length===2;
writeFileSync('artifacts/content-completion/form-results.json',JSON.stringify({passed,results,requests,responses},null,2));
console.log(JSON.stringify({passed,results,statuses:responses,requests:requests.length},null,2));socket.close();if(!passed)process.exitCode=1;

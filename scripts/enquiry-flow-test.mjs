// End-to-end enquiry test: the REAL website API (next start) against a MOCK Google Apps Script web app.
// The mock runs Code.gs in the vm harness and imitates the web app's POST -> 302 -> JSON behaviour.
// Nothing here talks to Google, sends email, or touches a real spreadsheet.
// Prerequisite: `npm run build`.   Run: node scripts/enquiry-flow-test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {createScript} from './apps-script-harness.mjs';

const SECRET='t'.repeat(48);
const MOCK_PORT=3301;
const script=createScript({secret:SECRET});
const mode={name:'normal',lostFirst:false,flakyLeft:0};
const sockets=new Set();
const echoes=new Map();
const mock=http.createServer((req,res)=>{
 sockets.add(req.socket);
 if(req.method==='GET'&&req.url.startsWith('/echo/')){const body=echoes.get(req.url.slice(6))??'';res.writeHead(200,{'Content-Type':'application/json'});return res.end(body)}
 if(req.method==='POST'&&req.url==='/exec'){
  let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{
   if(mode.name==='timeout')return; // never answers
   if(mode.name==='http500'){res.writeHead(500);return res.end('boom')}
   if(mode.flakyLeft>0){mode.flakyLeft--;res.writeHead(502);return res.end('bad gateway')}
   const out=script.post(raw);
   if(mode.lostFirst){mode.lostFirst=false;return req.socket.destroy()} // saved, but the answer never reaches the website
   let body=JSON.stringify(out);
   if(mode.name==='wrong-id')body=JSON.stringify({...out,id:randomUUID()});
   if(mode.name==='malformed')body='<html>Sorry, unable to open the file</html>';
   if(mode.name==='shape')body=JSON.stringify({ok:true,saved:true});
   const token=randomUUID();echoes.set(token,body);
   const location=mode.name==='evil-redirect'?'https://evil.example/steal':`http://127.0.0.1:${MOCK_PORT}/echo/${token}`;
   res.writeHead(302,{Location:location});res.end();
  });return;
 }
 res.writeHead(404);res.end();
});
await new Promise(r=>mock.listen(MOCK_PORT,'127.0.0.1',r));

let passed=0;const results=[];
const test=async(name,fn)=>{try{await fn();passed++;results.push('  ok  '+name);console.log('  ok  '+name)}catch(e){console.error('FAIL  '+name);throw e}};
const uuid=()=>randomUUID();
const wait=ms=>new Promise(r=>setTimeout(r,ms));

async function startSite(port,env){
 const logs=[];
 const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{env:{...process.env,PORT:String(port),GOOGLE_APPS_SCRIPT_URL:'',GOOGLE_APPS_SCRIPT_SECRET:'',TURNSTILE_SECRET_KEY:'',NEXT_PUBLIC_SITE_URL:'https://planbconsultant.com',...env},stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',d=>logs.push(String(d)));child.stderr.on('data',d=>logs.push(String(d)));
 for(let i=0;i<60;i++){try{const r=await fetch(`http://127.0.0.1:${port}/en`);if(r.ok)break}catch{}await wait(500)}
 return {base:`http://127.0.0.1:${port}`,logs,stop:()=>child.kill()};
}
const post=(site,body,headers={})=>fetch(site.base+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const quick=(o={})=>({source:'popup-short-assessment',id:uuid(),name:'Test Person',phone:'+96550001234',email:'',service:'skilled-immigration',programme:'canada-express-entry',locale:'en',consent:true,website:'',pagePath:'/en',...o});
const full=(o={})=>({source:'full-assessment',id:uuid(),programme:'canada-express-entry',service:'not-sure',destination:'Canada',age:'33–39',education:"Master’s degree",profession:'Nurse',nationality:'Kuwaiti',residence:'Kuwait',budget:'Not applicable',name:'Test Person',phone:'+965 5000 1234',email:'t@example.com',message:'Hello',website:'',consent:true,method:'whatsapp',offer:'not-sure',locale:'en',pagePath:'/en/consultation',...o});
const contact=(o={})=>({source:'contact-form',id:uuid(),name:'Test Person',email:'t@example.com',phone:'+965 5000 1234',service:'not-sure',message:'Please call me',consent:true,website:'',locale:'en',pagePath:'/en/contact',...o});
const rows=tab=>script.rows(tab);const total=()=>rows('Quick Assessments').length+rows('Full Assessments').length+rows('Contact Enquiries').length;
const resetThrottle=()=>script.state.cache.clear();
const find=(tab,id)=>{const h=script.headers(tab);const row=rows(tab).find(r=>r[0]===id);return row&&Object.fromEntries(h.map((n,i)=>[n,row[i]]))};

console.log('Website API + mock Apps Script');
let site=await startSite(3311,{GOOGLE_APPS_SCRIPT_URL:`http://127.0.0.1:${MOCK_PORT}/exec`,GOOGLE_APPS_SCRIPT_SECRET:SECRET});
try{
 await test('all three form types save in both languages and return a reference',async()=>{
  for(const locale of ['en','ar']){
   for(const [make,tab] of [[quick,'Quick Assessments'],[full,'Full Assessments'],[contact,'Contact Enquiries']]){
    resetThrottle();const p=make({locale,name:locale==='ar'?'سارة':'Test Person'});
    const r=await post(site,p);const j=await r.json();
    assert.equal(r.status,201,JSON.stringify(j));assert.equal(j.saved,true);assert.equal(j.reference,'PB-'+p.id.slice(0,8).toUpperCase());
    const row=find(tab,p.id);assert.ok(row,tab+' row');assert.equal(row.Language,locale==='ar'?'Arabic':'English');assert.equal(row['Full name'],p.name);assert.equal(row['Lead status'],'New');
   }
  }
  assert.equal(total(),6);assert.equal(script.state.sent.length,6,'one notification per saved enquiry');
 });

 await test('field mapping is accurate and nothing is fabricated for fields a form does not collect',async()=>{
  resetThrottle();const f=full({budget:'USD 70,000–149,999',programme:'usa-eb5',destination:'United States'});await post(site,f);
  const r=find('Full Assessments',f.id);assert.equal(r.Phone,'+96550001234','spaces removed, + kept');assert.equal(r.Programme,'USA EB-5 investor programme');assert.equal(r['Investment budget (USD)'],'USD 70,000–149,999');assert.equal(r['Form source'],'full-assessment');assert.equal(r['Page path'],'/en/consultation');
  const g=full();await post(site,g);assert.equal(find('Full Assessments',g.id)['Investment budget (USD)'],'','"Not applicable" is stored as blank');
  const q=quick({programme:'not-sure'});await post(site,q);assert.equal(find('Quick Assessments',q.id).Destination,'');
  const c=contact();await post(site,c);assert.equal(find('Contact Enquiries',c.id).Message,'Please call me');
 });

 await test('missing/invalid fields and consent are rejected (400) and nothing is saved',async()=>{
  const before=total();
  const bad=[quick({consent:false}),{...quick(),consent:undefined},quick({name:'A'}),quick({phone:'12345'}),quick({phone:'96550001234'}),quick({phone:'+9655000123456789012'}),quick({email:'nope'}),quick({service:'made-up'}),quick({programme:'made-up'}),{...quick(),id:'x'},{...quick(),locale:'fr'},quick({website:'http://spam.example'}),full({consent:false}),full({method:'email',email:''}),full({destination:'Atlantis'}),contact({message:'x'.repeat(2001)}),contact({service:'made-up'}),contact({consent:false}),{source:'popup-short-assessment'},{}];
  for(const p of bad){const r=await post(site,p);assert.equal(r.status,400,JSON.stringify(p).slice(0,100));assert.equal((await r.json()).code,'invalid')}
  assert.equal(total(),before);
  assert.equal((await post(site,'not json')).status,400);
 });

 await test('request guards: content type, foreign origin, body size',async()=>{
  assert.equal((await fetch(site.base+'/api/enquiries',{method:'POST',body:'x'})).status,415);
  assert.equal((await post(site,quick(),{Origin:'https://evil.example'})).status,403);
  assert.equal((await post(site,quick({message:'x'.repeat(13000)}))).status,413);
  resetThrottle();assert.equal((await post(site,quick(),{Origin:site.base})).status,201,'same-origin accepted');
 });

 await test('duplicate and parallel submissions with one id create one row, one email and one reference',async()=>{
  resetThrottle();const emails=script.state.sent.length;const p=contact();
  const out=await Promise.all(Array.from({length:8},()=>post(site,p).then(async r=>({status:r.status,body:await r.json()}))));
  assert.ok(out.every(o=>o.status===201&&o.body.saved===true&&o.body.reference===out[0].body.reference));
  assert.equal(rows('Contact Enquiries').filter(r=>r[0]===p.id).length,1);assert.equal(script.state.sent.length,emails+1);
  assert.equal(out.filter(o=>!o.body.duplicate).length,1);
 });

 await test('formula injection sent through the API is neutralised in the sheet',async()=>{
  resetThrottle();const p=contact({name:'=1+1',message:'=HYPERLINK("http://evil.example")'});await post(site,p);
  const r=find('Contact Enquiries',p.id);assert.equal(r['Full name'],"'=1+1");assert.equal(r.Message,"'=HYPERLINK(\"http://evil.example\")");
 });

 await test('saved enquiry with failed notification still succeeds for the visitor; trigger later delivers',async()=>{
  resetThrottle();script.config.mailFail=true;const p=quick();const r=await post(site,p);
  assert.equal(r.status,201);assert.equal((await r.json()).saved,true);
  assert.equal(find('Quick Assessments',p.id)['Notification status'],'Failed');
  script.config.mailFail=false;const sent=script.state.sent.length;script.run('retryPendingNotifications');
  assert.equal(find('Quick Assessments',p.id)['Notification status'],'Sent');assert.equal(script.state.sent.length,sent+1);
 });

 await test('visitor responses never expose spreadsheet links, secrets or configuration details',async()=>{
  resetThrottle();const ok=await (await post(site,quick())).text();assert.ok(!/docs\.google|spreadsheet|secret|script|SHEET123|Notification/i.test(ok),ok);
  script.config.secret='z'.repeat(48);const bad=await post(site,quick());const text=await bad.text();script.config.secret=SECRET;
  assert.equal(bad.status,503);assert.ok(!/google|script|secret|unauthorized|127\.0\.0\.1|exec/i.test(text),text);
 });

 await test('wrong shared secret: 503 and nothing saved',async()=>{
  resetThrottle();const before=total();script.config.secret='z'.repeat(48);const r=await post(site,quick());script.config.secret=SECRET;
  assert.equal(r.status,503);assert.equal((await r.json()).code,'not-configured');assert.equal(total(),before);
 });

 await test('Apps Script returns an error object: not treated as success',async()=>{
  resetThrottle();script.config.lockBusy=true;const r=await post(site,quick());script.config.lockBusy=false;assert.equal(r.status,503);assert.equal((await r.json()).code,'unavailable');
 });

 for(const name of ['malformed','shape','wrong-id','http500','evil-redirect']){
  await test(`unreadable/invalid Apps Script response (${name}) is never reported as success`,async()=>{
   resetThrottle();const before=total();mode.name=name;const r=await post(site,quick());const body=await r.json();mode.name='normal';
   assert.equal(r.status,503);assert.equal(body.saved,undefined);assert.equal(body.code,'unavailable');
   if(name==='malformed'||name==='shape'||name==='wrong-id')assert.ok(total()>=before,'row may exist (unconfirmed) but visitor was told to retry');
  });
 }

 await test('timeout: bounded wait, 503, and the same id succeeds on retry',async()=>{
  resetThrottle();const p=quick();mode.name='timeout';const t0=Date.now();const r=await post(site,p);const ms=Date.now()-t0;mode.name='normal';
  for(const s of sockets)s.destroy();sockets.clear();
  assert.equal(r.status,503);assert.ok(ms<26000,'bounded: '+ms);
  const retry=await post(site,p);assert.equal(retry.status,201);assert.equal(rows('Quick Assessments').filter(x=>x[0]===p.id).length,1);
 });

 await test('transient failure is retried inside the request with the same id (one row)',async()=>{
  resetThrottle();const p=full();mode.flakyLeft=1;const r=await post(site,p);assert.equal(r.status,201);assert.equal(rows('Full Assessments').filter(x=>x[0]===p.id).length,1);
 });

 await test('uncertain outcome (saved but answer lost) resolves to the existing reference, no duplicate row or email',async()=>{
  resetThrottle();const p=contact();const emails=script.state.sent.length;mode.lostFirst=true;const r=await post(site,p);const j=await r.json();
  assert.equal(r.status,201);assert.equal(j.saved,true);assert.equal(j.duplicate,true);assert.equal(rows('Contact Enquiries').filter(x=>x[0]===p.id).length,1);assert.equal(script.state.sent.length,emails+1);
 });

 await test('throttling: the 9th new enquiry from one visitor in an hour gets 429',async()=>{
  resetThrottle();let last;for(let i=0;i<9;i++)last=await post(site,quick({phone:'+9655100'+String(1000+i)}));
  assert.equal(last.status,429);assert.equal(last.headers.get('retry-after'),'3600');assert.equal((await last.json()).code,'throttled');
 });

 await test('server logs contain no personal data or secrets',async()=>{
  const text=site.logs.join('');for(const needle of [SECRET,'96550001234','Test Person','t@example.com','Please call me'])assert.ok(!text.includes(needle),'log leaked '+needle);
 });
}finally{site.stop();await wait(500)}

site=await startSite(3312,{});
try{
 await test('missing configuration: honest 503, nothing claimed as saved',async()=>{
  const r=await post(site,quick());const j=await r.json();assert.equal(r.status,503);assert.equal(j.code,'not-configured');assert.equal(j.saved,undefined);
  assert.equal((await post(site,{})).status,400,'validation still runs first');
 });
}finally{site.stop();await wait(500)}

site=await startSite(3313,{GOOGLE_APPS_SCRIPT_URL:`http://127.0.0.1:${MOCK_PORT}/exec`,GOOGLE_APPS_SCRIPT_SECRET:SECRET,TURNSTILE_SECRET_KEY:'dummy-secret-not-sent-anywhere'});
try{
 await test('Turnstile enabled: a request without a token is rejected before anything is saved',async()=>{
  resetThrottle();const before=total();const r=await post(site,quick());assert.equal(r.status,400);assert.equal((await r.json()).code,'verification');assert.equal(total(),before);
 });
}finally{site.stop()}

await test('no server-only names or secrets reach the browser bundles',()=>{
 const walk=d=>readdirSync(d).flatMap(f=>{const p=join(d,f);return statSync(p).isDirectory()?walk(p):p.endsWith('.js')?[p]:[]});
 for(const f of walk('.next/static')){const t=readFileSync(f,'utf8');for(const needle of ['GOOGLE_APPS_SCRIPT_SECRET','GOOGLE_APPS_SCRIPT_URL','TURNSTILE_SECRET_KEY','script.google.com'])assert.ok(!t.includes(needle),f+' contains '+needle)}
});

mock.close();for(const s of sockets)s.destroy();
console.log(`\n${passed} website/API flow tests passed against a MOCK Apps Script (no live Google services used).`);
process.exit(0);

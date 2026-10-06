// MOCKED tests of integrations/google-apps-script/Code.gs (Google services are in-memory fakes).
// Run: node scripts/apps-script-tests.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {createScript} from './apps-script-harness.mjs';

const SECRET='k'.repeat(40);
let passed=0;
const test=async(name,fn)=>{try{await fn();passed++;console.log('  ok  '+name)}catch(e){console.error('FAIL  '+name);throw e}};
const ref=id=>'PB-'+id.slice(0,8).toUpperCase();
const base=(over={})=>{const id=randomUUID();return {id,reference:ref(id),pagePath:'/en',locale:'en',name:'Test Person',phone:'+96550001234',email:'test@example.com',service:'skilled-immigration',consent:true,consentVersion:'2026-10-v1',clientKey:'a'.repeat(64),secret:SECRET,...over}};
const quick=(o={})=>base({formType:'quick',source:'popup-short-assessment',programme:'canada-express-entry',destination:'Canada',...o});
const full=(o={})=>base({formType:'full',source:'full-assessment',programme:'canada-express-entry',destination:'Canada',offer:'not-sure',method:'whatsapp',age:'33–39',education:"Master’s degree",profession:'Nurse',nationality:'Kuwaiti',residence:'Kuwait',budget:'',message:'Hello',...o});
const contact=(o={})=>base({formType:'contact',source:'contact-form',message:'Please call me',...o});
const fresh=()=>createScript({secret:SECRET});
const col=(s,tab,name)=>s.headers(tab).indexOf(name);

console.log('Apps Script (mocked Google services)');

await test('allow-lists in Code.gs match the website data',()=>{execFileSync('node',['scripts/sync-apps-script-lists.mjs','--check'],{stdio:'pipe'})});

await test('three tabs are created with the expected headers, never overwriting',()=>{
 const s=fresh();
 for(const [make,tab] of [[quick,'Quick Assessments'],[full,'Full Assessments'],[contact,'Contact Enquiries']]){
  const r=s.post(make());assert.equal(r.ok,true);assert.equal(r.saved,true);
  const h=s.headers(tab);
  for(const name of ['Submission ID','Reference','Received (UTC)','Received (Kuwait)','Form source','Page path','Language','Full name','Phone','Email','Consent','Consent timestamp (UTC)','Consent text version','Lead status','Notification status','Notification attempts','Last attempt (UTC)','Sent (UTC)'])assert.ok(h.includes(name),tab+' missing '+name);
 }
 const sheet=s.state.sheets.get('Quick Assessments');sheet.rows[0][0]='Something else';
 assert.equal(s.post(quick()).code,'server','a tab holding other data must not be overwritten');
});

await test('rows map the submitted fields accurately and start as New / Pending→Sent',()=>{
 const s=fresh();const p=full({message:'Line1\nLine2'});const r=s.post(p);
 assert.deepEqual([r.ok,r.saved,r.duplicate,r.reference],[true,true,false,ref(p.id)]);assert.equal(r.notification,'Sent');
 const row=s.rows('Full Assessments')[0],h=s.headers('Full Assessments'),g=n=>row[h.indexOf(n)];
 assert.equal(g('Submission ID'),p.id);assert.equal(g('Phone'),'+96550001234');assert.equal(g('Language'),'English');
 assert.equal(g('Category'),'Skilled immigration');assert.equal(g('Programme'),'Canada Express Entry');assert.equal(g('Destination'),'Canada');
 assert.equal(g('Age range'),'33–39');assert.equal(g('Job designation'),'Nurse');assert.equal(g('Additional information'),'Line1\nLine2');
 assert.equal(g('Consent'),'Yes');assert.equal(g('Consent text version'),'2026-10-v1');assert.equal(g('Lead status'),'New');
 assert.equal(g('Notification status'),'Sent');assert.equal(g('Notification attempts'),'1');
 assert.match(g('Received (UTC)'),/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/);
 const utc=Date.parse(g('Received (UTC)').replace(' ','T')+'Z'),kw=Date.parse(g('Received (Kuwait)').replace(' ','T')+'Z');assert.equal(kw-utc,3*3600000);
 assert.ok(row.every(v=>typeof v==='string'),'every cell is stored as text');
 const q=fresh();const quickPayload=quick({service:'not-sure',programme:'not-sure',destination:''});q.post(quickPayload);
 const qh=q.headers('Quick Assessments'),qr=q.rows('Quick Assessments')[0];assert.equal(qr[qh.indexOf('Category')],'Not sure');assert.equal(qr[qh.indexOf('Destination')],'');
 assert.ok(!qh.includes('Age range'),'quick tab has no profile columns; nothing is fabricated');
 const c=fresh();c.post(contact({locale:'ar'}));assert.equal(c.rows('Contact Enquiries')[0][c.headers('Contact Enquiries').indexOf('Language')],'Arabic');
});

await test('phone numbers keep "+" and leading zeros (stored as text)',()=>{
 const s=fresh();const p=quick({phone:'+96500123456'});s.post(p);
 const sheet=s.state.sheets.get('Quick Assessments');const row=s.rows('Quick Assessments')[0];
 assert.equal(row[col(s,'Quick Assessments','Phone')],'+96500123456');
 assert.equal(sheet.formats.get(`2,${col(s,'Quick Assessments','Phone')+1}`),'@');
});

await test('spreadsheet formula injection is neutralised in every user-controlled column',()=>{
 const s=fresh();const evil='=HYPERLINK("http://evil.example","x")';
 const p=full({name:'=cmd|calc',email:'-1@example.com'.replace('-','a'),profession:'@SUM(1,1)',nationality:'+1+1',residence:'\t=1',budget:"'=1",message:evil,pagePath:'/en'});
 assert.equal(s.post(p).ok,true);
 const row=s.rows('Full Assessments')[0],h=s.headers('Full Assessments'),g=n=>row[h.indexOf(n)];
 for(const [name,original] of [['Full name','=cmd|calc'],['Job designation','@SUM(1,1)'],['Nationality','+1+1'],['Country of residence','\t='.slice(0,0)+'=1'],['Investment budget (USD)',"'=1"],['Additional information',evil]]){
  assert.ok(g(name).startsWith("'"),name+' must start with an apostrophe: '+g(name));
  assert.equal(g(name).slice(1),original.replace(/^\t/,''),name);
 }
 const sheet=s.state.sheets.get('Full Assessments');
 assert.equal(sheet.formats.get('2,1'),'@','plain-text format applied');
 // notification shows the original text, HTML-escaped, never the apostrophe
 const mail=s.state.sent[0];assert.ok(mail.htmlBody.includes('=HYPERLINK(&quot;http://evil.example&quot;,&quot;x&quot;)'));assert.ok(!mail.htmlBody.includes("'=HYPERLINK"));
});

await test('validation rejects missing/invalid input without writing a row',()=>{
 const s=fresh();
 const bad=[
  quick({consent:false}),quick({consent:undefined}),quick({name:'A'}),quick({phone:'0096550001234'}),quick({phone:'12345'}),quick({phone:'+96550001234567890'}),
  quick({email:'not-an-email'}),quick({id:'not-a-uuid'}),quick({locale:'fr'}),quick({service:'made-up'}),quick({programme:'made-up'}),quick({destination:'Atlantis'}),
  quick({source:'full-assessment'}),quick({formType:'other'}),quick({consentVersion:'<script>'}),quick({pagePath:'http://evil.example'}),quick({clientKey:'zz'}),
  full({method:'carrier-pigeon'}),full({offer:'maybe'}),full({method:'email',email:''}),contact({service:'made-up'}),quick({name:'x'.repeat(101)}),contact({message:'x'.repeat(2001)}),quick({name:12345})
 ];
 for(const p of bad)assert.equal(s.post(p).code,'invalid',JSON.stringify(p).slice(0,120));
 assert.equal(s.post('{not json').code,'invalid');assert.equal(s.post('[]').code,'invalid');assert.equal(s.post('x'.repeat(16000)).code,'invalid');
 assert.equal(s.rows('Quick Assessments').length+s.rows('Full Assessments').length+s.rows('Contact Enquiries').length,0);
});

await test('optional fields are not required (no email on quick, skipped profile on full)',()=>{
 const s=fresh();
 assert.equal(s.post(quick({email:''})).ok,true);
 assert.equal(s.post(full({age:'',education:'',profession:'',nationality:'',residence:'',message:'',budget:''})).ok,true);
});

await test('wrong or missing shared secret is rejected and writes nothing',()=>{
 const s=fresh();
 assert.equal(s.post(quick({secret:'wrong'.repeat(10)})).code,'unauthorized');
 assert.equal(s.post(quick({secret:undefined})).code,'unauthorized');
 assert.equal(s.post(quick({secret:SECRET+'x'})).code,'unauthorized');
 assert.equal(s.state.sheets.size,0);assert.equal(s.state.sent.length,0);
 const noSecret=createScript({secret:''});assert.equal(noSecret.post(quick()).code,'unauthorized');
});

await test('doGet exposes no lead data',()=>{const s=fresh();s.post(quick());assert.deepEqual(s.get(),{ok:true,service:'plan-b-enquiries'})});

await test('duplicate / retried submissions return the existing reference and never add a second row or email',()=>{
 const s=fresh();const p=quick();const a=s.post(p),b=s.post(p),c=s.post({...p,name:'Changed Name'});
 assert.equal(a.duplicate,false);assert.equal(b.duplicate,true);assert.equal(c.duplicate,true);assert.equal(b.reference,a.reference);
 assert.equal(s.rows('Quick Assessments').length,1);assert.equal(s.state.sent.length,1);
 assert.equal(s.rows('Quick Assessments')[0][col(s,'Quick Assessments','Full name')],'Test Person','first acknowledged write wins');
});

await test('parallel requests with one id produce exactly one row (executions are serialised by the lock; mocked sequentially)',async()=>{
 const s=fresh();const p=contact();const out=await Promise.all(Array.from({length:10},()=>Promise.resolve().then(()=>s.post(p))));
 assert.equal(out.filter(r=>!r.duplicate).length,1);assert.equal(s.rows('Contact Enquiries').length,1);assert.equal(s.state.sent.length,1);assert.equal(s.state.lockViolations,0);
});

await test('lock contention returns busy and writes nothing',()=>{const s=fresh();s.config.lockBusy=true;assert.equal(s.post(quick()).code,'busy');s.config.lockBusy=false;assert.equal(s.rows('Quick Assessments').length,0)});

await test('throttle: per-visitor and per-phone limits, retries of saved enquiries are free',()=>{
 const s=fresh();const key='b'.repeat(64);
 for(let i=0;i<8;i++)assert.equal(s.post(quick({clientKey:key,phone:'+9655000'+String(1000+i)})).ok,true);
 assert.equal(s.post(quick({clientKey:key,phone:'+96550009999'})).code,'throttled');
 const dup=quick({clientKey:'c'.repeat(64)});s.post(dup);assert.equal(s.post(dup).duplicate,true);
 const phone=fresh();for(let i=0;i<5;i++)assert.equal(phone.post(quick({clientKey:String(i).repeat(64),phone:'+96551112222'})).ok,true);
 assert.equal(phone.post(quick({clientKey:'e'.repeat(64),phone:'+96551112222'})).code,'throttled');
});

await test('notification email: subject, recipient, Reply-To, WhatsApp link, spreadsheet link, escaping, plain-text fallback',()=>{
 const s=fresh();const p=full({name:'<b>Eve</b> & Co',message:'<img src=x onerror=alert(1)>',email:'eve@example.com'});s.post(p);
 const m=s.state.sent[0];
 assert.equal(m.to,'info@planbconsultant.com');assert.equal(m.subject,`New Full Assessment — Plan B Consultant — ${ref(p.id)}`);
 assert.equal(m.replyTo,'eve@example.com');assert.equal(m.name,'Plan B Website');assert.ok(!('from' in m),'sender is never spoofed');
 assert.ok(m.htmlBody.includes('https://wa.me/96550001234?text='));assert.ok(m.htmlBody.includes('Contact this lead on WhatsApp'));
 assert.ok(m.htmlBody.includes('https://docs.google.com/spreadsheets/d/SHEET123/edit#gid='));
 assert.ok(m.htmlBody.includes('&lt;b&gt;Eve&lt;/b&gt; &amp; Co')&&!m.htmlBody.includes('<img src=x'));
 assert.ok(m.body.includes('Contact on WhatsApp: https://wa.me/96550001234')&&m.body.includes('Consent: Given'));
 const noMail=fresh();noMail.post(quick({email:''}));assert.ok(!('replyTo' in noMail.state.sent[0]),'no Reply-To without a valid visitor email');
 const subjects=[['Quick',quick()],['Contact',contact()]].map(([label,pl])=>{const t=fresh();t.post(pl);return t.state.sent[0].subject});
 assert.match(subjects[0],/^New Quick Assessment — Plan B Consultant — PB-/);assert.match(subjects[1],/^New Contact Enquiry — Plan B Consultant — PB-/);
 const ar=fresh();ar.post(contact({locale:'ar',name:'سارة'}));assert.ok(decodeURIComponent(ar.state.sent[0].htmlBody.match(/text=([^"&]+)/)[1]).includes('مرحباً سارة'));
});

await test('saved enquiry survives a failed notification, is retried by the trigger, and ends Sent',()=>{
 const s=fresh();s.config.mailFail=true;const p=quick();const r=s.post(p);
 assert.equal(r.ok,true);assert.equal(r.saved,true);assert.equal(r.notification,'Failed');
 let row=()=>s.rows('Quick Assessments')[0],h=s.headers('Quick Assessments'),g=n=>row()[h.indexOf(n)];
 assert.equal(g('Notification attempts'),'1');assert.equal(g('Last notification error'),'mail_error');assert.ok(!JSON.stringify(row()).includes('Service failure'),'no raw error text (it can contain addresses)');
 s.config.mailFail=false;s.run('retryPendingNotifications');
 assert.equal(g('Notification status'),'Sent');assert.equal(g('Notification attempts'),'2');assert.ok(g('Sent (UTC)'));assert.equal(s.state.sent.length,1);
 s.run('retryPendingNotifications');assert.equal(s.state.sent.length,1,'no re-send once Sent');
});

await test('notification retries are bounded (Exhausted after 5 attempts)',()=>{
 const s=fresh();s.config.mailFail=true;s.post(quick());
 for(let i=0;i<10;i++)s.run('retryPendingNotifications');
 const h=s.headers('Quick Assessments'),row=s.rows('Quick Assessments')[0];
 assert.equal(row[h.indexOf('Notification status')],'Exhausted');assert.equal(row[h.indexOf('Notification attempts')],'5');
});

await test('email quota exhaustion keeps the lead Pending without burning attempts',()=>{
 const s=fresh();s.config.quota=0;const r=s.post(quick());assert.equal(r.saved,true);assert.equal(r.notification,'Pending');
 const h=s.headers('Quick Assessments'),row=()=>s.rows('Quick Assessments')[0];
 assert.equal(row()[h.indexOf('Notification attempts')],'0');assert.equal(row()[h.indexOf('Last notification error')],'quota');
 s.run('retryPendingNotifications');assert.equal(row()[h.indexOf('Notification status')],'Pending');
 s.config.quota=50;s.run('retryPendingNotifications');assert.equal(row()[h.indexOf('Notification status')],'Sent');assert.equal(s.state.sent.length,1);
});

await test('concurrent notification processing: a fresh "Sending" claim blocks a second sender; a stale one is retried',()=>{
 const s=fresh();s.config.mailFail=true;const p=quick();s.post(p);s.config.mailFail=false;
 const sheet=s.state.sheets.get('Quick Assessments'),h=s.headers('Quick Assessments');
 const set=(n,v)=>{sheet.rows[1][h.indexOf(n)]=v};
 const now=new Date(Date.now()).toISOString().slice(0,19).replace('T',' ');
 set('Notification status','Sending');set('Last attempt (UTC)',now);
 s.run('retryPendingNotifications');assert.equal(s.state.sent.length,0,'fresh claim is respected');
 s.config.offsetMs=11*60*1000;s.run('retryPendingNotifications');
 assert.equal(s.state.sent.length,1,'stale claim retried');assert.equal(sheet.rows[1][h.indexOf('Notification status')],'Sent');
});

await test('retry trigger can be installed idempotently',()=>{
 const s=fresh();s.run('setupRetryTrigger');s.run('setupRetryTrigger');assert.equal(s.state.triggers.length,1);assert.equal(s.state.triggers[0].minutes,15);
 s.run('setup');assert.equal(s.state.sheets.size,3);
});

console.log(`\n${passed} Apps Script tests passed (mocked Google services).`);

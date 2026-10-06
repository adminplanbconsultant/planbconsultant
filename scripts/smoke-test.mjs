import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const overviewCode=ts.transpileModule(readFileSync('lib/service-overviews.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const overviewUrl='data:text/javascript;base64,'+Buffer.from(overviewCode).toString('base64');
const code=ts.transpileModule(readFileSync('lib/content.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText.replace("'./service-overviews'",JSON.stringify(overviewUrl));
const {services,countries,guides,slugify}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const programmeCode=ts.transpileModule(readFileSync('lib/programmes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {programmes}=await import('data:text/javascript;base64,'+Buffer.from(programmeCode).toString('base64'));
const paths=['programmes',...programmes.map(p=>'programmes/'+p.slug),'','about','services','destinations','resources','consultation','contact','privacy','faqs',...services.map(s=>'services/'+s.slug),...countries.map(c=>'destinations/'+slugify(c[0])),...guides.map(g=>'resources/'+g.slug)];
let pages=0;
for(const locale of ['en','ar']){
 for(const path of paths){const r=await fetch(base+'/'+locale+(path?'/'+path:''));assert.equal(r.status,200,locale+'/'+path);const html=await r.text();assert(html.includes('Plan B'));pages++}
}
assert.equal((await fetch(base+'/en/missing-page')).status,404);
assert.equal((await fetch(base+'/fr')).status,404);
for(const asset of ['/images/plan-b-header-crest-en.png','/images/social/plan-b-share-v3-en.jpg','/images/social/plan-b-share-v3-ar.jpg','/images/plan-b-crest-512.png','/images/icon-192.png','/favicon.ico','/manifest.webmanifest']){const r=await fetch(base+asset);assert.equal(r.status,200,asset)}
assert.equal((await fetch(base+'/images/logo.jpg')).status,404,'retired old logo must not be served');
const post=(body,headers={})=>fetch(base+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body)});
assert.equal((await post({})).status,400);
assert.equal((await post({},{Origin:'https://untrusted.example'})).status,403);
assert.equal((await post({message:'x'.repeat(13000)})).status,413);
assert.equal((await fetch(base+'/api/enquiries',{method:'POST',body:'plain'})).status,415);
if(!process.env.GOOGLE_APPS_SCRIPT_URL){const r=await post({id:crypto.randomUUID(),name:'Test Person',phone:'+96555555555',email:'',service:'not-sure',destination:'Not sure yet',offer:'not-sure',method:'phone',message:'',website:'',consent:true,locale:'en'});assert.equal(r.status,503,'unconfigured form must not claim success')}
console.log(`${pages} bilingual pages passed; 404s, logo, API validation, origin and body limits passed.`);

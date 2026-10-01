import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import ts from 'typescript';
import {loadContent} from './seo-content-loader.mjs';
const {indexablePaths,routePaths,origin,eligiblePath,pageCopy}=await loadContent();
const {summary,rows}=JSON.parse(readFileSync('artifacts/search-visibility/after-inventory.json','utf8'));
assert.equal(rows.length,routePaths.length*2);assert.equal(summary.prerenderedPages,rows.length);assert.equal(summary.failures.length,0);
const checks=[];
for(const r of rows){
 const graph=r.schemas.flatMap(s=>s['@graph']||[]),ids=new Set(graph.map(n=>n['@id']));
 assert(graph.length>=4,r.route+' graph');assert.equal(ids.size,graph.length,r.route+' unique IDs');
 for(const n of graph){assert(n['@id'].startsWith(origin));for(const key of ['provider','publisher','isPartOf','breadcrumb','mainEntityOfPage'])if(n[key])assert(ids.has(n[key]['@id']),r.route+' reference '+key);assert(!['AggregateRating','Review','LocalBusiness'].includes(n['@type']));}
 const org=graph.find(n=>n['@type']==='Organization');assert.equal(org.name,'Plan B Consultant');assert(org.logo.url.startsWith(origin));assert(!org.address&&!org.geo&&!org.openingHours);
 const service=graph.find(n=>n['@type']==='Service');if(service){assert(service.name&&service.description&&service.provider&&service.url);assert(r.headings.some(h=>h.level===1&&h.text===service.name));}
 const article=graph.find(n=>n['@type']==='Article');if(article){assert(article.headline&&article.publisher&&article.mainEntityOfPage);assert(!article.author&&!article.datePublished);}
 const breadcrumb=graph.find(n=>n['@type']==='BreadcrumbList');assert(breadcrumb.itemListElement.every((n,i)=>n.position===i+1&&n.name&&n.item.startsWith(origin)));
 const counterpart=rows.find(s=>s.route===r.route.replace(/^\/(en|ar)/,r.route.startsWith('/en')?'/ar':'/en'));assert(counterpart);assert.equal(counterpart.alternates[r.htmlLang],r.canonical);
 checks.push({route:r.route,nodes:graph.length,types:graph.map(n=>n['@type']),result:'pass'});
}
const sitemap=summary.special.find(s=>s.route==='/sitemap.xml').body;
const locs=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.deepEqual(new Set(locs),new Set(rows.filter(r=>!r.robots.includes('noindex')).map(r=>r.canonical)));
assert.equal((sitemap.match(/hreflang="en"/g)||[]).length,locs.length);assert.equal((sitemap.match(/hreflang="ar"/g)||[]).length,locs.length);assert(!sitemap.includes('<lastmod>'));
assert.equal(summary.special.find(s=>s.route==='/').status,308);assert.equal(summary.special.find(s=>s.route==='/').location,'/en');
// Test that a runtime caller cannot attach personal form fields to the integration payload.
const code=ts.transpileModule(readFileSync('lib/conversion-events.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const events=[];globalThis.window={dispatchEvent:e=>events.push(e.detail)};globalThis.CustomEvent=class{constructor(type,{detail}){this.detail=detail}};
const {emitConversion}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
emitConversion('assessment_step_completed',{locale:'ar',step:2,name:'PRIVATE',email:'private@example.test',phone:'PRIVATE',message:'PRIVATE'});emitConversion('phone_click',{locale:'en',step:99});
assert.deepEqual(events,[{event:'assessment_step_completed',locale:'ar',step:2},{event:'phone_click',locale:'en'}]);delete globalThis.window;
writeFileSync('artifacts/search-visibility/structured-data-checks.json',JSON.stringify({validatedPages:checks.length,scope:'Local syntax, property, entity-reference and rendered-content agreement checks; not an external rich-results submission',checks},null,2));
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
writeFileSync('artifacts/search-visibility/route-inventory.csv',[['Route','Status','Indexable','Title','Description','H1','Canonical','English','Arabic','Schema types'].map(csv).join(','),...rows.map(r=>[r.route,r.status,!r.robots.includes('noindex'),r.title,r.description,r.headings.find(h=>h.level===1)?.text,r.canonical,r.alternates.en,r.alternates.ar,r.schemas.flatMap(s=>s['@graph']||[]).map(n=>n['@type']).join('; ')].map(csv).join(','))].join('\n'));
writeFileSync('artifacts/search-visibility/keyword-page-inventory.csv',[['Path','English primary intent','Arabic primary intent','Eligible','Policy'].map(csv).join(','),...routePaths.map(path=>[path||'home',pageCopy('en',path).title,pageCopy('ar',path).title,eligiblePath(path),eligiblePath(path)?'Distinct service / route / editorial / navigation intent':'Hold for confirmed substantive coverage'].map(csv).join(','))].join('\n'));
copyFileSync('artifacts/search-visibility/after-inventory.json','artifacts/search-visibility/production-inventory.json');
console.log(JSON.stringify({renderedPages:rows.length,prerendered:summary.prerenderedPages,indexable:summary.indexable,eligible:indexablePaths.length*2,sitemapEntries:locs.length,structuredData:'pass',conversionPrivacy:'pass',reciprocalAlternates:'pass',redirects:'pass'},null,2));

import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {loadContent} from './seo-content-loader.mjs';
const content=await loadContent();
const paths=content.routePaths||['','programmes','about','services','destinations','resources','consultation','contact','privacy','faqs',...content.programmes.map(p=>'programmes/'+p.slug),...content.services.map(p=>'services/'+p.slug),...content.countries.map(c=>'destinations/'+content.slugify(c[0])),...content.guides.map(g=>'resources/'+g.slug)];
const base=process.env.TEST_BASE_URL||'http://localhost:3100',phase=process.env.SEO_PHASE||'before';
const out='artifacts/search-visibility';mkdirSync(out,{recursive:true});
const decode=s=>s.replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,'');
const attr=(s,k)=>s.match(new RegExp(`${k}="([^"]*)"`))?.[1]||'';
const rows=[],failures=[],links=new Set();
for(const locale of ['en','ar'])for(const path of paths){
 const route='/'+locale+(path?'/'+path:'');const start=performance.now();const r=await fetch(base+route);const html=await r.text();
 const tags=html.match(/<(?:meta|link)\b[^>]*>/g)||[];
 const find=(k,v)=>tags.find(t=>attr(t,k)===v)||'';
 const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>{try{return JSON.parse(m[1])}catch{return {invalid:true}}});
 const row={route,status:r.status,title:decode(html.match(/<title>(.*?)<\/title>/)?.[1]||''),description:decode(attr(find('name','description'),'content')),canonical:attr(find('rel','canonical'),'href'),alternates:Object.fromEntries(tags.filter(t=>attr(t,'rel')==='alternate').map(t=>[attr(t,'hrefLang')||attr(t,'hreflang'),attr(t,'href')])),robots:attr(find('name','robots'),'content'),htmlLang:attr(html.match(/<html[^>]*>/)?.[0]||'','lang'),dir:attr(html.match(/<html[^>]*>/)?.[0]||'','dir'),headings:[...html.matchAll(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/g)].map(m=>({level:+m[1],text:decode(m[2])})),schemas,bytes:Buffer.byteLength(html),responseMs:Math.round(performance.now()-start),internalLinks:[...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m=>decode(m[1])).filter(u=>u.startsWith('/')),images:[...html.matchAll(/<img\b[^>]*>/g)].map(m=>({src:attr(m[0],'src'),alt:attr(m[0],'alt'),hasAlt:/\balt=/.test(m[0]),width:attr(m[0],'width'),height:attr(m[0],'height')}))};
 row.xRobotsTag=r.headers.get('x-robots-tag');
 for(const link of row.internalLinks)links.add(link.split(/[?#]/)[0]);rows.push(row);
 if(phase==='after'){
  if(r.status!==200||row.headings.filter(h=>h.level===1).length!==1||row.htmlLang!==locale||row.dir!==(locale==='ar'?'rtl':'ltr'))failures.push(`${route}: status/headings/language`);
  if(row.canonical!==content.origin+route||row.alternates.en!==content.origin+'/en'+(path?'/'+path:'')||row.alternates.ar!==content.origin+'/ar'+(path?'/'+path:''))failures.push(`${route}: canonical/alternates`);
  if(!row.description||schemas.some(s=>s.invalid)||row.images.some(i=>!i.hasAlt))failures.push(`${route}: description/schema/alt`);
  if(process.env.EXPECT_INDEXING==='true'?row.xRobotsTag?.includes('noindex'):!row.xRobotsTag?.includes('noindex'))failures.push(`${route}: environment response directive`);
 }
}
const linkStatuses=[];for(const link of links){const r=await fetch(base+link);linkStatuses.push({link,status:r.status});if(r.status>=400)failures.push(`Broken link ${link}: ${r.status}`)}
const special=[];for(const route of ['/','/en/','/en/missing-page','/fr','/en/programmes/missing','/en/contact/extra','/robots.txt','/sitemap.xml']){const r=await fetch(base+route,{redirect:'manual'});special.push({route,status:r.status,location:r.headers.get('location'),body:route.endsWith('.txt')||route.endsWith('.xml')?await r.text():undefined})}
let live;try{const r=await fetch('https://planbconsultant.com',{signal:AbortSignal.timeout(15000)});live={status:r.status,finalUrl:r.url,title:(await r.text()).match(/<title>(.*?)<\/title>/)?.[1]}}catch(e){live={error:e.message,cause:e.cause?.code}}
const duplicate=(key)=>[...new Set(rows.map(r=>r[key]))].filter(v=>rows.filter(r=>r[key]===v).length>1);
const sitemap=special.find(s=>s.route==='/sitemap.xml')?.body||'';
const generated=existsSync('.next/prerender-manifest.json')?Object.keys(JSON.parse(readFileSync('.next/prerender-manifest.json')).routes).filter(r=>/^\/(en|ar)(\/|$)/.test(r)):[];
const summary={phase,base,checkedAt:'2026-10-02',pages:rows.length,indexable:rows.filter(r=>r.status===200&&!r.robots.includes('noindex')).length,prerenderedPages:generated.length,generatedRoutes:generated,sitemapEntries:(sitemap.match(/<loc>/g)||[]).length,duplicateTitles:duplicate('title'),duplicateDescriptions:duplicate('description'),failures,live,special,linkStatuses};
if(phase==='after'){if(summary.duplicateTitles.length||summary.duplicateDescriptions.length)failures.push('Duplicate metadata');const expected=process.env.EXPECT_INDEXING==='true',count=content.indexablePaths.length*2;if(summary.indexable!==(expected?count:0)||summary.sitemapEntries!==(expected?count:0))failures.push('Indexability/sitemap coverage');for(const s of special){if(s.route.includes('missing')||s.route==='/fr'||s.route.endsWith('/extra'))if(s.status!==404)failures.push(`404: ${s.route}`)}const query=await(await fetch(base+'/en/consultation?utm_source=test&programme=canada-c11')).text();if(!query.includes('href="'+content.origin+'/en/consultation"'))failures.push('Query canonical');}
writeFileSync(`${out}/${phase}-inventory.json`,JSON.stringify({summary,rows},null,2));console.log(JSON.stringify(summary,null,2));if(phase==='after'&&failures.length)process.exitCode=1;

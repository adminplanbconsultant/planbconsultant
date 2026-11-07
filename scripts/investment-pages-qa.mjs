// Checks the 18 investment programme pages and two overviews in both locales against lib/investment-programmes.ts.
// Usage: TEST_BASE_URL=http://localhost:3000 node scripts/investment-pages-qa.mjs   (needs a running server)
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import ts from 'typescript';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const code=ts.transpileModule(readFileSync('lib/investment-programmes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {investmentProgrammes,investmentPath,investmentCategories,investmentTitle}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const decode=s=>s.replace(/<!--.*?-->/gs,'').replace(/&#x27;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const textOf=html=>decode(html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style[\s\S]*?<\/style>/g,'').replace(/<[^>]+>/g,''));
const rows=[];let checks=0;
const ok=(cond,msg)=>{checks++;assert(cond,msg)};
for(const locale of ['en','ar']){
 const ar=locale==='ar';
 for(const cat of ['citizenship','residency']){
  const url=`${base}/${locale}/services/${investmentCategories[cat].service}`;const r=await fetch(url);ok(r.status===200,url);
  const html=await r.text();ok((html.match(/<h1[\s>]/g)||[]).length===1,'one h1 '+url);
  for(const p of investmentProgrammes.filter(x=>x.category===cat))ok(html.includes(`href="/${locale}/${investmentPath(p)}"`),'overview links '+p.slug+' '+locale);
  if(cat==='residency')ok(html.includes(`href="/${locale}/programmes/usa-eb5"`),'EB-5 kept on residency overview');
 }
 for(const p of investmentProgrammes){
  const path=investmentPath(p),url=`${base}/${locale}/${path}`;const r=await fetch(url);ok(r.status===200,url);
  const html=await r.text(),body=textOf(html);
  const h1=[...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)];ok(h1.length===1,'one h1 '+url);ok(decode(h1[0][1])===investmentTitle(p,ar),'h1 text '+url);
  ok(body.includes(ar?p.descriptionAr:p.source.description),'full description '+url);
  for(const line of p.capital){ok(body.includes(line.route[ar?1:0]),'route '+line.route[0]+' '+url);if(line.amount)ok(body.includes(line.amount),'amount '+line.amount+' '+url)}
  ok(body.includes(p.processing[ar?1:0]),'processing '+url);ok(body.includes(p.presence[ar?1:0]),'presence '+url);
  const held=p.held?.includes('advantage');ok(held?!body.includes(p.advantage[ar?1:0]):body.includes(p.advantage[ar?1:0]),'advantage '+(held?'held ':'')+url);
  ok(html.includes(`href="/${locale}/services/${investmentCategories[p.category].service}"`),'breadcrumb to overview '+url);
  ok(html.includes(`href="/${ar?'en':'ar'}/${path}"`),'language switch keeps programme '+url);
  ok(/<meta name="robots" content="noindex/.test(html)===!p.publishReady,'robots matches review status '+url);
  ok(html.includes(`<link rel="canonical" href="https://planbconsultant.com/${locale}/${path}"`),'canonical '+url);
  for(const id of ['overview','at-a-glance','benefits','requirements','investment','process','faqs','assessment'])ok(html.includes(`id="${id}"`)&&html.includes(`href="#${id}"`),'anchor '+id+' '+url);
  ok(html.includes(`data-selected-programme="${p.id}"`),'assessment carries programme '+url);
  ok(html.includes(`/consultation?programme=${p.id}`),'consultation CTA '+url);
  const related=html.split('id="related-h"')[1]?.split('</section>')[0]||'';ok(!related.includes(`href="/${locale}/${path}"`),'related excludes self '+url);
  for(const q of investmentProgrammes.filter(x=>x.id!==p.id))ok(related.includes(`href="/${locale}/${investmentPath(q)}"`),'related lists '+q.slug+' on '+url);
  const meta=decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'');ok(meta&&!/\d{2},\d{3}|guarantee|visa-free|tax-free/i.test(meta),'snippet has no figures/claims '+url);
  ok(!/review hold|INTERNAL|TBD/.test(body),'no review notes visible '+url);
  rows.push({locale,programme:p.name[0],path,status:r.status,noindex:!p.publishReady});
 }
}
const sitemap=await (await fetch(base+'/sitemap.xml')).text();
for(const p of investmentProgrammes)ok(!sitemap.includes(investmentPath(p))||p.publishReady,'held page not in sitemap '+p.slug);
mkdirSync('artifacts/investment-programmes',{recursive:true});writeFileSync('artifacts/investment-programmes/route-results.json',JSON.stringify({checks,rows},null,1));
console.log(`${rows.length} investment pages and 4 overviews passed ${checks} checks.`);

// Crawler-view SEO audit of a RUNNING production build (plain HTTP fetch, no JavaScript, like a search crawler).
// It compares four inventories: indexable routes (robots meta), sitemap URLs, canonical targets and internal-link coverage,
// and validates titles, descriptions, canonicals, hreflang, Open Graph/Twitter tags, JSON-LD, headings and share images.
//   npm run build   (with NEXT_PUBLIC_ALLOW_INDEXING=true to exercise the indexable state)
//   node node_modules/next/dist/bin/next start -p 3401
//   TEST_BASE_URL=http://localhost:3401 node scripts/seo-audit.mjs        -> artifacts/seo/audit.json
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
const base=process.env.TEST_BASE_URL||'http://localhost:3401';
const ORIGIN='https://planbconsultant.com';
const code=f=>ts.transpileModule(readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const url=c=>'data:text/javascript;base64,'+Buffer.from(c).toString('base64');
const overviewUrl=url(code('lib/service-overviews.ts'));
const {services,countries,guides,slugify}=await import(url(code('lib/content.ts').replace("'./service-overviews'",JSON.stringify(overviewUrl))));
const {programmes}=await import(url(code('lib/programmes.ts')));
const supported=['canada','australia','germany','sweden','portugal','united-states'];
const routes=['', 'about','programmes','services','destinations','resources','consultation','contact','privacy','faqs',...programmes.map(p=>'programmes/'+p.slug),...services.map(s=>'services/'+s.slug),...countries.map(c=>'destinations/'+slugify(c[0])),...guides.map(g=>'resources/'+g.slug)];
const unique=[...new Set(routes)];
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#x27;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attr=(tag,name)=>{const m=tag.match(new RegExp(name+'="([^"]*)"'));return m?decode(m[1]):undefined};
const metas=html=>[...html.matchAll(/<meta\s[^>]*>/g)].map(m=>m[0]);
const links=html=>[...html.matchAll(/<link\s[^>]*>/g)].map(m=>m[0]);
const stripTags=s=>s.replace(/<[^>]*>/g,'').trim();

const pages=[];const issues=[];
for(const locale of ['en','ar'])for(const path of unique){
 const u=`${base}/${locale}${path?'/'+path:''}`;const r=await fetch(u,{redirect:'manual'});const html=await r.text();
 const m=metas(html),l=links(html);
 const meta=(k,v='name')=>m.map(t=>({k:attr(t,v),c:attr(t,'content')})).filter(x=>x.k===k);
 const robots=meta('robots')[0]?.c||'';
 const canonical=l.filter(t=>attr(t,'rel')==='canonical').map(t=>attr(t,'href'));
 const alternates=Object.fromEntries(l.filter(t=>attr(t,'rel')==='alternate'&&attr(t,'hrefLang')).map(t=>[attr(t,'hrefLang'),attr(t,'href')]));
 const ldRaw=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 let graph=[];try{graph=ldRaw.flatMap(s=>JSON.parse(s)['@graph']||[])}catch{issues.push({u,issue:'JSON-LD does not parse'})}
 const body=html.slice(html.indexOf('<body'));
 const page={locale,path,url:u,status:r.status,title:decode((html.match(/<title>([\s\S]*?)<\/title>/)||[])[1]||''),description:meta('description')[0]?.c||'',robots,indexable:r.status===200&&!/noindex/i.test(robots),canonical,alternates,
  htmlLang:(html.match(/<html[^>]*\blang="([^"]*)"/)||[])[1],htmlDir:(html.match(/<html[^>]*\bdir="([^"]*)"/)||[])[1],
  og:Object.fromEntries(m.map(t=>[attr(t,'property'),attr(t,'content')]).filter(x=>x[0]&&x[0].startsWith('og:'))),ogImages:meta('og:image','property').length,
  twitter:Object.fromEntries(m.map(t=>[attr(t,'name'),attr(t,'content')]).filter(x=>x[0]&&x[0].startsWith('twitter:'))),
  ldCount:ldRaw.length,ldTypes:graph.map(x=>x['@type']),ldIds:graph.map(x=>x['@id']),
  h1:[...body.matchAll(/<h1[\s>][\s\S]*?<\/h1>/g)].map(x=>stripTags(x[0])),textLength:stripTags(body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g,'')).length,
  internal:[...new Set([...body.matchAll(/<a [^>]*href="(\/(?:en|ar)(?:\/[^"#?]*)?)(?:[?#][^"]*)?"/g)].map(x=>x[1].replace(/\/$/,'')))],
  imgsMissingDims:[...body.matchAll(/<img\s[^>]*>/g)].filter(x=>!/\bwidth="/.test(x[0])||!/\bheight="/.test(x[0])).length};
 pages.push(page);
}

// ---- per-page checks
const expectedUrl=p=>`${ORIGIN}/${p.locale}${p.path?'/'+p.path:''}`;
const ownSitemapPath=p=>p.path;
for(const p of pages){
 const tag=`${p.locale}/${p.path}`;
 if(p.status!==200)issues.push({u:tag,issue:'status '+p.status});
 if(p.canonical.length!==1||p.canonical[0]!==expectedUrl(p))issues.push({u:tag,issue:'canonical not single self-referencing absolute URL',canonical:p.canonical});
 if(p.alternates.en!==`${ORIGIN}/en${p.path?'/'+p.path:''}`||p.alternates.ar!==`${ORIGIN}/ar${p.path?'/'+p.path:''}`)issues.push({u:tag,issue:'hreflang pair incorrect',alternates:p.alternates});
 if(p.htmlLang!==p.locale||p.htmlDir!==(p.locale==='ar'?'rtl':'ltr'))issues.push({u:tag,issue:'lang/dir',lang:p.htmlLang,dir:p.htmlDir});
 if(!p.title||p.title.length>75)issues.push({u:tag,issue:'title length '+p.title.length});
 if(p.description.length<70||p.description.length>180)issues.push({u:tag,issue:'description length '+p.description.length});
 if(p.h1.length!==1)issues.push({u:tag,issue:'h1 count '+p.h1.length});
 if(p.ldCount!==1)issues.push({u:tag,issue:'JSON-LD script count '+p.ldCount});
 if(new Set(p.ldIds).size!==p.ldIds.length)issues.push({u:tag,issue:'duplicate JSON-LD @id'});
 if(p.ogImages!==1||!/^https:\/\/planbconsultant\.com\/images\/social\/plan-b-share-v3-(en|ar)\.jpg$/.test(p.og['og:image']||''))issues.push({u:tag,issue:'og:image',value:p.og['og:image'],count:p.ogImages});
 if(p.twitter['twitter:card']!=='summary_large_image'||p.twitter['twitter:image']!==p.og['og:image'])issues.push({u:tag,issue:'twitter card/image'});
 if(p.og['og:url']!==expectedUrl(p)||p.og['og:image:width']!=='1200'||p.og['og:image:height']!=='630'||!p.og['og:image:alt']||!p.og['og:locale']||!p.og['og:locale:alternate'])issues.push({u:tag,issue:'og fields incomplete'});
 if(p.imgsMissingDims)issues.push({u:tag,issue:'images without width/height: '+p.imgsMissingDims,level:'warn'});
 if(!p.ldTypes.includes('Organization')||!p.ldTypes.includes('WebSite')||!p.ldTypes.includes('BreadcrumbList'))issues.push({u:tag,issue:'JSON-LD graph incomplete',types:p.ldTypes});
 if(/plan-b-logo|logo\.jpg|plan-b-share-(en|ar)\.jpg/.test(JSON.stringify(p)))issues.push({u:tag,issue:'old logo/share reference'});
}
// uniqueness across indexable pages
const dupes=(key)=>{const seen={};for(const p of pages.filter(x=>x.indexable))(seen[p[key]]??=[]).push(`${p.locale}/${p.path}`);return Object.entries(seen).filter(([,v])=>v.length>1)};
for(const key of ['title','description'])for(const [value,where] of dupes(key))issues.push({issue:'duplicate '+key,value:value.slice(0,80),pages:where});

// ---- sitemap
const sitemapRes=await fetch(base+'/sitemap.xml');const sitemapXml=await sitemapRes.text();
const sitemapLocs=[...sitemapXml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g)].map(m=>({loc:decode(m[1]),block:m[2]}));
const sitemapSet=new Set(sitemapLocs.map(x=>x.loc));
const indexable=pages.filter(p=>p.indexable);
const indexableUrls=new Set(indexable.map(expectedUrl));
const canonicalTargets=new Set(pages.flatMap(p=>p.canonical));
const diff={
 indexableNotInSitemap:[...indexableUrls].filter(x=>!sitemapSet.has(x)),
 sitemapNotIndexable:[...sitemapSet].filter(x=>!indexableUrls.has(x)),
 sitemapNotCanonical:[...sitemapSet].filter(x=>!canonicalTargets.has(x)),
 sitemapWithoutAlternates:sitemapLocs.filter(x=>!x.block.includes('hreflang="en"')||!x.block.includes('hreflang="ar"')).map(x=>x.loc),
 sitemapWithLastmod:sitemapLocs.filter(x=>x.block.includes('<lastmod>')).length
};
// ---- internal link coverage (inbound links from other pages, within indexable set)
const inbound={};for(const p of pages)for(const href of p.internal){if(href!==`/${p.locale}${p.path?'/'+p.path:''}`)(inbound[href]??=new Set()).add(`${p.locale}/${p.path}`)}
const noInbound=indexable.filter(p=>!(inbound[`/${p.locale}${p.path?'/'+p.path:''}`]?.size)).map(p=>`${p.locale}/${p.path}`);
const brokenInternal=[];const known=new Set(pages.map(p=>`/${p.locale}${p.path?'/'+p.path:''}`));
for(const p of pages)for(const href of p.internal)if(!known.has(href))brokenInternal.push({from:`${p.locale}/${p.path}`,href});

// ---- robots, 404s, redirects, assets
const robotsTxt=await (await fetch(base+'/robots.txt')).text();
const checks={robotsTxt,robotsHasSitemap:robotsTxt.includes('Sitemap: '+ORIGIN+'/sitemap.xml'),robotsBlocksApi:/Disallow:\s*\/api\//.test(robotsTxt),
 missingPage:(await fetch(base+'/en/does-not-exist')).status,missingLocale:(await fetch(base+'/fr')).status,
 rootRedirect:await fetch(base+'/',{redirect:'manual'}).then(r=>[r.status,r.headers.get('location')]),
 trailingSlash:await fetch(base+'/en/about/',{redirect:'manual'}).then(r=>[r.status,r.headers.get('location')]),
 apiHeaders:await fetch(base+'/api/enquiries',{method:'GET'}).then(r=>({status:r.status,robots:r.headers.get('x-robots-tag')}))};
const assets={};
for(const a of ['/images/social/plan-b-share-v3-en.jpg','/images/social/plan-b-share-v3-ar.jpg','/images/plan-b-crest-512.png','/images/icon-192.png','/images/apple-touch-icon.png','/images/favicon-32.png','/favicon.ico','/manifest.webmanifest','/images/logo.jpg','/images/social/plan-b-share-en.jpg']){
 const r=await fetch(base+a);const buf=Buffer.from(await r.arrayBuffer());let dim='';if(r.ok&&/image\/(jpeg|png)/.test(r.headers.get('content-type')||'')){const m=await sharp(buf).metadata();dim=`${m.width}x${m.height}`}
 assets[a]={status:r.status,type:r.headers.get('content-type'),bytes:buf.length,dim};
}
const shareOk=['/images/social/plan-b-share-v3-en.jpg','/images/social/plan-b-share-v3-ar.jpg'].every(a=>assets[a].status===200&&assets[a].type==='image/jpeg'&&assets[a].dim==='1200x630');
const retiredGone=assets['/images/logo.jpg'].status===404&&assets['/images/social/plan-b-share-en.jpg'].status===404;

const summary={base,routePaths:unique.length,pagesFetched:pages.length,indexablePages:indexable.length,indexablePathsPerLocale:indexable.filter(p=>p.locale==='en').length,
 noindexPages:pages.filter(p=>!p.indexable).map(p=>`${p.locale}/${p.path}`),sitemapUrls:sitemapLocs.length,canonicalTargets:canonicalTargets.size,
 diff,noInboundLinks:noInbound,brokenInternalLinks:brokenInternal.length,shareImagesOk:shareOk,retiredAssetsGone:retiredGone,issues:issues.filter(i=>i.level!=='warn').length,warnings:issues.filter(i=>i.level==='warn').length};
mkdirSync('artifacts/seo',{recursive:true});
writeFileSync('artifacts/seo/audit.json',JSON.stringify({summary,checks,assets,issues,pages:pages.map(({internal,...rest})=>({...rest,internalLinks:internal.length}))},null,1));
console.log(JSON.stringify(summary,null,1));
console.log('checks',JSON.stringify({...checks,robotsTxt:undefined}));
console.log('assets',JSON.stringify(assets));
for(const i of issues.slice(0,40))console.log('ISSUE',JSON.stringify(i).slice(0,300));
if(issues.length>40)console.log(`... ${issues.length-40} more in artifacts/seo/audit.json`);

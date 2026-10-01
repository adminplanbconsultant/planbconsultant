import {readFileSync,statSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
const pages=[];
for(const route of ['/en','/ar','/en/programmes/canada-express-entry','/ar/programmes/germany-nursing','/en/contact']){
 const runs=[];let html='';for(let i=0;i<6;i++){const start=performance.now();const r=await fetch(base+route);const headers=performance.now();html=await r.text();if(i)runs.push({headersMs:+(headers-start).toFixed(2),completeMs:+(performance.now()-start).toFixed(2)});}
 const scripts=[...new Set([...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]))];
 let jsBytes=0,jsGzipBytes=0;for(const src of scripts){const bytes=Buffer.from(await(await fetch(base+src)).arrayBuffer());jsBytes+=bytes.length;jsGzipBytes+=gzipSync(bytes).length;}
 const median=k=>runs.map(r=>r[k]).sort((a,b)=>a-b)[2];pages.push({route,runs,medianHeadersMs:median('headersMs'),medianCompleteMs:median('completeMs'),htmlBytes:Buffer.byteLength(html),htmlGzipBytes:gzipSync(html).length,scriptRequests:scripts.length,jsBytes,jsGzipBytes});
}
const files=[];for(const dir of ['public/images/hero','public/images/programmes'])for(const name of readdirSync(dir)){const path=join(dir,name);if(statSync(path).isFile())files.push({path,bytes:statSync(path).size});}
const result={environment:{date:'2026-10-02',node:process.version,platform:process.platform,server:'Next.js production start; localhost; warm cache; five measured runs after one warmup; no throttling',base},pages,images:files.sort((a,b)=>b.bytes-a.bytes),limitations:'HTTP and asset lab measurements only. No browser surface was available. LCP, CLS, INP, Lighthouse scores and real-user Core Web Vitals were not measured.'};
mkdirSync('artifacts/search-visibility',{recursive:true});writeFileSync('artifacts/search-visibility/performance.json',JSON.stringify(result,null,2));console.log(JSON.stringify({pages,largestImages:result.images.slice(0,6),limitations:result.limitations},null,2));

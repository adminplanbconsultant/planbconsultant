import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const inventory=JSON.parse(readFileSync('artifacts/search-visibility/production-inventory.json','utf8'));
const base=process.env.TEST_BASE_URL||'http://localhost:3100';
const urls=new Set(inventory.rows.flatMap(r=>r.images.map(i=>i.src)));
const optimized=JSON.parse(readFileSync('artifacts/search-visibility/image-optimization.json','utf8'));
for(const row of optimized)for(const variant of row.variants)urls.add(variant.path.replace('public',''));
const results=[];for(const url of urls){const r=await fetch(base+url);assert.equal(r.status,200,url);results.push({url,status:r.status,contentType:r.headers.get('content-type')})}
const html=await(await fetch(base+'/en')).text();assert(html.includes('toronto-480.webp 480w'));assert(html.includes('toronto-960.webp'));assert(html.includes('imagesrcset=')||html.includes('imageSrcSet='));
writeFileSync('artifacts/search-visibility/asset-checks.json',JSON.stringify({checked:results.length,checks:results,heroResponsivePreload:'pass'},null,2));console.log(`${results.length} image assets and responsive hero preload passed.`);

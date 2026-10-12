// Verifies the Referer-based hotlink rule against a running production build (default http://localhost:3411).
//   node node_modules/next/dist/bin/next start -p 3411 ; node scripts/hotlink-test.mjs
// Local `next start` only: the same rule on Vercel's edge must be re-checked after deployment (see ASSET-PROTECTION.md).
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://localhost:3411';
const get=(url,ref,ua)=>fetch(base+url,{headers:{...(ref?{Referer:ref}:{}),...(ua?{'User-Agent':ua}:{})}});
const img='/images/optimized/toronto-960.webp';
let n=0;const t=async(label,url,ref,status,ua)=>{const r=await get(url,ref,ua);const body=r.headers.get('content-type')||'';assert.equal(r.status,status,`${label}: expected ${status}, got ${r.status}`);if(status===403)assert.match(r.headers.get('cache-control')||'',/no-store/,label+': 403 must not be cacheable');n++;console.log(`ok  ${status} ${label}`)};
// allowed: direct visits, crawlers, own site, search engines, social, previews, local dev
await t('no referer (direct visit, crawlers, privacy browsers)',img,'',200);
await t('WhatsApp link-preview fetcher UA, no referer',img,'',200,'WhatsApp/2.23.20 A');
await t('Googlebot-Image UA, no referer',img,'',200,'Googlebot-Image/1.0');
for(const ref of ['https://planbconsultant.com/en','https://www.planbconsultant.com/ar/about','https://webmail.planbconsultant.com/','https://www.google.com/','https://www.google.com.kw/','https://www.bing.com/images/search','https://duckduckgo.com/','https://l.facebook.com/','https://www.instagram.com/','https://t.co/x','https://planbconsultant-git-main-team.vercel.app/en','http://localhost:3000/en','http://127.0.0.1:3000/'])await t('allowed referer '+ref,img,ref,200);
// blocked: foreign pages, look-alikes, any other vercel.app site
for(const ref of ['https://evil.example/page','https://planbconsultant.com.evil.com/','https://evilplanbconsultant.com/','https://notplanbconsultant.com/','https://attacker.vercel.app/','https://google.evil.example/','http://scraper.test:8080/x'])await t('blocked referer '+ref,img,ref,403);
// every protected image group
for(const u of ['/images/destinations/germany.jpg','/images/destinations/usa.jpg','/images/destination-0.jpg','/images/destination-2.jpg','/images/plan-b-header-crest-en.png','/images/plan-b-header-crest-ar.png','/images/optimized/plan-b-logo-en.webp','/images/optimized/crest-ar-960.webp'])await t('protected group, foreign referer '+u,u,'https://evil.example/',403);
// never protected, even from a foreign referer
for(const u of ['/images/social/plan-b-share-v3-en.jpg','/images/social/plan-b-share-v3-ar.jpg','/favicon.ico','/images/favicon-32.png','/images/apple-touch-icon.png','/images/icon-192.png','/images/plan-b-crest-512.png','/manifest.webmanifest','/images/flags/ca.svg','/robots.txt','/sitemap.xml','/en','/ar/contact'])await t('exempt, foreign referer '+u,u,'https://evil.example/',200);
// moved originals are gone from the deployed set
for(const u of ['/images/programmes/usa-eb5-investment.png','/images/hero/sydney.jpg','/images/plan-b-logo-en.png','/images/plan-b-logo.png','/images/plan-b-header-en.png','/images/logo.jpg','/images/favicon-512.png','/fonts/README.md','/file.svg','/globe.svg','/window.svg'])await t('original/unused file not published '+u,u,'',404);
console.log(`\n${n} hotlink/asset checks passed (local next start).`);

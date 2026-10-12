import type {NextConfig} from 'next';

/**
 * Hotlink protection (best effort, Referer-based): a request for one of the protected image groups below is answered with 403
 * ONLY when the browser reports a Referer from a foreign site. Requests with no Referer (direct visits, crawlers, WhatsApp/Facebook
 * link-preview fetchers, privacy browsers) and requests referred from this site, preview deployments, search engines or social
 * platforms are untouched. Social-sharing images (/images/social/*), favicons/app icons, the manifest, flags and the Organization
 * logo are never protected. Referer is trivially spoofable by a script, so this only stops casual embedding. Build-time kill
 * switch: set HOTLINK_PROTECTION=off. See ASSET-PROTECTION.md.
 */
// NOTE: no backslashes below on purpose: Next strips them when it compiles `has`/`source` patterns, so dots and digits use [.] and [0-9].
const allowedReferers='(?:[^/:]*[.])?(?:planbconsultant[.]com|google[.](?:com|[a-z]{2}|co[.][a-z]{2}|com[.][a-z]{2})|bing[.]com|duckduckgo[.]com|yahoo[.]com|yandex[.](?:com|ru|[a-z]{2})|ecosia[.]org|brave[.]com|facebook[.]com|instagram[.]com|whatsapp[.]com|wa[.]me|t[.]co|twitter[.]com|x[.]com|linkedin[.]com|tiktok[.]com)|planbconsultant[a-z0-9-]*[.]vercel[.]app|localhost|127[.]0[.]0[.]1';
const foreignReferer=`https?://(?!(?:${allowedReferers})(?::[0-9]+)?(?:/|$)).*`;
const protectedImages=['/images/optimized/:file*','/images/destinations/:file*','/images/destination-:n([0-9]+).jpg','/images/plan-b-header-crest-:l(en|ar).png'];

const config:NextConfig={poweredByHeader:false,trailingSlash:false,
 async rewrites(){
  if(process.env.HOTLINK_PROTECTION==='off')return [];
  return {beforeFiles:protectedImages.map(source=>({source,has:[{type:'header' as const,key:'referer',value:foreignReferer}],destination:'/api/hotlink-blocked'})),afterFiles:[],fallback:[]};
 },
 async headers(){return process.env.NEXT_PUBLIC_ALLOW_INDEXING!=='true'||process.env.VERCEL_ENV==='preview'?[{source:'/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, follow'}]}]:[]}};
export default config;

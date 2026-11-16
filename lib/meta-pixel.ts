/**
 * Meta Pixel (base pixel + PageView only) and the marketing-cookie consent it depends on.
 *
 * Nothing loads unless ALL of these hold:
 *  1. a valid Pixel ID is configured (META_PIXEL_ID below);
 *  2. this is a production build that is not a Vercel preview/development deployment;
 *  3. the page is served from an approved production hostname (so localhost and *.vercel.app previews never track);
 *  4. the visitor has accepted marketing cookies on this device.
 *
 * Deliberately NOT implemented: Lead or other events, automatic events/form tracking (autoConfig is disabled),
 * advanced matching (init is called without user data), Conversions API and the <noscript> image fallback
 * (a static page cannot know a no-JavaScript visitor's consent, so a fallback would track without consent).
 */

/** Pixel ID. Override with NEXT_PUBLIC_META_PIXEL_ID; set it to "off" to disable the pixel entirely. */
const configuredId=process.env.NEXT_PUBLIC_META_PIXEL_ID??'1877133723717615';
export const META_PIXEL_ID=/^[0-9]{15,16}$/.test(configuredId)?configuredId:'';

/** Hostnames where tracking may run. QA builds may add hosts via NEXT_PUBLIC_META_PIXEL_EXTRA_HOSTS (never set it in production). */
const productionHosts=['planbconsultant.com','www.planbconsultant.com'];
const extraHosts=(process.env.NEXT_PUBLIC_META_PIXEL_EXTRA_HOSTS||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
const deploymentEnv=process.env.NEXT_PUBLIC_VERCEL_ENV||'';
const productionBuild=process.env.NODE_ENV==='production'&&deploymentEnv!=='preview'&&deploymentEnv!=='development';

/** True when this build, host and Pixel ID allow the pixel (consent is checked separately). Browser only. */
export function pixelAvailable(){
 if(typeof window==='undefined'||!META_PIXEL_ID||!productionBuild)return false;
 const host=window.location.hostname.toLowerCase();
 return productionHosts.includes(host)||extraHosts.includes(host);
}

/* ---------- Consent ---------- */
export const CONSENT_KEY='planb-cookie-consent-v1';
export const CONSENT_EVENT='planb:consent-change';
export const OPEN_SETTINGS_EVENT='planb:open-cookie-settings';
/** analytics: reserved for a future analytics option. The banner does not offer it, so it is always false today. */
export type ConsentChoice={marketing:boolean;analytics:boolean;updatedAt:string};
export function readConsent():ConsentChoice|null{
 try{const raw=localStorage.getItem(CONSENT_KEY);if(!raw)return null;const v=JSON.parse(raw);return typeof v?.marketing==='boolean'?{marketing:v.marketing,analytics:v.analytics===true,updatedAt:String(v.updatedAt||'')}:null}catch{return null}
}
export function saveConsent(marketing:boolean){
 const choice:ConsentChoice={marketing,analytics:false,updatedAt:new Date().toISOString()};
 try{localStorage.setItem(CONSENT_KEY,JSON.stringify(choice))}catch{/* Storage blocked: the choice applies to this page view only. */}
 window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT,{detail:choice}));
}
export const hasMarketingConsent=()=>readConsent()?.marketing===true;
export const hasAnalyticsConsent=()=>readConsent()?.analytics===true;

/* ---------- URL guard ---------- */
/**
 * Query parameters that may appear in a tracked URL. Anything else (for example name/phone/email from a form submitted
 * before JavaScript loaded, which falls back to a GET request) blocks the PageView so form data never reaches Meta.
 */
const allowedParams=/^(programme|service|destination|utm_[a-z_]+|fbclid|gclid)$/;
export function urlIsSafeToTrack(search:string){
 for(const key of new URLSearchParams(search).keys())if(!allowedParams.test(key))return false;
 return true;
}

/* ---------- Pixel ---------- */
type Fbq=((...args:unknown[])=>void)&{callMethod?:(...args:unknown[])=>void;queue:unknown[];push:unknown;loaded:boolean;version:string;disablePushState?:boolean};
declare global{interface Window{fbq?:Fbq;_fbq?:Fbq}}
let initialised=false;
let lastTrackedPage='';

/** Meta's base code, unchanged in behaviour: defines the fbq queue and loads fbevents.js asynchronously, once. */
function loadBaseCode(){
 const w=window;if(w.fbq)return;
 // eslint-disable-next-line prefer-rest-params -- Meta's queue expects the raw arguments object, exactly as in the base code.
 const n=function(){n.callMethod?n.callMethod.apply(n,arguments as unknown as unknown[]):n.queue.push(arguments)} as unknown as Fbq;
 w.fbq=n;if(!w._fbq)w._fbq=n;n.push=n;n.loaded=true;n.version='2.0';n.queue=[];
 const t=document.createElement('script');t.async=true;t.src='https://connect.facebook.net/en_US/fbevents.js';
 const s=document.getElementsByTagName('script')[0];if(s?.parentNode)s.parentNode.insertBefore(t,s);else document.head.appendChild(t);
}

/** Initialise this Pixel ID once per document. */
function initialise(){
 if(initialised)return;
 loadBaseCode();const fbq=window.fbq!;
 // Meta otherwise fires its own PageView on every history.pushState/replaceState (Next.js calls replaceState on load).
 fbq.disablePushState=true;
 fbq('consent','grant');
 // No automatic events: stops button-click and page-metadata collection, which could include form text.
 fbq('set','autoConfig',false,META_PIXEL_ID);
 fbq('init',META_PIXEL_ID); // no advanced-matching object is passed
 initialised=true;
}

/** Records one PageView for the current page view. Safe to call repeatedly: the same page key is never tracked twice. */
export function trackPageView(){
 if(!pixelAvailable()||!hasMarketingConsent())return;
 const {pathname,search}=window.location;
 if(!urlIsSafeToTrack(search))return;
 const key=pathname+search;
 if(initialised)window.fbq!('consent','grant'); // re-consent after a withdrawal on this page
 if(key===lastTrackedPage)return;
 initialise();
 window.fbq!('track','PageView');
 lastTrackedPage=key;
}

/** Consent withdrawn: stop the pixel sending anything further and remove Meta's first-party cookies. */
export function revokePixel(){
 if(window.fbq)window.fbq('consent','revoke');
 const host=window.location.hostname;const domains=['',host,'.'+host.replace(/^www\./,'')];
 for(const name of ['_fbp','_fbc'])for(const d of domains)document.cookie=`${name}=; Max-Age=0; path=/${d?'; domain='+d:''}; SameSite=Lax`;
}

'use client';
import {useEffect} from 'react';

/**
 * Optional GA4 bridge. Inert unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set AND indexing is enabled (so previews never pollute data).
 * It forwards only the event name, language and step number emitted by lib/conversion-events.ts. It never reads form state,
 * names, phone numbers, emails, messages, programme choices, enquiry references or URLs with parameters.
 * Leads (generate_lead) are sent only for *_submission_success events, which fire after the server confirmed the Google Sheet save.
 * Interest signals (cta_click, contact clicks) use separate event names. Advertising features and personalisation are disabled.
 */
const id=process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID||'';
const enabled=/^G-[A-Z0-9]{6,}$/.test(id)&&process.env.NEXT_PUBLIC_ALLOW_INDEXING==='true';
const map:Record<string,{name:string;lead?:boolean}>={
 assessment_opened:{name:'assessment_view'},assessment_step_completed:{name:'assessment_step'},
 assessment_submission_success:{name:'generate_lead',lead:true},contact_submission_success:{name:'generate_lead',lead:true},
 assessment_cta_click:{name:'cta_click'},whatsapp_click:{name:'contact_click'},phone_click:{name:'contact_click'},email_click:{name:'contact_click'}
};
declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void}}
export default function Analytics(){
 useEffect(()=>{
  if(!enabled)return;
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer!.push(arguments)};
  window.gtag('js',new Date());
  window.gtag('config',id,{allow_google_signals:false,allow_ad_personalization_signals:false,send_page_view:true});
  const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);document.head.appendChild(script);
  const handler=(e:Event)=>{
   const d=(e as CustomEvent<{event?:string;locale?:string;step?:number}>).detail;const m=d&&d.event?map[d.event]:undefined;if(!m||!window.gtag)return;
   const params:Record<string,unknown>={};
   if(d.locale==='en'||d.locale==='ar')params.language=d.locale;
   if(typeof d.step==='number')params.step=d.step;
   if(d.event&&!m.lead&&m.name==='contact_click')params.method=d.event.replace('_click','');
   if(m.lead)params.form=d.event==='contact_submission_success'?'contact':'assessment';
   window.gtag('event',m.name,params);
  };
  window.addEventListener('planb:conversion',handler);
  return()=>window.removeEventListener('planb:conversion',handler);
 },[]);
 return null;
}

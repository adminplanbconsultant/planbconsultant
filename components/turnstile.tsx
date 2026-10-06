'use client';
import {useEffect,useRef} from 'react';
import {turnstileSiteKey} from '@/lib/enquiry-client';

type Api={render:(el:HTMLElement,options:Record<string,unknown>)=>string;reset:(id?:string)=>void;remove:(id?:string)=>void};
declare global{interface Window{turnstile?:Api}}
const SCRIPT='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading:Promise<void>|undefined;
function load(){
 return loading??=new Promise<void>((resolve,reject)=>{
  if(window.turnstile)return resolve();
  const s=document.createElement('script');s.src=SCRIPT;s.async=true;s.onload=()=>resolve();s.onerror=()=>{loading=undefined;reject(new Error('turnstile'))};document.head.appendChild(s);
 });
}

/** Renders Cloudflare Turnstile only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Tokens are single-use: bump `resetKey` after every submit attempt. */
export default function Turnstile({locale,onToken,resetKey}:{locale:'en'|'ar';onToken:(token:string)=>void;resetKey:number}){
 const box=useRef<HTMLDivElement>(null);const widget=useRef<string>('');const callback=useRef(onToken);callback.current=onToken;
 useEffect(()=>{
  if(!turnstileSiteKey||!box.current)return;
  let cancelled=false;const el=box.current;
  load().then(()=>{
   if(cancelled||!window.turnstile)return;
   widget.current=window.turnstile.render(el,{sitekey:turnstileSiteKey,language:locale==='ar'?'ar':'en',theme:'light',callback:(token:string)=>callback.current(token),'expired-callback':()=>callback.current(''),'error-callback':()=>callback.current('')});
  }).catch(()=>callback.current(''));
  return()=>{cancelled=true;callback.current('');if(widget.current&&window.turnstile)window.turnstile.remove(widget.current);widget.current=''};
 },[locale]);
 useEffect(()=>{if(resetKey>0&&widget.current&&window.turnstile){callback.current('');window.turnstile.reset(widget.current)}},[resetKey]);
 if(!turnstileSiteKey)return null;
 return <div ref={box} className="turnstile-box" dir="ltr"/>;
}

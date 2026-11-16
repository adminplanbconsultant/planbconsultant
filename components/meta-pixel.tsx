'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
import {CONSENT_EVENT,CONSENT_KEY,trackPageView,revokePixel,type ConsentChoice} from '@/lib/meta-pixel';

/**
 * Mounted once in the locale layout. Records one PageView per page view: on the initial load and again only when the
 * pathname changes (the site currently uses full page loads; this also covers any future client-side navigation).
 * trackPageView() ignores repeat calls for the same page, so re-renders and React Strict Mode never double-count.
 */
export default function MetaPixel(){
 const pathname=usePathname();
 useEffect(()=>{trackPageView()},[pathname]);
 useEffect(()=>{
  const apply=(marketing:boolean)=>marketing?trackPageView():revokePixel();
  const onChange=(e:Event)=>apply((e as CustomEvent<ConsentChoice>).detail?.marketing===true);
  // A choice made in another tab of this site applies here too.
  const onStorage=(e:StorageEvent)=>{if(e.key===CONSENT_KEY){let marketing=false;try{marketing=JSON.parse(e.newValue||'null')?.marketing===true}catch{}apply(marketing)}};
  window.addEventListener(CONSENT_EVENT,onChange);window.addEventListener('storage',onStorage);
  return()=>{window.removeEventListener(CONSENT_EVENT,onChange);window.removeEventListener('storage',onStorage)};
 },[]);
 return null;
}

'use client';
import {useEffect,useState} from 'react';
import type {Locale} from '@/lib/content';

/**
 * The splash is rendered by the server (it is in the very first HTML) and is timed by the inline script in
 * lib/splash.ts, not by React. This component only (a) renders the markup, (b) removes it from the DOM once the
 * script reports "done", and (c) lets a click skip it. It has no timers or storage, so Strict Mode double-effects,
 * hydration timing and client-side route changes cannot restart or duplicate it.
 */
declare global{interface Window{__planbSplash?:{skip:()=>void}}}
export default function SplashScreen({locale}:{locale:Locale}){
 const [gone,setGone]=useState(false);
 useEffect(()=>{
  const root=document.documentElement;
  const sync=()=>{if(root.getAttribute('data-splash')==='done')setGone(true)};
  sync();window.addEventListener('planb:splash-done',sync);
  return()=>window.removeEventListener('planb:splash-done',sync);
 },[]);
 if(gone)return null;
 const src=(w:number)=>`/images/optimized/crest-${locale}-${w}.webp ${w}w`;
 return <div className="brand-splash" aria-hidden="true" onClick={()=>window.__planbSplash?.skip()}><div className="splash-lockup"><div className="splash-emblem-frame"><svg className="splash-orbit" viewBox="0 0 100 100" focusable="false"><circle className="splash-orbit-base" cx="50" cy="50" r="48"/><circle className="splash-orbit-accent" cx="50" cy="50" r="48"/></svg><img className="splash-emblem" src={`/images/optimized/crest-${locale}-960.webp`} srcSet={`${src(480)}, ${src(960)}`} sizes="(max-width: 650px) 250px, 320px" width="822" height="756" alt="" fetchPriority="high" decoding="sync"/></div><p className="splash-tagline" lang={locale}>{locale==='ar'?'حلول عالمية استراتيجية':'Strategic Global Solutions'}</p><span className="splash-signature"/></div></div>;
}

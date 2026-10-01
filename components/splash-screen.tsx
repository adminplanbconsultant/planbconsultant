'use client';
import {useEffect,useState} from 'react';
import type {Locale} from '@/lib/content';
export default function SplashScreen({locale}:{locale:Locale}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root=document.documentElement;
  root.dataset.splash='active';
  setVisible(true);
  // Other features (e.g. the assessment popup) wait for this signal before they start counting.
  const dismiss=()=>{setVisible(false);if(root.dataset.splash!=='done'){root.dataset.splash='done';window.dispatchEvent(new Event('planb:splash-done'))}};
  const timer=window.setTimeout(dismiss,reducedMotion?900:2500);
  // Keyboard and assistive-technology focus always reveal the page immediately.
  window.addEventListener('keydown',dismiss);
  window.addEventListener('focusin',dismiss);
  return()=>{clearTimeout(timer);window.removeEventListener('keydown',dismiss);window.removeEventListener('focusin',dismiss)};
 },[]);
 if(!visible)return null;
 return <div className="brand-splash" aria-hidden="true" onClick={()=>setVisible(false)}><div className="splash-lockup"><div className="splash-emblem-frame"><svg className="splash-orbit" viewBox="0 0 100 100" focusable="false"><circle className="splash-orbit-base" cx="50" cy="50" r="48"/><circle className="splash-orbit-accent" cx="50" cy="50" r="48"/></svg><img className="splash-emblem" src={'/images/plan-b-header-crest-'+locale+'.png'} alt="" fetchPriority="high"/></div><p className="splash-tagline" lang={locale}>{locale==='ar'?'حلول عالمية استراتيجية':'Strategic Global Solutions'}</p><span className="splash-signature"/></div></div>;
}

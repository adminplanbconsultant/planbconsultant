'use client';
import {useEffect,useState} from 'react';
import LogoMark from './logo-mark';
import type {Locale} from '@/lib/content';
const storageKey='plan-b-intro-seen-v1';
export default function SplashScreen({locale}:{locale:Locale}){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{if(sessionStorage.getItem(storageKey))return;sessionStorage.setItem(storageKey,'1')}catch{/* Storage restrictions must never prevent entry. */}
  setVisible(true);
  const dismiss=()=>setVisible(false);
  const timer=window.setTimeout(dismiss,1800);
  // Keyboard and assistive-technology focus always reveal the page immediately.
  window.addEventListener('keydown',dismiss);
  window.addEventListener('focusin',dismiss);
  return()=>{clearTimeout(timer);window.removeEventListener('keydown',dismiss);window.removeEventListener('focusin',dismiss)};
 },[]);
 if(!visible)return null;
 return <div className="brand-splash" aria-hidden="true" onClick={()=>setVisible(false)}><div className="splash-lockup"><LogoMark locale={locale}/><p lang={locale}>{locale==='ar'?'حلول عالمية استراتيجية':'STRATEGIC GLOBAL SOLUTIONS'}</p><div className="splash-track"><span/></div></div></div>;
}

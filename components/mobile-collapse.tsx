'use client';
import {useEffect,useRef,type ReactNode} from 'react';

/** Open on desktop, collapsed on phones. SSR renders open so desktop never flashes. */
export default function MobileCollapse({title,children}:{title:string;children:ReactNode}){
 const ref=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{
  const mq=window.matchMedia('(max-width:650px)');
  const sync=()=>{if(ref.current)ref.current.open=!mq.matches};
  sync();mq.addEventListener('change',sync);
  return()=>mq.removeEventListener('change',sync);
 },[]);
 return <details ref={ref} className="mobile-collapse" open><summary>{title}</summary>{children}</details>;
}

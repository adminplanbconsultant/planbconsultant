'use client';
import {useEffect,useState} from 'react';

export default function ProgrammeSubnav({items,label}:{items:[string,string][];label:string}){
 const [active,setActive]=useState('');
 useEffect(()=>{
  const ids=items.slice(0,-1).map(i=>i[0]);
  const els=ids.map(id=>document.getElementById(id)).filter((el):el is HTMLElement=>Boolean(el));
  if(!els.length||!('IntersectionObserver' in window))return;
  const seen=new Map<string,boolean>();
  const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>seen.set(e.target.id,e.isIntersecting));
   const current=ids.find(id=>seen.get(id));
   if(current)setActive(current);
  },{rootMargin:'-30% 0px -60% 0px'});
  els.forEach(el=>io.observe(el));
  return()=>io.disconnect();
 },[items]);
 return <nav className="programme-subnav" aria-label={label}><div className="wrap">{items.map((n,i)=><a key={n[0]} href={'#'+n[0]} aria-current={i<items.length-1&&active===n[0]?'true':undefined}>{n[1]}</a>)}</div></nav>;
}

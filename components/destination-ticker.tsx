'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {Globe2} from 'lucide-react';
import {slugify,text,type Locale} from '@/lib/content';

const countries=[
 {en:'Canada',ar:'كندا',code:'ca',ratio:[2,1]},
 {en:'Australia',ar:'أستراليا',code:'au',ratio:[2,1]},
 {en:'Germany',ar:'ألمانيا',code:'de',ratio:[5,3]},
 {en:'Sweden',ar:'السويد',code:'se',ratio:[8,5]},
 {en:'Portugal',ar:'البرتغال',code:'pt',ratio:[3,2]},
 {en:'United States',ar:'الولايات المتحدة',code:'us',ratio:[19,10]}
];

export default function DestinationTicker({locale}:{locale:Locale}){
 const t=(en:string,ar:string)=>text(locale,en,ar);
 const [paused,setPaused]=useState(false),[copies,setCopies]=useState(4);
 const windowRef=useRef<HTMLDivElement>(null),groupRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const windowEl=windowRef.current,group=groupRef.current;if(!windowEl||!group)return;
  const measure=()=>{const width=group.getBoundingClientRect().width;if(width>0)setCopies(Math.max(2,Math.ceil(windowEl.clientWidth/width)+1))};
  const observer=new ResizeObserver(measure);observer.observe(windowEl);observer.observe(group);measure();
  return()=>observer.disconnect();
 },[]);
 const style={'--ticker-shift':`${(locale==='ar'?100:-100)/copies}%`} as CSSProperties;
 return <section className="destination-ticker" aria-label={t('Explore international destinations','استكشف الوجهات الدولية')}>
  <div className="ticker-intro"><Globe2 size={21} strokeWidth={1.3}/><span>{t('FROM KUWAIT.','من الكويت.')}<br/><strong>{t('TO YOUR WORLD.','إلى عالمك.')}</strong></span></div>
  <div className="ticker-window" ref={windowRef}><div className={'ticker-track'+(paused?' is-paused':'')} style={style}>
   {Array.from({length:copies},(_,copy)=><div className="ticker-group" ref={copy===0?groupRef:undefined} key={copy} aria-hidden={copy>0?true:undefined}>
    {countries.map(country=><a key={country.code} tabIndex={copy>0?-1:0} href={`/${locale}/destinations/${slugify(country.en)}`}><img className="ticker-flag" src={`/images/flags/${country.code}.svg`} width={country.ratio[0]} height={country.ratio[1]} alt="" aria-hidden="true" decoding="async"/><span className="ticker-country">{t(country.en,country.ar)}</span><span className="ticker-star" aria-hidden="true">✦</span></a>)}
   </div>)}
  </div></div>
  <button className="ticker-control" type="button" onClick={()=>setPaused(value=>!value)} aria-pressed={paused}>{paused?t('Resume destination scrolling','استئناف تمرير الوجهات'):t('Pause destination scrolling','إيقاف تمرير الوجهات')}</button>
 </section>;
}

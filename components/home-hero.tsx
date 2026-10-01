'use client';
import {useEffect,useRef,useState} from 'react';
import {preload} from 'react-dom';
import {imageSources} from '@/lib/image-sources';
import {ArrowUpRight,Check,MapPin,Pause,Plane,Play} from 'lucide-react';
import {text,type Locale} from '@/lib/content';

const slides=[
 {id:'toronto',en:'Toronto, Canada',ar:'تورونتو، كندا',alt:'Toronto waterfront and CN Tower under a clear sky',altAr:'واجهة تورونتو البحرية وبرج سي إن تحت سماء صافية',position:'48% 50%'},
 {id:'sydney',en:'Sydney, Australia',ar:'سيدني، أستراليا',alt:'Sydney Harbour Bridge and the city waterfront',altAr:'جسر ميناء سيدني والواجهة البحرية للمدينة',position:'50% 38%'},
 {id:'berlin',en:'Berlin, Germany',ar:'برلين، ألمانيا',alt:'Berlin city skyline and the television tower in evening sunlight',altAr:'أفق برلين وبرج التلفزيون في ضوء المساء',position:'50% 50%'}
];

export default function HomeHero({locale}:{locale:Locale}){
 const t=(en:string,ar:string)=>text(locale,en,ar);
 const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[focused,setFocused]=useState(false);
 const [hidden,setHidden]=useState(false),[reduced,setReduced]=useState(true),[laterReady,setLaterReady]=useState(false);
 const [loaded,setLoaded]=useState([false,false,false]);const firstImage=useRef<HTMLImageElement>(null),heroRef=useRef<HTMLElement>(null),carouselRef=useRef<HTMLDivElement>(null);
 const firstSource=imageSources('/images/hero/toronto.jpg');
 preload(firstSource.src,{as:'image',fetchPriority:'high',imageSrcSet:firstSource.srcSet,imageSizes:firstSource.sizes});
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion=()=>setReduced(media.matches),visibility=()=>setHidden(document.hidden);
  motion();visibility();media.addEventListener('change',motion);document.addEventListener('visibilitychange',visibility);
  if(firstImage.current?.complete&&firstImage.current.naturalWidth)setLoaded(previous=>[true,...previous.slice(1)]);
  const timer=window.setTimeout(()=>setLaterReady(true),1000);
  return()=>{clearTimeout(timer);media.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visibility)};
 },[]);
 useEffect(()=>{
  const hero=heroRef.current,shell=hero?.closest('.site-shell');if(!hero||!shell)return;
  const observer=new IntersectionObserver(entries=>shell.classList.toggle('home-hero-visible',entries[0].isIntersecting));
  observer.observe(hero);return()=>{observer.disconnect();shell.classList.remove('home-hero-visible')};
 },[]);
 useEffect(()=>{
  if(paused||focused||hidden||reduced)return;
  const timer=window.setInterval(()=>{
   if(document.hidden||carouselRef.current?.contains(document.activeElement))return;
   setActive(current=>loaded[(current+1)%slides.length]?(current+1)%slides.length:current);
  },7000);
  return()=>clearInterval(timer);
 },[paused,focused,hidden,reduced,loaded]);
 return <section ref={heroRef} className="home-hero wrap" aria-labelledby="home-hero-title">
  <div className="home-hero-copy">
   <div className="eyebrow"><span/>{t('FROM KUWAIT. TOWARDS YOUR NEXT CHAPTER.','من الكويت، نحو فصلك القادم.')}</div>
   <h1 id="home-hero-title"><span>{t('A world of opportunity.','عالم من الفرص.')}</span><em>{locale==='en'?'A clear plan forward.':<>وخطة واضحة <span className="home-hero-phrase">للمضي قدماً.</span></>}</em></h1>
   <p className="home-hero-description">{t('Explore pathways to live, work, invest or study abroad—with personalised guidance from Plan B Consultant in Kuwait.','استكشف مسارات العيش والعمل والاستثمار والدراسة في الخارج، بإرشاد يناسبك من بلان بي كونسلتنت في الكويت.')}</p>
   <div className="home-hero-actions"><a className="button" href={`/${locale}/consultation`}>{t('Book a Free Consultation','احجز استشارة مجانية')}<ArrowUpRight size={18}/></a><a className="text-link outline-link" href={`/${locale}/programmes`}>{t('Explore Programmes','استكشف البرامج')}<ArrowUpRight size={18}/></a></div>
   <p className="home-hero-guidance">{[["Personalised assessment","تقييم يناسبك"],["Clear next steps","خطوات تالية واضحة"],["Guidance throughout","إرشاد طوال الرحلة"]].map(item=><span key={item[0]}><Check size={13} strokeWidth={1.7}/>{t(item[0],item[1])}</span>)}</p>
  </div>
  <div ref={carouselRef} className="home-hero-media" role="region" aria-roledescription={t('carousel','عرض صور')} aria-label={t('Explore destinations','استكشف الوجهات')} onFocusCapture={()=>setFocused(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))setFocused(false)}}>
   <div className="home-hero-outline" aria-hidden="true"/>
   <svg className="home-hero-journey" viewBox="0 0 120 160" fill="none" aria-hidden="true" focusable="false"><path d="M105 153C28 122 19 57 71 12"/><g transform="translate(67 8) rotate(40)"><Plane size={17} strokeWidth={1.3}/></g></svg>
   <div className="home-hero-arch">
    {slides.map((slide,index)=>(index===0||laterReady)&&<figure key={slide.id} className={'home-hero-slide'+(active===index?' is-active':'')} aria-hidden={active!==index}>
     <img ref={index===0?firstImage:undefined} {...imageSources(`/images/hero/${slide.id}.jpg`)} alt={t(slide.alt,slide.altAr)} width={index===1?1367:1400} height={index===1?1823:933} style={{objectPosition:slide.position}} fetchPriority={index===0?'high':'low'} loading="eager" decoding="async" onLoad={()=>setLoaded(previous=>previous.map((value,i)=>i===index?true:value))}/>
     <figcaption><MapPin size={15}/>{t(slide.en,slide.ar)}</figcaption>
    </figure>)}
   </div>
   <div className="home-hero-controls">
    <div className="home-hero-selectors" role="group" aria-label={t('Choose destination photograph','اختر صورة الوجهة')}>{slides.map((slide,index)=><button key={slide.id} className={active===index?'is-active':''} type="button" aria-label={t('Show '+slide.en,'اعرض '+slide.ar)} aria-pressed={active===index} disabled={!loaded[index]} onClick={()=>{setActive(index);setPaused(true)}}><span/></button>)}</div>
    <button className="home-hero-play" type="button" disabled={reduced} aria-label={reduced?t('Automatic rotation disabled for reduced motion','التبديل التلقائي معطّل لتقليل الحركة'):paused?t('Play destination slideshow','تشغيل عرض الوجهات'):t('Pause destination slideshow','إيقاف عرض الوجهات مؤقتاً')} onClick={()=>setPaused(value=>!value)}>{paused||reduced?<Play size={14}/>:<Pause size={14}/>}<span>{paused?t('Resume slideshow','استئناف عرض الصور'):t('Pause slideshow','إيقاف عرض الصور')}</span></button>
   </div>
  </div>
  <nav className="home-hero-services" aria-label={t('Browse by route','تصفح حسب المسار')}>{[['skilled','Skilled Immigration','هجرة الكفاءات'],['work','Work Permits','تصاريح العمل'],['business','Business Investment','استثمار الأعمال'],['study','Study & Visit Visas','تأشيرات الدراسة والزيارة']].map(c=><a key={c[0]} href={c[0]==='study'?`/${locale}/programmes/study-visas`:`/${locale}/programmes#${c[0]}`}>{t(c[1],c[2])}</a>)}</nav>
 </section>;
}

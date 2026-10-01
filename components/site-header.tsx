'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,ChevronDown,Menu,X} from 'lucide-react';
import LogoMark from './logo-mark';
import {ContactLinks,SocialLinks} from './contact-links';
import {text,type Locale} from '@/lib/content';

type NavLink={slug:string;en:string;ar:string};
type NavGroup={id:string;en:string;ar:string;countries:{en:string;ar:string;links:NavLink[]}[]};

const groups:NavGroup[]=[
 {id:'skilled',en:'Skilled Immigration',ar:'هجرة الكفاءات',countries:[
  {en:'Canada',ar:'كندا',links:[{slug:'canada-express-entry',en:'Canada Express Entry',ar:'الدخول السريع إلى كندا'}]},
  {en:'Australia',ar:'أستراليا',links:[{slug:'australia-skilled-migration',en:'Australia Permanent Residency',ar:'الإقامة الدائمة في أستراليا'},{slug:'australia-work-visas',en:'Australia Work Visa',ar:'تأشيرة العمل في أستراليا'}]}
 ]},
 {id:'business',en:'Business Immigration',ar:'هجرة الأعمال',countries:[
  {en:'Canada',ar:'كندا',links:[{slug:'canada-c11',en:'C11 Entrepreneur Program',ar:'برنامج رواد الأعمال C11'}]},
  {en:'United States',ar:'الولايات المتحدة',links:[{slug:'usa-eb5',en:'EB-5 Investor Program',ar:'برنامج المستثمر EB-5'},{slug:'usa-e2',en:'E-2 Treaty Investor Program',ar:'برنامج مستثمر المعاهدة E-2'}]},
  {en:'Investment Pathways',ar:'مسارات الاستثمار',links:[{slug:'../services/business-immigration',en:'Residency through Investment',ar:'الإقامة عن طريق الاستثمار'},{slug:'citizenship-investment',en:'Citizenship by Investment',ar:'الجنسية عن طريق الاستثمار'}]}
 ]},
 {id:'work',en:'Work Permits',ar:'تصاريح العمل',countries:[
  {en:'Germany',ar:'ألمانيا',links:[{slug:'germany-nursing',en:'Nursing Opportunities',ar:'فرص التمريض'},{slug:'germany-car-mechanics',en:'Car Mechanic Opportunities',ar:'فرص ميكانيكي السيارات'}]},
  {en:'Sweden',ar:'السويد',links:[{slug:'sweden-work-permit',en:'Work Opportunities',ar:'فرص العمل'}]},
  {en:'Portugal',ar:'البرتغال',links:[{slug:'portugal-work-residence',en:'Work Opportunities',ar:'فرص العمل'}]}
 ]}
];

function programmeHref(locale:Locale,slug:string){return slug.startsWith('../')?`/${locale}/${slug.slice(3)}`:`/${locale}/programmes/${slug}`}

export default function SiteHeader({locale,path}:{locale:Locale;path:string[]}){
 const t=(en:string,ar:string)=>text(locale,en,ar);const base='/'+locale;const page=path[0]||'home';const current=path[1]||'';
 const [openMenu,setOpenMenu]=useState<string|null>(null);const [mobileOpen,setMobileOpen]=useState(false);const shellRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{const onPointer=(event:PointerEvent)=>{if(!shellRef.current?.contains(event.target as Node))setOpenMenu(null)};const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpenMenu(null);setMobileOpen(false)}};document.addEventListener('pointerdown',onPointer);document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('pointerdown',onPointer);document.removeEventListener('keydown',onKey)}},[]);
 useEffect(()=>{document.documentElement.classList.toggle('nav-lock',mobileOpen);return()=>document.documentElement.classList.remove('nav-lock')},[mobileOpen]);
 const active=(group:NavGroup)=>group.countries.some(country=>country.links.some(link=>link.slug===current));
 const direct=[
  {href:`${base}/programmes/study-visas`,en:'Study Visa',ar:'تأشيرة الدراسة',isActive:current==='study-visas'},
  {href:`${base}/programmes/visit-visas`,en:'Visit Visa',ar:'تأشيرة الزيارة',isActive:current==='visit-visas'},
  {href:`${base}/about`,en:'About Us',ar:'من نحن',isActive:page==='about'},
  {href:`${base}/contact`,en:'Contact Us',ar:'تواصل معنا',isActive:page==='contact'}
 ];
 return <div className="site-masthead final-masthead" ref={shellRef}>
  <div className="topline"><div className="header-wide utility-inner"><div className="utility-contact"><ContactLinks locale={locale}/></div><SocialLinks locale={locale}/></div></div>
  <header className="header"><div className="header-wide header-inner">
   <a className="brand header-brand" href={base} aria-label={t('Plan B Consultant home','بلان بي للاستشارات — الرئيسية')}><LogoMark locale={locale}/><span><strong>{t('PLAN B','بلان بي')}</strong><small>{t('CONSULTANT','للاستشارات')}</small></span></a>
   <nav className="desktop-nav final-desktop-nav" aria-label={t('Main navigation','التنقل الرئيسي')}>
    <a className={page==='home'?'active':''} aria-current={page==='home'?'page':undefined} href={base}>{t('Home','الرئيسية')}</a>
    {groups.map(group=><div className="nav-dropdown" key={group.id} onMouseEnter={()=>setOpenMenu(group.id)} onMouseLeave={()=>setOpenMenu(null)}><button type="button" className={'nav-button '+(active(group)?'active':'')} aria-expanded={openMenu===group.id} aria-haspopup="menu" onClick={()=>setOpenMenu(openMenu===group.id?null:group.id)}>{t(group.en,group.ar)}<ChevronDown size={14}/></button>{openMenu===group.id&&<div className={'nav-panel nav-panel-'+group.id} role="menu">{group.countries.map(country=><section key={country.en}><h3>{t(country.en,country.ar)}</h3>{country.links.map(link=><a role="menuitem" aria-current={link.slug===current?'page':undefined} key={link.slug} href={programmeHref(locale,link.slug)}>{t(link.en,link.ar)}<ArrowUpRight size={14}/></a>)}</section>)}</div>}</div>)}
    {direct.map(link=><a key={link.en} className={link.isActive?'active':''} aria-current={link.isActive?'page':undefined} href={link.href}>{t(link.en,link.ar)}</a>)}
   </nav>
   <div className="header-actions final-header-actions"><a className="language" href={'/'+(locale==='en'?'ar':'en')+(path.length?'/'+path.join('/'):'')} lang={locale==='en'?'ar':'en'}>{locale==='en'?'العربية':'English'}</a><a className="button small header-cta" href={`${base}/consultation`}>{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={16}/></a><button className="mobile-nav-toggle" type="button" aria-expanded={mobileOpen} aria-controls="mobile-site-navigation" aria-label={mobileOpen?t('Close navigation','إغلاق قائمة التنقل'):t('Open navigation','فتح قائمة التنقل')} onClick={()=>setMobileOpen(!mobileOpen)}>{mobileOpen?<X size={24}/>:<Menu size={24}/>}</button></div>
  </div></header>
  {mobileOpen&&<nav id="mobile-site-navigation" className="final-mobile-panel" aria-label={t('Mobile navigation','التنقل عبر الهاتف')}><div className="header-wide mobile-nav-inner"><a className={page==='home'?'active':''} aria-current={page==='home'?'page':undefined} href={base}>{t('Home','الرئيسية')}<ArrowUpRight size={17}/></a>{groups.map(group=><details key={group.id} className="mobile-nav-group"><summary>{t(group.en,group.ar)}<ChevronDown size={17}/></summary><div>{group.countries.map(country=><section key={country.en}><h3>{t(country.en,country.ar)}</h3>{country.links.map(link=><a aria-current={link.slug===current?'page':undefined} key={link.slug} href={programmeHref(locale,link.slug)}>{t(link.en,link.ar)}</a>)}</section>)}</div></details>)}{direct.map(link=><a key={link.en} className={link.isActive?'active':''} aria-current={link.isActive?'page':undefined} href={link.href}>{t(link.en,link.ar)}<ArrowUpRight size={17}/></a>)}<a className="button mobile-consultation" href={`${base}/consultation`}>{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={17}/></a></div></nav>}
 </div>;
}

import {ArrowUpRight,Check,Compass} from 'lucide-react';
import {services,text,type Locale} from '@/lib/content';
import {programmes} from '@/lib/programmes';
import {serviceNotes,serviceRoutes} from '@/lib/service-overviews';

export default function ServiceOverview({locale:l,slug}:{locale:Locale;slug:string}){
 const s=services.find(item=>item.slug===slug)!;
 const t=(en:string,ar:string)=>text(l,en,ar);
 const routes=(serviceRoutes[slug]||[]).map(id=>programmes.find(p=>p.slug===id)!).filter(Boolean);
 return <>
  <section className="wrap inner-hero service-overview-hero">
   <div className="breadcrumb"><a href={'/'+l}>{t('Home','الرئيسية')}</a><span>/</span><a href={'/'+l+'/services'}>{t('Services','الخدمات')}</a><span>/</span><span>{t(s.title,s.ar)}</span></div>
   <div className="eyebrow">{t('YOUR GOALS. A CLEAR START.','أهدافك. بداية واضحة.')}</div>
   <h1>{t(s.title,s.ar)}</h1><p className="lead">{t(s.description,s.descriptionAr)}</p>
  </section>
  <section className="wrap detail-grid service-overview">
   <article><h2>{t(s.short,s.shortAr)}</h2><p>{t(...serviceNotes[slug])}</p><h3>{t('What we can discuss','ما يمكننا مناقشته')}</h3><ul className="check-list">{s.items.map((item,i)=><li key={item}><Check size={18}/><span>{t(item,s.itemsAr[i])}</span></li>)}</ul>
   <div className="service-preparation"><h3>{t('Bring your questions','أحضر أسئلتك')}</h3><p>{t('A short summary of your goals, nationality, current residence and preferred timing is enough to begin. Share relevant work, study or business background. Please keep passports and financial documents out of the initial enquiry.','يكفي ملخص لأهدافك وجنسيتك وإقامتك الحالية والتوقيت المفضل للبدء. شارك خلفيتك المهنية أو الدراسية أو التجارية ذات الصلة. لا ترسل جوازات أو مستندات مالية عبر الاستفسار الأولي.')}</p></div></article>
   <aside className="detail-aside"><Compass size={32}/><h3>{t('Let’s clarify your next step.','لنوضح خطوتك التالية.')}</h3><p>{t('Start with a free initial conversation. We will discuss the scope of support before you decide to proceed.','ابدأ بمحادثة أولية مجانية. نناقش نطاق الدعم قبل أن تقرر المتابعة.')}</p><a className="button" href={'/'+l+'/consultation?service='+slug}>{t('Free consultation','استشارة مجانية')}<ArrowUpRight size={17}/></a><small>{t('An enquiry, not an eligibility decision or confirmed appointment.','استفسار وليس قرار أهلية أو موعداً مؤكداً.')}</small></aside>
  </section>
  <section className="wrap section service-programmes"><div className="section-heading"><div className="eyebrow">{t('EXPLORE THE NEXT STEP','استكشف الخطوة التالية')}</div><h2>{t(routes.length===1?'Read the overview':'Explore relevant programmes',routes.length===1?'اقرأ النظرة العامة':'استكشف البرامج ذات الصلة')}</h2></div><div className="programme-grid">{routes.map(p=><a className="programme-card" key={p.slug} href={'/'+l+'/programmes/'+p.slug}><h3>{t(p.title,p.ar)}</h3><p>{t(p.intro,p.introAr)}</p><span className="card-link">{t('Explore programme','استكشف البرنامج')}<ArrowUpRight size={18}/></span></a>)}</div><p className="small-note">{t('Detailed requirements belong to the individual route. Confirm current availability, responsibilities and written fees before agreeing to further support.','ترد المتطلبات التفصيلية في صفحة كل مسار. أكّد التوفر الحالي والمسؤوليات والرسوم كتابياً قبل الاتفاق على دعم إضافي.')}</p></section>
 </>;
}

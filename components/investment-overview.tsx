import {ArrowUpRight,Check} from 'lucide-react';
import {text,type Locale} from '@/lib/content';
import {programmes} from '@/lib/programmes';
import {investmentCategories,investmentProgrammes,investmentPath,type InvestmentCategory} from '@/lib/investment-programmes';

const copy={
 citizenship:{
  eyebrow:['TEN COUNTRY PROGRAMMES','برامج عشر دول'],
  lead:['Citizenship by investment means applying for a country’s nationality on the basis of a contribution or investment that its law accepts. If the government approves the application, you become a citizen of that country — a different legal status from holding residence there.','الجنسية عن طريق الاستثمار تعني التقدّم بطلب جنسية دولة ما على أساس مساهمة أو استثمار يقبله قانونها. فإذا وافقت الحكومة على الطلب، تصبح مواطناً في تلك الدولة، وهو وضع قانوني يختلف عن الحصول على إقامة فيها.'],
  points:[
   ['Each country sets its own routes, such as a fund contribution, real estate or bonds.','تحدد كل دولة مساراتها الخاصة، مثل المساهمة في صندوق أو العقار أو السندات.'],
   ['Family eligibility, background checks, government fees and timing differ by programme.','تختلف أهلية أفراد الأسرة وفحوص الخلفية والرسوم الحكومية والمدة من برنامج إلى آخر.'],
   ['The government decides every application. Plan B does not promise approval, timing or travel outcomes.','تقرر الحكومة في كل طلب. ولا تعد بلان بي بالموافقة أو بمدة محددة أو بنتائج تتعلق بالسفر.'],
  ],
 },
 residency:{
  eyebrow:['EIGHT DESTINATIONS','ثماني وجهات'],
  lead:['Residency by investment means applying for the right to live in a country on the basis of a qualifying investment, property, deposit or financial arrangement. Residence is not citizenship: you keep your nationality, and you must meet the conditions for keeping your status.','الإقامة عن طريق الاستثمار تعني التقدّم بطلب حق العيش في دولة ما على أساس استثمار أو عقار أو وديعة أو ترتيب مالي مؤهل. والإقامة ليست جنسية: فأنت تحتفظ بجنسيتك، وعليك استيفاء شروط الحفاظ على وضعك.'],
  points:[
   ['Routes differ: real estate, investment funds, deposits, business setup or a tax arrangement.','تختلف المسارات: عقار أو صناديق استثمار أو ودائع أو تأسيس نشاط تجاري أو ترتيب ضريبي.'],
   ['Some routes require visits, tax residence or a maintained investment to keep the status.','تتطلب بعض المسارات زيارات أو إقامة ضريبية أو الإبقاء على الاستثمار للحفاظ على الوضع.'],
   ['Citizenship, where available, is a separate later application with its own rules.','الجنسية، حيث تتاح، طلب لاحق منفصل له شروطه الخاصة.'],
  ],
 },
} as const;

export default function InvestmentOverview({locale:l,category}:{locale:Locale;category:InvestmentCategory}){
 const t=(en:string,ar:string)=>text(l,en,ar);const tt=(v:readonly [string,string])=>t(v[0],v[1]);
 const cat=investmentCategories[category],c=copy[category],other=category==='citizenship'?'residency':'citizenship';
 const list=investmentProgrammes.filter(p=>p.category===category);
 const eb5=category==='residency'?programmes.find(p=>p.slug==='usa-eb5'):undefined;
 return <>
  <section className="wrap inner-hero service-overview-hero inv-overview-hero">
   <nav className="breadcrumb" aria-label={t('Breadcrumb','مسار التنقل')}><a href={'/'+l}>{t('Plan B Consultant','بلان بي للاستشارات')}</a><span aria-hidden="true">/</span><span aria-current="page">{tt(cat.label)}</span></nav>
   <div className="eyebrow">{tt(c.eyebrow)}</div>
   <h1>{tt(cat.label)}</h1><p className="lead">{tt(c.lead)}</p>
   <ul className="check-list inv-overview-points">{c.points.map(point=><li key={point[0]}><Check size={18} aria-hidden="true"/><span>{tt(point)}</span></li>)}</ul>
  </section>
  <section className="wrap section inv-overview-list" aria-labelledby="inv-programmes">
   <div className="section-heading"><div><div className="eyebrow">{t('CHOOSE A DESTINATION','اختر وجهة')}</div><h2 id="inv-programmes">{t(`All ${list.length} ${category} programmes`,category==='citizenship'?`جميع برامج الجنسية (${list.length})`:`جميع برامج الإقامة (${list.length})`)}</h2></div><p>{t('Each page sets out the routes, indicative timing, stay conditions and questions to raise before you commit funds.','تعرض كل صفحة المسارات والمدة التقريبية وشروط البقاء والأسئلة التي ينبغي طرحها قبل الالتزام بأي أموال.')}</p></div>
   <ol className="inv-card-grid">{list.map(p=><li key={p.id}><a className="inv-card" href={'/'+l+'/'+investmentPath(p)}><span className="inv-code" aria-hidden="true">{p.iso}</span><span className="inv-card-body"><strong>{tt(p.name)}</strong><small>{tt(p.routeTypes)}</small></span><span className="inv-card-link">{t(`View ${p.name[0]} programme`,`عرض برنامج ${p.name[1]}`)}<ArrowUpRight size={16} aria-hidden="true"/></span></a></li>)}
    {eb5&&<li><a className="inv-card" href={'/'+l+'/programmes/'+eb5.slug}><span className="inv-code" aria-hidden="true">US</span><span className="inv-card-body"><strong>{t('United States — EB-5','الولايات المتحدة — EB-5')}</strong><small>{t('Immigrant investor route','مسار المستثمر المهاجر')}</small></span><span className="inv-card-link">{t('View EB-5 programme','عرض برنامج EB-5')}<ArrowUpRight size={16} aria-hidden="true"/></span></a></li>}
   </ol>
   <p className="small-note">{t('Programme terms change. Confirm current official requirements, every fee and the authorised service providers in writing before committing funds.','تتغير شروط البرامج. أكّد كتابياً المتطلبات الرسمية الحالية وجميع الرسوم ومقدمي الخدمات المخوّلين قبل الالتزام بأي أموال.')}</p>
  </section>
  <section className="wrap programme-final-cta inv-overview-cta"><div><div className="eyebrow">{t('NOT SURE WHERE TO START?','لست متأكداً من أين تبدأ؟')}</div><h2>{t('Discuss your options with Plan B Consultant.','ناقش خياراتك مع بلان بي للاستشارات.')}</h2><p>{t('Free initial conversation. An enquiry is not an eligibility decision or a confirmed appointment.','محادثة أولية مجانية. الاستفسار ليس قرار أهلية ولا موعداً مؤكداً.')}</p></div><div className="inv-cta-actions"><a className="button light" href={'/'+l+'/consultation?service='+cat.service}>{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link inv-light-link" href={'/'+l+'/services/'+investmentCategories[other].service}>{t(`Compare ${investmentCategories[other].label[0]}`,`قارن ${investmentCategories[other].label[1]}`)}<ArrowUpRight size={16} aria-hidden="true"/></a></div></section>
 </>;
}

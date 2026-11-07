import {ArrowUpRight,Check,Landmark,ShieldCheck} from 'lucide-react';
import Assessment from './assessment';
import ProgrammeSubnav from './programme-subnav';
import {Accordion,AccordionItem,AccordionTrigger,AccordionContent} from '@/components/ui/accordion';
import {text,type Locale} from '@/lib/content';
import {investmentCategories,investmentProgrammes,investmentPath,investmentTitle,type InvestmentProgramme,type L} from '@/lib/investment-programmes';

/** Shared template for the 18 investment programme pages. Sections render only when the programme has content for them. */
export default function InvestmentPage({locale:l,programme:p}:{locale:Locale;programme:InvestmentProgramme}){
 const ar=l==='ar';const t=(en:string,arText:string)=>text(l,en,arText);const tt=(v:L)=>ar?v[1]:v[0];
 const cat=investmentCategories[p.category],res=p.category==='residency',name=tt(p.name);
 const overview='/'+l+'/services/'+cat.service,consult='/'+l+'/consultation?programme='+p.id;
 const showAdvantage=!p.held?.includes('advantage');
 const amount=(v:string|null)=>v?<bdi dir="ltr">{v}</bdi>:<span className="inv-unlisted">{t('Amount not listed on this page — ask us for the current official figure','المبلغ غير مدرج في هذه الصفحة — اسألنا عن الرقم الرسمي الحالي')}</span>;
 const presenceLabel={maintain:['To maintain status','للحفاظ على الوضع'],condition:['Residence condition','شرط الإقامة'],none:['Stay requirement','متطلبات البقاء']}[p.presenceStage] as unknown as L;

 const glance:{label:L;value:React.ReactNode;note?:L}[]=[
  {label:p.capitalLabel||['Minimum Capital','الحد الأدنى لرأس المال'],value:<ul className="inv-routes">{p.capital.map(line=><li key={line.route[0]}><span>{tt(line.route)}</span><b>{amount(line.amount)}</b></li>)}</ul>},
  {label:['Processing Window','مدة المعالجة'],value:tt(p.processing),note:['An estimate, not a deadline or guarantee.','تقدير وليس موعداً نهائياً أو ضماناً.']},
  {label:['Physical Presence','الحضور الفعلي'],value:tt(p.presence)},
  ...(showAdvantage?[{label:['Primary Advantage','الميزة الرئيسية'] as L,value:tt(p.advantage),note:p.advantageKind==='separate'?['Requires its own separate application or election.','تتطلب طلباً أو اختياراً مستقلاً.'] as L:undefined}]:[]),
 ];
 const benefits:{text:string;tag:L;link?:{href:string;label:L}}[]=[
  {text:res?t(`A residence status in ${name}, if the application is approved. Residence is not citizenship.`,`وضع إقامة في ${name} عند الموافقة على الطلب. والإقامة ليست جنسية.`):t(`Citizenship of ${name}, if the government approves the application.`,`جنسية ${name} عند موافقة الحكومة على الطلب.`),tag:['Status on approval','الوضع عند الموافقة']},
  ...(showAdvantage?[{text:tt(p.advantage),tag:(p.advantageKind==='separate'?['Separate application','طلب مستقل']:['Stated advantage','ميزة مذكورة']) as L,link:p.relatedPage}]:[]),
  ...(p.family?[{text:tt(p.family),tag:['Family','الأسرة'] as L}]:[]),
  ...(p.presenceStage==='none'?[{text:tt(p.presence),tag:['Stay','البقاء'] as L}]:[]),
 ];
 const faqs:[string,React.ReactNode][]=[
  [t(`What investment routes are listed for ${name}?`,`ما مسارات الاستثمار المدرجة لـ${name}؟`),<>{p.capital.map(line=><span className="inv-faq-line" key={line.route[0]}>{tt(line.route)}: {amount(line.amount)}</span>)}{p.otherRoutes&&<span className="inv-faq-line">{tt(p.otherRoutes)}</span>}<span className="inv-faq-line">{t('Government, due-diligence and family charges are not listed on this page. Ask for a current written breakdown before committing funds.','لا تُدرج هذه الصفحة الرسوم الحكومية ورسوم التدقيق ورسوم أفراد الأسرة. اطلب تفصيلاً مكتوباً حديثاً قبل الالتزام بأي أموال.')}</span></>],
  [t('How long does processing take?','كم تستغرق المعالجة؟'),t(`The stated estimate is: ${p.processing[0]}. It is an estimate, not a deadline or a guarantee; the authority sets the pace of each application.`,`التقدير المذكور: ${p.processing[1]}. وهو تقدير وليس موعداً نهائياً أو ضماناً؛ إذ تحدد الجهة المختصة وتيرة كل طلب.`)],
  [t(`Do I need to live in or visit ${name}?`,`هل يلزمني العيش في ${name} أو زيارتها؟`),tt(p.presence)+(p.presenceStage==='maintain'?t(' This is a condition after approval, for keeping the status.',' وهذا شرط بعد الموافقة للحفاظ على الوضع.'):'')],
  ...(p.family?[[t('Can my family be included?','هل يمكن إدراج أسرتي؟'),tt(p.family)+t(' Confirm the current dependant rules and fees for your family before applying.',' تحقّق من القواعد والرسوم الحالية للمعالين قبل التقديم.')] as [string,React.ReactNode]]:[]),
  [t('Is approval guaranteed?','هل الموافقة مضمونة؟'),t('No. The competent government authority decides every application. Plan B Consultant does not promise approval, timing or any travel, tax or investment outcome.','لا. تقرر الجهة الحكومية المختصة في كل طلب. ولا تعد بلان بي للاستشارات بالموافقة أو بمدة محددة أو بأي نتيجة تتعلق بالسفر أو الضرائب أو الاستثمار.')],
 ];
 const nav:[string,string][]=[['overview',t('Overview','نظرة عامة')],['at-a-glance',t('At a glance','لمحة سريعة')],['benefits',t('Benefits','المزايا')],['requirements',t('Requirements','المتطلبات')],['investment',t('Investment','الاستثمار')],['process',t('Process','الخطوات')],['faqs',t('FAQs','الأسئلة')],['assessment',t('Free assessment','التقييم المجاني')]];
 const groups=(['citizenship','residency'] as const).map(c=>({c,items:investmentProgrammes.filter(x=>x.category===c&&x.id!==p.id)}));

 return <>
  <section className={'inv-hero'+(p.image?' has-image':'')}>
   {p.image&&<img className="inv-hero-image" src={p.image.src} alt={tt(p.image.alt)} width="1600" height="900" fetchPriority="high"/>}
   <div className="wrap inv-hero-inner">
    <div className="inv-hero-copy">
     <nav className="breadcrumb" aria-label={t('Breadcrumb','مسار التنقل')}><a href={'/'+l}>{t('Plan B Consultant','بلان بي للاستشارات')}</a><span aria-hidden="true">/</span><a href={overview}>{tt(cat.label)}</a><span aria-hidden="true">/</span><span aria-current="page">{name}</span></nav>
     <div className="eyebrow">{tt(cat.label).toUpperCase()}</div>
     <h1>{investmentTitle(p,ar)}</h1>
     <p className="lead">{res?t(`Review the residency routes, indicative timing and stay conditions listed for ${name}, then discuss your circumstances with Plan B.`,`راجع مسارات الإقامة والمدة التقريبية وشروط البقاء المدرجة لـ${name}، ثم ناقش ظروفك مع بلان بي.`):t(`Review the citizenship routes, indicative timing and stay conditions listed for ${name}, then discuss your circumstances with Plan B.`,`راجع مسارات الجنسية والمدة التقريبية وشروط البقاء المدرجة لـ${name}، ثم ناقش ظروفك مع بلان بي.`)}</p>
     <div className="programme-actions"><a className="button" href="#assessment">{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={17} aria-hidden="true"/></a><a className="text-link" href={overview}>{t(`All ${cat.label[0].toLowerCase()} programmes`,`جميع برامج ${cat.short[1]}`)}<ArrowUpRight size={16} aria-hidden="true"/></a></div>
    </div>
    {!p.image&&<div className="inv-hero-stamp" aria-hidden="true"><span>{p.iso}</span><small>{tt(cat.short)}</small></div>}
   </div>
   {p.image&&<small className="inv-credit">{p.image.credit}</small>}
  </section>

  <ProgrammeSubnav label={t('On this page','في هذه الصفحة')} items={nav}/>

  <section className="wrap inv-section inv-about" id="overview">
   <div><div className="eyebrow">{t(`ABOUT ${p.name[0].toUpperCase()}`,`عن ${p.name[1]}`)}</div><h2>{t(`${p.name[0]} at a glance`,`${p.name[1]} في لمحة`)}</h2></div>
   <p className="inv-description">{ar?p.descriptionAr:p.source.description}</p>
  </section>

  <section className="wrap inv-section" id="at-a-glance" aria-labelledby="glance-h">
   <div className="eyebrow">{t('PROGRAMME AT A GLANCE','البرنامج في لمحة')}</div><h2 id="glance-h">{t('The key figures and conditions.','الأرقام والشروط الأساسية.')}</h2>
   <dl className="inv-glance">{glance.map(g=><div key={g.label[0]}><dt>{tt(g.label)}</dt><dd>{g.value}{g.note&&<small>{tt(g.note)}</small>}</dd></div>)}</dl>
   <p className="small-note">{t('Figures and timings are shown as supplied in the programme summary. Confirm current official terms before relying on them.','تُعرض الأرقام والمدد كما وردت في ملخص البرنامج. تحقّق من الشروط الرسمية الحالية قبل الاعتماد عليها.')}</p>
  </section>

  <section className="wrap inv-invite"><p><strong>{t('Discuss your options with Plan B Consultant.','ناقش خياراتك مع بلان بي للاستشارات.')}</strong> {t('A free first conversation about this programme and your family’s plans.','محادثة أولى مجانية حول هذا البرنامج وخطط أسرتك.')}</p><a className="button" href={consult}>{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={17} aria-hidden="true"/></a></section>

  <section className="inv-pathway"><div className="wrap"><span className="inv-pathway-code" aria-hidden="true">{p.iso}</span><div><div className="eyebrow">{tt(cat.label).toUpperCase()}</div><h2>{res?t(`Your residency pathway in ${name}`,`مسار إقامتك في ${name}`):t(`Your citizenship pathway in ${name}`,`مسار جنسيتك في ${name}`)}</h2></div></div></section>

  <section className="wrap inv-section" id="benefits" aria-labelledby="benefits-h">
   <div className="eyebrow">{t('PROGRAMME BENEFITS','مزايا البرنامج')}</div><h2 id="benefits-h">{t('What the programme summary describes.','ما يصفه ملخص البرنامج.')}</h2>
   <ul className="inv-benefits">{benefits.map(b=><li key={b.text}><span className="inv-tag">{tt(b.tag)}</span><p>{b.text}</p>{b.link&&<a className="text-link" href={'/'+l+'/'+b.link.href}>{tt(b.link.label)}<ArrowUpRight size={15} aria-hidden="true"/></a>}</li>)}</ul>
  </section>

  <section className="inv-band" id="requirements" aria-labelledby="req-h"><div className="wrap inv-section">
   <div className="eyebrow">{t('REQUIREMENTS','المتطلبات')}</div><h2 id="req-h">{t('Conditions before and after approval.','الشروط قبل الموافقة وبعدها.')}</h2>
   <div className="inv-req-grid">
    <article><h3>{t('Before approval: investment','قبل الموافقة: الاستثمار')}</h3><ul className="check-list">{p.capital.map(line=><li key={line.route[0]}><Check size={18} aria-hidden="true"/><span>{tt(line.route)} — {amount(line.amount)}</span></li>)}</ul></article>
    <article><h3>{t(presenceLabel[0],presenceLabel[1])}</h3><p>{tt(p.presence)}</p></article>
    {p.family&&<article><h3>{t('Family eligibility','أهلية أفراد الأسرة')}</h3><p>{tt(p.family)}</p></article>}
    <article><h3>{t('Documents, checks and fees','المستندات والفحوص والرسوم')}</h3><p>{t('The official document list, due-diligence requirements and government fees are not listed on this page. Ask for the current official list before committing funds.','لا تُدرج هذه الصفحة قائمة المستندات الرسمية ومتطلبات التدقيق والرسوم الحكومية. اطلب القائمة الرسمية الحالية قبل الالتزام بأي أموال.')}</p></article>
   </div>
  </div></section>

  <section className="wrap inv-section" id="process" aria-labelledby="process-h">
   <div className="eyebrow">{t('HOW TO START WITH PLAN B','كيف تبدأ مع بلان بي')}</div><h2 id="process-h">{t('Your first steps with us.','خطواتك الأولى معنا.')}</h2>
   <p>{t('These are Plan B’s enquiry steps, not the government’s application or approval process.','هذه خطوات الاستفسار لدى بلان بي، وليست إجراءات التقديم أو الموافقة الحكومية.')}</p>
   <ol className="inv-steps">{[
    ['Send your contact details through the free assessment below.','أرسل بيانات التواصل عبر التقييم المجاني أدناه.'],
    ['Optionally add your plans and profile — or skip and discuss them later.','أضف خططك وملفك إن أردت، أو تجاوز ذلك وناقشها لاحقاً.'],
    ['We contact you to discuss this programme and what must be confirmed.','نتواصل معك لمناقشة هذا البرنامج وما يجب تأكيده.'],
    ['Before any commitment, obtain current official terms and written fees.','قبل أي التزام، احصل على الشروط الرسمية الحالية والرسوم مكتوبة.'],
   ].map((s,i)=><li key={s[0]}><span>{String(i+1).padStart(2,'0')}</span><p>{t(s[0],s[1])}</p></li>)}</ol>
   <p className="small-note">{t('Final eligibility and every decision remain with the relevant authority. Regulated representation and legal advice must come from an appropriately authorised professional; confirm the adviser’s credentials and written scope before proceeding.','تبقى الأهلية النهائية وكل قرار لدى الجهة المختصة. يجب أن يصدر التمثيل المنظم والمشورة القانونية من مختص مخول؛ تحقق من مؤهلات المستشار ونطاق الخدمة كتابياً قبل المتابعة.')}</p>
  </section>

  <section className="inv-band" id="investment" aria-labelledby="inv-h"><div className="wrap inv-section">
   <div className="eyebrow">{t('INVESTMENT OPTIONS','خيارات الاستثمار')}</div><h2 id="inv-h">{p.capital.length>1?t('The routes listed, side by side.','المسارات المدرجة جنباً إلى جنب.'):t('The route listed.','المسار المدرج.')}</h2>
   <div className="inv-options">{p.capital.map((line,i)=><article key={line.route[0]}><span className="inv-option-n">{p.capital.length>1?t(`Option ${i+1}`,`الخيار ${i+1}`):tt(p.capitalLabel||['Minimum capital','الحد الأدنى لرأس المال'])}</span><h3>{tt(line.route)}</h3><p className="inv-option-amount">{amount(line.amount)}</p></article>)}</div>
   {p.otherRoutes&&<p>{tt(p.otherRoutes)}</p>}
   <p className="small-note">{t('Amounts are shown as supplied. They are not quotes and do not include government, due-diligence, family or professional fees.','تُعرض المبالغ كما وردت. وهي ليست عروض أسعار ولا تشمل الرسوم الحكومية أو رسوم التدقيق أو أفراد الأسرة أو الأتعاب المهنية.')}</p>
  </div></section>

  {p.authority&&<section className="wrap inv-section inv-legal" aria-labelledby="legal-h"><Landmark size={28} aria-hidden="true"/><div><div className="eyebrow">{t('PROGRAMME AUTHORITY','الجهة المسؤولة عن البرنامج')}</div><h2 id="legal-h">{t('Read the official information.','اطّلع على المعلومات الرسمية.')}</h2><p><a className="text-link" href={p.authority.url} target="_blank" rel="noopener noreferrer">{tt(p.authority.label)}<ArrowUpRight size={15} aria-hidden="true"/></a></p><p className="small-note">{t('Opens the official site in a new tab. Official terms prevail over any summary on this page.','يفتح الموقع الرسمي في علامة تبويب جديدة. تسود الشروط الرسمية على أي ملخص في هذه الصفحة.')}</p></div></section>}

  <section className="wrap inv-section inv-profile" aria-labelledby="profile-h"><ShieldCheck size={28} aria-hidden="true"/><div><div className="eyebrow">{t('COUNTRY PROFILE','نبذة عن الدولة')}</div><h2 id="profile-h">{name}</h2><p>{tt(p.profile)}</p></div></section>

  <section className="wrap inv-section programme-faqs" id="faqs" aria-labelledby="faq-h">
   <div className="eyebrow">{t('COMMON QUESTIONS','أسئلة شائعة')}</div><h2 id="faq-h">{t(`Questions about ${p.name[0]}.`,`أسئلة حول ${p.name[1]}.`)}</h2>
   <Accordion type="single" collapsible defaultValue="0" className="faq-list">{faqs.map((f,i)=><AccordionItem key={i} value={String(i)}><AccordionTrigger className="faq-question">{f[0]}</AccordionTrigger><AccordionContent className="faq-answer">{f[1]}</AccordionContent></AccordionItem>)}</Accordion>
  </section>

  <section className="wrap inv-section inv-related" aria-labelledby="related-h">
   <h2 id="related-h">{t('Other programmes','برامج أخرى')}</h2>
   <div className="inv-related-grid">{groups.map(g=><div key={g.c}><h3><a href={'/'+l+'/services/'+investmentCategories[g.c].service}>{tt(investmentCategories[g.c].label)}<ArrowUpRight size={15} aria-hidden="true"/></a></h3><ul>{g.items.map(x=><li key={x.id}><a href={'/'+l+'/'+investmentPath(x)}>{tt(x.name)}</a></li>)}</ul></div>)}</div>
  </section>

  <section className="programme-assessment" id="assessment"><div className="wrap programme-assessment-grid"><div className="programme-assessment-intro"><div className="eyebrow">{t('EXPLORE YOUR ELIGIBILITY','استكشف أهليتك')}</div><h2>{res?t(`Is residency in ${name} right for you?`,`هل تناسبك الإقامة في ${name}؟`):t(`Is citizenship of ${name} right for you?`,`هل تناسبك جنسية ${name}؟`)}</h2><p>{t('Start with your contact details. Your plans and profile are optional. This free initial assessment is an enquiry—not an eligibility decision or confirmed appointment.','ابدأ ببيانات التواصل؛ أما الخطط والملف فاختيارية. هذا التقييم الأولي المجاني استفسار وليس قرار أهلية أو موعداً مؤكداً.')}</p></div><Assessment locale={l} initialProgramme={p.id}/></div></section>
 </>;
}

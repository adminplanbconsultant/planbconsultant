import {ArrowUpRight,Check,FileText,ShieldCheck} from 'lucide-react';
import Assessment from './assessment';
import {programmeAudiences} from '@/lib/programme-audiences';
import {programmeDetails} from '@/lib/programme-details';
import {programmes,programmeGroups} from '@/lib/programmes';
import {text,type Locale} from '@/lib/content';

const countryImages:Record<string,string>={Canada:'/images/destination-1.jpg',Australia:'/images/destination-2.jpg',Germany:'/images/destinations/germany.jpg',Sweden:'/images/destinations/sweden.jpg',Portugal:'/images/destinations/portugal.jpg','United States':'/images/destinations/usa.jpg'};
const contextImages:Record<string,string>={
 'germany-nursing':'/images/programmes/germany-nursing.png',
 'germany-car-mechanics':'/images/programmes/automotive-workshop.png',
 'canada-c11':'/images/programmes/canada-c11-operations.png',
 'usa-eb5':'/images/programmes/usa-eb5-investment.png',
 'usa-e2':'/images/programmes/usa-e2-enterprise.png'
};
const contextAlts:Record<string,[string,string]>={
 'germany-nursing':['Nursing professionals in a clinical workplace','متخصصو تمريض في بيئة سريرية'],
 'germany-car-mechanics':['Automotive technicians working in a workshop','فنيو سيارات يعملون في ورشة'],
 'canada-c11':['Entrepreneur actively managing a Canadian small business','رائد أعمال يدير نشاطاً صغيراً في كندا'],
 'usa-eb5':['Investor and advisers reviewing a United States development project','مستثمر ومستشارون يراجعون مشروع تطوير في الولايات المتحدة'],
 'usa-e2':['Owner directing an active United States business','مالك يدير نشاطاً تجارياً فعلياً في الولايات المتحدة']
};
const countryAr:Record<string,string>={Canada:'كندا',Australia:'أستراليا',Germany:'ألمانيا',Sweden:'السويد',Portugal:'البرتغال','United States':'الولايات المتحدة','Multiple destinations':'وجهات متعددة'};

const routeFacts:Record<string,[string,string]>={
 'canada-express-entry':['Permanent residence selection system','نظام اختيار للإقامة الدائمة'],
 'australia-skilled-migration':['Permanent and provisional skilled routes','مسارات مهارات دائمة ومؤقتة'],
 'australia-work-visas':['Employer-linked temporary and permanent routes','مسارات مؤقتة ودائمة مرتبطة بصاحب العمل'],
 'germany-nursing':['Regulated-profession employment route','مسار عمل لمهنة منظمة'],
 'germany-car-mechanics':['Skilled employment and recognition route','مسار عمل ماهر واعتراف مهني'],
 'sweden-work-permit':['Employer-based work permit','تصريح عمل قائم على صاحب العمل'],
 'portugal-work-residence':['Work visa and residence pathway','مسار تأشيرة عمل وإقامة'],
 'canada-c11':['Temporary significant-benefit work permit','تصريح عمل مؤقت لمنفعة كبيرة'],
 'usa-eb5':['Immigrant investor route','مسار مستثمر مهاجر'],
 'usa-e2':['Temporary treaty-investor status','وضع مؤقت لمستثمر بموجب معاهدة']
};

function documentsFor(group:string,t:(en:string,ar:string)=>string){
 const common=[t('Valid passport and civil-status records','جواز سفر ساري وسجلات الحالة المدنية'),t('Education, training and employment evidence','إثباتات التعليم والتدريب والعمل'),t('Language, police and medical evidence when requested','إثباتات اللغة والسجل الجنائي والفحص الطبي عند الطلب')];
 if(group==='business')return [...common,t('Business plan, ownership and operating evidence','خطة العمل وإثباتات الملكية والتشغيل'),t('Lawful source and path of funds records','سجلات المصدر والمسار المشروع للأموال')];
 if(group==='work')return [...common,t('Employment offer or contract and employer documents','عرض أو عقد العمل ومستندات صاحب العمل'),t('Qualification recognition or licensing evidence, where applicable','إثبات الاعتراف بالمؤهل أو الترخيص عند اللزوم')];
 if(group==='skilled')return [...common,t('Skills or credential assessment results','نتائج تقييم المهارات أو المؤهلات'),t('Detailed work-reference letters','خطابات خبرة عمل مفصلة')];
 return [...common,t('Purpose-specific financial and supporting evidence','إثباتات مالية وداعمة خاصة بالغرض')];
}

export default function ProgrammePage({locale:l,slug}:{locale:Locale;slug:string}){
 const p=programmes.find(item=>item.slug===slug);if(!p)return null;
 const t=(en:string,ar:string)=>text(l,en,ar);const group=programmeGroups.find(item=>item[0]===p.group)!;
 const detail=programmeDetails[p.slug];
 const hero=countryImages[p.country]||'/images/destination-0.jpg';
 const context=contextImages[p.slug]||'/images/programmes/international-workplace.png';
 const benefit=context==='/images/programmes/international-workplace.png'?'/images/programmes/business-advisory.png':'/images/programmes/international-workplace.png';
 const related=programmes.filter(item=>item.slug!==p.slug&&(item.group===p.group||item.country===p.country)).slice(0,3);
 const legal=p.group==='business'&&p.country==='United States';
 const faqs=[
  [t('Can I begin from Kuwait?','هل يمكنني البدء من الكويت؟'),t('Usually, an initial review can begin from Kuwait. Nationality, lawful residence, consular jurisdiction and the selected route determine where and how a formal application is made.','يمكن عادةً بدء المراجعة الأولية من الكويت. تحدد الجنسية والإقامة القانونية والاختصاص القنصلي والمسار المختار مكان وطريقة تقديم الطلب الرسمي.')],
  [t('What status can this route provide?','ما الوضع الذي يمكن أن يوفره هذا المسار؟'),t(...(routeFacts[p.slug]||['The result depends on the selected programme and official decision.','تعتمد النتيجة على البرنامج المختار والقرار الرسمي.']))+'.'],
  [t('Which documents should I prepare first?','ما المستندات التي أجهزها أولاً؟'),t('Start with your CV, education and employment history, family details and a short account of your objective. Do not send passport numbers, banking details or medical records through the initial form.','ابدأ بالسيرة الذاتية والسجل التعليمي والمهني وبيانات الأسرة وملخص هدفك. لا ترسل أرقام جوازات السفر أو البيانات المصرفية أو السجلات الطبية عبر النموذج الأولي.')],
  [t('Does an assessment guarantee approval?','هل يضمن التقييم الموافقة؟'),t(p.note,p.noteAr)]
 ];
 return <>
  <section className="programme-hero"><div className="wrap programme-hero-grid"><div className="programme-hero-copy"><div className="breadcrumb"><a href={'/'+l}>{t('Home','الرئيسية')}</a><span>/</span><a href={'/'+l+'/programmes'}>{t('Programmes','البرامج')}</a><span>/</span><span>{t(p.title,p.ar)}</span></div><div className="eyebrow"><span/>{t(group[1],group[2])}</div><h1>{t(p.title,p.ar)}</h1><p className="lead">{t(p.intro,p.introAr)}</p><div className="programme-actions"><a className="button" href="#assessment">{t('Check your eligibility','تحقق من أهليتك')}<ArrowUpRight size={17}/></a><a className="text-link" href={'/'+l+'/contact'}>{t('Speak with our team','تحدث مع فريقنا')}<ArrowUpRight size={16}/></a></div><dl className="route-summary"><div><dt>{t('Route type','نوع المسار')}</dt><dd>{t(...(routeFacts[p.slug]||['Programme-specific','حسب البرنامج']))}</dd></div><div><dt>{t('Destination','الوجهة')}</dt><dd>{t(p.country,countryAr[p.country])}</dd></div></dl></div><figure className="programme-hero-media"><img src={hero} alt={t(`${p.country} destination`,`${countryAr[p.country]} — صورة للوجهة`)} width="920" height="780" fetchPriority="high"/><figcaption>{t(p.country,countryAr[p.country])}</figcaption></figure></div></section>

  <section className="programme-assessment" id="assessment"><div className="wrap programme-assessment-grid"><div className="programme-assessment-intro"><span className="section-number">01</span><div className="eyebrow">{t('START WITH YOUR PROFILE','ابدأ بملفك')}</div><h2>{t('A useful first conversation starts with the right details.','تبدأ المحادثة المفيدة بالتفاصيل الصحيحة.')}</h2><p>{t('Tell us about your objective and background. This free initial assessment is an enquiry—not an eligibility decision or confirmed appointment.','أخبرنا عن هدفك وخلفيتك. هذا التقييم الأولي المجاني هو استفسار وليس قرار أهلية أو موعداً مؤكداً.')}</p></div><Assessment locale={l} initialProgramme={p.slug}/></div></section>

  <section className="wrap programme-story"><div className="programme-story-media"><img src={context} alt={t(...(contextAlts[p.slug]||['Professionals at work','مهنيون أثناء العمل']))} loading="lazy" width="920" height="620"/></div><div className="programme-story-copy"><span className="section-number">02</span><div className="eyebrow">{t('PROGRAMME OVERVIEW','نظرة عامة')}</div><h2>{t('Know what the route is—and what it is not.','اعرف طبيعة المسار وحدوده.')}</h2>{(detail?.overview||[[p.intro,p.introAr] as [string,string]]).map((paragraph,i)=><p key={i}>{t(...paragraph)}</p>)}<h3>{t('Who it may suit','لمن قد يناسب')}</h3><p>{t(...programmeAudiences[p.slug])}</p><div className="status-line"><ShieldCheck size={20}/><span>{t(...(routeFacts[p.slug]||['Programme-specific status','وضع حسب البرنامج']))}</span></div></div></section>

  {detail?.pathways.length>0&&<section className="wrap programme-pathways"><div className="section-heading"><div><div className="eyebrow">{t('ROUTES AND STATUS','المسارات والوضع')}</div><h2>{t('Understand the distinction before choosing.','افهم الفروق قبل الاختيار.')}</h2></div><p>{t('These routes have different legal outcomes and conditions. The right starting point depends on your facts.','لهذه المسارات نتائج وشروط قانونية مختلفة. وتعتمد نقطة البداية الصحيحة على ظروفك.')}</p></div><div className="pathway-list">{detail.pathways.map(pathway=><article key={pathway.name[0]}><div><h3>{t(...pathway.name)}</h3><span>{t(...pathway.status)}</span></div><p>{t(...pathway.description)}</p></article>)}</div></section>}

  <section className="programme-eligibility"><div className="wrap programme-content-split"><div><span className="section-number">03</span><div className="eyebrow">{t('ELIGIBILITY','الأهلية')}</div><h2>{t('The points we review first.','النقاط التي نراجعها أولاً.')}</h2></div><ul className="editorial-list">{p.requirements.map((item,i)=><li key={item}><span>{String(i+1).padStart(2,'0')}</span><p>{t(item,p.requirementsAr[i])}</p></li>)}</ul></div></section>

  {p.slug==='canada-express-entry'&&<section className="wrap programme-points"><div><div className="eyebrow">{t('FEDERAL SKILLED WORKER SELECTION','اختيار العمال المهرة الفيدرالي')}</div><h2>{t('The 67-point threshold is not CRS.','حد 67 نقطة ليس CRS.')}</h2><p>{t('This table is used only for Federal Skilled Worker Program eligibility. A score of 67 or more may qualify a candidate for that program, subject to its minimum requirements. Eligible Express Entry profiles are then ranked separately using CRS.','يُستخدم هذا الجدول فقط لأهلية برنامج العمال المهرة الفيدرالي. قد تؤهل درجة 67 أو أكثر المتقدم لذلك البرنامج مع استيفاء متطلباته الدنيا. ثم تُرتب ملفات إكسبريس إنتري المؤهلة بشكل منفصل عبر CRS.')}</p></div><div className="table-scroll"><table className="points-table"><caption>{t('Maximum FSW selection-factor points','الحد الأقصى لنقاط عوامل اختيار FSW')}</caption><thead><tr><th>{t('Factor','العامل')}</th><th>{t('Maximum','الحد الأقصى')}</th></tr></thead><tbody>{[['Age','العمر',12],['Education','التعليم',25],['Work experience','الخبرة العملية',15],['First official language','اللغة الرسمية الأولى',24],['Second official language','اللغة الرسمية الثانية',4],['Adaptability','القدرة على التكيف',10],['Arranged employment','التوظيف المرتب',10]].map(row=><tr key={String(row[0])}><td>{t(String(row[0]),String(row[1]))}</td><td>{row[2]}</td></tr>)}</tbody><tfoot><tr><th>{t('Total available','المجموع المتاح')}</th><td>100</td></tr></tfoot></table></div></section>}

  <section className="wrap programme-benefits"><div className="programme-story-copy"><span className="section-number">04</span><div className="eyebrow">{t('POTENTIAL BENEFITS','المزايا المحتملة')}</div><h2>{t('A route should serve the life you are planning.','يجب أن يخدم المسار الحياة التي تخطط لها.')}</h2><ul className="check-list">{p.benefits.map((item,i)=><li key={item}><Check size={19}/><span>{t(item,p.benefitsAr[i])}</span></li>)}</ul><p className="notice">{t(p.note,p.noteAr)}</p></div><div className="programme-benefit-image"><img src={benefit} alt={t('Planning a move abroad','التخطيط للانتقال إلى الخارج')} loading="lazy" width="920" height="620"/></div></section>

  <section className="wrap programme-documents"><div className="section-heading"><div><span className="section-number">05</span><div className="eyebrow">{t('DOCUMENT CHECKLIST','قائمة المستندات')}</div><h2>{t('Prepare in stages.','جهّز مستنداتك على مراحل.')}</h2></div><p>{t('This is an indicative checklist, not a universal filing list. The authority may request additional or updated evidence.','هذه قائمة إرشادية وليست قائمة تقديم شاملة. قد تطلب الجهة المختصة أدلة إضافية أو محدثة.')}</p></div><div className="document-list">{(detail?.documents.map(item=>t(...item))||documentsFor(p.group,t)).map((item,i)=><article key={item}><FileText size={22}/><span>{String(i+1).padStart(2,'0')}</span><p>{item}</p></article>)}</div></section>

  <section className="programme-process-section"><div className="wrap"><span className="section-number">06</span><div className="eyebrow">{t('THE PROCESS','الخطوات')}</div><h2>{t('A clear sequence, with responsibilities defined.','تسلسل واضح ومسؤوليات محددة.')}</h2><ol className="programme-timeline">{p.process.map((item,i)=><li key={item}><span className="timeline-number">{String(i+1).padStart(2,'0')}</span><div><small>{i===p.process.length-1?t('Authority decision','قرار الجهة المختصة'):i===0?t('You + Plan B','أنت + بلان بي'):t('Preparation','التحضير')}</small><p>{t(item,p.processAr[i])}</p></div></li>)}</ol></div></section>

  <section className="programme-help"><div className="wrap programme-help-grid"><div><span className="section-number">07</span><div className="eyebrow">{t('HOW PLAN B HELPS','كيف تساعدك بلان بي')}</div><h2>{t('Practical guidance, from profile to preparation.','إرشاد عملي من مراجعة الملف إلى التحضير.')}</h2></div><div><p>{t('We help organise your profile, identify information gaps, explain the official requirements and coordinate an agreed preparation checklist. Final eligibility and every decision remain with the relevant authority.','نساعدك على تنظيم ملفك وتحديد المعلومات الناقصة وشرح المتطلبات الرسمية وتنسيق قائمة التحضير المتفق عليها. تبقى الأهلية النهائية وكل قرار لدى الجهة المختصة.')}</p>{legal&&<p className="legal-distinction">{t('For U.S. legal strategy and petition preparation, advice must come from a qualified U.S. immigration attorney. Plan B can support coordination but does not replace legal counsel.','بالنسبة للاستراتيجية القانونية الأمريكية وإعداد العريضة، يجب أن تصدر المشورة من محامي هجرة أمريكي مؤهل. يمكن لبلان بي دعم التنسيق لكنها لا تحل محل المستشار القانوني.')}</p>}<a className="button light" href={'/'+l+'/consultation?programme='+p.slug}>{t('Discuss this programme','ناقش هذا البرنامج')}<ArrowUpRight size={17}/></a></div></div></section>

  <section className="wrap programme-faqs"><div className="section-heading"><div><span className="section-number">08</span><div className="eyebrow">{t('COMMON QUESTIONS','أسئلة شائعة')}</div><h2>{t('Before you take the next step.','قبل أن تتخذ الخطوة التالية.')}</h2></div></div>{(detail?.faqs.map(item=>[t(...item.question),t(...item.answer)] as [string,string])||faqs).map((faq,i)=><details key={i}><summary><span>{String(i+1).padStart(2,'0')}</span>{faq[0]}</summary><p>{faq[1]}</p></details>)}{p.sources.length>0&&<div className="official-sources"><strong>{t('Official sources · reviewed 1 October 2026','مصادر رسمية · تمت المراجعة في 1 أكتوبر 2026')}</strong>{p.sources.map(source=><a key={source[1]} href={source[1]} target="_blank" rel="noreferrer">{source[0]}<ArrowUpRight size={14}/></a>)}</div>}</section>

  <section className="wrap programme-final-cta"><div><div className="eyebrow">{t('YOUR NEXT MOVE','خطوتك التالية')}</div><h2>{t('Turn an ambition into a properly prepared plan.','حوّل طموحك إلى خطة مدروسة.')}</h2></div><a className="button light" href="#assessment">{t('Start free assessment','ابدأ التقييم المجاني')}<ArrowUpRight size={17}/></a></section>
  {related.length>0&&<section className="wrap related-programmes"><div className="section-heading"><h2>{t('Related programmes','برامج ذات صلة')}</h2></div><div className="programme-grid">{related.map(item=><a className="programme-card" key={item.slug} href={'/'+l+'/programmes/'+item.slug}><span className="programme-country">{t(item.country,countryAr[item.country])}</span><h3>{t(item.title,item.ar)}</h3><p>{t(item.intro,item.introAr)}</p><span className="card-link">{t('Explore programme','استكشف البرنامج')}<ArrowUpRight size={17}/></span></a>)}</div></section>}
 </>;
}

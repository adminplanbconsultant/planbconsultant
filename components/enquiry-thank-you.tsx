'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,CheckCircle2} from 'lucide-react';
import {text,type Locale} from '@/lib/content';
import {readCompletion,consumeLead,type Completion} from '@/lib/enquiry-completion';
import {trackLead} from '@/lib/meta-pixel';

/**
 * /{locale}/consultation/thank-you. Shows the confirmation only when this tab holds a fresh completion record written after the
 * enquiry API confirmed the save; a direct visit shows neutral guidance and never claims an enquiry was received.
 * Meta Lead: at most once, only for a record created with marketing consent, only if consent is still accepted now.
 * The pending Lead is removed from the record before the event is queued, so refreshes, re-renders, Back and the other
 * language version cannot count it again; without consent it is simply discarded.
 */
export default function EnquiryThankYou({locale:l}:{locale:Locale}){
 const t=(en:string,ar:string)=>text(l,en,ar);
 const [record,setRecord]=useState<Completion|null|undefined>(undefined);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{
  const r=readCompletion();setRecord(r);
  if(r?.leadId){const id=r.leadId;consumeLead();trackLead(id)}
 },[]);
 useEffect(()=>{if(record)heading.current?.focus()},[record]);
 if(record)return <section className="wrap thank-you-page">
  <div className="form-success thank-you-card" role="status">
   <CheckCircle2 size={48} aria-hidden="true"/>
   <h1 ref={heading} tabIndex={-1}>{t('Thank you.','شكراً لك.')}</h1>
   {/* Each form keeps the confirmation wording it showed in place before this page existed. */}
   {record.form==='full-assessment'?<p>{t('Thank you. Your enquiry has been received. Our team will contact you using the details provided.','شكراً لك. تم استلام استفسارك، وسيتواصل معك فريقنا عبر البيانات التي قدّمتها.')}</p>:<p>{t('We’ve received your enquiry. Our team will contact you.','لقد استلمنا استفسارك وسيتواصل معك فريقنا.')}</p>}
   {record.reference&&<strong className="enquiry-reference" dir="ltr">{record.reference}</strong>}
   {record.form==='full-assessment'?<p>{t('Keep your reference for follow-up. This is an enquiry, not an eligibility decision or a confirmed appointment; any appointment and next steps will be agreed separately.','احتفظ بالمرجع للمتابعة. هذا استفسار وليس قرار أهلية أو موعداً مؤكداً، ويُتفق بشكل منفصل على أي موعد والخطوات التالية.')}</p>:<p>{t('Keep this reference for follow-up. Submission does not confirm an appointment or an outcome.','احتفظ بهذا الرقم للمتابعة. لا يعني الإرسال تأكيد موعد أو نتيجة.')}</p>}
   <div className="thank-you-actions"><a className="button" href={'/'+l}>{t('Back to home','العودة للرئيسية')}</a><a className="text-link" href={'/'+l+'/programmes'}>{t('Explore programmes','استكشف البرامج')}<ArrowUpRight size={16} aria-hidden="true"/></a></div>
  </div>
 </section>;
 return <section className="wrap thank-you-page">
  <div className="thank-you-card thank-you-neutral">
   <h1>{t('Enquiry confirmation','تأكيد الاستفسار')}</h1>
   <p>{record===undefined?' ':t('This page confirms an enquiry once it has been sent from this browser. If you have just sent one, our team will contact you using the details you provided. If you have not sent an enquiry yet, you can start a free consultation.','تؤكد هذه الصفحة الاستفسار بعد إرساله من هذا المتصفح. إذا كنت قد أرسلت استفساراً للتو، فسيتواصل معك فريقنا عبر البيانات التي قدّمتها. وإذا لم ترسل استفساراً بعد، يمكنك بدء استشارة مجانية.')}</p>
   {record===null&&<a className="button" href={'/'+l+'/consultation'}>{t('Free Consultation','استشارة مجانية')}<ArrowUpRight size={17} aria-hidden="true"/></a>}
  </div>
 </section>;
}

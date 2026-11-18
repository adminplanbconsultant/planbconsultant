'use client';
import {emitConversion} from '@/lib/conversion-events';
import {completeEnquiry} from '@/lib/enquiry-completion';
import {submitEnquiry,submitDetails,enquiryError,turnstileSiteKey,noScriptAction} from '@/lib/enquiry-client';
import Turnstile from './turnstile';
import {useState,useEffect,useId,useRef,type FormEvent} from 'react';
import {ArrowRight,CheckCircle2} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {enquiryProgrammes as programmes,investmentGroups} from '@/lib/enquiry-programmes';
import {countries,services,text,business,type Locale} from '@/lib/content';
const ages=['21–32','33–39','40–45','46–55','56+'];
const budgets=['Not sure yet','Below USD 70,000','USD 70,000–149,999','USD 150,000–249,999','USD 250,000–349,999','USD 350,000–449,999','USD 450,000–549,999','USD 550,000–649,999','USD 650,000–749,999','USD 750,000–849,999','USD 850,000–1,049,999','USD 1,050,000 and above'];
const educationOptions=[['PhD','دكتوراه'],["Master’s degree",'ماجستير'],["Bachelor’s degree",'بكالوريوس'],['Diploma','دبلوم'],['High school','ثانوي'],['Other','غير ذلك']];
/**
 * Free initial assessment, contact first:
 *  1. Contact (required) — "Send enquiry & continue" creates and saves the enquiry (Google Sheet row + notification) before advancing.
 *  2. Your plans · optional, 3. Profile · optional — each "Save" adds only the fields the visitor filled to THE SAME row, using the
 *     short-lived update token the server returned in step 1. Skipping or leaving never loses the saved enquiry.
 * Nothing is sent while typing. Select fields start empty, so placeholders are never stored as answers.
 */
type Step=0|1|2|'done';
const PLAN_FIELDS=['programme','destination','budget','offer'] as const;
const PROFILE_FIELDS=['age','education','profession','nationality','residence','method','message'] as const;
export default function Assessment({locale:l,initialProgramme}:{locale:Locale;initialProgramme?:string}){
 const t=(a:string,b:string)=>text(l,a,b);
 const [step,setStep]=useState<Step>(0);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const [reference,setReference]=useState('');const [updateToken,setUpdateToken]=useState('');
 const [token,setToken]=useState('');const [tsKey,setTsKey]=useState(0);const inFlight=useRef(false);const heading=useRef<HTMLHeadingElement>(null);
 const initialProgram=programmes.find(program=>program.slug===initialProgramme);
 const [v,setV]=useState({id:'',name:'',phone:'+965 ',email:'',consent:false,website:'',service:'',programme:initialProgram?.slug||'',destination:initialProgram&&countries.some(c=>c[0]===initialProgram.country)?initialProgram.country:'',budget:'',offer:'',age:'',education:'',profession:'',nationality:'',residence:'',method:'',message:''});
 const set=(k:keyof typeof v,value:string|boolean)=>setV(prev=>({...prev,[k]:value}));
 useEffect(()=>{const q=new URLSearchParams(location.search);const p=programmes.find(x=>x.slug===(q.get('programme')||initialProgramme));const s=services.find(x=>x.slug===q.get('service'));const d=countries.find(x=>x[0]===q.get('destination'));setV(prev=>({...prev,id:crypto.randomUUID(),programme:p?.slug||'',service:s?.slug||'',destination:p&&countries.some(c=>c[0]===p.country)?p.country:d?.[0]||''}))},[initialProgramme]);
 useEffect(()=>{if(step!==0)heading.current?.focus()},[step]);
 const selected=programmes.find(p=>p.slug===v.programme);const investing=Boolean(selected&&investmentGroups.includes(selected.group));const working=selected?.group==='work';
 function picker(k:keyof typeof v,label:string,options:{value:string,label:string}[]){const value=String(v[k]);return <div className="form-label"><label htmlFor={'assessment-'+k}>{label}</label><Select value={value} onValueChange={next=>{set(k,String(next));if(k==='programme'){const p=programmes.find(p=>p.slug===next);if(p&&countries.some(c=>c[0]===p.country))set('destination',p.country)}}}><SelectTrigger className="picker" id={'assessment-'+k} aria-label={label}><SelectValue placeholder={t('Select an option','اختر خياراً')}>{options.find(option=>option.value===value)?.label}</SelectValue></SelectTrigger><SelectContent position="popper">{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>}
 function field(k:'profession'|'nationality'|'residence',label:string,placeholder=''){return <label>{label}<input name={k} value={v[k]} onChange={e=>set(k,e.target.value)} maxLength={100} autoComplete={k==='residence'?'country-name':'off'} placeholder={placeholder}/></label>}
 const detailsError=(kind:Parameters<typeof enquiryError>[0])=>kind==='expired'||kind==='invalid'?enquiryError(kind,t):t('Your enquiry is saved. These extra details could not be added just now — please try again, or finish and share them during your consultation.','تم حفظ استفسارك. تعذّرت إضافة هذه التفاصيل الآن — يرجى المحاولة مجدداً، أو الإنهاء ومشاركتها أثناء الاستشارة.');

 /** Step 1: validate, then save the enquiry. Advances only after the server confirms the Google Sheet save. */
 async function sendContact(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy||inFlight.current)return;setError('');
  const phone=v.phone.replace(/[\s().-]/g,'').replace(/^00/,'+');
  if(v.name.trim().length<2){setError(t('Please enter your full name.','يرجى إدخال اسمك الكامل.'));return}
  if(!/^\+[0-9]{8,15}$/.test(phone)){setError(t('Please enter your contact number with the country code, for example +965 5000 0000.','يرجى إدخال رقم التواصل مع رمز الدولة، مثل ‎+965 5000 0000‎.'));return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())){setError(t('Please enter a valid email address.','يرجى إدخال بريد إلكتروني صحيح.'));return}
  if(!v.consent){setError(t('Please confirm you agree to your details being stored and used to respond to this enquiry.','يرجى تأكيد موافقتك على حفظ بياناتك واستخدامها للرد على هذا الاستفسار.'));return}
  if(turnstileSiteKey&&!token){setError(t('Please complete the security check.','يرجى إكمال التحقق الأمني.'));return}
  inFlight.current=true;setBusy(true);
  const result=await submitEnquiry({source:'full-assessment',stage:'contact',id:v.id,name:v.name.trim(),phone:v.phone,email:v.email.trim(),service:v.service,locale:l,consent:v.consent,website:v.website,turnstileToken:token});
  inFlight.current=false;setBusy(false);setTsKey(k=>k+1);
  if(!result.ok){setError(enquiryError(result.kind,t));return}
  setReference(result.reference);setUpdateToken(result.updateToken||'');
  emitConversion('assessment_step_completed',{locale:l,step:1});emitConversion('assessment_submission_success',{locale:l});
  // Contact details are saved at this point. Without an update token the flow is complete now; otherwise the optional steps follow.
  if(result.updateToken)setStep(1);else if(!completeEnquiry({id:v.id,reference:result.reference,form:'full-assessment',locale:l}))setStep('done');
 }
 /** Steps 2-3: save only what the visitor filled in, into the same enquiry. Nothing filled in = nothing sent. */
 async function saveDetails(fields:readonly string[],next:Step){
  if(busy||inFlight.current)return;setError('');
  const values:Record<string,string>={};
  for(const k of fields){const value=String(v[k as keyof typeof v]).trim();if(!value)continue;if(k==='budget'&&!investing)continue;if(k==='offer'&&!working)continue;values[k]=value}
  if(!Object.keys(values).length){emitConversion('assessment_step_completed',{locale:l,step:step===1?2:3});if(next==='done')complete();else setStep(next);return}
  inFlight.current=true;setBusy(true);
  const result=await submitDetails({id:v.id,updateToken,locale:l,...values});
  inFlight.current=false;setBusy(false);
  if(!result.ok){setError(detailsError(result.kind));return}
  emitConversion('assessment_step_completed',{locale:l,step:step===1?2:3});if(next==='done')complete();else setStep(next);
 }
 /** Final completion of the full assessment (Finish now, Skip & finish, or saving the last step): go to the thank-you page. */
 const complete=()=>{if(!completeEnquiry({id:v.id,reference,form:'full-assessment',locale:l}))setStep('done')};
 const finish=()=>{setError('');complete()};

 if(step==='done')return <div className="form-success" role="status"><CheckCircle2 size={48}/><h2 ref={heading} tabIndex={-1}>{t('Thank you.','شكراً لك.')}</h2><p>{t('Thank you. Your enquiry has been received. Our team will contact you using the details provided.','شكراً لك. تم استلام استفسارك، وسيتواصل معك فريقنا عبر البيانات التي قدّمتها.')}</p><strong className="enquiry-reference">{reference}</strong><p>{t('Keep your reference for follow-up. This is an enquiry, not an eligibility decision or a confirmed appointment; any appointment and next steps will be agreed separately.','احتفظ بالمرجع للمتابعة. هذا استفسار وليس قرار أهلية أو موعداً مؤكداً، ويُتفق بشكل منفصل على أي موعد والخطوات التالية.')}</p><a className="button" href={'/'+l}>{t('Back to home','العودة للرئيسية')}</a></div>;

 const steps:[string,string][]=[['Contact','التواصل'],['Your plans · optional','خططك · اختياري'],['Profile · optional','ملفك · اختياري']];
 const current=step as number;
 const onSubmit=(e:FormEvent<HTMLFormElement>)=>{if(step===0)return sendContact(e);e.preventDefault();return step===1?saveDetails(PLAN_FIELDS,2):saveDetails(PROFILE_FIELDS,'done')};
 return <form className="enquiry-form assessment-form" method="post" action={noScriptAction(l)} data-selected-programme={v.programme} data-step={current+1} onSubmit={onSubmit} noValidate><FormNoScript locale={l}/>
  <div className="eyebrow">{t('FREE INITIAL ASSESSMENT','تقييم أولي مجاني')}</div>
  <h3 ref={heading} tabIndex={-1}>{step===0?t('Start with your next step.','ابدأ بخطوتك القادمة.'):step===1?t('Your plans','خططك'):t('Your profile','ملفك')}</h3>
  <ol className="assessment-progress" aria-label={t('Assessment steps','خطوات التقييم')}>{steps.map((s,i)=><li key={s[0]} aria-current={current===i?'step':undefined} className={current>=i?'current':''}><span>{i+1}</span>{t(s[0],s[1])}</li>)}</ol>
  <p className="step-description" aria-live="polite">{t('Step','الخطوة')} {current+1} / 3</p>
  {step===0&&<p className="assessment-lead">{t('Send your contact details so our team can get in touch. You can add your plans and profile afterwards—both are optional.','أرسل بيانات التواصل ليتمكن فريقنا من التواصل معك. يمكنك إضافة خططك وملفك بعد ذلك، وكلاهما اختياري.')}</p>}
  {step!==0&&<p className="assessment-received" role="status"><CheckCircle2 size={18} aria-hidden="true"/><span>{t('Your enquiry has been received. Add a few details to help us prepare, or finish now.','تم استلام استفسارك. أضف بعض التفاصيل لمساعدتنا على الاستعداد، أو أنهِ الآن.')}{reference&&<span className="assessment-ref-line">{t('Reference','المرجع')}: <bdi dir="ltr" className="assessment-ref">{reference}</bdi></span>}</span></p>}
  <div className="form-grid">
   {step===0&&<>
    <label>{t('Full name','الاسم الكامل')}<input name="name" value={v.name} onChange={e=>set('name',e.target.value)} required minLength={2} maxLength={100} autoComplete="name"/></label>
    <label>{t('Contact number (with country code)','رقم التواصل (مع رمز الدولة)')}<input name="phone" type="tel" inputMode="tel" value={v.phone} onChange={e=>set('phone',e.target.value)} required maxLength={25} autoComplete="tel" dir="ltr" placeholder="+965 5000 0000"/></label>
    <label className="full">{t('Email address','البريد الإلكتروني')}<input name="email" type="email" inputMode="email" value={v.email} onChange={e=>set('email',e.target.value)} required maxLength={200} autoComplete="email" dir="ltr"/></label>
    <label className="consent full"><input required type="checkbox" checked={v.consent} onChange={e=>set('consent',e.target.checked)}/><span>{t('I agree to my details being stored and used to respond to this request.','أوافق على حفظ بياناتي واستخدامها للرد على هذا الطلب.')} <a href={'/'+l+'/privacy'}>{t('Privacy notice','إشعار الخصوصية')}</a></span></label>
   </>}
   {step===1&&<>
    {picker('programme',t('Programme of interest · optional','البرنامج المطلوب · اختياري'),[{value:'not-sure',label:t('Help me choose','ساعدني على الاختيار')},...programmes.map(p=>({value:p.slug,label:t(p.title,p.ar)}))])}
    {picker('destination',t('Preferred destination · optional','الوجهة المفضلة · اختياري'),[{value:'Not sure yet',label:t('Still exploring','لا أزال أستكشف')},...countries.map(c=>({value:c[0],label:t(c[0],c[1])}))])}
    {investing&&<>{picker('budget',t('Indicative investment budget · USD · optional','ميزانية الاستثمار التقريبية · دولار أمريكي · اختياري'),budgets.map((b,i)=>({value:b,label:i===0?t(b,'لم أحدد بعد'):b})))}<p className="full small-note">{t('This is a planning range, not a quoted programme price or an eligibility threshold.','هذا نطاق للتخطيط وليس سعراً للبرنامج أو حداً للأهلية.')}</p></>}
    {working&&picker('offer',t('Do you have a job offer? · optional','هل لديك عرض عمل؟ · اختياري'),[{value:'yes',label:t('Yes','نعم')},{value:'no',label:t('No','لا')},{value:'not-sure',label:t('I need guidance','أحتاج إرشاداً')}])}
   </>}
   {step===2&&<>
    <p className="full small-note">{t('Every field is optional. Share what helps, or skip and discuss it during your consultation.','جميع الحقول اختيارية. شارك ما يفيد، أو تجاوزها وناقشها أثناء الاستشارة.')}</p>
    {picker('age',t('Age range','الفئة العمرية'),ages.map(a=>({value:a,label:a})))}
    {picker('education',t('Highest education','أعلى مؤهل تعليمي'),educationOptions.map(e=>({value:e[0],label:t(e[0],e[1])})))}
    {field('profession',t('Current job designation','المسمى الوظيفي الحالي'))}
    {field('nationality',t('Nationality','الجنسية'))}
    {field('residence',t('Current country of residence','دولة الإقامة الحالية'),t('e.g. Kuwait','مثال: الكويت'))}
    {picker('method',t('Preferred contact method','وسيلة التواصل المفضلة'),[{value:'whatsapp',label:'WhatsApp'},{value:'phone',label:t('Phone','الهاتف')},{value:'email',label:t('Email','البريد الإلكتروني')}])}
    <label className="full">{t('Additional information','معلومات إضافية')}<textarea value={v.message} onChange={e=>set('message',e.target.value)} rows={4} maxLength={2000}/></label>
   </>}
  </div>
  {step===0&&<Turnstile locale={l} onToken={setToken} resetKey={tsKey}/>}
  <label className="honey" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={e=>set('website',e.target.value)}/></label>
  {error&&<p role="alert" className="form-error">{error}</p>}
  <div className="assessment-buttons">
   {step===0&&<button className="button" type="submit" disabled={busy||!v.id||(!!turnstileSiteKey&&!token)} aria-busy={busy}>{busy?t('Sending…','جارٍ الإرسال…'):t('Send enquiry & continue','أرسل الاستفسار وتابع')}<ArrowRight size={16}/></button>}
   {step===1&&<><button className="button" type="submit" disabled={busy} aria-busy={busy}>{busy?t('Saving…','جارٍ الحفظ…'):t('Save & continue','احفظ وتابع')}<ArrowRight size={16}/></button><button className="button outline" type="button" disabled={busy} onClick={()=>{setError('');setStep(2)}}>{t('Skip this step','تخطَّ هذه الخطوة')}</button><button className="skip-profile" type="button" disabled={busy} onClick={finish}>{t('Finish now','إنهاء الآن')}</button></>}
   {step===2&&<><button className="button" type="submit" disabled={busy} aria-busy={busy}>{busy?t('Saving…','جارٍ الحفظ…'):t('Save details & finish','احفظ التفاصيل وأنهِ')}<ArrowRight size={16}/></button><button className="button outline" type="button" disabled={busy} onClick={finish}>{t('Skip & finish','تخطَّ وأنهِ')}</button></>}
  </div>
  <p className="small-note">{t('No obligation. Do not include passport numbers, bank details or medical records.','دون التزام. لا تدرج أرقام جوازات أو بيانات مصرفية أو سجلات طبية.')}</p>
 </form>;
}

export function GeneralEnquiry({locale:l}:{locale:Locale}){
 const t=(a:string,b:string)=>text(l,a,b);const uid=useId();const [status,setStatus]=useState<'idle'|'sending'|'success'|'error'>('idle');const [error,setError]=useState('');const [reference,setReference]=useState('');const [token,setToken]=useState('');const [tsKey,setTsKey]=useState(0);const inFlight=useRef(false);
 const [v,setV]=useState({id:'',name:'',email:'',phone:'+965 ',service:'not-sure',message:'',consent:false,website:''});
 useEffect(()=>setV(prev=>({...prev,id:crypto.randomUUID()})),[]);
 const set=(key:keyof typeof v,value:string|boolean)=>setV(prev=>({...prev,[key]:value}));
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();if(status==='sending'||inFlight.current)return;if(turnstileSiteKey&&!token){setError(t('Please complete the security check.','يرجى إكمال التحقق الأمني.'));return}inFlight.current=true;setStatus('sending');setError('');const result=await submitEnquiry({...v,source:'contact-form',locale:l,turnstileToken:token});inFlight.current=false;setTsKey(k=>k+1);if(!result.ok){setStatus('error');setError(enquiryError(result.kind,t));return}setReference(result.reference);emitConversion('contact_submission_success',{locale:l});if(!completeEnquiry({id:v.id,reference:result.reference,form:'contact-form',locale:l}))setStatus('success')}
 if(status==='success')return <div className="form-success general-enquiry-success" role="status"><CheckCircle2 size={44}/><h2>{t('Thank you.','شكراً لك.')}</h2><p>{t('We’ve received your enquiry. Our team will contact you.','لقد استلمنا استفسارك وسيتواصل معك فريقنا.')}</p><p>{t('Keep this reference for follow-up. Submission does not confirm an appointment or an outcome.','احتفظ بهذا الرقم للمتابعة. لا يعني الإرسال تأكيد موعد أو نتيجة.')}</p><strong className="enquiry-reference">{reference}</strong></div>;
 const id=(name:string)=>`${uid}-${name}`;
 return <form className="enquiry-form general-enquiry-form" method="post" action={noScriptAction(l)} onSubmit={submit} aria-label={t('General enquiry','استفسار عام')}><FormNoScript locale={l}/>
  <div className="eyebrow">{t('GENERAL ENQUIRY','استفسار عام')}</div><h3>{t('Tell us how we can help.','أخبرنا كيف يمكننا مساعدتك.')}</h3>
  <div className="form-grid">
   <label htmlFor={id('name')}>{t('Name','الاسم')}<input id={id('name')} value={v.name} onChange={e=>set('name',e.target.value)} autoComplete="name" minLength={2} maxLength={100} required/></label>
   <label htmlFor={id('email')}>{t('Email','البريد الإلكتروني')}<input id={id('email')} value={v.email} onChange={e=>set('email',e.target.value)} type="email" autoComplete="email" dir="ltr" maxLength={200} required/></label>
   <label htmlFor={id('phone')}>{t('Contact Number','رقم التواصل')}<input id={id('phone')} value={v.phone} onChange={e=>set('phone',e.target.value)} type="tel" autoComplete="tel" dir="ltr" maxLength={25} required/></label>
   <label htmlFor={id('service')}>{t('Service of Interest','الخدمة المطلوبة')}<select id={id('service')} value={v.service} onChange={e=>set('service',e.target.value)} required><option value="not-sure">{t('Help me choose','ساعدني على الاختيار')}</option>{services.map(service=><option key={service.slug} value={service.slug}>{t(service.title,service.ar)}</option>)}</select></label>
   <label className="full" htmlFor={id('message')}>{t('Message','الرسالة')}<textarea id={id('message')} value={v.message} onChange={e=>set('message',e.target.value)} rows={5} minLength={5} maxLength={2000} required/></label>
   <label className="consent full"><input required type="checkbox" checked={v.consent} onChange={e=>set('consent',e.target.checked)}/><span>{t('I agree to my details being stored and used to respond to this enquiry.','أوافق على حفظ بياناتي واستخدامها للرد على هذا الاستفسار.')} <a href={'/'+l+'/privacy'}>{t('Privacy notice','إشعار الخصوصية')}</a></span></label>
  </div>
  <Turnstile locale={l} onToken={setToken} resetKey={tsKey}/>
  <label className="honey" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={e=>set('website',e.target.value)}/></label>
  {error&&<p className="form-error" role="alert">{error}</p>}
  <button className="button" type="submit" disabled={status==='sending'||!v.id||(!!turnstileSiteKey&&!token)}>{status==='sending'?t('Sending…','جارٍ الإرسال…'):t('Send Enquiry','إرسال الاستفسار')}<ArrowRight size={16}/></button>
  <p className="small-note">{t('Do not include passport numbers, banking details or medical records.','لا ترسل أرقام جوازات السفر أو البيانات المصرفية أو السجلات الطبية.')}</p>
 </form>;
}

/** Shown only when JavaScript is off: the forms cannot submit without it, so offer the direct contact routes instead. */
export function FormNoScript({locale:l}:{locale:Locale}){
 const t=(a:string,b:string)=>text(l,a,b);
 return <noscript><p className="form-noscript full" role="note">{t('This form needs JavaScript to send your enquiry. Please enable JavaScript, or contact us directly: ','يحتاج هذا النموذج إلى JavaScript لإرسال استفسارك. يُرجى تفعيل JavaScript أو التواصل معنا مباشرة: ')}<a href={'tel:'+business.phone.replace(/s/g,'')} dir="ltr">{business.phone}</a>{business.whatsapp&&<> · <a href={'https://wa.me/'+business.whatsapp}>WhatsApp</a></>} · <a href={'mailto:'+business.email} dir="ltr">{business.email}</a></p></noscript>;
}

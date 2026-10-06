'use client';
import {emitConversion} from '@/lib/conversion-events';
import {useCallback,useEffect,useId,useRef,useState,type FormEvent,type KeyboardEvent as ReactKeyboardEvent} from 'react';
import {ArrowLeft,ArrowRight,BriefcaseBusiness,Building2,Check,CheckCircle2,ChevronDown,Globe2,GraduationCap,Plane,ShieldCheck,X} from 'lucide-react';
import {programmes} from '@/lib/programmes';
import {popupServices,popupSource} from '@/lib/enquiry-popup';
import {submitEnquiry,enquiryError,turnstileSiteKey} from '@/lib/enquiry-client';
import Turnstile from './turnstile';
import {text,type Locale} from '@/lib/content';

/* ---------- Session behaviour ---------- */
const DONE_KEY='plan-b-assessment-popup-v3';
const ACTIVE_MS_KEY='plan-b-assessment-active-ms-v3';
const ACTIVE_LIMIT_MS=35_000;
const SCROLL_LIMIT_PX=200;
const store={
 get(key:string){try{return sessionStorage.getItem(key)}catch{return null}},
 set(key:string,value:string){try{sessionStorage.setItem(key,value)}catch{/* Restricted storage: behaviour falls back to this page view. */}}
};
const isDone=()=>store.get(DONE_KEY)==='1';
const markDone=()=>store.set(DONE_KEY,'1');
const editable=(el:Element|null)=>!!el&&(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement||(el as HTMLElement).isContentEditable);
/** True while the visitor is interacting with something the popup must not interrupt. */
function pageIsBusy(lastFieldInput:number){
 const root=document.documentElement;
 if(root.classList.contains('nav-lock')||root.dataset.splash==='active')return true;
 if(document.querySelector('.brand-splash,.nav-panel,.site-masthead details[open],[role="dialog"],[aria-modal="true"],[role="menu"],[role="listbox"]'))return true;
 if(editable(document.activeElement))return true;
 return performance.now()-lastFieldInput<20_000;
}

/* ---------- Content ---------- */
type Choice={slug:typeof popupServices[number];en:string;ar:string;group:string;Icon:typeof Globe2};
const options:Choice[]=[
 {slug:'skilled-immigration',en:'Skilled Immigration',ar:'هجرة الكفاءات',group:'skilled',Icon:Globe2},
 {slug:'work-visas',en:'Work Opportunities',ar:'فرص العمل',group:'work',Icon:BriefcaseBusiness},
 {slug:'business-immigration',en:'Business & Investment',ar:'الأعمال والاستثمار',group:'business',Icon:Building2},
 {slug:'citizenship-by-investment',en:'Citizenship by Investment',ar:'الجنسية بالاستثمار',group:'citizenship',Icon:ShieldCheck},
 {slug:'study-abroad',en:'Study Visa',ar:'تأشيرة الدراسة',group:'study',Icon:GraduationCap},
 {slug:'visit-visas',en:'Visit Visa',ar:'تأشيرة الزيارة',group:'visit',Icon:Plane}
];
type Dial={code:string;dial:string;en:string;ar:string;example:string;min:number;max:number};
const dials:Dial[]=[
 {code:'KW',dial:'965',en:'Kuwait',ar:'الكويت',example:'5000 0000',min:8,max:8},
 {code:'SA',dial:'966',en:'Saudi Arabia',ar:'السعودية',example:'50 123 4567',min:8,max:10},
 {code:'AE',dial:'971',en:'United Arab Emirates',ar:'الإمارات',example:'50 123 4567',min:8,max:9},
 {code:'QA',dial:'974',en:'Qatar',ar:'قطر',example:'3312 3456',min:7,max:8},
 {code:'BH',dial:'973',en:'Bahrain',ar:'البحرين',example:'3600 1234',min:8,max:8},
 {code:'OM',dial:'968',en:'Oman',ar:'عُمان',example:'9212 3456',min:8,max:8},
 {code:'EG',dial:'20',en:'Egypt',ar:'مصر',example:'100 123 4567',min:9,max:10},
 {code:'JO',dial:'962',en:'Jordan',ar:'الأردن',example:'7 9012 3456',min:8,max:9},
 {code:'LB',dial:'961',en:'Lebanon',ar:'لبنان',example:'71 123 456',min:7,max:8},
 {code:'IN',dial:'91',en:'India',ar:'الهند',example:'98765 43210',min:10,max:10},
 {code:'PK',dial:'92',en:'Pakistan',ar:'باكستان',example:'301 2345678',min:10,max:10},
 {code:'BD',dial:'880',en:'Bangladesh',ar:'بنغلاديش',example:'1812 345678',min:10,max:10},
 {code:'LK',dial:'94',en:'Sri Lanka',ar:'سريلانكا',example:'71 234 5678',min:9,max:9},
 {code:'NP',dial:'977',en:'Nepal',ar:'نيبال',example:'98 1234 5678',min:10,max:10},
 {code:'PH',dial:'63',en:'Philippines',ar:'الفلبين',example:'917 123 4567',min:10,max:10},
 {code:'GB',dial:'44',en:'United Kingdom',ar:'المملكة المتحدة',example:'7400 123456',min:10,max:10},
 {code:'US',dial:'1',en:'United States / Canada',ar:'الولايات المتحدة / كندا',example:'202 555 0123',min:10,max:10},
 {code:'AU',dial:'61',en:'Australia',ar:'أستراليا',example:'412 345 678',min:9,max:9},
 {code:'DE',dial:'49',en:'Germany',ar:'ألمانيا',example:'1512 3456789',min:10,max:11}
];
type Status='idle'|'sending'|'success'|'error';

/* ---------- Controller: when and how the popup opens ---------- */
export default function AssessmentPopup({locale,path}:{locale:Locale;path:string[]}){
 const [open,setOpen]=useState(false);
 const [context,setContext]=useState<{programme?:string}>({});
 const restoreRef=useRef<HTMLElement|null>(null);
 const openRef=useRef(false);
 const page=path[0]||'home';
 const routeProgramme=page==='programmes'&&path[1]&&programmes.some(p=>p.slug===path[1])?path[1]:undefined;
 const routeProgrammeRef=useRef(routeProgramme);routeProgrammeRef.current=routeProgramme;
 const suppressed=page==='contact'||page==='consultation';

 const show=useCallback((programme?:string)=>{
  if(openRef.current)return;
  openRef.current=true;markDone();
  const active=document.activeElement as HTMLElement|null;
  restoreRef.current=active&&active!==document.body?active:null;
  setContext({programme:programme||routeProgrammeRef.current});
  setOpen(true);emitConversion('assessment_opened',{locale});
 },[]);
 const close=useCallback(()=>{
  openRef.current=false;setOpen(false);
  const el=restoreRef.current;restoreRef.current=null;
  if(el&&document.contains(el))requestAnimationFrame(()=>el.focus({preventScroll:true}));
 },[]);

 // The dedicated assessment page counts as a manual assessment visit for this session.
 useEffect(()=>{if(page==='consultation')markDone()},[page]);

 // Manual openers: window event or any element carrying data-open-assessment.
 useEffect(()=>{
  const onEvent=(event:Event)=>show((event as CustomEvent<{programme?:string}>).detail?.programme);
  const onClick=(event:MouseEvent)=>{const trigger=(event.target as Element|null)?.closest?.('[data-open-assessment]');if(!trigger)return;event.preventDefault();show(trigger.getAttribute('data-open-assessment')||undefined)};
  window.addEventListener('planb:open-assessment',onEvent);document.addEventListener('click',onClick);
  return()=>{window.removeEventListener('planb:open-assessment',onEvent);document.removeEventListener('click',onClick)};
 },[show]);

 // Automatic trigger: 35 s of visible time (kept across page loads in this tab) or ~200 px of user-driven scrolling.
 useEffect(()=>{
  if(suppressed||isDone())return;
  const root=document.documentElement;let stop=()=>{};let cancelled=false;
  const start=()=>{
   if(cancelled||isDone())return;
   let total=Number(store.get(ACTIVE_MS_KEY))||0;
   let counting=document.visibilityState==='visible';let last=performance.now();
   let pending=false;let lastFieldInput=-Infinity;
   let intentUntil=0,anchorUntil=0,lastY=window.scrollY,userDelta=0;
   const attempt=()=>{
    if(isDone()){stop();return}// a manual opening (or another tab view) already used this session's offer
    if(!pending||document.visibilityState!=='visible'||pageIsBusy(lastFieldInput))return;
    stop();show();
   };
   const request=()=>{pending=true;attempt()};
   const fold=()=>{const now=performance.now();if(counting)total+=now-last;last=now;store.set(ACTIVE_MS_KEY,String(Math.round(total)))};
   const tick=()=>{fold();if(total>=ACTIVE_LIMIT_MS)pending=true;attempt()};
   const onVisibility=()=>{fold();counting=document.visibilityState==='visible'};
   const intent=()=>{intentUntil=performance.now()+1200};
   const onKey=(event:KeyboardEvent)=>{if(editable(event.target as Element)||!['ArrowDown','ArrowUp','PageDown','PageUp','End','Home',' '].includes(event.key))return;intent()};
   const onPointer=(event:PointerEvent)=>{if(event.target===root)intent()};// scrollbar drag
   const onAnchor=(event:MouseEvent)=>{if((event.target as Element|null)?.closest?.('a[href*="#"]'))anchorUntil=performance.now()+1500};
   const onHash=()=>{anchorUntil=performance.now()+1500};
   const onScroll=()=>{const y=window.scrollY,delta=y-lastY;lastY=y;const now=performance.now();if(now<anchorUntil||now>intentUntil)return;userDelta=Math.max(0,userDelta+delta);if(userDelta>=SCROLL_LIMIT_PX)request()};
   const onField=(event:Event)=>{if(editable(event.target as Element))lastFieldInput=performance.now()};
   const interval=window.setInterval(tick,1000);
   const passive={passive:true} as const;
   window.addEventListener('wheel',intent,passive);window.addEventListener('touchstart',intent,passive);window.addEventListener('touchmove',intent,passive);window.addEventListener('touchend',intent,passive);
   window.addEventListener('keydown',onKey);window.addEventListener('pointerdown',onPointer);document.addEventListener('click',onAnchor,true);window.addEventListener('hashchange',onHash);
   window.addEventListener('scroll',onScroll,passive);document.addEventListener('input',onField,true);document.addEventListener('visibilitychange',onVisibility);window.addEventListener('pagehide',fold);
   stop=()=>{window.clearInterval(interval);window.removeEventListener('wheel',intent);window.removeEventListener('touchstart',intent);window.removeEventListener('touchmove',intent);window.removeEventListener('touchend',intent);window.removeEventListener('keydown',onKey);window.removeEventListener('pointerdown',onPointer);document.removeEventListener('click',onAnchor,true);window.removeEventListener('hashchange',onHash);window.removeEventListener('scroll',onScroll);document.removeEventListener('input',onField,true);document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('pagehide',fold)};
  };
  if(root.dataset.splash==='done')start();else window.addEventListener('planb:splash-done',start,{once:true});
  return()=>{cancelled=true;window.removeEventListener('planb:splash-done',start);stop()};
 },[suppressed,show]);

 if(!open)return null;
 return <PopupDialog locale={locale} initialProgramme={context.programme} onClose={close}/>;
}

/* ---------- Dialog ---------- */
type Fields={name:string;phone:string;email:string;consent:boolean;website:string};
function PopupDialog({locale:l,initialProgramme,onClose}:{locale:Locale;initialProgramme?:string;onClose:()=>void}){
 const t=(en:string,ar:string)=>text(l,en,ar);
 const uid=useId();const dialogRef=useRef<HTMLDivElement>(null);const stepHeadingRef=useRef<HTMLHeadingElement>(null);const sendingRef=useRef(false);const idRef=useRef('');
 const initial=programmes.find(p=>p.slug===initialProgramme);
 const [service,setService]=useState<string>(()=>options.find(o=>o.group===initial?.group)?.slug||'');
 const [programme,setProgramme]=useState(initial?.slug||'');
 const [step,setStep]=useState<1|2>(1);
 const [country,setCountry]=useState('KW');
 const [v,setV]=useState<Fields>({name:'',phone:'',email:'',consent:false,website:''});
 const [errors,setErrors]=useState<Partial<Record<'service'|'name'|'phone'|'email'|'consent',string>>>({});
 const [status,setStatus]=useState<Status>('idle');
 const [token,setToken]=useState('');const [tsKey,setTsKey]=useState(0);
 const [failure,setFailure]=useState('');
 const [submittedName,setSubmittedName]=useState('');
 const dial=dials.find(d=>d.code===country)!;
 if(!idRef.current&&typeof crypto!=='undefined')idRef.current=crypto.randomUUID();

 // Scroll lock, Escape, focus trap, initial focus.
 useEffect(()=>{
  const root=document.documentElement;const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';root.classList.add('assessment-popup-open');
  dialogRef.current?.focus();
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();onClose();return}
   if(event.key!=='Tab'||!dialogRef.current)return;
   const items=[...dialogRef.current.querySelectorAll<HTMLElement>('button,input,select,a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hasAttribute('disabled')&&el.tabIndex>=0&&el.offsetParent!==null);
   if(!items.length)return;
   const first=items[0],last=items[items.length-1],active=document.activeElement;
   if(!dialogRef.current.contains(active)){event.preventDefault();first.focus()}
   else if(event.shiftKey&&(active===first||active===dialogRef.current)){event.preventDefault();last.focus()}
   else if(!event.shiftKey&&active===last){event.preventDefault();first.focus()}
  };
  // On phones the keyboard shrinks the visual viewport; keep the focused field in view inside the dialog's own scroller.
  const onFocusIn=(event:FocusEvent)=>{const el=event.target as HTMLElement;if(!editable(el))return;window.setTimeout(()=>el.scrollIntoView({block:'center',behavior:'auto'}),300)};
  document.addEventListener('keydown',onKey);dialogRef.current?.addEventListener('focusin',onFocusIn);
  const dialogEl=dialogRef.current;
  return()=>{document.removeEventListener('keydown',onKey);dialogEl?.removeEventListener('focusin',onFocusIn);document.body.style.overflow=previous;root.classList.remove('assessment-popup-open')};
 },[onClose]);
 useEffect(()=>{if(step===2||status==='success')stepHeadingRef.current?.focus()},[step,status]);

 const set=<K extends keyof Fields>(key:K,value:Fields[K])=>{setV(prev=>({...prev,[key]:value}));if(key in errors)setErrors(prev=>({...prev,[key]:undefined}))};
 const pick=(slug:string)=>{setService(slug);setErrors(prev=>({...prev,service:undefined}));if(initial&&options.find(o=>o.slug===slug)?.group!==initial.group)setProgramme('');else if(initial)setProgramme(initial.slug)};
 const onRadioKey=(event:ReactKeyboardEvent<HTMLDivElement>)=>{
  const keys=['ArrowRight','ArrowLeft','ArrowDown','ArrowUp'];if(!keys.includes(event.key))return;
  event.preventDefault();const all=[...options.map(o=>o.slug),'not-sure'];const index=all.indexOf(service);
  const forward=event.key==='ArrowDown'||event.key===(l==='ar'?'ArrowLeft':'ArrowRight');
  const next=all[(Math.max(index,0)+(forward?1:-1)+all.length)%all.length];pick(next);
  requestAnimationFrame(()=>dialogRef.current?.querySelector<HTMLElement>(`[data-choice="${next}"]`)?.focus());
 };
 const next=()=>{
  if(!service){setErrors({service:t('Please choose what you would like help with.','يرجى اختيار ما تود المساعدة فيه.')});requestAnimationFrame(()=>dialogRef.current?.querySelector<HTMLElement>('[data-choice]')?.focus());return}
  setErrors({});emitConversion('assessment_step_completed',{locale:l,step:1});setStep(2);
 };
 const digitsOf=()=>v.phone.trim().startsWith('+')?v.phone.replace(/\D/g,''):v.phone.replace(/\D/g,'').replace(/^0+/,'');
 const fullPhone=()=>v.phone.trim().startsWith('+')?'+'+digitsOf():'+'+dial.dial+digitsOf();
 function validate(){
  const e:typeof errors={};
  if(v.name.trim().length<2)e.name=t('Please enter your full name.','يرجى إدخال اسمك الكامل.');
  const d=digitsOf();const international=v.phone.trim().startsWith('+');
  if(!d)e.phone=t('Please enter your WhatsApp or phone number.','يرجى إدخال رقم الواتساب أو الهاتف.');
  else if(international?(d.length<7||d.length>15):(d.length<dial.min||d.length>dial.max))e.phone=t('Please enter a valid number for the selected country.','يرجى إدخال رقم صحيح للدولة المختارة.');
  if(v.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))e.email=t('Please enter a valid email address, or leave it blank.','يرجى إدخال بريد إلكتروني صحيح أو تركه فارغاً.');
  if(!v.consent)e.consent=t('Please agree so we can respond to your enquiry.','يرجى الموافقة لنتمكن من الرد على استفسارك.');
  setErrors(e);
  const first=(['name','phone','email','consent'] as const).find(k=>e[k]);
  if(first)requestAnimationFrame(()=>dialogRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus());
  return !first;
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(sendingRef.current||status==='success')return;
  if(!validate())return;
  sendingRef.current=true;setStatus('sending');setFailure('');
  try{
   if(turnstileSiteKey&&!token){setFailure(t('Please complete the security check.','يرجى إكمال التحقق الأمني.'));setStatus('error');return}
   const result=await submitEnquiry({source:popupSource,id:idRef.current,name:v.name.trim(),phone:fullPhone(),email:v.email.trim(),service:service||'not-sure',programme:programme||'not-sure',locale:l,consent:v.consent,website:v.website,turnstileToken:token});
   setTsKey(k=>k+1);
   if(!result.ok){setFailure(enquiryError(result.kind,t));setStatus('error');return}
   setSubmittedName(v.name.trim().split(/\s+/)[0]);emitConversion('assessment_step_completed',{locale:l,step:2});emitConversion('assessment_submission_success',{locale:l});setStatus('success');
  }finally{sendingRef.current=false}
 }
 const sending=status==='sending';
 const cardLabel=(o:Choice)=>t(o.en,o.ar);
 const fieldProps=(key:'name'|'phone'|'email')=>({id:`${uid}-${key}`,'data-field':key,'aria-invalid':errors[key]?true:undefined,'aria-describedby':errors[key]?`${uid}-${key}-error`:undefined});
 const fieldError=(key:'name'|'phone'|'email'|'consent')=>errors[key]?<p className="ap-error" id={`${uid}-${key}-error`} role="alert">{errors[key]}</p>:null;

 return <div className="ap-backdrop" role="presentation">
  <div ref={dialogRef} className="ap-dialog" role="dialog" aria-modal="true" aria-labelledby={`${uid}-title`} aria-describedby={`${uid}-intro`} tabIndex={-1} dir={l==='ar'?'rtl':'ltr'} lang={l}>
   <header className="ap-header">
    <button type="button" className="ap-close" onClick={onClose} aria-label={t('Close free assessment','إغلاق التقييم المجاني')}><X size={22} aria-hidden="true"/></button>
    <span className="ap-badge">{t('FREE ASSESSMENT','تقييم مجاني')}</span>
    <h2 id={`${uid}-title`}>{t('Where would you like your next chapter to begin?','من أين تود أن يبدأ فصلك القادم؟')}</h2>
    <p id={`${uid}-intro`}>{t('Tell us what you’re exploring and how to reach you. We’ll help you understand your next steps.','أخبرنا بما تستكشفه وكيف نتواصل معك. سنساعدك على فهم خطواتك التالية.')}</p>
    {status!=='success'&&<div className="ap-progress" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={step} aria-valuetext={t(`Step ${step} of 2`,`الخطوة ${step} من 2`)}><span className="ap-progress-label">{t(`Step ${step} of 2`,`الخطوة ${step} من 2`)}</span><span className="ap-progress-bars" aria-hidden="true"><i className="on"/><i className={step===2?'on':''}/></span></div>}
   </header>
   <div className="ap-body">
    {status==='success'?<div className="ap-step ap-success" role="status">
     <CheckCircle2 size={44} strokeWidth={1.4} aria-hidden="true"/>
     <h3 ref={stepHeadingRef} tabIndex={-1}>{t(`Thank you, ${submittedName}.`,`شكراً لك، ${submittedName}.`)}</h3>
     <p>{t('We’ve received your enquiry. Our team will contact you.','لقد استلمنا استفسارك وسيتواصل معك فريقنا.')}</p>
     <button type="button" className="ap-primary" onClick={onClose}>{t('Close','إغلاق')}</button>
    </div>
    :step===1?<div className="ap-step" key="step1">
     <h3 id={`${uid}-q1`}>{t('What would you like help with?','بماذا تود أن نساعدك؟')}</h3>
     <div className="ap-choices" role="radiogroup" aria-labelledby={`${uid}-q1`} aria-describedby={errors.service?`${uid}-service-error`:undefined} onKeyDown={onRadioKey}>
      {options.map(o=>{const selected=service===o.slug;return <button type="button" key={o.slug} role="radio" aria-checked={selected} data-choice={o.slug} tabIndex={selected||(!service&&o.slug===options[0].slug)?0:-1} className={'ap-choice'+(selected?' is-selected':'')} onClick={()=>pick(o.slug)}><span className="ap-choice-icon" aria-hidden="true"><o.Icon size={19} strokeWidth={1.6}/></span><span className="ap-choice-label">{cardLabel(o)}</span><span className="ap-check" aria-hidden="true">{selected&&<Check size={14} strokeWidth={3}/>}</span></button>})}
     </div>
     <button type="button" role="radio" aria-checked={service==='not-sure'} data-choice="not-sure" tabIndex={service==='not-sure'?0:-1} className={'ap-unsure'+(service==='not-sure'?' is-selected':'')} onClick={()=>pick('not-sure')}>{service==='not-sure'&&<Check size={15} strokeWidth={3} aria-hidden="true"/>}{t('Not sure yet? Help me explore.','لست متأكداً بعد؟ ساعدني على الاستكشاف.')}</button>
     {errors.service&&<p className="ap-error" id={`${uid}-service-error`} role="alert">{errors.service}</p>}
     <div className="ap-actions"><button type="button" className="ap-primary" onClick={next}>{t('Continue','متابعة')}<ArrowRight size={17} aria-hidden="true" className="ap-arrow"/></button></div>
    </div>
    :<form className="ap-step" key="step2" onSubmit={submit} noValidate>
     <h3 ref={stepHeadingRef} tabIndex={-1}>{t('How can we reach you?','كيف يمكننا التواصل معك؟')}</h3>
     <div className="ap-field"><label htmlFor={`${uid}-name`}>{t('Full Name','الاسم الكامل')} <span className="ap-req" aria-hidden="true">*</span></label><input {...fieldProps('name')} value={v.name} onChange={e=>set('name',e.target.value)} autoComplete="name" maxLength={100} required aria-required="true"/>{fieldError('name')}</div>
     <div className="ap-field"><label htmlFor={`${uid}-phone`}>{t('WhatsApp / Phone Number','واتساب / رقم الهاتف')} <span className="ap-req" aria-hidden="true">*</span></label>
      <div className="ap-phone" dir="ltr"><span className="ap-dial-wrap"><span className="ap-dial-code" aria-hidden="true">{dial.code} +{dial.dial}<ChevronDown size={14} aria-hidden="true"/></span><select aria-label={t('Country code','رمز الدولة')} value={country} onChange={e=>setCountry(e.target.value)} className="ap-dial">{dials.map(d=><option key={d.code} value={d.code}>{t(d.en,d.ar)} (+{d.dial})</option>)}</select></span><input {...fieldProps('phone')} value={v.phone} onChange={e=>set('phone',e.target.value)} type="tel" inputMode="tel" autoComplete="tel-national" placeholder={dial.example} maxLength={20} required aria-required="true"/></div>
      {fieldError('phone')}</div>
     <div className="ap-field"><label htmlFor={`${uid}-email`}>{t('Email Address','البريد الإلكتروني')} <span className="ap-opt">{t('(optional)','(اختياري)')}</span></label><input {...fieldProps('email')} value={v.email} onChange={e=>set('email',e.target.value)} type="email" dir="ltr" autoComplete="email" placeholder="name@example.com" maxLength={200}/>{fieldError('email')}</div>
     <label className="ap-honey" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={e=>set('website',e.target.value)}/></label>
     <div className="ap-consent"><label><input type="checkbox" data-field="consent" checked={v.consent} onChange={e=>set('consent',e.target.checked)} aria-invalid={errors.consent?true:undefined} aria-describedby={errors.consent?`${uid}-consent-error`:undefined}/><span>{t('I agree to my details being used to respond to my enquiry.','أوافق على استخدام بياناتي للرد على استفساري.')} <a href={'/'+l+'/privacy'} target="_blank" rel="noopener noreferrer">{t('Privacy Policy','سياسة الخصوصية')}</a></span></label>{fieldError('consent')}</div>
     {status==='error'&&failure&&<p className="ap-error ap-failure" role="alert">{failure}</p>}
     <Turnstile locale={l} onToken={setToken} resetKey={tsKey}/>
     <div className="ap-actions ap-actions-split"><button type="button" className="ap-back" onClick={()=>{setStep(1);setStatus('idle');setFailure('')}} disabled={sending}><ArrowLeft size={16} aria-hidden="true" className="ap-arrow"/>{t('Back','رجوع')}</button><button type="submit" className="ap-primary" disabled={sending||(!!turnstileSiteKey&&!token)} aria-busy={sending}>{sending?t('Sending…','جارٍ الإرسال…'):t('Request My Free Assessment','اطلب تقييمي المجاني')}{!sending&&<ArrowRight size={17} aria-hidden="true" className="ap-arrow"/>}</button></div>
     <p className="ap-note">{t('Your details will be used to respond to your enquiry.','ستُستخدم بياناتك للرد على استفسارك.')}</p>
    </form>}
   </div>
  </div>
 </div>;
}

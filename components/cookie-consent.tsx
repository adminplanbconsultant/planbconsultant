'use client';
import {useEffect,useRef,useState} from 'react';
import {text,type Locale} from '@/lib/content';
import {pixelAvailable,readConsent,saveConsent,OPEN_SETTINGS_EVENT,CONSENT_EVENT,type ConsentChoice} from '@/lib/meta-pixel';

/**
 * Marketing-cookie consent. Shown only where the Meta Pixel could actually run (production hosts), on the first visit and
 * whenever "Cookie settings" is used. Marketing cookies stay off until the visitor accepts; "Decline" is equally prominent,
 * and the choice can be changed or withdrawn at any time. Non-modal: it never blocks the page or the enquiry forms.
 */
export default function CookieConsent({locale:l}:{locale:Locale}){
 const t=(en:string,ar:string)=>text(l,en,ar);
 const [open,setOpen]=useState(false);const [current,setCurrent]=useState<boolean|null>(null);const panel=useRef<HTMLDivElement>(null);const fromSettings=useRef(false);
 useEffect(()=>{
  if(!pixelAvailable())return;
  const choice=readConsent();setCurrent(choice?choice.marketing:null);if(!choice)setOpen(true);
  const onOpen=()=>{fromSettings.current=true;setCurrent(readConsent()?.marketing??null);setOpen(true)};
  const onChange=(e:Event)=>setCurrent((e as CustomEvent<ConsentChoice>).detail?.marketing??null);
  window.addEventListener(OPEN_SETTINGS_EVENT,onOpen);window.addEventListener(CONSENT_EVENT,onChange);
  return()=>{window.removeEventListener(OPEN_SETTINGS_EVENT,onOpen);window.removeEventListener(CONSENT_EVENT,onChange)};
 },[]);
 useEffect(()=>{if(open&&fromSettings.current)panel.current?.focus()},[open]);
 if(!open)return null;
 const choose=(marketing:boolean)=>{saveConsent(marketing);fromSettings.current=false;setOpen(false)};
 return <div ref={panel} className="cookie-consent" role="region" aria-labelledby="cookie-consent-title" tabIndex={-1} lang={l} dir={l==='ar'?'rtl':'ltr'}>
  <h2 id="cookie-consent-title">{t('Marketing cookies','ملفات تعريف الارتباط التسويقية')}</h2>
  <p>{t('With your permission, we use the Meta Pixel to measure visits from our Meta ads. If you accept, Meta receives information about your visit, such as the pages you view, your IP address, browser and device details, and cookie identifiers, and may link it to your Meta account. We do not send Meta anything you type into our forms. The pixel stays off unless you accept.','بإذنك، نستخدم Meta Pixel لقياس الزيارات القادمة من إعلاناتنا على Meta. إذا وافقت، تتلقى Meta معلومات عن زيارتك، مثل الصفحات التي تشاهدها وعنوان IP الخاص بك وتفاصيل المتصفح والجهاز ومعرّفات ملفات تعريف الارتباط، وقد تربطها بحسابك على Meta. ولا نرسل إلى Meta أي شيء تكتبه في نماذجنا. ويبقى Pixel متوقفاً ما لم توافق.')} <a href={'/'+l+'/privacy#cookies'}>{t('Privacy notice','إشعار الخصوصية')}</a></p>
  {current!==null&&<p className="cookie-consent-status">{current?t('Current choice: accepted. You can withdraw at any time.','اختيارك الحالي: موافقة. يمكنك سحبها في أي وقت.'):t('Current choice: declined.','اختيارك الحالي: رفض.')}</p>}
  <div className="cookie-consent-actions">
   <button type="button" className="button small outline" onClick={()=>choose(false)}>{t('Decline','رفض')}</button>
   <button type="button" className="button small outline" onClick={()=>choose(true)}>{t('Accept','موافقة')}</button>
  </div>
 </div>;
}

/** "Cookie settings" control for the footer and privacy notice. Renders only where the pixel could run. */
export function CookieSettingsButton({locale:l,className}:{locale:Locale;className?:string}){
 const [show,setShow]=useState(false);
 useEffect(()=>setShow(pixelAvailable()),[]);
 if(!show)return null;
 return <button type="button" className={'cookie-settings-link '+(className||'')} onClick={()=>window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))}>{text(l,'Cookie settings','إعدادات ملفات تعريف الارتباط')}</button>;
}

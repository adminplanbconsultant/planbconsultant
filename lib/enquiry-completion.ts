import {hasMarketingConsent,pixelAvailable} from './meta-pixel';

/**
 * Hand-off from a successfully saved enquiry to the confirmation page /{locale}/consultation/thank-you.
 *
 * The record lives in sessionStorage (this tab only, cleared when the tab closes) and expires after 30 minutes. It holds the
 * enquiry reference to display, which form finished, and — ONLY if marketing consent was accepted when the save was confirmed
 * and the pixel may run here — the enquiry's submission id as `leadId` for a single Meta Lead. Nothing goes in the URL.
 * A direct visit, a refresh after the Lead was counted, or another language version finds no unconsumed leadId, so no Lead.
 */
export const COMPLETION_KEY='planb-enquiry-completion-v1';
export const COMPLETION_TTL_MS=30*60*1000;
export const thankYouPath=(locale:string)=>`/${locale==='ar'?'ar':'en'}/consultation/thank-you`;
export type EnquiryForm='full-assessment'|'popup'|'contact-form';
export type Completion={reference:string;form:EnquiryForm;at:number;leadId:string|null};

/**
 * Call only after the enquiry API has confirmed the save AND the form has reached its final step.
 * Returns false if the hand-off could not be stored (e.g. storage blocked): the caller then shows its in-place confirmation,
 * so the visitor still sees their reference. Tracking problems can never block or fail the enquiry.
 */
export function completeEnquiry({id,reference,form,locale}:{id:string;reference:string;form:EnquiryForm;locale:string}){
 let leadId:string|null=null;
 try{leadId=pixelAvailable()&&hasMarketingConsent()?id:null}catch{leadId=null}
 const record:Completion={reference,form,at:Date.now(),leadId};
 try{sessionStorage.setItem(COMPLETION_KEY,JSON.stringify(record));if(!sessionStorage.getItem(COMPLETION_KEY))return false}catch{return false}
 window.location.assign(thankYouPath(locale));
 return true;
}

/** The current tab's completion, if it exists and is fresh. Expired or malformed records are removed. */
export function readCompletion():Completion|null{
 try{
  const raw=sessionStorage.getItem(COMPLETION_KEY);if(!raw)return null;
  const r=JSON.parse(raw) as Partial<Completion>;
  const fresh=typeof r.at==='number'&&Date.now()-r.at>=0&&Date.now()-r.at<COMPLETION_TTL_MS;
  if(!fresh||typeof r.reference!=='string'){sessionStorage.removeItem(COMPLETION_KEY);return null}
  return {reference:r.reference,form:(r.form as EnquiryForm)||'full-assessment',at:r.at!,leadId:typeof r.leadId==='string'?r.leadId:null};
 }catch{return null}
}

/** Removes the pending Lead from the record (after it is counted, or when consent is missing) but keeps the reference to display. */
export function consumeLead(){
 try{const r=readCompletion();if(r&&r.leadId)sessionStorage.setItem(COMPLETION_KEY,JSON.stringify({...r,leadId:null}))}catch{/* nothing to keep */}
}

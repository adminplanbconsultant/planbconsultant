/** Browser-side submit helper shared by the popup, the full assessment and the contact form. */
export type SubmitResult={ok:true;reference:string}|{ok:false;kind:'invalid'|'throttled'|'verification'|'unavailable'|'network'};

export const turnstileSiteKey=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||'';

/** Success is claimed only for a 201 whose JSON says saved:true and carries a well-formed reference. Anything else is a failure the visitor can retry with the same submission id. */
export async function submitEnquiry(payload:Record<string,unknown>):Promise<SubmitResult>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),35000);
 try{
  const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,pagePath:location.pathname}),signal:controller.signal});
  const data=await response.json().catch(()=>null) as {saved?:unknown;reference?:unknown;code?:unknown}|null;
  if(response.status===201&&data?.saved===true&&typeof data.reference==='string'&&/^PB-[0-9A-F]{8}$/.test(data.reference))return {ok:true,reference:data.reference};
  if(response.status===429)return {ok:false,kind:'throttled'};
  if(response.status===400)return {ok:false,kind:data?.code==='verification'?'verification':'invalid'};
  return {ok:false,kind:'unavailable'};
 }catch{return {ok:false,kind:'network'}}
 finally{clearTimeout(timer)}
}

export function enquiryError(kind:Exclude<SubmitResult,{ok:true}>['kind'],t:(en:string,ar:string)=>string){
 switch(kind){
  case 'invalid':return t('Some details look incorrect. Please check them (include your country code, e.g. +965) and try again.','يبدو أن بعض البيانات غير صحيحة. يرجى مراجعتها (مع رمز الدولة مثل ‎+965‎) والمحاولة مجدداً.');
  case 'throttled':return t('You have sent several requests recently. Please try again later or contact us on WhatsApp.','أرسلت عدة طلبات مؤخراً. يرجى المحاولة لاحقاً أو التواصل معنا عبر واتساب.');
  case 'verification':return t('The security check did not complete. Please try again.','لم يكتمل التحقق الأمني. يرجى المحاولة مجدداً.');
  case 'network':return t('We couldn’t reach the server. Check your connection — your details are still here.','تعذر الاتصال بالخادم. تحقق من اتصالك، فبياناتك ما زالت محفوظة هنا.');
  default:return t('We couldn’t send your enquiry just now. Your details are still here — please try again in a moment or contact us on WhatsApp.','تعذر إرسال استفسارك الآن. بياناتك ما زالت محفوظة هنا، يرجى المحاولة بعد قليل أو التواصل معنا عبر واتساب.');
 }
}

'use client';
export type ConversionEvent='assessment_opened'|'assessment_step_completed'|'assessment_submission_success'|'contact_submission_success'|'whatsapp_click'|'phone_click'|'email_click';
// Local integration seam only: no analytics vendor, network request or personal data.
export function emitConversion(event:ConversionEvent,context:{locale?:'en'|'ar';step?:number}={}){
 if(typeof window==='undefined')return;
 const step=context.step;
 const detail={event,...(context.locale==='en'||context.locale==='ar'?{locale:context.locale}:{}),...(typeof step==='number'&&Number.isInteger(step)&&step>=1&&step<=3?{step}:{})};
 window.dispatchEvent(new CustomEvent('planb:conversion',{detail}));
}

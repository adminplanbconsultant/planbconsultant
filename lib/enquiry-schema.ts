import {z} from 'zod';
import {services,countries} from './content';
import {programmes} from './programmes';
import {popupSource,popupServices} from './enquiry-popup';

export const fullSource='full-assessment';
export const contactSource='contact-form';
/** Bump when the consent wording shown next to any enquiry form changes; it is stored with every submission. */
export const consentVersion='2026-10-v1';

/** International format only: "+" then 8-15 digits. "00" prefixes are accepted and converted; spaces, dashes and brackets are removed. */
const phone=z.string().trim().max(30).transform(v=>v.replace(/[\s().-]/g,'').replace(/^00/,'+')).refine(v=>/^\+[0-9]{8,15}$/.test(v));
const common={id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone,email:z.union([z.literal(''),z.string().trim().email().max(200)]).default(''),locale:z.enum(['en','ar']),consent:z.literal(true),website:z.string().max(200).default(''),turnstileToken:z.string().max(2100).default(''),pagePath:z.string().max(200).regex(/^\/[A-Za-z0-9/_\-.%]*$/).catch('')};
const programme=z.string().refine(v=>v==='not-sure'||programmes.some(p=>p.slug===v)).default('not-sure');

export const schema=z.object({...common,source:z.literal(fullSource).default(fullSource),service:z.string().refine(v=>v==='not-sure'||services.some(s=>s.slug===v)),destination:z.string().refine(v=>v==='Not sure yet'||countries.some(c=>c[0]===v)),offer:z.enum(['yes','no','not-sure']),method:z.enum(['phone','whatsapp','email']),message:z.string().max(2000).default(''),programme,age:z.string().max(30).default(''),education:z.string().max(100).default(''),profession:z.string().max(100).default(''),nationality:z.string().max(100).default(''),residence:z.string().max(100).default(''),budget:z.string().max(100).default('')}).refine(v=>v.method!=='email'||!!v.email).refine(v=>!v.age||!!(v.education&&v.profession&&v.email));

/** Short two-step popup enquiry: goal + contact details only. */
export const shortSchema=z.object({...common,source:z.literal(popupSource),service:z.enum(['not-sure',...popupServices]),programme});

/** General contact-page enquiry: category + message + contact details. */
export const contactSchema=z.object({...common,source:z.literal(contactSource),service:z.string().refine(v=>v==='not-sure'||services.some(s=>s.slug===v)),message:z.string().max(2000).default('')});

export type FormType='quick'|'full'|'contact';
/** Validated submission. Fields a form never collects are empty strings, never invented answers. */
export type EnquiryRecord={formType:FormType;source:string;id:string;pagePath:string;locale:'en'|'ar';name:string;phone:string;email:string;service:string;programme:string;destination:string;offer:string;method:string;age:string;education:string;profession:string;nationality:string;residence:string;budget:string;message:string;turnstileToken:string};
const blank={programme:'',destination:'',offer:'',method:'',age:'',education:'',profession:'',nationality:'',residence:'',budget:'',message:''};

export function normalizeEnquiry(json:unknown):EnquiryRecord|null{
 const source=json&&typeof json==='object'?(json as {source?:unknown}).source:undefined;
 if(source===popupSource){
  const r=shortSchema.safeParse(json);if(!r.success||r.data.website)return null;
  const p=r.data;const country=programmes.find(x=>x.slug===p.programme)?.country;
  return {...blank,formType:'quick',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,programme:p.programme,destination:country&&countries.some(c=>c[0]===country)?country:'',turnstileToken:p.turnstileToken};
 }
 if(source===contactSource){
  const r=contactSchema.safeParse(json);if(!r.success||r.data.website)return null;
  const p=r.data;
  return {...blank,formType:'contact',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,message:p.message,turnstileToken:p.turnstileToken};
 }
 const r=schema.safeParse(json);if(!r.success||r.data.website)return null;
 const p=r.data;
 return {formType:'full',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,programme:p.programme,destination:p.destination,offer:p.offer,method:p.method,age:p.age,education:p.education,profession:p.profession,nationality:p.nationality,residence:p.residence,budget:p.budget==='Not applicable'?'':p.budget,message:p.message,turnstileToken:p.turnstileToken};
}

import {z} from 'zod';
import {services,countries} from './content';
import {enquiryProgrammes,isEnquiryProgramme} from './enquiry-programmes';
import {popupSource,popupServices} from './enquiry-popup';

export const fullSource='full-assessment';
export const contactSource='contact-form';
/** Bump when the consent wording shown next to any enquiry form changes; it is stored with every submission. */
export const consentVersion='2026-10-v1';

/** International format only: "+" then 8-15 digits. "00" prefixes are accepted and converted; spaces, dashes and brackets are removed. */
const phone=z.string().trim().max(30).transform(v=>v.replace(/[\s().-]/g,'').replace(/^00/,'+')).refine(v=>/^\+[0-9]{8,15}$/.test(v));
const common={id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone,email:z.union([z.literal(''),z.string().trim().email().max(200)]).default(''),locale:z.enum(['en','ar']),consent:z.literal(true),website:z.string().max(200).default(''),turnstileToken:z.string().max(2100).default(''),pagePath:z.string().max(200).regex(/^\/[A-Za-z0-9/_\-.%]*$/).catch('')};
const programme=z.string().refine(v=>v==='not-sure'||isEnquiryProgramme(v)).default('not-sure');

/** Full assessment, step 1 (contact first): creates the enquiry. Plans and profile are added later via `updateSchema`. Email is required here. */
export const fullContactSchema=z.object({...common,source:z.literal(fullSource),stage:z.literal('contact'),email:z.string().trim().email().max(200),service:z.string().refine(v=>v===''||v==='not-sure'||services.some(s=>s.slug===v)).default('')});

const optional=(max:number)=>z.string().trim().max(max).default('');
/**
 * Full assessment, steps 2-3: optional details for an enquiry created in step 1. Every field is optional; an empty value means
 * "leave unchanged". Authorised by the short-lived update token the server issued for that enquiry (lib/update-token.ts).
 */
export const updateSchema=z.object({action:z.literal('update'),id:z.string().uuid(),updateToken:z.string().min(20).max(200),locale:z.enum(['en','ar']),
 programme:z.string().refine(v=>v===''||v==='not-sure'||isEnquiryProgramme(v)).default(''),
 destination:z.string().refine(v=>v===''||v==='Not sure yet'||countries.some(c=>c[0]===v)).default(''),
 offer:z.enum(['','yes','no','not-sure']).default(''),method:z.enum(['','phone','whatsapp','email']).default(''),
 budget:optional(100),age:optional(30),education:optional(100),profession:optional(100),nationality:optional(100),residence:optional(100),message:optional(2000)}).strict();
export type EnquiryUpdate={id:string;token:string;fields:Record<string,string>};
const updateFields=['programme','destination','offer','method','budget','age','education','profession','nationality','residence','message'] as const;
/** Returns only the fields the visitor actually supplied; null when invalid or when nothing would change. */
export function normalizeUpdate(json:unknown):EnquiryUpdate|null{
 const r=updateSchema.safeParse(json);if(!r.success)return null;
 const fields:Record<string,string>={};
 for(const k of updateFields){const v=r.data[k];if(v)fields[k]=v}
 return Object.keys(fields).length?{id:r.data.id,token:r.data.updateToken,fields}:null;
}

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
  const p=r.data;const country=enquiryProgrammes.find(x=>x.slug===p.programme)?.country;
  return {...blank,formType:'quick',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,programme:p.programme,destination:country&&countries.some(c=>c[0]===country)?country:'',turnstileToken:p.turnstileToken};
 }
 if(source===contactSource){
  const r=contactSchema.safeParse(json);if(!r.success||r.data.website)return null;
  const p=r.data;
  return {...blank,formType:'contact',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,message:p.message,turnstileToken:p.turnstileToken};
 }
 if(source!==fullSource)return null;
 const r=fullContactSchema.safeParse(json);if(!r.success||r.data.website)return null;
 const p=r.data;
 return {...blank,formType:'full',source:p.source,id:p.id,pagePath:p.pagePath,locale:p.locale,name:p.name,phone:p.phone,email:p.email,service:p.service,turnstileToken:p.turnstileToken};
}

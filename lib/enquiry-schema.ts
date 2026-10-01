import {z} from 'zod';
import {services,countries} from './content';
import {programmes} from './programmes';
import {popupSource,popupServices} from './enquiry-popup';
const phone=z.string().trim().max(25).transform(v=>v.replace(/[\s()-]/g,'')).refine(v=>/^\+?[0-9]{7,15}$/.test(v));
export const schema=z.object({id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone,email:z.union([z.literal(''),z.string().email().max(200)]).default(''),service:z.string().refine(v=>v==='not-sure'||services.some(s=>s.slug===v)),destination:z.string().refine(v=>v==='Not sure yet'||countries.some(c=>c[0]===v)),offer:z.enum(['yes','no','not-sure']),method:z.enum(['phone','whatsapp','email']),message:z.string().max(2000).default(''),website:z.string().max(200).default(''),consent:z.literal(true),locale:z.enum(['en','ar']),programme:z.string().refine(v=>v==='not-sure'||programmes.some(p=>p.slug===v)).default('not-sure'),age:z.string().max(30).default(''),education:z.string().max(100).default(''),profession:z.string().max(100).default(''),nationality:z.string().max(100).default(''),residence:z.string().max(100).default(''),budget:z.string().max(100).default('')}).refine(v=>v.method!=='email'||!!v.email).refine(v=>!v.age||!!(v.education&&v.profession&&v.email));

/** Short two-step popup enquiry: goal + contact details only. Full-assessment validation above is unchanged. */
export const shortSchema=z.object({source:z.literal(popupSource),id:z.string().uuid(),name:z.string().trim().min(2).max(100),phone,email:z.union([z.literal(''),z.string().email().max(200)]).default(''),service:z.enum(['not-sure',...popupServices]),programme:z.string().refine(v=>v==='not-sure'||programmes.some(p=>p.slug===v)).default('not-sure'),locale:z.enum(['en','ar']),consent:z.literal(true),website:z.string().max(200).default('')});

/** Row shape written to `enquiries`. Fields the short form never collects use the schema's existing "not provided" sentinels, never invented answers. */
export type EnquiryRecord={id:string;name:string;phone:string;email:string;service:string;destination:string;offer:string;method:string;message:string;locale:'en'|'ar';programme:string;profile:Record<string,string>};
export function normalizeEnquiry(json:unknown):EnquiryRecord|null{
 if(json&&typeof json==='object'&&(json as {source?:unknown}).source===popupSource){
  const r=shortSchema.safeParse(json);if(!r.success||r.data.website)return null;
  const p=r.data;const country=programmes.find(x=>x.slug===p.programme)?.country;
  return {id:p.id,name:p.name,phone:p.phone,email:p.email,service:p.service,destination:country&&countries.some(c=>c[0]===country)?country:'Not sure yet',offer:'not-sure',method:'not-specified',message:'',locale:p.locale,programme:p.programme,profile:{source:p.source,programme:p.programme,consent:'true'}};
 }
 const r=schema.safeParse(json);if(!r.success||r.data.website)return null;
 const p=r.data;
 return {id:p.id,name:p.name,phone:p.phone,email:p.email,service:p.service,destination:p.destination,offer:p.offer,method:p.method,message:p.message,locale:p.locale,programme:p.programme,profile:{programme:p.programme,age:p.age,education:p.education,profession:p.profession,nationality:p.nationality,residence:p.residence,budget:p.budget}};
}

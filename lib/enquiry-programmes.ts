import {programmes} from './programmes';
import {investmentProgrammes,investmentTitle} from './investment-programmes';

/** Every programme an enquiry may name: the original programme pages plus the investment programme pages. Code.gs mirrors this list. */
export const enquiryProgrammes:{slug:string;title:string;ar:string;group:string;country:string}[]=[
 ...programmes.map(p=>({slug:p.slug,title:p.title,ar:p.ar,group:p.group as string,country:p.country})),
 ...investmentProgrammes.map(p=>({slug:p.id,title:investmentTitle(p,false),ar:investmentTitle(p,true),group:p.category==='citizenship'?'citizenship':'residency-investment',country:p.country}))
];
export const isEnquiryProgramme=(slug:string)=>enquiryProgrammes.some(p=>p.slug===slug);
/** Programme groups for which the optional investment-budget question is shown. */
export const investmentGroups=['business','citizenship','residency-investment'];

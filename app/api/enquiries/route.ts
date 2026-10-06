import {normalizeEnquiry} from '@/lib/enquiry-schema';
import {gatewayConfig,saveEnquiry,verifyTurnstile} from '@/lib/sheets-gateway';
export const runtime='nodejs';
export const maxDuration=30;
const MAX_BODY=12000;
const headers={'Cache-Control':'no-store'};
const fail=(code:string,status:number,extra:Record<string,string>={})=>Response.json({error:code,code},{status,headers:{...headers,...extra}});

function originAllowed(request:Request){
 const origin=request.headers.get('origin');if(!origin)return true; // non-browser callers have no Origin; they still face validation, Turnstile and throttling
 let host='';try{host=new URL(origin).host}catch{return false}
 const requestHost=request.headers.get('x-forwarded-host')||request.headers.get('host');
 if(requestHost&&host===requestHost)return true;
 const allowed=new Set([new URL(request.url).origin]);
 try{const site=new URL(process.env.NEXT_PUBLIC_SITE_URL||'');allowed.add(site.origin);allowed.add(site.origin.replace('://www.','://').replace('://','://www.'))}catch{}
 return allowed.has(origin);
}

export async function POST(request:Request){
 try{
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return fail('unsupported',415);
  if(!originAllowed(request))return fail('origin',403);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY)return fail('too-large',413);
  const reader=request.body?.getReader();if(!reader)return fail('invalid',400);
  let length=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BODY){await reader.cancel();return fail('too-large',413)}chunks.push(value)}
  let json;try{json=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return fail('invalid',400)}
  const record=normalizeEnquiry(json);if(!record)return fail('invalid',400);
  const config=gatewayConfig();
  if(!config)return fail('not-configured',503);
  // Vercel overwrites x-vercel-forwarded-for; never trust arbitrary client IP headers elsewhere.
  const ip=process.env.VERCEL?request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown':'local';
  const human=await verifyTurnstile(record.turnstileToken,ip);
  if(human==='failed')return fail('verification',400);
  if(human==='unavailable')return fail('unavailable',503);
  const result=await saveEnquiry(record,ip,config);
  if(result.status==='saved')return Response.json({saved:true,reference:result.reference,duplicate:result.duplicate},{status:201,headers});
  if(result.status==='rejected'){
   if(result.code==='invalid')return fail('invalid',400);
   if(result.code==='throttled')return fail('throttled',429,{'Retry-After':'3600'});
   console.error('enquiry-storage: apps script rejected the shared secret'); // code only, no request data
   return fail('not-configured',503);
  }
  console.error('enquiry-storage: save not confirmed ('+result.reason+')');
  return fail('unavailable',503);
 }catch{
  console.error('enquiry-storage: unexpected error');
  return fail('unavailable',503);
 }
}

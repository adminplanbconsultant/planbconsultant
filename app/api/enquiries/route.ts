import {notifyEnquiry} from '@/lib/enquiry-notification';
import {normalizeEnquiry} from '@/lib/enquiry-schema';
import {createHash} from 'node:crypto';
import {database} from '@/lib/database';
import {services,countries} from '@/lib/content';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return Response.json({error:'JSON required'},{status:415});
  const source=request.headers.get('origin');
  if(source && source!==new URL(request.url).origin)return Response.json({error:'Origin rejected'},{status:403});
  if(Number(request.headers.get('content-length')||0)>12000)return Response.json({error:'Too large'},{status:413});
  const reader=request.body?.getReader();if(!reader)return Response.json({error:'Missing body'},{status:400});
  let length=0;const chunks:Uint8Array[]=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>12000){await reader.cancel();return Response.json({error:'Too large'},{status:413})}chunks.push(value)}
  let json;try{json=JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{return Response.json({error:'Invalid JSON'},{status:400})}
  const p=normalizeEnquiry(json);if(!p)return Response.json({error:'Please check your details'},{status:400});
  if(!process.env.DATABASE_URL || !process.env.RATE_LIMIT_SECRET)return Response.json({error:'Enquiry service is not configured yet.'},{status:503});
  const sql=database();const now=Date.now();
  // Vercel overwrites x-vercel-forwarded-for. Do not trust arbitrary client IP headers.
  const ip=process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()||'unknown' : 'local';
  const key=createHash('sha256').update(ip+':'+Math.floor(now/3600000)+':'+process.env.RATE_LIMIT_SECRET).digest('hex');
  const rate=await sql`INSERT INTO rate_limits (key,count,expires) VALUES (${key},1,${now+3600000}) ON CONFLICT(key) DO UPDATE SET count=rate_limits.count+1 RETURNING count`;
  if(rate[0].count>8)return Response.json({error:'Please try later'},{status:429,headers:{'Retry-After':'3600'}});
  await sql`DELETE FROM rate_limits WHERE expires < ${now}`;
  const inserted=await sql`INSERT INTO enquiries (id,name,phone,email,service,destination,offer,method,message,locale,created_at,profile) VALUES (${p.id},${p.name},${p.phone},${p.email},${p.service},${p.destination},${p.offer},${p.method},${p.message},${p.locale},${now},${JSON.stringify(p.profile)}) ON CONFLICT(id) DO NOTHING RETURNING id`;
  if(inserted.length){
   const notification=await notifyEnquiry({reference:'PB-'+p.id.slice(0,8).toUpperCase(),name:p.name,phone:p.phone,email:p.email,method:p.method,service:p.service,locale:p.locale,programme:p.programme,destination:p.destination,message:p.message,source:p.profile.source||'full-assessment',submittedAt:now},{url:process.env.ENQUIRY_WEBHOOK_URL,token:process.env.ENQUIRY_WEBHOOK_TOKEN});
   if(notification==='failed')console.error('Enquiry notification failed; saved reference PB-'+p.id.slice(0,8).toUpperCase());
  }
  return Response.json({reference:'PB-'+p.id.slice(0,8).toUpperCase()},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Your enquiry could not be saved. Please try again.'},{status:503});}
}

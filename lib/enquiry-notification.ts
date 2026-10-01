/** Server-only outbound integration. Never accepts a destination from form input. */
export async function notifyEnquiry(payload:Record<string,unknown>, config:{url?:string;token?:string}, send:typeof fetch=fetch):Promise<'disabled'|'delivered'|'failed'>{
 if(!config.url||!config.token)return 'disabled';
 try{
  const url=new URL(config.url);if(url.protocol!=='https:'||url.username||url.password)return 'failed';
  const response=await send(url,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token,'Idempotency-Key':String(payload.reference)},body:JSON.stringify({event:'enquiry.created',...payload}),signal:AbortSignal.timeout(5000)});
  return response.ok?'delivered':'failed';
 }catch{return 'failed'}
}

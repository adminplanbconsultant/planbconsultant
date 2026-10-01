/** Server-only outbound integration. Never accepts a destination from form input. */
export async function notifyEnquiry(payload:Record<string,unknown>, config:{url?:string;token?:string}, send:typeof fetch=fetch):Promise<'disabled'|'delivered'|'failed'>{
 if(!config.url||!config.token)return 'disabled';
 try{
  const url=new URL(config.url);if(url.protocol!=='https:'||url.username||url.password)return 'failed';
  const response=await send(url,{method:'POST',redirect:'manual',headers:{'Content-Type':'application/json',Authorization:'Bearer '+config.token,'Idempotency-Key':String(payload.reference)},body:JSON.stringify({event:'enquiry.created',...payload,secret:config.token}),signal:AbortSignal.timeout(5000)});
  // Google Apps Script answers a successful POST with a 302 to its result page; the script has already run, so a redirect is not followed and counts as delivered.
  return response.ok||(response.status>=300&&response.status<400)?'delivered':'failed';
 }catch{return 'failed'}
}

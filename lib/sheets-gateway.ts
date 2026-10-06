import {createHmac} from 'node:crypto';
import {z} from 'zod';
import {consentVersion,type EnquiryRecord} from './enquiry-schema';

/** Server-only client for the Google Apps Script web app that owns the private spreadsheet. */
export type GatewayResult=
 |{status:'saved';reference:string;duplicate:boolean;notification:string}
 |{status:'rejected';code:'invalid'|'throttled'|'config'}
 |{status:'unavailable';reason:'not-configured'|'uncertain'|'busy'};

const ATTEMPT_MS=9000;
const BUDGET_MS=20000;
const MAX_ATTEMPTS=2;
const MAX_RESPONSE_BYTES=4000;

const success=z.object({ok:z.literal(true),saved:z.literal(true),id:z.string(),reference:z.string().regex(/^PB-[0-9A-F]{8}$/),duplicate:z.boolean(),notification:z.string().max(20)}).strict();
const failure=z.object({ok:z.literal(false),code:z.enum(['invalid','unauthorized','throttled','busy','server'])}).strict();

export function gatewayConfig(env:Record<string,string|undefined>=process.env){
 const url=env.GOOGLE_APPS_SCRIPT_URL?.trim();const secret=env.GOOGLE_APPS_SCRIPT_SECRET;
 if(!url||!secret||secret.length<32)return null;
 try{
  const parsed=new URL(url);
  const local=['localhost','127.0.0.1'].includes(parsed.hostname); // loopback over http is allowed so the integration test can run against a local mock; remote hosts must be https
  if(parsed.username||parsed.password||(parsed.protocol!=='https:'&&!(local&&parsed.protocol==='http:')))return null;
  return {url:parsed,secret,local};
 }catch{return null}
}

export function reference(id:string){return 'PB-'+id.slice(0,8).toUpperCase()}
/** Stable, non-reversible per-visitor key sent to Apps Script for throttling; the raw IP address never leaves this server. */
export function clientKey(ip:string,secret:string){return createHmac('sha256',secret).update('client:'+ip).digest('hex')}

function allowedRedirect(target:URL,config:{url:URL;local:boolean}){
 if(config.local&&target.host===config.url.host)return true;
 return target.protocol==='https:'&&(target.hostname==='script.google.com'||target.hostname==='script.googleusercontent.com');
}

async function readJson(response:Response):Promise<unknown>{
 const reader=response.body?.getReader();if(!reader)throw new Error('empty');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_RESPONSE_BYTES){await reader.cancel();throw new Error('large')}chunks.push(value)}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** One POST to Apps Script. Web-app POSTs answer with a redirect whose target holds the script's JSON output; follow it manually and only to Google hosts. */
async function attempt(config:{url:URL;secret:string;local:boolean},body:string,send:typeof fetch,deadline:number):Promise<{kind:'json';value:unknown}|{kind:'uncertain'}>{
 try{
  const signal=AbortSignal.timeout(Math.max(1000,Math.min(ATTEMPT_MS,deadline-Date.now())));
  let response=await send(config.url,{method:'POST',redirect:'manual',headers:{'Content-Type':'text/plain;charset=utf-8'},body,signal});
  for(let hops=0;response.status>=300&&response.status<400&&hops<3;hops++){
   const location=response.headers.get('location');if(!location)return {kind:'uncertain'};
   const target=new URL(location,config.url);if(!allowedRedirect(target,config))return {kind:'uncertain'};
   response=await send(target,{method:'GET',redirect:'manual',signal});
  }
  if(response.status!==200)return {kind:'uncertain'};
  return {kind:'json',value:await readJson(response)};
 }catch{return {kind:'uncertain'}}
}

/**
 * Saves one enquiry. Every outcome is derived from the validated Apps Script JSON, never from HTTP status alone.
 * Retries reuse the same submission id, so Apps Script answers a repeat with the existing reference instead of adding a row.
 */
export async function saveEnquiry(record:EnquiryRecord,ip:string,config=gatewayConfig(),send:typeof fetch=fetch):Promise<GatewayResult>{
 if(!config)return {status:'unavailable',reason:'not-configured'};
 const {turnstileToken:_token,...fields}=record;void _token;
 const body=JSON.stringify({...fields,formType:record.formType,consent:true,consentVersion,reference:reference(record.id),clientKey:clientKey(ip,config.secret),secret:config.secret});
 const deadline=Date.now()+BUDGET_MS;let busy=false;
 for(let n=0;n<MAX_ATTEMPTS&&Date.now()<deadline-1500;n++){
  if(n>0)await new Promise(r=>setTimeout(r,600));
  const result=await attempt(config,body,send,deadline);
  if(result.kind==='uncertain')continue;
  const ok=success.safeParse(result.value);
  if(ok.success){
   if(ok.data.id!==record.id||ok.data.reference!==reference(record.id))continue; // not the answer to our request
   return {status:'saved',reference:ok.data.reference,duplicate:ok.data.duplicate,notification:ok.data.notification};
  }
  const bad=failure.safeParse(result.value);
  if(!bad.success)continue; // malformed: treat as uncertain
  if(bad.data.code==='invalid')return {status:'rejected',code:'invalid'};
  if(bad.data.code==='throttled')return {status:'rejected',code:'throttled'};
  if(bad.data.code==='unauthorized')return {status:'rejected',code:'config'};
  busy=bad.data.code==='busy';
 }
 return {status:'unavailable',reason:busy?'busy':'uncertain'};
}

/** Cloudflare Turnstile. Returns 'skipped' when no secret key is configured. */
export async function verifyTurnstile(token:string,ip:string,env:Record<string,string|undefined>=process.env,send:typeof fetch=fetch):Promise<'skipped'|'passed'|'failed'|'unavailable'>{
 const secret=env.TURNSTILE_SECRET_KEY;if(!secret)return 'skipped';
 if(!token)return 'failed';
 try{
  const form=new URLSearchParams({secret,response:token});if(ip&&ip!=='local'&&ip!=='unknown')form.set('remoteip',ip);
  const response=await send('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:form,signal:AbortSignal.timeout(5000)});
  if(!response.ok)return 'unavailable';
  const data=await response.json() as {success?:boolean};
  return data.success===true?'passed':'failed';
 }catch{return 'unavailable'}
}

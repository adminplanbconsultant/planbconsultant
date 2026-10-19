import {createHmac,timingSafeEqual} from 'node:crypto';

/**
 * Short-lived, opaque authorisation for adding optional details to an enquiry the visitor has just created.
 * Issued by the server only after Apps Script confirmed the enquiry was saved (and, for a repeated request, that the stored
 * phone and email match). Bound to one enquiry id, signed with a key derived from the server-only Apps Script secret,
 * never stored and never sent to Apps Script. A client-supplied enquiry id alone can never update a row.
 */
export const UPDATE_TOKEN_TTL_MS=2*60*60*1000;
const key=(secret:string)=>createHmac('sha256',secret).update('planb:update-token:v1').digest();
const sign=(secret:string,id:string,expires:number)=>createHmac('sha256',key(secret)).update(id+'.'+expires).digest('base64url');

export function issueUpdateToken(id:string,secret:string,now=Date.now()){
 const expires=now+UPDATE_TOKEN_TTL_MS;
 return `v1.${expires.toString(36)}.${sign(secret,id,expires)}`;
}

export function verifyUpdateToken(token:string,id:string,secret:string,now=Date.now()):boolean{
 const parts=token.split('.');
 if(parts.length!==3||parts[0]!=='v1')return false;
 const expires=parseInt(parts[1],36);
 if(!Number.isFinite(expires)||expires<now||expires>now+UPDATE_TOKEN_TTL_MS+60000)return false;
 const expected=Buffer.from(sign(secret,id,expires));const given=Buffer.from(parts[2]);
 return given.length===expected.length&&timingSafeEqual(given,expected);
}

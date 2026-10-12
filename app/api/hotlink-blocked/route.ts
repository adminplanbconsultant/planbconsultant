/** Target of the hotlink rewrite in next.config.ts: a plain 403 that is never cached and never indexed. */
export const runtime='nodejs';
const body=()=>new Response('Hotlinking of this image is not permitted. Please view it at https://planbconsultant.com',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
export const GET=body;export const HEAD=body;

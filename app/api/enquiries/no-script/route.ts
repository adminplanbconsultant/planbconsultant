/**
 * Safety net for the enquiry forms. Each form declares method="post" with this route as its action, so a browser that submits a
 * form natively (JavaScript disabled, not yet loaded, or failed) sends the fields in a POST body, never in the URL.
 * The request body is deliberately NOT read, stored or logged: nothing is saved and no notification is sent, so this path can
 * never create a duplicate enquiry. The visitor is redirected (303 → GET, no query string) to the contact page, where a notice
 * explains that the form needs JavaScript and lists the phone, WhatsApp and email options.
 * The working submission path is unchanged: the forms' JavaScript handlers POST JSON to /api/enquiries.
 */
const target=(request:Request)=>{
 const locale=new URL(request.url).searchParams.get('locale')==='ar'?'ar':'en';
 return new URL(`/${locale}/contact#enquiry-needs-javascript`,request.url);
};
const redirect=(request:Request)=>new Response(null,{status:303,headers:{Location:target(request).toString(),'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
export function POST(request:Request){return redirect(request)}
export function GET(request:Request){return redirect(request)}

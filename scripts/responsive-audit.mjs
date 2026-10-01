// Responsive audit: launches headless Chrome, visits every locale x route at phone/tablet widths
// and reports horizontal overflow, offending elements and tiny tap targets.
// Usage: node scripts/responsive-audit.mjs   (TEST_BASE_URL defaults to http://localhost:3000, CHROME_PATH optional)
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import ts from 'typescript';
const base=process.env.TEST_BASE_URL||'http://localhost:3000';
const chromePath=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port=9333;
const stub=f=>ts.transpileModule(readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const overviewUrl='data:text/javascript;base64,'+Buffer.from(stub('lib/service-overviews.ts')).toString('base64');
const {services,countries,guides,slugify}=await import('data:text/javascript;base64,'+Buffer.from(stub('lib/content.ts').replace("'./service-overviews'",JSON.stringify(overviewUrl))).toString('base64'));
const {programmes}=await import('data:text/javascript;base64,'+Buffer.from(stub('lib/programmes.ts')).toString('base64'));
const paths=['','programmes',...programmes.map(p=>'programmes/'+p.slug),'about','services','destinations','resources','consultation','contact','privacy','faqs',...services.map(s=>'services/'+s.slug),...countries.map(c=>'destinations/'+slugify(c[0])),...guides.map(g=>'resources/'+g.slug)];
const widths=(process.env.WIDTHS||'320,375,414,600,768,834,1024').split(',').map(Number);
const locales=(process.env.LOCALES||'en,ar').split(',');
const only=process.env.ONLY;

const chrome=spawn(chromePath,['--headless=new',`--remote-debugging-port=${port}`,'--no-first-run','--disable-gpu','--user-data-dir='+process.env.TEMP+'/rwd-audit','about:blank'],{stdio:'ignore'});
let targets;for(let i=0;i<40;i++){try{targets=await (await fetch(`http://127.0.0.1:${port}/json`)).json();if(targets.some(t=>t.type==='page'))break}catch{}await new Promise(r=>setTimeout(r,300))}
const target=targets.find(t=>t.type==='page');
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();
socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){const q=pending.get(m.id);pending.delete(m.id);m.error?q.reject(new Error(m.error.message)):q.resolve(m.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const c=++id;pending.set(c,{resolve,reject});socket.send(JSON.stringify({id:c,method,params}))});
await send('Page.enable');
const probe=`(()=>{const W=innerWidth;const bad=[];for(const el of document.querySelectorAll('body *')){const r=el.getBoundingClientRect();if(r.width===0||r.height===0)continue;const cs=getComputedStyle(el);if(cs.position==='fixed'&&0)continue;if(r.right>W+1||r.left<-1){let p=el,clipped=false;while((p=p.parentElement)&&p!==document.body){const o=getComputedStyle(p);if(/(auto|scroll|hidden|clip)/.test(o.overflowX)){clipped=true;break}}if(!clipped)bad.push((el.tagName.toLowerCase()+'.'+String(el.className).split(' ').filter(Boolean).slice(0,2).join('.')+' r='+Math.round(r.right)+' l='+Math.round(r.left)))}}
const small=[...document.querySelectorAll('a,button,summary,input,select,textarea')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<32||r.width<32)&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]')&&!e.classList.contains('sr-only')&&!/skip/.test(e.className)}).slice(0,6).map(e=>e.tagName.toLowerCase()+'.'+String(e.className).split(' ')[0]+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height)+' "'+(e.textContent||'').trim().slice(0,20)+'"');
return {scroll:document.documentElement.scrollWidth,W,bad:[...new Set(bad)].slice(0,8),small}})()`;
const results=[];
for(const width of widths){
 await send('Emulation.setDeviceMetricsOverride',{width,height:width>=768?1024:800,deviceScaleFactor:1,mobile:width<800});
 for(const locale of locales)for(const path of paths){
  if(only&&!(locale+'/'+path).includes(only))continue;
  await send('Page.navigate',{url:`${base}/${locale}${path?'/'+path:''}`});
  await new Promise(r=>setTimeout(r,900));
  // scroll through to trigger lazy content / reveal animations
  await send('Runtime.evaluate',{expression:'window.scrollTo(0,document.body.scrollHeight)'});await new Promise(r=>setTimeout(r,250));await send('Runtime.evaluate',{expression:'window.scrollTo(0,0)'});
  const r=(await send('Runtime.evaluate',{returnByValue:true,expression:probe})).result.value;
  results.push({width,locale,path,...r,overflow:r.scroll>r.W});
 }
}
socket.close();chrome.kill();
mkdirSync('artifacts/responsive',{recursive:true});writeFileSync('artifacts/responsive/audit.json',JSON.stringify(results,null,2));
const fails=results.filter(r=>r.overflow||r.bad.length);
console.log(`checked ${results.length} page/width combos; ${fails.length} with overflow`);
const group={};for(const f of fails)for(const b of f.bad.length?f.bad:['(scroll only)'])(group[b.replace(/ r=.*/,'')]??=new Set()).add(f.width+' '+f.locale+'/'+f.path);
for(const [k,v] of Object.entries(group))console.log(k,'->',[...v].slice(0,4).join(' | '),v.size>4?`(+${v.size-4})`:'');
const sm={};for(const r of results)for(const s of r.small)(sm[s.replace(/ \d+x\d+.*/,'')]??=0),sm[s.replace(/ \d+x\d+.*/,'')]++;
console.log('small tap targets (selector: count):',JSON.stringify(Object.entries(sm).sort((a,b)=>b[1]-a[1]).slice(0,10)));

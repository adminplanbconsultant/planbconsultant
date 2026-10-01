import {mkdirSync,writeFileSync} from 'node:fs';

const debuggerPort=Number(process.env.CHROME_DEBUG_PORT||9226);
const site=process.env.TEST_BASE_URL||'http://localhost:3106';
const output='artifacts/programme-pages';
mkdirSync(output,{recursive:true});
const slugs=['canada-express-entry','australia-skilled-migration','australia-work-visas','germany-nursing','germany-car-mechanics','sweden-work-permit','portugal-work-residence','canada-c11','usa-eb5','usa-e2'];
const arabicSamples=['canada-express-entry','germany-nursing','usa-eb5'];
const cases=[...slugs.flatMap(slug=>[[slug,'en',1440,900],[slug,'en',390,844]]),...arabicSamples.flatMap(slug=>[[slug,'ar',1440,900],[slug,'ar',390,844]])];
const previewCases=new Set(['canada-express-entry-en-1440','germany-nursing-en-390','usa-eb5-en-1440','canada-express-entry-ar-390','germany-nursing-ar-1440','usa-eb5-ar-390']);

const targets=await (await fetch(`http://127.0.0.1:${debuggerPort}/json`)).json();
const target=targets.find(item=>item.type==='page');
if(!target)throw new Error('No Chrome page target found');
const socket=new WebSocket(target.webSocketDebuggerUrl);let id=0;const pending=new Map();
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
socket.addEventListener('message',event=>{const message=JSON.parse(event.data);if(message.id&&pending.has(message.id)){const {resolve,reject}=pending.get(message.id);pending.delete(message.id);message.error?reject(new Error(message.error.message)):resolve(message.result)}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const call=++id;pending.set(call,{resolve,reject});socket.send(JSON.stringify({id:call,method,params}))});
await send('Page.enable');await send('Runtime.enable');
const results=[];
for(const [slug,locale,width,height] of cases){
 const name=`${slug}-${locale}-${width}`;
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
 await send('Page.navigate',{url:`${site}/${locale}/programmes/${slug}`});
 await new Promise(resolve=>setTimeout(resolve,2200));
 await send('Runtime.evaluate',{awaitPromise:true,expression:`(async()=>{document.documentElement.style.scrollBehavior='auto';for(let y=0;y<document.documentElement.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,70))}await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})})));scrollTo(0,0);await new Promise(r=>setTimeout(r,180))})()`});
 const evaluated=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const mast=document.querySelector('.final-masthead');const assessment=document.querySelector('#assessment');const images=[...document.querySelectorAll('.programme-hero img,.programme-story img,.programme-benefits img')];const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};const text=e=>e?.textContent?.replace(/\\s+/g,' ').trim()||'';const table=document.querySelector('.points-table');const tableBox=table?.getBoundingClientRect();const assessmentSelect=document.querySelector('#assessment-programme');const assessmentForm=document.querySelector('.assessment-form');return {title:document.title,h1:text(document.querySelector('h1')),dir:document.documentElement.dir||document.querySelector('.site-shell')?.dir,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth,headerHeight:mast?.getBoundingClientRect().height,sections:{overview:!!document.querySelector('.programme-story'),pathways:document.querySelectorAll('.pathway-list article').length,eligibility:document.querySelectorAll('.editorial-list li').length,benefits:document.querySelectorAll('.programme-benefits li').length,documents:document.querySelectorAll('.document-list article').length,process:document.querySelectorAll('.programme-timeline li').length,faqs:document.querySelectorAll('.programme-faqs details').length,related:document.querySelectorAll('.related-programmes .programme-card').length},images:images.map(img=>({src:img.getAttribute('src'),alt:img.getAttribute('alt'),loaded:img.complete&&img.naturalWidth>0,visible:visible(img),objectFit:getComputedStyle(img).objectFit})),assessmentPreselection:assessmentForm?.dataset.selectedProgramme,assessmentDisplay:text(assessmentSelect),assessmentAnchorTop:(()=>{assessment?.scrollIntoView();const top=assessment?.getBoundingClientRect().top;scrollTo(0,0);return top})(),table:table?{insideViewport:tableBox.left>=0&&tableBox.right<=innerWidth,rows:table.querySelectorAll('tbody tr').length}:null,ctaTargets:[...document.querySelectorAll('.programme-actions a,.programme-help a,.programme-final-cta a')].map(a=>a.getAttribute('href'))}})()`});
 const scopedAssessment=await send('Runtime.evaluate',{returnByValue:true,expression:`(()=>{const section=document.querySelector('#assessment');return {preselection:section?.querySelector('.assessment-form')?.dataset.selectedProgramme,display:section?.querySelector('#assessment-programme')?.textContent?.replace(/\\s+/g,' ').trim()||''}})()`});
 results.push({name,slug,locale,width,height,...evaluated.result.value,assessmentPreselection:scopedAssessment.result.value.preselection,assessmentDisplay:scopedAssessment.result.value.display});
 if(previewCases.has(name)){const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(`${output}/${name}.png`,Buffer.from(shot.data,'base64'))}
}
writeFileSync(`${output}/qa-results.json`,JSON.stringify(results,null,2));
const failures=results.filter(result=>result.overflow||result.images.some(image=>!image.loaded||!image.alt)||result.sections.pathways<2||result.sections.documents<5||result.sections.faqs<4||result.assessmentPreselection!==result.slug||result.assessmentAnchorTop<result.headerHeight-1||(result.slug==='canada-express-entry'&&(!result.table||result.table.rows!==7||!result.table.insideViewport)));
console.log(JSON.stringify({checked:results.length,failures:failures.map(item=>item.name),results},null,2));
socket.close();
if(failures.length)process.exitCode=1;

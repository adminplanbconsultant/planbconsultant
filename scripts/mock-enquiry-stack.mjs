// Local QA stack with NO live Google services: a mock Apps Script (running Code.gs in the vm harness) plus two production servers.
//   :3107  website wired to the mock (persistence tests)      :3000  website with no enquiry configuration (honest-failure tests)
// Prerequisite: `npm run build`. Stop with Ctrl+C. Used by scripts/assessment-popup-qa.mjs and scripts/content-forms-qa.mjs.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createScript} from './apps-script-harness.mjs';
const SECRET='q'.repeat(48);const script=createScript({secret:SECRET});const echoes=new Map();let n=0;
http.createServer((req,res)=>{
 if(req.method==='GET'&&req.url.startsWith('/echo/')){res.writeHead(200,{'Content-Type':'application/json'});return res.end(echoes.get(req.url.slice(6))||'')}
 if(req.method==='GET'&&req.url==='/__state'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({quick:script.rows('Quick Assessments').length,full:script.rows('Full Assessments').length,contact:script.rows('Contact Enquiries').length,emails:script.state.sent.length}))}
 let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{const t=String(++n);echoes.set(t,JSON.stringify(script.post(raw)));res.writeHead(302,{Location:'http://127.0.0.1:3301/echo/'+t});res.end()});
}).listen(3301,'127.0.0.1');
const start=(port,env)=>spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',String(port)],{stdio:'inherit',env:{...process.env,GOOGLE_APPS_SCRIPT_URL:'',GOOGLE_APPS_SCRIPT_SECRET:'',...env}});
start(3107,{GOOGLE_APPS_SCRIPT_URL:'http://127.0.0.1:3301/exec',GOOGLE_APPS_SCRIPT_SECRET:SECRET});start(3000,{});
console.log('Mock stack running: http://localhost:3107 (mock sheet) and http://localhost:3000 (unconfigured).');

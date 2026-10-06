// Runs integrations/google-apps-script/Code.gs in a Node vm against in-memory MOCKS of the Google services
// (SpreadsheetApp, MailApp, LockService, CacheService, PropertiesService, ...). This verifies our logic only;
// it does not prove real Google behaviour (quotas, locking across executions, redirects). See GOOGLE-SHEET-SETUP.md.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';

const pad=n=>String(n).padStart(2,'0');
function formatDate(date,zone,format){
 const d=new Date(date.getTime()+(zone==='Asia/Kuwait'?3*3600000:0));
 if(zone!=='UTC'&&zone!=='Asia/Kuwait')throw new Error('mock supports UTC and Asia/Kuwait only');
 return format.replace('yyyy',d.getUTCFullYear()).replace('MM',pad(d.getUTCMonth()+1)).replace('dd',pad(d.getUTCDate())).replace('HH',pad(d.getUTCHours())).replace('mm',pad(d.getUTCMinutes())).replace('ss',pad(d.getUTCSeconds()));
}

export function createScript({secret='s'.repeat(40),notifyEmail='info@planbconsultant.com',spreadsheetId='SHEET123'}={}){
 const config={mailFail:false,quota:100,lockBusy:false,offsetMs:0,secret,notifyEmail,spreadsheetId};
 const state={sheets:new Map(),sent:[],cache:new Map(),lockHeld:false,lockViolations:0,triggers:[]};
 let sheetIds=0;
 const makeSheet=name=>{
  const sheet={name,rows:[],formats:new Map(),id:++sheetIds,
   getLastRow(){return sheet.rows.length},
   getSheetId(){return sheet.id},setFrozenRows(){},
   getRange(r,c,nr=1,nc=1){
    const cells=()=>{const out=[];for(let i=0;i<nr;i++)for(let j=0;j<nc;j++)out.push([r+i,c+j]);return out};
    const api={
     getValues:()=>Array.from({length:nr},(_,i)=>Array.from({length:nc},(_,j)=>sheet.rows[r-1+i]?.[c-1+j]??'')),
     getValue:()=>sheet.rows[r-1]?.[c-1]??'',
     setValues(values){values.forEach((row,i)=>row.forEach((v,j)=>{(sheet.rows[r-1+i]??=[])[c-1+j]=v}));return api},
     setValue(v){(sheet.rows[r-1]??=[])[c-1]=v;return api},
     setNumberFormat(f){cells().forEach(([cr,cc])=>sheet.formats.set(cr+','+cc,f));return api},
     setFontWeight(){return api},setDataValidation(){return api},
     createTextFinder(text){
      const finder={matchEntireCell(){return finder},findNext(){for(const [cr,cc] of cells())if(String(sheet.rows[cr-1]?.[cc-1]??'')===String(text))return {getRow:()=>cr};return null}};
      return finder;
     }
    };
    return api;
   }
  };
  return sheet;
 };
 const hold=()=>{if(state.lockHeld)state.lockViolations++;state.lockHeld=true};
 const context={
  console,JSON,Math,String,Number,Array,Object,RegExp,parseInt,isNaN,Error,
  Date:class extends Date{constructor(...a){a.length?super(...a):super(Date.now()+config.offsetMs)}static now(){return Date.now()+config.offsetMs}},
  Logger:{log(){}},
  PropertiesService:{getScriptProperties:()=>({getProperty:name=>({SHARED_SECRET:config.secret,SPREADSHEET_ID:config.spreadsheetId,NOTIFY_EMAIL:config.notifyEmail})[name]||null})},
  ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this}})},
  LockService:{getScriptLock:()=>({tryLock:()=>{if(config.lockBusy)return false;hold();return true},releaseLock:()=>{if(!state.lockHeld)state.lockViolations++;state.lockHeld=false}})},
  CacheService:{getScriptCache:()=>({get:k=>state.cache.get(k)??null,put:(k,v)=>{state.cache.set(k,v)}})},
  SpreadsheetApp:{openById:()=>({getUrl:()=>'https://docs.google.com/spreadsheets/d/'+config.spreadsheetId+'/edit',getSheetByName:n=>state.sheets.get(n)||null,insertSheet:n=>{const s=makeSheet(n);state.sheets.set(n,s);return s}})},
  MailApp:{getRemainingDailyQuota:()=>config.quota,sendEmail(message){if(config.mailFail)throw new Error('Service failure for info@planbconsultant.com');state.sent.push(message)}},
  Utilities:{DigestAlgorithm:{SHA_256:'SHA_256'},formatDate,computeDigest:(_a,text)=>Array.from(createHash('sha256').update(text).digest(),b=>b>127?b-256:b)},
  ScriptApp:{getProjectTriggers:()=>state.triggers,deleteTrigger:t=>{state.triggers=state.triggers.filter(x=>x!==t)},newTrigger:fn=>({timeBased:()=>({everyMinutes:n=>({create:()=>{state.triggers.push({getHandlerFunction:()=>fn,minutes:n})}})})})}
 };
 vm.createContext(context);
 vm.runInContext(readFileSync(new URL('../integrations/google-apps-script/Code.gs',import.meta.url),'utf8'),context,{filename:'Code.gs'});
 const post=body=>JSON.parse(context.doPost({postData:{contents:typeof body==='string'?body:JSON.stringify(body)}}).text);
 return {context,config,state,post,get:()=>JSON.parse(context.doGet().text),run:name=>context[name](),rows:tab=>{const s=state.sheets.get(tab);return s?s.rows.slice(1):[]},headers:tab=>state.sheets.get(tab)?.rows[0]||[]};
}

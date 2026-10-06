// Regenerates the allow-list block in integrations/google-apps-script/Code.gs from the website data.
// Usage: node scripts/sync-apps-script-lists.mjs          (rewrite)
//        node scripts/sync-apps-script-lists.mjs --check  (exit 1 if Code.gs is out of date)
import {readFileSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
const stub=f=>ts.transpileModule(readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const dataUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const overviewUrl=dataUrl(stub('lib/service-overviews.ts'));
const {services,countries}=await import(dataUrl(stub('lib/content.ts').replace("'./service-overviews'",JSON.stringify(overviewUrl))));
const {programmes}=await import(dataUrl(stub('lib/programmes.ts')));
const obj=(rows)=>'{\n'+rows.map(([k,v])=>`  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n')+'\n}';
const block=`// <generated:lists> (run \`node scripts/sync-apps-script-lists.mjs\` after changing services, programmes or countries)
var SERVICES = ${obj(services.map(s=>[s.slug,s.title||s.name||s.slug]))};
var PROGRAMMES = ${obj(programmes.map(p=>[p.slug,p.title]))};
var DESTINATIONS = ${JSON.stringify(countries.map(c=>c[0]))};
// </generated:lists>`;
const file='integrations/google-apps-script/Code.gs';
const source=readFileSync(file,'utf8');
const next=source.replace(/\/\/ <generated:lists>[\s\S]*?\/\/ <\/generated:lists>/,block);
if(process.argv.includes('--check')){if(next!==source){console.error('Code.gs allow-lists are out of date. Run: node scripts/sync-apps-script-lists.mjs');process.exit(1)}console.log('Code.gs allow-lists are current.')}
else{writeFileSync(file,next);console.log(`Updated allow-lists: ${services.length} services, ${programmes.length} programmes, ${countries.length} destinations.`)}

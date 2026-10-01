import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
export async function loadContent(){
 const modules={};
 for(const name of ['service-overviews','content','programmes','seo']){
  if(!existsSync(`lib/${name}.ts`))continue;
  let code=ts.transpileModule(readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  for(const [dependency,url] of Object.entries(modules)) code=code.replaceAll(`'./${dependency}'`,JSON.stringify(url));
  modules[name]='data:text/javascript;base64,'+Buffer.from(code).toString('base64');
 }
 return {...await import(modules.content),...await import(modules.programmes),...(modules.seo?await import(modules.seo):{})};
}

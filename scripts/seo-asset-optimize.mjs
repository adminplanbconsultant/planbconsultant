import sharp from 'sharp';
import {readdirSync,mkdirSync,statSync,writeFileSync} from 'node:fs';
const output='public/images/optimized';mkdirSync(output,{recursive:true});
const rows=[];
for(const dir of ['public/images/hero','public/images/programmes'])for(const file of readdirSync(dir)){
 if(!/\.(jpg|png)$/.test(file))continue;
 const input=dir+'/'+file,name=file.replace(/\.[^.]+$/,'');
 const metadata=await sharp(input).metadata();const widths=dir.endsWith('hero')?[480,960,1400]:[480,960];
 const variants=[];for(const width of widths){const path=`${output}/${name}-${width}.webp`;await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:82}).toFile(path);variants.push({width,path,bytes:statSync(path).size})}
 rows.push({input,bytes:statSync(input).size,width:metadata.width,height:metadata.height,variants});
}
mkdirSync('artifacts/search-visibility',{recursive:true});writeFileSync('artifacts/search-visibility/image-optimization.json',JSON.stringify(rows,null,2));console.log(JSON.stringify({images:rows.length,originalBytes:rows.reduce((n,r)=>n+r.bytes,0),largestVariantBytes:rows.reduce((n,r)=>n+r.variants.at(-1).bytes,0)},null,2));

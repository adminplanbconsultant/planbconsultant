// Builds favicon.ico, PNG icons and the Apple touch icon from the approved hands/globe crest (plan-b-header-crest-en.png).
// The crest is cropped of its trailing 13px strip, centred on a square ceramic-white canvas and resized; nothing is redrawn.
import sharp from 'sharp';
import {writeFileSync} from 'node:fs';
const source='public/images/plan-b-header-crest-en.png';
const meta=await sharp(source).metadata();
const cropped=await sharp(source).extract({left:0,top:0,width:meta.width,height:756}).toBuffer();
const icon=size=>sharp(cropped).resize(size,size,{fit:'contain',background:'#F4F2EB'}).flatten({background:'#F4F2EB'}).png();
const sizes=[16,32,48,64,128,256];
const frames=[];
for(const size of sizes){
 const png=await icon(size).toBuffer();
 frames.push({size,png});
 if(size===32)writeFileSync('public/images/favicon-32.png',png);
}
await icon(180).toFile('public/images/apple-touch-icon.png');
await icon(192).toFile('public/images/icon-192.png');
await icon(512).toFile('public/images/favicon-512.png');
await icon(512).toFile('public/images/plan-b-crest-512.png');
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
for(const [i,{size,png}] of frames.entries()){
 const at=6+i*16;header[at]=size===256?0:size;header[at+1]=size===256?0:size;
 header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);offset+=png.length;
}
writeFileSync('public/favicon.ico',Buffer.concat([header,...frames.map(f=>f.png)]));
console.log('Generated favicon.ico (6 sizes), favicon-32, icon-192, favicon-512, plan-b-crest-512 and apple-touch-icon from the approved crest.');

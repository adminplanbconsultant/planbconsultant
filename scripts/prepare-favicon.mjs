import sharp from 'sharp';
import {writeFileSync} from 'node:fs';
// Reuse the original approved badge; remove the surrounding full-logo canvas.
const source='public/images/logo.jpg';
const sizes=[16,32,48,64,128,256];
const frames=[];
for(const size of sizes){
 const png=await sharp(source).resize(size,size,{fit:'cover'}).png().toBuffer();
 frames.push({size,png});
 if(size===32)writeFileSync('public/images/favicon-32.png',png);
}
await sharp(source).resize(180,180,{fit:'cover'}).png().toFile('public/images/apple-touch-icon.png');
await sharp(source).resize(512,512,{fit:'cover'}).png().toFile('public/images/favicon-512.png');
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
for(const [i,{size,png}] of frames.entries()){
 const at=6+i*16;header[at]=size===256?0:size;header[at+1]=size===256?0:size;
 header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(png.length,at+8);header.writeUInt32LE(offset,at+12);offset+=png.length;
}
writeFileSync('public/favicon.ico',Buffer.concat([header,...frames.map(f=>f.png)]));
console.log('Original badge fills the favicon canvas; generated six ICO sizes, PNG and Apple touch icon.');

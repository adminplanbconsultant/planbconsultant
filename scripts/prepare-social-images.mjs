// Builds the 1200x630 sharing images (Open Graph / Twitter / WhatsApp) from the approved crest artwork.
// The crest PNGs are only resized and cropped of their trailing 13px strip (stray anti-aliasing / cropped text fragments); nothing is redrawn.
// Output names carry a version so crawlers and WhatsApp see a NEW URL: bump SHARE_VERSION in lib/seo.ts and here together.
import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
const VERSION='v3';
const GREEN='#1C472A',GOLD='#D4AF37',CERAMIC='#F4F2EB';
mkdirSync('public/images/social',{recursive:true});
const copy={
 en:{crest:'public/images/plan-b-header-crest-en.png',eyebrow:'KUWAIT · GLOBAL MOBILITY',l1:'Plan B',l2:'Consultant',tag:'Immigration · Work · Study · Investment',font:'Georgia, serif',body:'Arial, sans-serif',domain:'planbconsultant.com'},
 ar:{crest:'public/images/plan-b-header-crest-ar.png',eyebrow:'الكويت · الانتقال العالمي',l1:'بلان بي',l2:'للاستشارات',tag:'الهجرة · العمل · الدراسة · الاستثمار',font:'Tahoma, Arial, sans-serif',body:'Tahoma, Arial, sans-serif',domain:'planbconsultant.com'}
};
for(const [locale,c] of Object.entries(copy)){
 const ar=locale==='ar';
 const meta=await sharp(c.crest).metadata();
 const crest=await sharp(c.crest).extract({left:0,top:0,width:meta.width,height:756}).resize({height:480}).png().toBuffer();
 const cw=(await sharp(crest).metadata()).width;
 const crestLeft=ar?1200-72-cw:72,textX=ar?1200-72-cw-70:72+cw+70,anchor='start',dir=ar?'direction="rtl"':'';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="${CERAMIC}"/>
 <rect y="598" width="1200" height="32" fill="${GREEN}"/><rect y="594" width="1200" height="4" fill="${GOLD}"/>
 <text x="${textX}" y="150" text-anchor="${anchor}" ${dir} fill="${GREEN}" fill-opacity=".72" font-family="${c.body}" font-size="${ar?28:24}" letter-spacing="${ar?0:4}">${c.eyebrow}</text>
 <rect x="${ar?textX-72:textX}" y="176" width="72" height="4" fill="${GOLD}"/>
 <text x="${textX}" y="278" text-anchor="${anchor}" ${dir} fill="${GREEN}" font-family="${c.font}" font-size="${ar?96:92}" font-weight="700">${c.l1}</text>
 <text x="${textX}" y="372" text-anchor="${anchor}" ${dir} fill="${GREEN}" font-family="${c.font}" font-size="${ar?70:66}">${c.l2}</text>
 <text x="${textX}" y="452" text-anchor="${anchor}" ${dir} fill="${GREEN}" font-family="${c.body}" font-size="${ar?30:28}">${c.tag}</text>
 <text x="${ar?textX-290:textX}" y="540" text-anchor="start" fill="${GREEN}" font-family="Arial, sans-serif" font-size="30" font-weight="700">${c.domain}</text>
 </svg>`;
 await sharp(Buffer.from(svg)).composite([{input:crest,left:crestLeft,top:57}]).jpeg({quality:90,mozjpeg:true}).toFile(`public/images/social/plan-b-share-${VERSION}-${locale}.jpg`);
}
console.log(`Created plan-b-share-${VERSION}-en.jpg and -ar.jpg (1200 x 630).`);

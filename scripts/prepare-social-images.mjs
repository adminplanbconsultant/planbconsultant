import sharp from 'sharp';
import {mkdirSync} from 'node:fs';
mkdirSync('public/images/social',{recursive:true});
const badge=await sharp('public/images/logo.jpg').resize(330,334).png().toBuffer();
for(const locale of ['en','ar']){
 const ar=locale==='ar';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#153f2a"/>
 <rect width="424" height="630" fill="#ffffff"/>
 <rect x="424" width="5" height="630" fill="#c7a65e"/>
 <rect x="48" y="48" width="328" height="534" rx="2" fill="none" stroke="#d9c899"/>
 <path d="M484 92H1136M484 530H1136" stroke="#b79d63" stroke-width="1"/>
 <text x="486" y="133" fill="#d3bc85" font-family="Arial, sans-serif" font-size="19" letter-spacing="3">KUWAIT · GLOBAL MOBILITY</text>
 <text x="480" y="249" fill="#faf7ef" font-family="Georgia, serif" font-size="89">Plan B</text>
 <text x="484" y="315" fill="#faf7ef" font-family="Georgia, serif" font-size="56">Consultant</text>
 <text x="${ar?1134:486}" y="391" text-anchor="start" ${ar?'direction="rtl"':''} fill="#d3bc85" font-family="${ar?'Tahoma, Arial':'Arial'}, sans-serif" font-size="${ar?31:28}">${ar?'حلول عالمية استراتيجية':'Strategic Global Solutions'}</text>
 <text x="${ar?1134:486}" y="446" text-anchor="start" ${ar?'direction="rtl"':''} fill="#e8e9df" font-family="Tahoma, Arial, sans-serif" font-size="${ar?23:22}">${ar?'الهجرة · العمل · الدراسة · الاستثمار':'Immigration · Work · Study · Investment'}</text>
 <text x="486" y="574" fill="#e8e9df" font-family="Arial, sans-serif" font-size="23">planbconsultant.com</text>
 <circle cx="1124" cy="566" r="4" fill="#c7a65e"/>
 </svg>`;
 await sharp(Buffer.from(svg)).composite([{input:badge,left:47,top:140}]).jpeg({quality:92,mozjpeg:true}).toFile(`public/images/social/plan-b-share-${locale}.jpg`);
}
console.log('Created English and Arabic social sharing images, 1200 × 630 JPEG.');

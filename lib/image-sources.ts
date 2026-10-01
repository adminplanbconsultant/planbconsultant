export function imageSources(src:string){
 if(!src.startsWith('/images/hero/')&&!src.startsWith('/images/programmes/'))return {src};
 const name=src.split('/').at(-1)!.replace(/\.[^.]+$/,'');
 const widths=src.startsWith('/images/hero/')?[480,960,1400]:[480,960];
 return {src:`/images/optimized/${name}-960.webp`,srcSet:widths.map(w=>`/images/optimized/${name}-${w}.webp ${w}w`).join(', '),sizes:'(max-width: 760px) 100vw, 55vw'};
}

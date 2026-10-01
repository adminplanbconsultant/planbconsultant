import {programmes} from '@/lib/programmes';
import type {MetadataRoute} from 'next';
import {origin,services,countries,guides,slugify} from '@/lib/content';
export default function sitemap():MetadataRoute.Sitemap{
 if(process.env.NEXT_PUBLIC_ALLOW_INDEXING!=='true')return [];
 const paths=['programmes',...programmes.map(p=>'programmes/'+p.slug),'','about','services','destinations','resources','consultation','contact','privacy','faqs',...services.map(s=>'services/'+s.slug),...countries.map(c=>'destinations/'+slugify(c[0])),...guides.map(g=>'resources/'+g.slug)];
 return ['en','ar'].flatMap(locale=>paths.map(p=>({url:origin+'/'+locale+(p?'/'+p:''),alternates:{languages:{en:origin+'/en'+(p?'/'+p:''),ar:origin+'/ar'+(p?'/'+p:'')}}})));
}

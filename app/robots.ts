import type {MetadataRoute} from 'next';
import {origin} from '@/lib/content';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',...(process.env.NEXT_PUBLIC_ALLOW_INDEXING==='true'?{allow:'/',disallow:'/api/'}:{disallow:'/'})},sitemap:origin+'/sitemap.xml'}}

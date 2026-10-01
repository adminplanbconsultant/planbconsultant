import type {MetadataRoute} from 'next';
import {origin} from '@/lib/content';
import {indexablePaths,indexingEnabled} from '@/lib/seo';
export default function sitemap():MetadataRoute.Sitemap{return indexingEnabled?['en','ar'].flatMap(locale=>indexablePaths.map(path=>({url:origin+'/'+locale+(path?'/'+path:''),alternates:{languages:{en:origin+'/en'+(path?'/'+path:''),ar:origin+'/ar'+(path?'/'+path:'')}}}))):[];}

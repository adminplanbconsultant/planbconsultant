import {notFound} from 'next/navigation';
import Site from '@/components/site';
import {routePaths,pageMetadata,entityGraph} from '@/lib/seo';
import type {Locale} from '@/lib/content';
type Props={params:Promise<{locale:string,path?:string[]}>};
export const dynamicParams=false;
export function generateStaticParams(){return ['en','ar'].flatMap(locale=>routePaths.map(path=>({locale,path:path?path.split('/'):[]})));}
async function resolve({params}:Props){const {locale,path=[]}=await params;if(!['en','ar'].includes(locale)||!routePaths.includes(path.join('/')))notFound();return {locale:locale as Locale,path};}
export async function generateMetadata(props:Props){const {locale,path}=await resolve(props);return pageMetadata(locale,path.join('/'));}
export default async function Page(props:Props){const {locale,path}=await resolve(props);return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(entityGraph(locale,path.join('/'))).replace(/</g,'\\u003c')}}/><Site locale={locale} path={path}/></>;}

import type {Metadata} from 'next';
import {siteIcons} from '@/lib/site-icons';
import '../globals.css';
export const metadata:Metadata={icons:siteIcons,verification:{google:process.env.GOOGLE_SITE_VERIFICATION||undefined,other:process.env.BING_SITE_VERIFICATION?{'msvalidate.01':process.env.BING_SITE_VERIFICATION}:{}},robots:{index:false,follow:true}};
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;return <html lang={locale==='ar'?'ar':'en'} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>;}

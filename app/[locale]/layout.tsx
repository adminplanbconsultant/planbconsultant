import type {Metadata} from 'next';
import {siteIcons} from '@/lib/site-icons';
import {siteVerification} from '@/lib/seo';
import '../globals.css';
export const metadata:Metadata={icons:siteIcons,verification:siteVerification,robots:{index:false,follow:true}};
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;return <html lang={locale==='ar'?'ar':'en'} dir={locale==='ar'?'rtl':'ltr'}><body>{children}</body></html>;}

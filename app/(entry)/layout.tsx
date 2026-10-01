import '../globals.css';
import type {Metadata} from 'next';
import {pageMetadata} from '@/lib/seo';
import {siteIcons} from '@/lib/site-icons';
export const metadata:Metadata={...pageMetadata('en',''),icons:siteIcons};
export default function EntryLayout({children}:{children:React.ReactNode}){return <html lang="en" dir="ltr"><body>{children}</body></html>;}

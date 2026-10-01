import type { Metadata } from 'next';
import './globals.css';
import {origin} from '@/lib/content';
export const metadata:Metadata={title:'Plan B Consultant | Your next chapter',description:'Immigration, visa and overseas career guidance from Kuwait.',icons:{icon:'/images/plan-b-logo.png'},robots:{index:process.env.NEXT_PUBLIC_ALLOW_INDEXING==='true',follow:process.env.NEXT_PUBLIC_ALLOW_INDEXING==='true'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'Organization',name:'Plan B Consultant',url:origin,logo:origin+'/images/plan-b-logo.png',description:'Kuwait-based immigration, visa and global mobility guidance.'}).replace(/</g,'\\u003c')}}/>{children}</body></html>}

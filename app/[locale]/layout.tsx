import type {Metadata} from 'next';
import {siteIcons} from '@/lib/site-icons';
import {siteVerification} from '@/lib/seo';
import {splashCss,splashHeadScript,splashStartScript,splashLockScript} from '@/lib/splash';
import SplashScreen from '@/components/splash-screen';
import '../globals.css';
export const metadata:Metadata={icons:siteIcons,verification:siteVerification,robots:{index:false,follow:true}};
export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){
 const {locale}=await params;const l=locale==='ar'?'ar':'en';
 return <html lang={l} dir={l==='ar'?'rtl':'ltr'} suppressHydrationWarning>
  <head>
   <style dangerouslySetInnerHTML={{__html:splashCss}}/>
   <link rel="preload" as="image" href={`/images/optimized/crest-${l}-960.webp`} imageSrcSet={`/images/optimized/crest-${l}-480.webp 480w, /images/optimized/crest-${l}-960.webp 960w`} imageSizes="(max-width: 650px) 250px, 320px" fetchPriority="high"/>
   <script dangerouslySetInnerHTML={{__html:splashHeadScript}}/>
   <noscript><style dangerouslySetInnerHTML={{__html:'.brand-splash{display:none!important}'}}/></noscript>
  </head>
  <body>
   <SplashScreen locale={l}/>
   <script dangerouslySetInnerHTML={{__html:splashStartScript}}/>
   <div id="app-root">{children}</div>
   <script dangerouslySetInnerHTML={{__html:splashLockScript}}/>
  </body>
 </html>;
}

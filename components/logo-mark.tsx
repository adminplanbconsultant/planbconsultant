import type {Locale} from '@/lib/content';
/** Display the approved language-specific artwork; hide only the external tagline. */
export default function LogoMark({locale='en',footer=false}:{locale?:Locale;footer?:boolean}){
 return <svg className={'brand-mark'+(footer?' footer-crest':'')} viewBox="437 12 826 775" width="826" height="775" overflow="hidden" role="img" aria-label={locale==='ar'?'شعار بلان بي للاستشارات':'Plan B Consultant crest'} focusable="false"><image href={'/images/plan-b-logo-'+locale+'.png'} x="0" y="0" width="1699" height="926"/></svg>;
}

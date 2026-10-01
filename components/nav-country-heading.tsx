import {text,type Locale} from '@/lib/content';
export default function NavCountryHeading({country,locale}:{country:{en:string;ar:string;code?:string};locale:Locale}){
 return <>{country.code&&<span className="nav-code nav-country-flag" aria-hidden="true"><img src={`/images/flags/${country.code.toLowerCase()}.svg`} width={30} height={20} alt="" decoding="async"/></span>}{text(locale,country.en,country.ar)}</>;
}

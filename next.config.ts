import type {NextConfig} from 'next';
const config:NextConfig={poweredByHeader:false,devIndicators:false,trailingSlash:false,async headers(){return process.env.NEXT_PUBLIC_ALLOW_INDEXING!=='true'||process.env.VERCEL_ENV==='preview'?[{source:'/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, follow'}]}]:[]}};
export default config;

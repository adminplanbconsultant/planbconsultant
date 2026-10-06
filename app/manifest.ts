import type {MetadataRoute} from 'next';
export default function manifest():MetadataRoute.Manifest{
 return {name:'Plan B Consultant',short_name:'Plan B',description:'Immigration, work, study, visit and investment guidance from Kuwait.',start_url:'/en',scope:'/',display:'browser',background_color:'#F4F2EB',theme_color:'#1C472A',icons:[{src:'/images/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/images/plan-b-crest-512.png',sizes:'512x512',type:'image/png'}]};
}

'use client';
import {useEffect,useState} from 'react';

/** Renders the build-time year in the HTML and switches to the visitor's current year after hydration, so a static page never shows a stale year. */
export default function CurrentYear({initial}:{initial:number}){
 const [year,setYear]=useState(initial);
 useEffect(()=>setYear(new Date().getFullYear()),[]);
 return <>{year}</>;
}

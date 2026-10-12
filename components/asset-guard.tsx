'use client';
import {useEffect} from 'react';

/**
 * Casual-copy deterrents for brand artwork and photographs. These are speed bumps, NOT security: anyone can still save
 * what the browser displays (screenshots, developer tools, view-source). Deliberately narrow:
 *  - no keyboard shortcut interception, no developer-tools blocking, no print blocking, no text-selection blocking of content;
 *  - the context menu is suppressed only on brand logos and editorial photographs, and never on links, form controls or text;
 *  - native image dragging is disabled everywhere (it only affects dragging images out of the page).
 * Images that sit inside a link keep their menu so "open in new tab", "copy link" and long-press link actions keep working.
 */
const PROTECTED=[
 '.brand-splash','.brand-mark','.footer-crest','.header-logo-artwork','.splash-emblem',
 '.programme-hero-media','.programme-story-media','.programme-benefit-image','.home-hero-slide','.about-destination-photo',
 '.destination-picker-grid','[data-protect]'
].join(',');
const KEEP='a[href],input,textarea,select,button,label,[contenteditable],[role=link],[role=button]';

export default function AssetGuard(){
 useEffect(()=>{
  const target=(e:Event)=>e.target instanceof Element?e.target:null;
  const onDrag=(e:DragEvent)=>{const t=target(e);if(t&&t.closest('img,svg.brand-mark,svg.brand-mark *'))e.preventDefault()};
  const onMenu=(e:MouseEvent)=>{const t=target(e);if(!t||t.closest(KEEP))return;if(t.closest(PROTECTED)&&t.closest('img,svg,figure,picture'))e.preventDefault()};
  document.addEventListener('dragstart',onDrag);
  document.addEventListener('contextmenu',onMenu);
  return()=>{document.removeEventListener('dragstart',onDrag);document.removeEventListener('contextmenu',onMenu)};
 },[]);
 return null;
}

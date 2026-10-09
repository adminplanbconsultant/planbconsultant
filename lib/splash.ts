/**
 * Splash screen: critical CSS and the tiny inline scripts that drive it. These are rendered by app/[locale]/layout.tsx
 * into the initial HTML, so the splash is in the first paint and its timing never waits for React, hydration or any image.
 *
 * html[data-splash] states (set only by script, so a visitor without JavaScript is never locked or covered):
 *   active  -> splash covers the page, page is inert, scrolling locked
 *   leaving -> splash fades out over the already-ready page (page interactive again after "done")
 *   done    -> splash removed; 'planb:splash-done' fired (other features, e.g. the assessment popup, wait for it)
 * Timing matches the approved design: visible 2.5 s in total (fade starts at 2.05 s); 0.9 s with reduced motion.
 */
export const splashCss=`
.brand-splash{position:fixed;inset:0;z-index:100000;display:grid;place-items:center;background:radial-gradient(ellipse at center,#fbfaf5 0%,#f4f2eb 72%);min-height:100vh;min-height:100dvh;overflow:hidden}
html[data-splash=active],html[data-splash=active] body,html[data-splash=leaving],html[data-splash=leaving] body{overflow:hidden}
html[data-splash=leaving] .brand-splash{animation:splash-fade .45s ease forwards;pointer-events:none}
html[data-splash=done] .brand-splash{display:none}
@keyframes splash-fade{to{opacity:0;visibility:hidden}}
@media(prefers-reduced-motion:reduce){html[data-splash=leaving] .brand-splash{animation:none;opacity:0}}
`;

/** Runs in <head> before first paint: marks the splash active and arms a failsafe so initialisation failure can never trap a visitor. */
export const splashHeadScript=`(function(){var d=document.documentElement,w=window,reduce=false,fin=false;
try{reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
function app(v){var a=document.getElementById('app-root');if(a){if(v){a.setAttribute('inert','')}else{a.removeAttribute('inert')}}}
function leave(){if(d.getAttribute('data-splash')==='active')d.setAttribute('data-splash','leaving')}
function done(){if(fin)return;fin=true;d.setAttribute('data-splash','done');app(false);try{w.dispatchEvent(new Event('planb:splash-done'))}catch(e){}}
var started=false;
function lock(){if(d.getAttribute('data-splash')==='active')app(true)}
function start(){if(started)return;started=true;setTimeout(leave,reduce?650:2050);setTimeout(done,reduce?900:2500)}
d.setAttribute('data-splash','active');
w.__planbSplash={start:start,lock:lock,skip:function(){leave();setTimeout(done,reduce?0:200)}};
setTimeout(function(){leave();done()},6500);
})();`;

/** Runs immediately after the splash markup: the visible-time clock starts when the splash can first be seen. */
export const splashStartScript=`window.__planbSplash&&window.__planbSplash.start();`;
/** Runs after the app root has been parsed: makes the page inert (no focus, clicks or assistive-technology access) while the splash is active. */
export const splashLockScript=`window.__planbSplash&&window.__planbSplash.lock();`;

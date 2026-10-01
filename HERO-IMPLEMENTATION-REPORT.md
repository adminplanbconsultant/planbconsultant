# Homepage hero update — 1 October 2026

The homepage hero now uses the requested English copy and natural Arabic equivalents, a deliberate two-line headline on wide desktop screens, forest-green primary consultation CTA, supporting guidance text, and a compact service line. The hero remains form-free. The primary action links to the existing full assessment at `/en/consultation` or `/ar/consultation`; the secondary action links to the existing programme overview.

The arched destination image cycles through authentic Toronto, Sydney, and Berlin photography. Only photographs and their matching location labels crossfade (800ms, approximately seven seconds per slide). Copy and CTAs remain stationary. Manual selectors have 44px targets, named labels, and selected states. Manual selection pauses autoplay; play resumes it. Keyboard focus and a hidden tab pause rotation. Reduced-motion preferences disable autoplay and crossfades while retaining manual selection.

The first image has a high-priority image preload. Later slides mount after one second with low fetch priority, so their downloads do not compete with the first render. Rotation waits for the next photograph to load. Fixed image geometry prevents slide changes from shifting the layout.

A thin offset gold outline, soft shadow, local label gradient, and one small curved journey line with aircraft provide detail without extra floating cards. On mobile the copy, both actions, and guidance precede the shorter image. The floating WhatsApp control is hidden while the mobile hero is visible, and returns beyond it. The existing country ticker remains outside the hero.

Scope: `components/home-hero.tsx`, its import in `components/site.tsx`, scoped hero CSS in `app/globals.css`, three new hero photographs, QA scripts, and review artifacts. The approved header, navigation, splash screen, assessment popup implementation, other homepage content, and programme pages were preserved. No production deployment was performed.

## Automated validation

- `npm.cmd run build`: passed, including TypeScript compilation.
- English and Arabic at 360, 390, 768, 1024, 1280, 1440, and 1920px: 14 layout cases passed. No horizontal overflow, clipping, hero form, unloaded photograph, or hero/header overlap was detected. Layout checks use a 900px viewport height.
- 14 interaction checks passed: focused-control pause; explicit pause; both later slides and labels; stationary headline; seven-second play/resume; hidden-tab pause; reduced-motion autoplay/transition suppression; reduced-motion manual selection; both full-assessment pages; no unexpected layout shift; original scroll assessment popup; Escape dismissal.
- Raw results: `artifacts/home-hero/after-results.json` and `artifacts/home-hero/interaction-results.json`.

## Visual review and previews

English and Arabic screenshots were inspected for headline wrapping, RTL order, CTA balance, landmark crops, labels, image outlines, mobile ordering, and control placement. All three destination photographs were reviewed in the actual arch. Browser captures are local-preview evidence, not screenshots of a deployment.

- Review gallery: `artifacts/home-hero/index.html`.
- Desktop before/after: `comparison-en-1440.png`, `comparison-ar-1440.png`.
- Mobile before/after viewport comparisons: `comparison-en-390.png`, `comparison-ar-390.png`.
- Complete updated mobile heroes: `after-en-390.png`, `after-ar-390.png`. These use a taller screenshot viewport to show the full hero without the fixed bottom contact bar cutting across the long-page preview; phone layout checks use 900px height.
- Photograph credits, original source URLs, and licenses: [HERO-IMAGE-SOURCES.md](HERO-IMAGE-SOURCES.md).

Form delivery still depends on the existing backend configuration and deployment environment; this visual update does not make a new production-readiness claim.

## Focused hero refinement

The image and gold outline now have 14px bottom corners. Three equal, evenly spaced dots remain centred beneath the arch. Pause/resume is visually hidden in the default layout and appears as a labelled rectangular control when it receives keyboard focus, without shifting the image or other content. Autoplay pauses for focus anywhere within the carousel, including a defensive check of the active element on each timer tick.

The eyebrow, guidance labels, and service line now use 12–13px text with stronger contrast and natural mobile wrapping. The approved headline, paragraph, CTA arrangement, photographs, crops, and location labels are unchanged.

Fresh English/Arabic screenshots at 390px and 1440px, both default and focused, are in `artifacts/hero-refinement/`. Automated results in `results.json` verify hidden/default and visible/focused control states, centred and equal indicator spacing, text sizes, 14px corners, no overflow, and no focus-induced layout shift. The build and existing interaction regression suite were rerun for this refinement.

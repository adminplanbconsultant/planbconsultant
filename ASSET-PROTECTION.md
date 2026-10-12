# Asset protection — what it does, and what it cannot do

Reviewed 12 October 2026. Nothing was deployed.

**Honest summary.** Anything a browser can display can be saved: screenshots, "Save as", developer tools, view-source, a script that fetches the page. Nothing here prevents that. The measures below (a) keep high-resolution originals and editable artwork off the public web, (b) put small speed bumps in front of casual copying, (c) stop other websites from embedding your images directly, and (d) state ownership clearly. They are deterrents and housekeeping, not security.

## 1. Protected for real: originals are no longer published

`public/` is what gets served. It went from **35 MB / 77 files to 7.6 MB / 57 files**. Full-size and editable files moved to `source-assets/` (not served, listed in `.vercelignore`, Git-tracked unless you choose otherwise):

| Moved out of `public/` | Why it was public | Now |
|---|---|---|
| 7 AI-generated scene PNGs, ~2.1 MB each (`programmes/*.png`) | Source images for the optimised WebP versions; never requested by pages | `source-assets/originals/programmes/` (the displayed `/images/optimized/*.webp` remain) |
| 3 hero JPEG originals (`hero/*.jpg`) | Source for the optimised WebP versions | `source-assets/originals/hero/` |
| `plan-b-logo-en/ar.png` (2.2–2.5 MB masters) | Footer logo lockup | masters in `source-assets/originals/logos/`; the site now serves `optimized/plan-b-logo-{en,ar}.webp` (145 KB, same pixels, same artwork) |
| `plan-b-logo.png`, `plan-b-header-en/ar.png` (1.1–2.2 MB) | Unused duplicates / unused lockups | `source-assets/unused/` |
| `favicon-512.png` (duplicate), 3 Next.js template SVGs, `fonts/README.md`, unreferenced `business-advisory` WebPs | Leftovers | `source-assets/unused/` or `notes/` |

Displayed photographs were recompressed in place under the same file names (max 1400 px wide, progressive JPEG), e.g. `destinations/portugal.jpg` 1152 KB → 583 KB; the full-size originals are in `source-assets/originals/destinations/`. Visual crop and design are unchanged.

Still published on purpose: the displayed optimised images, the approved header crest PNG, social-share images, favicons/app icons, the web manifest, flag SVGs, the Google/Bing verification (Bing tag is in the HTML; there is no verification file), and the font files (see "Open items").

Not in the deployed output at all: `artifacts/`, `tmp/`, the dated `.zip` backups (now also in `.gitignore` and `.vercelignore`). Git-based Vercel deploys publish only `public/` and the build, so root-level files were never served; `.vercelignore` additionally protects `vercel deploy` from the CLI. **If the Git repository is public, `source-assets/` is public too: keep the repository private, or add `source-assets/` to `.gitignore` and store the masters elsewhere.**

## 2. Deterrents only (speed bumps)

`components/asset-guard.tsx` + a small block at the end of `app/globals.css`:

* **Native dragging disabled** for all `<img>` and the footer logo SVG (CSS `user-drag:none` plus a `dragstart` handler for Firefox).
* **Right-click menu suppressed only** on brand logos, the splash emblem and editorial photographs (programme hero/story/benefit images, home hero slides, About photo). It is **not** suppressed on links, buttons, form fields, text, or on any image inside a link (the header logo, card photos): suppressing it there would remove "open in new tab" and link long-press actions.
* **iOS long-press callout** disabled on those same images.
* **Text selection disabled only** on brand artwork (logo, splash, header wordmark, tagline) — never on content.
* **Not done on purpose:** no keyboard-shortcut interception (Ctrl+C/S/P/U/F12 untouched), no developer-tools detection, no print blocking, no text-as-image or canvas, no disabling of selection on pages. Body text, headings, lists, contact details, programme information, form fields and enquiry references remain selectable and copyable; browser translation and screen readers are unaffected (images keep their existing alt text).

What these do not stop: screenshots, "Save page as", developer tools / network tab, view-source, `curl`, browser extensions, long-press save on some mobile browsers for linked images, and copying visible text.

## 3. Hotlink protection (implemented, locally verified, **not yet verified on Vercel**)

*Assessment.* Vercel offers no turnkey Referer-based hotlink switch. The rule is implemented in `next.config.ts` as a Referer-conditioned rewrite to `app/api/hotlink-blocked/route.ts` (a plain, non-cacheable 403). Vercel's Firewall custom rules could do similar blocking, but rule counts and header-matching availability depend on your plan, so it was not used.

*Behaviour.* A request for a protected image gets **403 only if the Referer header names a foreign site**. Everything else is served normally:

* Allowed: no Referer at all (direct visits, bookmarks, crawlers incl. Googlebot-Image, **WhatsApp/Facebook/X link-preview fetchers**, privacy browsers), `planbconsultant.com` and subdomains, `planbconsultant*.vercel.app` previews, `localhost`/`127.0.0.1`, Google/Bing/DuckDuckGo/Yahoo/Yandex/Ecosia/Brave, Facebook/Instagram/WhatsApp/X/LinkedIn/TikTok.
* Protected groups: `/images/optimized/*`, `/images/destinations/*`, `/images/destination-N.jpg`, `/images/plan-b-header-crest-{en,ar}.png`.
* **Never protected:** `/images/social/*` (Open Graph/Twitter/WhatsApp cards), `favicon.ico`, `favicon-32`, `apple-touch-icon`, `icon-192`, `plan-b-crest-512` (Organization logo), `manifest.webmanifest`, flags, pages, sitemap, robots.

Verified with `node scripts/hotlink-test.mjs` (55 checks on a local production server): the allowed and blocked referers above, look-alike domains (`planbconsultant.com.evil.com`, `evilplanbconsultant.com`, `google.evil.example`, other `*.vercel.app`) are blocked, exempt paths stay 200 with a hostile referer, 403s are `no-store`, and WhatsApp/Googlebot-Image user agents fetch protected images with 200. Pages displayed on the real site load all images (112-check browser run).

*Limitations.* The Referer header is trivially spoofable and many tools omit it, so this only stops other websites from linking your files directly (and burning your bandwidth). Browsers or extensions that send a foreign-looking Referer from an unlisted legitimate embed (e.g. a partner site) would see 403: add the partner to `allowedReferers` in `next.config.ts`. A Vercel CDN edge cache or intermediate proxy could in principle ignore the rule for already-cached copies; this was not observable locally. Kill switch: set `HOTLINK_PROTECTION=off` at build time and redeploy.

**After deploying, run these once** (should print 200, 403, 200, 200):
```
curl -s -o /dev/null -w "%{http_code}\n" https://planbconsultant.com/images/optimized/toronto-960.webp
curl -s -o /dev/null -w "%{http_code}\n" -H "Referer: https://evil.example/" https://planbconsultant.com/images/optimized/toronto-960.webp
curl -s -o /dev/null -w "%{http_code}\n" -H "Referer: https://evil.example/" https://planbconsultant.com/images/social/plan-b-share-v3-en.jpg
curl -s -o /dev/null -w "%{http_code}\n" -H "Referer: https://planbconsultant.com/en" https://planbconsultant.com/images/optimized/toronto-960.webp
```
Then paste a page link into WhatsApp and the Facebook Sharing Debugger to confirm the preview image still loads. If the second command returns 200 on Vercel, the rule is not active at the edge: tell me and I will adjust (do not rely on it).

## 4. Ownership information

* **Footer:** "© [current year] Plan B Consultant. All rights reserved." (English and Arabic). The year was already dynamic at build time; it now also updates in the browser so a page built in December does not show a stale year in January.
* **Asset-use notice:** new bilingual section "Website content and asset use / استخدام محتوى الموقع وأصوله" on the existing privacy page (`/en/privacy`, `/ar/privacy`): text, branding, logo and original imagery may not be copied, republished, adapted or used commercially without written permission, subject to applicable law; it explicitly does **not** claim third-party material — Unsplash destination photographs, open-source country-flag icons and AI-generated illustrative scenes (as recorded in `ASSET-SOURCES.json`) — and gives the contact email for permission requests or reports. It is a notice, not legal advice: have a lawyer review it, and confirm the Unsplash/flag/AI-image terms you rely on.
* **No watermarks were applied.** The approved logo is unmodified. If you want watermarked photographs, I can produce a preview of one or two images for approval before anything is applied site-wide.

## 5. Verification (local production build)

`npm run build` and `npm run typecheck` pass. `node scripts/asset-protection-qa.mjs` — **112 checks** in real Chrome, English/Arabic × desktop/mobile: all images load, logos display, drag and context-menu behaviour exactly as described, text/contact/form selectability, keyboard Tab and no shortcut interception, scrolling, footer copyright and asset-use notice. Regression runs unchanged: SEO audit (168 pages, 86 indexable = 86 sitemap URLs, 0 issues; canonicals, hreflang, JSON-LD and social tags intact), smoke test, splash filmstrip test, popup suite (61/61), enquiry forms (40/40; Google Sheets integration untouched).

## 6. Open items and remaining limitations

* **Fonts:** `public/fonts/ZTTalk-*.woff2` (8 files) are published and loaded by `tokens.css`, but `fonts/README.md` said ZT Talk was *not* bundled pending a commercial licence. Webfonts must be downloadable by browsers, so they cannot be hidden. Please confirm you hold a licence that covers web use; if not, remove the `@font-face` rules and files.
* Public content remains copyable by design (screenshots, devtools, scraping). The only strong protections are legal (copyright, takedown requests) and not publishing masters.
* To regenerate derived files (`/images/optimized/*`, favicons, social cards): `node scripts/seo-asset-optimize.mjs`, `scripts/prepare-favicon.mjs`, `scripts/prepare-social-images.mjs` — they read from `source-assets/originals/` or the published crest.
* `ASSET-SOURCES.json`, `HERO-IMAGE-SOURCES.md` and `PROGRAMME-PAGES-HANDOVER.md` now point at `source-assets/…` for moved files.

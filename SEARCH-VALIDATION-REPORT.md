# Search validation — 2 October 2026

## Implemented and locally verified

Production Next.js 16.3.4 webpack build and TypeScript checks passed after the code changes. The existing Vercel/App Router framework and enquiry API remain in place. Smoke tests fetched all 168 bilingual pages and checked invalid paths, the logo, API input/origin/body validation and the honest 503 response when database storage is unconfigured.

| Evidence | Result |
|---|---|
| Route registry enumeration | 84 unique content paths × 2 languages = 168 |
| Prerender manifest, counted independently | 168 localized generated routes |
| HTTP census of generated content pages | 168 successful responses |
| Production-indexing metadata | 86 indexable; 82 explicitly noindex |
| Production XML sitemap | 86 entries; matching English/Arabic alternates |
| Staging / Vercel preview | 0 indexable; empty sitemap; noindex metadata and header |
| Metadata | No duplicate titles or descriptions across the 168 pages |
| Headings | Exactly one H1 per successful page; H1/H2/H3 inventory saved |
| Canonicals | Absolute production self-canonicals, no query/trailing slash |
| Hreflang | Reciprocal `en` / `ar`; correct localized counterparts; no invented fallback |
| HTML | Correct language and LTR/RTL in initial server HTML |
| Root / trailing slash | Direct 308 to `/en`; `/en/` 308 to `/en` |
| Missing paths | Real 404 for unknown page, locale, program and excessive path depth |
| Internal links | All distinct server-rendered local link targets returned successfully |
| JSON-LD | 168 graphs passed local syntax, required-property, ID/reference and visible-content checks |
| Conversion payload privacy | Runtime test confirms only event, language and valid step are emitted |
| Images | 38 served image assets / derivatives and responsive hero preload passed |

The difference between generated/indexable counts is deliberate: 40 unsupported/thin country overviews × 2 languages, plus the generic citizenship-program page × 2 languages. Those routes remain navigable and self-canonical. Only the six documented destination overviews enter the sitemap. APIs, root redirects, framework errors and metadata endpoints are not counted as content pages.

The final local `.next` build is the verified preview/noindex configuration. The production-indexing build was also checked separately and saved in `production-inventory.json`; preview results are in `preview-inventory.json`. No environment file containing credentials was created or changed. The framework logged `NoFallbackError` while serving ungenerated-path tests under `dynamicParams=false`; the observed HTTP responses were real 404s and those paths are excluded from generation and the sitemap.

`scripts/seo-audit.mjs` records the full HTML-derived inventory. `scripts/seo-validate.mjs` checks schema references, content agreement, sitemap-set equality, reciprocal language links and conversion privacy. `scripts/seo-assets-check.mjs` checks served image derivatives and responsive preload. These are local checks, not a submitted search-engine or rich-result certification. No FAQ rich-result claim is made.

## Laboratory performance

Environment: Windows, Node v24.19.0, Next.js production server on localhost:3100; no browser/device/network throttling. Five warm HTTP runs after one warmup for each representative page. Content is fully downloaded for each run. Assets are counted from HTML script requests; gzip byte figures are locally computed, not an assertion about production transport configuration.

| Page | Median response headers | Median complete HTML | HTML bytes | Requested JS, gzip estimate |
|---|---:|---:|---:|---:|
| `/en` | 12.81 ms | 15.74 ms | 125,028 | 248,843 |
| `/ar` | 13.63 ms | 15.10 ms | 131,069 | 248,843 |
| `/en/programmes/canada-express-entry` | 13.70 ms | 14.77 ms | 95,244 | 248,843 |
| `/ar/programmes/germany-nursing` | 13.33 ms | 14.46 ms | 100,421 | 248,843 |
| `/en/contact` | 14.57 ms | 15.19 ms | 48,044 | 248,843 |

The server-content split reduced the shared requested JavaScript gzip estimate from 289,194 bytes in the intermediate SEO build to 248,843 bytes (40,351 bytes, approximately 14%). HTML grew as server-rendered child markup moved through React's server payload; this is a measured asset tradeoff, not a claim of a better Lighthouse score. Both measurements used the same local measurement script/environment; the earlier value is an intermediate-build measurement, not the initial baseline.

Ten hero/program images totalled 16,468,929 original bytes. Their largest responsive WebP variants total 1,289,624 bytes, approximately 92% less. Mobile widths have smaller variants. Originals remain as source assets. The sum compares image encoding choices, not total page transfer or a visual-quality score. Sources, widths and individual byte figures are recorded in `image-optimization.json`.

Fonts are locally bundled; existing CSS uses font-display behavior. Image dimensions and lazy/deferred noninitial slides are retained, as are pause/focus/reduced-motion behaviors. Primary content is in the response before hydration; the splash does not postpone its delivery. The approved splash and popup timers were preserved.

## Production findings and outstanding checks

Read-only production HTTP checks found a Namecheap Parking Page at the domain root, and 404 on both language roots, robots and sitemap. Public hosting must eventually be activated through the authorized deployment process; no deployment occurred here.

The computer-use runtime returned no enabled browser surfaces. Browser visual regression, mobile obstruction checks, Lighthouse, LCP, CLS and INP could not be measured. No real-user Core Web Vitals or search account metrics were available. Those checks remain outstanding before release; the HTTP/asset lab measurements above do not replace them.

USCIS's current EB-5 policy manual could not be retrieved. Financial/legal specifics and any standalone EB-5/E-2 guide need current authoritative verification before publication. Existing cautious copy and official links remain; no investment amount was invented or copied from stale results.

Client gaps: office/meeting eligibility, address, hours, confirmed adviser credentials, reconfirmed monitored contacts, LinkedIn/Facebook URLs, search verification tokens and any approved analytics/consent setup. Database/notification configuration is still required to verify real saved-enquiry success end to end; failure behavior was verified without credentials. Directory placements and outreach are planned and unsent.

No external submissions, account creation, production publishing or outreach took place. Review the [handover](SEARCH-VISIBILITY-HANDOVER.md), [source ledger](SOURCE-REVIEW-LEDGER.md) and [authority plan](BACKLINK-OPPORTUNITY-PLAN.md) for implementation decisions and next actions.

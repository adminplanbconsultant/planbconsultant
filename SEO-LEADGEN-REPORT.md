# SEO, sharing-preview and lead-generation report — 6 October 2026

Builds on `SEARCH-VISIBILITY-HANDOVER.md` and `SEARCH-VALIDATION-REPORT.md` (2 October). Nothing was deployed, no DNS or Search Console change was made, no outreach or external message was sent. Status words are used strictly:

* **Implemented** = in the repository.
* **Locally verified** = checked against a local production build (`next start`), crawler-style (plain HTTP, no JavaScript).
* **Live verified** = checked on https://planbconsultant.com / www on 6 October 2026. Only the "Live findings" section is live-verified.
* **Pending** = needs deployment, your accounts, or the client.

Search rankings, indexing and AI-answer inclusion are not guaranteed by anything here.

## 1. Live findings (6 October 2026, read-only HTTP)

| Finding | Evidence | Action |
|---|---|---|
| **Host mismatch (high):** `https://planbconsultant.com/*` answers `308 → https://www.planbconsultant.com/*`, but every canonical, hreflang, Open Graph URL, JSON-LD id and sitemap URL says the apex `planbconsultant.com`. Canonicals therefore point at a URL that redirects away. | `curl -I` on `/`, `/en`, `/robots.txt`, `/sitemap.xml` all returned 308 with `Location: https://www…` | In Vercel → Project → Domains make `planbconsultant.com` the primary domain and redirect `www` → apex (the opposite of today). No code change; do not add a second redirect in code (it would loop). Re-check after changing. |
| Site is deliberately not indexable yet | Live HTML has `<meta name="robots" content="noindex, follow">`, header `X-Robots-Tag: noindex, follow`, and `/sitemap.xml` is an empty `<urlset>` | Expected while `NEXT_PUBLIC_ALLOW_INDEXING` is not `true`. Set it to `true` for the Production environment only when launch is approved, then redeploy. |
| **Old logo in sharing previews (fixed in code, not yet live)** | Live `og:image` = `…/images/social/plan-b-share-en.jpg`, a card built from the retired airplane-globe logo. The old favicons/apple-touch icon were derived from the same file. | Deploy this change (section 3). |
| `robots.txt` is correct | `Allow: /`, `Disallow: /api/`, `Sitemap: https://planbconsultant.com/sitemap.xml` (apex — see host mismatch) | none |
| One JSON-LD block per page (no duplicate scripts) | Organization, WebSite, WebPage, BreadcrumbList | none |

Nothing in this report is "live fixed". After deployment re-run the live checks in section 10.

## 2. Local audit results (production build with indexing enabled, crawler view)

`node scripts/seo-audit.mjs` → `artifacts/seo/audit.json`. Zero issues, zero warnings after the fixes below.

| Inventory | Count | Notes |
|---|---|---|
| Route paths (shared registry) | **84** | 10 sections + 13 programmes + 12 services + 46 destinations + 3 guides |
| Generated pages (× en/ar) | **168** | all HTTP 200 |
| **Indexable pages** | **86** (43 per language) | `index,follow` and in sitemap |
| `noindex` pages | **82** | 80 thin destination pages (40 countries × 2) + `programmes/citizenship-investment` × 2 (no country route or current source yet). Deliberate; they stay crawlable so the directive is seen. |
| **Sitemap URLs** | **86** | identical set to the indexable pages |
| Canonical targets | 168 | each page is self-canonical; noindex pages are not in the sitemap |
| Indexable but not in sitemap | 0 | |
| In sitemap but not indexable | 0 | |
| In sitemap but not a canonical | 0 | |
| Sitemap entries without en+ar alternates | 0 | |
| Indexable pages with no internal inbound link | 0 | |
| Broken internal links | 0 | |
| `lastmod` | none emitted | no reliable per-page modification date exists; invented dates are worse than none |

Also verified locally: single absolute self-referencing canonical per page; reciprocal `en`/`ar` hreflang (no Arabic→English canonical); `lang`/`dir` correct (`ar`/`rtl`); exactly one `<h1>`; titles ≤ 75 characters, descriptions 70–180, **no duplicate titles or descriptions among indexable pages**; `/` → 308 `/en`; trailing slash → 308 clean URL; missing page and `/fr` → 404; API not in sitemap and disallowed in robots.txt; main content is server-rendered (the audit reads raw HTML).

Issues found and fixed during this audit: 9 Arabic service descriptions were 48–66 characters, one English one 184 (now hand-written, `lib/seo-copy.ts`); the header crest `<img>` had no width/height (added, avoids a layout-shift risk); Open Graph locales `en_KW`/`ar_KW` are not valid Open Graph locales (now `en_GB` / `ar_AR` with the other as alternate).

## 3. Sharing previews (WhatsApp, Facebook, X) and old-logo cleanup

**Approved logo (source decision):** the hands-and-globe crest in `public/images/plan-b-header-crest-en.png` / `-ar.png` (the logo the site header, footer and splash use; README calls it the revised seven-star hands/globe logo). The retired logo is the airplane-globe badge `public/images/logo.jpg` (619×625). No ambiguity needed resolving: the full lockups `plan-b-logo-en/ar.png` show the same crest.

**Old-logo references replaced / removed**

| Old reference | Replacement |
|---|---|
| `social/plan-b-share-en.jpg`, `-ar.jpg` (built from `logo.jpg`) — used by Open Graph, Twitter | **new** `social/plan-b-share-v3-en.jpg`, `-v3-ar.jpg`; old files deleted |
| `favicon.ico`, `favicon-32.png`, `favicon-512.png`, `apple-touch-icon.png` (all from `logo.jpg`) | regenerated from the crest (`scripts/prepare-favicon.mjs`); icon links now `?v=3` |
| `public/images/logo.jpg` | deleted (smoke test asserts it is 404) |
| `public/favicon.svg` (an unrelated placeholder icon, never linked) | deleted |
| JSON-LD `Organization.logo` → `plan-b-logo.png` | `plan-b-crest-512.png` (512×512) |
| *(none)* web app manifest | `app/manifest.ts` with 192/512 crest icons |

The crest is only resized and cropped of a 13 px trailing strip (stray fragments in the Arabic file); nothing is redrawn or AI-generated.

**Sharing image:** 1200 × 630 JPEG, ceramic white `#F4F2EB`, forest green `#1C472A`, gold `#D4AF37` accents, crest left, "Plan B Consultant / Kuwait · Global mobility / Immigration · Work · Study · Investment / planbconsultant.com". Arabic variant is mirrored with Arabic text. Generated by `scripts/prepare-social-images.mjs`. Both served locally as `200 image/jpeg`, 1200×630, ~110 KB, no authentication. Versioned filename `v3`; bump `shareVersion` in `lib/seo.ts` and `VERSION` in the script together for any future change.

**Tags (server-rendered, one of each per page):** `og:title`, `og:description`, `og:url`, `og:type=website`, `og:site_name`, `og:locale` (`en_GB`/`ar_AR`) + `og:locale:alternate`, `og:image` (absolute HTTPS) with `:type`, `:width`, `:height`, `:alt`, `twitter:card=summary_large_image` with matching title/description/image/alt. The audit confirms exactly one `og:image` per page and no old filenames anywhere in the HTML.

**WhatsApp caching — be aware:** WhatsApp, Facebook and others cache link previews per URL, often for days or longer, and messages already sent keep their old preview. The new image filename and updated tags help *new* fetches, but replacement of a cached preview cannot be forced or guaranteed. After deploying: open the page URL in Meta's Sharing Debugger (https://developers.facebook.com/tools/debug/) and use "Scrape Again" (WhatsApp uses the same crawler family), then test by sending the link in a fresh chat. If a stale preview persists for one URL, adding a harmless query string (`?v=2`) when you share creates a new cache entry without affecting SEO (canonicals ignore it).

Status: implemented + locally verified. **Not live** until deployed.

## 4. Search-intent mapping and metadata

Page ownership and the keyword-to-page map are unchanged from the 2 October handover (one primary intent per page; English phrase + natural Arabic phrase; no search-volume or ranking data — none was available and none is invented). Changes now:

* **Programme and service pages have hand-written, content-matched English and Arabic titles and descriptions** (`lib/seo-copy.ts`): Canada Express Entry, Australia 189/190/491, Australia 482/186, Germany nursing and car mechanics, Sweden work permit, Portugal work/residence, Canada C11, USA EB-5, USA E-2, study and visit visas, and the 12 service overviews. Each states the distinction the page owns (e.g. E-2 "temporary treaty-investor status, not a green card"; EB-5 "permanent residence"; job search "does not itself grant work permission"). No approval rates, guarantees, vacancy, salary or timeline claims.
* Titles use "from Kuwait" only where it adds local intent; "Kuwait" is not repeated in every sentence.

Search research (6 October 2026, standard web search, qualitative only): results for Kuwait + Canada Express Entry and Arabic Canada queries are dominated by consultancy pages that advertise "success rate 95%" and fixed processing times — claims this site deliberately does not make (see `CONTENT-REVIEW.md`). Germany-nursing results confirm real intent around recognition (Anerkennung), German-language level and the official Make-it-in-Germany pages; one non-official result mentions a 2024 "Recognition Partnership" with lower language entry — **not added** until verified on an official German source. EB-5 vs E-2 results confirm a distinct comparison intent (permanent vs temporary status, treaty-country requirement, active vs passive involvement); the figures quoted by those sites vary and age quickly, so a standalone comparison article is deferred until current USCIS/State Department pages are reviewed and a qualified U.S. attorney confirms the wording. Only pages whose service is actually listed on the site are targeted; no new thin country/city pages and no duplicate Arabic translations were created.

## 5. Structured data

One `@graph` per page: `Organization` (latest crest as `logo`, real phone/email, `areaServed: Kuwait`, `sameAs` = only genuine configured profiles — currently TikTok; LinkedIn/Facebook will be added by setting `NEXT_PUBLIC_LINKEDIN_URL` / `NEXT_PUBLIC_FACEBOOK_URL`, Instagram only once ownership is confirmed), `WebSite`, `WebPage`, `BreadcrumbList`, `Service` on programme/service pages, `Article` on the three editorial guides. **Not added, deliberately:** `LocalBusiness` (no verified street address or opening hours), reviews/ratings/awards/credentials, author or reviewer persons, `FAQPage` (FAQs are visible on pages, but Google no longer shows FAQ rich results for most sites; adding it promises nothing). Locally verified: every page has exactly one JSON-LD script, parses, has unique `@id`s and includes Organization, WebSite and BreadcrumbList.

## 6. Lead generation

Audited in code and the earlier browser suites; nothing here increases popup frequency or adds form fields.

* Homepage hero stays form-free; quick popup, full assessment and contact form remain distinct (see `GOOGLE-SHEET-SETUP.md`).
* Programme pages: primary CTA "Check your eligibility" scrolls to an on-page assessment already preselected to that programme (`initialProgramme`); the sticky sub-nav and final band repeat it; contact links (phone, WhatsApp, email) are real `tel:`/`wa.me`/`mailto:` links; forms were browser-tested on mobile widths.
* Trust information is limited to what exists: source references with review dates on programme pages and explicit "not an eligibility decision" language. No testimonials, accreditations or addresses are invented. Missing and valuable (client to supply — `CLIENT-CONTENT-CHECKLIST.md`): registered business details, named adviser credentials, street address/hours, real photos.
* **Measurement:** the site emits a local `planb:conversion` event; new `assessment_cta_click` captures CTA interest. `*_submission_success` events fire only after the server confirmed the Google-Sheet save. **Optional GA4 bridge implemented** (`components/analytics.tsx`): inert unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set and indexing is enabled; maps successes to `generate_lead` and clicks to separate `cta_click` / `contact_click` events; sends only event name, language and step; Google signals and ad personalisation disabled. **Before enabling:** GA sets cookies/identifiers, so add the analytics disclosure to the privacy notice and decide consent/retention (client decision). Verified: build + typecheck; the bridge itself was not exercised against a real GA property (pending).

## 7. AEO / GEO

Answer-first content already exists on programme pages (overview, "who it may suit", eligibility, documents, process, FAQs with cited official sources and check dates). This pass adds precise metadata statements of status distinctions (temporary vs permanent vs job search). No `llms.txt`, special schema or AI-targeted pages were added; none is claimed to improve AI-answer inclusion. Future comparison content is listed in section 9 and must be source-verified first.

## 8. Performance (LAB data only)

`node scripts/seo-perf-lab.mjs` → `artifacts/seo/perf-lab.json`. Headless Chrome, 412×823 @2×, CPU ×4 slowdown, 1.6 Mbps / 150 ms RTT, cold cache, local production build over loopback. **This is lab data; field Core Web Vitals (CrUX / Search Console) cannot be known until real visitors use the deployed site, and Lighthouse was not run.**

| Page | FCP / LCP | LCP element | CLS | Requests | Total | JS |
|---|---|---|---|---|---|---|
| /en | 2.5 s / 2.5 s | hero text | 0.064 | 24 | 804 KB | 209 KB |
| /ar | 2.4 s / 2.4 s | hero text | 0 | 24 | 516 KB | 209 KB |
| /en/programmes/canada-express-entry | 2.6 s / 2.6 s | lead paragraph | 0.047 | 16 | 557 KB | 209 KB |
| /ar/programmes/canada-express-entry | 2.3 s / 2.3 s | H1 | 0 | 15 | 528 KB | 209 KB |
| /en/consultation | 2.0 s / 2.0 s | H1 | 0.011 | 15 | 400 KB | 209 KB |
| /en/contact | 1.9 s / 1.9 s | paragraph | 0.048 | 15 | 399 KB | 209 KB |

Zero broken or failed requests. LCP is text (not a blocking image), CLS is under 0.1 everywhere in the lab, JS is 209 KB. Remaining observations: one hero slide image (`sydney-960.webp`, 212 KB) is loaded on the English home page; the home page has the highest lab CLS (0.064) — source not isolated; the splash animation affects perceived start but not the measured FCP. Fixed now: header crest image dimensions. No further changes were made to approved visuals.

## 9. Ongoing plan (prioritised)

**Content** (each needs a distinct intent, verification and bilingual quality before publishing): (1) EB-5 vs E-2 comparison — after USCIS/State Department review and attorney confirmation; (2) Germany nursing: recognition steps and language levels from official German sources, including whether the newer recognition-partnership route applies; (3) Australia 189/190/491 selection guide — merge into the existing page first; (4) refresh source review dates quarterly (`lib/source-reviews.ts`) — update `lastmod` only if a genuine per-page date is tracked.

**Local SEO checklist (Kuwait)** — client to complete; do not invent details:
1. One verified business record: legal/trade name, address (or confirmed service-area model), phone `+965 6614 9059`, email, hours, URL `https://planbconsultant.com` — identical on the site footer, Google Business Profile, directories and social profiles.
2. Google Business Profile: check eligibility first (it needs genuine in-person customer contact or a staffed location; online-only businesses do not qualify — https://support.google.com/business/answer/3038177, reachable 6 Oct). Primary category matching the real service (e.g. immigration consultant), services listed, genuine photos of the office/team, owner-completed verification.
3. Reviews: ask real clients after completed work with a plain link; never offer incentives, never write or buy reviews, never filter.
4. Add the address/hours to the site and `LocalBusiness` schema only after they are confirmed and public.
5. LinkedIn and Facebook pages: create, then set the two environment variables so they enter `sameAs`.

**Backlinks:** the prioritised shortlist with entry points, requirements and unsent drafts is in `BACKLINK-OPPORTUNITY-PLAN.md` (reviewed 2 Oct; nothing submitted). Link re-check on 6 Oct: yellowpageskuwait.com, kuwaitmate.com, kuwaittimes.com and Google's GBP guideline returned 200; kcci.org.kw and kuwait.jantareview.com returned 403 to an automated request (verify manually in a browser). Principle: one accurate, maintained business record plus genuinely useful bilingual guides beats many generic directory entries; no purchased links, fake profiles, bulk directory submissions or unreviewed outreach.

## 10. Google Search Console — setup (not done; needs your accounts)

1. Go to https://search.google.com/search-console → **Add property** → choose **Domain** and enter `planbconsultant.com` (covers http/https and www/non-www).
2. Google shows a **TXT record** value unique to your account. Do not guess it. Add exactly that TXT record at your DNS provider (the domain owner/registrar — Namecheap per the 2 Oct parking-page finding), save, wait for DNS to propagate (minutes to hours), then press **Verify**.
3. Do the Vercel domain fix (section 1) and set `NEXT_PUBLIC_ALLOW_INDEXING=true` for Production, redeploy, and confirm `https://planbconsultant.com/robots.txt` is reachable and the live HTML no longer contains `noindex`.
4. **Sitemaps** → submit `https://planbconsultant.com/sitemap.xml`. Expect **86 URLs** (43 per language) to be discovered. Locally verified (build + crawler audit); **not live verified**.
5. **URL Inspection**: inspect and "Request indexing" for `/en`, `/ar`, `/en/programmes/canada-express-entry`, `/ar/programmes/canada-express-entry`, `/en/contact`. Confirm "User-declared canonical" equals the inspected URL and that Google's chosen canonical matches.
6. Check **Pages** (indexing) after a few days for "Duplicate, Google chose different canonical" or "Page with redirect" (a symptom of the host mismatch), and **Sitemaps** for read errors. Optionally add the same site in Bing Webmaster Tools.

## 11. Live re-check after deployment (pending)

`curl -sI https://planbconsultant.com/en` → 200 (no redirect to www); no `noindex`; `curl -s https://planbconsultant.com/sitemap.xml | grep -c "<loc>"` → 86; `og:image` ends `plan-b-share-v3-en.jpg` and returns `image/jpeg`; Sharing Debugger shows the new card; `/images/logo.jpg` and the old share files return 404.

## 12. Files added or changed

`lib/seo.ts`, `lib/seo-copy.ts` (new), `lib/site-icons.ts`, `lib/conversion-events.ts`, `components/analytics.tsx` (new), `components/conversion-observer.tsx`, `components/site.tsx`, `components/site-header.tsx`, `app/manifest.ts` (new), `public/images/social/plan-b-share-v3-*.jpg`, regenerated icons + `icon-192.png`, `plan-b-crest-512.png`, `scripts/prepare-social-images.mjs`, `scripts/prepare-favicon.mjs`, `scripts/seo-audit.mjs` (new), `scripts/seo-perf-lab.mjs` (new), `scripts/smoke-test.mjs`, `.env.example`. Removed: `public/images/logo.jpg`, `public/favicon.svg`, `public/images/social/plan-b-share-en.jpg` / `-ar.jpg`.

## 13. Remaining issues / not claimed

Host mismatch (Vercel setting), `NEXT_PUBLIC_ALLOW_INDEXING` still off live, real address/hours/credentials missing (no LocalBusiness), LinkedIn/Facebook URLs pending, GA4 not configured or tested, field Core Web Vitals unknown, social-preview refresh depends on third-party caches, content expansion deferred where official verification is incomplete. This is a solid technical foundation, not "100% SEO complete" and not a ranking guarantee.

# Validation — enquiry storage migration (6 October 2026)

## PostgreSQL → private Google Sheet via Apps Script

**Run and passing (all MOCKED Google services; no live Google call, no email sent):**
- `npm run build` and `npm run typecheck`.
- `node scripts/apps-script-tests.mjs` — 19 tests of `Code.gs` in a Node sandbox with in-memory fakes: tabs/headers, field mapping, text-only phone storage, formula-injection neutralisation, validation/consent, wrong secret, duplicates, parallel same-id requests, lock contention, throttling, email content/escaping/Reply-To/WhatsApp link, failed notification + retry, bounded retries, quota, stale-claim handling, trigger setup, allow-list drift check.
- `node scripts/enquiry-flow-test.mjs` — 23 tests of the real production server against a mock Apps Script that imitates the web-app POST→302→JSON flow: all three forms in EN/AR, validation, origin/size/content-type guards, duplicate and parallel requests, formula injection, failed notification, wrong secret, malformed/invalid/wrong-id/500/hostile-redirect/timeout responses (never reported as success), transient retry, lost-response resolution, throttling, log hygiene, missing configuration, Turnstile token required, no secrets in browser bundles.
- `node scripts/enquiry-ui-qa.mjs` (40 checks) and `node scripts/assessment-popup-qa.mjs` (61 checks): real Chrome; loading/disabled state, success only after confirmed save, EN/AR thank-you text, values preserved on failure, retry reuses the submission id.

**Pending (needs your Google account — see `GOOGLE-SHEET-SETUP.md` section 7):** real spreadsheet write, real email delivery, WhatsApp link tap, cross-execution locking, real Apps Script redirect behaviour, real retry trigger, live Turnstile verification (a real token's success path was not exercised), deployed-site submissions on mobile.

Everything below describes earlier editions (PostgreSQL / D1) and is historical.

---

# Validation — 28 September 2026

## Latest content phase - 1 October 2026

The current Next.js/PostgreSQL project passed production build, TypeScript, 168 bilingual-route smoke checks, 44 desktop/mobile browser cases, 104 internal link targets, six bilingual form UI submissions against the unconfigured local backend, reduced-motion checks at 320px, and the existing assessment-popup regression. Production screenshots and machine-readable results are in `artifacts/content-completion/`. Manual visual coverage and remaining limits are detailed in `CONTENT-COMPLETION-HANDOVER.md`.

Current submission testing confirms HTTP 503 and honest failure feedback when PostgreSQL is unconfigured. Earlier D1/Worker results below describe a different historical edition; they do not verify persistence in this deliverable. No production database or real notification delivery was tested in this phase, and nothing was deployed.

## Live Sites edition
- Production build and TypeScript passed.
- Local Worker runtime: 164 English/Arabic routes returned 200.
- Invalid route returned 404; updated logo served successfully.
- Assessment saved to an ephemeral D1 database with programme, age, education, profession, nationality, residence and budget.
- Duplicate ID did not create a second record.
- Invalid input, missing consent, honeypot, required email, foreign origin and rate limit checks passed.
- Additive database migration preserves existing enquiries.

## Vercel edition
Uses standard Next.js and PostgreSQL. Build and route-check results are recorded in the delivered archive's VALIDATION.md.

## Limits
The supported browser-control skill is unavailable in this environment. Mobile/tablet breakpoints, RTL and form layout have been reviewed in source, but rendered browser screenshots, interaction and overflow tests have not been completed. No Lighthouse or cross-browser score is claimed.
The Vercel PostgreSQL database requires the owner's credentials and one-time schema setup. No production PostgreSQL submission was made here. The two deployments use separate databases.
Verified contact numbers, email, address, hours and notification delivery are not supplied in the client PDF. No details were invented; email notifications are not configured.

## October 1, 2026 verification

- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.4 production compilation and static page generation.
- Runtime smoke suite: 164 English/Arabic URLs returned 200; invalid locale/path checks returned 404; logo delivery and enquiry API validation, origin enforcement and request-size limits passed.
- Browser rendering: inspected the English desktop homepage at 1440 px, the Canada Express Entry page at 1024 px, and mobile layouts in Chromium. The apparent crop in 390 px command-line screenshots was traced to Chromium's 496 px minimum headless window; computed layout width was 447 px inside a 496 px viewport with no document overflow.
- Reduced-motion mode skips the intro overlay; the destination ticker has a visible pause control.
- No production database submission was attempted. Without `DATABASE_URL`, the enquiry API correctly returns an honest configuration error rather than a false success.

## September 30 — persistent masthead and footer
- Utility bar and header grouped in one sticky masthead; native navigation retained.
- English/Arabic contact rows show configured details or explicitly marked demo email/phone. Demo values do not initiate calls or emails.
- LinkedIn, Instagram, Facebook icons have accessible coming-soon labels/tooltips until actual profile URLs are added in components/contact-links.tsx.
- Footer reorganized with consultation link, Home, navigation, contact and social groups. Responsive two-column and stacked layouts; obsolete mobile utility text hiding removed.
- Sites build and full local runtime route/link checks passed. Vercel production build passed; final CSS-only removal of an obsolete rule copied afterward.
- No browser visual, scroll, mobile/tablet or keyboard interaction test performed. Responsive and sticky behavior implemented in CSS, not browser-verified.

## October 1 - long-form programme expansion

- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.4 production compilation and static generation.
- Runtime smoke suite: 164 English/Arabic URLs returned 200; invalid locale/path checks returned 404; logo delivery and enquiry API validation, origin enforcement and request-size limits passed.
- Ten priority programme pages now share a complete editorial structure: split hero, preselected assessment, overview, eligibility, potential benefits, document checklist, numbered process, Plan B support boundary, four FAQs, official links, closing CTA and related programmes. The three broader citizenship, study and visit routes use the same accessible structure.
- The homepage assessment remains a one-time scroll-triggered modal and is not embedded in the hero, following the latest client direction. The splash screen remains enabled once per browser session.
- Computer-control browser rendering was attempted, but no browser surface was available to the QA tool. Responsive and RTL layouts were therefore source-reviewed and production-compiled, not newly screenshot-verified in this pass.

## October 1 - final navigation and contact separation

- Replaced the generic programmes navigation with the approved order in English and Arabic: Home, Skilled Immigration, Business Immigration, Work Permits, Study Visa, Visit Visa, About Us, Contact Us.
- Skilled Immigration, Business Immigration and Work Permits use compact country-grouped panels with direct programme links. Australia Work Visa appears only under Skilled Immigration.
- Free Consultation remains a distinct header action and opens the full assessment. Contact Us now opens a dedicated general-enquiry page using the same real enquiry API, with no simulated success response.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.4 production compilation, TypeScript validation and static generation.
- Runtime smoke suite: 164 English/Arabic routes passed, plus 404, logo and enquiry API validation/origin/body-limit checks.
- Chromium CDP matrix passed in English and Arabic at 360, 390, 768, 1024, 1280 and 1440 px. There was no horizontal overflow; the mobile menu preserved the exact order; the header CTA remained fully visible at applicable widths; and every desktop dropdown stayed inside the viewport.
- Keyboard/click/touch states include visible focus, expanded-state attributes, Escape and outside-click closing. The mobile navigation is height-limited, scrollable and restores document scrolling when closed.
- Preview images and the machine-readable matrix are in `artifacts/header-navigation/`.

### Remaining launch configuration

- `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_PHONE` and `NEXT_PUBLIC_WHATSAPP` have not been supplied. The current email and phone are visibly marked demo values and are not actionable; WhatsApp remains hidden.
- `NEXT_PUBLIC_ADDRESS` and `NEXT_PUBLIC_HOURS` have not been supplied. Address, hours and map remain omitted as required.
- Social profile URLs are still unconfigured and retain their accessible “Coming soon” state.
- `DATABASE_URL` and `RATE_LIMIT_SECRET` are required for saved production submissions. Until configured, both forms return an honest service-configuration error rather than a false success.

## October 1 — priority programme page completion

- Completed the ten priority English/Arabic programme routes without creating duplicate pages. Program-specific route/status explanations, documents and FAQs replace generic repeated copy.
- Corrected the FSW 67-point/CRS distinction; Australian permanent/provisional/temporary status; German recognition and language context; Swedish salary/language context; Portugal route distinctions; C11 ownership/duration/investment wording; and EB-5/E-2 outcome differences using primary government sources.
- Replaced duplicated generic business imagery on C11, EB-5 and E-2 with distinct original assets. All audited page images loaded, used non-empty alt text and retained safe cover cropping.
- `npm run typecheck`: passed.
- `npm run build`: passed with Next.js 16.3.4 production compilation, TypeScript validation and static generation.
- Chromium full-page matrix: 26/26 cases passed (all ten English pages at 1440 and 390 px; representative Arabic pages at both widths). Checks covered overflow, sections, images, assessment preselection, sticky-header anchor offsets, CTA links and the Canada points table.
- Chromium responsive matrix: 56/56 cases passed (all English pages at 320, 375, 414, 768 and 1280×800; representative Arabic at 320 and 768). No horizontal overflow, multi-line clickable labels or below-fold primary hero CTAs were detected.
- Scroll-offer interaction passed: suppressed while the mobile drawer is open, opens after navigation closes and scrolling resumes, and remains dismissed for the session after close and reload.
- The referenced `About US.pdf` and competitor screenshots were absent from the supplied paths, so no claim of a fresh visual comparison against those files is made. See `PROGRAMME-PAGES-HANDOVER.md` for incorporated content, official sources and unresolved client claims.

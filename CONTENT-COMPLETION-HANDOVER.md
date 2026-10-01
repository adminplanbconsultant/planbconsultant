# Plan B Consultant content handover - 1 October 2026

## Delivery status

Website content completed against the available 19-page client `content.pdf` and the latest written brief. No production deployment was performed. **Not production-ready until the contact details, PostgreSQL connection and rate-limit secret are configured and live persistence is acceptance-tested.**

The separate `About US.pdf` and newly referenced screenshots were not accessible. Their exact revision comparison remains outstanding. See `CLIENT-CONTENT-CHECKLIST.md` for the requirement-by-requirement status and official-source links.

## Completed pages and sections

- Home (`/en`, `/ar`): preserved approved hero, Kuwait positioning, imagery, automatic country ticker, About introduction, Vision/Mission/values, six destinations, approach and guides. Added the explicit Free Consultation hero link and direct links from all six service cards to the completed programmes. Removed unconfirmed admissions-service wording. Hero has no assessment form.
- About (`/[locale]/about`): retained client-derived introduction and shared bilingual Vision/Mission/values; added purposeful Sydney destination photography and retained the assistance process. No company experience, licence, relationship or approval claims invented.
- Seven service overviews: `skilled-immigration`, `work-visas`, `business-immigration`, `residency-by-investment`, `citizenship-by-investment`, `study-abroad`, `visit-visas` under `/[locale]/services/`. Each includes scope, preparation, service-preselected consultation and relevant programme links. Study/visit/citizenship remain concise enquiry-led overviews.
- Shared footer: forest green, approved crest artwork with background clipped transparently in its SVG rendering, readable gold colour, programme groups, navigation/privacy links, company description, configured contact/social actions, consultation CTA and existing Ticode Technologies credit. The original source PNGs are preserved unchanged and remain opaque.
- Imagery: reviewed all bundled images, including three generated business illustrations; added bilingual disclosure to generated scenes and neutralised alt text implying actual projects or clients. Updated `ASSET-SOURCES.json`. Corrected the UK destination's broken image path.
- Arabic metadata: page titles and descriptions now follow the selected language for Home, About, services, destinations and resources as well as programmes.
- Preserved programme structures and factual corrections, bilingual navigation, sticky utility/header, splash, Contact Us form, assessment popup trigger/dismissal and full assessment flow. The existing Residency through Investment menu entry now links to its dedicated overview.

## Previews

Open `artifacts/content-completion/index.html` for the gallery. It contains full-page screenshots of Home, About and Business Immigration in English/Arabic at 1440px desktop and 390px mobile, plus footer screenshots. Compact sheets are `desktop-preview-sheet.jpg` and `mobile-preview-sheet.jpg`.

These are screenshots of the local production build, not a deployed website. Demo contact placeholders in them are deliberately non-actionable.

## Required environment configuration

Copy `.env.example` to `.env.local` for local operation, or set equivalent variables in the intended hosting environment. Do not put real credentials in `.env.example` or commit/export `.env.local`.

| Variable | Required value and behaviour |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Confirmed canonical HTTPS domain, without a trailing slash. Used by canonical URLs, alternate-language links, structured data and sitemap. |
| `NEXT_PUBLIC_PHONE` | Verified public phone in international format, including country code. Activates `tel:` links. |
| `NEXT_PUBLIC_WHATSAPP` | Verified WhatsApp number: country code plus number, digits only, no `+`, spaces or URL. Activates `https://wa.me/` actions. |
| `NEXT_PUBLIC_EMAIL` | Monitored public business mailbox. Activates `mailto:` links; it does **not** itself enable enquiry notifications. |
| `NEXT_PUBLIC_ADDRESS` | Confirmed public office address; omit until confirmed. No fabricated map is embedded. |
| `NEXT_PUBLIC_HOURS` | Confirmed public opening-hours wording; omit until confirmed. |
| `NEXT_PUBLIC_LINKEDIN_URL` | Verified complete HTTPS company-profile URL; blank shows a non-actionable placeholder. |
| `NEXT_PUBLIC_INSTAGRAM_URL` | Verified complete HTTPS company-profile URL; blank shows a non-actionable placeholder. |
| `NEXT_PUBLIC_FACEBOOK_URL` | Verified complete HTTPS company-profile URL; blank shows a non-actionable placeholder. |
| `NEXT_PUBLIC_ALLOW_INDEXING` | Keep `false` for review. Use `true` only after business approval and launch readiness. This is not access control. |
| `DATABASE_URL` | **Server-only secret.** PostgreSQL connection string from the selected provider, with credentials and TLS configured; prefer the provider's pooled URL. |
| `RATE_LIMIT_SECRET` | **Server-only secret.** At least 32 random characters; generate securely, for example `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Used to hash short-lived abuse-control identifiers. |
| `ENQUIRY_WEBHOOK_URL` | Optional **server-only** trusted HTTPS endpoint for the owner's enquiry notification system. Requires the token below. |
| `ENQUIRY_WEBHOOK_TOKEN` | Optional **server-only secret** sent as the webhook's Bearer token. Never use a `NEXT_PUBLIC_` name. |

All `NEXT_PUBLIC_*` values are public and compiled into the browser bundle. Rebuild after changing them. Keep database credentials, rate-limit and webhook tokens server-only. The delivery archive contains only the empty example environment file.

## Submission backend and acceptance test

The general enquiry, full assessment and popup assessment all POST JSON to **`/api/enquiries`**. The shared server route validates with Zod, rejects disallowed origins and oversized bodies, checks the honeypot/consent, applies rate limits, and inserts into PostgreSQL `enquiries`. Extended assessment fields are stored in the `profile` JSONB column. The client-generated UUID is the primary key for idempotent insertion. `rate_limits` stores short-lived hashed network identifiers.

1. Configure `DATABASE_URL` and `RATE_LIMIT_SECRET` in a private local/staging environment.
2. Run `npm ci`, then `npm run db:setup` once to apply `database/schema.sql`. The setup script adds missing tables/profile column without deleting existing rows. Do not run schema setup on every build.
3. Run `npm run build`, then `npm start` (or `npm run dev` for development).
4. Submit one consenting test enquiry and one assessment. Verify HTTP 201, the displayed `PB-...` reference, and matching rows in the intended database, including service/programme and extended profile.
5. Retry the same UUID to check no duplicate row; verify access controls, retention and the owner's review process. No admin dashboard is supplied.
6. If notifications are required, configure both webhook settings and verify the designated system receives `enquiry.created`. Notification failure is logged server-side and does not undo a saved enquiry; there is no automatic retry queue. The database remains the source of truth.
7. Replace demo contact values, confirm public links and privacy details, rebuild and retest before any production release.

No configured database was available during this phase. We verified actual local UI requests and honest unconfigured failures; we did **not** verify a production database insert, real notification delivery, or a booked appointment. Do not describe submission as production-ready on the basis of the build alone.

## Validation evidence

**Automated:**

- Production build and TypeScript passed.
- Smoke test: 168 English/Arabic routes, expected 404s, logo response, API validation, origin/content-type/body-size restrictions and unconfigured 503 behaviour passed.
- Browser checks: 44 cases at 390px and 1440px across Home, About, all seven service overviews, Contact Us and representative EB-5; no horizontal overflow, missing images, empty footer columns or missing sticky masthead. All 104 distinct internal link targets returned 200.
- Reduced motion: English and Arabic at 320px; ticker animation disabled, all six country links remain visible within the viewport, no overflow.
- Form UI: six real local requests (three form types in each language) reached `/api/enquiries`, retained business-service preselection where applicable, received HTTP 503, showed error feedback and did not show success. See `form-results.json`.
- Existing popup regression: suppressed while mobile navigation is open; opens after navigation closes and scrolling resumes; dismissal persists through scrolling and reload.
- Existing programme-responsive regression: 56 cases across 320, 375, 414, 768 and 1280px passed; no horizontal overflow, clipped click targets or desktop primary CTA below the tested fold.
- Splash appearance/dismissal, ticker movement/pause/resume and translated Arabic metadata passed in both languages. Generated-image disclosures passed 12 desktop/mobile English/Arabic cases across C11, EB-5 and E-2; captions remain visible inside their containers and all images load. The final build was refreshed after correcting stale webpack CSS cache output.
- Notification helper: configuration, HTTPS requirement, payload/idempotency header and failure handling tested with mocks; no real external notifications sent.

**Visual inspection:**

- Reviewed all source PDF pages as a rendered contact sheet and read their extracted text; inspected the values page at larger size.
- Inspected all bundled destination and generated images as a contact sheet.
- Inspected production Home/About/Business overview desktop and mobile screenshots, English/Arabic preview sheets, and footer detail views. Checked hierarchy, image crops, RTL alignment, logo background/colour and spacing.
- Automated page coverage is broader than manual visual coverage; no claim of visual inspection of every route or third-party browser/device is made.

Machine-readable results and previews are in `artifacts/content-completion/`. QA uses an isolated Chromium instance via CDP; `scripts/content-preview.mjs` and `scripts/content-forms-qa.mjs` default to debugger port 9228. Existing programme/header regression helpers remain available.

## Still needed from the client

- Separate latest About US PDF/screenshots for exact revision reconciliation.
- Verified public contacts, social-profile URLs, office address and hours.
- Evidence for any company history, regulated qualifications, attorney/recruitment/training relationships, named employers, vacancies, pay packages or investment projects before they can be published.
- Confirmed scope and destinations for citizenship, study and visit services; no speculative packages or admissions services have been introduced.
- Business-specific privacy ownership, retention/deletion process and service/fee terms, plus final bilingual editorial approval.
- Secure production database/rate-limit configuration and the live acceptance checks above.

## Archive contents

The updated archive includes source, lockfile, local website assets, database schema, QA scripts, this handover, the reconciliation checklist and the latest preview gallery. It excludes `.git`, `.next`, `node_modules`, actual `.env` files, temporary tools, browser profiles, previous archives and unrelated local agent files. Extract, configure and install dependencies before running. Nothing was deployed.

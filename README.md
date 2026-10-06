# Plan B Consultant — Vercel edition

Social sharing: English and Arabic 1200 × 630 JPEG cards are in `public/images/social/`; page metadata includes absolute Open Graph image URLs, dimensions, type, alt text and X/Twitter large-card tags. Regenerate the cards with `node scripts/prepare-social-images.mjs`. They reuse the approved original badge and brand palette. Social-platform preview verification requires the updated site/assets to be publicly deployed; no deployment was performed here.

Search-visibility delivery (2 October 2026): [handover and keyword map](SEARCH-VISIBILITY-HANDOVER.md), [validation](SEARCH-VALIDATION-REPORT.md), [source ledger](SOURCE-REVIEW-LEDGER.md), and [planned authority opportunities / unsent drafts](BACKLINK-OPPORTUNITY-PLAN.md). These documents supersede earlier SEO route-count/indexing notes. Canonicals use `https://planbconsultant.com`; `lib/seo.ts` owns routes and eligibility. There are 168 localized pages, 86 eligible for production indexing. Staging remains noindex. No deployment or external submissions were made.

Latest content delivery: [handover](CONTENT-COMPLETION-HANDOVER.md), [client reconciliation](CLIENT-CONTENT-CHECKLIST.md), and [desktop/mobile preview gallery](artifacts/content-completion/index.html). Contact details and server-side enquiry storage still require configuration; no production deployment was performed.

A bilingual Next.js App Router website for Plan B Consultant, Kuwait. This is the standalone Vercel edition of the client-content update. The live Sites edition has matching UI/content but uses its own database.

## Run locally (Node.js 22)

```sh
npm ci
```

Copy `.env.example` to `.env.local`, then:

```sh
npm run dev
```

Open http://localhost:3000. English is `/en`; Arabic is `/ar`.

## Deploy on Vercel

1. Extract this ZIP and upload the **contents of plan-b-vercel** to a Git repository. `package.json` must be at the repository root (or select this folder as Vercel's Root Directory).
2. Import the repository into Vercel. Framework: **Next.js**. Node version: **22.x**. Build: `npm run build`. Leave Output Directory at the Next.js default.
3. Copy variables from `.env.example` into Vercel Project Settings → Environment Variables. Set `NEXT_PUBLIC_SITE_URL` to your actual HTTPS domain, without a trailing slash. Public variables are compiled at build time: redeploy after changing them.
4. Set up enquiry storage: a private Google Sheet plus a Google Apps Script web app (no database). Follow `GOOGLE-SHEET-SETUP.md`, then set the server-only variables `GOOGLE_APPS_SCRIPT_URL` and `GOOGLE_APPS_SCRIPT_SECRET` (and optionally the Cloudflare Turnstile keys). Never put them in a NEXT_PUBLIC variable.
5. No database migration is needed. `database/schema.sql` is a legacy record of the old PostgreSQL table shape and is not used.
6. Deploy, then run the live checks in `GOOGLE-SHEET-SETUP.md` section 7. Missing or failing storage produces an honest error, never a fake success.
7. Complete the business details and approve services/privacy copy. Set `NEXT_PUBLIC_ALLOW_INDEXING=true` and redeploy when the public launch is approved. Before this, robots/noindex intentionally exclude the site; this is not access control. Use Vercel deployment protection if the preview must be private.

## Typography: ZT Talk

ZT Talk is **not included**. The client-approved serif heading style is retained. After adding licensed font files and @font-face declarations, set --serif to 'ZT Talk', Georgia, serif in app/globals.css. Manrope remains available as an optional dependency (OFL). For the actual ZT Talk appearance, obtain the appropriate commercial web licence and supplied WOFF2 files from the foundry: https://zelowtype.com/zt-talk/.

Put the licensed files in `public/fonts/`, then add the appropriate declarations to `app/globals.css`. Example for a static medium file (adapt filename and weight to the files you own):

```css
@font-face {
  font-family: 'ZT Talk';
  src: url('/fonts/zt-talk-medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

Add regular and bold declarations if available. Do not declare a static font as a variable font. Arabic uses Tahoma/Arial; do not assume ZT Talk includes Arabic glyphs.

## What changed in this edition

- The existing forest green, gold and ceramic-white visual design is retained.
- New seven-star hands/globe logo, Home navigation and pauseable ticker.
- Six programme categories with 13 detailed English/Arabic programme pages.
- Client profile, mission, vision, Choice/Clarity/Certainty values.
- Three-step assessment with age, education, profession, nationality, residence and conditional investment budget.
- Full submitted profile saved to a private Google Sheet (with an email notification), with validation, consent, honeypot, Turnstile, throttling and duplicate prevention.
- Existing service, destination and guide pages remain available.
- Relevant destinations link to the new programme pages.
- Photos bundled locally for reliable asset delivery.
- Standard Next.js/Vercel build, configurable canonical URL and bilingual sitemap.

See CONTENT-REVIEW.md for the complete client PDF coverage and corrections.

## Enquiries and contact details

Public company variables are in `.env.example`. WhatsApp uses digits only, including Kuwait country code, with no `+` or spaces. No contact details were invented. Add verified company details before presenting it as launch-ready.

Enquiries (quick popup, full assessment, contact form) are saved to a **private Google Sheet** through a Google Apps Script web app, and each saved enquiry triggers one notification email to the company mailbox (with a manual "contact on WhatsApp" link). There is no database and no admin dashboard: staff work in the sheet. Setup, column mapping, retries and failure modes: `GOOGLE-SHEET-SETUP.md`. Source: `integrations/google-apps-script/Code.gs`.

The form shows success only after Apps Script confirms the row was saved; a reference (`PB-XXXXXXXX`) is returned. No documents or passport uploads are requested. Define your client's data-retention procedure and approved privacy wording before collecting real enquiries.

Earlier PostgreSQL rows (if any) are not touched or migrated; `database/schema.sql` documents their shape.

## Assets and content

The revised seven-star hands/globe logo is bundled as public/images/plan-b-logo.png. It has an opaque white background; CSS blends it into the ceramic surface and crops the header presentation to the crest. The full logo is shown on About. Three destination photos are bundled locally; attribution is in ASSET-SOURCES.json. Review crop and mobile appearance in your deployed preview.

Edit bilingual service/country/FAQ content in `lib/content.ts`, page markup in `components/site.tsx`, and styling in `app/globals.css`. Company claims, available services and all immigration information need client approval. No invented testimonials, approval rates or professional accreditations are included.

## Validation

See `VALIDATION.md` for the actual checks performed and the checks requiring your deployment credentials. A successful build is not a substitute for a real Google Sheet submission (see `GOOGLE-SHEET-SETUP.md` section 7) or mobile browser review.


## Optional enquiry notifications
Set ENQUIRY_WEBHOOK_URL to a company-controlled HTTPS endpoint and ENQUIRY_WEBHOOK_TOKEN to its bearer secret. The server POSTs an enquiry.created JSON event only after saving a new enquiry. Fields: reference, name, phone, email, method, service, locale, programme, destination, message, source, submittedAt (Unix milliseconds), plus `secret` (the token, for receivers such as Google Apps Script that cannot read headers). A 3xx response counts as delivered. For the free Google Sheet + email setup see GOOGLE-SHEET-SETUP.md. The Idempotency-Key header is the enquiry reference. Configure the receiving system to authenticate the token and deduplicate this key. Never put these secrets in NEXT_PUBLIC variables.

Notification failure does not discard the saved lead or report a false form failure. It writes a server error with the reference only. This integration does not include an automatic retry queue: monitor failures and reconcile saved enquiries. The endpoint, recipient workflow and delivery remain unconfigured until the client provides them. Test using a controlled submission before collecting real leads.

## Client materials still needed
Verified phone/WhatsApp, company email, office address, opening hours, genuine consultant names/photos and office photography. Configure the existing NEXT_PUBLIC contact variables; empty fields remain hidden. Do not substitute stock people or fabricated credentials.

### Header and footer contact presentation
Utility bar and navigation remain together while scrolling. Email (`info@planbconsultant.com`), phone (`+965 6614 9059`) and WhatsApp (`96566149059`) default in `lib/content.ts`; the `NEXT_PUBLIC_EMAIL/PHONE/WHATSAPP` variables override them. If a value is emptied, a marked demo placeholder is shown without live contact actions. Set actual social URLs in `components/contact-links.tsx` to activate LinkedIn, Instagram and Facebook; until then icons show “Coming soon” on hover/focus.

## October 2026 PDF-led edition

The homepage uses a focused split hero, six programme groupings, a restored once-per-session splash screen and a once-per-session assessment prompt after the visitor starts scrolling. Programme detail pages use a long-form bilingual editorial template with destination and profession imagery, an early preselected assessment, eligibility, benefits, documents, process, FAQs, official sources and related routes. SEO includes route-specific descriptions plus breadcrumb and programme Service structured data. The bilingual mega-menu exposes every individual programme on desktop and mobile.

Visual design decisions and reusable tokens are documented in `design.md` and `tokens.css`. Image attribution is in `ASSET-SOURCES.json`; client-content decisions and factual corrections are in `CONTENT-REVIEW.md`.

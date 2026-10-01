# Plan B Consultant — Vercel edition

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
4. Add a PostgreSQL database (any provider compatible with Postgres.js). Set `DATABASE_URL` to its TLS-enabled pooled connection string. Create a random `RATE_LIMIT_SECRET` (at least 32 characters). Never put either value in a NEXT_PUBLIC variable.
5. Run `database/schema.sql` in the provider's SQL editor, or set DATABASE_URL in `.env.local` and run `npm run db:setup` once. This creates the two required tables and indexes and adds the profile column if you used the previous export. It preserves existing enquiry rows. Do not run migrations on every Vercel build.
6. Deploy. Test a real enquiry and verify the new row in the database. Missing database configuration produces an honest error, never a fake success.
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
- Full submitted profile saved to PostgreSQL, with validation, consent, honeypot, throttling and idempotent insert.
- Existing service, destination and guide pages remain available.
- Relevant destinations link to the new programme pages.
- Photos bundled locally for reliable asset delivery.
- Standard Next.js/Vercel build, configurable canonical URL and bilingual sitemap.

See CONTENT-REVIEW.md for the complete client PDF coverage and corrections.

## Enquiries and contact details

Public company variables are in `.env.example`. WhatsApp uses digits only, including Kuwait country code, with no `+` or spaces. No contact details were invented. Add verified company details before presenting it as launch-ready.

Enquiries are stored in PostgreSQL; they are **not emailed automatically**, and there is no admin dashboard. Use your database provider's restricted dashboard to review them. Example query:

```sql
SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 100;
```

The database is the only durable submission destination. The form returns a reference after a successful insert. No documents or passport uploads are requested. Define your client's data-retention procedure and approved privacy wording before collecting real enquiries.

The Sites database is separate. This export does not copy existing enquiries or credentials. Arrange an authorised data migration if needed.

## Assets and content

The revised seven-star hands/globe logo is bundled as public/images/plan-b-logo.png. It has an opaque white background; CSS blends it into the ceramic surface and crops the header presentation to the crest. The full logo is shown on About. Three destination photos are bundled locally; attribution is in ASSET-SOURCES.json. Review crop and mobile appearance in your deployed preview.

Edit bilingual service/country/FAQ content in `lib/content.ts`, page markup in `components/site.tsx`, and styling in `app/globals.css`. Company claims, available services and all immigration information need client approval. No invented testimonials, approval rates or professional accreditations are included.

## Validation

See `VALIDATION.md` for the actual checks performed and the checks requiring your deployment credentials. A successful build is not a substitute for a real database submission or mobile browser review.


## Optional enquiry notifications
Set ENQUIRY_WEBHOOK_URL to a company-controlled HTTPS endpoint and ENQUIRY_WEBHOOK_TOKEN to its bearer secret. The server POSTs an enquiry.created JSON event only after saving a new enquiry. Fields: reference, name, phone, email, method, programme, destination, message, submittedAt (Unix milliseconds). The Idempotency-Key header is the enquiry reference. Configure the receiving system to authenticate the token and deduplicate this key. Never put these secrets in NEXT_PUBLIC variables.

Notification failure does not discard the saved lead or report a false form failure. It writes a server error with the reference only. This integration does not include an automatic retry queue: monitor failures and reconcile saved enquiries. The endpoint, recipient workflow and delivery remain unconfigured until the client provides them. Test using a controlled submission before collecting real leads.

## Client materials still needed
Verified phone/WhatsApp, company email, office address, opening hours, genuine consultant names/photos and office photography. Configure the existing NEXT_PUBLIC contact variables; empty fields remain hidden. Do not substitute stock people or fabricated credentials.

### Header and footer contact presentation
Utility bar and navigation remain together while scrolling. Missing email/phone display marked demo values (`info@planb.example`, `+965 0000 0000`) without live contact actions. Set the existing public email/phone configuration to replace them. Set actual social URLs in `components/contact-links.tsx` to activate LinkedIn, Instagram and Facebook; until then icons show “Coming soon” on hover/focus. Do not launch the public company site with demo contact details.

## October 2026 PDF-led edition

The homepage uses a focused split hero, six programme groupings, a restored once-per-session splash screen and a once-per-session assessment prompt after the visitor starts scrolling. Programme detail pages use a long-form bilingual editorial template with destination and profession imagery, an early preselected assessment, eligibility, benefits, documents, process, FAQs, official sources and related routes. SEO includes route-specific descriptions plus breadcrumb and programme Service structured data. The bilingual mega-menu exposes every individual programme on desktop and mobile.

Visual design decisions and reusable tokens are documented in `design.md` and `tokens.css`. Image attribution is in `ASSET-SOURCES.json`; client-content decisions and factual corrections are in `CONTENT-REVIEW.md`.

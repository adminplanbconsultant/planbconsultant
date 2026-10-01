# Validation — 28 September 2026

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

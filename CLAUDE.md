# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Requires Node >= 22.13. Copy `.env.example` to `.env.local` first.

- `npm run dev` — dev server at http://localhost:3000 (`/en`, `/ar`)
- `npm run build` — production build (uses `next build --webpack`, not Turbopack)
- `npm run typecheck` — `tsc --noEmit` (the main static check; no ESLint config or unit-test runner exists)
- `npm run db:setup` — applies `database/schema.sql` using `DATABASE_URL` (run once, never on deploy builds)
- `node scripts/smoke-test.mjs` — end-to-end smoke test against a running server (`TEST_BASE_URL`, default localhost:3000). Fetches every locale × route generated from `lib/content.ts` and `lib/programmes.ts`, plus 404s and `/api/enquiries` validation. Without `DATABASE_URL` it asserts the API returns 503 rather than faking success.
- Other `scripts/*.mjs` (`header-preview`, `programme-responsive-qa`, `assessment-offer-qa`, `check-notifications`) are browser/QA helpers whose output lands in `artifacts/`.

## Architecture

Bilingual (English LTR / Arabic RTL) marketing site for a Kuwait immigration consultancy, Next.js App Router + React 19 + Tailwind 4, deployed on Vercel.

- **Single catch-all route**: `app/[locale]/[[...path]]/page.tsx` handles every page. It validates `locale` (`en`|`ar`) and the path against hard-coded section names plus slugs from the content modules (otherwise `notFound()`), builds metadata/canonical/hreflang and JSON-LD (breadcrumb + `Service` for programmes), then renders `components/site.tsx` with `{locale, path}`. When adding a new top-level section or content type, update **both** `generateMetadata` and the `valid` check in this file, plus `app/sitemap.ts` and the path list in `scripts/smoke-test.mjs`.
- **Content is data, not CMS**: `lib/content.ts` (services, countries, guides, FAQs, `slugify`, `origin`), `lib/programmes.ts` (13 programmes, each with parallel English and `*Ar` fields), and `lib/programme-details.ts`, `lib/programme-audiences.ts`, `lib/service-overviews.ts` for long-form extras. Every user-facing string needs both languages. `components/site.tsx` is the page-markup router; `programme-page.tsx`, `programmes.tsx`, `service-overview.tsx`, `assessment.tsx`, `site-header.tsx` and `splash-screen.tsx` hold the larger pieces. `components/ui/` is shadcn-style primitives.
- **Enquiry pipeline**: the assessment/consultation forms POST to `app/api/enquiries/route.ts`, validated by `lib/enquiry-schema.ts` (zod; honeypot, consent, rate-limit keyed by `RATE_LIMIT_SECRET`, origin check, body-size cap, idempotent insert by client-generated id) and stored in PostgreSQL via `lib/database.ts` (postgres.js, single lazily-created connection). If `DATABASE_URL` is missing the API must return an honest error, never fake success. `lib/enquiry-notification.ts` optionally POSTs an `enquiry.created` webhook after a successful insert; its failure must not fail the request. Schema is in `database/schema.sql`.
- **Indexing**: robots/metadata are noindex unless `NEXT_PUBLIC_ALLOW_INDEXING=true`. Missing contact env vars (`NEXT_PUBLIC_PHONE/EMAIL/...`) intentionally render marked demo values.
- **Styling**: `app/globals.css` plus design tokens in `tokens.css`; `design.md` is the locked design system (forest green / gold / ceramic white, serif headings, Manrope body, Tahoma/Arial for Arabic, reduced-motion respected). Reuse tokens rather than adding one-off colours/spacing. ZT Talk font is not bundled (licence needed).

## Content rules

Immigration claims are legally sensitive. `CONTENT-REVIEW.md` and `PROGRAMME-PAGES-HANDOVER.md` record which claims were deliberately removed or qualified (e.g. no promised approval rates, salaries, citizenship, or fixed investment minimums; no invented testimonials, contacts or accreditations). Keep programme copy consistent with those decisions and cite official sources.

## Repo notes

- `artifacts/` holds QA screenshots (some include browser profile dirs), `tmp/` is untracked scratch, and a dated `.zip` export sits at the root — none are source.
- `.env*` is gitignored except `.env.example`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

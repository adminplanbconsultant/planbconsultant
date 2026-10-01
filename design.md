# Design — Plan B Consultant

A locked design system for the bilingual Plan B Consultant website. Every page uses this system; page-to-page variety comes from content and composition, not a new theme.

## Genre

Editorial, with restrained luxury and travel-document details.

## Macrostructure family

- Marketing pages: photographic split hero with an asymmetric editorial content flow.
- Programme pages: long-document reading flow with an image banner, practical tables, numbered process and a persistent assessment action.
- Form pages: workbench-style two-column layout that becomes a single linear flow on mobile.

## Theme

- Paper: warm ceramic white, `oklch(95.8% 0.012 92)`.
- Ink: forest green, `oklch(35% 0.086 147)`.
- Accent: restrained metallic gold, `oklch(75% 0.129 89)`.
- Focus: darker gold, `oklch(58% 0.145 82)`.

## Typography

- Display: the existing approved editorial serif stack; headings remain roman.
- Body: Manrope when bundled, with Tahoma/Arial fallbacks.
- Arabic: Tahoma/Arial with logical alignment and no Latin tracking.
- Long-form measure: 60–68 characters.

## Spacing

Use the 4-point named scale in `tokens.css`. New work references tokens rather than adding one-off spacing or colours.

## Motion

- Quiet opacity/transform transitions only.
- One lightweight globe/aircraft loop in the homepage hero.
- All spatial motion collapses under `prefers-reduced-motion`.

## Microinteractions stance

- Visible, immediate focus rings.
- Click/touch/keyboard navigation parity.
- Honest loading, success and failure states on forms.
- No celebratory or fabricated success feedback.

## CTA voice

- Primary: forest fill, ceramic text, compact rectangular shape.
- Secondary: typographic link or forest outline.

## What pages must share

Approved language-specific logos, palette, type pairing, sticky utility/header treatment, CTA voice, enquiry disclaimers and forest-green footer.

## What pages may differ on

Destination image, data presentation, programme-specific requirements and the density of the reading layout.

## Exports

The canonical drop-in CSS export is [`tokens.css`](./tokens.css). Tailwind and shadcn variables continue to map through `app/globals.css`.

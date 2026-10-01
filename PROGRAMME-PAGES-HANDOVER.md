# Programme pages handover — 1 October 2026

## Completion matrix

| Page | Route | Completed and corrected |
|---|---|---|
| Canada Express Entry | `/[locale]/programmes/canada-express-entry` | Three Express Entry programmes, FSW 67-point table, separate CRS explanation, documents, process, FAQs and preselected assessment. |
| Australia Permanent Residency | `/[locale]/programmes/australia-skilled-migration` | Subclasses 189 and 190 identified as permanent; subclass 491 identified as provisional with a potential 191 pathway. |
| Australia Work Visa | `/[locale]/programmes/australia-work-visas` | Temporary subclass 482 and permanent subclass 186 differentiated; employer sponsorship and nomination qualified. |
| Germany Nursing Opportunities | `/[locale]/programmes/germany-nursing` | Regulated-profession recognition, general B2 recognition context and recognition-partnership alternative; unsupported salary package removed. |
| Germany Car Mechanic Opportunities | `/[locale]/programmes/germany-car-mechanics` | Qualified-worker and recognition-partnership routes separated; no universal A1 or fixed-experience claim. |
| Sweden Work Opportunities | `/[locale]/programmes/sweden-work-permit` | Employer-led permit, salary/insurance conditions and current salary-rule wording; copied German-language claim removed. |
| Portugal Work Opportunities | `/[locale]/programmes/portugal-work-residence` | Employed residence, temporary-work and independent-work routes distinguished; no “open permit” or citizenship promise. |
| Canada C11 Entrepreneur Program | `/[locale]/programmes/canada-c11` | Significant-benefit work-permit context, controlling interest, up-to-18-month guidance and no fixed statutory investment claim. |
| USA EB-5 Investor Program | `/[locale]/programmes/usa-eb5` | Current investment thresholds, ten-job requirement, conditional permanent residence, source-of-funds/risk warnings and attorney boundary. |
| USA E-2 Treaty Investor Program | `/[locale]/programmes/usa-e2` | Treaty nationality, substantial at-risk investment, active enterprise/control and temporary nonimmigrant outcome. |

Every page has English and Arabic metadata, hero, overview, route/status explanation, eligibility, applicable benefits, confirmed documents, numbered process, Plan B advisory boundary, program-specific FAQs, related programs and consultation CTA. Empty or speculative sections were not added.

## Content and factual treatment

- The existing client-derived inventory was retained where it could be stated accurately, then reorganised into complete program pages.
- The referenced `About US.pdf` and competitor screenshots were not present at the supplied paths during this phase. They could not be visually re-audited. This is the principal source-comparison gap.
- The Canadian 67-point Federal Skilled Worker grid is labelled as an eligibility grid, not the Comprehensive Ranking System used to rank eligible Express Entry profiles.
- Australian permanent, provisional and temporary statuses are stated explicitly.
- Sweden no longer contains the inapplicable “German A1” requirement.
- Portugal is presented as several named work/residence routes; requirements are not attributed to a single route unless confirmed.
- C11 does not promise permanent residence or publish an unsupported fixed CAD 200,000 minimum.
- German pay, overtime, bonuses, leave and training are described as employer-specific. No vacancy or salary package is advertised.
- EB-5 is explained as an immigrant investor route that may lead to conditional permanent residence; E-2 is a temporary treaty-investor classification and is not a Green Card programme.

## Official sources used

- Canada: [IRCC Express Entry overview](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html), [Federal Skilled Worker selection factors](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html), and [CRS criteria](https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html).
- Australia: [SkillSelect](https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect), [skills assessments](https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment), [employer-sponsored visa comparison](https://immi.homeaffairs.gov.au/visas/employing-and-sponsoring-someone/sponsoring-workers/learn-about-sponsoring/visa-options), and [Skills in Demand subclass 482](https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/skills-in-demand-visa-subclass-482).
- Germany: [official nursing guidance](https://www.make-it-in-germany.com/en/working-in-germany/professions-in-demand/nursing), [recognition partnerships](https://www.make-it-in-germany.com/en/service/newsletter/recognition-partnerships), and [qualified professionals](https://www.make-it-in-germany.com/en/visa-residence/types/work-qualified-professionals).
- Sweden: [employee work permits](https://www.migrationsverket.se/en/you-want-to-apply/work/employee-or-self-employed/employees.html) and [current salary requirements](https://www.migrationsverket.se/en/word-explanations/salary-requirements-for-a-work-permit.html).
- Portugal: [AIMA work routes](https://aima.gov.pt/pt/trabalhar) and [temporary work under one year](https://www.gov.pt/servicos/pedir-um-visto-de-estada-temporaria-para-trabalho-subordinado-ou-independente).
- Canada C11: [IRCC significant-benefit guidance update](https://www.canada.ca/en/immigration-refugees-citizenship/corporate/publications-manuals/operational-bulletins-manuals/updates/2025-business-owners-temp-residence-imp.html).
- United States: [USCIS EB-5 overview](https://www.uscis.gov/eb-5), [USCIS EB-5 policy manual](https://www.uscis.gov/policy-manual/volume-6-part-g-chapter-2), and [Department of State E-2 guidance](https://travel.state.gov/content/travel/en/us-visas/employment/treaty-trader-investor-visa-e.html).

Rules and figures remain subject to government change. The pages link readers to their primary sources and avoid approval, employment and return guarantees.

## Images

Existing destination, clinical and workshop imagery was retained after load/crop/alt-text checks. Three previously duplicated generic business images were replaced with original, program-specific generated assets:

- `public/images/programmes/canada-c11-operations.png`
- `public/images/programmes/usa-eb5-investment.png`
- `public/images/programmes/usa-e2-enterprise.png`

The prompts requested realistic editorial business photography without logos, passport imagery, text overlays or approval symbolism. All three are local project assets rather than copied competitor media.

## Verification

- Production build and TypeScript: passed.
- 26 full-page browser cases: all ten English pages at 1440 and 390 px, plus representative Arabic pages at both sizes. No overflow; images loaded with alt text and cover cropping; required section counts, assessment selection, sticky offsets and the Canada table passed.
- 56 responsive cases: every English page at 320, 375, 414, 768 and 1280×800, plus representative Arabic at 320 and 768. No horizontal overflow, wrapped click targets or below-fold primary hero CTA failures.
- Assessment-offer interaction: no popup over an open navigation drawer; it opens after the drawer closes and scrolling resumes; dismissal survives further scrolling and reload for the browser session.
- Preview PNGs and machine-readable results are in `artifacts/programme-pages/`.

## Remaining client and production gaps

- Reattach the source PDF/screenshots if an exact page-by-page comparison with that material is required.
- Confirm any specific German employer, vacancy, salary, accommodation or benefit offer before publishing it; none is claimed now.
- Confirm the specific Portugal employment arrangement before promoting one route as the client’s primary route.
- Confirm individual E-2 treaty nationality and reciprocity validity per applicant.
- No testimonial, partnership, placement, approval or investment-return claim was introduced.
- `NEXT_PUBLIC_EMAIL`, `NEXT_PUBLIC_PHONE`, `NEXT_PUBLIC_WHATSAPP`, social URLs, address and opening hours remain client-supplied configuration items. Current demo contact values are visibly marked and non-actionable.
- `DATABASE_URL` and `RATE_LIMIT_SECRET` are still required for production enquiry persistence. Without them, the forms honestly report a configuration error and never display simulated success.
- Nothing was deployed or published.

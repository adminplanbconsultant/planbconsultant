# Investment programme pages — handover and review

Local implementation only (7 Nov 2026). Nothing was deployed or published, and no enquiry was sent to the live Apps Script, sheet or office inbox.

Source: client transcript "Plan B Consultant — Investment service pages" (Appendix A of the implementation prompt), stored verbatim in `lib/investment-programmes.ts` (`source` field of each programme).

**Layout reference:** the Passport Legacy screenshot was not attached to the request, so it was not seen. The pages follow the 15-section sequence written in the implementation prompt. No figures, copy, images or layout were taken from any reference site.

**Publication status:** all 18 detail pages are on **review hold**. They render locally but are `noindex` and excluded from the sitemap (`publishReady:false` → `eligiblePath()` in `lib/seo.ts`). To release a page after the client confirms its figures, set `publishReady:true` for that programme. Both overview pages stay indexable and show no figures.

---

## 1. Route inventory

Overviews (reused existing URLs; content rebuilt):

| Overview | EN | AR | Status |
|---|---|---|---|
| Citizenship by Investment | `/en/services/citizenship-by-investment` | `/ar/services/citizenship-by-investment` | Reused |
| Residency by Investment | `/en/services/residency-by-investment` | `/ar/services/residency-by-investment` | Reused (still links to the existing U.S. EB-5 page) |

Detail pages (all new; none of these destinations had an investment page before):

| # | Programme | Category | EN URL | AR URL | Enquiry id | Status |
|---|---|---|---|---|---|---|
| 1 | Antigua & Barbuda | Citizenship | `/en/services/citizenship-by-investment/antigua-and-barbuda` | `/ar/services/citizenship-by-investment/antigua-and-barbuda` | `cbi-antigua-barbuda` | New · review hold |
| 2 | Dominica | Citizenship | `/en/services/citizenship-by-investment/dominica` | `/ar/services/citizenship-by-investment/dominica` | `cbi-dominica` | New · review hold |
| 3 | Grenada | Citizenship | `/en/services/citizenship-by-investment/grenada` | `/ar/services/citizenship-by-investment/grenada` | `cbi-grenada` | New · review hold |
| 4 | St. Kitts & Nevis | Citizenship | `/en/services/citizenship-by-investment/st-kitts-and-nevis` | `/ar/services/citizenship-by-investment/st-kitts-and-nevis` | `cbi-st-kitts-nevis` | New · review hold |
| 5 | St. Lucia | Citizenship | `/en/services/citizenship-by-investment/st-lucia` | `/ar/services/citizenship-by-investment/st-lucia` | `cbi-st-lucia` | New · review hold |
| 6 | Naoero (Nauru) | Citizenship | `/en/services/citizenship-by-investment/nauru` | `/ar/services/citizenship-by-investment/nauru` | `cbi-nauru` | New · review hold |
| 7 | Egypt | Citizenship | `/en/services/citizenship-by-investment/egypt` | `/ar/services/citizenship-by-investment/egypt` | `cbi-egypt` | New · review hold |
| 8 | Sao Tome & Principe | Citizenship | `/en/services/citizenship-by-investment/sao-tome-and-principe` | `/ar/services/citizenship-by-investment/sao-tome-and-principe` | `cbi-sao-tome-principe` | New · review hold |
| 9 | Turkey | Citizenship | `/en/services/citizenship-by-investment/turkey` | `/ar/services/citizenship-by-investment/turkey` | `cbi-turkey` | New · review hold |
| 10 | Vanuatu | Citizenship | `/en/services/citizenship-by-investment/vanuatu` | `/ar/services/citizenship-by-investment/vanuatu` | `cbi-vanuatu` | New · review hold |
| 11 | Cyprus | Residency | `/en/services/residency-by-investment/cyprus` | `/ar/services/residency-by-investment/cyprus` | `rbi-cyprus` | New · review hold |
| 12 | Greece | Residency | `/en/services/residency-by-investment/greece` | `/ar/services/residency-by-investment/greece` | `rbi-greece` | New · review hold |
| 13 | Italy | Residency | `/en/services/residency-by-investment/italy` | `/ar/services/residency-by-investment/italy` | `rbi-italy` | New · review hold |
| 14 | Malta | Residency | `/en/services/residency-by-investment/malta` | `/ar/services/residency-by-investment/malta` | `rbi-malta` | New · review hold |
| 15 | Portugal | Residency | `/en/services/residency-by-investment/portugal` | `/ar/services/residency-by-investment/portugal` | `rbi-portugal` | New · review hold. Separate from the existing work page `/programmes/portugal-work-residence`, which is unchanged |
| 16 | Switzerland | Residency | `/en/services/residency-by-investment/switzerland` | `/ar/services/residency-by-investment/switzerland` | `rbi-switzerland` | New · review hold |
| 17 | Panama | Residency | `/en/services/residency-by-investment/panama` | `/ar/services/residency-by-investment/panama` | `rbi-panama` | New · review hold |
| 18 | UAE | Residency | `/en/services/residency-by-investment/uae` | `/ar/services/residency-by-investment/uae` | `rbi-uae` | New · review hold |

Preserved: `/programmes/citizenship-investment` (the old general citizenship page, still `noindex`), the U.S. EB-5 and E-2 pages, every `/destinations/*` page and every other published URL. The header link that pointed to `/programmes/citizenship-investment` now points to the citizenship overview.

Navigation: both categories and all 18 destinations sit in the existing **Business Immigration** dropdown (desktop) and its mobile group, which previously held an "Investment Pathways" column. No item was added to the top bar: a ninth top-level item made "Home" and "Contact Us" overlap at 1440px, the width where the desktop nav appears. Each list ends with an "All … programmes" link to its overview. The footer links to the residency overview.

---

## 2. Source-coverage checklist

Where each source item appears:

- **Title (18):** the H1 on each page. English is the exact source title (for example "Citizenship by Investment: Antigua & Barbuda"); Arabic is "الجنسية/الإقامة عن طريق الاستثمار: ‹country›". The QA script checks that each page has exactly one H1 and that its text matches.
- **Breadcrumb (18):** shown as "Plan B Consultant / ‹Category› (link to overview) / ‹Country›". BreadcrumbList JSON-LD has the same three levels.
- **Full description (18):** shown unshortened in "About ‹country›" (`#overview`). English is the source paragraph character for character. Arabic is a full translation of it. The QA script checks the whole paragraph is present in both locales.
- **Fact entries (72):**
  - The **"Programme at a glance"** cards (`#at-a-glance`) show all four facts.
  - Minimum Capital is also shown under Requirements → "Before approval" and under Investment options. Each route and its amount is on its own line.
  - Physical Presence is also shown under Requirements and in an FAQ.
  - Processing Window is also shown in an FAQ, beside its timing trigger.
  - The QA script checks every route label, amount, processing value, presence value and advantage in both locales.

Result: 18/18 titles, 18/18 breadcrumbs and 18/18 descriptions are rendered. **71/72 fact entries are rendered; 1 is held** (see table).

| Programme | Minimum Capital | Processing | Presence | Primary Advantage | Rendering notes |
|---|---|---|---|---|---|
| Antigua & Barbuda | ✔ 2 lines: NDF donation US$ 230,000 / Real estate 300,000 | ✔ | ✔ (shown as a condition for keeping status) | ✔ (also shown as family eligibility) | Real-estate currency not stated; shown as "300,000" with no currency added |
| Dominica | ✔ 2 lines: EDF US$ 200,000 / Real estate (amount not listed) | ✔ | ✔ | ✔ | The fund amount is **not** applied to the property route |
| Grenada | ✔ 2 lines: NTF US$ 235,000 / Real estate 270,000 | ✔ | ✔ | ✔ marked "Separate application", linked to the existing E-2 page | Real-estate currency not stated |
| St. Kitts & Nevis | ✔ 2 lines: SISC US$ 250,000 / Real estate 325,000 | ✔ | ✔ | ✔ | Real-estate currency not stated |
| St. Lucia | ✔ NEF US$ 240,000 | ✔ | ✔ | ✔ | The other routes named in the description are listed with "amounts not listed on this page" |
| Naoero (Nauru) | ✔ | ✔ | ✔ | **HELD** – not rendered | "unparalleled asset and identity shielding" is unsupported and compliance-sensitive (it could read as identity concealment). Kept in the content record only |
| Egypt | ✔ one line, as supplied (deposit **or** state real estate, US$ 250,000) | ✔ | ✔ | ✔ | The source does not say whether the amount applies to each route, so it is not split into two figures |
| Sao Tome & Principe | ✔ | ✔ | ✔ | ✔ | — |
| Turkey | ✔ US$ 500,000 labelled "route not specified in the summary" | ✔ | ✔ | ✔ marked "Separate application", linked to the E-2 page | The source gives no route; the description implies real estate, but no route was invented |
| Vanuatu | ✔ | ✔ | ✔ | ✔ | — |
| Cyprus | ✔ | ✔ | ✔ (keeping status) | ✔ | — |
| Greece | ✔ range €250,000 to €800,000 kept as a range | ✔ | ✔ | ✔ | — |
| Italy | ✔ "€250,000+" (plus sign kept) | ✔ | ✔ (residence condition) | ✔ marked "Separate application" | The flat tax is presented as a tax regime, not an investment |
| Malta | ✔ "Approx. €110,000" ("Approx." kept) | ✔ | ✔ | ✔ | — |
| Portugal | ✔ | ✔ | ✔ (keeping status) | ✔ marked "Separate application" | — |
| Switzerland | ✔ CHF 250,000, card labelled **"Annual tax commitment"** and the route marked "(a yearly tax payment)" | ✔ | ✔ (residence condition) | ✔ | Source label "Minimum Capital" is kept in the record. The page does not present a tax payment as capital |
| Panama | ✔ one line, as supplied (real estate **or** fixed deposit, US$ 300,000) | ✔ ("3 - 4 Months" kept) | ✔ (keeping status) | ✔ | — |
| UAE | ✔ 2 lines: Real estate AED 2,000,000 / Business setup AED 50,000 | ✔ | ✔ (keeping status) | ✔ | — |

**Arabic check.** Every amount is the identical LTR string from the source, isolated with `<bdi dir="ltr">`. Currency symbol, digits, "Approx.", "+" and ranges are unchanged, and the QA script asserts each amount appears on the Arabic page. Timing triggers and conditions were translated with the same scope:

- "from submission" → من تاريخ تقديم الطلب
- "from asset transfer" → من تاريخ تحويل الأصل
- "from background clearance" → من تاريخ اجتياز التحقق من الخلفية
- "once every two years" → مرة واحدة على الأقل كل سنتين
- "7 days per year" → 7 أيام سنوياً
- "children up to 30 and parents over 55" → الأبناء حتى سن 30 والوالدين فوق سن 55

Arabic numerals in running text are Western digits, as elsewhere on the site.

**Page copy that is not from the transcript.** All of it is neutral and makes no new factual claim:

- hero introductions, section headings, the "how to start with Plan B" steps
- FAQ answers, which are built only from the four facts plus "approval is not guaranteed"
- country profiles, which are trimmed from the source description
- the overview explanations of what citizenship and residency mean
- metadata descriptions, which contain no figures, timings, guarantees, travel counts or tax claims

---

## 3. Review table — what the client needs to confirm

Each programme was checked against its official site on **7 Nov 2026** where one could be reached. "Official evidence" lists only pages that were actually opened. Where none could be reached, the secondary-source figures are leads to check, not evidence. **No client figure was changed**; all differences are flagged here.

### 3a. Conflicts and gaps in the client's content

| Programme | Claim at issue | Source wording | Official evidence (opened 7 Nov 2026) | Client to confirm |
|---|---|---|---|---|
| Antigua & Barbuda | Real-estate currency missing; stay requirement contradicts the description; family ages unverified | "Real Estate 300,000"; description: "without the burden of … personal physical presence mandates" vs table "Minimum 5 days stay … first 5-year cycle" | cip.gov.ag home page opened; it shows no figures. Figures not confirmed | Currency and current amount for each route; which stay statement is correct; dependant age limits; "12 Months from submission" (the reference graphic's six-month figure was **not** used) |
| Dominica | Real-estate amount missing; processing time | "US$ 200,000 (… Fund contribution) or Real Estate"; "6 Months from asset transfer" | [CBIU – costs and fees](https://www.cbiu.gov.dm/news/dominica-citizenship-cost-and-fees/): EDF single applicant US$200,000; real estate minimum US$200,000; property held at least 3 years (5 if resold under the Programme). [CBIU – investment options](https://www.cbiu.gov.dm/investment-options/): approval "typically 3 – 4 months" (FAQ) / "3-6 months from application submission" | Whether to show US$200,000 for real estate; processing wording and its trigger |
| Grenada | Real-estate amount and currency; "Direct eligibility" for E-2 | "Real Estate 270,000"; "Direct eligibility to apply for the … E-2 … Visa" | [IMA Grenada – becoming a citizen](https://www.imagrenada.gd/becoming-a-citizen/): NTF US$235,000 for an individual; the real-estate table reads "USD 350,000 / 270,000" plus a US$50,000 government fee (ambiguous); no processing time stated | Real-estate amount and conditions. E-2 is a separate U.S. application; the page says so |
| St. Kitts & Nevis | Real-estate amount needs context; processing | "Real Estate 325,000"; "6 Months standard processing" | [CIU – SISC](https://www.ciu.gov.kn/sustainable-island-state-contribution/): US$250,000 for the main applicant or a family of up to four; decision on approval-in-principle within 120–180 days of acknowledgement. CIU real-estate page: US$325,000 (fractional, resaleable after 7 years) or US$600,000 full ownership | Whether to add the fractional/full-ownership distinction; processing wording |
| St. Lucia | "investment" vs contribution; other route amounts | "US$ 240,000 (National Economic Fund investment)" | [CIP Saint Lucia – investment options](https://www.cipsaintlucia.com/citizenship-by-investment): NEF US$240,000 (applicant with up to three qualifying dependants); National Action Bond US$300,000 (held 5 years); real estate US$300,000; enterprise options | Whether to call NEF a contribution; whether to add bond, real-estate and enterprise amounts |
| Naoero (Nauru) | Price expiry; processing; advantage held | "US$ 90,000 (Direct Sovereign Economic Contribution)"; "6 Months"; "identity shielding" | [ECRCP – contribution](https://ecrcp.gov.nr/contribution): US$90,000 for a principal applicant, a **limited-time offer until 31 Dec 2026**. [ecrcp.gov.nr](https://ecrcp.gov.nr/): decisions "typically … within three to four months"; no minimum stay or visit requirements | Wording after 31 Dec 2026; processing time; replacement wording for the held advantage |
| Egypt | Amount per route; "deposit" | "US$ 250,000 (Direct Central Bank deposit or state real estate purchase)" | No official page reached. Secondary reports of the 2023 decree mention US$250,000 non-refundable to the treasury, US$300,000 property and US$500,000 deposit (leads only) | The correct amount and nature (donation, deposit or purchase) of each route — a donation must not be described as a deposit |
| Sao Tome & Principe | Programme status and amounts | "US$ 90,000 (National Infrastructure Development allocation)" | No official page reached; secondary sources report US$90,000 | Official source and legal basis; fees and family amounts |
| Turkey | Amount, route, yield and "immediate" E-2 | "US$ 500,000"; "High-yield … immediate US E-2 visa eligibility"; description: "yield strong rental returns … brief holding period" | No official page reached. Secondary sources consistently report US$400,000 property with a 3-year no-sale commitment (lead only) | Route and amount; remove or support yield, holding-period and "immediate" claims. E-2 is a separate U.S. application |
| Vanuatu | Superlatives and tax claims | "fastest … globally"; "complete absence of income, wealth, or corporate taxes" | No official page reached; secondary sources report US$130,000 (single applicant) | Official source; whether to keep "fastest" claims (not publish-ready unless supported) |
| Cyprus | Tax rate and processing | "corporate tax rate of 12.5%"; "4–6 Months from property registration" | No official page reached; secondary sources match €300,000 and the two-year visit rule | Current corporate tax rate (it may have changed); official source |
| Greece | Tier definition; "full access" to Schengen | "€250,000 to €800,000 (Tiered by regional real estate zones)"; "Immediate, full access to Schengen Area" | No official page reached. Secondary sources say €250,000 applies only to conversion/restoration properties, with €400,000/€800,000 tiers by area (lead only) | Tier conditions; Schengen wording (short stays are limited, not "full access") |
| Italy | Flat-tax amount; route amounts | "Eligibility for Italy's premium €100,000 flat annual tax"; "€250,000+" | No official page reached. Several law-firm sources report the flat tax rising to €300,000 for new residents from 1 Jan 2026 (lead only) | Current flat-tax amount; investor-visa amount for each route |
| Malta | What "Approx. €110,000" covers | "Approx. €110,000 (Combined capital requirements including property lease)" | [Legal Notice 310 of 2024](https://residencymalta.gov.mt/wp-content/uploads/2024/11/Legal-Notice-310-of-2024.pdf) (in force 1 Jan 2025): administration fee €50,000; contribution €60,000 (rented) or €30,000 (owned property); minimum rent €14,000 a year; minimum purchase €375,000; dependant fees extra | €50,000 + €60,000 = €110,000 **excludes** rent. Confirm wording, and whether to show the owned-property route |
| Portugal | Fund amount, fund type, citizenship timing | "€200,000 (… capital venture funds)"; "full EU Citizenship after 5 years" | No official page reached. Secondary sources consistently report €500,000 in qualifying funds (lead only) | Amount and fund rules; current nationality-law timing. Citizenship is a separate application (shown as such) |
| Switzerland | Tax figure is a tax, not capital | "CHF 250,000 (Annual cantonal lump-sum tax package)" | No official page reached. Law-firm sources describe a federal minimum tax **base** of CHF 400,000 (a base, not a tax amount) and cantonal minimums (lead only) | Whether CHF 250,000 is a tax amount or a tax base, and for which canton |
| Panama | Amounts per route | "US$ 300,000 (Real estate or fixed bank deposit models)" | [MICI – Executive Decree 722 (English)](https://mici.gob.pa/wp-content/uploads/2021/10/de-722-english.pdf): real estate B/.500,000 (B/.300,000 only for the first 24 months after entry into force); securities B/.500,000; fixed-term deposit B/.750,000. Later amendments not checked | Current amounts; the deposit is not US$300,000 under Decree 722 |
| UAE | Visa length for real estate; business-setup amount; absence rule | "10-year renewable residency"; "Business Setup AED 50,000"; "must enter … once every 12 months" | [u.ae – Golden visa](https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa): real-estate investors get **5 years** with minimum AED 2 million; no AED 50,000 business figure stated; holders may stay outside beyond six months, with no 12-month rule stated | Visa length per route; source for AED 50,000 and the 12-month entry rule |

### 3b. Sections not rendered because the source has no content for them

| Section | Programmes affected |
|---|---|
| Legal basis / programme authority link | Shown only for Dominica, Grenada, St Kitts & Nevis, St Lucia, Nauru, Malta, Panama and UAE (official pages opened). Missing for Antigua & Barbuda, Egypt, Sao Tome & Principe, Turkey, Vanuatu, Cyprus, Greece, Italy, Portugal and Switzerland |
| Official application sequence | All 18. Plan B's own enquiry steps are shown instead, labelled as not the government's process |
| Family eligibility | All except Antigua & Barbuda |
| Government fees and document lists | All 18. The pages say these are not listed and must be confirmed |

### 3c. Features not implemented

| Feature | Status |
|---|---|
| Destination hero image | Only Portugal has one (the existing licensed Lisbon photo, credited on the page). The other 17 use a deliberate brand layout with the ISO code. **Asset need:** licensed or client-owned photos for 17 destinations |
| Second destination image (section 3) and wide image (section 6) | Not available. Section 6 uses a brand-colour band |
| Country flags in navigation | Not added; no licensed flag files for these 18 countries are on record (`FLAG-ASSET-SOURCES.md`) |
| Live Apps Script | `Code.gs` allow-lists were regenerated (31 programmes). The **live web app must be redeployed** before the Programme column can record the 18 new ids from the optional "Your plans" step. The required contact step is unaffected |

---

## 4. Files changed

New:

- `lib/investment-programmes.ts` — structured content, verbatim source, review flags, official links
- `lib/enquiry-programmes.ts`
- `components/investment-page.tsx` — shared template
- `components/investment-overview.tsx`
- `scripts/investment-pages-qa.mjs`, `scripts/investment-screens.mjs`
- `artifacts/investment-programmes/` — screenshots and QA results
- this file

Modified:

- `lib/seo.ts` — routes, metadata, breadcrumb JSON-LD, review hold from indexing
- `lib/seo-copy.ts`, `lib/service-overviews.ts` — overview titles and descriptions
- `components/site.tsx` — routing; footer label
- `components/site-header.tsx` — navigation
- `components/assessment.tsx`, `components/assessment-popup.tsx`, `lib/enquiry-schema.ts` — programme context and allow-list
- `scripts/sync-apps-script-lists.mjs`, `integrations/google-apps-script/Code.gs` (regenerated)
- `scripts/smoke-test.mjs`, `scripts/responsive-audit.mjs` (adds `ONLY_INVESTMENT=1`)
- `app/globals.css` — `inv-*` styles using tokens; Business panel layout

## 5. Checks run (all against local builds)

| Check | Result |
|---|---|
| `npm run typecheck` | Pass. The project has no ESLint configuration, so there was no lint step |
| `node scripts/sync-apps-script-lists.mjs --check` | Pass |
| `npm run build` | Pass — 212 static pages (176 before + 36 new) |
| `scripts/smoke-test.mjs` | 204 bilingual pages, 404s and API validation pass |
| `scripts/investment-pages-qa.mjs` | 36 detail pages + 4 overview views pass 1,630 checks. Covers: one H1 with exact text; full description; every route, amount and fact; the held item absent; breadcrumb link; language switch keeps the programme; canonical; noindex while held; all 8 anchors; assessment preselects the programme; consultation CTA; related links exclude the current page and list all 17 others; snippet has no figures or claims; held pages not in the sitemap |
| `npm run test:enquiries` | 29 mocked tests pass |
| Mocked stack (`mock-enquiry-stack.mjs`) | Contact step → 201 saved. "Your plans" update with `programme: cbi-dominica` → 200 updated. Unknown programme → 400 |
| `ONLY_INVESTMENT=1 responsive-audit.mjs` at 320/375/414/768/1024, EN+AR (200 views) | 0 horizontal page overflow |
| Screenshots in `artifacts/investment-programmes/` | Overviews; Antigua EN 1440 / AR 390; UAE (multiple amounts) EN 390 / AR 1440; Italy (long requirements) AR 390; Switzerland; Portugal image hero; Dominica (unlisted amount); desktop navigation EN/AR at 1440; mobile navigation EN/AR |
| Anchor offset | Clicking "At a glance" leaves the heading 59px below the sticky header and section nav |
| Desktop top bar at 1440 | EN fits exactly (886/886px). AR is 18px over (877px available, 895px used). The Arabic top-bar items and labels were not changed, but the "before" width was not measured, so this is not confirmed as pre-existing. Worth a visual check |

## 6. Local preview

```
npm run build
npx next start -p 3100
# open http://localhost:3100/en/services/citizenship-by-investment
#      http://localhost:3100/ar/services/residency-by-investment
TEST_BASE_URL=http://localhost:3100 node scripts/investment-pages-qa.mjs
```

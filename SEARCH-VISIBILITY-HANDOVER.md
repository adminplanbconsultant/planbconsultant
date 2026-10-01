# Plan B Consultant search visibility handover

Review date: 2 October 2026. Production origin: https://planbconsultant.com. No deployment, account creation, directory submission, publication or outreach was performed.

## Implemented

- Shared route registry drives page validation, static generation, metadata and sitemap. All existing navigation and content routes remain available.
- Unique bilingual titles and descriptions, absolute self-canonicals, reciprocal `en` / `ar` hreflang, localized Open Graph metadata and server-rendered HTML language/direction. No `x-default`: the root permanently redirects to English; it is not a language selector.
- No trailing slash on content routes. `/` permanently redirects directly to `/en`; Next.js normalizes trailing slashes with 308 responses. No replaced content routes, therefore no speculative legacy redirects were added.
- Program, service, country and editorial metadata use their own data. Service overviews target assistance/scope; program pages target route requirements/status; destination pages target comparison/navigation. Citizenship program and service titles no longer collide.
- A connected Organization / WebSite / WebPage / BreadcrumbList graph uses stable absolute IDs. Service entities cover program/service pages; Article entities cover the three genuine editorial guides. No LocalBusiness, fabricated author, rating, review, coordinates, hours or address. LinkedIn/Facebook are omitted until supplied. Only explicitly configured HTTPS social URLs enter `sameAs`.
- Review dates are tied to route-guidance checks, not automatically generated dates or invented professional reviewers. Source references appear beside program overviews as well as in the source section. Existing eligibility, document, process and FAQ sections remain visible. Regulated legal-service boundaries are explained in both languages.
- Staging is `noindex, follow`, using metadata and HTTP `X-Robots-Tag`; Vercel preview stays noindex even when the indexing flag is true. Public pages remain crawlable so crawlers can see the directive. API crawling is disallowed. Robots rules do not secure private routes or guarantee de-indexing; use authentication for private environments.
- Tracking and enquiry parameters do not create sitemap entries or change page canonicals. The consultation `programme` parameter can preselect an enquiry while its canonical stays the clean consultation URL. No public parameter-based filter routes were found.
- Google/Bing verification values are optional environment configuration. No IDs were invented. Domain verification for Search Console still requires a DNS record supplied by Google.
- Conversion integration is a local `planb:conversion` CustomEvent. No analytics vendor is installed, loaded or contacted. Payloads contain only event name, language and numbered step. Names, phone/email, messages, nationality, budgets, program choice, enquiry references and URLs are not emitted. Existing form storage remains unchanged.
- Responsive WebP derivatives of existing hero/program images preserve the approved composition and original source files. Responsive image widths and matching hero preload use the same source set. Image encoding byte reductions are measured separately from browser rendering performance.
- Primary page markup now renders in server components; destination filtering, forms, menus, carousel, splash and popup remain client components. The existing details-menu close behavior lives in a narrow client observer. This reduces the shared JavaScript payload without changing navigation or interactions.

## Initial audit and production comparison

`artifacts/search-visibility/before-inventory.json` inventories the pre-edit rendered build: 168 successful bilingual routes; zero indexable pages because the indexing flag was off; empty sitemap; root redirect 307; shared generic descriptions; duplicate citizenship titles; Arabic HTML initially `lang=en` without server-side RTL; no localized pages statically generated. Primary content and navigation were already in server HTML, including when JavaScript was unavailable. Forms, splash and assessment popup do not gate HTML delivery.

Read-only production HTTP checks on 2 October 2026 found a **Namecheap Parking Page at `/` (200)** and **404** at `/en`, `/ar`, `/robots.txt` and `/sitemap.xml`. This is not the local Next.js site. Public-search retrieval also failed to open the production site. DNS/hosting must eventually point to the approved deployment before these local improvements can affect public crawling. Deployment remains outside this task.

## Route policy and intent ownership

168 generated localized content pages correspond to 84 paths × two languages. In a production-indexing build, 86 pages are eligible: 43 paths × two languages. The difference is 80 thin country pages (40 countries × two languages) and the two generic citizenship-program enquiry pages. They remain successful, self-canonical, `noindex, follow` navigation pages. The six documented country destinations are Canada, Australia, Germany, Sweden, Portugal and United States. A country in the navigation is not proof of a confirmed distinct program. No mass-generated routes were added.

Keep the citizenship service overview for service-scope intent, and exclude `/programmes/citizenship-investment` until a country route and current sources are supplied. Home owns local immigration-consultancy intent; `/services` owns the service directory. Service overviews introduce the type of assistance and link to requirements on program pages; do not duplicate route articles on those overviews. The permanent-residency service addresses documentation/renewal support, not a competing Express Entry explanation.

Full per-route titles, descriptions, heading inventory, H1 count, canonical, language equivalents, JSON-LD, internal links, response and indexability are in the before/after JSON inventories. The CSV inventory and keyword map are generated from those results. Counts come from the route registry, successful HTTP responses and `.next/prerender-manifest.json`, not build-log totals. Framework error pages, root redirect, API and metadata endpoints are reported separately and are not content-page counts.

## Keyword-to-page map

Phrases reflect qualitative search intent, not measured demand, ranking or traffic. Each target exists in `/en` and `/ar` with the same path suffix.

| Primary intent | English phrase | Natural Arabic phrase | Path suffix |
|---|---|---|---|
| Local consultancy | immigration consultancy in Kuwait | استشارات الهجرة في الكويت | home |
| Firm and approach | Plan B Consultant Kuwait | بلان بي كونسلتنت الكويت | about |
| Contact | contact Plan B Consultant | رقم بلان بي للاستشارات | contact |
| Initial enquiry | immigration consultation Kuwait | استشارة هجرة من الكويت | consultation |
| Skilled-route comparison | skilled migration assistance | استشارة هجرة الكفاءات | services/skilled-immigration |
| Canadian route requirements | Canada Express Entry from Kuwait | الهجرة إلى كندا من الكويت إكسبريس إنتري | programmes/canada-express-entry |
| Australian route selection | Australia skilled migration from Kuwait | شروط الهجرة إلى أستراليا من الكويت | programmes/australia-skilled-migration |
| Sponsored Australian work | Australia sponsored work visa | تأشيرة عمل أستراليا بعرض وظيفي | programmes/australia-work-visas |
| Nursing recognition/work | Germany nursing pathway from Kuwait | العمل في ألمانيا للممرضين من الكويت | programmes/germany-nursing |
| Trade qualifications/work | Germany car mechanic pathway | العمل في ألمانيا لميكانيكي السيارات | programmes/germany-car-mechanics |
| Swedish employment permission | Sweden work permit requirements | شروط تصريح العمل في السويد | programmes/sweden-work-permit |
| Portuguese route selection | Portugal work and residence | تأشيرة العمل والإقامة في البرتغال | programmes/portugal-work-residence |
| Canadian business permission | Canada C11 business work permit | تصريح عمل كندا C11 لأصحاب الأعمال | programmes/canada-c11 |
| Immigrant investment | USA EB-5 investor immigration | الإقامة في أمريكا عبر استثمار EB-5 | programmes/usa-eb5 |
| Treaty investor permission | USA E-2 treaty investor | تأشيرة المستثمر E-2 لأمريكا | programmes/usa-e2 |
| Business advisory scope | business immigration assistance Kuwait | استشارات هجرة الأعمال في الكويت | services/business-immigration |
| Investment-residence advisory scope | investment residency consultation | استشارة الإقامة عن طريق الاستثمار | services/residency-by-investment |
| Study preparation scope | student visa assistance Kuwait | المساعدة في تجهيز تأشيرة الدراسة من الكويت | services/study-abroad |
| Student preparation checklist | student visa documents and process | مستندات وخطوات تأشيرة الطالب | programmes/study-visas |
| Visit assistance scope | visit visa assistance Kuwait | المساعدة في طلب تأشيرة زيارة من الكويت | services/visit-visas |
| Visit preparation checklist | visitor visa preparation | تجهيز مستندات تأشيرة الزيارة | programmes/visit-visas |
| Consultation preparation | what to bring to immigration consultation | كيف أستعد لاستشارة الهجرة | resources/prepare-for-your-consultation |
| Career service distinction | job search versus work visa | الفرق بين البحث عن وظيفة وتأشيرة العمل | resources/job-search-or-work-visa |
| Document organisation | organise immigration documents | تنظيم مستندات طلب الهجرة | resources/organise-your-documents |

Public search samples used English and Arabic local-consultancy/Canada/Australia queries. Results included destination government guidance and users asking about qualifications, points, advisers and work permission. They support the inferred intent split above; they do not establish keyword volume or a competitive ranking. The Arabic Australian embassy result contained old department names and procedures, so it was not used for current application instructions. Official authority pages, not competitor marketing, support route facts.

## Resource and scalable-content plan

Existing resource guides remain bilingual and indexable. Candidate topics:

1. FSW points versus CRS: merge into the existing Express Entry explanation and points table. No duplicate guide route needed now.
2. Australia 189/190/491: keep the existing route/status comparison together on the skilled migration page.
3. Germany nursing recognition and language: maintain the nursing page and current federal recognition sources; a separate guide requires more distinct, fully bilingual recognition-step material.
4. EB-5 versus E-2: proposed comparison, pending current USCIS review and independent legal confirmation of details before a standalone article. Avoid stale investment figures in cached official pages.
5. Preparing for consultation: already covered by the existing editorial guide; do not create another near-identical page.

No extra indexable routes were warranted. A future page must have confirmed coverage, a distinct intent, substantive bilingual content, source support, useful links and completed metadata. Add it through the shared content/route registry and audit before sitemap inclusion. `llms.txt` was not added: it is optional/experimental and does not replace crawlable content. No AI inclusion or FAQ rich-result promise is made. Existing general crawler preferences were retained; no separate training-crawler policy was invented.

## Client configuration and measurement

- Preserve the established visible phone `+965 6614 9059`, WhatsApp `96566149059` and email `info@planbconsultant.com`; client should reconfirm they are monitored before launch. Supply a genuine public address, visitor arrangements, hours, legal business registration, and authorized adviser details. Address/hours/maps/LocalBusiness remain absent.
- Supply confirmed LinkedIn and Facebook profile URLs. Instagram exists in current configuration; confirm ownership before enabling it in structured data. Blank values stay omitted.
- Keep `NEXT_PUBLIC_ALLOW_INDEXING=false` during review. Enable only for the approved production release; `VERCEL_ENV=preview` overrides it. Rebuild after changing values. `NEXT_PUBLIC_SITE_URL` is documented for compatibility, but the canonical origin is deliberately fixed to the authorized production domain.
- In Search Console choose a Domain property for `planbconsultant.com`; obtain Google's DNS TXT value and have the domain owner install it. Meta `GOOGLE_SITE_VERIFICATION` is for a URL-prefix property, not a Domain property. After the site is publicly available and verified, inspect one page per language and submit `https://planbconsultant.com/sitemap.xml` manually.
- In Bing Webmaster Tools add the production site, verify ownership using its offered DNS/XML/meta method (or approved Search Console import). Set `BING_SITE_VERIFICATION` if choosing HTML meta verification, rebuild, then submit the same sitemap manually. No account or submission has been made.
- If analytics is later approved, subscribe to `planb:conversion` and forward only `event`, `locale`, `step`. Do not attach DOM/form state, contact-link destination, URL parameters, IP-derived identity, enquiry reference or free text. Consent and retention decisions belong to the client. Successful events occur only after the existing API reports a saved enquiry. Without `DATABASE_URL`, the server honestly returns 503 and no success event fires.
- Track enquiries by language, assessment steps, saved assessment/contact enquiries and contact-action clicks. Search Console impressions/clicks by page/query and Bing indexing coverage are future account measurements. None were invented here.

## Validation and limitations

See `artifacts/search-visibility/` for rendered inventories, production/staging checks, structured-data checks, image measurements and HTTP/asset lab performance. Production build and TypeScript checks are required after the final edits. Smoke tests cover all routes, real 404 responses, logo and enquiry validation/error handling. JSON-LD syntax and property/reference/content checks are local; authenticated search-engine tools and rich-result testing have not been submitted externally.

No enabled browser surface was available in the computer-use runtime. Therefore new visual screenshots, browser interaction regression measurements, Lighthouse, LCP, CLS and INP could not be measured in this session. Approved layouts/interaction timing were retained, and existing image ratios/dimensions, deferred slides, reduced-motion handling, ticker controls, splash duration and popup lifecycle were reviewed in code. Splash renders only after hydration; primary HTML already exists. Popup timing and mobile obstruction require browser QA before release. HTTP latency and image byte measurements are laboratory observations, not real-user Core Web Vitals.

This foundation is implemented locally, with validation artifacts identifying precisely what was checked. Hosting activation, owner details, verification/account actions, external placements and the listed browser checks remain outstanding. Search visibility requires monitoring and periodic official-source review; rankings and inclusion are not guaranteed.

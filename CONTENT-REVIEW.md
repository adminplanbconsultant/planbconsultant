# Client PDF integration — 28 September 2026

Latest audit: see `CLIENT-CONTENT-CHECKLIST.md` and `CONTENT-COMPLETION-HANDOVER.md` for the 1 October remaining-content phase. They supersede older statements below about a homepage hero form, source-PDF availability and notification configuration. The hero remains form-free; the available 19-page `content.pdf` was read, while a separate `About US.pdf` revision is still unavailable. Optional server-only webhook notification support exists.

Source: client-supplied 19-page content.pdf. The existing visual identity and layout are retained. New seven-star hands/globe logo integrated; the supplied edited bitmap is preserved.

## Coverage
- Pages 1–4: grouped programme navigation; contact configuration; English/Arabic; free assessment; about, mission, vision; Choice, Clarity, Certainty; consultation CTAs; footer links. Existing destination photography and motion retained instead of adding an ornamental aircraft to the new logo.
- Pages 5–6: Canada Express Entry page, three federal programmes, FSW selection table, application sequence and qualified benefits.
- Pages 7–8: Australia skilled migration page (189/190/491), separate employer-sponsored page (482/186), requirements and qualified benefits.
- Pages 9–10: separate Germany nursing and car mechanic pages.
- Pages 11–12: Sweden employment and Portugal work/residence pages.
- Page 13: Canada C11 business-owner page.
- Pages 14–17: USA EB-5 detail, thresholds, jobs, due diligence, process and risks. No unverified partnership endorsements published.
- Page 18: USA E-2 detail, treaty nationality, substantial investment, real business and temporary status.
- Page 19: three-step assessment with programme, destination, conditional budget, age, education, profession, nationality, residence, contact, message and consent; full profile stored.
- Named but unspecified services: citizenship by investment, study visas and visit visas have dedicated overview pages. Unspecified citizenship countries are not invented.
- Existing service, destination and guide URLs remain available; relevant destinations link to new programmes.

## Editorial decisions
- FSW 67/100 is distinguished from CRS; no universal invitation guarantee.
- Australia 491 is provisional, not immediate PR. 482 is temporary; 186 is a separate permanent route.
- Removed salary multiples, 100x ROI, unverified vacancy/happiness rankings, outdated migration forecasts and guaranteed citizenship/healthcare promises.
- Germany nursing recognition/B2 clarified. Age caps, employer salaries, holidays and training packages not marketed as universal visa entitlements.
- Sweden German A1 copy error removed. Direct users to current 2026 employment/salary requirements.
- Portugal is not marketed as an unrestricted open work permit or guaranteed passport in 60 months.
- C11 uses IRCC's business-owner guidance: 51% control, support/business funds, significant benefit, up to 18 months, CEC exclusion. CAD 200,000 not presented as a universal legal threshold.
- EB-5 thresholds sourced from USCIS policy manual. No return/capital/approval guarantee.
- E-2 remains temporary and nationality-dependent; no fixed minimum investment or direct Green Card promise.
- Continuous age ranges include under 18 and 18–20. Budget options cover gaps, including USD 1,050,000+, without guessing the PDF's typo. Budget is expressly indicative, not eligibility or a quotation.
- Initial assessment is free; submission is not an automatic eligibility decision, appointment booking or promise of a reply within a fabricated time.

## Sources
Official links are visible on the relevant programme pages in lib/programmes.ts. Content is a general introduction, not a determination of eligibility. Programme availability and individual circumstances must be checked before commitment.

## Still dependent on the business
The PDF provides no actual phone, WhatsApp number, email, street address or hours. These are configurable; none were invented. No unverified attorney relationship, recruitment placement or citizenship-country partnership is represented as established. Email notifications and an admin dashboard are not part of this delivery; submissions are stored in the deployment database for owner review.

## October 1 implementation update

- Rebuilt the homepage around the PDF's consultation-first structure: compact free assessment, Kuwait-led positioning, Canada/Australia travel composition and six-destination strip.
- Expanded the desktop mega-menu and mobile programme tree so all individual programme pages are directly reachable.
- Added the approved About introduction, image-supported Vision and Mission, and Choice / Clarity / Certainty values.
- Added locally bundled destination imagery for Germany, Sweden, Portugal and the United States; sources are recorded in `ASSET-SOURCES.json`.
- Added destination banners, preselected assessment links, page-specific descriptions, breadcrumb structured data and Service structured data to programme pages.
- Reworked the footer as a forest-green contact colophon and added the required Ticode Technologies credit.
- Current official programme sources were rechecked on 1 October 2026. Rules and thresholds remain framed as time-sensitive guidance, not guarantees.

## October 1 continuation update

- Replaced the compact programme detail layout with a consistent long-form bilingual page system across all programme routes.
- Added an early, programme-preselected assessment section to each programme page; the homepage hero remains free of form fields and retains the one-time scroll prompt.
- Added route-type summaries, indicative document checklists, responsibility-labelled processes, Plan B support boundaries, four FAQs, final conversion sections and capped related routes.
- Added purpose-specific nursing, automotive, professional-workplace and business-advisory imagery generated for this project. Files and descriptions are recorded in `ASSET-SOURCES.json`.
- Rechecked current official guidance for Express Entry, Australia SkillSelect, German nursing recognition, Sweden's June 2026 work-permit rules, Portugal work residence, Canada C11 and U.S. investor routes. The Swedish threshold remains deliberately described as current rather than hard-coded because it follows the median salary at the application date.
- The requested DM Consultant screenshots were not present beside the supplied continuation brief. The implementation follows the brief's written organization requirements and the existing approved Plan B design system without copying unavailable reference visuals.

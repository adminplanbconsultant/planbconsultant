/**
 * Investment programme pages (citizenship and residency by investment), keyed by category and programme.
 *
 * `source` is the client transcript ("Plan B Consultant — Investment service pages", eight-page PDF) reproduced verbatim.
 * Do not edit it to "fix" a figure: change the rendered fields instead and record the reason in INVESTMENT-PROGRAMMES-REVIEW.md.
 * The transcript is not independent proof of current rules. Every programme is held for review (`publishReady:false`):
 * held pages render for local review but are noindex and excluded from the sitemap (see lib/seo.ts).
 *
 * This module must stay import-free: scripts/sync-apps-script-lists.mjs loads it directly.
 */
export type L = readonly [en: string, ar: string];
export type InvestmentCategory = 'citizenship' | 'residency';
/** One investment route. `amount` is shown exactly as supplied; null means the source names the route without an amount. */
export type CapitalLine = {route: L; amount: string | null};
export type InvestmentProgramme = {
  /** Enquiry id stored in the sheet (programme field). */
  id: string;
  category: InvestmentCategory;
  /** URL segment under /services/<category overview>/ */
  slug: string;
  /** English country name; matches lib/content.ts `countries` where that list has the destination. */
  country: string;
  iso: string;
  name: L;
  source: {title: string; breadcrumb: string; description: string; capital: string; processing: string; presence: string; advantage: string};
  descriptionAr: string;
  capital: CapitalLine[];
  /** Overrides the "Minimum Capital" card label where the source figure is not capital (e.g. a tax payment). */
  capitalLabel?: L;
  processing: L;
  presence: L;
  /** 'maintain' = a condition for keeping status; 'condition' = a residence/domicile condition of the route; 'none' = source states no requirement. */
  presenceStage: 'none' | 'maintain' | 'condition';
  advantage: L;
  /** 'separate' = an opportunity that needs its own application or election, not a right granted by the status. */
  advantageKind: 'feature' | 'separate';
  /** Source items deliberately not rendered (explicit review hold). */
  held?: ('advantage')[];
  /** Route types named in the overview without an amount. */
  otherRoutes?: L;
  family?: L;
  profile: L;
  /** Route types for the category overview card (no figures). */
  routeTypes: L;
  /** Existing internal page that the advantage refers to. */
  relatedPage?: {href: string; label: L};
  /** Official programme authority checked by Plan B's review, with the date it was opened. Only URLs actually opened are listed. */
  authority?: {label: L; url: string; checked: string};
  image?: {src: string; alt: L; credit: string};
  publishReady: boolean;
};

export const investmentCategories = {
  citizenship: {
    service: 'citizenship-by-investment',
    label: ['Citizenship by Investment', 'الجنسية عن طريق الاستثمار'] as L,
    short: ['Citizenship', 'الجنسية'] as L,
  },
  residency: {
    service: 'residency-by-investment',
    label: ['Residency by Investment', 'الإقامة عن طريق الاستثمار'] as L,
    short: ['Residency', 'الإقامة'] as L,
  },
} as const;

const CBI = 'Citizenship by Investment', RBI = 'Residency by Investment';
const crumb = (category: string, name: string) => `Plan B Consultant > ${category} > ${name}`;

export const investmentProgrammes: InvestmentProgramme[] = [
  {
    id: 'cbi-antigua-barbuda', category: 'citizenship', slug: 'antigua-and-barbuda', country: 'Antigua and Barbuda', iso: 'AG',
    name: ['Antigua & Barbuda', 'أنتيغوا وباربودا'],
    source: {
      title: `${CBI}: Antigua & Barbuda`, breadcrumb: crumb(CBI, 'Antigua & Barbuda'),
      description: "Antigua and Barbuda stands as a premier gem of the Eastern Caribbean, offering an exceptional quality of life with its 365 white-sand beaches, stable democratic government, and strong currency pegged to the US Dollar. The nation's Citizenship by Investment Program is highly regarded for its robust regulatory framework and efficient processing. It serves as an open gateway to global opportunities, granting business professionals and families seamless access to key international commercial centers without the burden of aggressive global taxation or personal physical presence mandates.",
      capital: 'US$ 230,000 (National Development Fund donation) or Real Estate 300,000',
      processing: '12 Months from submission',
      presence: 'Minimum 5 days stay required during the first 5-year cycle',
      advantage: 'Comprehensive family inclusion including children up to 30 and parents over 55',
    },
    descriptionAr: 'تُعدّ أنتيغوا وباربودا جوهرةً رائدة في شرق الكاريبي، إذ توفّر جودة حياة استثنائية بشواطئها البالغ عددها 365 شاطئاً ذا رمال بيضاء، وحكومتها الديمقراطية المستقرة، وعملتها القوية المربوطة بالدولار الأمريكي. ويحظى برنامج الجنسية عن طريق الاستثمار فيها بتقدير واسع لإطاره التنظيمي المتين وكفاءة معالجة الطلبات. ويشكّل البرنامج بوابة مفتوحة إلى الفرص العالمية، إذ يمنح رجال الأعمال والعائلات وصولاً سلساً إلى المراكز التجارية الدولية الرئيسية دون عبء الضرائب العالمية المرتفعة أو اشتراطات الحضور الشخصي.',
    capital: [
      {route: ['National Development Fund donation', 'تبرّع لصندوق التنمية الوطني'], amount: 'US$ 230,000'},
      {route: ['Real estate', 'العقار'], amount: '300,000'},
    ],
    processing: ['12 Months from submission', '12 شهراً من تاريخ تقديم الطلب'],
    presence: ['Minimum 5 days stay required during the first 5-year cycle', 'يلزم البقاء 5 أيام على الأقل خلال أول دورة مدتها 5 سنوات'],
    presenceStage: 'maintain',
    advantage: ['Comprehensive family inclusion including children up to 30 and parents over 55', 'إدراج شامل للأسرة يشمل الأبناء حتى سن 30 والوالدين فوق سن 55'],
    advantageKind: 'feature',
    family: ['The programme summary lists children up to 30 and parents over 55 among the family members who may be included.', 'يذكر ملخص البرنامج الأبناء حتى سن 30 والوالدين فوق سن 55 ضمن أفراد الأسرة الذين يمكن إدراجهم.'],
    profile: ['An Eastern Caribbean nation, described in the programme summary for its 365 white-sand beaches, stable democratic government and a currency pegged to the US Dollar.', 'دولة في شرق الكاريبي، يصفها ملخص البرنامج بشواطئها البالغ عددها 365 شاطئاً ذا رمال بيضاء وحكومتها الديمقراطية المستقرة وعملتها المربوطة بالدولار الأمريكي.'],
    routeTypes: ['Fund donation · Real estate', 'تبرّع لصندوق · عقار'],
    publishReady: false,
  },
  {
    id: 'cbi-dominica', category: 'citizenship', slug: 'dominica', country: 'Dominica', iso: 'DM',
    name: ['Dominica', 'دومينيكا'],
    source: {
      title: `${CBI}: Dominica`, breadcrumb: crumb(CBI, 'Dominica'),
      description: "Known globally as the 'Nature Isle of the Caribbean' due to its pristine rainforests, thermal springs, and dramatic mountain landscapes, Dominica provides a tranquil yet strategically powerful secondary home base. Its economic citizenship framework is one of the longest-running and most reliable pathways in the world. Tailored for safety-conscious investors, Dominica's citizenship functions as a lifetime asset that safeguards family wealth, ensures privacy, and fosters unhindered international mobility for generations to come.",
      capital: 'US$ 200,000 (Economic Diversification Fund contribution) or Real Estate',
      processing: '6 Months from asset transfer',
      presence: 'Zero physical residency or visitation mandates required',
      advantage: 'Highly streamlined processing with world-renowned dual citizenship legislation',
    },
    descriptionAr: 'تُعرف دومينيكا عالمياً بلقب «جزيرة الطبيعة في الكاريبي» بفضل غاباتها المطيرة البكر وينابيعها الحارة ومناظرها الجبلية الخلّابة، وهي توفّر قاعدة سكن ثانية هادئة وذات قيمة استراتيجية كبيرة. ويُعدّ إطار الجنسية الاقتصادية فيها من أقدم المسارات وأكثرها موثوقية في العالم. وصُمّمت جنسية دومينيكا للمستثمرين الحريصين على الأمان، فهي بمثابة أصل مدى الحياة يحمي ثروة الأسرة ويضمن الخصوصية ويعزّز حرية التنقل الدولي للأجيال القادمة.',
    capital: [
      {route: ['Economic Diversification Fund contribution', 'مساهمة في صندوق التنويع الاقتصادي'], amount: 'US$ 200,000'},
      {route: ['Real estate', 'العقار'], amount: null},
    ],
    processing: ['6 Months from asset transfer', '6 أشهر من تاريخ تحويل الأصل'],
    presence: ['Zero physical residency or visitation mandates required', 'لا يُشترط أي إقامة فعلية أو زيارة'],
    presenceStage: 'none',
    advantage: ['Highly streamlined processing with world-renowned dual citizenship legislation', 'إجراءات مبسّطة للغاية مع تشريع معروف عالمياً يسمح بازدواج الجنسية'],
    advantageKind: 'feature',
    profile: ["Known as the 'Nature Isle of the Caribbean' for its rainforests, thermal springs and mountain landscapes.", 'تُعرف بلقب «جزيرة الطبيعة في الكاريبي» لغاباتها المطيرة وينابيعها الحارة ومناظرها الجبلية.'],
    routeTypes: ['Fund contribution · Real estate', 'مساهمة في صندوق · عقار'],
    authority: {label: ['Citizenship by Investment Unit of Dominica — costs and fees', 'وحدة الجنسية عن طريق الاستثمار في دومينيكا — التكاليف والرسوم'], url: 'https://www.cbiu.gov.dm/news/dominica-citizenship-cost-and-fees/', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'cbi-grenada', category: 'citizenship', slug: 'grenada', country: 'Grenada', iso: 'GD',
    name: ['Grenada', 'غرينادا'],
    source: {
      title: `${CBI}: Grenada`, breadcrumb: crumb(CBI, 'Grenada'),
      description: "Grenada, the celebrated 'Spice Isle', elegantly matches a robust, upscale lifestyle environment with remarkable economic and geopolitical advantages. Beyond its luxury yachting harbors and prestigious medical education institutions, Grenada is highly sought after by global entrepreneurs because it holds a rare E-2 Investor Visa Treaty with the United States. This distinct privilege enables Grenadian nationals to establish businesses and reside in the USA, making it an indispensable asset for forward-thinking professionals looking to bridge into the North American market.",
      capital: 'US$ 235,000 (National Transformation Fund contribution) or Real Estate 270,000',
      processing: '6–9 Months from background clearance',
      presence: 'No minimum stay or travel to the island required',
      advantage: 'Direct eligibility to apply for the United States E-2 Non-Immigrant Investor Visa',
    },
    descriptionAr: 'تجمع غرينادا، «جزيرة التوابل» الشهيرة، بأناقة بين بيئة معيشية راقية ومتينة ومزايا اقتصادية وجيوسياسية لافتة. وإلى جانب موانئ اليخوت الفاخرة ومؤسسات التعليم الطبي المرموقة، تحظى غرينادا بإقبال كبير من روّاد الأعمال حول العالم لأنها ترتبط بمعاهدة نادرة لتأشيرة المستثمر E-2 مع الولايات المتحدة. ويتيح هذا الامتياز المميّز لمواطني غرينادا تأسيس أعمال والإقامة في الولايات المتحدة، ما يجعلها أصلاً لا غنى عنه للمهنيين أصحاب الرؤية الراغبين في الوصول إلى سوق أمريكا الشمالية.',
    capital: [
      {route: ['National Transformation Fund contribution', 'مساهمة في صندوق التحول الوطني'], amount: 'US$ 235,000'},
      {route: ['Real estate', 'العقار'], amount: '270,000'},
    ],
    processing: ['6–9 Months from background clearance', '6–9 أشهر من تاريخ اجتياز التحقق من الخلفية'],
    presence: ['No minimum stay or travel to the island required', 'لا يُشترط حدّ أدنى للبقاء أو السفر إلى الجزيرة'],
    presenceStage: 'none',
    advantage: ['Direct eligibility to apply for the United States E-2 Non-Immigrant Investor Visa', 'أهلية مباشرة للتقدّم بطلب تأشيرة المستثمر غير المهاجر E-2 إلى الولايات المتحدة'],
    advantageKind: 'separate',
    relatedPage: {href: 'programmes/usa-e2', label: ['Read about the U.S. E-2 Treaty Investor route', 'اقرأ عن مسار مستثمر المعاهدة E-2 الأمريكي']},
    profile: ["The 'Spice Isle', described in the programme summary for its yachting harbours and medical education institutions.", '«جزيرة التوابل»، ويصفها ملخص البرنامج بموانئ اليخوت ومؤسسات التعليم الطبي.'],
    routeTypes: ['Fund contribution · Real estate', 'مساهمة في صندوق · عقار'],
    authority: {label: ['Investment Migration Agency Grenada — becoming a citizen', 'وكالة هجرة الاستثمار في غرينادا — الحصول على الجنسية'], url: 'https://www.imagrenada.gd/becoming-a-citizen/', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'cbi-st-kitts-nevis', category: 'citizenship', slug: 'st-kitts-and-nevis', country: 'St. Kitts and Nevis', iso: 'KN',
    name: ['St. Kitts & Nevis', 'سانت كيتس ونيفيس'],
    source: {
      title: `${CBI}: St. Kitts & Nevis`, breadcrumb: crumb(CBI, 'St. Kitts & Nevis'),
      description: "As the historic pioneer of the global investment immigration industry, the Federation of St. Kitts and Nevis represents the pinnacle of luxury sovereign branding. Renowned for its exclusive real estate developments, private golf estates, and secluded beach retreats, the federation operates its citizenship program under the strict 'Sustainable Island State Contribution' model. It is designed for high-net-worth families who demand an absolute standard of discretion, rapid execution, and a prestigious alternative passport profile.",
      capital: 'US$ 250,000 (Sustainable Island State Contribution) or Real Estate 325,000',
      processing: '6 Months standard processing',
      presence: 'No residency or travel requirements attached to citizenship',
      advantage: "The industry's longest-standing, most secure legislative framework",
    },
    descriptionAr: 'بوصفه الرائد التاريخي لقطاع الهجرة الاستثمارية عالمياً، يمثّل اتحاد سانت كيتس ونيفيس قمّة العلامة السيادية الفاخرة. ويشتهر الاتحاد بمشروعاته العقارية الحصرية وملاعب الغولف الخاصة والمنتجعات الشاطئية المنعزلة، ويدير برنامج الجنسية وفق نموذج «مساهمة الدولة الجزرية المستدامة» الصارم. وقد صُمّم البرنامج للعائلات ذات الملاءة المالية العالية التي تطلب أعلى درجات السرّية وسرعة التنفيذ وجواز سفر بديلاً مرموقاً.',
    capital: [
      {route: ['Sustainable Island State Contribution', 'مساهمة الدولة الجزرية المستدامة'], amount: 'US$ 250,000'},
      {route: ['Real estate', 'العقار'], amount: '325,000'},
    ],
    processing: ['6 Months standard processing', '6 أشهر للمعالجة الاعتيادية'],
    presence: ['No residency or travel requirements attached to citizenship', 'لا ترتبط الجنسية بأي شرط إقامة أو سفر'],
    presenceStage: 'none',
    advantage: ["The industry's longest-standing, most secure legislative framework", 'الإطار التشريعي الأقدم والأكثر أماناً في هذا القطاع'],
    advantageKind: 'feature',
    profile: ['A two-island federation, described in the programme summary for its real estate developments, golf estates and beach retreats.', 'اتحاد من جزيرتين، يصفه ملخص البرنامج بمشروعاته العقارية وملاعب الغولف والمنتجعات الشاطئية.'],
    routeTypes: ['State contribution · Real estate', 'مساهمة للدولة · عقار'],
    authority: {label: ['St Kitts and Nevis Citizenship by Investment Unit — Sustainable Island State Contribution', 'وحدة الجنسية عن طريق الاستثمار في سانت كيتس ونيفيس — مساهمة الدولة الجزرية المستدامة'], url: 'https://www.ciu.gov.kn/sustainable-island-state-contribution/', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'cbi-st-lucia', category: 'citizenship', slug: 'st-lucia', country: 'Saint Lucia', iso: 'LC',
    name: ['St. Lucia', 'سانت لوسيا'],
    source: {
      title: `${CBI}: St. Lucia`, breadcrumb: crumb(CBI, 'St. Lucia'),
      description: "St. Lucia perfectly blends breathtaking geographic features—headlined by the iconic twin Piton mountains—with a highly proactive and business-friendly institutional environment. The country's Citizenship by Investment Program offers multi-layered investment routes, allowing families to diversify capital into national infrastructure projects, government bonds, or luxury real estate portfolios. Backed by solid legal protections for private property and wealth, St. Lucia is a strategic choice for astute financial planning.",
      capital: 'US$ 240,000 (National Economic Fund investment)',
      processing: '12 Months average turn-around',
      presence: 'No physical visitation or language proficiency testing required',
      advantage: 'Flexible capital allocations across sovereign bonds and corporate projects',
    },
    descriptionAr: 'تمزج سانت لوسيا بإتقان بين معالم جغرافية خلّابة، أبرزها جبلا بيتون التوأمان الشهيران، وبيئة مؤسسية مبادِرة وداعمة للأعمال. ويوفّر برنامج الجنسية عن طريق الاستثمار فيها مسارات استثمارية متعدّدة المستويات، تتيح للعائلات تنويع رؤوس أموالها في مشروعات البنية التحتية الوطنية أو السندات الحكومية أو المحافظ العقارية الفاخرة. وبفضل الحماية القانونية الراسخة للملكية الخاصة والثروة، تُعدّ سانت لوسيا خياراً استراتيجياً للتخطيط المالي الحصيف.',
    capital: [
      {route: ['National Economic Fund investment', 'استثمار في الصندوق الاقتصادي الوطني'], amount: 'US$ 240,000'},
    ],
    otherRoutes: ['The overview also names national infrastructure projects, government bonds and real estate; amounts for these routes are not listed on this page.', 'يذكر الوصف أيضاً مشروعات البنية التحتية الوطنية والسندات الحكومية والعقار؛ ولا تُدرج هذه الصفحة مبالغ هذه المسارات.'],
    processing: ['12 Months average turn-around', '12 شهراً في المتوسط لإنجاز الطلب'],
    presence: ['No physical visitation or language proficiency testing required', 'لا تُشترط زيارة فعلية ولا اختبار كفاءة لغوية'],
    presenceStage: 'none',
    advantage: ['Flexible capital allocations across sovereign bonds and corporate projects', 'توزيع مرن لرأس المال بين السندات السيادية ومشروعات الشركات'],
    advantageKind: 'feature',
    profile: ['An Eastern Caribbean island whose landscape is headlined by the twin Piton mountains.', 'جزيرة في شرق الكاريبي أبرز معالمها جبلا بيتون التوأمان.'],
    routeTypes: ['Fund · Bonds · Projects · Real estate', 'صندوق · سندات · مشروعات · عقار'],
    authority: {label: ['Citizenship by Investment Unit Saint Lucia — investment options', 'وحدة الجنسية عن طريق الاستثمار في سانت لوسيا — خيارات الاستثمار'], url: 'https://www.cipsaintlucia.com/citizenship-by-investment', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'cbi-nauru', category: 'citizenship', slug: 'nauru', country: 'Nauru', iso: 'NR',
    name: ['Naoero (Nauru)', 'ناورو (Naoero)'],
    source: {
      title: `${CBI}: Naoero (Nauru)`, breadcrumb: crumb(CBI, 'Naoero (Nauru)'),
      description: 'Situated as an independent sovereign republic in the Micronesian region of the Pacific Ocean, Naoero (Nauru) introduces a highly specialized and innovative approach to global mobility. As part of its modern sovereign economic restructuring, Nauru provides a distinctive Pacific-based alternative pathway. This route is specifically designed for international entrepreneurs who require deep asset protection, unique geographic diversification, and a secure secondary fallback position removed from European and North American macroeconomic pressures.',
      capital: 'US$ 90,000 (Direct Sovereign Economic Contribution)',
      processing: '6 Months execution window',
      presence: 'Zero physical residency requirements specified',
      advantage: 'Isolated geopolitical positioning offering unparalleled asset and identity shielding',
    },
    descriptionAr: 'تقع ناورو (Naoero) جمهوريةً مستقلة ذات سيادة في منطقة ميكرونيزيا بالمحيط الهادئ، وتقدّم نهجاً متخصصاً ومبتكراً للتنقل العالمي. وفي إطار إعادة الهيكلة الاقتصادية السيادية الحديثة، توفّر ناورو مساراً بديلاً مميّزاً مقرّه المحيط الهادئ. وقد صُمّم هذا المسار خصيصاً لروّاد الأعمال الدوليين الذين يحتاجون إلى حماية عميقة للأصول وتنويع جغرافي فريد وموقع احتياطي ثانٍ آمن بعيد عن الضغوط الاقتصادية الكلية في أوروبا وأمريكا الشمالية.',
    capital: [
      {route: ['Direct Sovereign Economic Contribution', 'مساهمة اقتصادية سيادية مباشرة'], amount: 'US$ 90,000'},
    ],
    processing: ['6 Months execution window', 'مدة تنفيذ 6 أشهر'],
    presence: ['Zero physical residency requirements specified', 'لا توجد أي متطلبات إقامة فعلية محددة'],
    presenceStage: 'none',
    advantage: ['Isolated geopolitical positioning offering unparalleled asset and identity shielding', 'موقع جيوسياسي منعزل يوفّر حماية غير مسبوقة للأصول والهوية'],
    advantageKind: 'feature',
    held: ['advantage'],
    profile: ['An independent republic in the Micronesian region of the Pacific Ocean.', 'جمهورية مستقلة في منطقة ميكرونيزيا بالمحيط الهادئ.'],
    routeTypes: ['Sovereign contribution', 'مساهمة سيادية'],
    authority: {label: ['Nauru Economic and Climate Resilience Citizenship Program — contribution', 'برنامج ناورو للجنسية من أجل الصمود الاقتصادي والمناخي — المساهمة'], url: 'https://ecrcp.gov.nr/contribution', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'cbi-egypt', category: 'citizenship', slug: 'egypt', country: 'Egypt', iso: 'EG',
    name: ['Egypt', 'مصر'],
    source: {
      title: `${CBI}: Egypt`, breadcrumb: crumb(CBI, 'Egypt'),
      description: 'Positioned at the literal crossroads of Europe, Asia, and Africa, the Arab Republic of Egypt offers an unmatched commercial anchor for international businesses. Through its official state-backed citizenship pathway, investors gain direct access to a rapidly expanding domestic market of over 100 million consumers, dynamic industrial zones, and highly lucrative commercial trade treaties. Egypt represents an optimal strategic hub for Middle Eastern and international business owners seeking to solidify their regional presence while simultaneously obtaining secure citizenship.',
      capital: 'US$ 250,000 (Direct Central Bank deposit or state real estate purchase)',
      processing: '6–9 Months comprehensive vetting',
      presence: 'No previous or ongoing physical residency required',
      advantage: 'Access to strategic regional treaties and major North African industrial sectors',
    },
    descriptionAr: 'تقع جمهورية مصر العربية حرفياً عند ملتقى أوروبا وآسيا وأفريقيا، وتوفّر مرتكزاً تجارياً لا مثيل له للأعمال الدولية. ومن خلال مسار الجنسية الرسمي المدعوم من الدولة، يحصل المستثمرون على وصول مباشر إلى سوق محلية سريعة النمو تضم أكثر من 100 مليون مستهلك، ومناطق صناعية نشطة، واتفاقيات تجارية مجزية للغاية. وتمثّل مصر مركزاً استراتيجياً مثالياً لأصحاب الأعمال من الشرق الأوسط ومن حول العالم الساعين إلى ترسيخ حضورهم الإقليمي مع الحصول في الوقت نفسه على جنسية آمنة.',
    capital: [
      {route: ['Direct Central Bank deposit or state real estate purchase', 'وديعة مباشرة لدى البنك المركزي أو شراء عقار مملوك للدولة'], amount: 'US$ 250,000'},
    ],
    processing: ['6–9 Months comprehensive vetting', '6–9 أشهر للتدقيق الشامل'],
    presence: ['No previous or ongoing physical residency required', 'لا تُشترط إقامة فعلية سابقة أو مستمرة'],
    presenceStage: 'none',
    advantage: ['Access to strategic regional treaties and major North African industrial sectors', 'الاستفادة من اتفاقيات إقليمية استراتيجية والوصول إلى قطاعات صناعية كبرى في شمال أفريقيا'],
    advantageKind: 'feature',
    profile: ['A country at the crossroads of Europe, Asia and Africa, with a domestic market the programme summary puts at over 100 million consumers.', 'دولة عند ملتقى أوروبا وآسيا وأفريقيا، يقدّر ملخص البرنامج سوقها المحلية بأكثر من 100 مليون مستهلك.'],
    routeTypes: ['Bank deposit · State real estate', 'وديعة مصرفية · عقار حكومي'],
    publishReady: false,
  },
  {
    id: 'cbi-sao-tome-principe', category: 'citizenship', slug: 'sao-tome-and-principe', country: 'Sao Tome and Principe', iso: 'ST',
    name: ['Sao Tome & Principe', 'ساو تومي وبرينسيب'],
    source: {
      title: `${CBI}: Sao Tome & Principe`, breadcrumb: crumb(CBI, 'Sao Tome & Principe'),
      description: 'Located strategically in the Gulf of Guinea off the western coast of Central Africa, Sao Tome and Principe is an island nation on the verge of significant maritime and eco-tourism expansion. The country\'s emerging investment framework serves as a pioneering frontier gateway. It provides early-stage investors with unique territorial positioning, a peaceful and stable democratic setting, and an innovative platform for establishing tax-efficient international trading hubs focused on West African and Atlantic shipping channels.',
      capital: 'US$ 90,000 (National Infrastructure Development allocation)',
      processing: '5–7 Months formal tracking',
      presence: 'No mandatory permanent physical stay enforced',
      advantage: 'Strategic maritime frontier access with highly competitive entry-level pricing',
    },
    descriptionAr: 'تقع ساو تومي وبرينسيب في موقع استراتيجي في خليج غينيا قبالة الساحل الغربي لوسط أفريقيا، وهي دولة جزرية على أعتاب توسّع كبير في النشاط البحري والسياحة البيئية. ويشكّل إطارها الاستثماري الناشئ بوابة رائدة إلى أسواق واعدة، إذ يمنح المستثمرين الأوائل موقعاً جغرافياً فريداً وبيئة ديمقراطية مسالمة ومستقرة ومنصة مبتكرة لتأسيس مراكز تجارة دولية فعّالة ضريبياً تركّز على قنوات الشحن في غرب أفريقيا والأطلسي.',
    capital: [
      {route: ['National Infrastructure Development allocation', 'مخصّص لتنمية البنية التحتية الوطنية'], amount: 'US$ 90,000'},
    ],
    processing: ['5–7 Months formal tracking', '5–7 أشهر للمتابعة الرسمية'],
    presence: ['No mandatory permanent physical stay enforced', 'لا يُفرض بقاء فعلي دائم إلزامي'],
    presenceStage: 'none',
    advantage: ['Strategic maritime frontier access with highly competitive entry-level pricing', 'وصول استراتيجي إلى منطقة بحرية واعدة بتكلفة دخول تنافسية للغاية'],
    advantageKind: 'feature',
    profile: ['An island nation in the Gulf of Guinea, off the western coast of Central Africa.', 'دولة جزرية في خليج غينيا قبالة الساحل الغربي لوسط أفريقيا.'],
    routeTypes: ['Infrastructure allocation', 'مخصّص للبنية التحتية'],
    publishReady: false,
  },
  {
    id: 'cbi-turkey', category: 'citizenship', slug: 'turkey', country: 'Turkey', iso: 'TR',
    name: ['Turkey', 'تركيا'],
    source: {
      title: `${CBI}: Turkey`, breadcrumb: crumb(CBI, 'Turkey'),
      description: "Turkey stands as a magnificent transcontinental economic powerhouse, seamlessly bridging the rich cultural heritage and commercial channels of Europe and Asia. Boasting a highly vibrant metropolitan real estate market, sophisticated healthcare systems, and advanced industrial infrastructure, Turkey's Citizenship by Investment Program is immensely popular. It allows investors to purchase prime real estate assets that can yield strong rental returns and be liquidated after a brief holding period, offering an incredibly practical blend of asset ownership and immediate global citizenship.",
      capital: 'US$ 500,000',
      processing: '9 Months administrative routing',
      presence: 'Zero residency or physical presence requirements enforced',
      advantage: 'High-yield property asset ownership paired with immediate US E-2 visa eligibility',
    },
    descriptionAr: 'تُعدّ تركيا قوة اقتصادية عابرة للقارات، تربط بسلاسة بين التراث الثقافي الغني والقنوات التجارية لأوروبا وآسيا. وبفضل سوقها العقارية الحضرية النشطة للغاية وأنظمتها الصحية المتطورة وبنيتها التحتية الصناعية المتقدمة، يحظى برنامج الجنسية عن طريق الاستثمار فيها بشعبية كبيرة. ويتيح البرنامج للمستثمرين شراء أصول عقارية مميّزة يمكن أن تحقق عوائد إيجارية قوية وأن تُسيَّل بعد فترة احتفاظ قصيرة، ما يوفّر مزيجاً عملياً للغاية بين تملّك الأصول والحصول الفوري على جنسية عالمية.',
    capital: [
      {route: ['Minimum capital (route not specified in the summary)', 'الحد الأدنى لرأس المال (لم يحدّد الملخص المسار)'], amount: 'US$ 500,000'},
    ],
    processing: ['9 Months administrative routing', '9 أشهر للإجراءات الإدارية'],
    presence: ['Zero residency or physical presence requirements enforced', 'لا تُفرض أي متطلبات إقامة أو حضور فعلي'],
    presenceStage: 'none',
    advantage: ['High-yield property asset ownership paired with immediate US E-2 visa eligibility', 'تملّك أصول عقارية عالية العائد مع أهلية فورية لتأشيرة E-2 الأمريكية'],
    advantageKind: 'separate',
    relatedPage: {href: 'programmes/usa-e2', label: ['Read about the U.S. E-2 Treaty Investor route', 'اقرأ عن مسار مستثمر المعاهدة E-2 الأمريكي']},
    profile: ['A transcontinental country bridging Europe and Asia, described in the programme summary for its metropolitan real estate market, healthcare and industrial infrastructure.', 'دولة عابرة للقارات تربط أوروبا بآسيا، يصفها ملخص البرنامج بسوقها العقارية الحضرية وأنظمتها الصحية وبنيتها التحتية الصناعية.'],
    routeTypes: ['Real estate (per overview)', 'عقار (حسب الوصف)'],
    publishReady: false,
  },
  {
    id: 'cbi-vanuatu', category: 'citizenship', slug: 'vanuatu', country: 'Vanuatu', iso: 'VU',
    name: ['Vanuatu', 'فانواتو'],
    source: {
      title: `${CBI}: Vanuatu`, breadcrumb: crumb(CBI, 'Vanuatu'),
      description: 'Vanuatu, an archipelago of 83 spectacular islands in the South Pacific Ocean, offers the fastest, most streamlined citizenship by investment framework available globally. Celebrated for its pristine natural beauty, low-tax environment, and complete absence of income, wealth, or corporate taxes, Vanuatu operates its Development Support Program with extreme efficiency. It provides international business owners with a rapid, legitimate alternative passport option to secure emergency backup plans and expand global travel capabilities with minimal delay.',
      capital: 'US$ 130,000 (Development Support Program contribution)',
      processing: '6 Months ultra-fast track processing',
      presence: 'Completely remote processing; no physical presence required',
      advantage: 'The fastest processing timeline in the global investment migration industry',
    },
    descriptionAr: 'تقدّم فانواتو، الأرخبيل المكوّن من 83 جزيرة خلّابة في جنوب المحيط الهادئ، أسرع إطار للجنسية عن طريق الاستثمار وأكثرها تبسيطاً على مستوى العالم. وتشتهر فانواتو بجمالها الطبيعي البكر وبيئتها منخفضة الضرائب وغياب ضرائب الدخل والثروة والشركات تماماً، وتدير برنامج دعم التنمية بكفاءة عالية جداً. ويوفّر البرنامج لأصحاب الأعمال الدوليين خياراً سريعاً ومشروعاً لجواز سفر بديل لتأمين خطط احتياطية للطوارئ وتوسيع إمكانات السفر العالمية بأقل قدر من التأخير.',
    capital: [
      {route: ['Development Support Program contribution', 'مساهمة في برنامج دعم التنمية'], amount: 'US$ 130,000'},
    ],
    processing: ['6 Months ultra-fast track processing', '6 أشهر بمسار معالجة فائق السرعة'],
    presence: ['Completely remote processing; no physical presence required', 'معالجة عن بُعد بالكامل؛ لا يُشترط الحضور الفعلي'],
    presenceStage: 'none',
    advantage: ['The fastest processing timeline in the global investment migration industry', 'أسرع جدول زمني للمعالجة في قطاع الهجرة الاستثمارية عالمياً'],
    advantageKind: 'feature',
    profile: ['An archipelago of 83 islands in the South Pacific Ocean.', 'أرخبيل من 83 جزيرة في جنوب المحيط الهادئ.'],
    routeTypes: ['Programme contribution', 'مساهمة في البرنامج'],
    publishReady: false,
  },
  {
    id: 'rbi-cyprus', category: 'residency', slug: 'cyprus', country: 'Cyprus', iso: 'CY',
    name: ['Cyprus', 'قبرص'],
    source: {
      title: `${RBI}: Cyprus`, breadcrumb: crumb(RBI, 'Cyprus'),
      description: 'Cyprus, situated strategically in the warm waters of the eastern Mediterranean, acts as a premier corporate haven and lifestyle destination within the European Union. Featuring an exceptionally favorable corporate tax rate of 12.5%, English-medium schooling, and a safe, family-friendly environment, the Cyprus Permanent Residency program offers an excellent real-estate backed asset framework. It allows families to acquire high-end Mediterranean properties while securing a permanent right of residence within a booming maritime and natural gas hub.',
      capital: '€300,000 (New luxury real estate purchase)',
      processing: '4–6 Months from property registration',
      presence: 'Must visit Cyprus at least once every two years to maintain status',
      advantage: 'Permanent, life-long residency in a top-tier EU corporate tax jurisdiction',
    },
    descriptionAr: 'تقع قبرص في موقع استراتيجي في المياه الدافئة لشرق البحر المتوسط، وتُعدّ ملاذاً رائداً للشركات ووجهة معيشية مميّزة داخل الاتحاد الأوروبي. وبفضل معدّل ضريبة الشركات المواتي للغاية البالغ 12.5%، والمدارس التي تدرّس باللغة الإنجليزية، والبيئة الآمنة المناسبة للعائلات، يوفّر برنامج الإقامة الدائمة في قبرص إطاراً ممتازاً قائماً على الأصول العقارية. ويتيح للعائلات تملّك عقارات متوسطية راقية مع ضمان حق إقامة دائمة في مركز مزدهر للنشاط البحري والغاز الطبيعي.',
    capital: [
      {route: ['New luxury real estate purchase', 'شراء عقار فاخر جديد'], amount: '€300,000'},
    ],
    processing: ['4–6 Months from property registration', '4–6 أشهر من تاريخ تسجيل العقار'],
    presence: ['Must visit Cyprus at least once every two years to maintain status', 'يجب زيارة قبرص مرة واحدة على الأقل كل سنتين للحفاظ على الإقامة'],
    presenceStage: 'maintain',
    advantage: ['Permanent, life-long residency in a top-tier EU corporate tax jurisdiction', 'إقامة دائمة مدى الحياة في ولاية قضائية أوروبية رائدة في ضريبة الشركات'],
    advantageKind: 'feature',
    profile: ['An eastern Mediterranean island state in the European Union, described in the programme summary for its English-medium schooling and family-friendly environment.', 'دولة جزرية في شرق المتوسط عضو في الاتحاد الأوروبي، يصفها ملخص البرنامج بمدارسها التي تدرّس بالإنجليزية وبيئتها المناسبة للعائلات.'],
    routeTypes: ['Real estate', 'عقار'],
    publishReady: false,
  },
  {
    id: 'rbi-greece', category: 'residency', slug: 'greece', country: 'Greece', iso: 'GR',
    name: ['Greece', 'اليونان'],
    source: {
      title: `${RBI}: Greece`, breadcrumb: crumb(RBI, 'Greece'),
      description: "Greece offers one of the most culturally rich and lifestyle-driven residency options in the world through its famous Golden Visa program. Beyond the country's breathtaking islands, historic landmarks, and warm Mediterranean climate, this residency pathway provides immediate, unhindered access to the borderless European Schengen Zone. It serves as a highly effective tool for international business travelers seeking to bypass complex visa applications, while securing a valuable real estate asset in a recovering, high-potential property market.",
      capital: '€250,000 to €800,000 (Tiered by regional real estate zones)',
      processing: '6 Months from property closing',
      presence: 'Zero residency or physical stay requirements enforced',
      advantage: 'Immediate, full access to Schengen Area business and leisure travel',
    },
    descriptionAr: 'تقدّم اليونان، من خلال برنامج «التأشيرة الذهبية» الشهير، أحد أغنى خيارات الإقامة ثقافياً وأكثرها ارتباطاً بنمط الحياة في العالم. وإلى جانب جزرها الخلّابة ومعالمها التاريخية ومناخها المتوسطي الدافئ، يوفّر مسار الإقامة هذا وصولاً فورياً ودون عوائق إلى منطقة شنغن الأوروبية المفتوحة الحدود. ويُعدّ أداة فعّالة للغاية لمسافري الأعمال الدوليين الراغبين في تجاوز طلبات التأشيرة المعقّدة، مع امتلاك أصل عقاري قيّم في سوق عقارية تتعافى وتتمتع بإمكانات عالية.',
    capital: [
      {route: ['Real estate, tiered by regional zones', 'عقار، بمستويات حسب المناطق'], amount: '€250,000 to €800,000'},
    ],
    processing: ['6 Months from property closing', '6 أشهر من تاريخ إتمام صفقة العقار'],
    presence: ['Zero residency or physical stay requirements enforced', 'لا تُفرض أي متطلبات إقامة أو بقاء فعلي'],
    presenceStage: 'none',
    advantage: ['Immediate, full access to Schengen Area business and leisure travel', 'وصول فوري وكامل إلى منطقة شنغن لسفر الأعمال والترفيه'],
    advantageKind: 'feature',
    profile: ['A Mediterranean country known for its islands, historic landmarks and warm climate.', 'دولة متوسطية تشتهر بجزرها ومعالمها التاريخية ومناخها الدافئ.'],
    routeTypes: ['Real estate (tiered)', 'عقار (بمستويات)'],
    publishReady: false,
  },
  {
    id: 'rbi-italy', category: 'residency', slug: 'italy', country: 'Italy', iso: 'IT',
    name: ['Italy', 'إيطاليا'],
    source: {
      title: `${RBI}: Italy`, breadcrumb: crumb(RBI, 'Italy'),
      description: 'Italy represents the pinnacle of cultural prestige, artistic heritage, and sophisticated European lifestyle. Through its Investor Visa framework and premium flat-tax fiscal incentives for new residents, Italy caters directly to ultra-high-net-worth individuals and corporate visionaries. The program allows investors to deploy capital into innovative startups, public bonds, or philanthropic initiatives, paving a clear path toward long-term European residency backed by robust legal protections, world-class healthcare, and elite lifestyle infrastructure.',
      capital: '€250,000+ (Flexible allocations across corporate and sovereign assets)',
      processing: '4–5 Months via centralized digital tracking',
      presence: 'Requires establishing a formal tax residence within Italy',
      advantage: "Eligibility for Italy's premium €100,000 flat annual tax on global income",
    },
    descriptionAr: 'تمثّل إيطاليا ذروة المكانة الثقافية والإرث الفني ونمط الحياة الأوروبي الراقي. ومن خلال إطار «تأشيرة المستثمر» والحوافز الضريبية المميّزة بنظام الضريبة الثابتة للمقيمين الجدد، تخاطب إيطاليا مباشرةً الأفراد ذوي الثروات الكبيرة جداً وأصحاب الرؤى في عالم الأعمال. ويتيح البرنامج للمستثمرين توجيه رؤوس أموالهم إلى الشركات الناشئة المبتكرة أو السندات الحكومية أو المبادرات الخيرية، ممهّداً طريقاً واضحاً نحو إقامة أوروبية طويلة الأمد مدعومة بحماية قانونية متينة ورعاية صحية عالمية المستوى وبنية تحتية راقية لنمط الحياة.',
    capital: [
      {route: ['Flexible allocations across corporate and sovereign assets', 'توزيعات مرنة بين أصول الشركات والأصول السيادية'], amount: '€250,000+'},
    ],
    otherRoutes: ['The overview names innovative startups, public bonds and philanthropic initiatives; separate amounts for each are not listed on this page.', 'يذكر الوصف الشركات الناشئة المبتكرة والسندات الحكومية والمبادرات الخيرية؛ ولا تُدرج هذه الصفحة مبلغاً منفصلاً لكل منها.'],
    processing: ['4–5 Months via centralized digital tracking', '4–5 أشهر عبر متابعة رقمية مركزية'],
    presence: ['Requires establishing a formal tax residence within Italy', 'يتطلب إثبات إقامة ضريبية رسمية في إيطاليا'],
    presenceStage: 'condition',
    advantage: ["Eligibility for Italy's premium €100,000 flat annual tax on global income", 'الأهلية لنظام الضريبة السنوية الثابتة في إيطاليا البالغة €100,000 على الدخل العالمي'],
    advantageKind: 'separate',
    profile: ['A European country known for its cultural and artistic heritage.', 'دولة أوروبية تشتهر بإرثها الثقافي والفني.'],
    routeTypes: ['Startups · Bonds · Philanthropy', 'شركات ناشئة · سندات · مبادرات خيرية'],
    publishReady: false,
  },
  {
    id: 'rbi-malta', category: 'residency', slug: 'malta', country: 'Malta', iso: 'MT',
    name: ['Malta', 'مالطا'],
    source: {
      title: `${RBI}: Malta`, breadcrumb: crumb(RBI, 'Malta'),
      description: 'Malta, an English-speaking sovereign island nation in the heart of the Mediterranean, provides an exceptionally secure and tightly regulated environment for global families. The Malta Permanent Residency Programme (MPRP) utilizes a balanced combination of property leasing or purchase alongside direct contributions to the Maltese state. Known for its strict corporate governance, booming financial services sector, and top-tier healthcare systems, Malta delivers a rock-solid, EU-compliant residency framework that perfectly serves as an enduring family hub.',
      capital: 'Approx. €110,000 (Combined capital requirements including property lease)',
      processing: '4–6 Months rigorous administrative audit',
      presence: 'No minimum physical stay required to maintain status',
      advantage: 'Fully permanent residency from day one with strict, reputable EU governance',
    },
    descriptionAr: 'توفّر مالطا، الدولة الجزرية ذات السيادة الناطقة بالإنجليزية في قلب البحر المتوسط، بيئة آمنة للغاية ومنظّمة بإحكام للعائلات من حول العالم. ويعتمد برنامج الإقامة الدائمة في مالطا (MPRP) على مزيج متوازن من استئجار العقار أو شرائه إلى جانب مساهمات مباشرة للدولة المالطية. وتشتهر مالطا بحوكمة صارمة للشركات وقطاع خدمات مالية مزدهر وأنظمة رعاية صحية رفيعة المستوى، وتقدّم إطار إقامة راسخاً متوافقاً مع معايير الاتحاد الأوروبي يصلح تماماً مقرّاً دائماً للأسرة.',
    capital: [
      {route: ['Combined capital requirements including property lease', 'متطلبات رأس المال المجمّعة بما فيها استئجار العقار'], amount: 'Approx. €110,000'},
    ],
    processing: ['4–6 Months rigorous administrative audit', '4–6 أشهر لتدقيق إداري صارم'],
    presence: ['No minimum physical stay required to maintain status', 'لا يُشترط حدّ أدنى للبقاء الفعلي للحفاظ على الإقامة'],
    presenceStage: 'none',
    advantage: ['Fully permanent residency from day one with strict, reputable EU governance', 'إقامة دائمة بالكامل منذ اليوم الأول ضمن حوكمة أوروبية صارمة وموثوقة'],
    advantageKind: 'feature',
    profile: ['An English-speaking island nation in the central Mediterranean and a member of the European Union.', 'دولة جزرية ناطقة بالإنجليزية في وسط المتوسط وعضو في الاتحاد الأوروبي.'],
    routeTypes: ['Property lease or purchase · State contribution', 'استئجار أو شراء عقار · مساهمة للدولة'],
    authority: {label: ['Residency Malta Agency — Legal Notice 310 of 2024 (MPRP amendment regulations)', 'وكالة الإقامة في مالطا — الإشعار القانوني 310 لسنة 2024 (تعديلات لائحة البرنامج)'], url: 'https://residencymalta.gov.mt/wp-content/uploads/2024/11/Legal-Notice-310-of-2024.pdf', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'rbi-portugal', category: 'residency', slug: 'portugal', country: 'Portugal', iso: 'PT',
    name: ['Portugal', 'البرتغال'],
    source: {
      title: `${RBI}: Portugal`, breadcrumb: crumb(RBI, 'Portugal'),
      description: 'Portugal continues to stand out as a highly attractive European gateway, perfectly balancing historic charm, safe cities, and a deeply progressive tech-hub economy. Following recent legislative modifications, the Portuguese Golden Visa program has transitioned smoothly toward investment in regulated mutual and venture capital funds. This framework provides an excellent alternative for investors looking to avoid direct real estate management, offering a compliant path toward full European citizenship after a concise five-year holding period.',
      capital: '€200,000 (Subscription into qualifying Portuguese capital venture funds)',
      processing: '12–18 Months regulatory queue',
      presence: 'Minimal stay requirement of just 7 days per year',
      advantage: 'Direct pathway to apply for full EU Citizenship after 5 years of residency',
    },
    descriptionAr: 'لا تزال البرتغال بوابة أوروبية جذابة للغاية، إذ توازن بإتقان بين السحر التاريخي والمدن الآمنة واقتصاد تقني متقدّم. وبعد التعديلات التشريعية الأخيرة، انتقل برنامج «التأشيرة الذهبية» البرتغالي بسلاسة نحو الاستثمار في الصناديق المشتركة وصناديق رأس المال الجريء المنظّمة. ويقدّم هذا الإطار بديلاً ممتازاً للمستثمرين الراغبين في تجنّب الإدارة المباشرة للعقارات، ويوفّر مساراً متوافقاً مع الأنظمة نحو الجنسية الأوروبية الكاملة بعد فترة احتفاظ موجزة مدتها خمس سنوات.',
    capital: [
      {route: ['Subscription into qualifying Portuguese capital venture funds', 'الاكتتاب في صناديق رأس مال جريء برتغالية مؤهلة'], amount: '€200,000'},
    ],
    processing: ['12–18 Months regulatory queue', '12–18 شهراً في قائمة الانتظار التنظيمية'],
    presence: ['Minimal stay requirement of just 7 days per year', 'حدّ أدنى للبقاء لا يتجاوز 7 أيام سنوياً'],
    presenceStage: 'maintain',
    advantage: ['Direct pathway to apply for full EU Citizenship after 5 years of residency', 'مسار مباشر للتقدّم بطلب الجنسية الأوروبية الكاملة بعد 5 سنوات من الإقامة'],
    advantageKind: 'separate',
    profile: ['A European Union country described in the programme summary for its historic charm, safe cities and technology sector.', 'دولة في الاتحاد الأوروبي يصفها ملخص البرنامج بسحرها التاريخي ومدنها الآمنة وقطاعها التقني.'],
    routeTypes: ['Investment funds', 'صناديق استثمار'],
    image: {src: '/images/destinations/portugal.jpg', alt: ['Yellow tram on a historic street in Lisbon, Portugal', 'ترام أصفر في شارع تاريخي في لشبونة، البرتغال'], credit: 'Photo: Vitalijs Barilo / Unsplash'},
    publishReady: false,
  },
  {
    id: 'rbi-switzerland', category: 'residency', slug: 'switzerland', country: 'Switzerland', iso: 'CH',
    name: ['Switzerland', 'سويسرا'],
    source: {
      title: `${RBI}: Switzerland`, breadcrumb: crumb(RBI, 'Switzerland'),
      description: 'Switzerland represents the absolute gold standard for global stability, personal safety, and precision wealth management. Nestled in the heart of the Alps, it offers unparalleled financial security and privacy. The Swiss residency pathway for non-EU nationals is structured around a bespoke lump-sum fiscal arrangement with specific cantonal tax authorities. This ultra-premium program is crafted for elite international families who wish to establish their primary home base within an extraordinarily stable, secure, and prestigious European environment.',
      capital: 'CHF 250,000 (Annual cantonal lump-sum tax package)',
      processing: '4–6 Months tailored cantonal negotiation',
      presence: 'Requires establishing primary physical and tax domicile within Switzerland',
      advantage: 'Unparalleled financial privacy, wealth security, and elite global prestige',
    },
    descriptionAr: 'تمثّل سويسرا المعيار الذهبي المطلق للاستقرار العالمي والسلامة الشخصية والإدارة الدقيقة للثروات. وتقع في قلب جبال الألب، وتوفّر أماناً مالياً وخصوصية لا مثيل لهما. ويقوم مسار الإقامة السويسري لمواطني الدول من خارج الاتحاد الأوروبي على ترتيب ضريبي مقطوع مُعدّ خصيصاً مع السلطات الضريبية في الكانتون المعني. وقد صُمّم هذا البرنامج الفاخر للغاية للعائلات الدولية المرموقة التي ترغب في إقامة مقرّها الأساسي في بيئة أوروبية مستقرة وآمنة ومرموقة بشكل استثنائي.',
    capital: [
      {route: ['Annual cantonal lump-sum tax package (a yearly tax payment)', 'حزمة ضريبة مقطوعة سنوية لدى الكانتون (دفعة ضريبية سنوية)'], amount: 'CHF 250,000'},
    ],
    capitalLabel: ['Annual tax commitment', 'الالتزام الضريبي السنوي'],
    processing: ['4–6 Months tailored cantonal negotiation', '4–6 أشهر لتفاوض مخصّص مع الكانتون'],
    presence: ['Requires establishing primary physical and tax domicile within Switzerland', 'يتطلب اتخاذ سويسرا موطناً فعلياً وضريبياً أساسياً'],
    presenceStage: 'condition',
    advantage: ['Unparalleled financial privacy, wealth security, and elite global prestige', 'خصوصية مالية وأمان للثروة ومكانة عالمية مرموقة لا مثيل لها'],
    advantageKind: 'feature',
    profile: ['An Alpine country at the heart of Europe.', 'دولة في جبال الألب في قلب أوروبا.'],
    routeTypes: ['Annual lump-sum tax arrangement', 'ترتيب ضريبي مقطوع سنوي'],
    publishReady: false,
  },
  {
    id: 'rbi-panama', category: 'residency', slug: 'panama', country: 'Panama', iso: 'PA',
    name: ['Panama', 'بنما'],
    source: {
      title: `${RBI}: Panama`, breadcrumb: crumb(RBI, 'Panama'),
      description: "Panama, widely celebrated as the 'Hub of the Americas', offers an exceptionally vibrant, dollarized economy, an advanced international banking district, and a highly tax-efficient territorial tax framework. Through its Qualified Investor Program, Panama provides an immediate, fast-tracked route to permanent residency. It serves as an ideal and highly practical Latin American operational base for global entrepreneurs, offering a safe, modern infrastructure, a tropical climate, and an excellent strategic alternative to traditional European programs.",
      capital: 'US$ 300,000 (Real estate or fixed bank deposit models)',
      processing: '3 - 4 Months rapid executive deployment',
      presence: 'Must visit Panama at least once every two years to maintain active status',
      advantage: 'Immediate permanent residency status backed by a fully dollarized economy',
    },
    descriptionAr: 'تقدّم بنما، المعروفة على نطاق واسع بلقب «مركز الأمريكتين»، اقتصاداً نشطاً للغاية قائماً على الدولار، وحيّاً مصرفياً دولياً متقدماً، وإطاراً ضريبياً إقليمياً فعّالاً للغاية. ومن خلال «برنامج المستثمر المؤهل»، توفّر بنما مساراً فورياً وسريعاً للإقامة الدائمة. وتُعدّ قاعدة تشغيلية مثالية وعملية للغاية في أمريكا اللاتينية لروّاد الأعمال من حول العالم، إذ توفّر بنية تحتية حديثة وآمنة ومناخاً استوائياً وبديلاً استراتيجياً ممتازاً للبرامج الأوروبية التقليدية.',
    capital: [
      {route: ['Real estate or fixed bank deposit models', 'نماذج العقار أو الوديعة المصرفية لأجل'], amount: 'US$ 300,000'},
    ],
    processing: ['3 - 4 Months rapid executive deployment', '3–4 أشهر لتنفيذ سريع'],
    presence: ['Must visit Panama at least once every two years to maintain active status', 'يجب زيارة بنما مرة واحدة على الأقل كل سنتين للحفاظ على سريان الإقامة'],
    presenceStage: 'maintain',
    advantage: ['Immediate permanent residency status backed by a fully dollarized economy', 'إقامة دائمة فورية مدعومة باقتصاد قائم بالكامل على الدولار'],
    advantageKind: 'feature',
    profile: ["Known as the 'Hub of the Americas', with a dollarized economy and an international banking district.", 'تُعرف بلقب «مركز الأمريكتين»، ولديها اقتصاد قائم على الدولار وحيّ مصرفي دولي.'],
    routeTypes: ['Real estate · Fixed deposit', 'عقار · وديعة لأجل'],
    authority: {label: ['Panama Ministry of Commerce and Industries — Executive Decree 722 of 2020 (Qualified Investor), English text', 'وزارة التجارة والصناعة في بنما — المرسوم التنفيذي 722 لسنة 2020 (المستثمر المؤهل)، النص الإنجليزي'], url: 'https://mici.gob.pa/wp-content/uploads/2021/10/de-722-english.pdf', checked: '2026-11-07'},
    publishReady: false,
  },
  {
    id: 'rbi-uae', category: 'residency', slug: 'uae', country: 'United Arab Emirates', iso: 'AE',
    name: ['UAE', 'الإمارات العربية المتحدة'],
    source: {
      title: `${RBI}: UAE`, breadcrumb: crumb(RBI, 'UAE'),
      description: 'The United Arab Emirates, anchored by the spectacular, ultra-modern metropolises of Dubai and Abu Dhabi, stands as the premier global center for business innovation, luxury lifestyle, and wealth creation. Through its highly successful 10-year Golden Visa framework, the UAE offers independent residency status completely free from corporate or personal income taxes. This program is perfectly tailored for regional and international entrepreneurs looking to anchor their business operations in a hyper-connected, world-class financial hub.',
      capital: 'Real Estate AED 2,000,000 or Business Setup AED 50,000',
      processing: '1 month',
      presence: 'No strict presence rules; must enter the UAE at least once every 12 months',
      advantage: '10-year renewable residency in a zero-tax, world-leading business capital',
    },
    descriptionAr: 'تُعدّ دولة الإمارات العربية المتحدة، بمدينتيها المذهلتين فائقتي الحداثة دبي وأبوظبي، المركز العالمي الأول لابتكار الأعمال ونمط الحياة الفاخر وتكوين الثروات. ومن خلال إطار «الإقامة الذهبية» لمدة 10 سنوات الذي حقّق نجاحاً كبيراً، تمنح الإمارات وضع إقامة مستقلاً معفى تماماً من ضرائب الشركات أو ضرائب الدخل الشخصي. وقد صُمّم هذا البرنامج خصيصاً لروّاد الأعمال الإقليميين والدوليين الراغبين في ترسيخ عملياتهم التجارية في مركز مالي عالمي المستوى شديد الترابط.',
    capital: [
      {route: ['Real estate', 'العقار'], amount: 'AED 2,000,000'},
      {route: ['Business setup', 'تأسيس نشاط تجاري'], amount: 'AED 50,000'},
    ],
    processing: ['1 month', 'شهر واحد'],
    presence: ['No strict presence rules; must enter the UAE at least once every 12 months', 'لا توجد قواعد صارمة للحضور؛ يجب دخول الإمارات مرة واحدة على الأقل كل 12 شهراً'],
    presenceStage: 'maintain',
    advantage: ['10-year renewable residency in a zero-tax, world-leading business capital', 'إقامة لمدة 10 سنوات قابلة للتجديد في عاصمة أعمال عالمية رائدة معفاة من الضرائب'],
    advantageKind: 'feature',
    profile: ['A federation of seven emirates whose largest cities include Dubai and Abu Dhabi.', 'اتحاد من سبع إمارات من أكبر مدنه دبي وأبوظبي.'],
    routeTypes: ['Real estate · Business setup', 'عقار · تأسيس نشاط تجاري'],
    authority: {label: ['UAE Government portal (u.ae) — Golden visa', 'البوابة الرسمية لحكومة الإمارات (u.ae) — الإقامة الذهبية'], url: 'https://u.ae/en/information-and-services/visa-and-emirates-id/residence-visas/golden-visa', checked: '2026-11-07'},
    publishReady: false,
  },
];

export const investmentPath = (p: InvestmentProgramme) => `services/${investmentCategories[p.category].service}/${p.slug}`;
export const investmentTitle = (p: InvestmentProgramme, ar: boolean) => ar ? `${investmentCategories[p.category].label[1]}: ${p.name[1]}` : p.source.title;
export function findInvestmentProgramme(path: string[]) {
  if (path[0] !== 'services' || !path[2] || path.length !== 3) return undefined;
  return investmentProgrammes.find(p => investmentCategories[p.category].service === path[1] && p.slug === path[2]);
}

export const serviceRoutes: Record<string, string[]> = {
  'skilled-immigration': ['canada-express-entry', 'australia-skilled-migration'],
  'work-visas': ['australia-work-visas', 'germany-nursing', 'germany-car-mechanics', 'sweden-work-permit', 'portugal-work-residence'],
  'business-immigration': ['canada-c11', 'usa-eb5', 'usa-e2'],
  'residency-by-investment': ['usa-eb5'],
  'citizenship-by-investment': ['citizenship-investment'],
  'study-abroad': ['study-visas'],
  'visit-visas': ['visit-visas'],
};

export const newServices = [
  {slug:'residency-by-investment',title:'Residency through investment',ar:'الإقامة عن طريق الاستثمار',short:'Plan around the status you need.',shortAr:'خطط وفق وضع الإقامة الذي تحتاجه.',description:'Explore how an investment-related route may fit your residence and family plans. Start with the documented U.S. EB-5 programme and a discussion of your circumstances.',descriptionAr:'استكشف مدى ملاءمة مسار مرتبط بالاستثمار لخطط الإقامة والأسرة. ابدأ ببرنامج EB-5 الأمريكي الموضح ومناقشة ظروفك.',icon:'building',items:['Residence objectives and family plans','Indicative budget and source-of-funds questions','Independent legal and financial advice to arrange','Programme risks, responsibilities and next steps'],itemsAr:['أهداف الإقامة وخطط الأسرة','الميزانية التقريبية وأسئلة مصدر الأموال','ترتيب المشورة القانونية والمالية المستقلة','مخاطر البرنامج والمسؤوليات والخطوات التالية'],countries:['United States']},
  {slug:'citizenship-by-investment',title:'Citizenship by investment',ar:'الجنسية عن طريق الاستثمار',short:'Start with your family’s priorities.',shortAr:'ابدأ بأولويات أسرتك.',description:'Discuss your citizenship and mobility objectives before choosing a programme. This is an initial enquiry service; no specific country or investment package is offered on this overview.',descriptionAr:'ناقش أهداف الجنسية والتنقل قبل اختيار البرنامج. هذه خدمة استفسار أولي؛ ولا تعرض هذه الصفحة دولة محددة أو حزمة استثمارية.',icon:'globe',items:['Your nationality, residence and family circumstances','Your reasons for exploring an additional citizenship','Timing and indicative budget for discussion','Questions for a qualified adviser before any commitment'],itemsAr:['الجنسية والإقامة وظروف الأسرة','أسباب استكشاف جنسية إضافية','التوقيت والميزانية التقريبية للنقاش','أسئلة للمستشار المؤهل قبل أي التزام'],countries:[]},
];

export const categoryServices: Record<string,string> = {skilled:'skilled-immigration',work:'work-visas',business:'business-immigration',citizenship:'citizenship-by-investment',study:'study-abroad',visit:'visit-visas'};

export const serviceNotes: Record<string, readonly [string,string]> = {
  'skilled-immigration':['Your qualifications and experience are the starting point. The linked programmes explain their distinct selection systems and residence outcomes.','مؤهلاتك وخبرتك نقطة البداية. تشرح البرامج المرتبطة أنظمة الاختيار ونتائج الإقامة المختلفة.'],
  'work-visas':['Tell us whether you already have an employer or job offer. We can discuss preparation and the responsibilities of the applicant and employer; employment and sponsorship are not guaranteed.','أخبرنا إن كان لديك صاحب عمل أو عرض وظيفي. نناقش التحضير ومسؤوليات مقدم الطلب وصاحب العمل؛ ولا نضمن التوظيف أو الكفالة.'],
  'business-immigration':['Business ownership, temporary permission to work and permanent residence are different objectives. Compare Canada C11, U.S. E-2 and EB-5 on their dedicated pages before discussing your plans.','ملكية الأعمال والإذن المؤقت بالعمل والإقامة الدائمة أهداف مختلفة. قارن C11 الكندي وE-2 وEB-5 الأمريكيين في صفحاتها قبل مناقشة خططك.'],
  'residency-by-investment':['Residence and citizenship are different outcomes. We do not advertise an investment project, a return or a guaranteed approval. Review the EB-5 details and seek independent advice before committing funds.','الإقامة والجنسية نتيجتان مختلفتان. لا نعلن مشروعاً استثمارياً أو عائداً أو موافقة مضمونة. راجع تفاصيل EB-5 واطلب مشورة مستقلة قبل الالتزام بأموال.'],
  'citizenship-by-investment':['The first conversation establishes what you want to achieve and which questions need specialist review. Country availability, costs and any professional representation must be confirmed before a service is agreed.','تحدد المحادثة الأولى أهدافك والأسئلة التي تحتاج إلى مراجعة متخصصة. يجب تأكيد الدول المتاحة والتكاليف وأي تمثيل مهني قبل الاتفاق على الخدمة.'],
  'study-abroad':['Share your intended destination, study plans and whether you already have an admission offer. We discuss student-visa preparation; university placement, admissions and scholarships are not promised.','شارك وجهتك وخطط الدراسة وما إذا كان لديك قبول دراسي. نناقش التحضير لتأشيرة الطالب؛ ولا نعد بتوفير مقعد جامعي أو قبول أو منحة.'],
  'visit-visas':['Tell us the purpose of your visit, intended destination and timing. The relevant application process can then be discussed around your nationality and residence, without assuming a universal checklist.','أخبرنا بغرض الزيارة والوجهة والتوقيت. نناقش إجراءات الطلب وفق جنسيتك وإقامتك دون افتراض قائمة متطلبات موحدة.'],
};

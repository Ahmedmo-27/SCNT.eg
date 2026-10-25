import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { EightPointStar } from '../components/ui/EightPointStar'
import { StarDivider } from '../components/ui/StarDivider'
import { useI18n } from '../i18n/I18nContext'

type PolicySection = {
  heading: { en: string; ar: string }
  body: { en: string[]; ar: string[] }
}

type PolicyProps = {
  kicker: { en: string; ar: string }
  title: { en: string; ar: string }
  intro: { en: string; ar: string }
  sections: PolicySection[]
  updated: { en: string; ar: string }
}

function PolicyPage({ kicker, title, intro, sections, updated }: PolicyProps) {
  const { locale } = useI18n()
  const isArabic = locale === 'ar'

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8 sm:py-20">
        <header className={`max-w-3xl ${isArabic ? 'text-right' : 'text-left'}`}>
          <p className="mb-3 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-scnt-text-muted">
            <EightPointStar size={9} className="opacity-45" />
            {kicker[locale]}
          </p>
          <h1 className="font-serif text-4xl text-scnt-text sm:text-5xl">{title[locale]}</h1>
          <p className="mt-4 text-lg leading-relaxed text-scnt-text-muted">{intro[locale]}</p>
        </header>

        <StarDivider className="py-8 sm:py-10" />

        <article
          className={`space-y-8 rounded-[2rem] border border-scnt-border/75 bg-scnt-card/70 p-6 shadow-[0_18px_60px_rgba(10,13,18,0.08)] backdrop-blur-sm sm:p-8 ${
            isArabic ? 'text-right' : 'text-left'
          }`}
        >
          {sections.map((section) => (
            <section key={section.heading[locale]} className="space-y-3">
              <h2 className="font-serif text-2xl text-scnt-text sm:text-3xl">{section.heading[locale]}</h2>
              {section.body[locale].map((paragraph) => (
                <p key={paragraph} className="text-base leading-relaxed text-scnt-text-muted">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>

        <p className="mt-10 text-sm text-scnt-text-muted">{updated[locale]}</p>

        <p className="mt-8 text-center text-sm text-scnt-text-muted">
          <Link
            to="/"
            className="inline-flex items-center gap-2 underline-offset-4 transition-opacity hover:opacity-75"
          >
            <EightPointStar size={10} className="opacity-40" />
            {isArabic ? 'العودة إلى الصفحة الرئيسية' : 'Back to home'}
          </Link>
        </p>
      </div>
    </Layout>
  )
}

const termsSections: PolicySection[] = [
  {
    heading: { en: 'Acceptance of Terms', ar: 'قبول الشروط' },
    body: {
      en: [
        'By placing an order with SCNT.eg, you agree to these Terms of Service and to the policies, pricing, and availability information displayed on the site at the time of purchase.',
        'We reserve the right to update these terms from time to time. Continued use of our website after changes are posted means you accept the revised terms.',
      ],
      ar: [
        'بمجرد تقديم طلبك على SCNT.eg، فإنك توافق على هذه شروط الاستخدام وعلى سياسات الموقع والأسعار والتوفر المعروضة وقت الشراء.',
        'نحتفظ بالحق في تحديث هذه الشروط من وقت لآخر. استمرار استخدام الموقع بعد نشر أي تغييرات يعني قبولك للشروط المعدلة.',
      ],
    },
  },
  {
    heading: { en: 'Orders and Product Information', ar: 'الطلبات ومعلومات المنتجات' },
    body: {
      en: [
        'We make every effort to describe our fragrances accurately, including notes, sizes, ingredients, and presentation. However, some variations in scent, color, and packaging may occur because fragrance products are handmade and naturally inspired.',
        'SCNT.eg reserves the right to refuse or cancel any order due to stock limitations, suspected fraud, or issues with payment verification. If an order is canceled, we will notify you promptly and refund any funds collected.',
      ],
      ar: [
        'نبذل كل الجهد لوصف عطورنا بدقة، بما في ذلك النوتات والأحجام والمكونات والتغليف. مع ذلك، قد تحدث بعض الاختلافات في الرائحة أو اللون أو التغليف لأن المنتجات عطرية ومصنوعة يدويًا ومستوحاة من الطبيعة.',
        'نحتفظ بالحق في رفض أو إلغاء أي طلب بسبب نقص المخزون أو النشاط المشتبه به أو مشاكل في التحقق من الدفع. إذا تم إلغاء الطلب، سنخطرك فورًا وسنُعيد أي مبالغ تم جمعها.',
      ],
    },
  },
  {
    heading: { en: 'Payments, Shipping, and Your Account', ar: 'الدفع والشحن وحسابك' },
    body: {
      en: [
        'Orders are processed only after confirmation of payment. We may use secure third-party payment providers and will not store full payment card details on our systems.',
        'You are responsible for keeping your account information accurate and secure. If you suspect unauthorized access to your account, contact us immediately so we can protect your order and personal data.',
      ],
      ar: [
        'لا تتم معالجة أي طلب إلا بعد تأكيد الدفع. قد نستخدم مزوّدين خارجيين آمنين للدفع، ولن نخزن تفاصيل بطاقة الدفع كاملة في أنظمتنا.',
        'أنت مسؤول عن الحفاظ على معلومات حسابك دقيقة وآمنة. إذا شككت في أي وصول غير مصرح به إلى حسابك، تواصل معنا فورًا حتى نتمكن من حماية طلبك وبياناتك الشخصية.',
      ],
    },
  },
  {
    heading: { en: 'Intellectual Property and Conduct', ar: 'الملكية الفكرية والسلوك' },
    body: {
      en: [
        'All copy, imagery, branding, product descriptions, and other materials on SCNT.eg are protected by copyright, trademark, and other intellectual property laws. You may not copy, reproduce, or redistribute our content without permission.',
        'You agree not to misuse the website, place false orders, interfere with service operations, or attempt to access areas of the platform that are not intended for public use.',
      ],
      ar: [
        'جميع النصوص والصور والعلامات التجارية ووصف المنتجات وغيرها من المواد الموجودة على SCNT.eg محمية بقوانين حقوق الملكية الفكرية. لا يجوز لك نسخ أو إعادة إنتاج أو إعادة توزيع محتوى الموقع دون إذن.',
        'أنت توافق على عدم إساءة استخدام الموقع أو تقديم طلبات مزيفة أو التدخل في تشغيل الخدمة أو محاولة الوصول إلى أجزاء من المنصة ليست مخصصة للاستخدام العام.',
      ],
    },
  },
  {
    heading: { en: 'Liability and Governing Law', ar: 'تحديد المسؤولية والقانون الحاكم' },
    body: {
      en: [
        'SCNT.eg strives to provide a reliable and enjoyable shopping experience, but we do not guarantee that the website will be free from interruptions, technical errors, or compatibility issues.',
        'These terms are governed by the laws of the Arab Republic of Egypt, and any disputes will be resolved through the applicable courts in Egypt unless otherwise required by law.',
      ],
      ar: [
        'تسعى SCNT.eg لتقديم تجربة تسوق موثوقة وممتعة، لكنها لا تضمن أن يكون الموقع خاليًا من الانقطاعات أو الأخطاء التقنية أو مشاكل التوافق.',
        'تخضع هذه الشروط لقوانين جمهورية مصر العربية، ويتم حل أي نزاعات من خلال المحاكم المختصة في مصر ما لم يلزم القانون غير ذلك.',
      ],
    },
  },
]

export function TermsPage() {
  return (
    <PolicyPage
      kicker={{ en: 'Legal Notice', ar: 'إشعار قانوني' }}
      title={{ en: 'Terms of Service', ar: 'شروط الاستخدام' }}
      intro={{
        en: 'These terms explain how our store operates and what you agree to when you place an order with SCNT.eg.',
        ar: 'تشرح هذه الشروط كيفية عمل متجرنا وما توافق عليه عند تقديم طلب على SCNT.eg.',
      }}
      sections={termsSections}
      updated={{
        en: 'Last updated: October 2026',
        ar: 'آخر تحديث: أكتوبر 2026',
      }}
    />
  )
}

const refundSections: PolicySection[] = [
  {
    heading: { en: 'General Policy', ar: 'السياسة العامة' },
    body: {
      en: [
        'We want every order to feel right. If you are unsatisfied with your purchase, we can review eligible returns and refund requests in accordance with this Refund Policy.',
        'Refund eligibility depends on the condition of the product, the reason for the return, and whether the item has been opened, used, or damaged in transit.',
      ],
      ar: [
        'نرغب في أن يشعر كل طلب بالرضا. إذا كنت غير راضٍ عن طلبك، يمكننا مراجعة طلبات الاسترجاع والمبالغ المعادة وفقًا لهذه السياسة.',
        'يعتمد أهلية الاسترداد على حالة المنتج وسبب الإرجاع وما إذا كان العنصر قد تم فتحه أو استخدامه أو تلفه أثناء الشحن.',
      ],
    },
  },
  {
    heading: { en: 'Damaged, Incorrect, or Defective Products', ar: 'المنتجات التالفة أو غير الصحيحة أو المعيبة' },
    body: {
      en: [
        'If your order arrives damaged, incorrect, or defective, please contact us within 48 hours of delivery with your order number and clear photos of the item and packaging.',
        'Upon review, we may offer a replacement, store credit, or refund for the affected product when the issue is verified.',
      ],
      ar: [
        'إذا وصل طلبك تالفًا أو غير صحيح أو معيبًا، يرجى التواصل معنا خلال 48 ساعة من التوصيل مع رقم الطلب وصور واضحة للمنتج والتغليف.',
        'بعد المراجعة، قد نقدم استبدالًا أو رصيد متجر أو استردادًا للمنتج المتضرر عند التحقق من المشكلة.',
      ],
    },
  },
  {
    heading: { en: 'Unopened and Unused Items', ar: 'العناصر غير المفتوحة وغير المستخدمة' },
    body: {
      en: [
        'For unopened, unused items in their original condition, we may accept a return within 7 days from the date you receive the package, subject to review and to the condition of the item.',
        'Please note that fragrance products are personal care items, so hygiene and product integrity are important. We may decline returns that show signs of use, opening, or damage beyond normal shipping wear.',
      ],
      ar: [
        'بالنسبة للعناصر غير المفتوحة وغير المستخدمة وبحالتها الأصلية، فقد نقبل الإرجاع خلال 7 أيام من تاريخ استلام الطرد، مع مراعاة المراجعة وحالة المنتج.',
        'يرجى ملاحظة أن منتجات العطور هي منتجات للعناية الشخصية، لذلك فإن النظافة وسلامة المنتج مهمة. قد نرفض الاسترداد إذا ظهرت علامات استخدام أو فتح أو تلف خارج الاستخدام العادي أثناء الشحن.',
      ],
    },
  },
  {
    heading: { en: 'Refund Timeline and Method', ar: 'مواعيد الاسترداد وطريقة الدفع' },
    body: {
      en: [
        'Approved refunds are typically processed within 5 to 10 business days after the return is received and approved. The time it takes to appear in your account may vary by payment provider.',
        'Refunds will be issued back to the original payment method unless otherwise agreed in writing with SCNT.eg.',
      ],
      ar: [
        'يتم عادةً معالجة المبالغ المستردة خلال 5 إلى 10 أيام عمل بعد استلام الإرجاع والموافقة عليه. قد يختلف الوقت اللازم لظهور المبلغ في حسابك حسب مزود الدفع.',
        'سيتم إرجاع المبلغ إلى طريقة الدفع الأصلية ما لم يتم الاتفاق على خلاف ذلك كتابيًا مع SCNT.eg.',
      ],
    },
  },
  {
    heading: { en: 'Non-Refundable Cases', ar: 'الحالات غير المستردة' },
    body: {
      en: [
        'Items marked as final sale, personalized products, or opened fragrance samples are generally not eligible for return unless they are damaged or defective at the time of delivery.',
        'If a dispute cannot be resolved amicably, we may refer the matter to the appropriate consumer protection channels and relevant local authorities.',
      ],
      ar: [
        'العناصر المعلمة كبيع نهائي أو المنتجات المخصصة أو عينات العطر المفتوحة لا تكون عادةً مؤهلة للاسترجاع إلا إذا كانت تالفة أو معيبة عند التسليم.',
        'إذا تعذر حل النزاع بشكل ودّي، فقد نُحيل الأمر إلى قنوات حماية المستهلك المناسبة والجهات الرسمية المعنية.',
      ],
    },
  },
]

export function RefundPolicyPage() {
  return (
    <PolicyPage
      kicker={{ en: 'Customer Care', ar: 'خدمة العملاء' }}
      title={{ en: 'Refund Policy', ar: 'سياسة الاسترجاع' }}
      intro={{
        en: 'Our refund process is designed to be fair, transparent, and quick when a product arrives damaged, incorrect, or simply does not meet expectations.',
        ar: 'تم تصميم عملية الاسترجاع لتكون عادلة وشفافة وسريعة عندما يصل المنتج تالِفًا أو غير صحيح أو لا يلبي التوقعات.',
      }}
      sections={refundSections}
      updated={{
        en: 'Last updated: October 2026',
        ar: 'آخر تحديث: أكتوبر 2026',
      }}
    />
  )
}

const privacySections: PolicySection[] = [
  {
    heading: { en: 'Information We Collect', ar: 'المعلومات التي نجمعها' },
    body: {
      en: [
        'We may collect information you provide directly, such as your name, email address, phone number, billing and shipping details, and order history. We also collect technical information about your device, browser, and browsing activity when you visit the site.',
        'This data helps us process orders, protect your account, and improve the shopping experience across products, collections, and customer support interactions.',
      ],
      ar: [
        'قد نجمع المعلومات التي تقدمها مباشرةً، مثل اسمك وبريدك الإلكتروني ورقم هاتفك وتفاصيل الفوترة والشحن وسجل الطلبات. كما نجمع معلومات تقنية عن جهازك والمتصفح ونشاط التصفح عند زيارة الموقع.',
        'تساعدنا هذه البيانات على معالجة الطلبات وحماية حسابك وتحسين تجربة التسوق عبر المنتجات والمجموعات وتفاعلات دعم العملاء.',
      ],
    },
  },
  {
    heading: { en: 'How We Use Your Information', ar: 'كيفية استخدام معلوماتك' },
    body: {
      en: [
        'Your information is used to fulfill orders, communicate about delivery or support requests, improve website functionality, and personalize relevant product recommendations when appropriate.',
        'We may also use limited data to detect fraud, support account security, and comply with applicable legal or regulatory obligations.',
      ],
      ar: [
        'تُستخدم معلوماتك لتلبية الطلبات، والتواصل بخصوص التوصيل أو طلبات الدعم، وتحسين وظائف الموقع، وتخصيص توصيات المنتجات ذات الصلة عند اللزوم.',
        'قد نستخدم بيانات محدودة أيضًا للكشف عن الاحتيال، ودعم أمان الحساب، والامتثال للالتزامات القانونية والتنظيمية المعمول بها.',
      ],
    },
  },
  {
    heading: { en: 'Sharing and Third Parties', ar: 'مشاركة المعلومات مع الأطراف الثالثة' },
    body: {
      en: [
        'We may share information with trusted service providers that help us operate the website, handle shipping, process payments, or support customer service. These providers are contractually required to protect your data and use it only as authorized.',
        'We do not sell personal information. However, we may disclose data when required by law, court order, or to protect the safety and rights of our customers and business.',
      ],
      ar: [
        'قد نشارك المعلومات مع مزوّدين موثوقين يساعدوننا في تشغيل الموقع أو التعامل مع الشحن أو معالجة الدفع أو دعم خدمة العملاء. يُلزم هؤلاء المزودون التزامًا تعاقديًا بحماية بياناتك واستخدامها فقط للأغراض المصرح بها.',
        'لا نبيع المعلومات الشخصية. ومع ذلك، فقد نكشف عن البيانات عندما يطلب القانون ذلك أو بموجب أمر محكمة أو لحماية سلامة وحقوق عملائنا وأعمالنا.',
      ],
    },
  },
  {
    heading: { en: 'Cookies and Site Analytics', ar: 'ملفات تعريف الارتباط والتحليلات' },
    body: {
      en: [
        'SCNT.eg uses cookies and similar technologies to remember your preferences, support secure checkout, and understand how visitors move through the site. This helps us improve product discovery, merchandising, and overall performance.',
        'You can manage cookie settings in your browser. Please note that disabling some cookies may limit certain features, including cart or checkout functionality.',
      ],
      ar: [
        'يستخدم SCNT.eg ملفات تعريف الارتباط والتقنيات المماثلة لتذكر تفضيلاتك، ودعم الدفع الآمن، وفهم كيفية تنقل الزوار داخل الموقع. يساعدنا ذلك على تحسين اكتشاف المنتجات، وعرض المنتجات، والأداء العام.',
        'يمكنك إدارة إعدادات ملفات تعريف الارتباط من متصفحك. يرجى ملاحظة أن تعطيل بعض ملفات تعريف الارتباط قد يحد من بعض الميزات، بما في ذلك سلة التسوق أو وظيفة الدفع.',
      ],
    },
  },
  {
    heading: { en: 'Security and Your Rights', ar: 'الأمان وحقوقك' },
    body: {
      en: [
        'We use reasonable administrative, technical, and physical safeguards to protect your data. However, no system can be guaranteed completely secure, so we encourage you to use strong passwords and contact us immediately if you suspect any unauthorized activity.',
        'Depending on your location and applicable law, you may have rights to access, correct, or request deletion of your personal data. Contact us using the information in the Contact page to exercise those rights.',
      ],
      ar: [
        'نستخدم تدابير معقولة أمنية إدارية وتقنية ومادية لحماية بياناتك. ومع ذلك، لا يمكن ضمان أمان كامل لأي نظام، لذلك نشجعك على استخدام كلمات مرور قوية والتواصل معنا فورًا إذا اشتبهت في أي نشاط غير مصرح به.',
        'اعتمادًا على موقعك والقانون المعمول به، قد تكون لديك حقوق في الوصول إلى بياناتك الشخصية أو تصحيحها أو طلب حذفها. تواصل معنا باستخدام المعلومات الموجودة في صفحة التواصل لممارسة هذه الحقوق.',
      ],
    },
  },
]

export function PrivacyPolicyPage() {
  return (
    <PolicyPage
      kicker={{ en: 'Privacy', ar: 'الخصوصية' }}
      title={{ en: 'Privacy Policy', ar: 'سياسة الخصوصية' }}
      intro={{
        en: 'Your privacy matters to us. This page explains what information we collect, how we use it, and how we protect it while you shop with SCNT.eg.',
        ar: 'خصوصيتك مهمة بالنسبة لنا. تشرح هذه الصفحة ما هي المعلومات التي نجمعها وكيف نستخدمها وكيف نحميها أثناء التسوق عبر SCNT.eg.',
      }}
      sections={privacySections}
      updated={{
        en: 'Last updated: October 2026',
        ar: 'آخر تحديث: أكتوبر 2026',
      }}
    />
  )
}

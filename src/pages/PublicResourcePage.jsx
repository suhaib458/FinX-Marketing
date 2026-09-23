import { Link } from 'react-router-dom';
import { BookOpen, CircleHelp, LifeBuoy, Mail, MessageCircleQuestion, ArrowLeft, ArrowRight, FileText, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const SUPPORT_ISSUES_URL = 'https://github.com/suhaib458/FinX-Marketing/issues/new';

const content = {
  ar: {
    blog: {
      icon: BookOpen,
      eyebrow: 'مدونة FinX',
      title: 'أفكار عملية لتسويق أذكى',
      subtitle: 'محتوى قصير ومباشر يساعدك على بناء حضور أفضل وصناعة محتوى أسرع.',
      cards: [
        { tag: 'المحتوى', title: 'كيف تحوّل فكرة واحدة إلى أسبوع كامل من المحتوى؟', body: 'ابدأ برسالة واحدة واضحة، ثم حوّلها إلى منشور، قصة، فيديو قصير وسؤال تفاعلي بدل البحث عن فكرة جديدة كل يوم.' },
        { tag: 'العلامة التجارية', title: 'ثبات الهوية أهم من كثرة التصاميم', body: 'استخدم ألوانًا ونبرة ورسائل ثابتة حتى يتعرّف الجمهور على علامتك بسرعة، حتى قبل أن يرى اسمها.' },
        { tag: 'الذكاء الاصطناعي', title: 'كيف تستخدم الذكاء الاصطناعي بدون أن يبدو المحتوى آليًا؟', body: 'أعطِ الأداة سياقًا عن جمهورك، أسلوبك والهدف من المنشور، ثم راجع النتيجة وعدّلها لتبقى بصوت علامتك.' },
      ],
    },
    help: {
      icon: LifeBuoy,
      eyebrow: 'مركز الدعم',
      title: 'كيف نقدر نساعدك؟',
      subtitle: 'إجابات سريعة على أكثر الأمور التي تحتاجها أثناء استخدام FinX.',
      cards: [
        { tag: 'البداية', title: 'إنشاء الحساب والبدء', body: 'أنشئ حسابك، أكمل بيانات نشاطك، ثم اختر أداة المحتوى المناسبة وابدأ أول عملية إنشاء.' },
        { tag: 'الحساب', title: 'مشاكل تسجيل الدخول', body: 'تأكد من البريد وكلمة المرور، أو استخدم استعادة كلمة المرور. تسجيل Google يعمل من نطاق ويب مصرح وآمن.' },
        { tag: 'المحتوى', title: 'إنشاء وحفظ المحتوى', body: 'بعد إنشاء المحتوى يمكنك مراجعته، إنشاء نسخة بديلة وحفظ النتائج داخل مكتبتك.' },
      ],
    },
    faq: {
      icon: MessageCircleQuestion,
      eyebrow: 'الأسئلة الشائعة',
      title: 'إجابات بدون لف ودوران',
      subtitle: 'أهم الأسئلة عن FinX في مكان واحد.',
      questions: [
        ['هل أحتاج بطاقة بنكية للتجربة؟', 'لا. يمكنك بدء التجربة المجانية بدون بطاقة بنكية.'],
        ['هل FinX يدعم العربية؟', 'نعم، الواجهة والمحتوى يدعمان العربية والإنجليزية.'],
        ['هل يمكنني استخدامه من الهاتف؟', 'نعم. الواجهة متجاوبة وتعمل على الهاتف والتابلت والكمبيوتر.'],
        ['هل يتم حفظ المحتوى؟', 'يمكنك حفظ المحتوى الذي تختاره داخل المكتبة والرجوع إليه لاحقًا.'],
        ['لماذا قد لا يعمل Google أثناء الاختبار المحلي؟', 'Google/Firebase يرفضان بعض عناوين الشبكة المحلية غير المصرح بها. استخدم النسخة المنشورة عبر HTTPS لاختبار Google بشكل صحيح.'],
      ],
    },
    contact: {
      icon: Mail,
      eyebrow: 'تواصل معنا',
      title: 'الدعم التقني للنموذج الحالي',
      subtitle: 'إذا واجهتك مشكلة تقنية أو عندك ملاحظة، افتح تذكرة دعم وسنقدر نتابعها بشكل منظم.',
      ticket: 'فتح تذكرة دعم',
      note: 'يتم فتح التذكرة حاليًا عبر مستودع المشروع على GitHub إلى أن يتم ربط قناة الدعم الرسمية داخل FinX.',
    },
    terms: {
      icon: FileText,
      eyebrow: 'قانوني',
      title: 'الشروط والأحكام',
      subtitle: 'الشروط الأساسية لاستخدام FinX بطريقة واضحة ومباشرة.',
      sections: [
        ['استخدام الخدمة', 'باستخدام FinX فإنك توافق على استخدام المنصة للأغراض المشروعة وعدم إساءة استخدام الخدمات أو محاولة تعطيلها أو الوصول غير المصرح إلى أنظمتها.'],
        ['الحساب والمسؤولية', 'أنت مسؤول عن صحة بيانات حسابك والمحافظة على وسيلة تسجيل الدخول الخاصة بك. لا تشارك كلمة المرور أو بيانات الوصول مع أطراف غير موثوقة.'],
        ['المحتوى والذكاء الاصطناعي', 'قد ينشئ FinX محتوى بمساعدة الذكاء الاصطناعي. يجب مراجعة المخرجات قبل النشر، وتبقى مسؤولية استخدامها النهائي وملاءمتها لعلامتك أو نشاطك على المستخدم.'],
        ['الملكية الفكرية', 'تظل المواد التي ترفعها إلى FinX ملكًا لك أو لأصحاب الحقوق فيها. لا يجوز رفع محتوى لا تملك حق استخدامه.'],
        ['تغييرات الخدمة', 'قد تتغير بعض خصائص FinX أثناء التطوير، وسنعمل على توضيح أي تغييرات جوهرية تؤثر في طريقة استخدام الخدمة.'],
      ],
    },
    privacy: {
      icon: ShieldCheck,
      eyebrow: 'قانوني',
      title: 'سياسة الخصوصية',
      subtitle: 'ملخص واضح للبيانات التي يحتاجها FinX وكيف تُستخدم داخل الخدمة.',
      sections: [
        ['البيانات التي نجمعها', 'قد نعالج بيانات الحساب مثل الاسم والبريد الإلكتروني، وبيانات نشاطك التي تدخلها داخل FinX، والمحتوى أو الصور التي تختار رفعها لاستخدام ميزات المنصة.'],
        ['تسجيل الدخول', 'تستخدم FinX خدمة Firebase Authentication لإدارة تسجيل الدخول. عند استخدام Google قد تتم معالجة معلومات الحساب الأساسية اللازمة لإتمام المصادقة.'],
        ['كيف نستخدم البيانات', 'تستخدم البيانات لتشغيل حسابك، تقديم ميزات إنشاء المحتوى، حفظ إعداداتك ونتائجك، وتحسين موثوقية وأمان الخدمة.'],
        ['المشاركة والحماية', 'لا نبيع بياناتك. قد تعالج الجهات المزودة للبنية التحتية البيانات بالقدر اللازم لتشغيل الخدمة، مع تطبيق ضوابط الحماية المناسبة.'],
        ['اختياراتك', 'يمكنك التوقف عن استخدام الخدمة في أي وقت. ومع توسع النسخة الإنتاجية ستتوفر إجراءات أوضح لإدارة بيانات الحساب وطلبات الحذف.'],
      ],
    },
    back: 'العودة للرئيسية',
    helpCta: 'مركز الدعم',
    faqCta: 'الأسئلة الشائعة',
  },
  en: {
    blog: {
      icon: BookOpen,
      eyebrow: 'FinX Blog',
      title: 'Practical ideas for smarter marketing',
      subtitle: 'Short, useful guidance to build a stronger presence and create content faster.',
      cards: [
        { tag: 'Content', title: 'Turn one idea into a full week of content', body: 'Start with one clear message, then adapt it into a post, story, short video and interactive question instead of hunting for a new idea every day.' },
        { tag: 'Brand', title: 'Consistency matters more than endless designs', body: 'Keep colors, tone and messages consistent so people can recognize your brand before they even see its name.' },
        { tag: 'AI', title: 'Use AI without sounding robotic', body: 'Give the tool context about your audience, voice and goal, then review the result so it still sounds like your brand.' },
      ],
    },
    help: {
      icon: LifeBuoy,
      eyebrow: 'Help Center',
      title: 'How can we help?',
      subtitle: 'Quick answers for the most common things you need while using FinX.',
      cards: [
        { tag: 'Getting started', title: 'Create your account and begin', body: 'Create an account, complete your business profile, choose a content tool and start your first generation.' },
        { tag: 'Account', title: 'Sign-in problems', body: 'Check your email and password, or use password recovery. Google sign-in requires an authorized secure web domain.' },
        { tag: 'Content', title: 'Create and save content', body: 'After generation you can review the result, create a variation and save it to your library.' },
      ],
    },
    faq: {
      icon: MessageCircleQuestion,
      eyebrow: 'FAQ',
      title: 'Straight answers',
      subtitle: 'The most common FinX questions in one place.',
      questions: [
        ['Do I need a credit card to try FinX?', 'No. You can start the free experience without a credit card.'],
        ['Does FinX support Arabic?', 'Yes. The interface and generated content support Arabic and English.'],
        ['Can I use FinX on my phone?', 'Yes. The interface is responsive across phones, tablets and desktop computers.'],
        ['Is my content saved?', 'You can save selected content to your library and return to it later.'],
        ['Why can Google fail during LAN testing?', 'Google/Firebase reject some unauthorized local-network origins. Use the deployed HTTPS version to test Google sign-in correctly.'],
      ],
    },
    contact: {
      icon: Mail,
      eyebrow: 'Contact',
      title: 'Technical support for the current prototype',
      subtitle: 'If you hit a technical issue or have feedback, open a support ticket so it can be tracked properly.',
      ticket: 'Open a support ticket',
      note: 'Tickets currently open through the project repository on GitHub until an official in-app support channel is connected.',
    },
    terms: {
      icon: FileText,
      eyebrow: 'Legal',
      title: 'Terms of Service',
      subtitle: 'The essential terms for using FinX, written in plain language.',
      sections: [
        ['Using the service', 'By using FinX, you agree to use the platform lawfully and not misuse, disrupt, or attempt unauthorized access to its systems.'],
        ['Account responsibility', 'You are responsible for accurate account information and for protecting your sign-in method. Do not share passwords or access details with untrusted parties.'],
        ['AI-generated content', 'FinX may generate content with AI assistance. Review outputs before publishing; the final decision to use generated material remains yours.'],
        ['Intellectual property', 'Materials you upload remain yours or belong to their respective rights holders. Do not upload content you do not have permission to use.'],
        ['Service changes', 'FinX features may evolve during development. Material changes that affect how the service works will be communicated as the product matures.'],
      ],
    },
    privacy: {
      icon: ShieldCheck,
      eyebrow: 'Legal',
      title: 'Privacy Policy',
      subtitle: 'A clear summary of the information FinX needs and how it is used.',
      sections: [
        ['Information we process', 'We may process account details such as your name and email, business information you enter, and content or images you choose to upload for FinX features.'],
        ['Authentication', 'FinX uses Firebase Authentication for sign-in. When you use Google, basic account information needed to complete authentication may be processed.'],
        ['How information is used', 'Information is used to operate your account, provide content-generation features, store preferences and results, and improve service reliability and security.'],
        ['Sharing and protection', 'We do not sell your data. Infrastructure providers may process information only as needed to operate the service, subject to appropriate safeguards.'],
        ['Your choices', 'You can stop using the service at any time. As the production service expands, clearer account-data management and deletion procedures will be added.'],
      ],
    },
    back: 'Back to home',
    helpCta: 'Help Center',
    faqCta: 'FAQ',
  },
};

export default function PublicResourcePage({ type }) {
  const { language } = useLanguage();
  const copy = content[language === 'ar' ? 'ar' : 'en'];
  const resource = copy[type] || copy.help;
  const Icon = resource.icon;
  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <section className="resource-page page-enter">
      <div className="resource-page__glow resource-page__glow--one" aria-hidden="true" />
      <div className="resource-page__glow resource-page__glow--two" aria-hidden="true" />

      <div className="resource-page__container">
        <Link to="/" className="resource-page__back">
          <ArrowIcon size={17} />
          <span>{copy.back}</span>
        </Link>

        <header className="resource-hero">
          <div className="resource-hero__icon"><Icon size={24} /></div>
          <span className="resource-hero__eyebrow">{resource.eyebrow}</span>
          <h1>{resource.title}</h1>
          <p>{resource.subtitle}</p>
        </header>

        {(type === 'blog' || type === 'help') && (
          <div className="resource-card-grid">
            {resource.cards.map((card) => (
              <article className="resource-card" key={card.title}>
                <span>{card.tag}</span>
                <h2>{card.title}</h2>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        )}

        {type === 'faq' && (
          <div className="resource-faq">
            {resource.questions.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        )}

        {(type === 'terms' || type === 'privacy') && (
          <div className="resource-legal">
            {resource.sections.map(([title, body]) => (
              <article key={title}>
                <h2>{title}</h2>
                <p>{body}</p>
              </article>
            ))}
          </div>
        )}

        {type === 'contact' && (
          <div className="resource-contact">
            <div className="resource-contact__icon"><CircleHelp size={30} /></div>
            <p>{resource.note}</p>
            <a href={SUPPORT_ISSUES_URL} target="_blank" rel="noreferrer" className="resource-primary-action">
              <LifeBuoy size={18} />
              <span>{resource.ticket}</span>
            </a>
          </div>
        )}

        <div className="resource-page__actions">
          {type !== 'help' && <Link to="/help">{copy.helpCta}</Link>}
          {type !== 'faq' && <Link to="/faq">{copy.faqCta}</Link>}
        </div>
      </div>
    </section>
  );
}

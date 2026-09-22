import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import {
  MessageSquare,
  Palette,
  Lightbulb,
  Calendar,
  Clock3,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Play,
  Check,
  BarChart3,
  Image as ImageIcon,
  WandSparkles,
  TrendingUp,
  Store,
  Laptop,
  UsersRound,
  ShieldCheck,
  Globe2,
  Layers3,
} from 'lucide-react';

const platforms = [
  { label: 'Instagram' },
  { label: 'TikTok' },
  { label: 'Facebook' },
  { label: 'X' },
  { label: 'YouTube' },
  { label: 'LinkedIn' },
];

function PlatformIcon({ item }) {
  if (item.label === 'Instagram') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (item.label === 'TikTok') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
      </svg>
    );
  }
  if (item.label === 'Facebook') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3" />
      </svg>
    );
  }
  if (item.label === 'YouTube') {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M22 12s0-3-1-5c-.5-1-1.4-1.6-2.5-1.8C16.6 5 12 5 12 5s-4.6 0-6.5.2C4.4 5.4 3.5 6 3 7c-1 2-1 5-1 5s0 3 1 5c.5 1 1.4 1.6 2.5 1.8C7.4 19 12 19 12 19s4.6 0 6.5-.2c1.1-.2 2-.8 2.5-1.8 1-2 1-5 1-5Z" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }
  if (item.label === 'LinkedIn') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="9" width="4" height="11" />
        <circle cx="5" cy="5" r="2" />
        <path d="M11 20V9h4v2c1-1.5 2.3-2.3 4-2.3 2.8 0 3 2.4 3 5.3v6h-4v-5.4c0-1.6-.2-2.7-1.5-2.7-1.7 0-1.5 2-1.5 3.4V20h-4Z" />
      </svg>
    );
  }
  return <span className="landing-platform-letter" lang="en">{item.label === 'X' ? '𝕏' : item.label[0]}</span>;
}

function HeroStudioVisual({ language }) {
  const ar = language === 'ar';
  return (
    <div className="landing-studio" aria-hidden="true">
      <div className="landing-studio__halo landing-studio__halo--one" />
      <div className="landing-studio__halo landing-studio__halo--two" />
      <div className="landing-studio__orbit landing-studio__orbit--one" />
      <div className="landing-studio__orbit landing-studio__orbit--two" />

      <div className="landing-studio__panel landing-studio__panel--main">
        <div className="landing-studio__brand" lang="en">FinX</div>
        <div className="landing-studio__prompt">
          <span>{ar ? 'اكتب منشور لعرض خاص' : 'Write a post for a special offer'}</span>
          <strong>{ar ? 'لمطعم برجر عصري' : 'for a modern burger restaurant'}</strong>
        </div>
        <button type="button" tabIndex="-1">
          <Sparkles size={14} />
          {ar ? 'إنشاء' : 'Generate'}
        </button>
      </div>

      <div className="landing-studio__panel landing-studio__panel--tools">
        {[
          [Palette, ar ? 'تصميم' : 'Design'],
          [MessageSquare, ar ? 'منشور' : 'Post'],
          [Calendar, ar ? 'حملة' : 'Campaign'],
          [Lightbulb, ar ? 'أفكار' : 'Ideas'],
        ].map(([Icon, label]) => (
          <span key={label}><Icon size={13} /> {label}</span>
        ))}
      </div>

      <div className="landing-studio__panel landing-studio__panel--ad">
        <span className="landing-studio__eyebrow">{ar ? 'إعلان جاهز للنشر' : 'Publish-ready ad'}</span>
        <strong>{ar ? 'عرض نهاية الأسبوع' : 'Weekend offer'}</strong>
        <div className="landing-studio__ad-art">
          <span>50%</span>
          <i />
        </div>
        <div className="landing-studio__social-dots">
          <i /><i /><i /><i />
        </div>
      </div>

      <div className="landing-studio__panel landing-studio__panel--growth">
        <TrendingUp size={16} />
        <strong lang="en">+240%</strong>
        <span>{ar ? 'نمو التفاعل' : 'engagement growth'}</span>
        <div className="landing-studio__bars">
          {[36, 62, 84].map((height) => <i key={height} style={{ height: `${height}%` }} />)}
        </div>
      </div>

      <div className="landing-studio__panel landing-studio__panel--caption">
        <div className="landing-studio__caption-platform"><PlatformIcon item={{ label: 'Instagram' }} /><span>Instagram</span></div>
        <strong>{ar ? 'جاهز للنشر' : 'Ready to publish'}</strong>
        <i /><i /><i />
        <div className="landing-studio__caption-actions"><span /><span /><span /></div>
      </div>

      <div className="landing-studio__spark landing-studio__spark--1"><Sparkles size={14} /></div>
      <div className="landing-studio__spark landing-studio__spark--2"><WandSparkles size={13} /></div>
    </div>
  );
}

function ToolVisual({ type }) {
  if (type === 'post') {
    return (
      <div className="landing-tool-preview landing-tool-preview--post">
        <div className="landing-tool-preview__header"><PlatformIcon item={{ label: 'Instagram' }} /><span>Instagram</span></div>
        <i /><i /><i />
        <button tabIndex="-1">•••</button>
      </div>
    );
  }

  if (type === 'design') {
    return (
      <div className="landing-tool-preview landing-tool-preview--design">
        <span>Special<br />Offer</span>
        <div className="landing-tool-preview__product"><i /><i /></div>
        <div className="landing-tool-preview__socials"><b /><b /><b /></div>
      </div>
    );
  }

  if (type === 'ideas') {
    return (
      <div className="landing-tool-preview landing-tool-preview--ideas">
        <span>Reels</span><span>Instagram</span><span>Offers</span><span>Educational</span>
      </div>
    );
  }

  return (
    <div className="landing-tool-preview landing-tool-preview--campaign">
      <div className="landing-tool-preview__calendar-head">SEP 2026</div>
      <div className="landing-tool-preview__calendar-grid">
        {Array.from({ length: 15 }, (_, index) => <i className={index === 10 ? 'is-active' : ''} key={index} />)}
      </div>
    </div>
  );
}

function WhyCard({ icon: Icon, title, body, variant = 'purple', children }) {
  return (
    <article className={`landing-why-card landing-why-card--${variant}`}>
      <div className="landing-why-card__icon"><Icon size={20} /></div>
      <div className="landing-why-card__copy">
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      {children}
    </article>
  );
}

function Landing() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { info } = useToast();
  const isArabic = language === 'ar';
  const ArrowIcon = isArabic ? ArrowLeft : ArrowRight;

  const copy = isArabic
    ? {
        badge: 'مساعدك التسويقي بالذكاء الاصطناعي',
        heroLead: 'من',
        heroAccent: 'الفكرة',
        heroMiddle: 'إلى',
        heroStrong: 'محتوى جاهز للنشر.',
        heroSubtitle: 'أنشئ تصاميم، منشورات، حملات تسويقية وأفكار محتوى احترافية خلال دقائق باستخدام قوة الذكاء الاصطناعي.',
        start: 'ابدأ مجانًا',
        seeHow: 'شاهد كيف يعمل',
        credits: '100 رصيد مجاني',
        noCard: 'بدون بطاقة بنكية',
        platforms: 'مناسب لجميع المنصات',
        trusted: 'محتوى مصمم ليلائم أهم المنصات',
        whyTitle: 'لماذا تختار FinX؟',
        whySubtitle: 'أكثر من مجرد أداة، فريقك التسويقي الذكي.',
        whyBrand: 'هوية علامتك محفوظة',
        whyBrandBody: 'محتوى يعكس أسلوبك وألوانك واتساق علامتك التجارية.',
        whyTime: 'وفّر ساعات من العمل',
        whyTimeBody: 'حوّل ساعات من التفكير والكتابة إلى دقائق بمساعدة الذكاء الاصطناعي.',
        whyReady: 'تصاميم جاهزة للنشر',
        whyReadyBody: 'محتوى بصري احترافي لكل المنصات.',
        whyAnalytics: 'تحليل الأداء وتحسين النتائج',
        whyAnalyticsBody: 'تابع أداء محتواك واحصل على توصيات ذكية.',
        whyIdeas: 'أفكار لا تنتهي',
        whyIdeasBody: 'اقتراحات يومية تتناسب مع مجال عملك وجمهورك.',
        toolsSubtitle: 'أدوات ذكية ونتائج حقيقية، في مكان واحد.',
        howSubtitle: 'ثلاث خطوات بسيطة تفصل بين فكرتك ومحتوى احترافي.',
        step1Body: 'اخبرنا عن نشاطك وجمهورك وأهدافك.',
        step2Body: 'حدد نوع المحتوى والمنصة المناسبة.',
        step3Body: 'احصل على محتوى وتصاميم جاهزة للنشر.',
        audienceSubtitle: 'سواء كنت صاحب مشروع، مستقلًا أو صانع محتوى — FinX يعمل معك.',
        audience1Body: 'حلول عملية لتطوير علامتك وزيادة مبيعاتك.',
        audience2Body: 'محتوى احترافي يوفر وقتك ويرفع حضورك.',
        audience3Body: 'أفكار لا تنتهي ومحتوى يلفت الانتباه.',
        pricingSubtitle: 'اختر الخطة المناسبة لطموحاتك.',
        monthly: 'شهري',
        yearly: 'سنوي',
        save20: 'وفر 20%',
        popular: 'الأكثر شعبية',
        startNow: 'ابدأ الآن',
        finalTitle: 'فكرتك تستحق محتوى أفضل.',
        finalSubtitle: 'انضم إلى المبدعين وأصحاب المشاريع الذين يحولون أفكارهم إلى محتوى مميز مع FinX.',
        finalFoot: 'لا تحتاج بطاقة بنكية',
        product: 'المنتج',
        help: 'المساعدة',
        legal: 'قانوني',
        productLinks: ['المميزات', 'التحديثات', 'دليل الاستخدام'],
        helpLinks: ['مركز الدعم', 'تواصل معنا', 'الأسئلة الشائعة'],
        legalLinks: ['الشروط والأحكام', 'سياسة الخصوصية'],
        footerText: 'محتوى أفضل. نتائج أكبر. وقت أقل.',
      }
    : {
        badge: 'Your AI marketing assistant',
        heroLead: 'From',
        heroAccent: 'idea',
        heroMiddle: 'to',
        heroStrong: 'publish-ready content.',
        heroSubtitle: 'Create designs, posts, marketing campaigns and professional content ideas in minutes with the power of AI.',
        start: 'Start free',
        seeHow: 'See how it works',
        credits: '100 free credits',
        noCard: 'No credit card',
        platforms: 'Made for every platform',
        trusted: 'Content built for the platforms that matter',
        whyTitle: 'Why choose FinX?',
        whySubtitle: 'More than a tool — your intelligent marketing team.',
        whyBrand: 'Your brand identity stays consistent',
        whyBrandBody: 'Content that reflects your style, colors and brand voice.',
        whyTime: 'Save hours of work',
        whyTimeBody: 'Turn hours of thinking and writing into minutes with AI.',
        whyReady: 'Publish-ready designs',
        whyReadyBody: 'Professional visual content for every platform.',
        whyAnalytics: 'Analyze and improve results',
        whyAnalyticsBody: 'Track performance and get smarter recommendations.',
        whyIdeas: 'Endless ideas',
        whyIdeasBody: 'Daily suggestions tailored to your business and audience.',
        toolsSubtitle: 'Smart tools and real results in one place.',
        howSubtitle: 'Three simple steps from your idea to professional content.',
        step1Body: 'Tell us about your business, audience and goals.',
        step2Body: 'Choose the content type and the right platform.',
        step3Body: 'Get publish-ready content and designs.',
        audienceSubtitle: 'Business owner, freelancer or creator — FinX works with you.',
        audience1Body: 'Practical tools to grow your brand and sales.',
        audience2Body: 'Professional content that saves time and elevates your presence.',
        audience3Body: 'Endless ideas and content that earns attention.',
        pricingSubtitle: 'Choose the plan that matches your ambition.',
        monthly: 'Monthly',
        yearly: 'Yearly',
        save20: 'Save 20%',
        popular: 'Most popular',
        startNow: 'Start now',
        finalTitle: 'Your idea deserves better content.',
        finalSubtitle: 'Join creators and businesses turning ideas into standout content with FinX.',
        finalFoot: 'No credit card required',
        product: 'Product',
        help: 'Help',
        legal: 'Legal',
        productLinks: ['Features', 'Updates', 'User guide'],
        helpLinks: ['Help center', 'Contact us', 'FAQ'],
        legalLinks: ['Terms', 'Privacy policy'],
        footerText: 'Better content. Bigger results. Less time.',
      };

  const tools = [
    { type: 'post', icon: MessageSquare, title: t.landing.tool1Title, desc: t.landing.tool1Desc, tone: 'social' },
    { type: 'design', icon: Palette, title: t.landing.tool2Title, desc: t.landing.tool2Desc, tone: 'design' },
    { type: 'ideas', icon: Lightbulb, title: t.landing.tool3Title, desc: t.landing.tool3Desc, tone: 'ideas' },
    { type: 'campaign', icon: Calendar, title: t.landing.tool4Title, desc: t.landing.tool4Desc, tone: 'campaign' },
  ];

  const audience = [
    { icon: Store, title: t.landing.audience1, body: copy.audience1Body, tone: 'blue' },
    { icon: Laptop, title: t.landing.audience2, body: copy.audience2Body, tone: 'purple' },
    { icon: UsersRound, title: t.landing.audience3, body: copy.audience3Body, tone: 'pink' },
  ];


  return (
    <div className="landing-page landing-v2">
      <div className="landing-v2__noise" aria-hidden="true" />

      <section className="landing-v2-hero">
        <div className="landing-v2-hero__copy">
          <div className="landing-kicker">
            <Sparkles size={14} />
            {copy.badge}
          </div>

          <h1 className="landing-v2-hero__title">
            <span>{copy.heroLead} <em>{copy.heroAccent}</em> {copy.heroMiddle}</span>
            <strong>{copy.heroStrong}</strong>
          </h1>

          <p className="landing-v2-hero__subtitle">{copy.heroSubtitle}</p>

          <div className="landing-v2-hero__actions">
            <button className="landing-btn landing-btn--primary" type="button" onClick={() => navigate('/register')}>
              {copy.start}
              <ArrowIcon size={17} />
            </button>
            <a className="landing-btn landing-btn--secondary" href="#how-it-works">
              <Play size={15} fill="currentColor" />
              {copy.seeHow}
            </a>
          </div>

          <div className="landing-v2-hero__proof">
            <span><Check size={14} /> {copy.credits}</span>
            <span><Check size={14} /> {copy.noCard}</span>
          </div>

          <div className="landing-platforms">
            <span>{copy.platforms}</span>
            <div>
              {platforms.map((item) => (
                <span key={item.label} title={item.label}>
                  <PlatformIcon item={item} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <HeroStudioVisual language={language} />
      </section>

      <section className="landing-trusted">
        <div className="landing-trusted__inner">
          <p>{copy.trusted}</p>
          <div className="landing-trusted__platforms" lang="en">
            {platforms.map((item) => (
              <span key={item.label}><PlatformIcon item={item} /> {item.label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-v2-section landing-why-section">
        <header className="landing-v2-section__header">
          <h2>{copy.whyTitle}</h2>
          <p>{copy.whySubtitle}</p>
        </header>

        <div className="landing-why-grid">
          <WhyCard icon={WandSparkles} title={copy.whyBrand} body={copy.whyBrandBody} variant="green">
            <div className="landing-brand-kit" aria-hidden="true">
              <div className="landing-brand-kit__palette"><i /><i /><i /></div>
              <div className="landing-brand-kit__type"><strong lang="en">Aa</strong><span>Brand voice</span></div>
              <div className="landing-brand-kit__check"><Check size={14} /></div>
            </div>
          </WhyCard>
          <WhyCard icon={Clock3} title={copy.whyTime} body={copy.whyTimeBody} variant="purple">
            <div className="landing-time-metric"><strong>4</strong><span>{isArabic ? 'ساعات' : 'hours'}</span><ArrowIcon size={16} /><strong>4</strong><span>{isArabic ? 'دقائق' : 'minutes'}</span></div>
          </WhyCard>
          <WhyCard icon={ImageIcon} title={copy.whyReady} body={copy.whyReadyBody} variant="pink">
            <div className="landing-mini-gallery"><i /><i /><i /><i /></div>
          </WhyCard>
          <WhyCard icon={BarChart3} title={copy.whyAnalytics} body={copy.whyAnalyticsBody} variant="violet">
            <div className="landing-mini-chart">
              <svg viewBox="0 0 180 70" aria-hidden="true">
                <defs>
                  <linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#c35aff" stopOpacity=".35" />
                    <stop offset="100%" stopColor="#c35aff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M4 60 C22 55 30 50 48 51 S75 39 92 41 S118 28 136 30 S156 13 176 10 L176 68 L4 68 Z" fill="url(#chartArea)" />
                <path d="M4 60 C22 55 30 50 48 51 S75 39 92 41 S118 28 136 30 S156 13 176 10" fill="none" stroke="#c35aff" strokeWidth="3" />
              </svg>
              <strong lang="en">+240%</strong>
            </div>
          </WhyCard>
          <WhyCard icon={Lightbulb} title={copy.whyIdeas} body={copy.whyIdeasBody} variant="amber">
            <div className="landing-idea-tags" lang="en">
              {['Trending', 'Seasonal', 'Offers', 'Educational', 'Reels', 'More…'].map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </WhyCard>
        </div>
      </section>

      <section id="features" className="landing-v2-section landing-tools-section">
        <header className="landing-v2-section__header">
          <h2>{t.landing.toolsTitle}</h2>
          <p>{copy.toolsSubtitle}</p>
        </header>

        <div className="landing-tools-grid">
          {tools.map(({ type, icon: Icon, title, desc, tone }) => (
            <article className={`landing-tool-card landing-tool-card--${tone}`} key={type}>
              <div className="landing-tool-card__icon"><Icon size={21} /></div>
              <div className="landing-tool-card__copy">
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
              <ToolVisual type={type} />
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-v2-section landing-how-section">
        <header className="landing-v2-section__header">
          <h2>{t.landing.howItWorksTitle}</h2>
          <p>{copy.howSubtitle}</p>
        </header>

        <div className="landing-steps">
          {[
            { number: 1, title: t.landing.step1, body: copy.step1Body },
            { number: 2, title: t.landing.step2, body: copy.step2Body },
            { number: 3, title: t.landing.step3, body: copy.step3Body },
          ].map((step) => (
            <article className="landing-step" key={step.number}>
              <div className="landing-step__number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>

        <div className="landing-workflow-preview" aria-hidden="true">
          <aside>
            <div className="landing-workflow-preview__brand" lang="en">FinX</div>
            <span className="is-active"><PlusIcon /> {isArabic ? 'مشروع جديد' : 'New project'}</span>
            <span><Layers3 size={13} /> {isArabic ? 'المشاريع' : 'Projects'}</span>
            <span><Globe2 size={13} /> {isArabic ? 'المنصة' : 'Platform'}</span>
            <span><ShieldCheck size={13} /> {isArabic ? 'الإعدادات' : 'Settings'}</span>
          </aside>

          <div className="landing-workflow-preview__form">
            <strong>{isArabic ? 'ما هو نشاطك؟' : 'What is your business?'}</strong>
            <label>{isArabic ? 'صف مشروعك باختصار' : 'Describe your business'}<i /></label>
            <label>{isArabic ? 'المنصة' : 'Platform'}<span><PlatformIcon item={{ label: 'Instagram' }} /> Instagram</span></label>
          </div>

          <div className="landing-workflow-preview__result">
            <span>{isArabic ? 'من الفكرة' : 'From idea'}</span>
            <div className="landing-workflow-preview__poster">
              <strong>{isArabic ? 'طعـم الفرق' : 'Taste the difference'}</strong>
              <i />
            </div>
            <span>{isArabic ? 'إلى النتيجة' : 'to result'}</span>
            <button tabIndex="-1">{isArabic ? 'توليد' : 'Generate'}</button>
          </div>
        </div>
      </section>

      <section className="landing-v2-section landing-audience-section">
        <header className="landing-v2-section__header">
          <h2>{t.landing.audienceTitle}</h2>
          <p>{copy.audienceSubtitle}</p>
        </header>

        <div className="landing-audience-grid">
          {audience.map(({ icon: Icon, title, body, tone }) => (
            <article className={`landing-audience-card landing-audience-card--${tone}`} key={title}>
              <div className="landing-audience-card__icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{body}</p>
              <div className={`landing-audience-card__visual landing-audience-card__visual--${tone}`} aria-hidden="true">
                <i /><i /><i />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div className="landing-final__orb landing-final__orb--one" />
        <div className="landing-final__orb landing-final__orb--two" />
        <div className="landing-final__float landing-final__float--one"><span>Your<br />Story<br />Matters</span></div>
        <div className="landing-final__float landing-final__float--two"><Lightbulb size={34} /></div>
        <div className="landing-final__float landing-final__float--three" aria-hidden="true">
          <div className="landing-final__coffee"><i /><span /></div>
          <b>{isArabic ? 'صباح مختلف' : 'A different morning'}</b>
        </div>
        <div className="landing-final__float landing-final__float--four" aria-hidden="true">
          <div className="landing-final__headset"><i /><i /><span /></div>
          <b lang="en">Create louder.</b>
        </div>
        <div className="landing-final__light-trail landing-final__light-trail--one" />
        <div className="landing-final__light-trail landing-final__light-trail--two" />

        <div className="landing-final__content">
          <h2>{copy.finalTitle}</h2>
          <p>{copy.finalSubtitle}</p>
          <button className="landing-btn landing-btn--primary landing-btn--large" type="button" onClick={() => navigate('/register')}>
            {copy.start}
            <ArrowIcon size={18} />
          </button>
          <span><Check size={13} /> {copy.finalFoot}</span>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <strong lang="en">Fin<span>X</span></strong>
            <p>{copy.footerText}</p>
            <div className="landing-footer__socials">
              {platforms.slice(0, 6).map((item) => (
                <span key={item.label} title={item.label}><PlatformIcon item={item} /></span>
              ))}
            </div>
          </div>

          <div>
            <h3>{copy.product}</h3>
            {copy.productLinks.map((label) => (
              <a key={label} href="#features">{label}</a>
            ))}
          </div>

          <div>
            <h3>{copy.help}</h3>
            {copy.helpLinks.map((label) => (
              <button type="button" key={label} onClick={() => info(t.toasts.featureUnavailable)}>{label}</button>
            ))}
          </div>

          <div>
            <h3>{copy.legal}</h3>
            {copy.legalLinks.map((label) => (
              <button type="button" key={label} onClick={() => info(t.toasts.legalUnavailable)}>{label}</button>
            ))}
          </div>
        </div>

        <div className="landing-footer__bottom">
          <span>© {new Date().getFullYear()} FinX. {t.landing.footerRights}.</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {language === 'ar' ? 'العربية' : 'English'} <Globe2 size={14} />
          </button>
        </div>
      </footer>
    </div>
  );
}

function PlusIcon() {
  return (
    <span className="landing-plus-icon" aria-hidden="true">
      <i />
      <i />
    </span>
  );
}

export default Landing;

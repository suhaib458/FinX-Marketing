// FinX — Mock Generation Service
// Returns realistic Jordan-focused mock content for the prototype.
// Replace with a real generation provider only in the later backend phase.

import { mockStorage } from './mockStorage';
import { DEFAULT_CUSTOMER_BRAND_COLORS } from '../constants/brandDefaults';

const RESULTS_KEY = 'results';
const ACTIVITY_KEY = 'activity';

// Simulate network delay
function delay(ms = 2000) {
  if (import.meta.env.MODE === 'test') return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function durableAssetUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value) ? value : null;
}

function serializableParams(params) {
  return Object.fromEntries(Object.entries(params || {}).map(([key, value]) => {
    if (key === 'productImage') return [key, Boolean(value)];
    return [key, value];
  }));
}

// Generate a unique ID
function generateId() {
  return 'content-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

// ─── Mock Social Post Data ───
function buildSocialPostResult(params, brand) {
  const bName = brand?.businessName || 'عملك';
  const product = params.description || brand?.productService || 'منتجنا';
  const lang = params.contentLanguage || 'ar';

  const arContent = {
    headline: `✨ ${product} من ${bName}`,
    caption: `هل تبحث عن ${product} بجودة استثنائية؟ 🎯\n\nفي ${bName}، نقدم لك تجربة فريدة مصممة خصيصًا لك. لأنك تستحق الأفضل.\n\n💡 جرّب الفرق بنفسك واكتشف لماذا يثق بنا عملاؤنا في عمّان والأردن.\n\n📍 زورنا اليوم أو تواصل معنا عبر الرابط في البايو.`,
    cta: 'اطلب الآن 🛒',
    hashtags: ['#عمان', '#الأردن', `#${bName.replace(/\s/g, '_')}`, '#تسوق_أونلاين', '#جودة_عالية', '#عروض_خاصة'],
    visualConcept: `صورة احترافية لـ${product} مع خلفية نظيفة بألوان العلامة التجارية. إضاءة طبيعية ناعمة مع عنصر بشري يظهر الاستخدام الحقيقي للمنتج.`,
    platformMeta: {
      charCount: 280,
      hashtagCount: 6,
      bestTimeToPost: '7:00 PM - 9:00 PM',
    },
  };

  const enContent = {
    headline: `✨ ${product} by ${bName}`,
    caption: `Looking for premium ${product}? 🎯\n\nAt ${bName}, we bring you an exceptional experience crafted just for you. Because you deserve the best.\n\n💡 Try the difference yourself and discover why our customers in Amman trust us.\n\n📍 Visit us today or reach out through the link in bio.`,
    cta: 'Order Now 🛒',
    hashtags: ['#Amman', '#Jordan', `#${bName.replace(/\s/g, '')}`, '#ShopOnline', '#PremiumQuality', '#SpecialOffers'],
    visualConcept: `Professional photo of ${product} with a clean background using brand colors. Soft natural lighting with a human element showing real product usage.`,
    platformMeta: {
      charCount: 260,
      hashtagCount: 6,
      bestTimeToPost: '7:00 PM - 9:00 PM',
    },
  };

  const content = lang === 'ar' ? arContent : enContent;
  const goalLead = lang === 'ar'
    ? ({ engagement: 'الهدف: تعزيز التفاعل.', leads: 'الهدف: تشجيع الرسائل والطلبات.', traffic: 'الهدف: زيادة زيارات الموقع.' }[params.goal] || '')
    : ({ engagement: 'Goal: encourage engagement.', leads: 'Goal: encourage messages and leads.', traffic: 'Goal: drive website visits.' }[params.goal] || '');
  const toneLead = lang === 'ar'
    ? ({ professional: 'بنبرة احترافية.', friendly: 'بنبرة ودية.', bold: 'بنبرة جريئة.', inspirational: 'بنبرة ملهمة.' }[params.tone] || '')
    : ({ professional: 'Professional tone.', friendly: 'Friendly tone.', bold: 'Bold tone.', inspirational: 'Inspirational tone.' }[params.tone] || '');
  const platformCta = lang === 'ar'
    ? ({ instagram: 'احفظ المنشور وشاركنا رأيك', facebook: 'شارك المنشور وتواصل معنا', tiktok: 'تابعنا للمزيد' }[params.platform] || content.cta)
    : ({ instagram: 'Save this post and tell us what you think', facebook: 'Share this post and contact us', tiktok: 'Follow us for more' }[params.platform] || content.cta);
  content.cta = params.ctaPreference || platformCta;
  content.caption = `${params.description}\n${goalLead} ${toneLead}\n\n${content.caption}`;
  content.platformMeta = {
    ...content.platformMeta,
    charCount: content.caption.length,
    platform: params.platform,
    goal: params.goal,
    tone: params.tone,
  };
  return content;
}

// ─── Mock Ad Design Data ───
function buildAdDesignResult(params, brand) {
  const bName = brand?.businessName || 'عملك';
  const lang = params.contentLanguage || 'ar';

  const arContent = {
    headline: params.headline || `عرض خاص من ${bName}`,
    offer: params.offerDescription || 'خصم 25% على جميع المنتجات',
    cta: params.cta || 'اطلب الآن',
    primaryColor: params.useBrandColors === false ? DEFAULT_CUSTOMER_BRAND_COLORS.primary : brand?.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary,
    secondaryColor: params.useBrandColors === false ? DEFAULT_CUSTOMER_BRAND_COLORS.secondary : brand?.secondaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.secondary,
    logo: params.showLogo === false ? null : durableAssetUrl(brand?.logo),
    productImage: durableAssetUrl(params.productImage) || durableAssetUrl(brand?.images?.[0]),
    designSize: params.designSize || 'square',
    visualConcept: `تصميم إعلاني حديث بألوان ${bName}. العنوان بخط عريض في المنتصف، صورة المنتج بارزة، وزر CTA واضح في الأسفل.`,
  };

  const enContent = {
    headline: params.headline || `Special Offer from ${bName}`,
    offer: params.offerDescription || '25% OFF All Products',
    cta: params.cta || 'Order Now',
    primaryColor: params.useBrandColors === false ? DEFAULT_CUSTOMER_BRAND_COLORS.primary : brand?.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary,
    secondaryColor: params.useBrandColors === false ? DEFAULT_CUSTOMER_BRAND_COLORS.secondary : brand?.secondaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.secondary,
    logo: params.showLogo === false ? null : durableAssetUrl(brand?.logo),
    productImage: durableAssetUrl(params.productImage) || durableAssetUrl(brand?.images?.[0]),
    designSize: params.designSize || 'square',
    visualConcept: `Modern ad design with ${bName} brand colors. Bold headline centered, prominent product image, and clear CTA button at the bottom.`,
  };

  return lang === 'ar' ? arContent : enContent;
}

// ─── Mock Content Ideas Data ───
function buildContentIdeasResult(params, brand) {
  const bName = brand?.businessName || 'عملك';
  const product = brand?.productService || params.topic || 'منتجك';
  const audience = params.targetAudience || brand?.targetAudience || 'جمهورك';
  const lang = params.contentLanguage || 'ar';

  const arIdeas = [
    {
      id: 'idea-1',
      title: `قصة نجاح ${bName}`,
      angle: 'شارك قصة بداية مشروعك والتحديات اللي واجهتها وكيف تغلبت عليها',
      format: 'كاروسيل (Carousel)',
      hook: `"من فكرة صغيرة في عمّان إلى ${bName}" 🚀`,
      cta: 'شاركنا قصتك في التعليقات',
      visual: 'صور قبل وبعد للمشروع مع تصميم Timeline جذاب',
    },
    {
      id: 'idea-2',
      title: `٥ أسباب تخليك تجرب ${product}`,
      angle: 'قدم الفوائد الرئيسية بطريقة تعليمية وجذابة',
      format: 'ريلز (Reels)',
      hook: `"لسا ما جربت ${product}؟ لازم تشوف هاد!" 👀`,
      cta: 'احفظ المنشور للرجوع إليه لاحقًا',
      visual: `فيديو سريع يعرض كل سبب مع نص متحرك وموسيقى ترند`,
    },
    {
      id: 'idea-3',
      title: 'يوم في حياة فريق العمل',
      angle: `خذ ${audience} في جولة خلف الكواليس لتعزيز الثقة والقرب`,
      format: 'ستوري (Story)',
      hook: '"تعال شوف كيف نحضر طلبك!" 🎬',
      cta: 'تابعنا لمزيد من الكواليس',
      visual: 'فيديو عفوي بأسلوب vlog مع ملصقات تفاعلية',
    },
    {
      id: 'idea-4',
      title: 'عرض خاص لمتابعينا',
      angle: `كافئ ${audience} بعرض حصري يعزز الولاء ويزيد التحويلات`,
      format: 'منشور ثابت (Post)',
      hook: '"هاد العرض بس لمتابعينا! ⚡"',
      cta: 'أرسل رسالة للحصول على الكود',
      visual: `تصميم جريء بألوان ${bName} مع نص العرض واضح وكبير`,
    },
    {
      id: 'idea-5',
      title: `سؤال وجواب عن ${product}`,
      angle: 'أجب على الأسئلة الأكثر شيوعًا لتثقيف جمهورك وبناء الثقة',
      format: 'بث مباشر أو كاروسيل',
      hook: `"أكثر ٥ أسئلة توصلنا عن ${product} 🤔"`,
      cta: 'اكتب سؤالك في التعليقات',
      visual: 'تصميم بطاقات Q&A أنيقة بتدرج ألوان العلامة التجارية',
    },
  ];

  const enIdeas = [
    {
      id: 'idea-1',
      title: `The ${bName} Success Story`,
      angle: 'Share your business journey - challenges, wins, and lessons learned',
      format: 'Carousel',
      hook: `"From a small idea in Amman to ${bName}" 🚀`,
      cta: 'Share your story in the comments',
      visual: 'Before & after photos with a clean timeline design',
    },
    {
      id: 'idea-2',
      title: `5 Reasons to Try ${product}`,
      angle: 'Present key benefits in an educational and engaging way',
      format: 'Reels',
      hook: `"Haven't tried ${product} yet? You need to see this!" 👀`,
      cta: 'Save this post for later',
      visual: 'Quick video showcasing each reason with motion text and trending audio',
    },
    {
      id: 'idea-3',
      title: 'A Day in the Life of Our Team',
      angle: `Take ${audience} behind the scenes to build trust and connection`,
      format: 'Story',
      hook: '"Come see how we prepare your order!" 🎬',
      cta: 'Follow us for more behind-the-scenes',
      visual: 'Casual vlog-style video with interactive stickers',
    },
    {
      id: 'idea-4',
      title: 'Exclusive Offer for Our Followers',
      angle: `Reward ${audience} with an exclusive offer to boost loyalty and conversions`,
      format: 'Static Post',
      hook: '"This offer is ONLY for our followers! ⚡"',
      cta: 'DM us to get the code',
      visual: `Bold design with ${bName} brand colors and prominent offer text`,
    },
    {
      id: 'idea-5',
      title: `Q&A About ${product}`,
      angle: 'Answer the most common questions to educate your audience and build trust',
      format: 'Live or Carousel',
      hook: `"Top 5 questions we get about ${product} 🤔"`,
      cta: 'Drop your question in the comments',
      visual: 'Elegant Q&A cards with brand color gradients',
    },
  ];

  return lang === 'ar' ? arIdeas : enIdeas;
}

// ─── Mock Campaign Data ───
function buildCampaignResult(params, brand) {
  const bName = brand?.businessName || 'عملك';
  const product = params.product || brand?.productService || 'منتجك';
  const startDate = params.startDate ? new Date(params.startDate) : new Date();
  const lang = params.contentLanguage || 'ar';
  const platform = params.platform || 'instagram';

  const arDays = [
    {
      day: 1, date: formatDate(startDate, 0), platform,
      format: 'ريلز (Reels)',
      idea: 'تشويق وتعريف',
      hook: `"شي جديد قادم من ${bName}... 👀"`,
      caption: `استعدوا! عندنا مفاجأة رح تغير تجربتكم مع ${product}. تابعونا الأيام الجاية عشان تعرفوا أكثر! 🔥\n\n#قريباً #${bName.replace(/\s/g, '_')}`,
      cta: 'فعّل التنبيهات عشان ما يفوتك شي',
      designConcept: 'فيديو تشويقي قصير مع موسيقى حماسية وتأثير blur على المنتج',
    },
    {
      day: 2, date: formatDate(startDate, 1), platform,
      format: 'كاروسيل (Carousel)',
      idea: 'تقديم المشكلة',
      hook: `"هل تعاني من هاد الموضوع؟ 🤔"`,
      caption: `كثير من ${brand?.targetAudience || 'الناس'} بيواجهوا نفس المشكلة...\n\nاسحب لتشوف كيف ${bName} بيقدم الحل المثالي! ✅\n\n#حلول #${bName.replace(/\s/g, '_')}`,
      cta: 'شارك هاد المنشور مع شخص يحتاجه',
      designConcept: '4-5 شرائح: المشكلة → التأثير → الحل → المنتج → CTA',
    },
    {
      day: 3, date: formatDate(startDate, 2), platform,
      format: 'ستوري (Story)',
      idea: 'خلف الكواليس',
      hook: '"تعالوا شوفوا كيف نحضر طلباتكم! 🎬"',
      caption: 'يوم عادي في ${bName}... بس مش عادي أبدًا! شوفوا الاهتمام بالتفاصيل اللي بنحطه في كل شي نسويه.',
      cta: 'أرسل 🔥 إذا حبيت',
      designConcept: 'محتوى عفوي، behind-the-scenes مع ملصقات تفاعلية (poll, quiz)',
    },
    {
      day: 4, date: formatDate(startDate, 3), platform,
      format: 'منشور ثابت (Post)',
      idea: 'شهادة عميل',
      hook: '"شوفوا شو قال عميلنا! ⭐"',
      caption: `"أفضل تجربة مع ${product}!" - عميل سعيد\n\nكلام عملائنا هو أكبر فخر إلنا. شكرًا لثقتكم! ❤️\n\n#تقييم_عملاء #${bName.replace(/\s/g, '_')}`,
      cta: 'شاركنا تجربتك في التعليقات',
      designConcept: 'تصميم أنيق للتقييم مع صورة العميل (أو أفاتار) ونجوم التقييم',
    },
    {
      day: 5, date: formatDate(startDate, 4), platform,
      format: 'ريلز (Reels)',
      idea: `فوائد ${product}`,
      hook: `"٣ أشياء ما كنت تعرفها عن ${product} 💡"`,
      caption: `${product} مش بس [ميزة واضحة]... كمان بيقدملك:\n\n1️⃣ [فائدة 1]\n2️⃣ [فائدة 2]\n3️⃣ [فائدة 3]\n\nجربه بنفسك! 🎯`,
      cta: 'احفظ هاد المنشور للرجوع إليه',
      designConcept: 'ريلز تعليمي سريع مع نقاط متحركة وموسيقى ترند',
    },
    {
      day: 6, date: formatDate(startDate, 5), platform,
      format: 'منشور ثابت (Post)',
      idea: 'عرض خاص',
      hook: '"عرض محدود! ⚡ لا تفوتوه"',
      caption: `🎉 عرض نهاية الأسبوع من ${bName}!\n\nخصم خاص على ${product} لمدة 48 ساعة فقط.\n\n⏰ العرض ينتهي يوم الأحد\n📍 أونلاين أو زيارة\n\n#عرض_خاص #تخفيضات`,
      cta: 'أرسل "عرض" برسالة خاصة للحصول على الكود',
      designConcept: 'تصميم جريء مع عداد تنازلي، ألوان متباينة، ونص العرض بخط كبير',
    },
    {
      day: 7, date: formatDate(startDate, 6), platform,
      format: 'كاروسيل (Carousel)',
      idea: 'ملخص الأسبوع وتطلعات',
      hook: '"أسبوع كامل مع ${bName}! 🌟 شو الجاي؟"',
      caption: `شكرًا لكل شخص تفاعل معنا هالأسبوع! 🙏\n\nملخص سريع:\n✅ تعرفتوا على ${product}\n✅ شفتوا الكواليس\n✅ استفدتوا من العرض\n\nالأسبوع الجاي عندنا مفاجآت أكبر! تابعونا 🚀`,
      cta: 'تابعنا + فعّل التنبيهات',
      designConcept: 'ملخص بصري أنيق مع أبرز لحظات الأسبوع وteaser للأسبوع القادم',
    },
  ];

  const enDays = [
    {
      day: 1, date: formatDate(startDate, 0), platform,
      format: 'Reels',
      idea: 'Teaser & Introduction',
      hook: `"Something new is coming from ${bName}... 👀"`,
      caption: `Get ready! We have a surprise that will change your experience with ${product}. Stay tuned! 🔥\n\n#ComingSoon #${bName.replace(/\s/g, '')}`,
      cta: 'Turn on notifications so you don\'t miss out',
      designConcept: 'Short teaser video with energetic music and blur effect on the product',
    },
    {
      day: 2, date: formatDate(startDate, 1), platform,
      format: 'Carousel',
      idea: 'Present the Problem',
      hook: '"Do you struggle with this? 🤔"',
      caption: `Many ${brand?.targetAudience || 'people'} face the same problem...\n\nSwipe to see how ${bName} offers the perfect solution! ✅\n\n#Solutions #${bName.replace(/\s/g, '')}`,
      cta: 'Share this post with someone who needs it',
      designConcept: '4-5 slides: Problem → Impact → Solution → Product → CTA',
    },
    {
      day: 3, date: formatDate(startDate, 2), platform,
      format: 'Story',
      idea: 'Behind the Scenes',
      hook: '"Come see how we prepare your orders! 🎬"',
      caption: `A regular day at ${bName}... but there's nothing regular about it! See the attention to detail we put into everything.`,
      cta: 'Send 🔥 if you loved it',
      designConcept: 'Casual behind-the-scenes content with interactive stickers (poll, quiz)',
    },
    {
      day: 4, date: formatDate(startDate, 3), platform,
      format: 'Static Post',
      idea: 'Customer Testimonial',
      hook: '"See what our customer said! ⭐"',
      caption: `"Best experience with ${product}!" - Happy Customer\n\nYour words are our biggest pride. Thank you for trusting us! ❤️\n\n#CustomerReview #${bName.replace(/\s/g, '')}`,
      cta: 'Share your experience in the comments',
      designConcept: 'Elegant review design with customer photo (or avatar) and star rating',
    },
    {
      day: 5, date: formatDate(startDate, 4), platform,
      format: 'Reels',
      idea: `${product} Benefits`,
      hook: `"3 things you didn't know about ${product} 💡"`,
      caption: `${product} isn't just [obvious feature]... it also gives you:\n\n1️⃣ [Benefit 1]\n2️⃣ [Benefit 2]\n3️⃣ [Benefit 3]\n\nTry it yourself! 🎯`,
      cta: 'Save this post for later',
      designConcept: 'Quick educational reel with animated points and trending audio',
    },
    {
      day: 6, date: formatDate(startDate, 5), platform,
      format: 'Static Post',
      idea: 'Special Offer',
      hook: '"Limited offer! ⚡ Don\'t miss out"',
      caption: `🎉 Weekend Special from ${bName}!\n\nExclusive discount on ${product} for 48 hours only.\n\n⏰ Offer ends Sunday\n📍 Online or in-store\n\n#SpecialOffer #Sale`,
      cta: 'DM "OFFER" to get the code',
      designConcept: 'Bold design with countdown timer, contrasting colors, and large offer text',
    },
    {
      day: 7, date: formatDate(startDate, 6), platform,
      format: 'Carousel',
      idea: 'Week Recap & What\'s Next',
      hook: `"A full week with ${bName}! 🌟 What's coming?"`,
      caption: `Thank you to everyone who engaged with us this week! 🙏\n\nQuick recap:\n✅ You discovered ${product}\n✅ You saw behind the scenes\n✅ You enjoyed our special offer\n\nBigger surprises coming next week! Stay tuned 🚀`,
      cta: 'Follow + turn on notifications',
      designConcept: 'Visual recap with week highlights and teaser for next week',
    },
  ];

  const days = lang === 'ar' ? arDays : enDays;
  if (params.objective) {
    days[0] = { ...days[0], idea: params.objective, caption: `${params.objective}\n\n${days[0].caption}` };
  }
  const campaignToneLead = lang === 'ar'
    ? ({ professional: 'بأسلوب احترافي', friendly: 'بأسلوب ودّي', bold: 'بأسلوب جريء', inspirational: 'بأسلوب ملهم' }[params.tone] || '')
    : ({ professional: 'Professional tone', friendly: 'Friendly tone', bold: 'Bold tone', inspirational: 'Inspirational tone' }[params.tone] || '');
  return days.map((day) => ({
    ...day,
    tone: params.tone || 'professional',
    caption: campaignToneLead ? `${campaignToneLead}\n\n${day.caption}` : day.caption,
  }));
}

function formatDate(baseDate, offsetDays) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

// ─── Progress Step Messages ───
export const GENERATION_STEPS = {
  ar: [
    'نفهم عملك ومنتجك...',
    'نحلل هدفك والمنصة...',
    'نبني المحتوى...',
    'نطبق هوية علامتك التجارية...',
    'نجهز النتيجة النهائية...',
  ],
  en: [
    'Understanding your business...',
    'Analyzing your goal and platform...',
    'Building the content...',
    'Applying your brand identity...',
    'Preparing the final result...',
  ],
};

export const mockGeneration = {
  _shouldFail() {
    return import.meta.env.DEV && window.__FINX_FAIL_MOCK === true;
  },

  // ─── Main Service ───
  async generateSocialPost(params, brand) {
    await delay(2500 + Math.random() * 1500);
    if (this._shouldFail()) throw new Error('MOCK_FAILURE');
    const content = buildSocialPostResult(params, brand);
    const result = {
      id: generateId(),
      type: 'social-post',
      platform: params.platform || 'instagram',
      contentLanguage: params.contentLanguage || 'ar',
      postType: params.postType || 'promotional',
      tone: params.tone || 'professional',
      parameters: serializableParams(params),
      creditCost: 5,
      content,
      createdAt: new Date().toISOString(),
      businessName: brand?.businessName || '',
    };
    this._saveResult(result);
    return result;
  },

  async generateAdDesign(params, brand) {
    await delay(3000 + Math.random() * 2000);
    if (this._shouldFail()) throw new Error('MOCK_FAILURE');
    const content = buildAdDesignResult(params, brand);
    const result = {
      id: generateId(),
      type: 'ad-design',
      platform: params.platform || 'instagram',
      contentLanguage: params.contentLanguage || 'ar',
      parameters: serializableParams(params),
      creditCost: 20,
      content,
      createdAt: new Date().toISOString(),
      businessName: brand?.businessName || '',
    };
    this._saveResult(result);
    return result;
  },

  async generateContentIdeas(params, brand) {
    await delay(2000 + Math.random() * 1500);
    if (this._shouldFail()) throw new Error('MOCK_FAILURE');
    const ideas = buildContentIdeasResult(params, brand);
    const result = {
      id: generateId(),
      type: 'content-ideas',
      platform: params.platform || 'instagram',
      contentLanguage: params.contentLanguage || 'ar',
      parameters: serializableParams(params),
      creditCost: 8,
      content: { ideas },
      createdAt: new Date().toISOString(),
      businessName: brand?.businessName || '',
    };
    this._saveResult(result);
    return result;
  },

  async generateCampaign(params, brand) {
    await delay(4000 + Math.random() * 2000);
    if (this._shouldFail()) throw new Error('MOCK_FAILURE');
    const days = buildCampaignResult(params, brand);
    const result = {
      id: generateId(),
      type: 'campaign',
      platform: params.platform || 'instagram',
      contentLanguage: params.contentLanguage || 'ar',
      tone: params.tone || 'professional',
      parameters: serializableParams(params),
      creditCost: 30,
      content: { days, objective: params.objective || '', startDate: params.startDate || '' },
      createdAt: new Date().toISOString(),
      businessName: brand?.businessName || '',
    };
    this._saveResult(result);
    return result;
  },

  async generateVariation(originalId, options = {}) {
    await delay(2000 + Math.random() * 1000);
    if (this._shouldFail()) throw new Error('MOCK_FAILURE');

    const original = this.getResult(originalId);
    if (!original) throw new Error('Original not found');

    // Create a deeply cloned copy
    const variation = JSON.parse(JSON.stringify(original));
    variation.id = generateId();
    variation.createdAt = new Date().toISOString();
    variation.saved = false;
    variation.isVariation = true;
    variation.originalId = original.id;
    variation.parameters = {
      ...(original.parameters || {}),
      variationTone: options.tone || original.tone || 'professional',
      variationLength: options.length || 'medium',
    };

    // Mutate content visibly
    if (variation.type === 'social-post') {
      const isArabic = variation.contentLanguage === 'ar';
      variation.content.headline = `${isArabic ? 'نسخة جديدة: ' : 'Variation: '}${variation.content.headline}`;
      let caption = variation.content.caption.replace(/\n\n/g, '\n\n✨ ');
      if (options.length === 'short') {
        caption = caption.slice(0, Math.max(120, Math.floor(caption.length * 0.55))).trim();
      } else if (options.length === 'long') {
        caption = `${caption}\n\n${isArabic ? 'اكتشف التفاصيل وتواصل معنا لمعرفة المزيد.' : 'Discover the details and contact us to learn more.'}`;
      }
      const toneLead = options.tone && options.tone !== original.tone
        ? (isArabic ? 'بأسلوب جديد يناسب جمهورك، ' : 'With a fresh tone for your audience, ')
        : '';
      variation.content.caption = `${toneLead}${caption}`;
      variation.tone = options.tone || original.tone;
    } else if (variation.type === 'ad-design') {
      variation.content.headline = `${variation.contentLanguage === 'ar' ? 'تصميم بديل: ' : 'Alternative: '}${variation.content.headline}`;
      // Invert or change colors slightly
      const temp = variation.content.primaryColor;
      variation.content.primaryColor = variation.content.secondaryColor || '#000000';
      variation.content.secondaryColor = temp || '#ffffff';
    } else if (variation.type === 'content-ideas') {
      variation.content.ideas.forEach(idea => {
        idea.title = `${variation.contentLanguage === 'ar' ? 'فكرة بديلة: ' : 'Alternative: '}${idea.title}`;
      });
    } else if (variation.type === 'campaign') {
      variation.content.days.forEach(day => {
        day.idea = `${variation.contentLanguage === 'ar' ? 'بديل: ' : 'Alternative: '}${day.idea}`;
      });
    }

    this._saveResult(variation);
    return variation;
  },

  // ─── Result Persistence ───
  _saveResult(result) {
    mockStorage.append(RESULTS_KEY, result);
    // Also add to activity log
    mockStorage.append(ACTIVITY_KEY, {
      id: result.id,
      type: result.type,
      platform: result.platform,
      businessName: result.businessName,
      creditCost: result.creditCost,
      createdAt: result.createdAt,
    });
  },

  saveExternalResult(result) {
    if (!result?.id || !result?.content) throw new Error('INVALID_EXTERNAL_RESULT');
    this._saveResult(result);
    return result;
  },

  getResult(id) {
    return mockStorage.getById(RESULTS_KEY, id);
  },

  getAllResults() {
    const results = mockStorage.get(RESULTS_KEY, []);
    return Array.isArray(results)
      ? results.filter((result) => result && typeof result.id === 'string' && result.content)
      : [];
  },

  updateResult(id, updates) {
    return mockStorage.updateById(RESULTS_KEY, id, updates);
  },

  // Save to library (mark as saved)
  saveToLibrary(id) {
    return mockStorage.updateById(RESULTS_KEY, id, { saved: true, savedAt: new Date().toISOString() });
  },

  getSavedResults() {
    return this.getAllResults().filter(r => r.saved);
  },

  getRecentActivity(limit = 5) {
    const activity = mockStorage.get(ACTIVITY_KEY, []);
    const existingIds = new Set(this.getAllResults().map((result) => result.id));
    return (Array.isArray(activity) ? activity : [])
      .filter((item) => item?.id && existingIds.has(item.id))
      .slice(-limit)
      .reverse();
  },

  removeResult(id) {
    mockStorage.removeById(RESULTS_KEY, id);
    mockStorage.removeById(ACTIVITY_KEY, id);
    return true;
  },

  getStats() {
    const results = this.getAllResults();
    return {
      totalCreated: results.length,
      totalSaved: results.filter(r => r.saved).length,
    };
  },
};

export default mockGeneration;

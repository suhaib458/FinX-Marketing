import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, Palette, Lightbulb, Calendar,
  Zap, ArrowLeft, ArrowRight, ArrowUp, ChevronDown,
  UploadCloud, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { TOOL_COSTS } from '../../constants/toolCosts';
import { generateWithCredits } from '../../services/mockGenerationFlow';
import GeneratingScreen from '../../components/ui/GeneratingScreen';
import { DEFAULT_CUSTOMER_BRAND_COLORS } from '../../constants/brandDefaults';
import { validateCreateValues } from '../../utils/createValidation';
import { assetApi } from '../../services/assetApi';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../../constants/uploadConfig';
import { aiErrorMessage } from '../../utils/aiErrorMessage';

const toolMeta = {
  'social-post': { key: 'socialPost', icon: MessageSquare, color: 'var(--tool-social)' },
  'ad-design': { key: 'adDesign', icon: Palette, color: 'var(--tool-ad)' },
  'content-ideas': { key: 'contentIdeas', icon: Lightbulb, color: 'var(--tool-ideas)' },
  'campaign': { key: 'campaign', icon: Calendar, color: 'var(--tool-campaign)' },
};

// Instagram inline SVG
function InstagramIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

// Facebook inline SVG
function FacebookIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
    </svg>
  );
}

// TikTok inline SVG
function TikTokIcon({ size = 20, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

// ─── Chip Selector Component ───
function ChipSelector({ options, value, onChange, label, required, error, field }) {
  const { t } = useLanguage();
  return (
    <div className="fx-input-wrapper" data-field={field} tabIndex={-1} aria-invalid={Boolean(error)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label className="fx-input-label">{label}</label>
        {required !== undefined && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            ({required ? t.common.required : t.common.optional})
          </span>
        )}
      </div>
      <div className="chip-group">
        {options.map(opt => (
          <button
            key={opt.value}
            type="button"
            className={`chip ${value === opt.value ? 'chip--active' : ''}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <opt.icon size={16} />}
            <span lang={opt.lang}>{opt.label}</span>
          </button>
        ))}
      </div>
      {error && <span className="fx-input-error-text" role="alert">{error}</span>}
    </div>
  );
}

// ─── Toggle Component ───
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`fx-toggle ${checked ? 'fx-toggle--on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      {checked ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      <span>{label}</span>
    </button>
  );
}



// ─── Smart Create Composer ───
const SMART_MODE_OPTIONS = ['auto', 'social-post', 'ad-design', 'content-ideas', 'campaign'];

function inferToolFromPrompt(value) {
  const text = String(value || '').trim().toLowerCase();

  if (/(حملة|حملات|اسبوع|أسبوع|7\s*(أيام|ايام)|campaign|weekly|7\s*days?)/i.test(text)) {
    return 'campaign';
  }

  if (/(أفكار|افكار|اقتراحات|مواضيع|زوايا محتوى|content ideas?|ideas?|topics?)/i.test(text)) {
    return 'content-ideas';
  }

  if (/(تصميم|اعلان|إعلان|بوستر|بانر|صورة اعلان|صورة إعلان|ad design|advert|poster|banner|creative)/i.test(text)) {
    return 'ad-design';
  }

  return 'social-post';
}

function smartParamsFor(tool, prompt, language, brand) {
  const shared = {
    platform: 'instagram',
    goal: 'engagement',
    contentLanguage: language,
    userPrompt: prompt,
  };

  if (tool === 'ad-design') {
    return {
      ...shared,
      headline: '',
      offerDescription: prompt,
      cta: '',
      designSize: 'square',
      productImage: null,
      showLogo: true,
      useBrandColors: true,
    };
  }

  if (tool === 'content-ideas') {
    return {
      ...shared,
      topic: prompt,
      targetAudience: brand?.targetAudience || (language === 'ar' ? 'جمهور العلامة التجارية' : 'the brand target audience'),
    };
  }

  if (tool === 'campaign') {
    return {
      ...shared,
      objective: prompt,
      product: brand?.productService || prompt,
      startDate: '',
      tone: 'professional',
    };
  }

  return {
    ...shared,
    postType: 'promotional',
    tone: 'professional',
    description: prompt,
    ctaPreference: '',
  };
}

function SmartCreateHub({
  t,
  language,
  firebaseUser,
  credits,
  brand,
  applyGenerationResult,
  isAppDataLoading,
  success,
  toastError,
  navigate,
}) {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('auto');
  const [isGenerating, setIsGenerating] = useState(false);
  const submittingRef = useRef(false);

  const cleanPrompt = prompt.trim();
  const resolvedTool = mode === 'auto' ? inferToolFromPrompt(cleanPrompt) : mode;
  const meta = toolMeta[resolvedTool] || toolMeta['social-post'];
  const toolData = t.tools[meta.key];
  const cost = TOOL_COSTS[resolvedTool] ?? 0;
  const canAfford = isAppDataLoading || credits >= cost;

  const copy = language === 'ar'
    ? {
        title: 'ماذا تريد أن تنشئ؟',
        subtitle: 'اكتب فكرتك بكلمات بسيطة، وFinX يتولى الباقي.',
        placeholder: 'مثلاً: أنشئ منشور إنستغرام لإطلاق مشروب قهوة جديد بأسلوب فاخر...',
        auto: 'تلقائي',
        send: 'إنشاء',
        hint: 'Enter للإرسال · Shift + Enter لسطر جديد',
        empty: 'اكتب فكرتك أولاً.',
        mode: 'نوع المحتوى',
      }
    : {
        title: 'What do you want to create?',
        subtitle: 'Describe it in your own words — FinX will handle the rest.',
        placeholder: 'For example: Create an Instagram post for a premium new coffee launch...',
        auto: 'Auto',
        send: 'Create',
        hint: 'Enter to send · Shift + Enter for a new line',
        empty: 'Describe what you want to create first.',
        mode: 'Content type',
      };

  const modeLabel = (value) => {
    if (value === 'auto') return copy.auto;
    const modeMeta = toolMeta[value];
    return modeMeta ? t.tools[modeMeta.key].title : value;
  };

  const handleSubmit = async () => {
    if (!cleanPrompt) {
      toastError(copy.empty);
      return;
    }

    if (!canAfford) {
      toastError(t.generation.insufficientCredits);
      return;
    }

    if (isGenerating || submittingRef.current) return;

    submittingRef.current = true;
    setIsGenerating(true);

    try {
      const params = smartParamsFor(resolvedTool, cleanPrompt, language, brand);
      const result = await generateWithCredits(resolvedTool, params, brand || null, { firebaseUser });
      applyGenerationResult(result);
      success(t.common.saved);
      navigate(`/app/result/${result.id}`);
    } catch (err) {
      toastError(aiErrorMessage(err, language, t.toasts.errorOccurred));
    } finally {
      submittingRef.current = false;
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent?.isComposing) {
      event.preventDefault();
      handleSubmit();
    }
  };

  if (isGenerating) {
    return <GeneratingScreen language={language} icon={meta.icon} color={meta.color} />;
  }

  const ActiveIcon = meta.icon;

  return (
    <div className="page-enter smart-create">
      <div className="smart-create__ambient smart-create__ambient--one" aria-hidden="true" />
      <div className="smart-create__ambient smart-create__ambient--two" aria-hidden="true" />

      <section className="smart-create__stage">
        <header className="smart-create__header">
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </header>

        <div className="smart-create__composer">
          <textarea
            className="smart-create__textarea"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={copy.placeholder}
            rows={5}
            autoFocus
            aria-label={copy.title}
          />

          <div className="smart-create__toolbar">
            <div className="smart-create__toolbar-start">
              <label className="smart-create__mode">
                <ActiveIcon size={15} aria-hidden="true" />
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  aria-label={copy.mode}
                >
                  {SMART_MODE_OPTIONS.map((value) => (
                    <option key={value} value={value}>{modeLabel(value)}</option>
                  ))}
                </select>
                <ChevronDown size={14} aria-hidden="true" />
              </label>

              <span className="smart-create__resolved">
                <span>{toolData.title}</span>
                <span className="smart-create__cost"><Zap size={12} /> {cost}</span>
              </span>
            </div>

            <button
              type="button"
              className="smart-create__submit"
              onClick={handleSubmit}
              disabled={!cleanPrompt || !canAfford || isGenerating}
              aria-label={copy.send}
              title={copy.send}
            >
              <ArrowUp size={21} />
            </button>
          </div>
        </div>

        <p className="smart-create__hint">{copy.hint}</p>
      </section>
    </div>
  );
}

// ─── Main Component ───
function CreateContent() {
  const { t, language } = useLanguage();
  const { success, error: toastError } = useToast();
  const { tool } = useParams();
  const navigate = useNavigate();
  const { firebaseUser } = useAuth();
  const { credits, brand, applyGenerationResult, isLoading: isAppDataLoading } = useAppData();
  const ArrowNext = language === 'ar' ? ArrowLeft : ArrowRight;

  // Shared form state
  const [platform, setPlatform] = useState('instagram');
  const [goal, setGoal] = useState('engagement');
  const [contentLanguage, setContentLanguage] = useState(language);
  const [description, setDescription] = useState('');
  const [useBrandInfo, setUseBrandInfo] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const submittingRef = useRef(false);

  // Social Post specific
  const [postType, setPostType] = useState('promotional');
  const [tone, setTone] = useState('professional');
  const [ctaPreference, setCtaPreference] = useState('');

  // Ad Design specific
  const [headline, setHeadline] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [designSize, setDesignSize] = useState('square');
  const [productImage, setProductImage] = useState(null);
  const [uploadedProductAsset, setUploadedProductAsset] = useState(null);
  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);
  const [useSavedLogo, setUseSavedLogo] = useState(true);
  const [useSavedColors, setUseSavedColors] = useState(true);

  // Content Ideas specific
  const [topic, setTopic] = useState(() => brand?.productService || '');
  const [targetAudience, setTargetAudience] = useState(() => brand?.targetAudience || '');

  // Campaign specific
  const [objective, setObjective] = useState('');
  const [campaignProduct, setCampaignProduct] = useState(() => brand?.productService || '');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (!brand) return;
    setTopic((previous) => previous || brand.productService || '');
    setTargetAudience((previous) => previous || brand.targetAudience || '');
    setCampaignProduct((previous) => previous || brand.productService || '');
  }, [brand]);

  const updateValue = (field, setter, value) => {
    setter(value);
    setFormErrors((previous) => previous[field] ? { ...previous, [field]: null } : previous);
  };

  if (!tool) {
    return (
      <SmartCreateHub
        t={t}
        language={language}
        firebaseUser={firebaseUser}
        credits={credits}
        brand={brand}
        applyGenerationResult={applyGenerationResult}
        isAppDataLoading={isAppDataLoading}
        success={success}
        toastError={toastError}
        navigate={navigate}
      />
    );
  }

  const meta = toolMeta[tool];
  if (!meta) {
    return (
      <div className="page-enter fx-empty-state">
        <h2 className="fx-empty-state__title">{t.common.noResults}</h2>
        <Button variant="primary" onClick={() => navigate('/app/create')}>{t.common.back}</Button>
      </div>
    );
  }

  const toolData = t.tools[meta.key];
  const cost = TOOL_COSTS[tool];
  const canAfford = isAppDataLoading || credits >= cost;

  // Platform options
  const platformOptions = [
    { value: 'instagram', label: t.platforms.instagram, icon: InstagramIcon, lang: 'en' },
    { value: 'facebook', label: t.platforms.facebook, icon: FacebookIcon, lang: 'en' },
    { value: 'tiktok', label: t.platforms.tiktok, icon: TikTokIcon, lang: 'en' },
  ];

  const goalOptions = Object.entries(t.goals).map(([key, label]) => ({ value: key, label }));
  const toneOptions = Object.entries(t.tones).map(([key, label]) => ({ value: key, label }));
  const postTypeOptions = Object.entries(t.postTypes).map(([key, label]) => ({ value: key, label }));
  const sizeOptions = Object.entries(t.designSizes).map(([key, label]) => ({ value: key, label }));
  const langOptions = [
    { value: 'ar', label: 'العربية' },
    { value: 'en', label: 'English', lang: 'en' },
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toastError(t.validation.invalidImageType);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toastError(t.validation.imageTooLarge);
      e.target.value = '';
      return;
    }

    setIsUploadingProductImage(true);
    try {
      const uploaded = await assetApi.uploadAsset(firebaseUser, {
        file,
        type: 'PRODUCT_IMAGE',
      });
      setProductImage(uploaded.url);
      setUploadedProductAsset(uploaded);
    } catch (err) {
      const uploadMessages = language === 'ar'
        ? {
            FILE_TOO_LARGE: 'حجم الصورة أكبر من الحد المسموح.',
            UNSUPPORTED_FILE_TYPE: 'نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.',
            INVALID_FILE_EXTENSION: 'امتداد الصورة لا يطابق نوع الملف.',
            CORRUPTED_OR_INVALID_FILE: 'ملف الصورة غير صالح أو تالف.',
            AI_ERROR: 'تعذر رفع الصورة.',
            NETWORK_ERROR: 'تعذر الاتصال بخدمة رفع الصور.',
          }
        : {
            FILE_TOO_LARGE: 'The image is larger than the allowed limit.',
            UNSUPPORTED_FILE_TYPE: 'Unsupported image type. Use JPG, PNG, or WebP.',
            INVALID_FILE_EXTENSION: 'The image extension does not match the file type.',
            CORRUPTED_OR_INVALID_FILE: 'The image file is invalid or corrupted.',
            NETWORK_ERROR: 'Unable to reach the image upload service.',
          };
      toastError(uploadMessages[err?.code] || err?.message || t.toasts.errorOccurred);
    } finally {
      setIsUploadingProductImage(false);
      e.target.value = '';
    }
  };

  const removeProductImage = async () => {
    if (uploadedProductAsset?.id) {
      try {
        await assetApi.deleteAsset(firebaseUser, uploadedProductAsset.id);
      } catch {
        // Silently catch deletion error on client
      }
    }
    setProductImage(null);
    setUploadedProductAsset(null);
  };

  const handleGenerate = async () => {
    const validation = validateCreateValues(tool, {
      platform, goal, contentLanguage, postType, description, tone, ctaPreference,
      offerDescription, designSize, headline, ctaText,
      topic, targetAudience, objective, campaignProduct, startDate,
    }, { required: t.common.required, invalidDate: t.validation.invalidDate });
    setFormErrors(validation.errors);
    if (!validation.valid) {
      toastError(t.validation.fixErrors);
      setTimeout(() => document.querySelector('[data-field][aria-invalid="true"], [aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (!canAfford) {
      toastError(t.generation.insufficientCredits);
      return;
    }
    if (isGenerating || submittingRef.current) return;

    submittingRef.current = true;
    setIsGenerating(true);

    try {
      const brandData = useBrandInfo && brand
        ? {
            ...brand,
            logo: tool === 'ad-design' && !useSavedLogo ? null : brand.logo,
            primaryColor: tool === 'ad-design' && !useSavedColors ? null : brand.primaryColor,
            secondaryColor: tool === 'ad-design' && !useSavedColors ? null : brand.secondaryColor,
          }
        : null;

      let params;
      if (tool === 'social-post') {
        params = {
          platform: validation.values.platform, goal: validation.values.goal,
          contentLanguage: validation.values.contentLanguage, postType: validation.values.postType,
          tone: validation.values.tone, description: validation.values.description,
          ctaPreference: validation.values.ctaPreference,
        };
      } else if (tool === 'ad-design') {
        params = {
          platform: validation.values.platform, goal: validation.values.goal,
          contentLanguage: validation.values.contentLanguage,
          headline: validation.values.headline, offerDescription: validation.values.offerDescription,
          cta: validation.values.ctaText, designSize: validation.values.designSize,
          productImage,
          showLogo: useSavedLogo,
          useBrandColors: useSavedColors,
        };
      } else if (tool === 'content-ideas') {
        params = {
          platform: validation.values.platform, goal: validation.values.goal,
          contentLanguage: validation.values.contentLanguage,
          topic: validation.values.topic, targetAudience: validation.values.targetAudience,
        };
      } else if (tool === 'campaign') {
        params = {
          platform: validation.values.platform, goal: validation.values.goal,
          contentLanguage: validation.values.contentLanguage,
          objective: validation.values.objective, product: validation.values.campaignProduct,
          startDate: validation.values.startDate, tone: validation.values.tone,
        };
      }

      const result = await generateWithCredits(tool, params, brandData, { firebaseUser });
      applyGenerationResult(result);
      success(t.common.saved);
      navigate(`/app/result/${result.id}`);
    } catch (err) {
      toastError(aiErrorMessage(err, language, t.toasts.errorOccurred));
    } finally {
      submittingRef.current = false;
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    const meta = toolMeta[tool];
    return <GeneratingScreen language={language} icon={meta?.icon} color={meta?.color} />;
  }

  // ─── Social Post Form ───
  const renderSocialPostForm = () => (
    <>
      <ChipSelector field="platform" error={formErrors.platform} label={t.generation.choosePlatform} options={platformOptions} value={platform} onChange={(value) => updateValue('platform', setPlatform, value)} required={true} />
      <ChipSelector field="goal" error={formErrors.goal} label={t.generation.chooseGoal} options={goalOptions} value={goal} onChange={(value) => updateValue('goal', setGoal, value)} required={true} />
      <ChipSelector field="contentLanguage" error={formErrors.contentLanguage} label={t.generation.contentLanguage} options={langOptions} value={contentLanguage} onChange={(value) => updateValue('contentLanguage', setContentLanguage, value)} required={true} />
      <ChipSelector field="postType" error={formErrors.postType} label={t.generation.choosePostType} options={postTypeOptions} value={postType} onChange={(value) => updateValue('postType', setPostType, value)} required={true} />
      <Input
        as="textarea"
        label={t.generation.describeIdea}
        value={description}
        onChange={e => updateValue('description', setDescription, e.target.value)}
        placeholder={t.generation.ideaPlaceholder}
        required={true}
        error={formErrors.description}
        id="description"
      />
      <ChipSelector field="tone" error={formErrors.tone} label={t.generation.chooseTone} options={toneOptions} value={tone} onChange={(value) => updateValue('tone', setTone, value)} required={true} />
      <Input
        label={t.generation.ctaPreference}
        value={ctaPreference}
        onChange={e => updateValue('ctaPreference', setCtaPreference, e.target.value)}
        placeholder={t.generation.ctaPlaceholder}
        required={false}
      />
      <Toggle checked={useBrandInfo} onChange={setUseBrandInfo} label={t.generation.useBrandInfo} />
    </>
  );

  // ─── Ad Design Form ───
  const renderAdDesignForm = () => (
    <>
      <ChipSelector field="platform" error={formErrors.platform} label={t.generation.choosePlatform} options={platformOptions} value={platform} onChange={(value) => updateValue('platform', setPlatform, value)} required={true} />
      <ChipSelector field="goal" error={formErrors.goal} label={t.generation.chooseGoal} options={goalOptions} value={goal} onChange={(value) => updateValue('goal', setGoal, value)} required={true} />
      <ChipSelector field="contentLanguage" error={formErrors.contentLanguage} label={t.generation.contentLanguage} options={langOptions} value={contentLanguage} onChange={(value) => updateValue('contentLanguage', setContentLanguage, value)} required={true} />
      <Input
        as="textarea"
        label={t.generation.offerDescription}
        value={offerDescription}
        onChange={e => updateValue('offerDescription', setOfferDescription, e.target.value)}
        placeholder={t.generation.offerPlaceholder}
        required={true}
        error={formErrors.offerDescription}
        id="offerDescription"
      />
      <Input
        label={t.generation.headline}
        value={headline}
        onChange={e => updateValue('headline', setHeadline, e.target.value)}
        placeholder={t.generation.headlinePlaceholder}
        required={false}
      />
      <Input
        label={t.generation.ctaText}
        value={ctaText}
        onChange={e => updateValue('ctaText', setCtaText, e.target.value)}
        placeholder={t.generation.ctaPlaceholder}
        required={false}
      />
      <ChipSelector field="designSize" error={formErrors.designSize} label={t.generation.designSize} options={sizeOptions} value={designSize} onChange={(value) => updateValue('designSize', setDesignSize, value)} required={true} />

      {/* Product Image Upload */}
      <div className="fx-input-wrapper">
        <label className="fx-input-label">{t.generation.uploadProductImage}</label>
        {isUploadingProductImage ? (
          <div className="upload-zone" style={{ padding: 'var(--space-6)', pointerEvents: 'none', opacity: 0.75 }}>
            <UploadCloud size={24} style={{ color: 'var(--color-primary)', margin: '0 auto var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>
              {language === 'ar' ? 'جاري رفع صورة المنتج...' : 'Uploading product image...'}
            </div>
          </div>
        ) : productImage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <img src={productImage} alt="Product" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            <Button variant="ghost" size="sm" onClick={removeProductImage}><X size={16} /> {t.common.delete}</Button>
          </div>
        ) : (
          <label className="upload-zone" style={{ padding: 'var(--space-6)', cursor: 'pointer' }}>
            <UploadCloud size={24} style={{ color: 'var(--color-text-muted)', margin: '0 auto var(--space-2)' }} />
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{t.onboarding.dragDrop}</div>
            <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={isUploadingProductImage} />
          </label>
        )}
      </div>

      <Toggle checked={useSavedLogo} onChange={setUseSavedLogo} label={t.generation.useSavedLogo} />
      <Toggle checked={useSavedColors} onChange={setUseSavedColors} label={t.generation.useSavedColors} />
    </>
  );

  // ─── Content Ideas Form ───
  const renderContentIdeasForm = () => (
    <>
      <ChipSelector field="platform" error={formErrors.platform} label={t.generation.choosePlatform} options={platformOptions} value={platform} onChange={(value) => updateValue('platform', setPlatform, value)} required={true} />
      <ChipSelector field="goal" error={formErrors.goal} label={t.generation.chooseGoal} options={goalOptions} value={goal} onChange={(value) => updateValue('goal', setGoal, value)} required={true} />
      <ChipSelector field="contentLanguage" error={formErrors.contentLanguage} label={t.generation.contentLanguage} options={langOptions} value={contentLanguage} onChange={(value) => updateValue('contentLanguage', setContentLanguage, value)} required={true} />
      <Input
        label={t.generation.topicOrProduct}
        value={topic}
        onChange={e => updateValue('topic', setTopic, e.target.value)}
        placeholder={t.generation.topicPlaceholder}
        required={true}
        error={formErrors.topic}
        id="topic"
      />
      <Input
        label={t.generation.targetAudience}
        value={targetAudience}
        onChange={e => updateValue('targetAudience', setTargetAudience, e.target.value)}
        placeholder={t.generation.audiencePlaceholder}
        required={true}
        error={formErrors.targetAudience}
        id="targetAudience"
      />
      <Toggle checked={useBrandInfo} onChange={setUseBrandInfo} label={t.generation.useBrandInfo} />
    </>
  );

  // ─── Campaign Form ───
  const renderCampaignForm = () => (
    <>
      <ChipSelector field="platform" error={formErrors.platform} label={t.generation.choosePlatform} options={platformOptions} value={platform} onChange={(value) => updateValue('platform', setPlatform, value)} required={true} />
      <ChipSelector field="goal" error={formErrors.goal} label={t.generation.chooseGoal} options={goalOptions} value={goal} onChange={(value) => updateValue('goal', setGoal, value)} required={true} />
      <ChipSelector field="contentLanguage" error={formErrors.contentLanguage} label={t.generation.contentLanguage} options={langOptions} value={contentLanguage} onChange={(value) => updateValue('contentLanguage', setContentLanguage, value)} required={true} />
      <Input
        label={t.generation.campaignObjective}
        value={objective}
        onChange={e => updateValue('objective', setObjective, e.target.value)}
        placeholder={t.generation.objectivePlaceholder}
        required={true}
        error={formErrors.objective}
        id="objective"
      />
      <Input
        label={t.generation.campaignProduct}
        value={campaignProduct}
        onChange={e => updateValue('campaignProduct', setCampaignProduct, e.target.value)}
        placeholder={brand?.productService || ''}
        required={true}
        error={formErrors.campaignProduct}
        id="campaignProduct"
      />
      <Input
        label={t.generation.startDate}
        type="date"
        value={startDate}
        onChange={e => updateValue('startDate', setStartDate, e.target.value)}
        dir="ltr"
        required={false}
        error={formErrors.startDate}
        id="startDate"
      />
      <ChipSelector field="tone" error={formErrors.tone} label={t.generation.chooseTone} options={toneOptions} value={tone} onChange={(value) => updateValue('tone', setTone, value)} required={true} />
      <Toggle checked={useBrandInfo} onChange={setUseBrandInfo} label={t.generation.useBrandInfo} />
    </>
  );

  const renderForm = () => {
    switch (tool) {
      case 'social-post': return renderSocialPostForm();
      case 'ad-design': return renderAdDesignForm();
      case 'content-ideas': return renderContentIdeasForm();
      case 'campaign': return renderCampaignForm();
      default: return null;
    }
  };

  const Icon = meta.icon;

  return (
    <div className="page-enter create-workspace">
      {/* Form Panel */}
      <div className="create-form-panel fx-card fx-card--quiet">
        <div className="create-form-header">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/create')}>
            {language === 'ar' ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
            {t.common.back}
          </Button>
        </div>

        <div className="create-form-title-row">
          <div className="create-form-icon" style={{ background: `color-mix(in srgb, ${meta.color} 14%, transparent)`, color: meta.color }}>
            <Icon size={24} />
          </div>
          <div>
            <h1 className="create-form-title">{toolData.title}</h1>
            <p className="create-form-subtitle">{toolData.description}</p>
          </div>
        </div>

        <div className="create-form-body">
          {renderForm()}
        </div>

        {/* Generate Button */}
        <div className="create-form-footer">
          <div className="create-cost-display">
            <Zap size={16} style={{ color: canAfford ? 'var(--color-accent)' : 'var(--color-error)' }} />
            <span>{cost} {t.dashboard.creditUnit}</span>
            {!canAfford && (
              <span className="create-cost-warning">{t.generation.insufficientCredits}</span>
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={!canAfford || isGenerating}
            className="create-generate-btn"
          >
            {t.generation.generate}
            <ArrowNext size={18} />
          </Button>
        </div>
      </div>

      {/* Preview Panel (Desktop) */}
      <div className="create-preview-panel">
        <div className="create-preview-card fx-card fx-card--elevated">
          <div className="create-preview-header">
            <span className="create-preview-badge" lang="en">{t.platforms[platform]}</span>
            <span className="create-preview-badge create-preview-badge--muted">{t.goals[goal]}</span>
          </div>
          <div className="create-preview-body">
            {brand?.logo && useBrandInfo && (
              <img src={brand.logo} alt="Logo" className="create-preview-logo" />
            )}
            <div className="create-preview-name">
              {useBrandInfo && brand?.businessName ? brand.businessName : t.common.appName}
            </div>
            {description && <p className="create-preview-desc">{description}</p>}
            {offerDescription && <p className="create-preview-desc">{offerDescription}</p>}
            {topic && <p className="create-preview-desc">{topic}</p>}
            {objective && <p className="create-preview-desc">{objective}</p>}

            <div className="create-preview-visual" style={{
              background: `linear-gradient(135deg, ${brand?.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary}30, ${brand?.secondaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.secondary}30)`,
              aspectRatio: designSize === 'story' ? '9/16' : designSize === 'portrait' ? '4/5' : designSize === 'landscape' ? '16/9' : '1/1',
              maxHeight: 200,
            }}>
              {productImage ? (
                <img src={productImage} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              ) : (
                <Icon size={32} style={{ opacity: 0.3 }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateContent;

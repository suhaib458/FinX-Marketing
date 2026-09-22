import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_CUSTOMER_BRAND_COLORS } from '../constants/brandDefaults';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  ArrowRight, ArrowLeft, Building2, Users, Palette, Image as ImageIcon, 
  CheckCircle2, UploadCloud, X, LogOut, Moon, Sun, Languages, SkipForward, Sparkles
} from 'lucide-react';
import mockBrand from '../services/mockBrand';
import { mockStorage } from '../services/mockStorage';
import { assetApi } from '../services/assetApi';
import { brandApi } from '../services/brandApi';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from '../constants/uploadConfig';
import { requestedPath, safeProtectedDestination } from '../utils/routeGuards';

const DRAFT_KEY = 'onboarding-draft';
const MAX_PRODUCT_IMAGES = 5;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export function isValidWebsiteOrUsername(value) {
  const input = String(value || '').trim();
  if (!input) return true;
  if (/^@[a-z0-9._]{1,30}$/i.test(input)) return true;
  try {
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(candidate);
    return Boolean(url.hostname.includes('.') && !url.hostname.startsWith('.') && !url.hostname.endsWith('.'));
  } catch {
    return false;
  }
}

export default function Onboarding() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, firebaseUser, completeOnboarding, logout } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isRestart = new URLSearchParams(location.search).get('restart') === 'true';

  const ArrowNext = language === 'ar' ? ArrowLeft : ArrowRight;
  const ArrowPrev = language === 'ar' ? ArrowRight : ArrowLeft;

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // State
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
    category: '',
    targetAudience: '',
    productService: '',
    productDesc: '',
    price: '',
    website: '',
    primaryColor: DEFAULT_CUSTOMER_BRAND_COLORS.primary,
    secondaryColor: DEFAULT_CUSTOMER_BRAND_COLORS.secondary,
    logo: null,
    images: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoAsset, setLogoAsset] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const finishingRef = useRef(false);
  const primaryPreviewColor = HEX_COLOR.test(formData.primaryColor)
    ? formData.primaryColor : DEFAULT_CUSTOMER_BRAND_COLORS.primary;
  const secondaryPreviewColor = HEX_COLOR.test(formData.secondaryColor)
    ? formData.secondaryColor : DEFAULT_CUSTOMER_BRAND_COLORS.secondary;

  // Load only the current user's draft, or the existing profile when editing.
  useEffect(() => {
    const source = isRestart ? mockBrand.getProfile() : mockStorage.get(DRAFT_KEY, null);
    if (source && typeof source === 'object') {
      setFormData((previous) => ({ ...previous, ...source, logo: null, images: [] }));
      setLogoPreview(source.logo || null);
      setImagePreviews(Array.isArray(source.images) ? source.images.slice(0, MAX_PRODUCT_IMAGES) : []);
    }
  }, [isRestart, user?.id]);

  // Persist serializable text only. File previews remain session-only.
  useEffect(() => {
    const toSave = { ...formData, logo: null, images: [] };
    mockStorage.set(DRAFT_KEY, toSave);
  }, [formData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (stepToValidate = step) => {
    const errors = {};
    if (stepToValidate === 1) {
      if (!formData.businessName.trim()) errors.businessName = t.common.required;
      if (!formData.businessDescription.trim()) errors.businessDescription = t.common.required;
      if (!formData.category) errors.category = t.common.required;
    } else if (stepToValidate === 2) {
      if (!formData.targetAudience.trim()) errors.targetAudience = t.common.required;
      if (!formData.productService.trim()) errors.productService = t.common.required;
      if (!isValidWebsiteOrUsername(formData.website)) errors.website = t.validation.invalidWebsite;
    } else if (stepToValidate === 3) {
      if (!HEX_COLOR.test(formData.primaryColor)) errors.primaryColor = t.validation.invalidHexColor;
      if (!HEX_COLOR.test(formData.secondaryColor)) errors.secondaryColor = t.validation.invalidHexColor;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAll = () => {
    const errors = {};
    if (!formData.businessName.trim()) errors.businessName = t.common.required;
    if (!formData.businessDescription.trim()) errors.businessDescription = t.common.required;
    if (!formData.category) errors.category = t.common.required;
    if (!formData.targetAudience.trim()) errors.targetAudience = t.common.required;
    if (!formData.productService.trim()) errors.productService = t.common.required;
    if (!isValidWebsiteOrUsername(formData.website)) errors.website = t.validation.invalidWebsite;
    if (!HEX_COLOR.test(formData.primaryColor)) errors.primaryColor = t.validation.invalidHexColor;
    if (!HEX_COLOR.test(formData.secondaryColor)) errors.secondaryColor = t.validation.invalidHexColor;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstStep = ['businessName', 'businessDescription', 'category'].some((key) => errors[key]) ? 1
        : ['targetAudience', 'productService', 'website'].some((key) => errors[key]) ? 2 : 3;
      setStep(firstStep);
      setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(s => Math.min(s + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      error(t.common.error);
    }
  };

  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleFinish = async () => {
    if (finishingRef.current || !validateAll()) {
      if (!finishingRef.current) error(t.validation.fixErrors);
      return;
    }
    finishingRef.current = true;
    try {
      const rawWebsite = formData.website.trim();
      const isUsername = rawWebsite.startsWith('@');
      const brandPayload = {
        businessName: formData.businessName.trim(),
        businessDescription: formData.businessDescription.trim() || null,
        category: formData.category || null,
        targetAudience: formData.targetAudience.trim() || null,
        productService: formData.productService.trim() || null,
        productDescription: formData.productDesc.trim() || null,
        price: formData.price.trim() || null,
        currency: 'JOD',
        website: rawWebsite && !isUsername ? (/^https?:\/\//i.test(rawWebsite) ? rawWebsite : `https://${rawWebsite}`) : null,
        username: isUsername ? rawWebsite : null,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
      };

      const localExisting = mockBrand.getProfile();
      let serverBrand;
      if (localExisting?.id) {
        serverBrand = await brandApi.update(firebaseUser, localExisting.id, brandPayload);
      } else {
        const existingBrands = await brandApi.list(firebaseUser);
        serverBrand = existingBrands[0]
          ? await brandApi.update(firebaseUser, existingBrands[0].id, brandPayload)
          : await brandApi.create(firebaseUser, brandPayload);
      }

      mockBrand.saveProfile({
        ...formData,
        ...serverBrand,
        id: serverBrand.id,
        productDesc: formData.productDesc.trim(),
        price: formData.price.trim(),
        website: formData.website.trim(),
        logo: logoPreview || null,
        images: imagePreviews,
      });
      
      mockStorage.remove(DRAFT_KEY);
      completeOnboarding();
      success(isRestart ? t.toasts.brandUpdated : t.onboarding.welcomeMessage);
      navigate(safeProtectedDestination(requestedPath(location.state?.from)), { replace: true });
    } catch {
      error(t.toasts.errorOccurred);
    } finally {
      finishingRef.current = false;
    }
  };

  const handleLogoUpload = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        error(t.validation.invalidImageType);
        e.target.value = '';
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        error(t.validation.imageTooLarge);
        e.target.value = '';
        return;
      }

      setIsUploadingLogo(true);
      try {
        const uploaded = await assetApi.uploadAsset(firebaseUser, {
          file,
          type: 'LOGO',
        });
        setLogoPreview(uploaded.url);
        setLogoAsset(uploaded);
        success(t.toasts?.saved || 'Uploaded successfully');
      } catch (err) {
        error(err.message || t.toasts.errorOccurred);
      } finally {
        setIsUploadingLogo(false);
      }
    }
    e.target.value = '';
  };

  const handleImagesUpload = async (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const remaining = Math.max(0, MAX_PRODUCT_IMAGES - imagePreviews.length);
      if (selectedFiles.length > remaining) error(t.validation.maximumImages);
      const files = selectedFiles.slice(0, remaining);
      const validFiles = files.filter((file) => ALLOWED_IMAGE_TYPES.has(file.type) && file.size <= MAX_IMAGE_SIZE);
      if (validFiles.length < files.length) {
        error(t.validation.someImagesRejected);
      }

      if (validFiles.length > 0) {
        setIsUploadingImages(true);
        try {
          const uploadPromises = validFiles.map((file) =>
            assetApi.uploadAsset(firebaseUser, { file, type: 'PRODUCT_IMAGE' })
          );
          const uploadedList = await Promise.all(uploadPromises);
          setImagePreviews((prev) => [...prev, ...uploadedList.map((a) => a.url)].slice(0, MAX_PRODUCT_IMAGES));
          setUploadedImages((prev) => [...prev, ...uploadedList].slice(0, MAX_PRODUCT_IMAGES));
          success(t.toasts?.saved || 'Uploaded successfully');
        } catch (err) {
          error(err.message || t.toasts.errorOccurred);
        } finally {
          setIsUploadingImages(false);
        }
      }
    }
    e.target.value = '';
  };

  const removeImage = async (index) => {
    const assetToRemove = uploadedImages[index];
    if (assetToRemove?.id) {
      try {
        await assetApi.deleteAsset(firebaseUser, assetToRemove.id);
      } catch {
        // Silently catch deletion error on client
      }
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeLogo = async () => {
    if (logoAsset?.id) {
      try {
        await assetApi.deleteAsset(firebaseUser, logoAsset.id);
      } catch {
        // Silently catch deletion error on client
      }
    }
    setLogoPreview(null);
    setLogoAsset(null);
  };

  // Render Steps
  const renderStep1 = () => (
    <div className="onboarding-form page-enter">
      <Input
        label={t.onboarding.businessName}
        value={formData.businessName}
        onChange={(e) => handleChange('businessName', e.target.value)}
        placeholder={t.onboarding.businessNamePlaceholder}
        error={formErrors.businessName}
        maxLength={50}
        required={true}
      />
      <Input
        as="textarea"
        label={t.onboarding.businessDescription}
        value={formData.businessDescription}
        onChange={(e) => handleChange('businessDescription', e.target.value)}
        placeholder={t.onboarding.businessDescriptionPlaceholder}
        error={formErrors.businessDescription}
        maxLength={200}
        required={true}
      />
      <Input
        as="select"
        label={t.onboarding.category}
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        error={formErrors.category}
        required={true}
      >
        <option value="">{t.onboarding.categoryPlaceholder}</option>
        {Object.entries(t.onboarding.categories || {}).map(([key, val]) => (
          <option key={key} value={key}>{val}</option>
        ))}
      </Input>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-form page-enter">
      <Input
        label={t.onboarding.targetAudience}
        value={formData.targetAudience}
        onChange={(e) => handleChange('targetAudience', e.target.value)}
        placeholder={t.onboarding.targetAudiencePlaceholder}
        error={formErrors.targetAudience}
        maxLength={100}
        required={true}
      />
      <Input
        label={t.onboarding.productService}
        value={formData.productService}
        onChange={(e) => handleChange('productService', e.target.value)}
        placeholder={t.onboarding.productServicePlaceholder}
        error={formErrors.productService}
        required={true}
      />
      <Input
        as="textarea"
        label={t.onboarding.productDesc}
        value={formData.productDesc}
        onChange={(e) => handleChange('productDesc', e.target.value)}
        placeholder={t.onboarding.productDescPlaceholder}
        required={false}
      />
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <Input
            label={`${t.onboarding.price} (${t.common.jod})`}
            value={formData.price}
            onChange={(e) => handleChange('price', e.target.value)}
            placeholder={t.onboarding.pricePlaceholder}
            dir="ltr"
            required={false}
          />
        </div>
        <div style={{ flex: 2 }}>
          <Input
            label={t.onboarding.website}
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder={t.onboarding.websitePlaceholder}
            error={formErrors.website}
            dir="ltr"
            required={false}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-form page-enter">
      <div className="fx-input-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="fx-input-label">{t.onboarding.logo}</label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            ({t.common.optional})
          </span>
        </div>
        
        {isUploadingLogo ? (
          <div className="upload-zone" style={{ pointerEvents: 'none', opacity: 0.75 }}>
            <UploadCloud size={32} style={{ margin: '0 auto var(--space-2)', color: 'var(--color-primary)' }} />
            <div style={{ fontWeight: 'bold' }}>{language === 'ar' ? 'جاري رفع الشعار...' : 'Uploading logo...'}</div>
          </div>
        ) : logoPreview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', overflow: 'hidden', background: 'var(--color-input-bg)' }}>
              <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <Button variant="outline" size="sm" onClick={removeLogo}>{t.common.delete}</Button>
          </div>
        ) : (
          <label className="upload-zone">
            <UploadCloud size={32} style={{ margin: '0 auto var(--space-2)', color: 'var(--color-text-muted)' }} />
            <div style={{ fontWeight: 'bold' }}>{t.onboarding.uploadLogo}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{t.onboarding.dragDrop}</div>
            <input type="file" accept="image/*" hidden onChange={handleLogoUpload} disabled={isUploadingLogo} />
          </label>
        )}
      </div>

      <div className="fx-input-wrapper" style={{ marginTop: 'var(--space-2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="fx-input-label">{t.onboarding.brandColors}</label>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
          <div style={{ flex: 1 }}>
            <label className="fx-input-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', display: 'block' }}>{t.onboarding.primaryColor}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input 
                type="color" 
                value={primaryPreviewColor}
                onChange={e => handleChange('primaryColor', e.target.value)} 
                style={{ width: 48, height: 48, padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0, background: 'none' }}
              />
              <Input
                value={formData.primaryColor}
                onChange={e => handleChange('primaryColor', e.target.value)}
                error={formErrors.primaryColor}
                aria-label={t.onboarding.primaryColor}
                dir="ltr"
              />
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label className="fx-input-label" style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', display: 'block' }}>{t.onboarding.secondaryColor}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input 
                type="color" 
                value={secondaryPreviewColor}
                onChange={e => handleChange('secondaryColor', e.target.value)} 
                style={{ width: 48, height: 48, padding: 0, border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', flexShrink: 0, background: 'none' }}
              />
              <Input
                value={formData.secondaryColor}
                onChange={e => handleChange('secondaryColor', e.target.value)}
                error={formErrors.secondaryColor}
                aria-label={t.onboarding.secondaryColor}
                dir="ltr"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-form page-enter">
      <div className="fx-input-wrapper">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <label className="fx-input-label">{t.onboarding.uploadImages}</label>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            ({t.common.optional})
          </span>
        </div>
        
        <label className="upload-zone" style={isUploadingImages ? { pointerEvents: 'none', opacity: 0.75 } : undefined}>
          <UploadCloud size={32} style={{ margin: '0 auto var(--space-2)', color: 'var(--color-text-muted)' }} />
          <div style={{ fontWeight: 'bold' }}>
            {isUploadingImages
              ? (language === 'ar' ? 'جاري رفع الصور...' : 'Uploading images...')
              : t.onboarding.dragDrop}
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{t.onboarding.orClickUpload}</div>
          <input type="file" accept="image/*" multiple hidden onChange={handleImagesUpload} disabled={isUploadingImages} />
        </label>
      </div>

      {imagePreviews.length > 0 && (
        <div className="upload-preview-grid">
          {imagePreviews.map((img, i) => (
            <div key={i} className="upload-preview-item">
              <button type="button" className="upload-remove-btn" onClick={() => removeImage(i)} aria-label={t.common.delete}><X size={14} /></button>
              <img src={img} alt={`Preview ${i}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-form page-enter">
      <div className="review-section">
        <div className="review-section__header">
          <h3 className="review-section__title">{t.onboarding.step1Title}</h3>
          <Button variant="ghost" size="sm" onClick={() => setStep(1)}>{t.common.edit}</Button>
        </div>
        <div className="review-item">
          <div className="review-label">{t.onboarding.businessName}</div>
          <div className="review-value">{formData.businessName}</div>
        </div>
        <div className="review-item">
          <div className="review-label">{t.onboarding.category}</div>
          <div className="review-value">{t.onboarding.categories?.[formData.category] || formData.category}</div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section__header">
          <h3 className="review-section__title">{t.onboarding.step2Title}</h3>
          <Button variant="ghost" size="sm" onClick={() => setStep(2)}>{t.common.edit}</Button>
        </div>
        <div className="review-item">
          <div className="review-label">{t.onboarding.targetAudience}</div>
          <div className="review-value">{formData.targetAudience}</div>
        </div>
        <div className="review-item">
          <div className="review-label">{t.onboarding.productService}</div>
          <div className="review-value">{formData.productService} {formData.price ? `- ${formData.price} ${t.common.jod}` : ''}</div>
        </div>
      </div>
    </div>
  );

  const stepsInfo = [
    { id: 1, title: t.onboarding.step1Title, subtitle: t.onboarding.step1Subtitle, icon: Building2 },
    { id: 2, title: t.onboarding.step2Title, subtitle: t.onboarding.step2Subtitle, icon: Users },
    { id: 3, title: t.onboarding.step3Title, subtitle: t.onboarding.step3Subtitle, icon: Palette },
    { id: 4, title: t.onboarding.step4Title, subtitle: t.onboarding.step4Subtitle, icon: ImageIcon },
    { id: 5, title: t.onboarding.step5Title, subtitle: t.onboarding.step5Subtitle, icon: CheckCircle2 }
  ];

  const currentStepInfo = stepsInfo[step - 1];

  return (
    <div className="onboarding-layout">
      <header className="onboarding-header">
        <div className="brand-logo">
          <div className="brand-logo__mark" lang="en">FX</div>
          <span className="brand-logo__text" lang="en">FinX</span>
        </div>
        <div className="onboarding-header__actions">
          <button className="icon-btn" onClick={toggleTheme} aria-label={t.theme.toggle}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="icon-btn" onClick={toggleLanguage} aria-label={t.language.toggle}>
            <Languages size={20} />
          </button>
          <Button variant="ghost" size="sm" onClick={handleLogout} style={{ color: 'var(--color-error)' }}>
            <LogOut size={18} style={{ marginInlineEnd: '6px' }} /> {t.nav.logout}
          </Button>
        </div>
      </header>

      <main className="onboarding-main">
        <div className="onboarding-content">
          <div className="onboarding-stepper">
            <div className="stepper-progress">
              <div className="stepper-progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
            </div>
            <div className="stepper-text">
              <span>{t.common.step} {step} {t.common.of} {totalSteps}</span>
              <span>{Math.round((step / totalSteps) * 100)}%</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <currentStepInfo.icon size={28} style={{ color: 'var(--color-accent)' }} />
            <h1 className="onboarding-step-title" style={{ margin: 0 }}>{currentStepInfo.title}</h1>
          </div>
          <p className="onboarding-step-subtitle">{currentStepInfo.subtitle}</p>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}

          <div className="onboarding-actions">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep}>
                <ArrowPrev size={18} style={{ marginInlineEnd: '6px' }} /> {t.onboarding.back}
              </Button>
            ) : (
              <div></div> // Empty div for flex-between spacing
            )}
            
            <div className="btn-group">
              {step === 4 && (
                <Button variant="ghost" onClick={nextStep}>
                  {t.onboarding.skipForNow} <SkipForward size={16} style={{ marginInlineStart: '6px' }} />
                </Button>
              )}
              {step < totalSteps ? (
                <Button variant="primary" onClick={nextStep}>
                  {t.onboarding.continue} <ArrowNext size={18} style={{ marginInlineStart: '6px' }} />
                </Button>
              ) : (
                <Button variant="primary" onClick={handleFinish} icon={CheckCircle2}>
                  {t.onboarding.startCreating}
                </Button>
              )}
            </div>
          </div>
        </div>

        <aside className="onboarding-visual">
          <div className="onboarding-visual-card">
            <div className="visual-mock-header">
              <div className="visual-mock-logo">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" />
                ) : (
                  <Building2 size={24} style={{ color: 'var(--color-text-muted)' }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)', marginBottom: 4 }}>
                  {formData.businessName || t.onboarding.businessNamePlaceholder}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {t.onboarding.categories?.[formData.category] || t.onboarding.category}
                </div>
              </div>
            </div>
            
            <div className="visual-mock-image" style={{ background: `linear-gradient(45deg, ${primaryPreviewColor}20, ${secondaryPreviewColor}20)` }}>
              {imagePreviews.length > 0 ? (
                <img src={imagePreviews[0]} alt="Product" />
              ) : (
                <ImageIcon size={48} style={{ opacity: 0.5 }} />
              )}
            </div>

            <div className="visual-mock-text-line" style={{ width: '80%' }}></div>
            <div className="visual-mock-text-line" style={{ width: '60%' }}></div>
            
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <div style={{ flex: 1, height: 32, background: primaryPreviewColor, borderRadius: '4px', opacity: 0.9 }}></div>
              <div style={{ flex: 1, height: 32, background: secondaryPreviewColor, borderRadius: '4px', opacity: 0.9 }}></div>
            </div>
          </div>
          
          <div style={{ marginTop: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            <Sparkles size={16} style={{ marginInlineEnd: '4px', display: 'inline-block', verticalAlign: 'middle', color: 'var(--color-accent)' }} />
            {t.onboarding.subtitle}
          </div>
        </aside>
      </main>
    </div>
  );
}

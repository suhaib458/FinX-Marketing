import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import {
  MessageSquare, Palette, Lightbulb, Calendar,
  Copy, Download, Save, ArrowLeft, ArrowRight,
  RotateCcw, Home, Zap
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import GeneratingScreen from '../../components/ui/GeneratingScreen';
import { DEFAULT_CUSTOMER_BRAND_COLORS } from '../../constants/brandDefaults';
import mockGeneration from '../../services/mockGeneration';
import mockCredits from '../../services/mockCredits';
import { generateVariationWithCredits } from '../../services/mockGenerationFlow';
import contentApi from '../../services/contentApi';
import { aiErrorMessage } from '../../utils/aiErrorMessage';

const typeIcons = {
  'social-post': MessageSquare,
  'ad-design': Palette,
  'content-ideas': Lightbulb,
  'campaign': Calendar,
};

const typeToolKeys = {
  'social-post': 'socialPost',
  'ad-design': 'adDesign',
  'content-ideas': 'contentIdeas',
  'campaign': 'campaign',
};

function ContentResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { success, error: toastError } = useToast();
  const { firebaseUser } = useAuth();
  const { applyGenerationResult, updateContentItem } = useAppData();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editable state
  const [editedContent, setEditedContent] = useState({});
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedTone, setSelectedTone] = useState('');
  const [selectedLength, setSelectedLength] = useState('medium');
  const [variationModalOpen, setVariationModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const variationRequestRef = useRef(false);

  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    let cancelled = false;

    if (import.meta.env.VITE_AI_MODE === 'mock') {
      const cached = mockGeneration.getResult(id);
      if (cached) {
        setResult(cached);
        setEditedContent(cached.content || {});
        setSelectedTone(cached.tone || 'professional');
      }
      setLoading(false);
      return () => { cancelled = true; };
    }

    (async () => {
      try {
        const data = await contentApi.get(firebaseUser, id);
        if (cancelled) return;
        setResult(data);
        setEditedContent(data.content || {});
        setSelectedTone(data.tone || 'professional');
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [firebaseUser, id]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      success(t.toasts.copiedToClipboard);
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      success(t.toasts.copiedToClipboard);
    });
  }, [success, t]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    try {
      const updated = await contentApi.update(firebaseUser, result.id, { content: editedContent, saved: true });
      updateContentItem(result.id, { ...updated, content: updated.content, saved: true });
      success(t.toasts.savedToLibrary);
      setResult(prev => ({ ...prev, ...updated, content: updated.content, saved: true }));
    } catch (err) {
      toastError(err.message || t.toasts.errorOccurred);
    }
  }, [editedContent, firebaseUser, result, success, t, toastError, updateContentItem]);

  const handleDownloadDesign = useCallback(() => {
    if (!result || result.type !== 'ad-design') return;
    const c = editedContent;
    const escapeSvgText = (value) => String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
    const w = c.designSize === 'story' ? 540 : c.designSize === 'portrait' ? 640 : c.designSize === 'landscape' ? 960 : 640;
    const h = c.designSize === 'story' ? 960 : c.designSize === 'portrait' ? 800 : c.designSize === 'landscape' ? 540 : 640;
    const primaryColor = escapeSvgText(c.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary);
    const secondaryColor = escapeSvgText(c.secondaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.secondary);
    const logo = c.logo
      ? `<image href="${escapeSvgText(c.logo)}" x="24" y="24" width="96" height="64" preserveAspectRatio="xMidYMid meet"/>`
      : '';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <rect width="100%" height="100%" fill="${primaryColor}"/>
      <rect x="0" y="${h * 0.7}" width="100%" height="${h * 0.3}" fill="${secondaryColor}" opacity="0.3"/>
      ${logo}
      <text x="50%" y="40%" fill="white" font-size="32" font-weight="bold" text-anchor="middle" font-family="Arial">${escapeSvgText(c.headline)}</text>
      <text x="50%" y="55%" fill="white" font-size="18" text-anchor="middle" font-family="Arial" opacity="0.9">${escapeSvgText(c.offer)}</text>
      <rect x="${w * 0.25}" y="${h * 0.72}" width="${w * 0.5}" height="44" rx="8" fill="white"/>
      <text x="50%" y="${h * 0.72 + 28}" fill="${primaryColor}" font-size="16" font-weight="bold" text-anchor="middle" font-family="Arial">${escapeSvgText(c.cta)}</text>
    </svg>`;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finx-design-${result.id}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success(t.toasts.downloadStarted);
  }, [result, editedContent, success, t]);

  const updateField = (field, value) => {
    setEditedContent((previous) => ({ ...previous, [field]: value }));
  };

  const handleGenerateVariation = () => {
    setVariationModalOpen(true);
  };

  const confirmVariation = async () => {
    if (!result || variationRequestRef.current) return;
    if (import.meta.env.VITE_AI_MODE === 'mock' && !mockCredits.canAfford(result.type)) {
      toastError(t.generation?.insufficientCredits || 'Insufficient credits');
      setVariationModalOpen(false);
      return;
    }

    setVariationModalOpen(false);
    variationRequestRef.current = true;
    setIsGenerating(true);

    try {
      const variation = await generateVariationWithCredits(result.id, {
        tone: selectedTone,
        length: selectedLength,
      }, { firebaseUser });
      applyGenerationResult(variation);
      success(t.toasts.variationSuccess);
      navigate(`/app/result/${variation.id}`);
    } catch (err) {
      toastError(aiErrorMessage(err, language, t.toasts.errorOccurred || 'An error occurred'));
    } finally {
      variationRequestRef.current = false;
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="page-enter flex-center" style={{ minHeight: '40vh' }}>
        <div className="fx-spinner fx-spinner--lg" />
      </div>
    );
  }

  if (isGenerating) {
    const icon = typeIcons[result?.type];
    const color = result?.type === 'social-post' ? 'var(--tool-social)' : result?.type === 'ad-design' ? 'var(--tool-ad)' : 'var(--color-accent)';
    return <GeneratingScreen language={language} icon={icon} color={color} />;
  }

  if (!result) {
    return (
      <div className="page-enter fx-empty-state" style={{ minHeight: '40vh' }}>
        <h2 className="fx-empty-state__title">{t.results.notFound}</h2>
        <p className="fx-empty-state__description">{t.results.notFoundDesc}</p>
        <Button variant="primary" onClick={() => navigate('/app')}>
          <Home size={16} /> {t.results.backToDashboard}
        </Button>
      </div>
    );
  }

  const Icon = typeIcons[result.type] || MessageSquare;
  const toolKey = typeToolKeys[result.type];

  // ─── Social Post Result ───
  const renderSocialPost = () => {
    const c = editedContent;
    return (
      <div className="result-content">
        <div className="result-section fx-card fx-card--result">
          <div className="result-field-header">
            <h3>{t.results.headline}</h3>
          </div>
          <div className="result-editable">
            <textarea
              className="fx-input fx-textarea result-textarea"
              value={c.headline || ''}
              onChange={e => updateField('headline', e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="result-section fx-card fx-card--result">
          <div className="result-field-header">
            <h3>{t.results.caption}</h3>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(c.caption)}>
              <Copy size={14} /> {t.results.copyCaption}
            </Button>
          </div>
          <div className="result-editable">
            <textarea
              className="fx-input fx-textarea result-textarea"
              value={c.caption || ''}
              onChange={e => updateField('caption', e.target.value)}
              rows={6}
            />
            <span className="result-char-count">{(c.caption || '').length} {t.results.charCount}</span>
          </div>
        </div>

        <div className="result-section fx-card fx-card--result">
          <h3>{t.results.cta}</h3>
          <input
            className="fx-input"
            value={c.cta || ''}
            onChange={e => updateField('cta', e.target.value)}
          />
        </div>

        <div className="result-section fx-card fx-card--result">
          <h3>{t.results.hashtags}</h3>
          <div className="result-hashtags">
            {(c.hashtags || []).map((tag, i) => (
              <span key={i} className="result-hashtag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="result-section fx-card fx-card--result">
          <h3>{t.results.visualConcept}</h3>
          <p className="result-visual-concept">{c.visualConcept}</p>
        </div>

        {c.platformMeta && (
          <div className="result-section fx-card fx-card--result">
            <h3>{t.results.platformMeta}</h3>
            <div className="result-meta-grid">
              <div className="result-meta-item">
                <span className="result-meta-label">{t.results.charCount}</span>
                <span className="result-meta-value">{c.platformMeta.charCount}</span>
              </div>
              <div className="result-meta-item">
                <span className="result-meta-label">{t.results.bestTime}</span>
                <span className="result-meta-value">{c.platformMeta.bestTimeToPost}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tone/Length Controls */}
        <div className="result-controls">
          <div className="result-control-group">
            <label className="fx-input-label">{t.results.tone}</label>
            <div className="chip-group">
              {Object.entries(t.tones).map(([key, label]) => (
                <button key={key} className={`chip ${selectedTone === key ? 'chip--active' : ''}`} onClick={() => setSelectedTone(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="result-control-group">
            <label className="fx-input-label">{t.results.length}</label>
            <div className="chip-group">
              {Object.entries(t.lengths).map(([key, label]) => (
                <button key={key} className={`chip ${selectedLength === key ? 'chip--active' : ''}`} onClick={() => setSelectedLength(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Ad Design Result ───
  const renderAdDesign = () => {
    const c = editedContent;
    const aspectRatio = c.designSize === 'story' ? '9/16'
      : c.designSize === 'portrait' ? '4/5'
      : c.designSize === 'landscape' ? '16/9' : '1/1';

    return (
      <div className="result-content">
        {/* Design Preview */}
        <div className="result-design-preview" style={{ aspectRatio, maxHeight: 400 }}>
          <div className="ad-preview" style={{ background: `linear-gradient(135deg, ${c.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary}, ${c.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary}CC)` }}>
            {c.logo && <img src={c.logo} alt="Logo" className="ad-preview__logo" />}
            {c.productImage && <img src={c.productImage} alt="Product" className="ad-preview__product" />}
            <div className="ad-preview__text">
              <h2 className="ad-preview__headline">{c.headline}</h2>
              <p className="ad-preview__offer">{c.offer}</p>
            </div>
            <div className="ad-preview__cta" style={{ background: c.secondaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.secondary, color: c.primaryColor || DEFAULT_CUSTOMER_BRAND_COLORS.primary }}>
              {c.cta}
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <div className="result-section fx-card fx-card--result">
          <h3>{t.results.headline}</h3>
          <input className="fx-input" value={c.headline || ''} onChange={e => updateField('headline', e.target.value)} />
        </div>
        <div className="result-section fx-card fx-card--result">
          <h3>{t.generation.offerDescription}</h3>
          <input className="fx-input" value={c.offer || ''} onChange={e => updateField('offer', e.target.value)} />
        </div>
        <div className="result-section fx-card fx-card--result">
          <h3>{t.results.cta}</h3>
          <input className="fx-input" value={c.cta || ''} onChange={e => updateField('cta', e.target.value)} />
        </div>
      </div>
    );
  };

  // ─── Content Ideas Result ───
  const renderContentIdeas = () => {
    const ideas = editedContent.ideas || [];
    return (
      <div className="result-content">
        <div className="result-ideas-grid">
          {ideas.map((idea, i) => (
            <div key={idea.id || i} className="result-idea-card fx-card fx-card--result">
              <div className="result-idea-card__num">{i + 1}</div>
              <h3 className="result-idea-card__title">{idea.title}</h3>

              <div className="result-idea-field">
                <span className="result-idea-label">{t.results.ideaHook}</span>
                <p>{idea.hook}</p>
              </div>
              <div className="result-idea-field">
                <span className="result-idea-label">{t.results.ideaFormat}</span>
                <p>{idea.format}</p>
              </div>
              <div className="result-idea-field">
                <span className="result-idea-label">{t.results.ideaAngle}</span>
                <p>{idea.angle}</p>
              </div>
              <div className="result-idea-field">
                <span className="result-idea-label">{t.results.ideaCta}</span>
                <p>{idea.cta}</p>
              </div>
              <div className="result-idea-field">
                <span className="result-idea-label">{t.results.ideaVisual}</span>
                <p>{idea.visual}</p>
              </div>

              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${idea.title}\n${idea.hook}\n${idea.angle}\n${idea.cta}`)}>
                <Copy size={14} /> {t.common.copy}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Campaign Result ───
  const renderCampaign = () => {
    const days = editedContent.days || [];
    const currentDay = days[selectedDay];

    return (
      <div className="result-content">
        {/* Day Tabs */}
        <div className="campaign-day-tabs">
          {days.map((day, i) => (
            <button
              key={i}
              className={`campaign-day-tab ${selectedDay === i ? 'campaign-day-tab--active' : ''}`}
              onClick={() => setSelectedDay(i)}
            >
              <span className="campaign-day-tab__num">{t.campaign.dayLabel} {day.day}</span>
              <span className="campaign-day-tab__date">{day.date}</span>
            </button>
          ))}
        </div>

        {currentDay && (
          <div className="campaign-day-content page-enter fx-card fx-card--result">
            <div className="campaign-day-header">
              <h3>{t.campaign.dayLabel} {currentDay.day} — {currentDay.date}</h3>
              <div className="campaign-day-badges">
                <span className="result-badge" lang="en">{t.platforms[currentDay.platform] || currentDay.platform}</span>
                <span className="result-badge result-badge--muted">{currentDay.format}</span>
              </div>
            </div>

            <div className="result-section">
              <h4>{t.campaign.contentIdea}</h4>
              <p className="result-highlight">{currentDay.idea}</p>
            </div>

            <div className="result-section">
              <h4>{t.results.ideaHook}</h4>
              <p className="result-highlight">{currentDay.hook}</p>
            </div>

            <div className="result-section">
              <h4>{t.campaign.caption}</h4>
              <textarea
                className="fx-input fx-textarea result-textarea"
                value={currentDay.caption}
                onChange={e => {
                  const newDays = [...days];
                  newDays[selectedDay] = { ...currentDay, caption: e.target.value };
                  updateField('days', newDays);
                }}
                rows={5}
              />
            </div>

            <div className="result-section">
              <h4>{t.campaign.cta}</h4>
              <p>{currentDay.cta}</p>
            </div>

            <div className="result-section">
              <h4>{t.campaign.designConcept}</h4>
              <p className="result-visual-concept">{currentDay.designConcept}</p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => {
              const dayText = `${t.campaign.dayLabel} ${currentDay.day}\n${currentDay.idea}\n\n${currentDay.hook}\n\n${currentDay.caption}\n\n${currentDay.cta}`;
              copyToClipboard(dayText);
            }}>
              <Copy size={14} /> {t.results.copyDay}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    switch (result.type) {
      case 'social-post': return renderSocialPost();
      case 'ad-design': return renderAdDesign();
      case 'content-ideas': return renderContentIdeas();
      case 'campaign': return renderCampaign();
      default: return null;
    }
  };

  const handleCopyAll = () => {
    let text = '';
    if (result.type === 'social-post') {
      const c = editedContent;
      text = `${c.headline}\n\n${c.caption}\n\n${c.cta}\n\n${(c.hashtags || []).join(' ')}`;
    } else if (result.type === 'content-ideas') {
      text = (editedContent.ideas || []).map((idea, i) =>
        `${i + 1}. ${idea.title}\n${idea.hook}\n${idea.angle}\n${idea.cta}`
      ).join('\n\n');
    } else if (result.type === 'ad-design') {
      const c = editedContent;
      text = `${c.headline}\n\n${c.offer}\n\n${c.cta}`;
    } else if (result.type === 'campaign') {
      text = (editedContent.days || []).map(day =>
        `${t.campaign.dayLabel} ${day.day} - ${day.date}\n${day.idea}\n${day.hook}\n${day.caption}\n${day.cta}`
      ).join('\n\n---\n\n');
    }
    if (text) copyToClipboard(text);
  };

  return (
    <div className="page-enter result-page">
      {/* Result Header */}
      <div className="result-header">
        <div className="result-header__start">
          <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
            <ArrowBack size={16} /> {t.results.backToDashboard}
          </Button>
        </div>
        <div className="result-header__info">
          <div className="result-header__icon" style={{ color: typeIcons[result.type] ? undefined : 'var(--color-accent)' }}>
            <Icon size={20} />
          </div>
          <div>
            <h1 className="result-header__title">{t.tools[toolKey]?.title}</h1>
            <div className="result-header__meta">
              <span lang="en">{t.platforms[result.platform]}</span>
              <span>·</span>
              <span>{new Date(result.createdAt).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')}</span>
              <span>·</span>
              <span><Zap size={12} /> {result.creditCost} {t.dashboard.creditUnit}</span>
              {result.businessName && (
                <>
                  <span>·</span>
                  <span>{result.businessName}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Result Body */}
      {renderResult()}

      {/* Action Bar */}
      <div className="result-actions fx-card fx-card--elevated">
        <div className="result-actions__group">
          <Button variant="ghost" size="sm" onClick={handleCopyAll}>
            <Copy size={16} /> {t.results.copyAll}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSave}>
            <Save size={16} /> {result.saved ? t.results.saved : t.results.saveToLibrary}
          </Button>
          {result.type === 'ad-design' && (
            <Button variant="ghost" size="sm" onClick={handleDownloadDesign}>
              <Download size={16} /> {t.results.downloadDesign}
            </Button>
          )}
        </div>
        <div className="result-actions__group">
          <Button variant="outline" size="sm" onClick={handleGenerateVariation}>
            <RotateCcw size={16} /> {t.results.generateVariation}
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/create')}>
            {t.results.createAnother}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={variationModalOpen}
        onClose={() => setVariationModalOpen(false)}
        title={t.toasts.variationTitle}
        footer={
          <>
            <Button variant="ghost" onClick={() => setVariationModalOpen(false)}>
              {t.common.cancel || 'Cancel'}
            </Button>
            <Button variant="primary" onClick={confirmVariation}>
              {t.common.confirm || 'Confirm'}
            </Button>
          </>
        }
      >
        <p>
          {t.toasts.variationConfirm} <strong>{result?.creditCost} {t.dashboard.creditUnit}</strong>.
        </p>
      </Modal>
    </div>
  );
}

export default ContentResult;

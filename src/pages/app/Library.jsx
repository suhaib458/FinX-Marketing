import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, PlusCircle, MessageSquare, Palette, Lightbulb, Calendar, FolderMinus, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import mockGeneration from '../../services/mockGeneration';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import contentApi from '../../services/contentApi';

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

const typeColors = {
  'social-post': 'var(--tool-social)',
  'ad-design': 'var(--tool-ad)',
  'content-ideas': 'var(--tool-ideas)',
  'campaign': 'var(--tool-campaign)',
};

function Library() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { firebaseUser } = useAuth();
  const [savedItems, setSavedItems] = useState([]);
  const [filterTool, setFilterTool] = useState('all');

  useEffect(() => {
    let cancelled = false;
    setSavedItems(mockGeneration.getSavedResults());
    contentApi.list(firebaseUser, { saved: true, page: 1, limit: 100 })
      .then((payload) => {
        if (cancelled) return;
        setSavedItems(payload.data);
        payload.data.forEach((item) => mockGeneration.saveExternalResult(item));
      })
      .catch(() => { /* keep cached library during temporary outages */ });
    return () => { cancelled = true; };
  }, [firebaseUser]);

  const handleDelete = async (id) => {
    if (!window.confirm(t.library.removeConfirm)) return;
    try {
      await contentApi.setSaved(firebaseUser, id, false);
      mockGeneration.updateResult(id, { saved: false, savedAt: null });
      setSavedItems(prev => prev.filter(item => item.id !== id));
      success(t.toasts.removedFromLibrary);
    } catch (err) {
      toastError(err.message || t.toasts.errorOccurred);
    }
  };

  const filtered = filterTool === 'all'
    ? savedItems
    : savedItems.filter(item => item.type === filterTool);

  const isEmpty = savedItems.length === 0;

  return (
    <div className="page-enter library-page">
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}>
        <div>
          <h1 className="library-title">
            {t.library.title}
          </h1>
          <p className="library-subtitle">
            {t.library.subtitle}
          </p>
        </div>
      </div>

      {isEmpty ? (
        <div className="fx-empty-state fx-card fx-card--empty library-empty">
          <div className="library-empty__illustration">
            <FolderOpen size={58} />
            <MessageSquare size={21} />
            <Palette size={21} />
          </div>
          <h2 className="fx-empty-state__title">{t.library.emptyTitle}</h2>
          <p className="fx-empty-state__description">{t.library.emptyDescription}</p>
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={() => navigate('/app/create')}
            style={{ marginTop: 'var(--space-4)' }}
          >
            {t.library.emptyAction}
          </Button>
          <div className="library-empty__hints">
            <span><MessageSquare size={16} /> {t.tools.socialPost?.title}</span>
            <span><Palette size={16} /> {t.tools.adDesign?.title}</span>
            <span><Calendar size={16} /> {t.tools.campaign?.title}</span>
          </div>
          <small>{t.library.subtitle}</small>
        </div>
      ) : (
        <>
          {/* Filter chips */}
          <div className="chip-group" style={{ marginBottom: 'var(--space-5)' }}>
            <button
              className={`chip ${filterTool === 'all' ? 'chip--active' : ''}`}
              onClick={() => setFilterTool('all')}
            >
              {t.common.all} ({savedItems.length})
            </button>
            {Object.entries(typeToolKeys).map(([slug, key]) => {
              const count = savedItems.filter(i => i.type === slug).length;
              if (count === 0) return null;
              return (
                <button
                  key={slug}
                  className={`chip ${filterTool === slug ? 'chip--active' : ''}`}
                  onClick={() => setFilterTool(slug)}
                >
                  {t.tools[key]?.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Items grid */}
          <div className="library-grid">
            {filtered.map(item => {
              const Icon = typeIcons[item.type] || MessageSquare;
              const color = typeColors[item.type] || 'var(--color-accent)';
              const toolKey = typeToolKeys[item.type];
              const preview = item.type === 'social-post'
                ? item.content?.headline || item.content?.caption?.slice(0, 80) || ''
                : item.type === 'ad-design'
                  ? item.content?.headline || ''
                  : item.type === 'campaign'
                    ? item.content?.objective || ''
                    : item.content?.ideas?.[0]?.title || '';

              return (
                <div
                  key={item.id}
                  className="fx-card fx-card--interactive library-card"
                  role="link"
                  tabIndex="0"
                  onClick={() => navigate(`/app/result/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/app/result/${item.id}`);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--radius-md)',
                      background: `color-mix(in srgb, ${color} 14%, transparent)`, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={18} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>
                        {t.tools[toolKey]?.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        <span lang="en">{t.platforms[item.platform] || item.platform}</span> · {new Date(item.savedAt || item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')}
                      </div>
                    </div>
                  </div>

                  {preview && (
                    <p className="library-card__preview">
                      {preview}
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={(event) => { event.stopPropagation(); navigate(`/app/result/${item.id}`); }}>
                      <Eye size={14} /> {t.dashboard.viewResult}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      aria-label={t.library.removeFromLibrary}
                      title={t.library.removeFromLibrary}
                    >
                      <FolderMinus size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default Library;

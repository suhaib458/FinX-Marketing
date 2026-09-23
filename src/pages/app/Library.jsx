import { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, PlusCircle, MessageSquare, Palette, Lightbulb, Calendar,
  Eye, Search, MoreHorizontal, SlidersHorizontal, ArrowUpDown
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
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

function itemType(item) {
  return item?.type || item?.tool?.toLowerCase?.().replaceAll('_', '-') || 'social-post';
}

function itemPreview(item) {
  const type = itemType(item);
  if (type === 'social-post') return item.content?.headline || item.content?.caption || '';
  if (type === 'ad-design') return item.content?.headline || item.content?.offer || '';
  if (type === 'campaign') return item.content?.days?.[0]?.idea || item.content?.objective || '';
  return item.content?.ideas?.[0]?.title || '';
}

function LibraryVisual({ item }) {
  const type = itemType(item);
  const Icon = typeIcons[type] || MessageSquare;
  const productImage = item.content?.productImage;
  const headline = itemPreview(item);

  if (productImage) {
    return (
      <div className="library-visual library-visual--image">
        <img src={productImage} alt="" />
        <div className="library-visual__scrim" />
        <div className="library-visual__badge"><Icon size={14} /></div>
        <strong>{headline}</strong>
      </div>
    );
  }

  return (
    <div className={`library-visual library-visual--${type}`}>
      <div className="library-visual__orb library-visual__orb--one" />
      <div className="library-visual__orb library-visual__orb--two" />
      <div className="library-visual__center">
        <Icon size={type === 'content-ideas' ? 34 : 28} />
      </div>
      {type === 'social-post' && (
        <div className="library-visual__lines" aria-hidden="true"><i /><i /><i /></div>
      )}
      {type === 'campaign' && (
        <div className="library-visual__campaign-bars" aria-hidden="true">
          {[36, 72, 52, 88, 62].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      )}
      {headline && <strong>{headline}</strong>}
    </div>
  );
}

function Library() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { firebaseUser } = useAuth();
  const { contentItems, updateContentItem } = useAppData();
  const savedItems = useMemo(
    () => contentItems.filter((item) => Boolean(item.savedAt || item.saved)),
    [contentItems],
  );
  const [filterTool, setFilterTool] = useState('all');
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  const copy = language === 'ar'
    ? {
        search: 'ابحث في مكتبتك...',
        newest: 'الأحدث',
        oldest: 'الأقدم',
        filters: 'تصفية',
        open: 'فتح',
        generated: 'محتوى محفوظ',
      }
    : {
        search: 'Search your library...',
        newest: 'Newest',
        oldest: 'Oldest',
        filters: 'Filter',
        open: 'Open',
        generated: 'Saved content',
      };

  const handleDelete = async (id) => {
    if (!window.confirm(t.library.removeConfirm)) return;
    try {
      await contentApi.setSaved(firebaseUser, id, false);
      updateContentItem(id, { saved: false, savedAt: null });
      success(t.toasts.removedFromLibrary);
    } catch (err) {
      toastError(err.message || t.toasts.errorOccurred);
    }
  };

  const visibleItems = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
    const filtered = savedItems.filter((item) => {
      const type = itemType(item);
      if (filterTool !== 'all' && type !== filterTool) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        itemPreview(item),
        item.businessName,
        item.platform,
        t.tools[typeToolKeys[type]]?.title,
      ].filter(Boolean).join(' ').toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
      return haystack.includes(normalizedSearch);
    });

    return [...filtered].sort((a, b) => {
      const aTime = new Date(a.savedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.savedAt || b.createdAt || 0).getTime();
      return sortOrder === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [savedItems, filterTool, search, sortOrder, language, t.tools]);

  const isEmpty = savedItems.length === 0;

  return (
    <div className="page-enter library-page library-page--premium">
      <div className="library-premium-header">
        <div>
          <h1 className="library-title">{t.library.title}</h1>
          <p className="library-subtitle">{t.library.subtitle}</p>
        </div>

        {!isEmpty && (
          <div className="library-search-shell">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
            />
          </div>
        )}
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
        </div>
      ) : (
        <>
          <div className="library-toolbar">
            <div className="library-filter-chips">
              <button
                className={`library-filter-chip ${filterTool === 'all' ? 'library-filter-chip--active' : ''}`}
                onClick={() => setFilterTool('all')}
              >
                <SlidersHorizontal size={14} />
                {t.common.all} <span>{savedItems.length}</span>
              </button>
              {Object.entries(typeToolKeys).map(([slug, key]) => {
                const count = savedItems.filter((item) => itemType(item) === slug).length;
                if (count === 0) return null;
                return (
                  <button
                    key={slug}
                    className={`library-filter-chip ${filterTool === slug ? 'library-filter-chip--active' : ''}`}
                    onClick={() => setFilterTool(slug)}
                  >
                    {t.tools[key]?.title} <span>{count}</span>
                  </button>
                );
              })}
            </div>

            <label className="library-sort">
              <ArrowUpDown size={14} />
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                <option value="newest">{copy.newest}</option>
                <option value="oldest">{copy.oldest}</option>
              </select>
            </label>
          </div>

          {visibleItems.length > 0 ? (
            <div className="library-grid library-grid--premium">
              {visibleItems.map((item) => {
                const type = itemType(item);
                const toolKey = typeToolKeys[type] || 'socialPost';
                const preview = itemPreview(item);
                const date = new Date(item.savedAt || item.createdAt);

                return (
                  <article
                    key={item.id}
                    className="library-card library-card--premium"
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
                    <LibraryVisual item={item} />

                    <div className="library-card__content">
                      <div className="library-card__topline">
                        <div>
                          <strong>{t.tools[toolKey]?.title}</strong>
                          <span>
                            <span lang="en">{t.platforms[item.platform] || item.platform || copy.generated}</span>
                            {' · '}
                            {Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="library-card__menu"
                          aria-label={t.library.removeFromLibrary}
                          title={t.library.removeFromLibrary}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(item.id);
                          }}
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>

                      {preview && <p className="library-card__preview">{preview}</p>}

                      <button
                        type="button"
                        className="library-card__open"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/app/result/${item.id}`);
                        }}
                      >
                        <Eye size={14} />
                        {copy.open}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="library-no-results fx-card fx-card--quiet">
              <Search size={24} />
              <strong>{t.common.noResults}</strong>
              <button type="button" onClick={() => { setSearch(''); setFilterTool('all'); }}>
                {copy.filters}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Library;

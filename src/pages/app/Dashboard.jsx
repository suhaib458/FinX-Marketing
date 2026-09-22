import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare, Palette, Lightbulb, Calendar, Sparkles, Zap,
  ArrowLeft, ArrowRight, FolderOpen, TrendingUp, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import mockCredits from '../../services/mockCredits';
import mockGeneration from '../../services/mockGeneration';
import mockBrand from '../../services/mockBrand';
import Button from '../../components/ui/Button';

const toolIcons = {
  socialPost: MessageSquare,
  adDesign: Palette,
  contentIdeas: Lightbulb,
  campaign: Calendar,
};

const toolRoutes = {
  socialPost: '/app/create/social-post',
  adDesign: '/app/create/ad-design',
  contentIdeas: '/app/create/content-ideas',
  campaign: '/app/create/campaign',
};

const toolColors = {
  socialPost: 'var(--tool-social)',
  adDesign: 'var(--tool-ad)',
  contentIdeas: 'var(--tool-ideas)',
  campaign: 'var(--tool-campaign)',
};

const toolSlugs = {
  socialPost: 'social-post',
  adDesign: 'ad-design',
  contentIdeas: 'content-ideas',
  campaign: 'campaign',
};

const activityTypeIcons = {
  'social-post': MessageSquare,
  'ad-design': Palette,
  'content-ideas': Lightbulb,
  'campaign': Calendar,
};

function ToolMiniPreview({ toolKey }) {
  if (toolKey === 'socialPost') {
    return <div className="tool-mini tool-mini--post" aria-hidden="true"><i /><i /><i /></div>;
  }
  if (toolKey === 'adDesign') {
    return <div className="tool-mini tool-mini--design" aria-hidden="true"><i /><span /></div>;
  }
  if (toolKey === 'contentIdeas') {
    return <div className="tool-mini tool-mini--ideas" aria-hidden="true"><i /><i /><i /></div>;
  }
  return <div className="tool-mini tool-mini--campaign" aria-hidden="true">{Array.from({ length: 7 }, (_, i) => <i key={i} />)}</div>;
}

function ActivityVisual({ item, result }) {
  const Icon = activityTypeIcons[item.type] || MessageSquare;
  const productImage = result?.content?.productImage;

  if (productImage) {
    return (
      <div className="dash-activity-visual dash-activity-visual--image">
        <img src={productImage} alt="" />
        <span><Icon size={14} /></span>
      </div>
    );
  }

  return (
    <div className={`dash-activity-visual dash-activity-visual--${item.type}`}>
      <span><Icon size={16} /></span>
      {item.type === 'campaign' && (
        <div className="dash-activity-visual__bars" aria-hidden="true">
          {[42, 72, 56, 88].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}
        </div>
      )}
      {item.type === 'social-post' && (
        <div className="dash-activity-visual__lines" aria-hidden="true"><i /><i /><i /></div>
      )}
    </div>
  );
}

function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const ArrowNav = language === 'ar' ? ArrowLeft : ArrowRight;

  const brand = mockBrand.getProfile();
  const credits = mockCredits.getBalance();
  const stats = mockGeneration.getStats();
  const activity = mockGeneration.getRecentActivity(4);
  const tools = ['socialPost', 'adDesign', 'contentIdeas', 'campaign'];

  const businessName = brand?.businessName || '';
  const productName = brand?.productService || '';

  return (
    <div className="page-enter dashboard-page">
      {/* ─── Welcome Header ─── */}
      <section className="dash-welcome">
        <div className="dash-welcome__content">
          <div className="dash-welcome__text">
            <h1 className="dash-welcome__title">
              {t.dashboard.greeting}، {user?.name || ''}
              <Sparkles size={24} className="dash-welcome__sparkle" />
            </h1>
            {businessName && (
              <p className="dash-welcome__business">{businessName}</p>
            )}
            <p className="dash-welcome__subtitle">{t.dashboard.subtitle}</p>
          </div>
          <div className="dash-welcome__actions">
            <Button variant="primary" size="lg" onClick={() => navigate('/app/create')}>
              <Plus size={18} />
              {t.dashboard.createNew}
            </Button>
            <div className="dash-welcome__badges">
              <span className="dash-plan-badge">
                {t.plans[user?.plan || 'free']?.name || t.common.free}
              </span>
              <span className="dash-credit-badge">
                <Zap size={14} /> {credits} {t.dashboard.creditUnit}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Four Primary Tool Cards ─── */}
      <section className="dash-tools">
        <div className="dash-tools__grid">
          {tools.map((toolKey) => {
            const Icon = toolIcons[toolKey];
            const color = toolColors[toolKey];
            const tool = t.tools[toolKey];
            const cost = mockCredits.getCost(toolSlugs[toolKey]);

            return (
              <button
                key={toolKey}
                className="dash-tool-card fx-card fx-card--interactive"
                onClick={() => navigate(toolRoutes[toolKey])}
                style={{ '--tool-color': color }}
              >
                <div className="dash-tool-card__header">
                  <div className="dash-tool-card__icon-wrap" style={{ background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                    <Icon size={24} style={{ color }} />
                  </div>
                <div className="dash-tool-card__visual" style={{ '--tool-color': color }}>
                  <ToolMiniPreview toolKey={toolKey} />
                  </div>
                </div>
                <div className="dash-tool-card__body">
                  <h3 className="dash-tool-card__title">{tool.title}</h3>
                  <p className="dash-tool-card__desc">{tool.description}</p>
                </div>
                <div className="dash-tool-card__footer">
                  <span className="dash-tool-card__cost">
                    <Zap size={12} /> {cost} {t.dashboard.creditUnit}
                  </span>
                  <span className="dash-tool-card__action">
                    {t.dashboard.createNew} <ArrowNav size={14} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Quick Stats ─── */}
      <section className="dash-stats">
        <div className="dash-stats__grid">
          <div className="dash-stat-card fx-card fx-card--quiet">
            <div className="dash-stat-card__icon" style={{ background: 'rgba(var(--color-accent-rgb), 0.12)' }}>
              <Zap size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="dash-stat-card__info">
              <span className="dash-stat-card__value">{credits}</span>
              <span className="dash-stat-card__label">{t.dashboard.creditsRemaining}</span>
            </div>
          </div>

          <div className="dash-stat-card fx-card fx-card--quiet">
            <div className="dash-stat-card__icon" style={{ background: 'rgba(var(--color-ocean-rgb), 0.12)' }}>
              <MessageSquare size={20} style={{ color: 'var(--color-ocean)' }} />
            </div>
            <div className="dash-stat-card__info">
              <span className="dash-stat-card__value">{stats.totalCreated}</span>
              <span className="dash-stat-card__label">{t.dashboard.contentCreated}</span>
            </div>
          </div>

          <div className="dash-stat-card fx-card fx-card--quiet">
            <div className="dash-stat-card__icon" style={{ background: 'rgba(var(--color-success-rgb), 0.12)' }}>
              <FolderOpen size={20} style={{ color: 'var(--color-success)' }} />
            </div>
            <div className="dash-stat-card__info">
              <span className="dash-stat-card__value">{stats.totalSaved}</span>
              <span className="dash-stat-card__label">{t.dashboard.savedItems}</span>
            </div>
          </div>

          <div className="dash-stat-card fx-card fx-card--quiet">
            <div className="dash-stat-card__icon" style={{ background: 'rgba(var(--color-primary-rgb), 0.12)' }}>
              <TrendingUp size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="dash-stat-card__info">
              <span className="dash-stat-card__value">{businessName || '—'}</span>
              <span className="dash-stat-card__label">{t.dashboard.currentBrand}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Recent Activity ─── */}
      <section className="dash-activity">
        <h2 className="dash-section-title">{t.dashboard.recentActivity}</h2>
        {activity.length > 0 ? (
          <div className="dash-activity__list">
            {activity.map((item) => {
              const toolTranslationKey = item.type === 'social-post' ? 'socialPost'
                : item.type === 'ad-design' ? 'adDesign'
                : item.type === 'content-ideas' ? 'contentIdeas' : 'campaign';
              const result = mockGeneration.getResult(item.id);
              return (
                <button
                  key={item.id}
                  className="dash-activity__item fx-card fx-card--interactive"
                  onClick={() => navigate(`/app/result/${item.id}`)}
                >
                  <ActivityVisual item={item} result={result} />
                  <div className="dash-activity__item-info">
                    <span className="dash-activity__item-title">{t.tools[toolTranslationKey]?.title}</span>
                    <span className="dash-activity__item-meta">
                      <span lang="en">{t.platforms[item.platform] || item.platform}</span> · {new Date(item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-JO' : 'en-US')}
                    </span>
                  </div>
                  <span className="dash-activity__item-action">
                    {t.dashboard.viewResult} <ArrowNav size={14} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="dash-empty-activity">
            <Sparkles size={32} className="dash-empty-activity__icon" />
            <p>{t.dashboard.noActivity}</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/app/create')}>
              {t.dashboard.createFirst}
            </Button>
          </div>
        )}
      </section>

      {/* ─── Suggested Actions ─── */}
      {businessName && (
        <section className="dash-suggestions">
          <h2 className="dash-section-title">{t.dashboard.suggestedActions}</h2>
          <div className="dash-suggestions__grid">
            <button className="dash-suggestion-card fx-card fx-card--quiet fx-card--interactive" onClick={() => navigate('/app/create/social-post')}>
              <MessageSquare size={20} style={{ color: toolColors.socialPost }} />
              <span>{t.dashboard.suggestPost} {productName || businessName}</span>
            </button>
            <button className="dash-suggestion-card fx-card fx-card--quiet fx-card--interactive" onClick={() => navigate('/app/create/content-ideas')}>
              <Lightbulb size={20} style={{ color: toolColors.contentIdeas }} />
              <span>{t.dashboard.suggestIdeas}</span>
            </button>
            <button className="dash-suggestion-card fx-card fx-card--quiet fx-card--interactive" onClick={() => navigate('/app/create/campaign')}>
              <Calendar size={20} style={{ color: toolColors.campaign }} />
              <span>{t.dashboard.suggestCampaign} {productName || businessName}</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;

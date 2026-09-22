import { useLanguage } from '../../context/LanguageContext';
import { BarChart3, Upload, TrendingUp, Image, Sparkles } from 'lucide-react';

function Analytics() {
  const { t } = useLanguage();

  return (
    <div className="page-enter analytics-page">
      <div className="analytics-header">
        <div>
        <h1 className="analytics-title">
          {t.analytics.title}
        </h1>
        <p className="analytics-subtitle">
          {t.analytics.subtitle}
        </p>
        </div>
        <span className="analytics-coming-badge"><Sparkles size={15} /> {t.common.comingSoon}</span>
      </div>

      <div className="analytics-layout">
        <section className="fx-card fx-card--empty analytics-upload-panel">
          <div className="analytics-upload-icon"><Upload size={32} /></div>
          <h2>{t.analytics.uploadScreenshot}</h2>
          <p>{t.analytics.uploadHint}</p>
          <button className="fx-btn fx-btn--secondary" disabled>
            <Upload size={18} /> {t.common.comingSoon}
          </button>
        </section>

        <section className="fx-card fx-card--result analytics-preview" aria-label="Sample analytics preview">
          <div className="analytics-preview__header">
            <div><BarChart3 size={20} /><strong lang="en">Analytics Preview</strong></div>
            <span>{t.common.comingSoon}</span>
          </div>
          <div className="analytics-metric">
            <span><TrendingUp size={18} /> <span lang="en">Engagement</span></span>
            <strong lang="en">+24%</strong>
          </div>
          <div className="analytics-bars" aria-hidden="true">
            {[38, 62, 48, 82, 68, 92, 76].map((height, index) => (
              <i key={index} style={{ '--bar-height': `${height}%` }} />
            ))}
          </div>
          <div className="analytics-best-post">
            <div className="analytics-best-post__visual"><Image size={24} /></div>
            <div><span lang="en">Best-performing post</span><strong lang="en">1.8K interactions</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Analytics;

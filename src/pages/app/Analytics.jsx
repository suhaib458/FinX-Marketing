import { useLanguage } from '../../context/LanguageContext';
import {
  BarChart3, TrendingUp, Heart, MessageCircle, Send, Eye,
  Sparkles, ArrowUpRight
} from 'lucide-react';

const BAR_VALUES = [58, 76, 64, 84, 48, 69, 55];

function Analytics() {
  const { t, language } = useLanguage();

  const copy = language === 'ar'
    ? {
        preview: 'معاينة احترافية',
        performance: 'أداء المحتوى',
        period7: '7 أيام',
        period30: '30 يوم',
        period90: '90 يوم',
        compared: 'مقارنة بالفترة السابقة',
        interactions: 'تفاعلات',
        reach: 'وصول',
        shares: 'مشاركات',
        comments: 'تعليقات',
        days: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
        insightTitle: 'أفضل أداء هذا الأسبوع',
        insightBody: 'المحتوى البصري المختصر حقق أعلى تفاعل في المعاينة.',
      }
    : {
        preview: 'Premium preview',
        performance: 'Content performance',
        period7: '7 days',
        period30: '30 days',
        period90: '90 days',
        compared: 'vs previous period',
        interactions: 'Interactions',
        reach: 'Reach',
        shares: 'Shares',
        comments: 'Comments',
        days: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        insightTitle: 'Best performance this week',
        insightBody: 'Short visual content reached the strongest engagement in this preview.',
      };

  const metrics = [
    { icon: Heart, value: '1.8K', label: copy.interactions, tone: 'rose' },
    { icon: BarChart3, value: '320', label: copy.reach, tone: 'blue' },
    { icon: Send, value: '12', label: copy.shares, tone: 'violet' },
    { icon: MessageCircle, value: '48', label: copy.comments, tone: 'amber' },
  ];

  return (
    <div className="page-enter analytics-page analytics-page--premium">
      <div className="analytics-header analytics-header--premium">
        <div>
          <h1 className="analytics-title">{t.analytics.title}</h1>
          <p className="analytics-subtitle">{t.analytics.subtitle}</p>
        </div>
        <span className="analytics-coming-badge">
          <Sparkles size={14} />
          {copy.preview}
        </span>
      </div>

      <section className="analytics-performance fx-card">
        <div className="analytics-performance__top">
          <div>
            <span className="analytics-performance__eyebrow">{copy.performance}</span>
            <div className="analytics-trend-row">
              <strong>+24%</strong>
              <span><TrendingUp size={14} /> {copy.compared}</span>
            </div>
          </div>

          <div className="analytics-periods" aria-label={copy.performance}>
            <button type="button" className="analytics-period analytics-period--active">{copy.period7}</button>
            <button type="button" className="analytics-period">{copy.period30}</button>
            <button type="button" className="analytics-period">{copy.period90}</button>
          </div>
        </div>

        <div className="analytics-chart-shell">
          <div className="analytics-chart-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="analytics-premium-bars" aria-label="Analytics preview">
            {BAR_VALUES.map((height, index) => (
              <div className="analytics-premium-bar-wrap" key={copy.days[index]}>
                <div className="analytics-premium-bar-track">
                  <i style={{ '--bar-height': `${height}%`, '--bar-delay': `${index * 45}ms` }} />
                </div>
                <span>{copy.days[index]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-kpi-grid">
          {metrics.map(({ icon: Icon, value, label, tone }) => (
            <div className={`analytics-kpi analytics-kpi--${tone}`} key={label}>
              <div className="analytics-kpi__icon"><Icon size={18} /></div>
              <div>
                <strong lang="en">{value}</strong>
                <span>{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="analytics-insight fx-card fx-card--quiet">
        <div className="analytics-insight__icon"><Eye size={18} /></div>
        <div className="analytics-insight__copy">
          <strong>{copy.insightTitle}</strong>
          <span>{copy.insightBody}</span>
        </div>
        <ArrowUpRight size={18} className="analytics-insight__arrow" />
      </section>
    </div>
  );
}

export default Analytics;

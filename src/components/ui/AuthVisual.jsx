import {
  Sparkles,
  Image as ImageIcon,
  FileText,
  Video,
  CalendarDays,
  Lightbulb,
  Send,
  Heart,
  MessageCircle,
  Bookmark,
  TrendingUp
} from 'lucide-react';

const InstagramIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export default function AuthVisual({ variant = 'default' }) {
  return (
    <aside className={`auth-visual-side auth-visual-side--${variant}`} aria-hidden="true">
      <div className="auth-visual-bg auth-visual-bg--premium" />
      <div className="auth-visual-orbit auth-visual-orbit--one" />
      <div className="auth-visual-orbit auth-visual-orbit--two" />

      <div className="auth-visual-note auth-visual-note--top">
        <span>حوّل أفكارك<br />إلى محتوى مبهر</span>
        <i />
      </div>

      <div className="auth-visual-note auth-visual-note--side">
        <span>تصاميم احترافية<br />في دقائق</span>
        <i>↗</i>
      </div>

      <div className="auth-visual-note auth-visual-note--bottom">
        <span>محتوى يناسب<br />علامتك التجارية</span>
        <i>↳</i>
      </div>

      <div className="auth-showcase">
        <section className="auth-showcase__main-card">
          <div className="auth-showcase__topbar">
            <span className="auth-showcase__credit"><Sparkles size={13} /> 10 رصيد</span>
            <span className="auth-showcase__platform" lang="en">Instagram Post <InstagramIcon size={19} /></span>
          </div>

          <div className="auth-showcase__creative">
            <div className="auth-showcase__creative-copy">
              <span>قهوة</span>
              <strong>بداية يوم أفضل</strong>
              <small>مذاق يلهمك</small>
            </div>

            <div className="auth-coffee-art">
              <div className="auth-coffee-art__steam auth-coffee-art__steam--one" />
              <div className="auth-coffee-art__steam auth-coffee-art__steam--two" />
              <div className="auth-coffee-art__cup">
                <i />
                <span />
              </div>
              <div className="auth-coffee-art__plate" />
              <div className="auth-coffee-art__bean auth-coffee-art__bean--one" />
              <div className="auth-coffee-art__bean auth-coffee-art__bean--two" />
            </div>

            <span className="auth-showcase__brand-tag" lang="en">YOUR<br />BRAND</span>
          </div>

          <div className="auth-showcase__engagement">
            <span><Heart size={16} fill="currentColor" /> 1.2K</span>
            <span><MessageCircle size={16} /> 328</span>
            <span><Send size={16} /></span>
            <span className="auth-showcase__bookmark"><Bookmark size={16} /></span>
          </div>
        </section>

        <section className="auth-showcase__tools">
          {[
            [ImageIcon, 'تصميم'],
            [FileText, 'منشور'],
            [Video, 'فيديو'],
            [CalendarDays, 'حملة'],
            [Lightbulb, 'أفكار'],
          ].map(([Icon, label]) => (
            <span key={label}><Icon size={18} /> {label}</span>
          ))}
        </section>

        <section className="auth-showcase__growth">
          <TrendingUp size={17} />
          <span>نمو التفاعل</span>
          <strong lang="en">+240%</strong>
          <div className="auth-showcase__bars">
            {[32, 50, 71, 92].map((height) => <i key={height} style={{ height: `${height}%` }} />)}
          </div>
        </section>

        <section className="auth-showcase__prompt">
          <Sparkles size={17} />
          <span>اكتب فكرة لمنشور عن القهوة...</span>
          <b><Send size={16} /></b>
        </section>
      </div>

      <div className="auth-visual-dots">
        <i className="is-active" />
        <i />
        <i />
      </div>

      <p className="auth-visual-caption">ابدأ الآن واصنع الفرق <Sparkles size={13} /></p>
    </aside>
  );
}

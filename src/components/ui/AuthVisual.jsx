import { Sparkles, Image as ImageIcon } from 'lucide-react';

const InstagramIcon = ({ size = 24, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function AuthVisual() {
  return (
    <div className="auth-visual-side">
      <div className="auth-visual-bg"></div>
      <div className="auth-visual__content">
        <div className="auth-mock-container">
          {/* Generated Arabic Caption */}
          <div className="auth-mock-card auth-mock-floating-1">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-accent)' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, width: '40%', background: 'var(--color-border)', borderRadius: 3, marginBottom: 6, marginTop: 4 }}></div>
                <div style={{ height: 6, width: '20%', background: 'var(--color-border)', borderRadius: 3 }}></div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text)', lineHeight: 1.6, textAlign: 'start', margin: 0 }} dir="rtl">
              اكتشف مجموعتنا الجديدة من القهوة المختصة المحمصة بعناية. ☕✨
              <br /><br />
              <span style={{ color: 'var(--color-accent)' }}>#قهوة_مختصة #الصباح</span>
            </p>
          </div>

          {/* Main Instagram Ad Design Mock */}
          <div className="auth-mock-card auth-mock-main">
            <div className="auth-mock-badge">
              <Sparkles size={12} />
              جاري الإنشاء
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InstagramIcon size={16} style={{ color: 'var(--color-text-muted)' }} />
                <span lang="en" style={{ fontSize: '12px', fontWeight: 'bold' }}>Instagram Post</span>
              </div>
              <div style={{ background: 'rgba(var(--color-accent-rgb), 0.1)', color: 'var(--color-accent)', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                10 رصيد
              </div>
            </div>
            <div style={{ width: '100%', aspectRatio: '1', background: 'var(--color-background)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(45deg, rgba(var(--brand-primary-rgb), 0.22), rgba(var(--brand-secondary-rgb), 0.36))' }}></div>
              <ImageIcon size={32} style={{ color: 'var(--color-text-muted)', position: 'relative', zIndex: 1 }} />
            </div>
          </div>

          {/* Settings/Controls Mock */}
          <div className="auth-mock-card auth-mock-floating-2">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ height: 28, flex: 1, background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 6 }}></div>
              <div style={{ height: 28, flex: 1, background: 'rgba(var(--color-accent-rgb), 0.1)', border: '1px solid var(--color-accent)', borderRadius: 6 }}></div>
            </div>
            <div style={{ height: 8, width: '100%', background: 'var(--color-border)', borderRadius: 4, marginBottom: 12 }}></div>
            <div style={{ height: 8, width: '70%', background: 'var(--color-border)', borderRadius: 4 }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

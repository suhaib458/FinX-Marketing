import { useEffect, useState } from 'react';

const SPLASH_SESSION_KEY = 'finx-mobile-splash-seen';
const MOBILE_MEDIA_QUERY = '(max-width: 820px)';

function shouldShowMobileSplash() {
  if (typeof window === 'undefined') return false;
  if (!window.matchMedia?.(MOBILE_MEDIA_QUERY).matches) return false;

  try {
    return window.sessionStorage.getItem(SPLASH_SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

export default function MobileSplash() {
  const [visible, setVisible] = useState(shouldShowMobileSplash);

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const fallbackTimer = window.setTimeout(() => {
      try { window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1'); } catch { /* ignore */ }
      setVisible(false);
    }, 12_000);

    return () => {
      window.clearTimeout(fallbackTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  const finish = () => {
    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // Storage can be unavailable in privacy-restricted browser modes.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mobile-splash" aria-hidden="true">
      <video
        className="mobile-splash__video"
        src="/finx-splash-mobile.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}

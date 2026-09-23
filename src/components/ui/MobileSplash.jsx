import { useEffect, useRef, useState } from 'react';

const SPLASH_SESSION_KEY = 'finx-mobile-splash-seen';
const MOBILE_MEDIA_QUERY = '(max-width: 820px)';
const MAX_SPLASH_MS = 5_200;

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
  const [videoReady, setVideoReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef(null);

  const finish = () => {
    if (leaving) return;
    setLeaving(true);

    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
    } catch {
      // Storage can be unavailable in privacy-restricted browser modes.
    }

    window.setTimeout(() => setVisible(false), 260);
  };

  useEffect(() => {
    if (!visible) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const fallbackTimer = window.setTimeout(finish, MAX_SPLASH_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, leaving]);

  useEffect(() => {
    if (!visible || !videoRef.current) return undefined;
    const video = videoRef.current;

    const tryPlay = async () => {
      try {
        await video.play();
      } catch {
        // iOS can delay playback while the video buffer becomes ready.
      }
    };

    tryPlay();
    return undefined;
  }, [visible]);

  if (!visible) return null;

  return (
    <div className={`mobile-splash ${leaving ? 'mobile-splash--leaving' : ''}`} aria-hidden="true">
      <div className="mobile-splash__fallback">
        <div className="mobile-splash__rings" />
        <div className="mobile-splash__brand" lang="en">Fin<span>X</span></div>
      </div>

      <video
        ref={videoRef}
        className={`mobile-splash__video ${videoReady ? 'mobile-splash__video--ready' : ''}`}
        src="/finx-splash-mobile.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setVideoReady(true)}
        onCanPlay={() => setVideoReady(true)}
        onPlaying={() => setVideoReady(true)}
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}

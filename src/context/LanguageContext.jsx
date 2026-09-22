import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ar from '../i18n/ar';
import en from '../i18n/en';

const translations = { ar, en };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('finx-language') || 'ar';
    } catch {
      return 'ar';
    }
  });

  const t = translations[language] || ar;

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      try {
        localStorage.setItem('finx-language', lang);
      } catch {
        // localStorage not available
      }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  // Update document direction and lang attribute
  useEffect(() => {
    const dir = t.dir;
    const lang = t.lang;
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // Update font family
    if (lang === 'ar') {
      document.documentElement.style.setProperty('--font-family', "var(--font-ar)");
    } else {
      document.documentElement.style.setProperty('--font-family', "var(--font-en)");
    }
  }, [t]);

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    dir: t.dir,
    isRTL: t.dir === 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;

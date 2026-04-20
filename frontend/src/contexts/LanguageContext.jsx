import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', native: 'English', dir: 'ltr', voice: 'en-US' },
  hi: { name: 'Hindi', native: 'हिंदी', dir: 'ltr', voice: 'hi-IN' },
  bn: { name: 'Bengali', native: 'বাংলা', dir: 'ltr', voice: 'bn-BD' },
  ta: { name: 'Tamil', native: 'தமிழ்', dir: 'ltr', voice: 'ta-IN' },
  te: { name: 'Telugu', native: 'తెలుగు', dir: 'ltr', voice: 'te-IN' },
  mr: { name: 'Marathi', native: 'मराठी', dir: 'ltr', voice: 'mr-IN' },
  gu: { name: 'Gujarati', native: 'ગુજરાતી', dir: 'ltr', voice: 'gu-IN' },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', dir: 'ltr', voice: 'pa-IN' },
  ml: { name: 'Malayalam', native: 'മലയാളം', dir: 'ltr', voice: 'ml-IN' },
  es: { name: 'Spanish', native: 'Español', dir: 'ltr', voice: 'es-ES' },
  pt: { name: 'Portuguese', native: 'Português', dir: 'ltr', voice: 'pt-BR' },
  id: { name: 'Indonesian', native: 'Bahasa Indonesia', dir: 'ltr', voice: 'id-ID' },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('smartfarm_language') || 'en';
  });
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTranslations(language);
  }, [language]);

  const loadTranslations = async (lang) => {
    setLoading(true);
    try {
      const trans = await import(`../translations/${lang}.json`);
      setTranslations(trans.default || trans);
    } catch (err) {
      try {
        const trans = await import('../translations/en.json');
        setTranslations(trans.default || trans);
        console.warn(`Failed to load ${lang}, falling back to English`);
      } catch {
        setTranslations({});
      }
    }
    setLoading(false);
  };

  const changeLanguage = (lang) => {
    if (SUPPORTED_LANGUAGES[lang]) {
      setLanguage(lang);
      localStorage.setItem('smartfarm_language', lang);
    }
  };

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    return typeof value === 'string' ? value : fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      changeLanguage,
      t,
      loading,
      supportedLanguages: SUPPORTED_LANGUAGES,
      voiceCode: SUPPORTED_LANGUAGES[language]?.voice || 'en-US',
    }}>
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
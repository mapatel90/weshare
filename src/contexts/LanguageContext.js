'use client'
import React, { createContext, useState, useContext, useEffect } from 'react';

// Import translation files
import enTranslations from '@/translations/en.json';
import viTranslations from '@/translations/vi.json';

// Default context value for when provider is not mounted
const defaultLanguageValue = {
  currentLanguage: 'en',
  changeLanguage: () => {},
  lang: (key, def = key) => def ?? key,
  languages: {},
  currentLanguageInfo: null
};

const LanguageContext = createContext(defaultLanguageValue);

// Available languages
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    flag: '/images/flags/4x3/us.svg'
  },
  vi: {
    code: 'vi', 
    name: 'Tiếng Việt',
    flag: '/images/flags/4x3/vn.svg'
  }
};

// Translation data
const translations = {
  en: enTranslations,
  vi: viTranslations
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  // Load saved language from localStorage on initialization
  useEffect(() => {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && LANGUAGES[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage when changed
  const changeLanguage = (languageCode) => {
    if (LANGUAGES[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('selectedLanguage', languageCode);
      
      // Update HTML lang attribute
      document.documentElement.lang = languageCode;
    }
  };

  // Get translation for a given key
  const lang = (key, defaultValue = key) => {
    const keys = key.split('.');
    let translation = translations[currentLanguage];
    
    for (const k of keys) {
      if (translation && translation[k]) {
        translation = translation[k];
      } else {
        // Fallback to English if translation not found
        translation = translations.en;
        for (const fallbackKey of keys) {
          if (translation && translation[fallbackKey]) {
            translation = translation[fallbackKey];
          } else {
            return defaultValue;
          }
        }
        break;
      }
    }
    
    return typeof translation === 'string' ? translation : defaultValue;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    lang,
    languages: LANGUAGES,
    currentLanguageInfo: LANGUAGES[currentLanguage]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if provider is not mounted (prevents runtime crashes)
    return {
      currentLanguage: 'en',
      changeLanguage: () => {},
      lang: (key, def = key) => def ?? key,
      languages: LANGUAGES,
      currentLanguageInfo: LANGUAGES['en']
    };
  }
  return context;
};

export default LanguageContext;
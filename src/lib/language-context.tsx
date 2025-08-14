'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, Translations, getTranslation } from './translations';

interface LanguageContextType {
  language: Language;
  translations: Translations;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'shelf-language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>(getTranslation('en'));

  // Load language from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (stored && (stored === 'en' || stored === 'zh')) {
        const storedLang = stored as Language;
        setLanguageState(storedLang);
        setTranslations(getTranslation(storedLang));
      } else {
        // Try to detect browser language
        const browserLang = navigator.language.toLowerCase();
        const detectedLang: Language = browserLang.startsWith('zh') ? 'zh' : 'en';
        setLanguageState(detectedLang);
        setTranslations(getTranslation(detectedLang));
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
      // Fallback to English
      setLanguageState('en');
      setTranslations(getTranslation('en'));
    }
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setTranslations(getTranslation(newLanguage));
    
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const contextValue: LanguageContextType = {
    language,
    translations,
    setLanguage,
    t: translations, // Short alias for translations
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenience hook to get just the translations
export function useTranslations() {
  const { translations } = useLanguage();
  return translations;
}
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import es from './locales/es.json';
import fr from './locales/fr.json';

const savedLanguage = localStorage.getItem('language') || 'ko';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
    zh: { translation: zh },
    ja: { translation: ja },
    es: { translation: es },
    fr: { translation: fr },
  },
  lng: savedLanguage,
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;

import { create } from 'zustand';
import i18n from '@/i18n';

type Theme = 'light' | 'dark';

type SettingsState = {
  theme: Theme;
  language: string;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: string) => void;
};

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

function applyLanguage(lang: string) {
  document.documentElement.setAttribute('lang', lang);
  localStorage.setItem('language', lang);
}

const savedTheme = (localStorage.getItem('theme') as Theme) || 'light';
const savedLanguage = localStorage.getItem('language') || 'ko';
applyTheme(savedTheme);
applyLanguage(savedLanguage);

export const useSettingsStore = create<SettingsState>(() => ({
  theme: savedTheme,
  language: savedLanguage,
  setTheme: (theme) => {
    applyTheme(theme);
    useSettingsStore.setState({ theme });
  },
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    applyLanguage(lang);
    useSettingsStore.setState({ language: lang });
  },
}));

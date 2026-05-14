import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ListTodo, Tag, User, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ROUTES } from '@/constants';
import './Header.css';

const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
];

export default function Header() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { theme, language, setTheme, setLanguage } = useSettingsStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="header">
      <Link to={ROUTES.TODOS} className="header-logo">
        ☑ TodoList
      </Link>
      <nav className="header-nav">
        <NavLink
          to={ROUTES.TODOS}
          className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
        >
          <ListTodo size={16} className="header-nav-icon" aria-hidden="true" />
          <span className="header-nav-text">{t('nav.todos')}</span>
        </NavLink>
        <NavLink
          to={ROUTES.CATEGORIES}
          className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
        >
          <Tag size={16} className="header-nav-icon" aria-hidden="true" />
          <span className="header-nav-text">{t('nav.categories')}</span>
        </NavLink>
      </nav>

      <div className="header-controls">
        <button
          className="header-theme-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={t('settings.darkMode')}
          title={t('settings.darkMode')}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <select
          className="header-lang-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          aria-label={t('settings.language')}
          title={t('settings.language')}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div className="header-user">
        <button className="header-user-btn" onClick={() => setDropdownOpen((v) => !v)}>
          <User size={16} className="header-user-icon" aria-hidden="true" />
          <span className="header-user-name">{user?.name}</span>
        </button>
        {dropdownOpen && (
          <div className="header-dropdown">
            <Link
              to={ROUTES.PROFILE}
              className="header-dropdown-item"
              onClick={() => setDropdownOpen(false)}
            >
              {t('nav.editProfile')}
            </Link>
            <button className="header-dropdown-item danger" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

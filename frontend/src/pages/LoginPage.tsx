import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLogin } from '@/features/auth/hooks/useLogin';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { ROUTES } from '@/constants/routes';
import './LoginPage.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const login = useLogin();

  function getApiErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401) return t('login.error.invalid');
    return t('login.error.failed');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    if (!email || !email.includes('@')) {
      setValidationError(t('login.validation.email'));
      return;
    }
    if (!password) {
      setValidationError(t('login.validation.password'));
      return;
    }

    login.mutate({ email, password });
  }

  const errorMessage = validationError || (login.error ? getApiErrorMessage(login.error) : '');

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('login.title')}</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label={t('login.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
          />
          <Input
            label={t('login.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('login.passwordPlaceholder')}
          />
          {errorMessage && <p className="auth-error">{errorMessage}</p>}
          <Button type="submit" variant="primary" isLoading={login.isPending}>
            {t('login.submit')}
          </Button>
        </form>
        <p className="auth-link">
          {t('login.noAccount')} <Link to={ROUTES.SIGNUP}>{t('login.signupLink')}</Link>
        </p>
      </div>
    </div>
  );
}

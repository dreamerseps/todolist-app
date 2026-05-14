import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSignup } from '@/features/auth/hooks/useSignup';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import { ROUTES } from '@/constants/routes';
import './SignupPage.css';

export default function SignupPage() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signup = useSignup();

  function getApiErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 409) return '__email_conflict__';
    return t('signup.error.failed');
  }

  function validate(): Record<string, string> {
    const newErrors: Record<string, string> = {};
    if (!name) newErrors.name = t('signup.validation.name');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = t('signup.validation.email');
    if (password.length < 8) newErrors.password = t('signup.validation.passwordLength');
    if (password !== passwordConfirm) newErrors.passwordConfirm = t('signup.validation.passwordMatch');
    return newErrors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    signup.mutate({ name, email, password });
  }

  const apiMessage = signup.error ? getApiErrorMessage(signup.error) : '';
  const emailError =
    errors.email || (apiMessage === '__email_conflict__' ? t('signup.error.emailConflict') : '');
  const generalApiError = apiMessage && apiMessage !== '__email_conflict__' ? apiMessage : '';

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{t('signup.title')}</h1>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            label={t('signup.name')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('signup.namePlaceholder')}
            error={errors.name}
          />
          <Input
            label={t('signup.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            error={emailError}
          />
          <Input
            label={t('signup.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('signup.passwordPlaceholder')}
            error={errors.password}
          />
          <Input
            label={t('signup.passwordConfirm')}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder={t('signup.passwordConfirmPlaceholder')}
            error={errors.passwordConfirm}
          />
          {generalApiError && <p className="auth-error">{generalApiError}</p>}
          <Button type="submit" variant="primary" isLoading={signup.isPending}>
            {t('signup.submit')}
          </Button>
        </form>
        <p className="auth-link">
          {t('signup.hasAccount')} <Link to={ROUTES.LOGIN}>{t('signup.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}

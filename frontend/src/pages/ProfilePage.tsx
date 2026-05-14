import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/Header';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import Spinner from '@/components/Spinner/Spinner';
import { useGetProfile } from '@/features/profile/hooks/useGetProfile';
import { useUpdateProfile } from '@/features/profile/hooks/useUpdateProfile';
import { useChangePassword } from '@/features/profile/hooks/useChangePassword';
import { MIN_PASSWORD_LENGTH } from '@/constants/defaults';
import './ProfilePage.css';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useGetProfile();

  const [name, setName] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  if (profile && !nameInitialized) {
    setName(profile.name);
    setNameInitialized(true);
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    updateProfile.mutate(name.trim());
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!currentPassword) errors.currentPassword = t('profile.validation.currentPassword');
    if (newPassword.length < MIN_PASSWORD_LENGTH)
      errors.newPassword = t('profile.validation.newPasswordLength', { count: MIN_PASSWORD_LENGTH });
    if (newPassword !== confirmPassword) errors.confirmPassword = t('profile.validation.passwordMatch');
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }
    setPwErrors({});
    changePassword.mutate(
      { current_password: currentPassword, new_password: newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      },
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="profile-page">
          <h1>{t('profile.title')}</h1>
          <Spinner />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="profile-page">
        <h1>{t('profile.title')}</h1>

        <section className="profile-section">
          <h2>{t('profile.basicInfo')}</h2>
          <form onSubmit={handleNameSubmit} noValidate>
            <Input
              label={t('profile.email')}
              type="email"
              value={profile?.email ?? ''}
              disabled
              readOnly
            />
            <p className="profile-hint">{t('profile.emailHint')}</p>
            <Input
              label={t('profile.name')}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('profile.namePlaceholder')}
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfile.isPending}
              disabled={!name.trim()}
            >
              {t('profile.saveName')}
            </Button>
          </form>
        </section>

        <section className="profile-section">
          <h2>{t('profile.changePassword')}</h2>
          <form onSubmit={handlePasswordSubmit} noValidate>
            <Input
              label={t('profile.currentPassword')}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t('profile.currentPasswordPlaceholder')}
              error={pwErrors.currentPassword}
            />
            <Input
              label={t('profile.newPassword')}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('profile.newPasswordPlaceholder')}
              error={pwErrors.newPassword}
            />
            <Input
              label={t('profile.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('profile.confirmPasswordPlaceholder')}
              error={pwErrors.confirmPassword}
            />
            <Button
              type="submit"
              variant="primary"
              isLoading={changePassword.isPending}
            >
              {t('profile.changePasswordBtn')}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}

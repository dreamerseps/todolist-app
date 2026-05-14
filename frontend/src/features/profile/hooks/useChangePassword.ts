import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/users.api';
import { useUiStore } from '@/stores/uiStore';

export function useChangePassword() {
  const { t } = useTranslation();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({
      current_password,
      new_password,
    }: {
      current_password: string;
      new_password: string;
    }) => usersApi.updateMe({ current_password, new_password }),
    onSuccess: () => {
      showToast('success', t('toast.profile.passwordChanged'));
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        showToast('error', t('toast.profile.passwordWrong'));
      } else {
        showToast('error', t('toast.profile.passwordChangeFailed'));
      }
    },
  });
}

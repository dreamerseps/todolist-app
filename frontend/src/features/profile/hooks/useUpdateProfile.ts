import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '@/api/users.api';
import { queryKeys } from '@/api/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useUiStore } from '@/stores/uiStore';

export function useUpdateProfile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (name: string) => usersApi.updateMe({ name }),
    onSuccess: (response) => {
      const updatedUser = response.data.data!;
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      showToast('success', t('toast.profile.nameUpdated'));
    },
    onError: () => {
      showToast('error', t('toast.profile.nameUpdateFailed'));
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesApi } from '@/api/categories.api';
import { queryKeys } from '@/api/queryKeys';
import { useUiStore } from '@/stores/uiStore';

export function useDeleteCategory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      showToast('success', t('toast.category.deleted'));
    },
    onError: (error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 422) {
        showToast('error', t('toast.category.deleteForbidden'));
      } else {
        showToast('error', t('toast.category.deleteFailed'));
      }
    },
  });
}

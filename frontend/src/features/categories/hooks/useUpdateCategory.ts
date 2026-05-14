import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesApi } from '@/api/categories.api';
import { queryKeys } from '@/api/queryKeys';
import { useUiStore } from '@/stores/uiStore';
import type { CategoryUpdateRequest } from '@/types';

export function useUpdateCategory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CategoryUpdateRequest }) =>
      categoriesApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      showToast('success', t('toast.category.updated'));
    },
    onError: () => {
      showToast('error', t('toast.category.updateFailed'));
    },
  });
}

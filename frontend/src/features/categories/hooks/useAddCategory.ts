import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { categoriesApi } from '@/api/categories.api';
import { queryKeys } from '@/api/queryKeys';
import { useUiStore } from '@/stores/uiStore';
import type { CategoryCreateRequest } from '@/types';

export function useAddCategory() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: CategoryCreateRequest) => categoriesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
      showToast('success', t('toast.category.added'));
    },
    onError: () => {
      showToast('error', t('toast.category.addFailed'));
    },
  });
}

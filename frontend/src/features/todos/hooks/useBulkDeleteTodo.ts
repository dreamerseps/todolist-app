import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosApi } from '@/api/todos.api';
import { useUiStore } from '@/stores/uiStore';

export function useBulkDeleteTodo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (ids: string[]) => todosApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('success', t('toast.todo.bulkDeleted', { count: ids.length }));
    },
    onError: () => {
      showToast('error', t('toast.todo.bulkDeleteFailed'));
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosApi } from '@/api/todos.api';
import { useUiStore } from '@/stores/uiStore';

export function useDeleteTodo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id: string) => todosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('success', t('toast.todo.deleted'));
    },
    onError: () => {
      showToast('error', t('toast.todo.deleteFailed'));
    },
  });
}

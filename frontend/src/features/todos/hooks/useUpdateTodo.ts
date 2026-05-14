import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosApi } from '@/api/todos.api';
import { useUiStore } from '@/stores/uiStore';
import type { TodoUpdateRequest } from '@/types';

export function useUpdateTodo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TodoUpdateRequest }) =>
      todosApi.update(id, body),
    onSuccess: (_, { body }) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      if ('is_completed' in body) return;
      showToast('success', t('toast.todo.updated'));
    },
    onError: () => {
      showToast('error', t('toast.todo.updateFailed'));
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosApi } from '@/api/todos.api';
import { useUiStore } from '@/stores/uiStore';
import type { TodoCreateRequest } from '@/types';

export function useAddTodo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (body: TodoCreateRequest) => todosApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('success', t('toast.todo.added'));
    },
    onError: () => {
      showToast('error', t('toast.todo.addFailed'));
    },
  });
}

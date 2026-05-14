import { useTranslation } from 'react-i18next';
import type { TodoFilter } from '@/types';
import Select from '@/components/Select/Select';

type TodoSortOptionsProps = {
  sort?: TodoFilter['sort'];
  onSortChange: (sort: TodoFilter['sort']) => void;
};

export default function TodoSortOptions({ sort, onSortChange }: TodoSortOptionsProps) {
  const { t } = useTranslation();

  const SORT_OPTIONS = [
    { value: 'created_at', label: t('todos.sort.createdAt') },
    { value: 'due_date', label: t('todos.sort.dueDate') },
  ];

  return (
    <Select
      options={SORT_OPTIONS}
      value={sort ?? 'created_at'}
      onChange={(v) => onSortChange((v as TodoFilter['sort']) || undefined)}
      aria-label={t('settings.language')}
    />
  );
}

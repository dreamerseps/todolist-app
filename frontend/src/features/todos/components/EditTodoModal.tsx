import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Modal/Modal';
import Input from '@/components/Input/Input';
import Select from '@/components/Select/Select';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Category, TodoItem, TodoUpdateRequest } from '@/types';

type EditTodoModalProps = {
  todo: TodoItem;
  categories: Category[];
  onConfirm: (data: TodoUpdateRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

function toDatetimeLocal(value: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00`;
  return value.slice(0, 16);
}

export default function EditTodoModal({ todo, categories, onConfirm, onCancel, isLoading }: EditTodoModalProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const [title, setTitle] = useState(todo.title);
  const [categoryId, setCategoryId] = useState(todo.category_id);
  const [description, setDescription] = useState(todo.description ?? '');
  const [dueDate, setDueDate] = useState(toDatetimeLocal(todo.due_date));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  function handleConfirm() {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = t('addTodo.validation.title');
    if (!categoryId) newErrors.category_id = t('addTodo.validation.category');
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onConfirm({
      title: title.trim(),
      category_id: categoryId,
      description: description.trim() || null,
      due_date: dueDate || null,
    });
  }

  return (
    <Modal
      title={t('editTodo.title')}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmLabel={t('editTodo.confirm')}
      isLoading={isLoading}
    >
      <Input
        label={t('addTodo.titleLabel')}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('addTodo.titlePlaceholder')}
        error={errors.title}
      />
      <Select
        label={t('addTodo.category')}
        options={categoryOptions}
        placeholder={t('addTodo.categoryPlaceholder')}
        value={categoryId}
        onChange={(v) => setCategoryId(v)}
        error={errors.category_id}
      />
      <Input
        label={t('addTodo.description')}
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t('addTodo.descriptionPlaceholder')}
      />
      <Input
        label={t('addTodo.dueDate')}
        type="datetime-local"
        lang={language}
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
    </Modal>
  );
}

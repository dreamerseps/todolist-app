import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/Modal/Modal';
import Input from '@/components/Input/Input';
import Select from '@/components/Select/Select';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Category } from '@/types';

type AddTodoModalProps = {
  categories: Category[];
  onConfirm: (data: { title: string; category_id: string; description?: string; due_date?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function AddTodoModal({ categories, onConfirm, onCancel, isLoading }: AddTodoModalProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
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
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
    });
  }

  return (
    <Modal
      title={t('addTodo.title')}
      onConfirm={handleConfirm}
      onCancel={onCancel}
      confirmLabel={t('addTodo.confirm')}
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

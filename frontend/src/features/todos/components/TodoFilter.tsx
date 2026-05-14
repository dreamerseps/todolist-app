import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Category, TodoFilter as TodoFilterType } from '@/types';
import Select from '@/components/Select/Select';
import Button from '@/components/Button/Button';
import { useSettingsStore } from '@/stores/settingsStore';
import './TodoFilter.css';

type CompletionStatus = 'all' | 'completed' | 'incomplete';

type TodoFilterProps = {
  filter: TodoFilterType;
  categories: Category[];
  onFilterChange: (updates: Partial<TodoFilterType>) => void;
  onReset: () => void;
};

export default function TodoFilter({
  filter,
  categories,
  onFilterChange,
  onReset,
}: TodoFilterProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const [isOpen, setIsOpen] = useState(true);

  const COMPLETION_OPTIONS: { value: CompletionStatus; label: string }[] = [
    { value: 'all', label: t('filter.completion.all') },
    { value: 'completed', label: t('filter.completion.completed') },
    { value: 'incomplete', label: t('filter.completion.incomplete') },
  ];

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  const completionStatus: CompletionStatus =
    filter.is_completed === true
      ? 'completed'
      : filter.is_completed === false
        ? 'incomplete'
        : 'all';

  function handleCompletionChange(status: CompletionStatus) {
    if (status === 'all') onFilterChange({ is_completed: undefined });
    else if (status === 'completed') onFilterChange({ is_completed: true });
    else onFilterChange({ is_completed: false });
  }

  const hasActiveFilter =
    !!filter.category_id ||
    !!filter.from ||
    !!filter.to ||
    filter.is_completed !== undefined;

  return (
    <div className="todo-filter">
      <button
        type="button"
        className="todo-filter-toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={t('filter.aria.toggle')}
      >
        {t('filter.toggle')} {hasActiveFilter ? '●' : '○'}
        <span className="todo-filter-toggle-icon">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="todo-filter-row">
          <Select
            options={categoryOptions}
            placeholder={t('filter.categoryAll')}
            value={filter.category_id ?? ''}
            onChange={(v) => onFilterChange({ category_id: v || undefined })}
          />

          <div className="todo-filter-date">
            <input
              type="date"
              lang={language}
              className="todo-filter-date-input"
              value={filter.from ?? ''}
              onChange={(e) => onFilterChange({ from: e.target.value || undefined })}
              aria-label={t('filter.aria.startDate')}
            />
            <span className="todo-filter-date-sep">~</span>
            <input
              type="date"
              lang={language}
              className="todo-filter-date-input"
              value={filter.to ?? ''}
              onChange={(e) => onFilterChange({ to: e.target.value || undefined })}
              aria-label={t('filter.aria.endDate')}
            />
          </div>

          <div className="todo-filter-completion" role="group" aria-label={t('filter.aria.completion')}>
            {COMPLETION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`todo-filter-tab ${completionStatus === opt.value ? 'active' : ''}`}
                onClick={() => handleCompletionChange(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {hasActiveFilter && (
            <Button variant="secondary" size="sm" onClick={onReset}>
              {t('common.reset')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

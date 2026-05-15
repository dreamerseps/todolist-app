import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TodoItem as TodoItemType } from '@/types';
import './TodoItem.css';

function formatDueDate(value: string | null, noneLabel: string): string {
  if (!value) return noneLabel;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const timePart = value.slice(11, 16);
  const datePart = value.slice(0, 10);
  return timePart === '00:00' ? datePart : `${datePart} ${timePart}`;
}

type TodoItemProps = {
  todo: TodoItemType;
  categoryName?: string;
  categoryIndex?: number;
  onToggle?: (id: string, isCompleted: boolean) => void;
  onEdit?: (todo: TodoItemType) => void;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
};

export default function TodoItem({
  todo,
  categoryName,
  categoryIndex,
  onToggle,
  onEdit,
  onDelete,
  isSelected,
  onToggleSelect,
}: TodoItemProps) {
  const { t } = useTranslation();

  const badgeClass =
    categoryIndex !== undefined
      ? `category-badge category-badge-${(categoryIndex % 5) + 1}`
      : 'category-badge category-badge-1';

  return (
    <div className={`todo-item${todo.is_completed ? ' completed' : ''}${isSelected ? ' selected' : ''}`}>
      {onToggleSelect !== undefined && (
        <input
          type="checkbox"
          className="todo-select-checkbox"
          checked={isSelected ?? false}
          onChange={() => onToggleSelect(todo.id)}
          aria-label={t('todos.select')}
        />
      )}
      <button
        className={`todo-checkbox${todo.is_completed ? ' checked' : ''}`}
        onClick={() => onToggle?.(todo.id, !todo.is_completed)}
        aria-label={todo.is_completed ? t('common.uncomplete') : t('common.complete')}
      />
      <div className="todo-content">
        <span className={`todo-title${todo.is_completed ? ' completed' : ''}`}>
          {todo.title}
        </span>
        <div className="todo-meta">
          {categoryName && (
            <span className={badgeClass}>{categoryName}</span>
          )}
          <span className="todo-due-date">
            {formatDueDate(todo.due_date, t('todos.dueDate.none'))}
          </span>
        </div>
      </div>
      <div className="todo-actions">
        <button
          className="todo-action-btn"
          onClick={() => onEdit?.(todo)}
          aria-label={t('common.edit')}
        >
          <Pencil size={14} />
        </button>
        <button
          className="todo-action-btn danger"
          onClick={() => onDelete?.(todo.id)}
          aria-label={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

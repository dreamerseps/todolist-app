import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/Header';
import Button from '@/components/Button/Button';
import Spinner from '@/components/Spinner/Spinner';
import Modal from '@/components/Modal/Modal';
import TodoList from '@/features/todos/components/TodoList';
import TodoFilter from '@/features/todos/components/TodoFilter';
import TodoSortOptions from '@/features/todos/components/TodoSortOptions';
import TodoPagination from '@/features/todos/components/TodoPagination';
import AddTodoModal from '@/features/todos/components/AddTodoModal';
import EditTodoModal from '@/features/todos/components/EditTodoModal';
import { useFetchTodos } from '@/features/todos/hooks/useFetchTodos';
import { useTodoFilter } from '@/features/todos/hooks/useTodoFilter';
import { useAddTodo } from '@/features/todos/hooks/useAddTodo';
import { useUpdateTodo } from '@/features/todos/hooks/useUpdateTodo';
import { useDeleteTodo } from '@/features/todos/hooks/useDeleteTodo';
import { useBulkDeleteTodo } from '@/features/todos/hooks/useBulkDeleteTodo';
import { useFetchCategories } from '@/features/categories/hooks/useFetchCategories';
import type { TodoItem } from '@/types';
import './TodosPage.css';

export default function TodosPage() {
  const { t } = useTranslation();
  const { filter, setFilter, resetFilter } = useTodoFilter();
  const { data, isLoading, isError } = useFetchTodos(filter);
  const { data: categories = [] } = useFetchCategories();

  const addTodo = useAddTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const bulkDeleteTodo = useBulkDeleteTodo();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const todos = data?.todos ?? [];
  const pagination = data?.pagination;

  function handleToggle(id: string, isCompleted: boolean) {
    updateTodo.mutate({ id, body: { is_completed: isCompleted } });
  }

  function handleAddConfirm(formData: Parameters<typeof addTodo.mutate>[0]) {
    addTodo.mutate(formData, { onSuccess: () => setShowAddModal(false) });
  }

  function handleEditConfirm(formData: Parameters<typeof updateTodo.mutate>[0]['body']) {
    if (!editingTodo) return;
    updateTodo.mutate(
      { id: editingTodo.id, body: formData },
      { onSuccess: () => setEditingTodo(null) },
    );
  }

  function handleDeleteConfirm() {
    if (!deletingTodoId) return;
    deleteTodo.mutate(deletingTodoId, { onSuccess: () => setDeletingTodoId(null) });
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(todos.map((t) => t.id)) : new Set());
  }

  function handleBulkDeleteConfirm() {
    const ids = Array.from(selectedIds);
    bulkDeleteTodo.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
      },
    });
  }

  return (
    <>
      <Header />
      <main className="todos-page">
        <div className="todos-header">
          <h1>{t('todos.title')}</h1>
          <div className="todos-header-actions">
            <TodoSortOptions
              sort={filter.sort}
              onSortChange={(sort) => setFilter({ sort })}
            />
            <Button variant="primary" onClick={() => setShowAddModal(true)}>{t('todos.addBtn')}</Button>
          </div>
        </div>

        <TodoFilter
          filter={filter}
          categories={categories}
          onFilterChange={setFilter}
          onReset={resetFilter}
        />

        {isLoading && <Spinner />}

        {isError && (
          <p className="error-message">{t('todos.error')}</p>
        )}

        {!isLoading && !isError && todos.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">&#10003;</span>
            <p className="empty-state-title">{t('todos.empty')}</p>
          </div>
        )}

        {todos.length > 0 && (
          <>
            <div className="bulk-toolbar">
              <label className="bulk-select-all">
                <input
                  type="checkbox"
                  checked={selectedIds.size === todos.length && todos.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
                {t('todos.selectAll')}
              </label>
              {selectedIds.size > 0 && (
                <Button variant="secondary" onClick={() => setShowBulkDeleteModal(true)}>
                  {t('todos.deleteSelected', { count: selectedIds.size })}
                </Button>
              )}
            </div>
            <TodoList
              todos={todos}
              categories={categories}
              onToggle={handleToggle}
              onEdit={(todo) => setEditingTodo(todo)}
              onDelete={(id) => setDeletingTodoId(id)}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          </>
        )}

        {pagination && (
          <TodoPagination
            page={filter.page ?? 1}
            totalPages={pagination.total_pages}
            onPageChange={(page) => setFilter({ page })}
          />
        )}
      </main>

      {showAddModal && (
        <AddTodoModal
          categories={categories}
          onConfirm={handleAddConfirm}
          onCancel={() => setShowAddModal(false)}
          isLoading={addTodo.isPending}
        />
      )}

      {editingTodo && (
        <EditTodoModal
          todo={editingTodo}
          categories={categories}
          onConfirm={handleEditConfirm}
          onCancel={() => setEditingTodo(null)}
          isLoading={updateTodo.isPending}
        />
      )}

      {deletingTodoId && (
        <Modal
          title={t('todos.delete.title')}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingTodoId(null)}
          isLoading={deleteTodo.isPending}
        >
          <p>{t('todos.delete.confirm')}</p>
        </Modal>
      )}

      {showBulkDeleteModal && (
        <Modal
          title={t('todos.bulkDelete.title')}
          onConfirm={handleBulkDeleteConfirm}
          onCancel={() => setShowBulkDeleteModal(false)}
          isLoading={bulkDeleteTodo.isPending}
        >
          <p>{t('todos.bulkDelete.confirm', { count: selectedIds.size })}</p>
        </Modal>
      )}
    </>
  );
}

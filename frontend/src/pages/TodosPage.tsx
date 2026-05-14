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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<string | null>(null);

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
          <TodoList
            todos={todos}
            categories={categories}
            onToggle={handleToggle}
            onEdit={(todo) => setEditingTodo(todo)}
            onDelete={(id) => setDeletingTodoId(id)}
          />
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
    </>
  );
}

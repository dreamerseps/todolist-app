import type { TodoItem as TodoItemType, Category } from '@/types';
import TodoItem from './TodoItem';
import './TodoList.css';

type TodoListProps = {
  todos: TodoItemType[];
  categories?: Category[];
  onToggle?: (id: string, isCompleted: boolean) => void;
  onEdit?: (todo: TodoItemType) => void;
  onDelete?: (id: string) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
};

export default function TodoList({
  todos,
  categories = [],
  onToggle,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
}: TodoListProps) {
  return (
    <div className="todo-list">
      {todos.map((todo) => {
        const categoryIndex = categories.findIndex((c) => c.id === todo.category_id);
        const category = categoryIndex >= 0 ? categories[categoryIndex] : undefined;
        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            categoryName={category?.name}
            categoryIndex={categoryIndex >= 0 ? categoryIndex : undefined}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            isSelected={selectedIds?.has(todo.id)}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </div>
  );
}

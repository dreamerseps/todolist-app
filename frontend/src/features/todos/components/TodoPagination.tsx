import Button from '@/components/Button/Button';
import './TodoPagination.css';

type TodoPaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function TodoPagination({ page, totalPages, onPageChange }: TodoPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="todo-pagination">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>
      <span className="todo-pagination-info">
        <strong>{page}</strong> / {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </div>
  );
}

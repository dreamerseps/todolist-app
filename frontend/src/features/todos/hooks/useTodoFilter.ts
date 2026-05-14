import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TodoFilter } from '@/types';

export function useTodoFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter: TodoFilter = {
    category_id: searchParams.get('category_id') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    is_completed:
      searchParams.get('is_completed') === 'true'
        ? true
        : searchParams.get('is_completed') === 'false'
          ? false
          : undefined,
    sort: (searchParams.get('sort') as TodoFilter['sort']) ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
  };

  const setFilter = useCallback(
    (updates: Partial<TodoFilter>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        if ('page' in updates) {
          const p = updates.page;
          if (p && p > 1) next.set('page', String(p));
          else next.delete('page');
        }

        if ('category_id' in updates) {
          if (updates.category_id) next.set('category_id', updates.category_id);
          else next.delete('category_id');
        }

        if ('from' in updates) {
          if (updates.from) next.set('from', updates.from);
          else next.delete('from');
        }

        if ('to' in updates) {
          if (updates.to) next.set('to', updates.to);
          else next.delete('to');
        }

        if ('is_completed' in updates) {
          if (updates.is_completed === true) next.set('is_completed', 'true');
          else if (updates.is_completed === false) next.set('is_completed', 'false');
          else next.delete('is_completed');
        }

        if ('sort' in updates) {
          if (updates.sort) next.set('sort', updates.sort);
          else next.delete('sort');
        }

        if (!('page' in updates)) {
          next.delete('page');
        }

        return next;
      });
    },
    [setSearchParams],
  );

  const resetFilter = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { filter, setFilter, resetFilter };
}

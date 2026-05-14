import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categories.api';
import { queryKeys } from '@/api/queryKeys';

export function useFetchCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data } = await categoriesApi.getAll();
      return data.data ?? [];
    },
  });
}

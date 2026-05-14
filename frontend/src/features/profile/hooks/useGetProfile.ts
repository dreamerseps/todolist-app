import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/api/users.api';
import { queryKeys } from '@/api/queryKeys';

export function useGetProfile() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const { data } = await usersApi.getMe();
      return data.data!;
    },
  });
}

import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: { email: string; password: string }) => authApi.login(body),
    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data.data!;
      setAuth(access_token, refresh_token, user);
      navigate(ROUTES.TODOS);
    },
  });
}

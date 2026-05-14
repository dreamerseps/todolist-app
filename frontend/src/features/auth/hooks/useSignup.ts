import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { ROUTES } from '@/constants/routes';

export function useSignup() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (body: { email: string; password: string; name: string }) =>
      authApi.register(body),
    onSuccess: () => {
      navigate(ROUTES.LOGIN);
    },
  });
}

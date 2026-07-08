import { useMutation } from '@tanstack/react-query';
import { api } from '../api';
import { useAuthStore } from '../authStore';
import { uploadFile } from './useStorage';

export function useUpdateAvatar() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadFile(file, 'avatars');
      const updated = await api.patch<typeof user>('/users/me', { avatarUrl: url });
      return updated;
    },
    onSuccess: (updated) => {
      if (user && accessToken) {
        setAuth({ ...user, ...updated }, accessToken);
      }
    },
  });
}

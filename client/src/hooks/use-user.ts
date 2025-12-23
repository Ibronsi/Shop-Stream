import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { api } from '@shared/routes';
import { useCurrentUser } from './use-auth';

export function useMyOrders() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ['/api/users', currentUser?.id, 'orders'],
    enabled: !!currentUser,
  });
}

export function useUpdateProfile() {
  const { data: currentUser } = useCurrentUser();
  return useMutation({
    mutationFn: async (updates: { name?: string; email?: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      return apiRequest(
        api.user.updateProfile.path.replace(':userId', String(currentUser.id)),
        'PATCH',
        updates
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', currentUser?.id, 'profile'] });
    },
  });
}

export function useChangePassword() {
  const { data: currentUser } = useCurrentUser();
  return useMutation({
    mutationFn: async (passwords: { currentPassword: string; newPassword: string }) => {
      if (!currentUser) throw new Error('User not authenticated');
      return apiRequest(
        api.user.updatePassword.path.replace(':userId', String(currentUser.id)),
        'PATCH',
        passwords
      );
    },
  });
}

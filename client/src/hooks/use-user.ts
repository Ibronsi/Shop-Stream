import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { api, buildUrl } from '@shared/routes';
import { useCurrentUser } from './use-auth';

export function useMyOrders() {
  const { data: currentUser } = useCurrentUser();
  return useQuery({
    queryKey: ['/api/users/orders', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const url = api.orders.userOrders.path.replace(':email', encodeURIComponent(currentUser.email));
      const res = await apiRequest('GET', url);
      return res.json();
    },
    enabled: !!currentUser?.email,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
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

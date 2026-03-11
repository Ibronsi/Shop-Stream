import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { api } from '@shared/routes';
import { useCurrentUser } from './use-auth';

export function useCancelOrder() {
  const { data: currentUser } = useCurrentUser();
  
  return useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(
        api.orders.cancel.path.replace(':id', String(orderId)),
        'POST'
      );
    },
    onSuccess: () => {
      // Invalidate with the same exact queryKey as useMyOrders
      if (currentUser?.email) {
        queryClient.invalidateQueries({ queryKey: ['/api/users/orders', currentUser.email] });
      }
    },
  });
}

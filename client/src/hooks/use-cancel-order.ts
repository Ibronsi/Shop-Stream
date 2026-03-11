import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { api } from '@shared/routes';

export function useCancelOrder() {
  return useMutation({
    mutationFn: async (orderId: number) => {
      return apiRequest(
        api.orders.cancel.path.replace(':id', String(orderId)),
        'POST'
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users/orders'] });
    },
  });
}

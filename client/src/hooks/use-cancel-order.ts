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
      // Invalider les commandes utilisateur
      if (currentUser?.email) {
        queryClient.invalidateQueries({ queryKey: ['/api/users/orders', currentUser.email] });
      }
      // Invalider le cache des produits pour afficher les stocks restaurés
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
  });
}

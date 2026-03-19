import { useQuery } from "@tanstack/react-query";

export type OrderItemDetail = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
};

export function useOrderItems(orderId: number) {
  return useQuery<OrderItemDetail[]>({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/items`);
      if (!res.ok) throw new Error("Impossible de charger les articles");
      return res.json();
    },
    enabled: !!orderId,
    staleTime: 30000,
  });
}

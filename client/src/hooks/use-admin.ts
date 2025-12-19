import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertProduct, Order } from "@shared/schema";

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (product: InsertProduct) => {
      return apiRequest("POST", api.products.create.path, product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
    },
  });
}

export function useAllOrders() {
  return useQuery({
    queryKey: [api.orders.allOrders.path],
    queryFn: async () => {
      const response = await fetch(api.orders.allOrders.path);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json() as Promise<Order[]>;
    },
  });
}

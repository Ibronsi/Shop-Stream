import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertProduct, Order, Product } from "@shared/schema";

export function useCreateProduct() {
  return useMutation({
    mutationFn: async (product: InsertProduct) => {
      return apiRequest("POST", api.products.create.path, product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
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

export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const response = await fetch(api.admin.stats.path);
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertProduct> }) => {
      return apiRequest("PATCH", api.admin.updateProduct.path.replace(":id", String(id)), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
    },
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(api.admin.deleteProduct.path.replace(":id", String(id)), {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
    },
  });
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", api.admin.updateOrderStatus.path.replace(":id", String(id)), { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.orders.allOrders.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
    },
  });
}

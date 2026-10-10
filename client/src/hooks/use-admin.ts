import { useMutation, useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InsertProduct, InsertProductVariant, Order, Product } from "@shared/schema";
import { apiFetch } from "@/lib/api";

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
      const response = await apiFetch(api.orders.allOrders.path);
      if (!response.ok) throw new Error("Failed to fetch orders");
      return response.json() as Promise<Order[]>;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const response = await apiFetch(api.admin.stats.path);
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
      const response = await apiFetch(api.admin.deleteProduct.path.replace(":id", String(id)), {
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

export function useCreateVariant() {
  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: Omit<InsertProductVariant, "productId"> }) => {
      return apiRequest("POST", buildUrl(api.adminVariants.create.path, { productId }), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.products.variants.path, variables.productId] });
    },
  });
}

export function useUpdateVariant() {
  return useMutation({
    mutationFn: async ({ id, productId, data }: { id: number; productId: number; data: Partial<InsertProductVariant> }) => {
      return apiRequest("PATCH", buildUrl(api.adminVariants.update.path, { id }), data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.products.variants.path, variables.productId] });
    },
  });
}

export function useDeleteVariant() {
  return useMutation({
    mutationFn: async ({ id }: { id: number; productId: number }) => {
      const response = await apiFetch(buildUrl(api.adminVariants.delete.path, { id }), { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete variant");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.products.variants.path, variables.productId] });
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

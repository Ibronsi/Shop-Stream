import { useQuery } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { apiFetch } from "@/lib/api";

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await apiFetch(api.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch products");
      return api.products.list.responses[200].parse(await res.json());
    },
  });
}

export function useProductVariants(productId: number) {
  return useQuery({
    queryKey: [api.products.variants.path, productId],
    queryFn: async () => {
      const url = buildUrl(api.products.variants.path, { id: productId });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch variants");
      return api.products.variants.responses[200].parse(await res.json());
    },
    enabled: !!productId,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.products.get.path, { id });
      const res = await apiFetch(url);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch product");
      }
      return api.products.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

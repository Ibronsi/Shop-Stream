import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertCartItem } from "@shared/schema";
import { apiFetch } from "@/lib/api";

export function useCart(sessionId: string | null) {
  return useQuery({
    queryKey: [api.cart.list.path, sessionId],
    queryFn: async () => {
      if (!sessionId) return [];
      const url = buildUrl(api.cart.list.path, { sessionId });
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch cart");
      return api.cart.list.responses[200].parse(await res.json());
    },
    enabled: !!sessionId,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: InsertCartItem) => {
      const res = await apiFetch(api.cart.add.path, {
        method: api.cart.add.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      return api.cart.add.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, variables.sessionId] });
      toast({
        title: "Ajouté au panier",
        description: "L'article a été ajouté à votre panier.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'article au panier.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity, sessionId }: { id: number; quantity: number; sessionId: string }) => {
      const url = buildUrl(api.cart.update.path, { id });
      const res = await apiFetch(url, {
        method: api.cart.update.method,
        headers: {
          "Content-Type": "application/json",
          "X-Cart-Session": sessionId,
        },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update cart item");
      return api.cart.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, variables.sessionId] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, sessionId }: { id: number; sessionId: string }) => {
      const url = buildUrl(api.cart.delete.path, { id });
      const res = await apiFetch(url, {
        method: api.cart.delete.method,
        headers: { "X-Cart-Session": sessionId },
      });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, variables.sessionId] });
      toast({
        title: "Article retiré",
        description: "L'article a été retiré de votre panier.",
      });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const url = buildUrl(api.cart.clear.path, { sessionId });
      const res = await apiFetch(url, { method: api.cart.clear.method });
      if (!res.ok) throw new Error("Failed to clear cart");
    },
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: [api.cart.list.path, sessionId] });
    },
  });
}

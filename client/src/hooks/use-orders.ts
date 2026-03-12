import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";

export function useCreateOrder() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (order: InsertOrder) => {
      const res = await fetch(api.orders.create.path, {
        method: api.orders.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to place order");
      }
      return api.orders.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      // Invalider le cache des produits pour afficher les nouveaux stocks
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.get.path] });
      // Invalider les stats admin
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });

      toast({
        title: "Commande passée!",
        description: "Merci pour votre achat. Votre commande a été reçue.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Erreur de commande",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

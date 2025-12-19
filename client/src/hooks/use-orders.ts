import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { InsertOrder } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
      toast({
        title: "Order placed!",
        description: "Thank you for your purchase. We've received your order.",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Order failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

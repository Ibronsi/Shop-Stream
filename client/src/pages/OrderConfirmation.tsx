import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSEO } from "@/hooks/use-seo";
import { CheckCircle, Package, Loader2, Home, ClipboardList } from "lucide-react";
import type { Order } from "@shared/schema";

type OrderItemDetail = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  productName?: string;
};

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params ? parseInt(params.id) : 0;

  useSEO({
    title: "Commande confirmée",
    description: "Votre commande a été passée avec succès.",
  });

  const { data: order, isLoading: orderLoading } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Commande introuvable");
      return res.json();
    },
    enabled: !!orderId,
  });

  const { data: items, isLoading: itemsLoading } = useQuery<OrderItemDetail[]>({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/items`);
      if (!res.ok) throw new Error("Impossible de charger les articles");
      return res.json();
    },
    enabled: !!orderId,
  });

  if (orderLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Commande introuvable</h2>
          <Link href="/"><Button>Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod === "mynita" ? "MyNita (97120634)" :
    order.paymentMethod === "amanata" ? "My Amanata (97120634)" :
    "À la livraison";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Commande confirmée !
          </h1>
          <p className="text-muted-foreground">
            Merci pour votre achat. Votre commande #{order.id} a bien été reçue.
          </p>
        </div>

        {/* Order Details */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Récapitulatif de la commande
          </h2>

          {/* Items */}
          {items && items.length > 0 && (
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">Produit #{item.productId}</p>
                    <p className="text-sm text-muted-foreground">Qté: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    {(Number(item.price) * item.quantity).toLocaleString("fr-FR")} CFA
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Livraison</span>
              <span className="text-primary font-medium">Gratuite</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-primary pt-1">
              <span>Total payé</span>
              <span>{Number(order.total).toLocaleString("fr-FR")} CFA</span>
            </div>
          </div>
        </Card>

        {/* Info Block */}
        <Card className="p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Informations de livraison</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Méthode de paiement</span>
              <span className="font-medium">{paymentLabel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{order.email}</span>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Adresse de livraison</p>
              <p className="font-medium whitespace-pre-line text-sm bg-secondary/40 rounded-lg p-3">{order.address}</p>
            </div>
          </div>
        </Card>

        {/* Instructions de paiement mobile money */}
        {(order.paymentMethod === "mynita" || order.paymentMethod === "amanata") && (
          <Card className="p-6 mb-8 border-primary/30 bg-primary/5">
            <h2 className="font-semibold text-lg mb-3 text-primary">
              Instructions de paiement {paymentLabel.split("(")[0].trim()}
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
              <li>Ouvrez votre application {order.paymentMethod === "mynita" ? "MyNita" : "My Amanata"}</li>
              <li>Sélectionnez "Transfert d'argent"</li>
              <li>Entrez le numéro: <span className="font-bold text-primary">97120634</span></li>
              <li>Entrez le montant: <span className="font-bold text-primary">{Number(order.total).toLocaleString("fr-FR")} CFA</span></li>
              <li>Confirmez le paiement</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              Votre commande sera traitée dès réception du paiement.
            </p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/my-orders">
            <Button variant="outline" className="w-full sm:w-auto gap-2" data-testid="button-view-orders">
              <ClipboardList className="h-4 w-4" />
              Suivre ma commande
            </Button>
          </Link>
          <Link href="/">
            <Button className="w-full sm:w-auto gap-2" data-testid="button-continue-shopping">
              <Home className="h-4 w-4" />
              Continuer les achats
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useMyOrders } from "@/hooks/use-user";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCancelOrder } from "@/hooks/use-cancel-order";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MyOrders() {
  useSEO({
    title: "Mes Commandes",
    description: "Voir l'historique de vos commandes et leur statut",
    keywords: "mes commandes, historique, statut",
  });

  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: orders, isLoading: ordersLoading } = useMyOrders();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState<number | null>(null);

  const handleCancelOrder = (orderId: number) => {
    cancelOrder.mutate(orderId, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Commande annulée avec succès" });
        setConfirmCancel(null);
      },
      onError: () => {
        toast({ 
          title: "Erreur", 
          description: "Impossible d'annuler cette commande",
          variant: "destructive"
        });
      },
    });
  };

  if (!currentUser && !userLoading) {
    navigate("/login");
    return null;
  }

  if (userLoading || ordersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mes Commandes</h1>
        </div>

        {!orders || orders.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore passé de commande</p>
            <Link href="/">
              <Button>Commencer à acheter</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-semibold text-lg">Commande #{order.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm mt-2">
                      Email: <span className="font-medium">{order.email}</span>
                    </p>
                    <p className="text-sm">
                      Adresse: <span className="font-medium">{order.address}, {order.city}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{order.total} CFA</div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        {order.approvalStatus === 'approved' && (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">Approuvée</span>
                          </>
                        )}
                        {order.approvalStatus === 'rejected' && (
                          <>
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">Rejetée</span>
                          </>
                        )}
                        {order.approvalStatus === 'pending' && (
                          <>
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="text-yellow-600 font-medium">En attente</span>
                          </>
                        )}
                        {order.approvalStatus === 'cancelled' && (
                          <>
                            <XCircle className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-500 font-medium">Annulée</span>
                          </>
                        )}
                      </div>
                      {order.rejectionReason && (
                        <p className="text-xs text-red-600">Raison: {order.rejectionReason}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Mode paiement: {order.paymentMethod === 'mynita' ? 'MyNita' : order.paymentMethod === 'amanata' ? 'MyAmanata' : 'À la livraison'}
                      </p>
                      {order.approvalStatus === 'pending' && confirmCancel === order.id ? (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={cancelOrder.isPending}
                          >
                            Confirmer
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setConfirmCancel(null)}
                            disabled={cancelOrder.isPending}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : order.approvalStatus === 'pending' ? (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setConfirmCancel(order.id)}
                          className="mt-3 gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Annuler la commande
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

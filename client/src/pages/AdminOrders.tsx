import { Navbar } from "@/components/Navbar";
import { useAllOrders } from "@/hooks/use-admin";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft, Package } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminOrders() {
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const { data: orders, isLoading, error } = useAllOrders();

  if (!currentUser && !userLoading) {
    navigate("/login");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Erreur</h2>
            <p className="text-muted-foreground">Impossible de charger les commandes.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-3xl font-bold">Commandes reçues</h1>
        </div>

        {!orders || orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-secondary/30 rounded-2xl"
          >
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg">Aucune commande pour le moment.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-muted-foreground mb-6">
              Total: <span className="font-bold text-foreground">{orders.length} commande(s)</span>
            </div>

            <div className="grid gap-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 hover-elevate transition-all" data-testid={`card-order-${order.id}`}>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Order ID & Date */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Numéro de commande</p>
                        <p className="font-bold text-foreground"># {order.id}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Statut</p>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              order.status === "completed" ? "bg-green-500" : "bg-yellow-500"
                            }`}
                          />
                          <span className="font-semibold text-foreground capitalize">
                            {order.status === "pending" ? "En attente" : "Complétée"}
                          </span>
                        </div>
                      </div>

                      {/* Total */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Montant total</p>
                        <p className="font-bold text-primary text-lg">
                          ${Number(order.total).toFixed(2)}
                        </p>
                      </div>

                      {/* Contact */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Email</p>
                        <p className="font-semibold text-foreground text-sm break-all">
                          {order.email}
                        </p>
                      </div>
                    </div>

                    {/* Adresse */}
                    <div className="mt-6 pt-6 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Adresse de livraison</p>
                      <p className="text-foreground">{order.address}</p>
                    </div>

                    {/* Session ID (for reference) */}
                    <div className="mt-4 text-xs text-muted-foreground">
                      Session: {order.sessionId}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
          <Link href="/admin">
            <Button>Ajouter un produit</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

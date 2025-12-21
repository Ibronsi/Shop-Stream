import { Navbar } from "@/components/Navbar";
import { useAdminStats, useAllOrders, useDeleteProduct, useUpdateOrderStatus } from "@/hooks/use-admin";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2, ChevronLeft, Trash2, Plus, Edit2, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: products } = useProducts();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  const isLoading = statsLoading || ordersLoading;

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

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      deleteProduct.mutate(id, {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit supprimé" });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de supprimer le produit", variant: "destructive" });
        },
      });
    }
  };

  const handleUpdateStatus = (id: number, status: string) => {
    const newStatus = status === "pending" ? "completed" : "pending";
    updateOrderStatus.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          toast({ title: "Succès", description: `Commande marquée comme ${newStatus === "pending" ? "en attente" : "complétée"}` });
          setEditingOrderId(null);
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-12">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-4xl font-bold">Dashboard Admin</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Commandes</p>
              <p className="text-3xl font-bold text-primary">{stats?.totalOrders || 0}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Revenue Totale</p>
              <p className="text-3xl font-bold text-green-600">${stats?.totalRevenue || "0.00"}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Produits</p>
              <p className="text-3xl font-bold text-blue-600">{stats?.totalProducts || 0}</p>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6">
              <p className="text-sm text-muted-foreground mb-2">Stock Total</p>
              <p className="text-3xl font-bold text-orange-600">{stats?.totalStock || 0}</p>
            </Card>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Commandes Récentes</h2>
            <Link href="/admin/orders">
              <Button variant="outline" size="sm">Voir tout</Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Commande</th>
                  <th className="text-left py-3 px-4 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 font-semibold">Montant</th>
                  <th className="text-left py-3 px-4 font-semibold">Statut</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentOrders?.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-mono text-xs">#{order.id}</td>
                    <td className="py-3 px-4 text-muted-foreground">{order.email}</td>
                    <td className="py-3 px-4 font-bold">${Number(order.total).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        order.status === "completed" 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                      }`}>
                        {order.status === "pending" ? "En attente" : "Complétée"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(order.id, order.status)}
                        disabled={updateOrderStatus.isPending}
                        data-testid={`button-update-status-${order.id}`}
                      >
                        {order.status === "pending" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Management */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Gestion des Produits</h2>
            <Link href="/admin">
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter Produit
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Produit</th>
                  <th className="text-left py-3 px-4 font-semibold">Catégorie</th>
                  <th className="text-left py-3 px-4 font-semibold">Prix</th>
                  <th className="text-left py-3 px-4 font-semibold">Stock</th>
                  <th className="text-left py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products?.map((product) => (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="py-3 px-4 font-semibold">{product.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                    <td className="py-3 px-4 font-bold">${Number(product.price).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={product.stock > 20 ? "text-green-600" : "text-orange-600"}>
                        {product.stock} items
                      </span>
                    </td>
                    <td className="py-3 px-4 flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        disabled={deleteProduct.isPending}
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

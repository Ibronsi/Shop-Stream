import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useAdminStats, useAllOrders, useDeleteProduct, useUpdateOrderStatus } from "@/hooks/use-admin";
import { useProducts } from "@/hooks/use-products";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft, Trash2, Plus, Package, ShoppingCart, TrendingUp, Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "pending",   label: "En attente",      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { value: "accepted",  label: "Acceptée",        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "preparing", label: "En préparation",  color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300" },
  { value: "ready",     label: "Prête",           color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300" },
  { value: "delivered", label: "Livrée",          color: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300" },
  { value: "rejected",  label: "Rejetée",         color: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
];

const CANCELLED_STATUS = { label: "Annulée (client)", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };

function StatusBadge({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CANCELLED_STATUS.color}`}>
        {CANCELLED_STATUS.label}
      </span>
    );
  }
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  if (!opt) return null;
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export default function AdminDashboard() {
  useSEO({
    title: "Dashboard Admin",
    description: "Gérer les produits, commandes et statistiques.",
    keywords: "admin, dashboard, statistiques",
  });

  const { toast } = useToast();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: products } = useProducts();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();

  const isLoading = statsLoading || ordersLoading;

  if (!currentUser && !userLoading) {
    navigate("/login");
    return null;
  }

  if (currentUser && currentUser.role !== "admin" && !userLoading) {
    navigate("/");
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

  const handleDeleteProduct = (id: number, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      deleteProduct.mutate(id, {
        onSuccess: () => toast({ title: "Produit supprimé" }),
        onError: () => toast({ title: "Erreur", description: "Impossible de supprimer", variant: "destructive" }),
      });
    }
  };

  const handleChangeStatus = (orderId: number, newStatus: string) => {
    updateOrderStatus.mutate(
      { id: orderId, status: newStatus as any },
      {
        onSuccess: () => {
          const opt = STATUS_OPTIONS.find((s) => s.value === newStatus);
          toast({ title: "Statut mis à jour", description: `Commande marquée : ${opt?.label}` });
        },
        onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" }),
      }
    );
  };

  const sortedOrders = [...(orders || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
          {[
            { label: "Total Commandes", value: stats?.totalOrders ?? 0, color: "text-primary", icon: ShoppingCart },
            { label: "Chiffre d'affaires", value: `${Number(stats?.totalRevenue ?? 0).toLocaleString("fr-FR")} CFA`, color: "text-green-600", icon: TrendingUp },
            { label: "Produits", value: stats?.totalProducts ?? 0, color: "text-blue-600", icon: Package },
            { label: "Stock Total", value: stats?.totalStock ?? 0, color: "text-orange-600", icon: Layers },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Commandes */}
        <div className="mb-12">
          <h2 className="font-display text-2xl font-bold mb-6">Gestion des Commandes</h2>

          <div className="space-y-4">
            {sortedOrders.length === 0 && (
              <Card className="p-8 text-center text-muted-foreground">Aucune commande</Card>
            )}
            {sortedOrders.map((order) => (
              <Card key={order.id} className="p-5" data-testid={`card-admin-order-${order.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-mono font-semibold">#{order.id}</span>
                      <StatusBadge status={order.approvalStatus} />
                      {order.approvalStatus === "cancelled" && (
                        <span className="text-xs text-muted-foreground italic">— client a annulé</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{order.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.paymentMethod === "mynita"  ? "Paiement MyNita" :
                       order.paymentMethod === "amanata" ? "Paiement MyAmanata" :
                       "Paiement à la livraison"}
                    </p>
                    {order.address && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                        {order.address}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-xl font-bold text-primary">
                      {Number(order.total).toLocaleString("fr-FR")} CFA
                    </div>

                    {order.approvalStatus !== "cancelled" && (
                      <Select
                        value={order.approvalStatus}
                        onValueChange={(val) => handleChangeStatus(order.id, val)}
                        disabled={updateOrderStatus.isPending}
                      >
                        <SelectTrigger className="w-44 h-8 text-xs" data-testid={`select-status-${order.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Produits */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Gestion des Produits</h2>
            <Link href="/admin">
              <Button size="sm" className="gap-2" data-testid="button-add-product">
                <Plus className="h-4 w-4" />
                Ajouter
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
                    <td className="py-3 px-4 font-bold">{Number(product.price).toLocaleString("fr-FR")} CFA</td>
                    <td className="py-3 px-4">
                      <span className={product.stock > 5 ? "text-green-600" : "text-red-600 font-semibold"}>
                        {product.stock} unités
                      </span>
                    </td>
                    <td className="py-3 px-4">
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
      </main>
    </div>
  );
}

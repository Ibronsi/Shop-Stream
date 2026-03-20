import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useAdminStats, useAllOrders, useDeleteProduct, useUpdateOrderStatus } from "@/hooks/use-admin";
import { useProducts } from "@/hooks/use-products";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft, Trash2, Plus, Package, ShoppingCart, TrendingUp, Layers, Tag, FolderOpen, ToggleLeft, ToggleRight } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Category, PromoCode } from "@shared/schema";

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
    return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CANCELLED_STATUS.color}`}>{CANCELLED_STATUS.label}</span>;
  }
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  if (!opt) return null;
  return <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${opt.color}`}>{opt.label}</span>;
}

type TabId = "orders" | "products" | "categories" | "promos";

export default function AdminDashboard() {
  useSEO({ title: "Dashboard Admin", description: "Gérer les produits, commandes et statistiques.", keywords: "admin, dashboard, statistiques" });

  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: orders, isLoading: ordersLoading } = useAllOrders();
  const { data: products } = useProducts();
  const deleteProduct = useDeleteProduct();
  const updateOrderStatus = useUpdateOrderStatus();

  const [activeTab, setActiveTab] = useState<TabId>("orders");

  // Categories
  const { data: categories } = useQuery<Category[]>({ queryKey: ['/api/categories'] });
  const [newCatName, setNewCatName] = useState("");
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => apiRequest("POST", "/api/admin/categories", { name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/categories'] }); setNewCatName(""); toast({ title: "Catégorie créée" }); },
    onError: (e: any) => toast({ title: "Erreur", description: e.message || "Déjà existante", variant: "destructive" }),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/categories'] }); toast({ title: "Catégorie supprimée" }); },
  });

  // Promo Codes
  const { data: promoCodes } = useQuery<PromoCode[]>({ queryKey: ['/api/admin/promo-codes'] });
  const [promoForm, setPromoForm] = useState({ code: "", discountType: "percent", discountValue: "", maxUses: "" });
  const createPromoMutation = useMutation({
    mutationFn: (data: typeof promoForm) => apiRequest("POST", "/api/admin/promo-codes", {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses ? Number(data.maxUses) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] });
      setPromoForm({ code: "", discountType: "percent", discountValue: "", maxUses: "" });
      toast({ title: "Code promo créé" });
    },
    onError: (e: any) => toast({ title: "Erreur", description: e.message || "Code déjà existant", variant: "destructive" }),
  });
  const deletePromoMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/promo-codes/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] }); toast({ title: "Code supprimé" }); },
  });
  const togglePromoMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => apiRequest("PATCH", `/api/admin/promo-codes/${id}/toggle`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['/api/admin/promo-codes'] }),
  });

  const isLoading = statsLoading || ordersLoading;

  if (!currentUser && !userLoading) { navigate("/login"); return null; }
  if (currentUser && currentUser.role !== "admin" && !userLoading) { navigate("/"); return null; }

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
    updateOrderStatus.mutate({ id: orderId, status: newStatus as any }, {
      onSuccess: () => {
        const opt = STATUS_OPTIONS.find((s) => s.value === newStatus);
        toast({ title: "Statut mis à jour", description: `Commande marquée : ${opt?.label}` });
      },
      onError: () => toast({ title: "Erreur", description: "Impossible de mettre à jour le statut", variant: "destructive" }),
    });
  };

  const sortedOrders = [...(orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const tabs: { id: TabId; label: string; icon: typeof ShoppingCart }[] = [
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "products", label: "Produits", icon: Package },
    { id: "categories", label: "Catégories", icon: FolderOpen },
    { id: "promos", label: "Codes Promo", icon: Tag },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-display text-4xl font-bold">Dashboard Admin</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
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

        {/* Tab Nav */}
        <div className="flex gap-1 mb-8 bg-secondary/40 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* COMMANDES */}
        {activeTab === "orders" && (
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
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{order.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {order.paymentMethod === "mynita" ? "Paiement MyNita" : order.paymentMethod === "amanata" ? "Paiement MyAmanata" : "Paiement à la livraison"}
                    </p>
                    {order.promoCode && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Code promo: {order.promoCode} (- {Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA)
                      </p>
                    )}
                    {order.address && (
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">{order.address}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-xl font-bold text-primary">{Number(order.total).toLocaleString("fr-FR")} CFA</div>
                    {order.approvalStatus !== "cancelled" && (
                      <Select value={order.approvalStatus} onValueChange={(val) => handleChangeStatus(order.id, val)} disabled={updateOrderStatus.isPending}>
                        <SelectTrigger className="w-44 h-8 text-xs" data-testid={`select-status-${order.id}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* PRODUITS */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">Gestion des Produits</h2>
              <Link href="/admin">
                <Button size="sm" className="gap-2" data-testid="button-add-product">
                  <Plus className="h-4 w-4" /> Ajouter
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
                    <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30" data-testid={`row-product-${product.id}`}>
                      <td className="py-3 px-4 font-semibold">{product.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                      <td className="py-3 px-4 font-bold">{Number(product.price).toLocaleString("fr-FR")} CFA</td>
                      <td className="py-3 px-4">
                        <span className={product.stock > 5 ? "text-green-600" : "text-red-600 font-semibold"}>{product.stock} unités</span>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="icon" variant="outline" className="h-8 w-8" disabled={deleteProduct.isPending} onClick={() => handleDeleteProduct(product.id, product.name)} data-testid={`button-delete-product-${product.id}`}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATÉGORIES */}
        {activeTab === "categories" && (
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold mb-6">Gestion des Catégories</h2>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Ajouter une catégorie</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Électronique, Mode..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newCatName.trim() && createCategoryMutation.mutate(newCatName.trim())}
                  className="h-10"
                  data-testid="input-category-name"
                />
                <Button
                  onClick={() => newCatName.trim() && createCategoryMutation.mutate(newCatName.trim())}
                  disabled={createCategoryMutation.isPending || !newCatName.trim()}
                  className="gap-2 h-10"
                  data-testid="button-create-category"
                >
                  {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Créer
                </Button>
              </div>
            </Card>

            <div className="space-y-2">
              {categories?.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">Aucune catégorie encore créée.</p>
              )}
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3 border border-border/50" data-testid={`row-category-${cat.id}`}>
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteCategoryMutation.mutate(cat.id)}
                    disabled={deleteCategoryMutation.isPending}
                    data-testid={`button-delete-category-${cat.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CODES PROMO */}
        {activeTab === "promos" && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold mb-6">Codes Promo</h2>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Créer un code promo</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Code</label>
                  <Input
                    placeholder="EX: PROMO10"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="h-10"
                    data-testid="input-promo-new-code"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type de réduction</label>
                  <Select value={promoForm.discountType} onValueChange={(v) => setPromoForm(f => ({ ...f, discountType: v }))}>
                    <SelectTrigger className="h-10" data-testid="select-promo-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Valeur de réduction</label>
                  <Input
                    type="number"
                    placeholder={promoForm.discountType === "percent" ? "Ex: 10 (pour 10%)" : "Ex: 2000"}
                    value={promoForm.discountValue}
                    onChange={(e) => setPromoForm(f => ({ ...f, discountValue: e.target.value }))}
                    className="h-10"
                    data-testid="input-promo-value"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre max d'utilisations (optionnel)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 100 (illimité si vide)"
                    value={promoForm.maxUses}
                    onChange={(e) => setPromoForm(f => ({ ...f, maxUses: e.target.value }))}
                    className="h-10"
                    data-testid="input-promo-max-uses"
                  />
                </div>
              </div>
              <Button
                className="mt-4 gap-2"
                onClick={() => createPromoMutation.mutate(promoForm)}
                disabled={createPromoMutation.isPending || !promoForm.code || !promoForm.discountValue}
                data-testid="button-create-promo"
              >
                {createPromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Créer le code
              </Button>
            </Card>

            <div className="space-y-3">
              {promoCodes?.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-6">Aucun code promo créé.</p>
              )}
              {promoCodes?.map((promo) => (
                <Card key={promo.id} className={`p-4 ${!promo.active ? "opacity-60" : ""}`} data-testid={`card-promo-${promo.id}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-lg">{promo.code}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${promo.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-500"}`}>
                          {promo.active ? "Actif" : "Inactif"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {promo.discountType === "percent" ? `${promo.discountValue}% de réduction` : `${Number(promo.discountValue).toLocaleString("fr-FR")} CFA de réduction`}
                        {promo.maxUses ? ` · ${promo.uses}/${promo.maxUses} utilisations` : ` · ${promo.uses} utilisations`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => togglePromoMutation.mutate({ id: promo.id, active: !promo.active })}
                        title={promo.active ? "Désactiver" : "Activer"}
                        data-testid={`button-toggle-promo-${promo.id}`}
                      >
                        {promo.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deletePromoMutation.mutate(promo.id)}
                        disabled={deletePromoMutation.isPending}
                        data-testid={`button-delete-promo-${promo.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

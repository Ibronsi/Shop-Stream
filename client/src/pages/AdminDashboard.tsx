import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useAdminStats, useAllOrders, useDeleteProduct, useUpdateOrderStatus, useUpdateProduct } from "@/hooks/use-admin";
import { useProducts } from "@/hooks/use-products";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import {
  Loader2, ChevronLeft, Trash2, Plus, Package, ShoppingCart, TrendingUp,
  Layers, Tag, FolderOpen, ToggleLeft, ToggleRight, Printer, FileText,
  BookOpen, Pencil, X,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Product } from "@shared/schema";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Category, PromoCode, Order } from "@shared/schema";

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

type TabId = "orders" | "products" | "categories" | "promos" | "accounting";

// ── ACCOUNTING PDF ────────────────────────────────────────────────────────────
function printAccountingReport(orders: Order[], stats: any) {
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderRows = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((o) => `
      <tr>
        <td>#${o.id}</td>
        <td>${new Date(o.createdAt).toLocaleDateString("fr-FR")}</td>
        <td>${o.email}</td>
        <td>${o.paymentMethod === "mynita" ? "MyNita" : o.paymentMethod === "amanata" ? "MyAmanata" : "Livraison"}</td>
        <td>${o.approvalStatus === "delivered" ? "Livrée" : o.approvalStatus === "cancelled" ? "Annulée" : o.approvalStatus === "rejected" ? "Rejetée" : o.approvalStatus === "preparing" ? "Préparation" : o.approvalStatus === "accepted" ? "Acceptée" : "En attente"}</td>
        <td style="text-align:right;font-weight:bold;">${Number(o.total).toLocaleString("fr-FR")} CFA</td>
      </tr>
    `).join("");

  const totalRevenue = Number(stats?.totalRevenue ?? 0);
  const deliveredTotal = orders.filter(o => o.approvalStatus === "delivered").reduce((s, o) => s + Number(o.total), 0);

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Rapport Comptable — ${now}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px;}
    h1{color:#1a1a2e;font-size:22px;margin-bottom:4px;}
    .subtitle{color:#666;font-size:13px;margin-bottom:24px;}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px;}
    .stat-card{border:1px solid #ddd;border-radius:8px;padding:14px;text-align:center;}
    .stat-label{font-size:11px;color:#666;margin-bottom:4px;}
    .stat-value{font-size:18px;font-weight:bold;color:#1a1a2e;}
    table{width:100%;border-collapse:collapse;margin-top:12px;}
    th{background:#1a1a2e;color:white;padding:8px 10px;text-align:left;font-size:11px;}
    td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px;}
    tr:nth-child(even){background:#f9f9f9;}
    .footer{margin-top:32px;border-top:1px solid #ddd;padding-top:14px;font-size:11px;color:#888;text-align:center;}
    @media print{body{margin:15px;}.no-print{display:none;}}
  </style></head><body>
  <h1>Rapport Comptable</h1>
  <div class="subtitle">Généré le ${now} — Boutique Niger Commerce</div>
  <div class="stats">
    <div class="stat-card"><div class="stat-label">Total Commandes</div><div class="stat-value">${stats?.totalOrders ?? 0}</div></div>
    <div class="stat-card"><div class="stat-label">CA Total</div><div class="stat-value">${totalRevenue.toLocaleString("fr-FR")} CFA</div></div>
    <div class="stat-card"><div class="stat-label">CA Livré</div><div class="stat-value">${deliveredTotal.toLocaleString("fr-FR")} CFA</div></div>
    <div class="stat-card"><div class="stat-label">Produits en stock</div><div class="stat-value">${stats?.totalStock ?? 0}</div></div>
  </div>
  <table>
    <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Paiement</th><th>Statut</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table>
  <div class="footer">Niger Commerce • Rapport généré automatiquement le ${now}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

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
  const updateProduct = useUpdateProduct();

  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  const { data: promoCodes } = useQuery<PromoCode[]>({ queryKey: ['/api/admin/promo-codes'] });
  const [promoForm, setPromoForm] = useState({ code: "", discountType: "percent", discountValue: "", maxUses: "" });
  const createPromoMutation = useMutation({
    mutationFn: (data: typeof promoForm) => apiRequest("POST", "/api/admin/promo-codes", {
      code: data.code.toUpperCase(), discountType: data.discountType, discountValue: data.discountValue,
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

  if (!currentUser && !userLoading) { navigate("/login"); return null; }
  if (currentUser && currentUser.role !== "admin" && !userLoading) { navigate("/"); return null; }

  if (statsLoading || ordersLoading) {
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
    { id: "orders",     label: "Commandes",   icon: ShoppingCart },
    { id: "products",   label: "Produits",    icon: Package },
    { id: "categories", label: "Catégories",  icon: FolderOpen },
    { id: "promos",     label: "Codes Promo", icon: Tag },
    { id: "accounting", label: "Comptabilité", icon: BookOpen },
  ];

  // ── ACCOUNTING DATA ──────────────────────────────────────────
  const allOrders = orders || [];
  const deliveredOrders = allOrders.filter(o => o.approvalStatus === "delivered");
  const pendingOrders = allOrders.filter(o => o.approvalStatus === "pending");
  const cancelledOrders = allOrders.filter(o => o.approvalStatus === "cancelled" || o.approvalStatus === "rejected");
  const totalRevenue = allOrders.reduce((s, o) => s + Number(o.total), 0);
  const deliveredRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);

  const paymentStats = [
    { label: "Livraison",  count: allOrders.filter(o => o.paymentMethod === "delivery").length,  amount: allOrders.filter(o => o.paymentMethod === "delivery").reduce((s, o) => s + Number(o.total), 0) },
    { label: "MyNita",     count: allOrders.filter(o => o.paymentMethod === "mynita").length,    amount: allOrders.filter(o => o.paymentMethod === "mynita").reduce((s, o) => s + Number(o.total), 0) },
    { label: "MyAmanata",  count: allOrders.filter(o => o.paymentMethod === "amanata").length,   amount: allOrders.filter(o => o.paymentMethod === "amanata").reduce((s, o) => s + Number(o.total), 0) },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-10">
          <Link href="/"><Button variant="ghost" size="icon" data-testid="button-back"><ChevronLeft className="h-5 w-5" /></Button></Link>
          <h1 className="font-display text-4xl font-bold">Dashboard Admin</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Total Commandes", value: stats?.totalOrders ?? 0,                                                        color: "text-primary",    icon: ShoppingCart },
            { label: "Chiffre d'affaires", value: `${Number(stats?.totalRevenue ?? 0).toLocaleString("fr-FR")} CFA`,            color: "text-green-600",  icon: TrendingUp },
            { label: "Produits",           value: stats?.totalProducts ?? 0,                                                    color: "text-blue-600",   icon: Package },
            { label: "Stock Total",        value: stats?.totalStock ?? 0,                                                       color: "text-orange-600", icon: Layers },
          ].map(({ label, value, color, icon: Icon }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-muted ${color}`}><Icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-1 mb-8 bg-secondary/40 rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${id}`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>

        {/* ── COMMANDES ─────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {sortedOrders.length === 0 && <Card className="p-8 text-center text-muted-foreground">Aucune commande</Card>}
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
                        Code promo : {order.promoCode} (- {Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA)
                      </p>
                    )}
                    {order.address && <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">{order.address}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-xl font-bold text-primary">{Number(order.total).toLocaleString("fr-FR")} CFA</div>

                    {order.approvalStatus !== "cancelled" && (
                      <Select
                        value={order.approvalStatus}
                        onValueChange={(val) => handleChangeStatus(order.id, val)}
                        disabled={updateOrderStatus.isPending}
                      >
                        <SelectTrigger
                          className="w-48 h-9 text-sm font-medium border-2 border-border bg-background text-foreground shadow-sm"
                          data-testid={`select-status-${order.id}`}
                        >
                          <SelectValue placeholder="Changer le statut" />
                        </SelectTrigger>
                        <SelectContent className="z-50">
                          {STATUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-sm cursor-pointer">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => printClientInvoice(order)}
                      data-testid={`button-print-invoice-${order.id}`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Imprimer facture
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── PRODUITS ─────────────────────────────────────────── */}
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
                    <th className="text-left py-3 px-4 font-semibold">Vente en gros</th>
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
                        {product.minOrderQty && product.minOrderQty >= 2 ? (
                          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-semibold">
                            Min {product.minOrderQty}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1.5">
                          <Button size="icon" variant="outline" className="h-8 w-8"
                            onClick={() => setEditingProduct(product)}
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Pencil className="h-3 w-3 text-primary" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" disabled={deleteProduct.isPending}
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            data-testid={`button-delete-product-${product.id}`}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CATÉGORIES ────────────────────────────────────────── */}
        {activeTab === "categories" && (
          <div className="max-w-xl">
            <h2 className="font-display text-2xl font-bold mb-6">Gestion des Catégories</h2>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Ajouter une catégorie</h3>
              <div className="flex gap-2">
                <Input placeholder="Ex: Électronique, Mode..." value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newCatName.trim() && createCategoryMutation.mutate(newCatName.trim())}
                  className="h-10" data-testid="input-category-name"
                />
                <Button onClick={() => newCatName.trim() && createCategoryMutation.mutate(newCatName.trim())}
                  disabled={createCategoryMutation.isPending || !newCatName.trim()} className="gap-2 h-10" data-testid="button-create-category"
                >
                  {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Créer
                </Button>
              </div>
            </Card>
            <div className="space-y-2">
              {categories?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Aucune catégorie encore créée.</p>}
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3 border border-border/50" data-testid={`row-category-${cat.id}`}>
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => deleteCategoryMutation.mutate(cat.id)} disabled={deleteCategoryMutation.isPending}
                    data-testid={`button-delete-category-${cat.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── CODES PROMO ───────────────────────────────────────── */}
        {activeTab === "promos" && (
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold mb-6">Codes Promo</h2>
            <Card className="p-6 mb-6">
              <h3 className="font-semibold mb-4">Créer un code promo</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Code</label>
                  <Input placeholder="EX: PROMO10" value={promoForm.code}
                    onChange={(e) => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="h-10" data-testid="input-promo-new-code"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Type de réduction</label>
                  <Select value={promoForm.discountType} onValueChange={(v) => setPromoForm(f => ({ ...f, discountType: v }))}>
                    <SelectTrigger className="h-10 border-2 border-border bg-background text-foreground" data-testid="select-promo-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50">
                      <SelectItem value="percent">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (CFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Valeur de réduction</label>
                  <Input type="number" placeholder={promoForm.discountType === "percent" ? "Ex: 10 (pour 10%)" : "Ex: 2000"}
                    value={promoForm.discountValue} onChange={(e) => setPromoForm(f => ({ ...f, discountValue: e.target.value }))}
                    className="h-10" data-testid="input-promo-value"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nombre max d'utilisations (optionnel)</label>
                  <Input type="number" placeholder="Ex: 100 (illimité si vide)" value={promoForm.maxUses}
                    onChange={(e) => setPromoForm(f => ({ ...f, maxUses: e.target.value }))}
                    className="h-10" data-testid="input-promo-max-uses"
                  />
                </div>
              </div>
              <Button className="mt-4 gap-2" onClick={() => createPromoMutation.mutate(promoForm)}
                disabled={createPromoMutation.isPending || !promoForm.code || !promoForm.discountValue}
                data-testid="button-create-promo"
              >
                {createPromoMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Créer le code
              </Button>
            </Card>
            <div className="space-y-3">
              {promoCodes?.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Aucun code promo créé.</p>}
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
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => togglePromoMutation.mutate({ id: promo.id, active: !promo.active })}
                        title={promo.active ? "Désactiver" : "Activer"} data-testid={`button-toggle-promo-${promo.id}`}
                      >
                        {promo.active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => deletePromoMutation.mutate(promo.id)} disabled={deletePromoMutation.isPending}
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

        {/* ── COMPTABILITÉ ──────────────────────────────────────── */}
        {activeTab === "accounting" && (
          <div className="max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold">Comptabilité</h2>
              <Button className="gap-2" onClick={() => printAccountingReport(allOrders, stats)} data-testid="button-print-accounting">
                <Printer className="h-4 w-4" />
                Imprimer / PDF
              </Button>
            </div>

            {/* Résumé financier */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "CA Total (toutes commandes)", value: `${totalRevenue.toLocaleString("fr-FR")} CFA`, color: "text-blue-600" },
                { label: "CA Commandes livrées", value: `${deliveredRevenue.toLocaleString("fr-FR")} CFA`, color: "text-green-600" },
                { label: "Commandes en attente", value: pendingOrders.length, color: "text-yellow-600" },
                { label: "Commandes annulées", value: cancelledOrders.length, color: "text-red-600" },
              ].map(({ label, value, color }) => (
                <Card key={label} className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </Card>
              ))}
            </div>

            {/* Répartition par mode de paiement */}
            <Card className="p-6 mb-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Répartition par mode de paiement
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">Mode de paiement</th>
                      <th className="text-right py-2 px-3 font-semibold">Nombre</th>
                      <th className="text-right py-2 px-3 font-semibold">Montant total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentStats.map(({ label, count, amount }) => (
                      <tr key={label} className="border-b border-border/40">
                        <td className="py-2 px-3 font-medium">{label}</td>
                        <td className="py-2 px-3 text-right">{count}</td>
                        <td className="py-2 px-3 text-right font-bold">{amount.toLocaleString("fr-FR")} CFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Liste de toutes les commandes */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Historique complet des commandes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold">N°</th>
                      <th className="text-left py-2 px-3 font-semibold">Date</th>
                      <th className="text-left py-2 px-3 font-semibold">Client</th>
                      <th className="text-left py-2 px-3 font-semibold">Paiement</th>
                      <th className="text-left py-2 px-3 font-semibold">Statut</th>
                      <th className="text-right py-2 px-3 font-semibold">Montant</th>
                      <th className="text-right py-2 px-3 font-semibold">Facture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/40 hover:bg-secondary/20">
                        <td className="py-2 px-3 font-mono font-semibold">#{order.id}</td>
                        <td className="py-2 px-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="py-2 px-3 text-muted-foreground truncate max-w-[140px]">{order.email}</td>
                        <td className="py-2 px-3">{order.paymentMethod === "mynita" ? "MyNita" : order.paymentMethod === "amanata" ? "MyAmanata" : "Livraison"}</td>
                        <td className="py-2 px-3"><StatusBadge status={order.approvalStatus} /></td>
                        <td className="py-2 px-3 text-right font-bold text-primary">{Number(order.total).toLocaleString("fr-FR")} CFA</td>
                        <td className="py-2 px-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => printClientInvoice(order)} data-testid={`button-invoice-${order.id}`}>
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* ── MODAL ÉDITION PRODUIT ──────────────────────────────────── */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={(data) => {
            updateProduct.mutate(
              { id: editingProduct.id, data },
              {
                onSuccess: () => {
                  toast({ title: "Produit mis à jour" });
                  setEditingProduct(null);
                },
                onError: () => toast({ title: "Erreur", description: "Impossible de modifier le produit", variant: "destructive" }),
              }
            );
          }}
          saving={updateProduct.isPending}
          categoryList={(categories || []).map(c => c.name)}
        />
      )}
    </div>
  );
}

// ── EDIT PRODUCT MODAL ────────────────────────────────────────────────────────
function EditProductModal({
  product, onClose, onSave, saving, categoryList,
}: {
  product: Product;
  onClose: () => void;
  onSave: (data: Partial<Product>) => void;
  saving: boolean;
  categoryList: string[];
}) {
  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    price: product.price,
    imageUrl: product.imageUrl,
    category: product.category,
    stock: String(product.stock),
    minOrderQty: product.minOrderQty ? String(product.minOrderQty) : "",
  });
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "Max 5 Mo", variant: "destructive" });
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData: base64, fileName: file.name }),
      });
      if (res.ok) {
        const { url } = await res.json();
        setForm(f => ({ ...f, imageUrl: url }));
        toast({ title: "Photo uploadée" });
      } else {
        toast({ title: "Erreur upload", variant: "destructive" });
      }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const minQty = form.minOrderQty ? parseInt(form.minOrderQty) : null;
    onSave({
      name: form.name,
      description: form.description,
      price: form.price,
      imageUrl: form.imageUrl,
      category: form.category,
      stock: parseInt(form.stock),
      minOrderQty: minQty && minQty >= 2 ? minQty : null,
    } as any);
  };

  const cats = categoryList.length > 0 ? categoryList : ["Électronique", "Mode", "Accessoires", "Photographie", "Audio", "Maison"];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <Card className="w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold">Modifier le produit</h2>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-edit">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nom *</label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-edit-name" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[80px]" data-testid="textarea-edit-description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prix (CFA) *</label>
                <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} data-testid="input-edit-price" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock</label>
                <Input type="number" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} data-testid="input-edit-stock" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select value={form.category} onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                data-testid="select-edit-category">
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantité minimum (vente en gros, optionnel)</label>
              <Input type="number" min="2" value={form.minOrderQty}
                onChange={(e) => setForm(f => ({ ...f, minOrderQty: e.target.value }))}
                placeholder="Vide = vente normale"
                data-testid="input-edit-min-order" />
              <p className="text-xs text-muted-foreground mt-1">Mettre ≥ 2 pour activer la vente en gros (ex: 10 pour minimum 10 unités).</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Photo</label>
              <div className="flex items-center gap-3">
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="aperçu" className="h-16 w-16 object-cover rounded-md border" />
                )}
                <div className="flex-1 space-y-2">
                  <Input type="text" value={form.imageUrl}
                    onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="URL ou choisir une photo"
                    data-testid="input-edit-image-url" />
                  <input type="file" accept="image/*" onChange={handleFile}
                    className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-primary file:text-primary-foreground file:font-medium hover:file:bg-primary/90"
                    data-testid="input-edit-image-file" />
                  {uploading && <p className="text-xs text-primary">Upload en cours...</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={onClose} data-testid="button-cancel-edit">
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={saving || uploading} data-testid="button-save-edit">
                {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── CLIENT INVOICE PRINT ──────────────────────────────────────────────────────
function printClientInvoice(order: Order) {
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const paymentLabel = order.paymentMethod === "mynita" ? "MyNita (97120634)" : order.paymentMethod === "amanata" ? "My Amanata (97120634)" : "À la livraison";

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Facture Commande #${order.id}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:30px;max-width:600px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1a1a2e;}
    .logo{font-size:20px;font-weight:bold;color:#1a1a2e;}
    .invoice-title{font-size:14px;color:#666;margin-top:4px;}
    .invoice-info{text-align:right;font-size:12px;color:#444;}
    .section{margin-bottom:20px;}
    .section-title{font-size:13px;font-weight:bold;color:#1a1a2e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;}
    .address-box{background:#f5f5f5;border-radius:6px;padding:12px;font-size:12px;line-height:1.6;}
    table{width:100%;border-collapse:collapse;margin-top:8px;}
    th{background:#1a1a2e;color:white;padding:8px 10px;text-align:left;font-size:11px;}
    td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;}
    .totals{margin-top:16px;border-top:2px solid #1a1a2e;padding-top:12px;}
    .total-row{display:flex;justify-content:space-between;padding:3px 0;font-size:12px;}
    .total-final{font-size:16px;font-weight:bold;color:#1a1a2e;margin-top:6px;padding-top:6px;border-top:1px solid #ddd;}
    .payment-box{margin-top:20px;background:#eef7ff;border:1px solid #c0d8f0;border-radius:6px;padding:12px;font-size:12px;}
    .footer{margin-top:32px;border-top:1px solid #ddd;padding-top:12px;font-size:10px;color:#888;text-align:center;}
    @media print{body{margin:15px;}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Niger Commerce</div><div class="invoice-title">Facture / Reçu de commande</div></div>
    <div class="invoice-info">
      <div><strong>Facture N°</strong> #${order.id}</div>
      <div><strong>Date :</strong> ${orderDate}</div>
      <div><strong>Émise le :</strong> ${now}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Informations client</div>
    <div class="address-box">
      <strong>Email :</strong> ${order.email}<br>
      <strong>Mode de paiement :</strong> ${paymentLabel}<br>
      ${order.address ? `<br><strong>Adresse de livraison :</strong><br>${order.address.replace(/\n/g, "<br>")}` : ""}
    </div>
  </div>
  <div class="section">
    <div class="section-title">Détails</div>
    <div style="font-size:11px;color:#888;">Articles non détaillés — contactez le vendeur pour la liste complète</div>
  </div>
  <div class="totals">
    ${order.promoCode ? `<div class="total-row"><span>Code promo (${order.promoCode})</span><span>- ${Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA</span></div>` : ""}
    <div class="total-row"><span>Livraison</span><span>Gratuite</span></div>
    <div class="total-row total-final"><span>Total payé</span><span>${Number(order.total).toLocaleString("fr-FR")} CFA</span></div>
  </div>
  ${(order.paymentMethod === "mynita" || order.paymentMethod === "amanata") ? `
  <div class="payment-box">
    <strong>Instructions de paiement ${paymentLabel.split("(")[0].trim()} :</strong><br>
    Envoyez <strong>${Number(order.total).toLocaleString("fr-FR")} CFA</strong> au numéro <strong>97120634</strong>
  </div>` : ""}
  <div class="footer">Niger Commerce • Merci pour votre achat ! • Facture générée le ${now}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

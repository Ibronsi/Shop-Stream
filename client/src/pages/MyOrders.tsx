import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useMyOrders } from "@/hooks/use-user";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCancelOrder } from "@/hooks/use-cancel-order";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft, Clock, CheckCircle, XCircle, Package, ChefHat, Truck, Trash2, ChevronDown, ChevronUp, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useOrderItems } from "@/hooks/use-order-items";
import type { Order } from "@shared/schema";

const ORDER_STEPS = [
  { key: "pending",   label: "En attente",    icon: Clock,         color: "text-yellow-500" },
  { key: "accepted",  label: "Acceptée",      icon: CheckCircle,   color: "text-blue-500"   },
  { key: "preparing", label: "Préparation",   icon: ChefHat,       color: "text-orange-500" },
  { key: "ready",     label: "Prête",         icon: Package,       color: "text-purple-500" },
  { key: "delivered", label: "Livrée",        icon: Truck,         color: "text-green-500"  },
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "En attente",     color: "text-yellow-700 dark:text-yellow-300", bg: "bg-yellow-100 dark:bg-yellow-900/40"   },
  accepted:  { label: "Acceptée",      color: "text-blue-700 dark:text-blue-300",    bg: "bg-blue-100 dark:bg-blue-900/40"       },
  preparing: { label: "En préparation", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/40" },
  ready:     { label: "Prête",          color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-100 dark:bg-purple-900/40" },
  delivered: { label: "Livrée",         color: "text-green-700 dark:text-green-300",  bg: "bg-green-100 dark:bg-green-900/40"   },
  cancelled: { label: "Annulée",        color: "text-gray-600 dark:text-gray-400",    bg: "bg-gray-100 dark:bg-gray-800"         },
  rejected:  { label: "Rejetée",       color: "text-red-700 dark:text-red-300",      bg: "bg-red-100 dark:bg-red-900/40"       },
};

function printOrderInvoice(order: Order) {
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const paymentLabel = order.paymentMethod === "mynita" ? "MyNita (97120634)" : order.paymentMethod === "amanata" ? "My Amanata (97120634)" : "À la livraison";
  const statusLabel = STATUS_LABELS[order.approvalStatus]?.label ?? order.approvalStatus;

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Reçu Commande #${order.id}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:32px;max-width:580px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #1a1a2e;}
    .logo{font-size:22px;font-weight:bold;color:#1a1a2e;}
    .subtitle{font-size:12px;color:#666;margin-top:4px;}
    .info-right{text-align:right;font-size:12px;color:#444;line-height:1.7;}
    .section{margin-bottom:18px;}
    .section-title{font-size:11px;font-weight:bold;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
    .box{background:#f7f7f7;border-radius:6px;padding:12px;font-size:12px;line-height:1.7;}
    .status-badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold;background:#e8f5e9;color:#2e7d32;}
    .totals{margin-top:14px;border-top:2px solid #1a1a2e;padding-top:10px;}
    .trow{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;}
    .trow-total{font-size:18px;font-weight:bold;color:#1a1a2e;margin-top:8px;padding-top:8px;border-top:1px solid #ccc;}
    .pay-box{margin-top:18px;background:#eef7ff;border:1px solid #c0d8f0;border-radius:6px;padding:12px;font-size:12px;line-height:1.7;}
    .thanks{margin-top:24px;text-align:center;font-size:14px;color:#1a1a2e;font-weight:bold;}
    .footer{margin-top:16px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#999;text-align:center;}
    @media print{body{margin:16px;}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Niger Commerce</div><div class="subtitle">Reçu de commande</div></div>
    <div class="info-right">
      <div><strong>Commande N°</strong> #${order.id}</div>
      <div><strong>Date :</strong> ${orderDate}</div>
      <div><span class="status-badge">${statusLabel}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Client</div>
    <div class="box">
      <strong>Email :</strong> ${order.email}<br>
      <strong>Paiement :</strong> ${paymentLabel}
      ${order.address ? `<br><br><strong>Adresse :</strong><br>${order.address.replace(/\n/g, "<br>")}` : ""}
    </div>
  </div>

  <div class="totals">
    ${order.promoCode ? `<div class="trow"><span>Code promo (${order.promoCode})</span><span style="color:green">- ${Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA</span></div>` : ""}
    <div class="trow"><span>Livraison</span><span style="color:green">Gratuite</span></div>
    <div class="trow trow-total"><span>TOTAL</span><span>${Number(order.total).toLocaleString("fr-FR")} CFA</span></div>
  </div>

  ${(order.paymentMethod === "mynita" || order.paymentMethod === "amanata") ? `
  <div class="pay-box">
    <strong>Paiement via ${paymentLabel.split("(")[0].trim()} :</strong><br>
    Numéro : <strong>97120634</strong> · Montant : <strong>${Number(order.total).toLocaleString("fr-FR")} CFA</strong>
  </div>` : ""}

  <div class="thanks">Merci pour votre confiance !</div>
  <div class="footer">Niger Commerce · Reçu généré le ${now}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled" || status === "rejected") {
    return (
      <div className="flex items-center gap-2 mt-3">
        <XCircle className={`h-5 w-5 ${status === "cancelled" ? "text-gray-500" : "text-red-500"}`} />
        <span className={`text-sm font-medium ${status === "cancelled" ? "text-gray-500" : "text-red-600"}`}>
          {status === "cancelled" ? "Commande annulée par le client" : "Commande rejetée par l'admin"}
        </span>
      </div>
    );
  }
  const currentIdx = ORDER_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="mt-4">
      <div className="flex items-center gap-0">
        {ORDER_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const done = idx < currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  done ? "bg-primary border-primary" : active ? "border-primary bg-primary/10" : "border-muted-foreground/30 bg-muted/30"
                }`}>
                  <Icon className={`h-4 w-4 ${done ? "text-primary-foreground" : active ? step.color : "text-muted-foreground/40"}`} />
                </div>
                <span className={`text-[10px] text-center leading-tight w-14 ${active ? "font-semibold text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                  {step.label}
                </span>
              </div>
              {idx < ORDER_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 mx-1 ${idx < currentIdx ? "bg-primary" : "bg-muted-foreground/20"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderItemsList({ orderId }: { orderId: number }) {
  const { data: items, isLoading } = useOrderItems(orderId);
  if (isLoading) return <div className="py-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground py-2">Aucun article trouvé.</p>;
  return (
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex justify-between items-center text-sm py-1.5 border-b border-border/30 last:border-0">
          <div>
            <span className="font-medium text-foreground">Produit #{item.productId}</span>
            <span className="text-muted-foreground ml-2">× {item.quantity}</span>
          </div>
          <span className="font-semibold">{(Number(item.price) * item.quantity).toLocaleString("fr-FR")} CFA</span>
        </div>
      ))}
    </div>
  );
}

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
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const canCancel = (status: string) => ["pending", "accepted"].includes(status);

  const handleCancelOrder = (orderId: number) => {
    cancelOrder.mutate(orderId, {
      onSuccess: () => {
        toast({ title: "Commande annulée", description: "Votre commande a été annulée avec succès." });
        setConfirmCancel(null);
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible d'annuler cette commande. Elle est peut-être déjà en préparation.", variant: "destructive" });
      },
    });
  };

  if (!currentUser && !userLoading) { navigate("/login"); return null; }

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

  const sortedOrders = [...(orders || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/"><Button variant="ghost" size="sm" data-testid="button-back"><ChevronLeft className="h-4 w-4" /></Button></Link>
          <h1 className="text-3xl font-bold">Mes Commandes</h1>
          {sortedOrders.length > 0 && (
            <span className="ml-auto text-sm text-muted-foreground">{sortedOrders.length} commande(s)</span>
          )}
        </div>

        {sortedOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Vous n'avez pas encore passé de commande</p>
            <Link href="/"><Button data-testid="button-start-shopping">Commencer à acheter</Button></Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {sortedOrders.map((order) => {
              const statusInfo = STATUS_LABELS[order.approvalStatus] ?? STATUS_LABELS["pending"];
              return (
                <Card key={order.id} className="p-6" data-testid={`card-order-${order.id}`}>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">Commande #{order.id}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusInfo.bg} ${statusInfo.color}`}
                          data-testid={`status-order-${order.id}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <p className="text-sm mt-1">
                        Paiement : <span className="font-medium">
                          {order.paymentMethod === "mynita" ? "MyNita" : order.paymentMethod === "amanata" ? "MyAmanata" : "À la livraison"}
                        </span>
                      </p>
                      {order.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Raison : {order.rejectionReason}</p>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-2xl font-bold text-primary">
                        {Number(order.total).toLocaleString("fr-FR")} CFA
                      </div>

                      {/* Print receipt */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-8"
                        onClick={() => printOrderInvoice(order)}
                        data-testid={`button-print-order-${order.id}`}
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Télécharger reçu
                      </Button>

                      {canCancel(order.approvalStatus) && (
                        <div className="mt-1">
                          {confirmCancel === order.id ? (
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="destructive"
                                onClick={() => handleCancelOrder(order.id)} disabled={cancelOrder.isPending}
                                data-testid={`button-confirm-cancel-${order.id}`}
                              >
                                {cancelOrder.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmer"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setConfirmCancel(null)} disabled={cancelOrder.isPending}>Retour</Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setConfirmCancel(order.id)}
                              className="gap-2" data-testid={`button-cancel-${order.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                              Annuler la commande
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <OrderTimeline status={order.approvalStatus} />

                  <div className="mt-4 pt-4 border-t border-border/40">
                    <button
                      className="flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      data-testid={`button-toggle-items-${order.id}`}
                    >
                      {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {expandedOrder === order.id ? "Masquer les articles" : "Voir les articles"}
                    </button>
                    {expandedOrder === order.id && <OrderItemsList orderId={order.id} />}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSEO } from "@/hooks/use-seo";
import { CheckCircle, Package, Loader2, Home, ClipboardList, Printer } from "lucide-react";
import type { Order } from "@shared/schema";

type OrderItemDetail = {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
};

function printInvoice(order: Order, items: OrderItemDetail[]) {
  const now = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const orderDate = new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const paymentLabel = order.paymentMethod === "mynita" ? "MyNita (97120634)" : order.paymentMethod === "amanata" ? "My Amanata (97120634)" : "À la livraison";

  const itemRows = items.map((item) => `
    <tr>
      <td>Produit #${item.productId}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">${Number(item.price).toLocaleString("fr-FR")} CFA</td>
      <td style="text-align:right;font-weight:bold">${(Number(item.price) * item.quantity).toLocaleString("fr-FR")} CFA</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>Facture Commande #${order.id}</title>
  <style>
    body{font-family:Arial,sans-serif;font-size:13px;color:#111;margin:32px;max-width:600px;}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:3px solid #1a1a2e;}
    .logo{font-size:22px;font-weight:bold;color:#1a1a2e;}
    .subtitle{font-size:13px;color:#555;margin-top:4px;}
    .info-right{text-align:right;font-size:12px;color:#444;line-height:1.7;}
    .section{margin-bottom:22px;}
    .section-title{font-size:12px;font-weight:bold;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;}
    .box{background:#f7f7f7;border-radius:6px;padding:12px;font-size:12px;line-height:1.7;}
    table{width:100%;border-collapse:collapse;margin-top:10px;}
    thead tr{background:#1a1a2e;color:white;}
    th{padding:8px 10px;text-align:left;font-size:11px;}
    td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px;}
    .totals{margin-top:16px;border-top:2px solid #1a1a2e;padding-top:10px;}
    .trow{display:flex;justify-content:space-between;font-size:12px;padding:3px 0;}
    .trow-total{font-size:17px;font-weight:bold;color:#1a1a2e;margin-top:8px;padding-top:8px;border-top:1px solid #ccc;}
    .pay-box{margin-top:20px;background:#eef7ff;border:1px solid #c0d8f0;border-radius:6px;padding:14px;font-size:12px;line-height:1.6;}
    .thanks{margin-top:28px;text-align:center;font-size:14px;color:#1a1a2e;font-weight:bold;}
    .footer{margin-top:18px;border-top:1px solid #ddd;padding-top:10px;font-size:10px;color:#999;text-align:center;}
    @media print{body{margin:16px;}}
  </style></head><body>
  <div class="header">
    <div><div class="logo">Niger Commerce</div><div class="subtitle">Facture & Reçu de commande</div></div>
    <div class="info-right">
      <div><strong>Facture N°</strong> #${order.id}</div>
      <div><strong>Date commande :</strong> ${orderDate}</div>
      <div><strong>Émise le :</strong> ${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Informations client</div>
    <div class="box">
      <strong>Email :</strong> ${order.email}<br>
      <strong>Mode de paiement :</strong> ${paymentLabel}<br>
      ${order.address ? `<br><strong>Adresse de livraison :</strong><br>${order.address.replace(/\n/g, "<br>")}` : ""}
    </div>
  </div>

  ${items.length > 0 ? `
  <div class="section">
    <div class="section-title">Articles commandés</div>
    <table>
      <thead><tr><th>Produit</th><th style="text-align:center">Qté</th><th style="text-align:right">Prix unit.</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>` : ""}

  <div class="totals">
    ${order.promoCode ? `<div class="trow"><span>Code promo (${order.promoCode})</span><span style="color:green">- ${Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA</span></div>` : ""}
    <div class="trow"><span>Livraison</span><span style="color:green">Gratuite</span></div>
    <div class="trow trow-total"><span>TOTAL PAYÉ</span><span>${Number(order.total).toLocaleString("fr-FR")} CFA</span></div>
  </div>

  ${(order.paymentMethod === "mynita" || order.paymentMethod === "amanata") ? `
  <div class="pay-box">
    <strong>Instructions de paiement ${paymentLabel.split("(")[0].trim()} :</strong><br>
    1. Ouvrez votre application ${order.paymentMethod === "mynita" ? "MyNita" : "My Amanata"}<br>
    2. Sélectionnez "Transfert d'argent"<br>
    3. Entrez le numéro : <strong>97120634</strong><br>
    4. Entrez le montant : <strong>${Number(order.total).toLocaleString("fr-FR")} CFA</strong><br>
    5. Confirmez le paiement
  </div>` : ""}

  <div class="thanks">Merci pour votre achat !</div>
  <div class="footer">Niger Commerce · Boutique en ligne · Facture générée le ${now}</div>
  <script>window.onload=()=>{window.print();}</script>
  </body></html>`;

  const win = window.open("", "_blank");
  if (win) { win.document.write(html); win.document.close(); }
}

export default function OrderConfirmation() {
  const [, params] = useRoute("/order-confirmation/:id");
  const orderId = params ? parseInt(params.id) : 0;

  useSEO({ title: "Commande confirmée", description: "Votre commande a été passée avec succès." });

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
    order.paymentMethod === "mynita"  ? "MyNita (97120634)" :
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
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Commande confirmée !</h1>
          <p className="text-muted-foreground">
            Merci pour votre achat. Votre commande #{order.id} a bien été reçue.
          </p>
        </div>

        {/* Order Summary */}
        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Récapitulatif de la commande
          </h2>

          {items && items.length > 0 && (
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-border/40 last:border-0">
                  <div>
                    <p className="font-medium text-foreground">Produit #{item.productId}</p>
                    <p className="text-sm text-muted-foreground">Qté : {item.quantity}</p>
                  </div>
                  <p className="font-semibold">
                    {(Number(item.price) * item.quantity).toLocaleString("fr-FR")} CFA
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-4 border-t border-border">
            {order.promoCode && (
              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                <span>Code promo ({order.promoCode})</span>
                <span>- {Number(order.discount ?? 0).toLocaleString("fr-FR")} CFA</span>
              </div>
            )}
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

        {/* Delivery Info */}
        <Card className="p-6 mb-6">
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
            {order.address && (
              <div>
                <p className="text-muted-foreground mb-1">Adresse de livraison</p>
                <p className="font-medium whitespace-pre-line text-sm bg-secondary/40 rounded-lg p-3">{order.address}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Mobile money instructions */}
        {(order.paymentMethod === "mynita" || order.paymentMethod === "amanata") && (
          <Card className="p-6 mb-6 border-primary/30 bg-primary/5">
            <h2 className="font-semibold text-lg mb-3 text-primary">
              Instructions de paiement {paymentLabel.split("(")[0].trim()}
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
              <li>Ouvrez votre application {order.paymentMethod === "mynita" ? "MyNita" : "My Amanata"}</li>
              <li>Sélectionnez "Transfert d'argent"</li>
              <li>Entrez le numéro : <span className="font-bold text-primary">97120634</span></li>
              <li>Entrez le montant : <span className="font-bold text-primary">{Number(order.total).toLocaleString("fr-FR")} CFA</span></li>
              <li>Confirmez le paiement</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">Votre commande sera traitée dès réception du paiement.</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2"
            onClick={() => printInvoice(order, items || [])}
            data-testid="button-print-invoice"
          >
            <Printer className="h-4 w-4" />
            Télécharger la facture
          </Button>
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

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, Tag, CheckCircle, XCircle, LogIn, UserPlus } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { PromoCode } from "@shared/schema";

const checkoutSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville est obligatoire"),
  quartier: z.string().min(2, "Le quartier est obligatoire"),
  name: z.string().min(2, "Le nom complet est obligatoire"),
  phone: z.string().min(8, "Le numéro de téléphone est obligatoire"),
  paymentMethod: z.enum(["delivery", "mynita", "amanata"]).default("delivery"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  useSEO({
    title: "Paiement",
    description: "Finalisez votre commande en toute sécurité avec MyNita, MyAmanata ou paiement à la livraison.",
    keywords: "paiement, commande, MyNita, MyAmanata",
  });

  const { toast } = useToast();
  const sessionId = useSession();
  const { data: cartItems } = useCart(sessionId);
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const createOrder = useCreateOrder();

  const [promoInput, setPromoInput] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState("");

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      address: "",
      city: "",
      quartier: "",
      name: "",
      phone: "",
      paymentMethod: "delivery",
    },
  });

  // Pré-remplir le formulaire avec les infos du compte connecté
  useEffect(() => {
    if (currentUser) {
      const u = currentUser as any;
      form.reset({
        email: u.email || "",
        name: u.name || [u.firstName, u.lastName].filter(Boolean).join(" ") || "",
        phone: u.phone || "",
        address: u.address || "",
        city: u.city || "",
        quartier: u.district || "",
        paymentMethod: "delivery",
      });
    }
  }, [currentUser]);

  const subtotal = cartItems?.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  ) ?? 0;

  const discount = appliedPromo
    ? appliedPromo.discountType === "percent"
      ? Math.round((subtotal * Number(appliedPromo.discountValue)) / 100)
      : Math.min(Number(appliedPromo.discountValue), subtotal)
    : 0;

  const total = Math.max(0, subtotal - discount);

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promo-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        setPromoError(err.message || "Code invalide");
        setAppliedPromo(null);
      } else {
        const promo: PromoCode = await res.json();
        setAppliedPromo(promo);
        setPromoError("");
        toast({ title: "Code promo appliqué !", description: `Réduction de ${promo.discountType === "percent" ? promo.discountValue + "%" : Number(promo.discountValue).toLocaleString("fr-FR") + " CFA"}` });
      }
    } catch {
      setPromoError("Erreur de connexion");
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const onSubmit = (data: CheckoutForm) => {
    if (!sessionId || !cartItems || cartItems.length === 0) return;
    if (!currentUser) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour passer une commande.",
        variant: "destructive",
      });
      return;
    }

    let paymentDetails = "";
    if (data.paymentMethod === "mynita") {
      paymentDetails = "MyNita: 97120634";
    } else if (data.paymentMethod === "amanata") {
      paymentDetails = "My Amanata: 97120634";
    }

    createOrder.mutate({
      sessionId,
      email: data.email,
      address: `${data.name}\nTél: ${data.phone}\n${data.address}, ${data.quartier}\n${data.city}`,
      total: total.toString(),
      paymentMethod: data.paymentMethod,
      paymentDetails,
      promoCode: appliedPromo?.code,
      discount: discount > 0 ? discount.toString() : undefined,
    });
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Votre panier est vide</h2>
          <Link href="/"><Button>Aller faire des achats</Button></Link>
        </div>
      </div>
    );
  }

  // Blocage : commande réservée aux utilisateurs connectés
  if (!userLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-20">
          <div className="max-w-md mx-auto bg-card rounded-2xl border border-border/50 shadow-lg p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Connexion requise</h2>
            <p className="text-muted-foreground mb-6">
              Vous devez avoir un compte pour finaliser votre commande. Connectez-vous ou créez un compte gratuitement — votre panier sera conservé.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/login">
                <Button className="w-full h-12" data-testid="button-go-login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Se connecter
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" className="w-full h-12" data-testid="button-go-register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer un compte
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="ghost" className="w-full" data-testid="button-back-cart">
                  Retour au panier
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          
          {/* Checkout Form */}
          <div>
            <h1 className="font-display text-3xl font-bold mb-8">Finaliser la commande</h1>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Moussa Mahamadou" {...field} className="h-11 rounded-lg" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 97000000" type="tel" {...field} className="h-11 rounded-lg" data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse email</FormLabel>
                      <FormControl>
                        <Input placeholder="exemple@email.com" type="email" {...field} className="h-11 rounded-lg" data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Niamey" {...field} className="h-11 rounded-lg" data-testid="input-city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quartier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quartier</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Plateau, Yantala, Koira Kano..." {...field} className="h-11 rounded-lg" data-testid="input-quartier" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse précise / Repère</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Près du marché, rue 5..." {...field} className="h-11 rounded-lg" data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode de paiement</FormLabel>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "delivery")}>
                          <input type="radio" checked={field.value === "delivery"} onChange={() => form.setValue("paymentMethod", "delivery")} className="cursor-pointer" data-testid="radio-delivery" />
                          <div>
                            <p className="font-semibold">À la réception</p>
                            <p className="text-sm text-muted-foreground">Payer en espèces à la livraison</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "mynita")}>
                          <input type="radio" checked={field.value === "mynita"} onChange={() => form.setValue("paymentMethod", "mynita")} className="cursor-pointer" data-testid="radio-mynita" />
                          <div>
                            <p className="font-semibold">MyNita</p>
                            <p className="text-sm text-muted-foreground">Numéro: 97120634</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "amanata")}>
                          <input type="radio" checked={field.value === "amanata"} onChange={() => form.setValue("paymentMethod", "amanata")} className="cursor-pointer" data-testid="radio-amanata" />
                          <div>
                            <p className="font-semibold">My Amanata</p>
                            <p className="text-sm text-muted-foreground">Numéro: 97120634</p>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl"
                    disabled={createOrder.isPending}
                    data-testid="button-place-order"
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {createOrder.isPending ? "Traitement en cours..." : `Confirmer — ${total.toLocaleString("fr-FR")} CFA`}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Paiement sécurisé et crypté
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Preview */}
          <div className="space-y-4">
            <div className="bg-secondary/30 rounded-2xl p-8 border border-border/50">
              <h2 className="font-display text-xl font-bold mb-6">Votre Commande</h2>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="h-16 w-16 bg-white rounded-md overflow-hidden flex-shrink-0">
                      <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-foreground">{item.product.name}</p>
                      <p className="text-muted-foreground">Qté: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">
                      {(Number(item.product.price) * item.quantity).toLocaleString("fr-FR")} CFA
                    </p>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-4">
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-semibold text-sm">{appliedPromo.code}</span>
                      <span className="text-xs">— {appliedPromo.discountType === "percent" ? `${appliedPromo.discountValue}%` : `${Number(appliedPromo.discountValue).toLocaleString("fr-FR")} CFA`} de réduction</span>
                    </div>
                    <button onClick={removePromo} className="text-green-700 dark:text-green-400 hover:text-red-500 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Code promo"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyPromo())}
                          className="pl-9 h-10 text-sm"
                          data-testid="input-promo-code"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 text-sm"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        data-testid="button-apply-promo"
                      >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
                      </Button>
                    </div>
                    {promoError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toLocaleString("fr-FR")} CFA</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Réduction ({appliedPromo?.code})</span>
                    <span>- {discount.toLocaleString("fr-FR")} CFA</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-primary font-medium">Gratuite</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 text-primary">
                  <span>Total</span>
                  <span>{total.toLocaleString("fr-FR")} CFA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

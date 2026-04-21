import { useRoute } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ArrowLeft, ShieldCheck, Truck, Clock, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";

export default function ProductDetails() {
  const [, params] = useRoute("/product/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);

  useSEO({
    title: product ? product.name : "Produit",
    description: product ? product.description : "Découvrez nos produits premium",
    keywords: product ? `${product.name}, ${product.category}` : "produits",
    ogImage: product?.imageUrl,
  });
  const sessionId = useSession();
  const addToCart = useAddToCart();
  const isWholesale = !!(product?.minOrderQty && product.minOrderQty >= 2);
  const minQty = isWholesale ? product!.minOrderQty! : 1;
  const [quantity, setQuantity] = useState(minQty);

  const handleAddToCart = () => {
    if (!product || !sessionId) return;
    const qty = isWholesale ? Math.max(quantity, minQty) : quantity;
    addToCart.mutate({
      productId: product.id,
      quantity: qty,
      sessionId,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h2 className="text-2xl font-bold text-foreground">Produit introuvable</h2>
        <Link href="/" className="text-primary hover:underline">Retour à la boutique</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Link>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Section */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary shadow-lg">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details Section */}
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-accent uppercase tracking-widest mb-3">
              {product.category}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-light text-primary mb-4">
              {Number(product.price).toLocaleString("fr-FR")} CFA
            </p>

            {/* Badge Vente en gros */}
            {isWholesale && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-start gap-3" data-testid="badge-wholesale-detail">
                <Package className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-amber-900 dark:text-amber-200">
                    Produit vendu en gros
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    Quantité minimum à commander : <strong>{minQty} unités</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Sélecteur de quantité */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Quantité</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                  disabled={quantity <= minQty}
                  data-testid="button-qty-minus">−</Button>
                <input type="number" value={quantity} min={minQty} max={product.stock}
                  onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                  className="w-20 h-10 text-center border border-input rounded-md bg-background text-foreground"
                  data-testid="input-quantity"
                />
                <Button type="button" variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  data-testid="button-qty-plus">+</Button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-8">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-green-600">
                    {product.stock} en stock
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm font-semibold text-red-600">
                    Rupture de stock
                  </span>
                </div>
              )}
            </div>
            
            <div className="prose prose-stone text-muted-foreground mb-10">
              <p>{product.description}</p>
            </div>

            <div className="flex gap-4 mb-10">
              <Button 
                onClick={handleAddToCart}
                disabled={addToCart.isPending || product.stock === 0}
                size="lg"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-semibold rounded-xl shadow-lg shadow-primary/20"
                data-testid="button-add-to-cart"
              >
                {addToCart.isPending ? "Ajout en cours..." : (
                  <>
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Ajouter au panier
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-border">
              <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-xl">
                <Truck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-semibold">Livraison gratuite</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-semibold">Garantie 2 ans</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-xl">
                <Clock className="h-6 w-6 text-primary mb-2" />
                <span className="text-sm font-semibold">Retour 30 jours</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

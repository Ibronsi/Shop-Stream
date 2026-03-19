import { useRoute } from "wouter";
import { useProduct } from "@/hooks/use-products";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ArrowLeft, ShieldCheck, Truck, Clock } from "lucide-react";
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

  const handleAddToCart = () => {
    if (!product || !sessionId) return;
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
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

import { useRoute } from "wouter";
import { useProduct, useProductVariants } from "@/hooks/use-products";
import { useSEO } from "@/hooks/use-seo";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, ArrowLeft, ShieldCheck, Truck, Clock, Package } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Link } from "wouter";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { assetUrl } from "@/lib/api";

export default function ProductDetails() {
  const [, params] = useRoute("/product/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: product, isLoading, error } = useProduct(id);
  const { data: variants = [] } = useProductVariants(id);

  // Les tailles et couleurs disponibles, déduites des variantes du produit.
  const sizes = useMemo(
    () => Array.from(new Set(variants.map((v) => v.size).filter((s): s is string => !!s))),
    [variants],
  );
  const colors = useMemo(
    () =>
      Array.from(new Map(variants.filter((v) => v.color).map((v) => [v.color, v.colorHex])).entries()),
    [variants],
  );
  const hasVariants = variants.length > 0;
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Présélectionne automatiquement quand il n'y a qu'un seul choix possible.
  useEffect(() => {
    if (sizes.length === 1) setSelectedSize(sizes[0]);
  }, [sizes]);
  useEffect(() => {
    if (colors.length === 1) setSelectedColor(colors[0][0]);
  }, [colors]);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return (
      variants.find(
        (v) =>
          (sizes.length === 0 || v.size === selectedSize) &&
          (colors.length === 0 || v.color === selectedColor),
      ) ?? null
    );
  }, [variants, hasVariants, sizes, colors, selectedSize, selectedColor]);

  const variantSelectionIncomplete =
    hasVariants && ((sizes.length > 0 && !selectedSize) || (colors.length > 0 && !selectedColor));

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
    if (variantSelectionIncomplete) return;
    const qty = isWholesale ? Math.max(quantity, minQty) : quantity;
    addToCart.mutate({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      quantity: qty,
      sessionId,
    });
  };

  const effectiveStock = hasVariants ? (selectedVariant?.stock ?? 0) : (product?.stock ?? 0);

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
              src={assetUrl(product.imageUrl)}
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

            {/* Sélecteur de taille */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Taille</label>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`h-10 min-w-10 px-3 rounded-md border text-sm font-medium transition-colors ${
                        selectedSize === size
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-foreground hover:border-primary"
                      }`}
                      data-testid={`button-size-${size}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sélecteur de couleur */}
            {colors.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(([color, hex]) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      title={color ?? undefined}
                      className={`h-10 px-3 rounded-md border text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedColor === color
                          ? "border-primary bg-primary/10"
                          : "border-input bg-background hover:border-primary"
                      }`}
                      data-testid={`button-color-${color}`}
                    >
                      {hex && (
                        <span
                          className="h-4 w-4 rounded-full border border-border shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                      )}
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variantSelectionIncomplete && (
              <p className="text-sm text-amber-600 mb-4">
                Choisissez {sizes.length > 0 && !selectedSize ? "une taille" : ""}
                {sizes.length > 0 && !selectedSize && colors.length > 0 && !selectedColor ? " et " : ""}
                {colors.length > 0 && !selectedColor ? "une couleur" : ""} avant de continuer.
              </p>
            )}

            {/* Sélecteur de quantité */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Quantité</label>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                  disabled={quantity <= minQty}
                  data-testid="button-qty-minus">−</Button>
                <input type="number" value={quantity} min={minQty} max={effectiveStock}
                  onChange={(e) => setQuantity(Math.max(minQty, parseInt(e.target.value) || minQty))}
                  className="w-20 h-10 text-center border border-input rounded-md bg-background text-foreground"
                  data-testid="input-quantity"
                />
                <Button type="button" variant="outline" size="icon" className="h-10 w-10"
                  onClick={() => setQuantity((q) => Math.min(effectiveStock, q + 1))}
                  disabled={quantity >= effectiveStock}
                  data-testid="button-qty-plus">+</Button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="mb-8">
              {variantSelectionIncomplete ? (
                <span className="text-sm text-muted-foreground">Sélectionnez une variante pour voir le stock</span>
              ) : effectiveStock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-semibold text-green-600">
                    {effectiveStock} en stock
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
                disabled={addToCart.isPending || variantSelectionIncomplete || effectiveStock === 0}
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

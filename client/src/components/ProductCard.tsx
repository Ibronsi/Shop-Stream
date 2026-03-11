import { Link } from "wouter";
import { type Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useAddToCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const sessionId = useSession();
  const addToCart = useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if clicking button inside link
    e.stopPropagation();
    if (!sessionId) return;
    
    addToCart.mutate({
      productId: product.id,
      quantity: 1,
      sessionId,
    });
  };

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <Link href={`/product/${product.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Rupture de stock</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">
                {product.category}
              </p>
              <h3 className="font-display font-bold text-lg text-foreground leading-tight">
                {product.name}
              </h3>
            </div>
            <span className="font-semibold text-lg text-primary shrink-0">
              ${product.price}
            </span>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
            {product.description}
          </p>
          {/* Stock Indicator */}
          <div className="mb-3">
            {product.stock > 0 ? (
              <span className="text-xs font-semibold text-green-600">
                ✓ {product.stock} en stock
              </span>
            ) : (
              <span className="text-xs font-semibold text-red-600">
                Rupture de stock
              </span>
            )}
          </div>
          <div className="pt-2">
            <Button 
              onClick={handleAddToCart}
              disabled={addToCart.isPending || product.stock === 0}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addToCart.isPending ? (
                "Adding..."
              ) : (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>
      </Link>
    </div>
  );
}

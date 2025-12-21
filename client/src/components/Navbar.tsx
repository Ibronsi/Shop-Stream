import { Link } from "wouter";
import { ShoppingCart, Package, Settings, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const sessionId = useSession();
  const { data: cartItems } = useCart(sessionId);
  
  const itemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:scale-105">
            <Package className="h-5 w-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-foreground">
            LuxeStore
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hidden md:block"
          >
            Shop
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/admin/dashboard">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex gap-2"
                data-testid="button-admin-dashboard"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link href="/admin">
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex gap-2"
                data-testid="button-admin"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden md:inline">Ajouter</span>
              </Button>
            </Link>
          </div>
          <Link 
            href="/cart" 
            className="relative p-2 text-foreground hover:text-primary transition-colors"
            data-testid="link-cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center animate-in zoom-in duration-300">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}

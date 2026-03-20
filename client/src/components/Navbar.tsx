import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, Settings, Plus, LogOut, User, History, Menu, X, LayoutDashboard, ClipboardList, Home } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function Navbar() {
  const sessionId = useSession();
  const { data: cartItems } = useCart(sessionId);
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Déconnexion réussie" });
        setMenuOpen(false);
        navigate("/");
      },
    });
  };

  const close = () => setMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={close}>
            <div className="bg-primary text-primary-foreground p-2 rounded-lg transition-transform group-hover:scale-105">
              <Package className="h-5 w-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-foreground">
              LuxeStore
            </span>
          </Link>

          {/* Right side icons */}
          <div className="flex items-center gap-2">
            {/* Cart (always visible) */}
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

            {/* Hamburger button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-menu"
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={close}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">LuxeStore</span>
          </div>
          <Button variant="ghost" size="icon" onClick={close} data-testid="button-close-menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User info */}
        {currentUser && (
          <div className="px-5 py-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                {currentUser.role === "admin" && (
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Admin</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <div className="flex flex-col p-4 gap-1 overflow-y-auto">

          {/* Common links */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Navigation</p>

          <Link href="/" onClick={close}>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-home">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-medium">Accueil</span>
            </button>
          </Link>

          <Link href="/cart" onClick={close}>
            <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-cart">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="font-medium">Panier</span>
              {itemCount > 0 && (
                <span className="ml-auto bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{itemCount}</span>
              )}
            </button>
          </Link>

          {currentUser ? (
            <>
              <Link href="/my-orders" onClick={close}>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-orders">
                  <History className="h-5 w-5 text-primary" />
                  <span className="font-medium">Mes Commandes</span>
                </button>
              </Link>

              <Link href="/profile" onClick={close}>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-profile">
                  <User className="h-5 w-5 text-primary" />
                  <span className="font-medium">Mon Profil</span>
                </button>
              </Link>

              {/* Admin section */}
              {currentUser.role === "admin" && (
                <>
                  <div className="border-t border-border my-2" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">Administration</p>

                  <Link href="/admin/dashboard" onClick={close}>
                    <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-dashboard">
                      <LayoutDashboard className="h-5 w-5 text-primary" />
                      <span className="font-medium">Dashboard</span>
                    </button>
                  </Link>

                  <Link href="/admin" onClick={close}>
                    <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-add-product">
                      <Plus className="h-5 w-5 text-primary" />
                      <span className="font-medium">Ajouter un produit</span>
                    </button>
                  </Link>

                  <Link href="/admin/orders" onClick={close}>
                    <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left" data-testid="menu-link-admin-orders">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <span className="font-medium">Gérer les commandes</span>
                    </button>
                  </Link>
                </>
              )}

              <div className="border-t border-border my-2" />

              <button
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-left"
                onClick={handleLogout}
                disabled={logout.isPending}
                data-testid="menu-button-logout"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Déconnexion</span>
              </button>
            </>
          ) : (
            <>
              <div className="border-t border-border my-2" />
              <Link href="/login" onClick={close}>
                <Button className="w-full mt-2" data-testid="menu-button-login">
                  Connexion
                </Button>
              </Link>
              <Link href="/register" onClick={close}>
                <Button variant="outline" className="w-full mt-2" data-testid="menu-button-register">
                  Créer un compte
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background">
          <div className="flex justify-center gap-6 text-xs text-muted-foreground">
            <Link href="/about" onClick={close} className="hover:text-primary transition-colors">À propos</Link>
            <Link href="/contact" onClick={close} className="hover:text-primary transition-colors">Contact</Link>
            <Link href="/terms" onClick={close} className="hover:text-primary transition-colors">CGU</Link>
          </div>
        </div>
      </div>
    </>
  );
}

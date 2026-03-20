import { Link, useLocation } from "wouter";
import {
  ShoppingCart, Package, LogOut, User, History,
  Menu, X, LayoutDashboard, ClipboardList, Home,
  Plus, Info, Phone, FileText, CreditCard, Settings
} from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  testId?: string;
};

function NavLink({ href, label, icon, badge, testId, onClick }: NavItem & { onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}>
      <button
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/60 transition-colors text-left group"
        data-testid={testId}
      >
        <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
        <span className="font-medium text-foreground flex-1">{label}</span>
        {badge && badge > 0 ? (
          <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>
        ) : null}
      </button>
    </Link>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pt-4 pb-1">
      {title}
    </p>
  );
}

function Divider() {
  return <div className="border-t border-border my-2" />;
}

export function Navbar() {
  const sessionId = useSession();
  const { data: cartItems } = useCart(sessionId);
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const itemCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;
  const isAdmin = currentUser?.role === "admin";

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Déconnexion réussie" });
        close();
        navigate("/");
      },
    });
  };

  return (
    <>
      {/* Top bar */}
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

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-foreground hover:text-primary transition-colors" data-testid="link-cart">
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)} data-testid="button-menu" aria-label="Menu">
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={close} />
      )}

      {/* Drawer */}
      <div className={`fixed top-0 right-0 z-50 h-full w-72 bg-background border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${menuOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
              <Package className="h-4 w-4" />
            </div>
            <span className="font-display font-bold text-lg">LuxeStore</span>
          </div>
          <Button variant="ghost" size="icon" onClick={close} data-testid="button-close-menu">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User badge */}
        {currentUser && (
          <div className="px-5 py-3 border-b border-border bg-secondary/30 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isAdmin ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {isAdmin ? "Administrateur" : "Client"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable nav content */}
        <div className="flex-1 overflow-y-auto px-3 py-2">

          {/* ── BOUTIQUE ── */}
          <SectionTitle title="Boutique" />
          <NavLink href="/" label="Accueil" icon={<Home className="h-5 w-5" />} testId="menu-link-home" onClick={close} />
          <NavLink href="/cart" label="Panier" icon={<ShoppingCart className="h-5 w-5" />} badge={itemCount} testId="menu-link-cart" onClick={close} />

          {/* ── MON COMPTE (connecté) ── */}
          {currentUser && (
            <>
              <Divider />
              <SectionTitle title="Mon Compte" />
              <NavLink href="/my-orders" label="Mes Commandes" icon={<History className="h-5 w-5" />} testId="menu-link-orders" onClick={close} />
              <NavLink href="/checkout" label="Passer une commande" icon={<CreditCard className="h-5 w-5" />} testId="menu-link-checkout" onClick={close} />
              <NavLink href="/profile" label="Mon Profil" icon={<User className="h-5 w-5" />} testId="menu-link-profile" onClick={close} />
            </>
          )}

          {/* ── ADMINISTRATION (admin seulement) ── */}
          {isAdmin && (
            <>
              <Divider />
              <SectionTitle title="Administration" />
              <NavLink href="/admin/dashboard" label="Dashboard" icon={<LayoutDashboard className="h-5 w-5" />} testId="menu-link-dashboard" onClick={close} />
              <NavLink href="/admin" label="Ajouter un produit" icon={<Plus className="h-5 w-5" />} testId="menu-link-add-product" onClick={close} />
              <NavLink href="/admin/orders" label="Gérer les commandes" icon={<ClipboardList className="h-5 w-5" />} testId="menu-link-admin-orders" onClick={close} />
              <NavLink href="/admin/dashboard" label="Paramètres du site" icon={<Settings className="h-5 w-5" />} testId="menu-link-settings" onClick={close} />
            </>
          )}

          {/* ── INFORMATIONS ── */}
          <Divider />
          <SectionTitle title="Informations" />
          <NavLink href="/about" label="À propos" icon={<Info className="h-5 w-5" />} testId="menu-link-about" onClick={close} />
          <NavLink href="/contact" label="Contact" icon={<Phone className="h-5 w-5" />} testId="menu-link-contact" onClick={close} />
          <NavLink href="/terms" label="Conditions d'utilisation" icon={<FileText className="h-5 w-5" />} testId="menu-link-terms" onClick={close} />

          {/* ── AUTH ── */}
          <Divider />
          {currentUser ? (
            <button
              className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors text-left"
              onClick={handleLogout}
              disabled={logout.isPending}
              data-testid="menu-button-logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Déconnexion</span>
            </button>
          ) : (
            <div className="space-y-2 pb-4">
              <Link href="/login" onClick={close}>
                <Button className="w-full" data-testid="menu-button-login">Connexion</Button>
              </Link>
              <Link href="/register" onClick={close}>
                <Button variant="outline" className="w-full" data-testid="menu-button-register">Créer un compte</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

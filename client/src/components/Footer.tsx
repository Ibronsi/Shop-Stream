import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30 py-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-3">À Propos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">À Propos de Nous</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Nous Contacter</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Légal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-primary transition-colors">Conditions d'Utilisation</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Service</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-primary transition-colors">Magasiner</Link></li>
              <li><Link href="/my-orders" className="hover:text-primary transition-colors">Mes Commandes</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Paiements</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>MyNita</li>
              <li>MyAmanata</li>
              <li>Livraison</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/40 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 LuxeStore. Tous droits réservés. | Niger</p>
        </div>
      </div>
    </footer>
  );
}

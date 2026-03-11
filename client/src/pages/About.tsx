import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";

export default function About() {
  useSEO({
    title: "À Propos de LuxeStore | Marché Nigérien",
    description: "Découvrez LuxeStore, votre plateforme e-commerce de confiance au Niger.",
    keywords: "à propos, luxestore, niger, ecommerce",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">À Propos de LuxeStore</h1>

        <section className="space-y-8 text-foreground">
          <div>
            <h2 className="text-2xl font-semibold mb-3">Notre Histoire</h2>
            <p className="text-muted-foreground leading-relaxed">
              LuxeStore est née d'une vision simple : apporter une expérience d'achat en ligne de qualité au marché nigérien. 
              Nous croyons que chaque client mérite un service fiable, des produits de qualité et des paiements sécurisés adaptés à la région.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Notre Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              Offrir une plateforme e-commerce accessible, sécurisée et fiable qui connecte les acheteurs avec une variété de produits de qualité. 
              Nous nous engageons à fournir un service client excellent et à supporter les méthodes de paiement locales comme MyNita et MyAmanata.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Nos Valeurs</h2>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start">
                <span className="font-semibold mr-2">✓</span>
                <span><strong>Intégrité:</strong> Nous agissons avec honnêteté et transparence dans toutes nos transactions.</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">✓</span>
                <span><strong>Qualité:</strong> Nous offrons des produits et des services de la meilleure qualité.</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">✓</span>
                <span><strong>Accessibilité:</strong> Nous rendons le commerce électronique accessible à tous au Niger.</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">✓</span>
                <span><strong>Innovation:</strong> Nous améliorons continuellement notre plateforme pour mieux servir nos clients.</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Paiements Locaux</h2>
            <p className="text-muted-foreground leading-relaxed">
              LuxeStore accepte les paiements via <strong>MyNita</strong> et <strong>MyAmanata</strong>, les solutions de paiement mobiles les plus populaires au Niger. 
              Nous facilitons ainsi vos transactions de manière simple et sécurisée.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Gestion des Stocks</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tous nos produits sont gérés avec précision pour garantir la disponibilité. Les stocks sont vérifiés en temps réel pour chaque commande.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

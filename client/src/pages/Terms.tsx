import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";

export default function Terms() {
  useSEO({
    title: "Conditions d'Utilisation | LuxeStore",
    description: "Consultez les conditions d'utilisation de LuxeStore.",
    keywords: "conditions, utilisation, termes, politique",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Conditions d'Utilisation</h1>

        <section className="space-y-6 text-foreground">
          <div>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptation des conditions</h2>
            <p className="text-muted-foreground">
              En utilisant LuxeStore, vous acceptez l'intégralité de ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">2. Utilisation du service</h2>
            <p className="text-muted-foreground">
              Vous vous engagez à utiliser LuxeStore uniquement à des fins légales et de manière qui ne viole pas les droits d'autrui ou ne restreint leur utilisation et leur jouissance du site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">3. Compte utilisateur</h2>
            <p className="text-muted-foreground">
              Lors de la création d'un compte, vous fournissez des informations exactes et à jour. Vous êtes responsable de maintenir la confidentialité de votre mot de passe et de toutes les activités sous votre compte.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">4. Produits et prix</h2>
            <p className="text-muted-foreground">
              Tous les produits sont présentés à titre informatif. Les prix sont sujets à modification sans préavis. LuxeStore se réserve le droit de limiter les quantités.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">5. Paiements</h2>
            <p className="text-muted-foreground">
              Les paiements peuvent être effectués via les méthodes disponibles sur notre site, notamment MyNita et MyAmanata. En procédant au paiement, vous acceptez nos conditions de paiement.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">6. Limitation de responsabilité</h2>
            <p className="text-muted-foreground">
              LuxeStore ne sera pas responsable des dommages directs, indirects, accessoires ou consécutifs résultant de votre utilisation ou de votre incapacité à utiliser le site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">7. Modifications des conditions</h2>
            <p className="text-muted-foreground">
              LuxeStore se réserve le droit de modifier ces conditions à tout moment. Les modifications seront effectives dès leur publication sur le site.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">8. Contact</h2>
            <p className="text-muted-foreground">
              Pour toute question concernant ces conditions, veuillez nous contacter via la page de contact.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/use-products";
import { useSEO } from "@/hooks/use-seo";
import { ProductCard } from "@/components/ProductCard";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Filter, X, Search } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["Electronics", "Fashion", "Accessories", "Photography", "Audio", "Home"];
const PRODUCTS_PER_PAGE = 12;

export default function Home() {
  useSEO({
    title: "Accueil",
    description: "Découvrez notre collection de produits premium. Électronique, mode, accessoires et bien plus.",
    keywords: "produits, boutique, électronique, mode, accessoires, Niger",
  });

  const { data: allProducts, isLoading, error } = useProducts();
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500000);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => {
    return (allProducts || []).filter(product => {
      const price = parseFloat(product.price);
      const rating = parseFloat(product.rating || "0");
      const matchesSearch = !search || product.name.toLowerCase().includes(search.toLowerCase()) || product.category.toLowerCase().includes(search.toLowerCase());
      const matchesPrice = price >= minPrice && price <= maxPrice;
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesRating = rating >= minRating;
      return matchesSearch && matchesPrice && matchesCategory && matchesRating;
    });
  }, [allProducts, search, minPrice, maxPrice, selectedCategory, minRating]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(0, page * PRODUCTS_PER_PAGE);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Erreur</h2>
          <p className="text-muted-foreground">Impossible de charger les produits. Veuillez réessayer.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-secondary py-20 px-4 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80')] bg-cover bg-center opacity-10" />
        <div className="container mx-auto relative z-10 max-w-4xl text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6"
          >
            Les Meilleures Trouvailles <br className="hidden md:block"/> pour Votre Quotidien
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            Découvrez notre sélection de produits premium, livrés directement chez vous au Niger.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-xl mx-auto"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-12 h-14 text-base rounded-2xl border-border/60 shadow-lg bg-background"
              data-testid="input-search"
            />
            {search && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => handleSearchChange("")}
                data-testid="button-clear-search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground">
            {search ? `Résultats pour "${search}"` : "Nouveautés"}
          </h2>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-toggle-filters"
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtres
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filtres Avancés</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prix: {minPrice.toLocaleString("fr-FR")} — {maxPrice.toLocaleString("fr-FR")} CFA
                </label>
                <Input 
                  type="range" 
                  min="0" 
                  max="500000" 
                  step="5000"
                  value={minPrice}
                  onChange={(e) => { setMinPrice(Number(e.target.value)); setPage(1); }}
                  data-testid="input-min-price"
                  className="mb-2"
                />
                <Input 
                  type="range" 
                  min="0" 
                  max="500000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
                  data-testid="input-max-price"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <div className="space-y-2">
                  <button
                    onClick={() => handleCategoryChange(null)}
                    className={`block w-full text-left px-3 py-2 rounded-md transition ${
                      !selectedCategory ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                    }`}
                    data-testid="button-category-all"
                  >
                    Tous
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`block w-full text-left px-3 py-2 rounded-md transition ${
                        selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      data-testid={`button-category-${cat.toLowerCase()}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Note minimum: {minRating}⭐</label>
                <Input 
                  type="range" 
                  min="0" 
                  max="5" 
                  step="0.5"
                  value={minRating}
                  onChange={(e) => { setMinRating(Number(e.target.value)); setPage(1); }}
                  data-testid="input-min-rating"
                />
                <div className="flex gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => { setMinRating(star); setPage(1); }}
                      className={`text-lg transition ${minRating >= star ? 'opacity-100' : 'opacity-30'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground text-sm font-medium">
            {filteredProducts.length} produit(s) trouvé(s)
          </span>
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="text-sm text-primary hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>

        {paginatedProducts.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-2xl">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground text-lg">Aucun produit ne correspond à votre recherche.</p>
            <button onClick={() => { handleSearchChange(""); setSelectedCategory(null); }} className="text-primary hover:underline text-sm mt-2">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % PRODUCTS_PER_PAGE) * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {page < totalPages && (
              <div className="text-center mt-12">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setPage(p => p + 1)}
                  className="px-10"
                  data-testid="button-load-more"
                >
                  Voir plus ({filteredProducts.length - paginatedProducts.length} restants)
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-secondary/50 py-12 mt-20 border-t border-border/50">
        <div className="container mx-auto px-4 text-center">
          <p className="font-display text-xl font-bold text-primary mb-4">LuxeStore</p>
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} LuxeStore. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useCreateProduct } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Loader2, Plus, ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = ["Electronics", "Fashion", "Accessories", "Photography", "Audio", "Home"];

export default function Admin() {
  const { toast } = useToast();
  const { data: currentUser, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const createProduct = useCreateProduct();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  if (currentUser.role !== "admin") {
    navigate("/");
    return null;
  }
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    category: "Electronics",
    rating: "4.5",
    reviews: "0",
    stock: "100",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.imageUrl) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    createProduct.mutate(
      {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        imageUrl: formData.imageUrl,
        category: formData.category,
        rating: formData.rating,
        reviews: parseInt(formData.reviews),
        stock: parseInt(formData.stock),
      },
      {
        onSuccess: () => {
          toast({
            title: "Succès",
            description: "Produit ajouté avec succès",
          });
          setFormData({
            name: "",
            description: "",
            price: "",
            imageUrl: "",
            category: "Electronics",
            rating: "4.5",
            reviews: "0",
            stock: "100",
          });
        },
        onError: () => {
          toast({
            title: "Erreur",
            description: "Impossible d'ajouter le produit",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="font-display text-3xl font-bold">Ajouter un produit</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nom du produit *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Casque Audio Premium"
                    data-testid="input-product-name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Description détaillée du produit..."
                    data-testid="textarea-product-description"
                    className="min-h-[100px]"
                    required
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Prix *
                    </label>
                    <Input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="99.99"
                      step="0.01"
                      data-testid="input-product-price"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stock
                    </label>
                    <Input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="100"
                      data-testid="input-product-stock"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Catégorie
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    data-testid="select-product-category"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL de l'image *
                  </label>
                  <Input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    data-testid="input-product-image"
                    required
                  />
                </div>

                {/* Rating & Reviews */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Note
                    </label>
                    <Input
                      type="number"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      placeholder="4.5"
                      step="0.1"
                      min="0"
                      max="5"
                      data-testid="input-product-rating"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Nombre d'avis
                    </label>
                    <Input
                      type="number"
                      name="reviews"
                      value={formData.reviews}
                      onChange={handleChange}
                      placeholder="0"
                      data-testid="input-product-reviews"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={createProduct.isPending}
                  data-testid="button-add-product"
                >
                  {createProduct.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter le produit
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold mb-4">Aperçu</h2>
                <Card className="overflow-hidden">
                  {formData.imageUrl && (
                    <div className="w-full h-64 overflow-hidden bg-secondary">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {formData.name || "Nom du produit"}
                      </h3>
                      <span className="text-xl font-bold text-primary">
                        ${formData.price || "0.00"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {formData.category}
                    </p>
                    <p className="text-sm text-foreground mb-4">
                      {formData.description || "Description du produit"}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {formData.rating} ⭐ ({formData.reviews} avis)
                      </span>
                      <span className="text-muted-foreground">
                        Stock: {formData.stock}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-100">
                  <strong>Info:</strong> Remplissez les champs avec un * pour ajouter un produit. L'aperçu se met à jour automatiquement.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Navigation Links */}
        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/">
            <Button variant="outline">Retour à l'accueil</Button>
          </Link>
          <Link href="/admin/orders">
            <Button>Voir les commandes</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useCreateProduct } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Loader2, Plus, ChevronLeft, ImagePlus, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";

const FALLBACK_CATEGORIES = ["Électronique", "Mode", "Accessoires", "Photographie", "Audio", "Maison"];

export default function Admin() {
  useSEO({
    title: "Ajouter un produit",
    description: "Ajouter un nouveau produit au catalogue.",
    keywords: "admin, gestion produits",
  });

  const { toast } = useToast();
  const { data: currentUser, isLoading } = useCurrentUser();
  const [, navigate] = useLocation();
  const createProduct = useCreateProduct();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categories } = useQuery<Category[]>({ queryKey: ['/api/categories'] });
  const categoryList = categories && categories.length > 0
    ? categories.map(c => c.name)
    : FALLBACK_CATEGORIES;

  const [formData, setFormData] = useState({
    name: "", description: "", price: "", imageUrl: "", category: categoryList[0] || "Électronique",
    rating: "4.5", reviews: "0", stock: "100", minOrderQty: "",
  });
  const [imageMode, setImageMode] = useState<"url" | "file">("file");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) { navigate("/login"); return null; }
  if (currentUser.role !== "admin") { navigate("/"); return null; }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === "imageUrl") setImagePreview(value);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({ title: "Fichier trop volumineux", description: "La taille maximale est de 5 Mo", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setImagePreview(base64);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64, fileName: file.name }),
        });

        if (res.ok) {
          const { url } = await res.json();
          setFormData(prev => ({ ...prev, imageUrl: url }));
          toast({ title: "Photo uploadée avec succès" });
        } else {
          toast({ title: "Erreur upload", description: "Impossible d'uploader la photo", variant: "destructive" });
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast({ title: "Erreur", description: "Impossible de lire le fichier", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price || !formData.imageUrl) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }
    const minQty = formData.minOrderQty ? parseInt(formData.minOrderQty) : null;
    createProduct.mutate(
      { name: formData.name, description: formData.description, price: formData.price, imageUrl: formData.imageUrl, category: formData.category, rating: formData.rating, reviews: parseInt(formData.reviews), stock: parseInt(formData.stock), minOrderQty: minQty && minQty >= 2 ? minQty : null },
      {
        onSuccess: () => {
          toast({ title: "Succès", description: "Produit ajouté avec succès" });
          setFormData({ name: "", description: "", price: "", imageUrl: "", category: categoryList[0] || "Électronique", rating: "4.5", reviews: "0", stock: "100", minOrderQty: "" });
          setImagePreview("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: () => toast({ title: "Erreur", description: "Impossible d'ajouter le produit", variant: "destructive" }),
      }
    );
  };

  const displayImage = imagePreview || formData.imageUrl;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <h1 className="font-display text-3xl font-bold">Ajouter un produit</h1>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Nom */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nom du produit *</label>
                  <Input type="text" name="name" value={formData.name} onChange={handleChange}
                    placeholder="Ex: Casque Audio Premium" data-testid="input-product-name" required />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                  <Textarea name="description" value={formData.description} onChange={handleChange}
                    placeholder="Description détaillée du produit..." data-testid="textarea-product-description"
                    className="min-h-[100px]" required />
                </div>

                {/* Prix / Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Prix (CFA) *</label>
                    <Input type="number" name="price" value={formData.price} onChange={handleChange}
                      placeholder="Ex: 15000" step="1" data-testid="input-product-price" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Stock</label>
                    <Input type="number" name="stock" value={formData.stock} onChange={handleChange}
                      placeholder="100" data-testid="input-product-stock" />
                  </div>
                </div>

                {/* Vente en gros */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quantité minimum pour vente en gros (optionnel)
                  </label>
                  <Input type="number" name="minOrderQty" value={formData.minOrderQty} onChange={handleChange}
                    placeholder="Ex: 10 (laisser vide pour vente normale)" min="2"
                    data-testid="input-product-min-order-qty" />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si rempli (≥ 2), ce produit sera marqué "vente en gros" et le client devra commander au minimum cette quantité.
                  </p>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Catégorie</label>
                  <select name="category" value={formData.category} onChange={handleChange}
                    data-testid="select-product-category"
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground">
                    {categoryList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Photo — toggle mode */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Photo du produit *</label>

                  {/* Mode switcher */}
                  <div className="flex gap-2 mb-3">
                    <button type="button"
                      onClick={() => setImageMode("file")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${imageMode === "file" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <ImagePlus className="h-4 w-4" />
                      Depuis la galerie
                    </button>
                    <button type="button"
                      onClick={() => setImageMode("url")}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${imageMode === "url" ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:text-foreground"}`}
                    >
                      <Link2 className="h-4 w-4" />
                      Par URL
                    </button>
                  </div>

                  {imageMode === "file" ? (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        data-testid="input-product-file"
                        id="product-image-file"
                      />
                      <label htmlFor="product-image-file" className="cursor-pointer block">
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all hover:border-primary hover:bg-primary/5 ${uploading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}>
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <p className="text-sm text-muted-foreground">Upload en cours...</p>
                            </div>
                          ) : imagePreview && imageMode === "file" ? (
                            <div className="flex flex-col items-center gap-2">
                              <img src={imagePreview} alt="Aperçu" className="h-24 w-24 object-cover rounded-lg mx-auto" />
                              <p className="text-sm text-primary font-medium">Cliquer pour changer</p>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                                <ImagePlus className="h-7 w-7 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">Cliquer pour choisir une photo</p>
                                <p className="text-xs text-muted-foreground mt-1">Ouvre votre galerie d'images · JPG, PNG, WebP · max 5 Mo</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <Input
                      type="url"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleChange}
                      placeholder="https://example.com/photo.jpg"
                      data-testid="input-product-image"
                    />
                  )}
                </div>

                {/* Note / Avis */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Note</label>
                    <Input type="number" name="rating" value={formData.rating} onChange={handleChange}
                      placeholder="4.5" step="0.1" min="0" max="5" data-testid="input-product-rating" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Nombre d'avis</label>
                    <Input type="number" name="reviews" value={formData.reviews} onChange={handleChange}
                      placeholder="0" data-testid="input-product-reviews" />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base font-medium"
                  disabled={createProduct.isPending || uploading} data-testid="button-add-product">
                  {createProduct.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ajout en cours...</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" />Ajouter le produit</>
                  )}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Preview */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold mb-4">Aperçu</h2>
                <Card className="overflow-hidden">
                  {displayImage && (
                    <div className="w-full h-64 overflow-hidden bg-secondary">
                      <img src={displayImage} alt="Preview" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{formData.name || "Nom du produit"}</h3>
                      <span className="text-xl font-bold text-primary">
                        {Number(formData.price || 0).toLocaleString("fr-FR")} CFA
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{formData.category}</p>
                    <p className="text-sm text-foreground mb-4">{formData.description || "Description du produit"}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{formData.rating} ⭐ ({formData.reviews} avis)</span>
                      <span className="text-muted-foreground">Stock : {formData.stock}</span>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-100">
                  <strong>Conseil :</strong> Utilisez "Depuis la galerie" pour sélectionner directement une photo depuis votre appareil.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 flex gap-4 justify-center">
          <Link href="/"><Button variant="outline">Retour à l'accueil</Button></Link>
          <Link href="/admin/dashboard"><Button>Dashboard Admin</Button></Link>
        </div>
      </main>
    </div>
  );
}

import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

async function seedDatabase() {
  const existingAdmin = await storage.getUserByEmail("admin@luxestore.com");
  if (!existingAdmin) {
    await storage.registerUser({
      email: "admin@luxestore.com",
      password: "admin123",
      name: "Admin User",
    });
    const admin = await storage.getUserByEmail("admin@luxestore.com");
    if (admin) await storage.updateUserRole(admin.id, "admin");
  }

  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    const productsData = [
      { name: "Casque Audio Sans Fil", description: "Casque sans fil premium avec réduction de bruit active, 30 heures d'autonomie.", price: "25000", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", category: "Électronique", rating: "4.8", reviews: 324, stock: 50 },
      { name: "Montre Minimaliste", description: "Design classique et moderne. Bracelet en cuir véritable, cadran épuré.", price: "18000", imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80", category: "Accessoires", rating: "4.6", reviews: 156, stock: 75 },
      { name: "Enceinte Connectée", description: "Enceinte intelligente contrôlée par la voix avec son haute-fidélité.", price: "12000", imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80", category: "Électronique", rating: "4.4", reviews: 287, stock: 120 },
      { name: "Sac à Dos Design", description: "Sac à dos solide et élégant, parfait pour le quotidien. Plusieurs compartiments.", price: "9000", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80", category: "Mode", rating: "4.5", reviews: 203, stock: 89 },
      { name: "Clavier Mécanique", description: "Clavier mécanique premium avec switches tactiles pour une expérience de frappe ultime.", price: "20000", imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80", category: "Électronique", rating: "4.7", reviews: 412, stock: 45 },
      { name: "Appareil Photo Instantané", description: "Capturez vos souvenirs instantanément avec cet appareil de style vintage.", price: "16000", imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80", category: "Photographie", rating: "4.3", reviews: 189, stock: 35 },
    ];
    for (const product of productsData) await storage.createProduct(product);
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  await seedDatabase();

  // ── IMAGE UPLOAD ─────────────────────────────────────────────
  app.post('/api/upload', async (req, res) => {
    try {
      const { imageData, fileName } = req.body;
      if (!imageData || !fileName) {
        return res.status(400).json({ message: "Données image manquantes" });
      }
      // Strip base64 header
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
      const ext = imageData.match(/data:image\/(\w+);/)?.[1] || "jpg";
      const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      res.json({ url: `/uploads/${safeName}` });
    } catch (err) {
      res.status(500).json({ message: "Erreur lors de l'upload" });
    }
  });

  // ── AUTH ─────────────────────────────────────────────────────
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const user = await storage.registerUser(input);
      if (!user) return res.status(400).json({ message: "Email déjà utilisé" });
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        const { password, ...safeUser } = user;
        res.status(201).json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.loginUser(input.email, input.password);
      if (!user) return res.status(401).json({ message: "Email ou mot de passe invalide" });
      const sessionId = req.body.sessionId as string | undefined;
      if (sessionId) await storage.mergeCartOnLogin(sessionId, user.id);
      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) return res.status(500).json({ message: "Session save failed" });
        const { password, ...safeUser } = user;
        res.json(safeUser);
      });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => res.json({ message: "Déconnecté" }));
  });

  app.get(api.auth.me.path, async (req, res) => {
    if (!req.session.userId) return res.json(null);
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.json(null);
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // ── PRODUCTS ─────────────────────────────────────────────────
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts(
      req.query.search as string | undefined,
      req.query.category as string | undefined,
      req.query.sortBy as string | undefined
    );
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  // ── CART ─────────────────────────────────────────────────────
  app.get(api.cart.list.path, async (req, res) => {
    const userId = req.session.userId;
    const items = await storage.getCartItems(req.params.sessionId, userId);
    res.json(items);
  });

  app.post(api.cart.add.path, async (req, res) => {
    try {
      const input = api.cart.add.input.parse(req.body);
      const userId = req.session.userId;
      const item = await storage.addToCart({ ...input, userId });
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.patch(api.cart.update.path, async (req, res) => {
    try {
      const input = api.cart.update.input.parse(req.body);
      const item = await storage.updateCartItem(Number(req.params.id), input.quantity);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.delete(api.cart.delete.path, async (req, res) => {
    await storage.removeFromCart(Number(req.params.id));
    res.status(204).end();
  });

  app.delete(api.cart.clear.path, async (req, res) => {
    const userId = req.session.userId;
    await storage.clearCart(req.params.sessionId, userId);
    res.status(204).end();
  });

  // ── WISHLIST ─────────────────────────────────────────────────
  app.get(api.wishlist.list.path, async (req, res) => {
    const items = await storage.getWishlist(req.params.sessionId);
    res.json(items);
  });

  app.post(api.wishlist.add.path, async (req, res) => {
    try {
      const input = api.wishlist.add.input.parse(req.body);
      const item = await storage.addToWishlist(input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.delete(api.wishlist.delete.path, async (req, res) => {
    await storage.removeFromWishlist(Number(req.params.id));
    res.status(204).end();
  });

  // ── ORDERS ───────────────────────────────────────────────────
  app.post(api.orders.create.path, async (req, res) => {
    try {
      let input = api.orders.create.input.parse(req.body);
      const userId = req.session.userId;

      // IMPORTANT: Use userId when logged in to get the right cart
      const cartItems = await storage.getCartItems(input.sessionId, userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Votre panier est vide" });
      }

      for (const item of cartItems) {
        if (item.product.stock < item.quantity) {
          return res.status(400).json({ message: `Stock insuffisant pour ${item.product.name}. Disponible: ${item.product.stock}, demandé: ${item.quantity}` });
        }
      }

      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price,
      }));

      // Validate & apply promo code server-side
      let promoCode = input.promoCode;
      let discount = input.discount;
      if (promoCode) {
        const promo = await storage.validatePromoCode(promoCode);
        if (!promo) {
          promoCode = undefined;
          discount = undefined;
        } else {
          const cartTotal = cartItems.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
          const computedDiscount = promo.discountType === "percent"
            ? Math.round((cartTotal * Number(promo.discountValue)) / 100)
            : Math.min(Number(promo.discountValue), cartTotal);
          discount = computedDiscount.toString();
          input = { ...input, total: Math.max(0, cartTotal - computedDiscount).toString() };
        }
      }

      const order = await storage.createOrder({ ...input, promoCode, discount }, orderItems);

      if (promoCode) {
        const promo = await storage.validatePromoCode(promoCode);
        if (promo) await storage.incrementPromoCodeUses(promo.id);
      }

      // Clear cart: use userId when logged in, sessionId for guests
      await storage.clearCart(input.sessionId, userId);

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders(req.params.sessionId);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  });

  app.get('/api/orders/:id/items', async (req, res) => {
    const items = await storage.getOrderItems(Number(req.params.id));
    res.json(items);
  });

  app.get(api.orders.allOrders.path, async (req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  // ── ADMIN ────────────────────────────────────────────────────
  app.get(api.admin.stats.path, async (_req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  app.patch(api.admin.updateProduct.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.updateProduct.input.parse(req.body);
      const product = await storage.updateProduct(id, input);
      if (!product) return res.status(404).json({ message: 'Produit introuvable' });
      res.json(product);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.delete(api.admin.deleteProduct.path, async (req, res) => {
    const deleted = await storage.deleteProduct(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Produit introuvable' });
    res.status(204).send();
  });

  app.patch(api.admin.updateOrderStatus.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.updateOrderStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(id, input.status);
      if (!order) return res.status(404).json({ message: 'Commande introuvable' });
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.post(api.admin.approveOrder.path, async (req, res) => {
    const order = await storage.updateOrderApprovalStatus(Number(req.params.id), "approved");
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  });

  app.post(api.admin.rejectOrder.path, async (req, res) => {
    try {
      const input = z.object({ reason: z.string() }).parse(req.body);
      const order = await storage.updateOrderApprovalStatus(Number(req.params.id), "rejected", input.reason);
      if (!order) return res.status(404).json({ message: 'Commande introuvable' });
      res.json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.get(api.orders.userOrders.path, async (req, res) => {
    const orders = await storage.getUserOrders(req.params.email);
    res.json(orders);
  });

  // ── USER PROFILE ─────────────────────────────────────────────
  app.get(api.user.getProfile.path, async (req, res) => {
    const user = await storage.getUserById(Number(req.params.userId));
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch(api.user.updateProfile.path, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const input = api.user.updateProfile.input.parse(req.body);
      const user = await storage.updateUserProfile(userId, input);
      if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.patch(api.user.updatePassword.path, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      const input = api.user.updatePassword.input.parse(req.body);
      const success = await storage.updateUserPassword(userId, input.currentPassword, input.newPassword);
      if (!success) return res.status(400).json({ message: 'Mot de passe actuel invalide' });
      res.json({ message: 'Mot de passe mis à jour' });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post(api.orders.cancel.path, async (req, res) => {
    const order = await storage.cancelOrder(Number(req.params.id));
    if (!order) return res.status(400).json({ message: "Cette commande ne peut pas être annulée" });
    res.json(order);
  });

  // ── CATEGORIES ───────────────────────────────────────────────
  app.get('/api/categories', async (_req, res) => {
    const cats = await storage.getAllCategories();
    res.json(cats);
  });

  app.post('/api/admin/categories', async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) return res.status(400).json({ message: 'Nom de catégorie requis' });
    try {
      const cat = await storage.createCategory(name.trim());
      res.status(201).json(cat);
    } catch (err: any) {
      if (err.code === '23505') return res.status(409).json({ message: 'Cette catégorie existe déjà' });
      throw err;
    }
  });

  app.delete('/api/admin/categories/:id', async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).end();
  });

  // ── PROMO CODES ──────────────────────────────────────────────
  app.get('/api/admin/promo-codes', async (_req, res) => {
    res.json(await storage.getPromoCodes());
  });

  app.post('/api/admin/promo-codes', async (req, res) => {
    try {
      const body = req.body;
      const promo = await storage.createPromoCode({
        code: body.code,
        discountType: body.discountType,
        discountValue: String(body.discountValue),
        maxUses: body.maxUses ? Number(body.maxUses) : undefined,
        active: body.active !== false,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      });
      res.status(201).json(promo);
    } catch (err: any) {
      if (err.code === '23505') return res.status(409).json({ message: 'Ce code promo existe déjà' });
      throw err;
    }
  });

  app.patch('/api/admin/promo-codes/:id/toggle', async (req, res) => {
    const promo = await storage.togglePromoCode(Number(req.params.id), req.body.active);
    if (!promo) return res.status(404).json({ message: 'Code promo introuvable' });
    res.json(promo);
  });

  app.delete('/api/admin/promo-codes/:id', async (req, res) => {
    await storage.deletePromoCode(Number(req.params.id));
    res.status(204).end();
  });

  app.post('/api/promo-codes/validate', async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code requis' });
    const promo = await storage.validatePromoCode(code);
    if (!promo) return res.status(404).json({ message: 'Code invalide, expiré ou inactif' });
    res.json(promo);
  });

  // ── ADMIN ORDERS (detailed endpoint) ─────────────────────────
  app.get('/api/admin/orders', async (_req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders.reverse());
  });

  return httpServer;
}

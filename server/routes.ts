import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { pool } from "./db";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Connexion requise." });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Connexion requise." });
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ message: "Accès administrateur requis." });
  }
  next();
}

async function authorizeOrder(req: Request, res: Response, orderId: number) {
  if (!req.session.userId) {
    res.status(401).json({ message: "Connexion requise." });
    return null;
  }
  const order = await storage.getOrder(orderId);
  if (!order) {
    res.status(404).json({ message: "Commande introuvable" });
    return null;
  }
  const user = await storage.getUserById(req.session.userId);
  if (!user || (user.role !== "admin" && order.email !== user.email)) {
    res.status(403).json({ message: "Accès non autorisé." });
    return null;
  }
  return order;
}


// Les images sont stockées en base (le disque de Render est effacé à chaque redéploiement).
async function ensureImagesTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS uploaded_images (
      name TEXT PRIMARY KEY,
      content_type TEXT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    )`);
  // Accès public via l'API Supabase bloqué ; seul le backend (propriétaire) y accède.
  await pool.query(`ALTER TABLE uploaded_images ENABLE ROW LEVEL SECURITY`);
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

async function seedDatabase() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (!existingAdmin) {
    await storage.registerUser({
      email: adminEmail,
      password: adminPassword,
      name: process.env.ADMIN_NAME || "Admin User",
      firstName: "Admin",
      lastName: "User",
      phone: "00000000",
      phoneCountry: "NE",
      city: "Niamey",
      district: "Centre",
    });
    }
    const admin = await storage.getUserByEmail(adminEmail);
    if (admin && admin.role !== "admin") await storage.updateUserRole(admin.id, "admin");
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
  await ensureImagesTable();
  await seedDatabase();

  // ── IMAGE UPLOAD ─────────────────────────────────────────────
  app.post('/api/upload', requireAdmin, async (req, res) => {
    try {
      const { imageData, fileName } = req.body;
      if (!imageData || !fileName) {
        return res.status(400).json({ message: "Données image manquantes" });
      }
      const match = typeof imageData === "string"
        ? imageData.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i)
        : null;
      if (!match) {
        return res.status(400).json({ message: "Image invalide (formats acceptés : JPG, PNG, WebP)." });
      }
      const ext = match[1].toLowerCase().replace("jpeg", "jpg");
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
        return res.status(400).json({ message: "Image trop volumineuse (2 Mo maximum)." });
      }
      const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      const baseName = String(fileName).replace(/\.[^.]*$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40) || "image";
      const safeName = `${Date.now()}_${baseName}.${ext}`;
      await pool.query(
        "INSERT INTO uploaded_images (name, content_type, data) VALUES ($1, $2, $3)",
        [safeName, contentType, buffer],
      );
      const publicApiUrl = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "");
      res.json({ url: `${publicApiUrl}/uploads/${safeName}` });
    } catch (err) {
      console.error("Erreur upload image:", err);
      res.status(500).json({ message: "Erreur lors de l'upload" });
    }
  });

  app.get('/uploads/:name', async (req, res) => {
    const name = req.params.name;
    if (!/^[A-Za-z0-9._-]+$/.test(name)) return res.status(404).end();
    const result = await pool.query("SELECT content_type, data FROM uploaded_images WHERE name = $1", [name]);
    if (result.rowCount === 0) return res.status(404).end();
    const { content_type, data } = result.rows[0];
    res.setHeader("Content-Type", content_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.send(data);
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
      // Les sessions administrateur expirent après 1 heure (24 h pour les clients).
      if (user.role === "admin") req.session.cookie.maxAge = 60 * 60 * 1000;
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

  app.post(api.products.create.path, requireAdmin, async (req, res) => {
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
      const userId = req.session.userId;
      const ownedItems = await storage.getCartItems(
        req.header("X-Cart-Session") || "",
        userId,
      );
      if (!ownedItems.some((item) => item.id === Number(req.params.id))) {
        return res.status(403).json({ message: "Article de panier non autorisé." });
      }
      const item = await storage.updateCartItem(Number(req.params.id), input.quantity);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.delete(api.cart.delete.path, async (req, res) => {
    const ownedItems = await storage.getCartItems(
      req.header("X-Cart-Session") || "",
      req.session.userId,
    );
    if (!ownedItems.some((item) => item.id === Number(req.params.id))) {
      return res.status(403).json({ message: "Article de panier non autorisé." });
    }
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
    const ownedItems = await storage.getWishlist(req.header("X-Cart-Session") || "");
    if (!ownedItems.some((item) => item.id === Number(req.params.id))) {
      return res.status(403).json({ message: "Élément de wishlist non autorisé." });
    }
    await storage.removeFromWishlist(Number(req.params.id));
    res.status(204).end();
  });

  // ── ORDERS ───────────────────────────────────────────────────
  app.post(api.orders.create.path, async (req, res) => {
    try {
      let input = api.orders.create.input.parse(req.body);
      const userId = req.session.userId;

      // Sécurité : seuls les utilisateurs connectés peuvent passer commande
      if (!userId) {
        return res.status(401).json({ message: "Vous devez être connecté pour passer une commande." });
      }

      // IMPORTANT: Use userId when logged in to get the right cart
      const cartItems = await storage.getCartItems(input.sessionId, userId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Votre panier est vide" });
      }

      for (const item of cartItems) {
        if ((item.product.stock ?? 0) < item.quantity) {
          return res.status(400).json({ message: `Stock insuffisant pour ${item.product.name}. Disponible: ${item.product.stock}, demandé: ${item.quantity}` });
        }
      }

      // Vérifier les seuils de vente en gros
      for (const item of cartItems) {
        if (item.product.minOrderQty && item.quantity < item.product.minOrderQty) {
          return res.status(400).json({
            message: `Le produit "${item.product.name}" est vendu en gros : minimum ${item.product.minOrderQty} unités requises (actuellement ${item.quantity}).`,
          });
        }
      }

      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      // Recalculate the subtotal and discount on the server. Never trust
      // the total sent by the browser.
      const cartTotal = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0,
      );
      let promoCode = input.promoCode;
      let discount = "0";
      let validPromo: Awaited<ReturnType<typeof storage.validatePromoCode>> = null;
      if (promoCode) {
        validPromo = await storage.validatePromoCode(promoCode);
        if (!validPromo) {
          promoCode = undefined;
        } else {
          const computedDiscount = validPromo.discountType === "percent"
            ? Math.round((cartTotal * Number(validPromo.discountValue)) / 100)
            : Math.min(Number(validPromo.discountValue), cartTotal);
          discount = computedDiscount.toString();
        }
      }

      input = {
        ...input,
        total: Math.max(0, cartTotal - Number(discount)).toString(),
        discount,
      };
      const order = await storage.createOrder({ ...input, promoCode, discount }, orderItems);

      if (validPromo) {
        await storage.incrementPromoCodeUses(validPromo.id);
      }

      // Clear cart: use userId when logged in, sessionId for guests
      await storage.clearCart(input.sessionId, userId);

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      throw err;
    }
  });

  app.get(api.orders.list.path, requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable." });
    const orders = await storage.getUserOrders(user.email);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await authorizeOrder(req, res, Number(req.params.id));
    if (!order) return;
    res.json(order);
  });

  app.get('/api/orders/:id/items', async (req, res) => {
    const order = await authorizeOrder(req, res, Number(req.params.id));
    if (!order) return;
    const items = await storage.getOrderItems(Number(req.params.id));
    res.json(items);
  });

  app.get(api.orders.allOrders.path, requireAdmin, async (req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  // ── ADMIN ────────────────────────────────────────────────────
  app.get(api.admin.stats.path, requireAdmin, async (_req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  app.patch(api.admin.updateProduct.path, requireAdmin, async (req, res) => {
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

  app.delete(api.admin.deleteProduct.path, requireAdmin, async (req, res) => {
    const deleted = await storage.deleteProduct(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: 'Produit introuvable' });
    res.status(204).send();
  });

  app.patch(api.admin.updateOrderStatus.path, requireAdmin, async (req, res) => {
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

  app.post(api.admin.approveOrder.path, requireAdmin, async (req, res) => {
    const order = await storage.updateOrderApprovalStatus(Number(req.params.id), "approved");
    if (!order) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(order);
  });

  app.post(api.admin.rejectOrder.path, requireAdmin, async (req, res) => {
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

  app.get(api.orders.userOrders.path, requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(401).json({ message: "Utilisateur introuvable." });
    const orders = await storage.getUserOrders(user.email);
    res.json(orders);
  });

  // ── USER PROFILE ─────────────────────────────────────────────
  app.get(api.user.getProfile.path, requireAuth, async (req, res) => {
    if (Number(req.params.userId) !== req.session.userId) {
      return res.status(403).json({ message: "Accès non autorisé." });
    }
    const user = await storage.getUserById(req.session.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.patch(api.user.updateProfile.path, requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (userId !== req.session.userId) return res.status(403).json({ message: "Accès non autorisé." });
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

  app.patch(api.user.updatePassword.path, requireAuth, async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (userId !== req.session.userId) return res.status(403).json({ message: "Accès non autorisé." });
      const input = api.user.updatePassword.input.parse(req.body);
      const success = await storage.updateUserPassword(userId, input.currentPassword, input.newPassword);
      if (!success) return res.status(400).json({ message: 'Mot de passe actuel invalide' });
      res.json({ message: 'Mot de passe mis à jour' });
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });

  app.post(api.orders.cancel.path, requireAuth, async (req, res) => {
    const order = await authorizeOrder(req, res, Number(req.params.id));
    if (!order) return;
    const cancelledOrder = await storage.cancelOrder(Number(req.params.id));
    if (!cancelledOrder) return res.status(400).json({ message: "Cette commande ne peut pas être annulée" });
    res.json(cancelledOrder);
  });

  // ── CATEGORIES ───────────────────────────────────────────────
  app.get('/api/categories', async (_req, res) => {
    const cats = await storage.getAllCategories();
    res.json(cats);
  });

  app.post('/api/admin/categories', requireAdmin, async (req, res) => {
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

  app.delete('/api/admin/categories/:id', requireAdmin, async (req, res) => {
    await storage.deleteCategory(Number(req.params.id));
    res.status(204).end();
  });

  // ── PROMO CODES ──────────────────────────────────────────────
  app.get('/api/admin/promo-codes', requireAdmin, async (_req, res) => {
    res.json(await storage.getPromoCodes());
  });

  app.post('/api/admin/promo-codes', requireAdmin, async (req, res) => {
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

  app.patch('/api/admin/promo-codes/:id/toggle', requireAdmin, async (req, res) => {
    const promo = await storage.togglePromoCode(Number(req.params.id), req.body.active);
    if (!promo) return res.status(404).json({ message: 'Code promo introuvable' });
    res.json(promo);
  });

  app.delete('/api/admin/promo-codes/:id', requireAdmin, async (req, res) => {
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
  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders.reverse());
  });

  return httpServer;
}

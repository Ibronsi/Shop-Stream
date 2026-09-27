import { db } from "./db";
import {
  users,
  products,
  productVariants,
  cartItems,
  orders,
  orderItems,
  wishlistItems,
  categories,
  promoCodes,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type ProductVariant,
  type InsertProductVariant,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type InsertOrderItem,
  type CartItemWithProduct,
  type WishlistItem,
  type InsertWishlistItem,
  type WishlistItemWithProduct,
  type OrderItem,
  type Category,
  type PromoCode,
  type InsertPromoCode,
} from "@shared/schema";
import { eq, and, ilike, or, isNull, gte, sql, desc, type SQL } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export interface IStorage {
  // Users
  registerUser(user: InsertUser): Promise<User | null>;
  loginUser(email: string, password: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUserRole(id: number, role: string): Promise<User | undefined>;
  updateUserProfile(id: number, updates: { name?: string; email?: string }): Promise<User | undefined>;
  updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<boolean>;

  // Products
  getProducts(search?: string, category?: string, sortBy?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Variantes (taille / couleur)
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  getVariant(id: number): Promise<ProductVariant | undefined>;
  createProductVariant(variant: InsertProductVariant & { productId: number }): Promise<ProductVariant>;
  updateProductVariant(id: number, updates: Partial<InsertProductVariant>): Promise<ProductVariant | undefined>;
  deleteProductVariant(id: number): Promise<void>;
  getCategories(): Promise<string[]>;
  decrementProductStock(productId: number, quantity: number): Promise<boolean>;

  // Cart
  getCartItems(sessionId: string, userId?: number): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem & { userId?: number }): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string, userId?: number): Promise<void>;
  mergeCartOnLogin(sessionId: string, userId: number): Promise<void>;

  // Wishlist
  getWishlist(sessionId: string): Promise<WishlistItemWithProduct[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number): Promise<void>;
  isInWishlist(sessionId: string, productId: number): Promise<boolean>;

  // Orders
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order>;
  getOrders(sessionId: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getAllOrders(): Promise<Order[]>;
  getUserOrders(email: string): Promise<Order[]>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  updateOrderApprovalStatus(id: number, approvalStatus: string, rejectionReason?: string): Promise<Order | undefined>;
  cancelOrder(id: number): Promise<Order | undefined>;

  // Admin Stats
  getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: string;
    totalProducts: number;
    totalStock: number;
    recentOrders: Order[];
  }>;

  // Product Management
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Promo Codes
  getPromoCodes(): Promise<PromoCode[]>;
  createPromoCode(data: InsertPromoCode): Promise<PromoCode>;
  validatePromoCode(code: string): Promise<PromoCode | null>;
  incrementPromoCodeUses(id: number): Promise<void>;
  deletePromoCode(id: number): Promise<void>;
  togglePromoCode(id: number, active: boolean): Promise<PromoCode | undefined>;
}

export class DatabaseStorage implements IStorage {
  async registerUser(user: InsertUser): Promise<User | null> {
    const existing = await this.getUserByEmail(user.email);
    if (existing) return null;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const name = user.name || [user.firstName, user.lastName]
      .filter((part): part is string => Boolean(part))
      .join(" ")
      .trim();
    const [newUser] = await db.insert(users).values({ ...user, name, password: hashedPassword }).returning();
    return newUser;
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUserRole(id: number, role: string): Promise<User | undefined> {
    const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return user;
  }

  async getProducts(search?: string, category?: string, sortBy?: string): Promise<Product[]> {
    const conditions: SQL[] = [];
    if (search) {
      conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.description, `%${search}%`))!);
    }
    if (category) {
      conditions.push(eq(products.category, category));
    }
    // Par défaut (et pour "newest"), on trie explicitement du plus récent au plus ancien :
    // sans ORDER BY, Postgres ne garantit aucun ordre précis, ce qui faisait apparaître
    // les nouveaux produits en bas du catalogue au lieu du haut.
    const query = conditions.length > 0
      ? db.select().from(products).where(and(...conditions)).orderBy(desc(products.id))
      : db.select().from(products).orderBy(desc(products.id));
    const allProducts = await query;
    if (sortBy === 'price-asc') return allProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    if (sortBy === 'price-desc') return allProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === 'rating') return allProducts.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
    return allProducts;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db.select().from(productVariants).where(eq(productVariants.productId, productId));
  }

  async getVariant(id: number): Promise<ProductVariant | undefined> {
    const [variant] = await db.select().from(productVariants).where(eq(productVariants.id, id));
    return variant;
  }

  async createProductVariant(variant: InsertProductVariant & { productId: number }): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values(variant).returning();
    return newVariant;
  }

  async updateProductVariant(id: number, updates: Partial<InsertProductVariant>): Promise<ProductVariant | undefined> {
    const [updated] = await db.update(productVariants).set(updates).where(eq(productVariants.id, id)).returning();
    return updated;
  }

  async deleteProductVariant(id: number): Promise<void> {
    await db.delete(productVariants).where(eq(productVariants.id, id));
  }

  async getCategories(): Promise<string[]> {
    const rows = await db.select({ category: products.category }).from(products).groupBy(products.category);
    return rows.map((row: { category: string }) => row.category);
  }

  async decrementProductStock(productId: number, quantity: number): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product || (product.stock ?? 0) < quantity) return false;
    await db.update(products).set({ stock: (product.stock ?? 0) - quantity }).where(eq(products.id, productId));
    return true;
  }

  // ── CART ─────────────────────────────────────────────────────
  // KEY RULE:
  //   Logged-in user  → items identified by userId ONLY
  //   Guest           → items identified by sessionId WHERE userId IS NULL

  async getCartItems(sessionId: string, userId?: number): Promise<CartItemWithProduct[]> {
    let rows;
    if (userId) {
      // Logged-in: only user's items
      rows = await db
        .select({ cartItem: cartItems, product: products, variant: productVariants })
        .from(cartItems)
        .where(eq(cartItems.userId, userId))
        .leftJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id));
    } else {
      // Guest: session items not linked to any user
      rows = await db
        .select({ cartItem: cartItems, product: products, variant: productVariants })
        .from(cartItems)
        .where(and(eq(cartItems.sessionId, sessionId), isNull(cartItems.userId)))
        .leftJoin(products, eq(cartItems.productId, products.id))
        .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id));
    }

    return rows
      .filter((r): r is { cartItem: CartItem; product: Product; variant: ProductVariant | null } => !!r.product)
      .map(({ cartItem, product, variant }) => ({ ...cartItem, product, variant: variant ?? null }));
  }

  async addToCart(item: InsertCartItem & { userId?: number }): Promise<CartItem> {
    // Même produit mais variante différente (taille/couleur) = ligne de panier distincte.
    const variantMatch = item.variantId != null
      ? eq(cartItems.variantId, item.variantId)
      : isNull(cartItems.variantId);

    if (item.userId) {
      // Logged-in: match by userId + productId + variantId
      const [existing] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId), variantMatch));
      if (existing) {
        const [updated] = await db.update(cartItems)
          .set({ quantity: existing.quantity + (item.quantity ?? 0) })
          .where(eq(cartItems.id, existing.id))
          .returning();
        return updated;
      }
      const [newItem] = await db.insert(cartItems).values({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        sessionId: item.sessionId,
        userId: item.userId,
      }).returning();
      return newItem;
    } else {
      // Guest: match by sessionId + productId + variantId where userId IS NULL
      const [existing] = await db.select().from(cartItems)
        .where(and(eq(cartItems.sessionId, item.sessionId), eq(cartItems.productId, item.productId), variantMatch, isNull(cartItems.userId)));
      if (existing) {
        const [updated] = await db.update(cartItems)
          .set({ quantity: existing.quantity + (item.quantity ?? 0) })
          .where(eq(cartItems.id, existing.id))
          .returning();
        return updated;
      }
      const [newItem] = await db.insert(cartItems).values({
        productId: item.productId,
        variantId: item.variantId ?? null,
        quantity: item.quantity,
        sessionId: item.sessionId,
        userId: null,
      }).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string, userId?: number): Promise<void> {
    if (userId) {
      // Clear all items for this user account
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
    } else {
      // Clear guest session items only
      await db.delete(cartItems).where(and(eq(cartItems.sessionId, sessionId), isNull(cartItems.userId)));
    }
  }

  async mergeCartOnLogin(sessionId: string, userId: number): Promise<void> {
    // Get guest session items (not yet linked to any user)
    const sessionItems = await db.select().from(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId), isNull(cartItems.userId)));

    for (const item of sessionItems) {
      // Check if product already in user's account cart
      const [userItem] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId)));

      if (userItem) {
        // Merge quantities into user's item, delete session duplicate
        await db.update(cartItems).set({ quantity: userItem.quantity + item.quantity }).where(eq(cartItems.id, userItem.id));
        await db.delete(cartItems).where(eq(cartItems.id, item.id));
      } else {
        // Link session item to user
        await db.update(cartItems).set({ userId }).where(eq(cartItems.id, item.id));
      }
    }
  }

  // ── WISHLIST ─────────────────────────────────────────────────
  async getWishlist(sessionId: string): Promise<WishlistItemWithProduct[]> {
    const items = await db
      .select({ wishlistItem: wishlistItems, product: products })
      .from(wishlistItems).where(eq(wishlistItems.sessionId, sessionId))
      .leftJoin(products, eq(wishlistItems.productId, products.id));
    return items
      .filter((item): item is { wishlistItem: WishlistItem; product: Product } => !!item.product)
      .map(({ wishlistItem, product }) => ({ ...wishlistItem, product }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [existing] = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.sessionId, item.sessionId), eq(wishlistItems.productId, item.productId)));
    if (existing) return existing;
    const [newItem] = await db.insert(wishlistItems).values(item).returning();
    return newItem;
  }

  async removeFromWishlist(id: number): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }

  async isInWishlist(sessionId: string, productId: number): Promise<boolean> {
    const [item] = await db.select().from(wishlistItems)
      .where(and(eq(wishlistItems.sessionId, sessionId), eq(wishlistItems.productId, productId)));
    return !!item;
  }

  // ── ORDERS ───────────────────────────────────────────────────
  async createOrder(
    order: InsertOrder,
    items: (Omit<InsertOrderItem, "orderId"> & { variantId?: number | null })[],
  ): Promise<Order> {
    return db.transaction(async (tx) => {
      const [newOrder] = await tx.insert(orders).values(order).returning();
      if (items.length > 0) {
        for (const item of items) {
          if (item.variantId != null) {
            // Produit avec variante : on décrémente le stock de CETTE variante, pas du produit.
            const updated = await tx
              .update(productVariants)
              .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
              .where(and(eq(productVariants.id, item.variantId), gte(productVariants.stock, item.quantity)))
              .returning({ id: productVariants.id });
            if (updated.length === 0) {
              const error = new Error(`Stock insuffisant pour cette taille/couleur du produit ${item.productId}.`);
              (error as Error & { status?: number }).status = 400;
              throw error;
            }
          } else {
            const updated = await tx
              .update(products)
              .set({ stock: sql`${products.stock} - ${item.quantity}` })
              .where(and(eq(products.id, item.productId), gte(products.stock, item.quantity)))
              .returning({ id: products.id });
            if (updated.length === 0) {
              const error = new Error(`Stock insuffisant pour le produit ${item.productId}.`);
              (error as Error & { status?: number }).status = 400;
              throw error;
            }
          }
        }
        await tx.insert(orderItems).values(
          items.map(({ variantId, ...i }) => ({ ...i, orderId: newOrder.id })),
        );
      }
      return newOrder;
    });
  }

  async getOrders(sessionId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.sessionId, sessionId));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getAllOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(orders.createdAt);
  }

  async getAdminStats() {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
    const totalStock = allProducts.reduce((sum, p) => sum + (p.stock ?? 0), 0);
    return {
      totalOrders: allOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalProducts: allProducts.length,
      totalStock,
      recentOrders: allOrders.slice(-5).reverse(),
    };
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateOrderStatus(id: number, approvalStatus: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ approvalStatus, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrderApprovalStatus(id: number, approvalStatus: string, rejectionReason?: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ approvalStatus, rejectionReason, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order;
  }

  async updateUserProfile(id: number, updates: { name?: string; email?: string }): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.getUserById(id);
    if (!user) return false;
    if (!await bcrypt.compare(oldPassword, user.password)) return false;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [updated] = await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id)).returning();
    return !!updated;
  }

  async getUserOrders(email: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.email, email));
  }

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async cancelOrder(id: number): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order || !['pending', 'accepted'].includes(order.approvalStatus)) return undefined;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (product) await db.update(products).set({ stock: (product.stock ?? 0) + item.quantity }).where(eq(products.id, item.productId));
    }
    const [updated] = await db.update(orders).set({ approvalStatus: 'cancelled' }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // ── CATEGORIES ───────────────────────────────────────────────
  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(name: string): Promise<Category> {
    const [cat] = await db.insert(categories).values({ name }).returning();
    return cat;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  // ── PROMO CODES ──────────────────────────────────────────────
  async getPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(promoCodes.createdAt);
  }

  async createPromoCode(data: InsertPromoCode): Promise<PromoCode> {
    const [promo] = await db.insert(promoCodes).values({
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses ?? null,
      active: data.active ?? true,
      expiresAt: data.expiresAt ?? null,
    }).returning();
    return promo;
  }

  async validatePromoCode(code: string): Promise<PromoCode | null> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase()));
    if (!promo || !promo.active) return null;
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null;
    if (promo.maxUses !== null && promo.uses >= promo.maxUses) return null;
    return promo;
  }

  async incrementPromoCodeUses(id: number): Promise<void> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (promo) await db.update(promoCodes).set({ uses: promo.uses + 1 }).where(eq(promoCodes.id, id));
  }

  async deletePromoCode(id: number): Promise<void> {
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }

  async togglePromoCode(id: number, active: boolean): Promise<PromoCode | undefined> {
    const [updated] = await db.update(promoCodes).set({ active }).where(eq(promoCodes.id, id)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

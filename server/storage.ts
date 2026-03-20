import { db } from "./db";
import {
  users,
  products,
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
import { eq, and, ilike, or } from "drizzle-orm";
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
  getCategories(): Promise<string[]>;
  decrementProductStock(productId: number, quantity: number): Promise<boolean>;

  // Cart
  getCartItems(sessionId: string, userId?: number): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem & { userId?: number }): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;
  mergeCartOnLogin(sessionId: string, userId: number): Promise<void>;

  // Wishlist
  getWishlist(sessionId: string): Promise<WishlistItemWithProduct[]>;
  addToWishlist(item: InsertWishlistItem): Promise<WishlistItem>;
  removeFromWishlist(id: number): Promise<void>;
  isInWishlist(sessionId: string, productId: number): Promise<boolean>;

  // Orders
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
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
    const [newUser] = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
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
    let query = db.select().from(products);

    if (search) {
      query = query.where(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.description, `%${search}%`)
        )
      );
    }

    if (category) {
      query = query.where(eq(products.category, category));
    }

    const allProducts = await query;

    if (sortBy === 'price-asc') {
      return allProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price-desc') {
      return allProducts.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'rating') {
      return allProducts.sort((a, b) => parseFloat(b.rating || '0') - parseFloat(a.rating || '0'));
    } else if (sortBy === 'newest') {
      return allProducts.reverse();
    }

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

  async getCategories(): Promise<string[]> {
    const rows = await db.select({ category: products.category }).from(products).distinct();
    return rows.map(row => row.category);
  }

  async decrementProductStock(productId: number, quantity: number): Promise<boolean> {
    const product = await this.getProduct(productId);
    if (!product || product.stock < quantity) return false;
    const newStock = product.stock - quantity;
    await db.update(products).set({ stock: newStock }).where(eq(products.id, productId));
    return true;
  }

  async getCartItems(sessionId: string, userId?: number): Promise<CartItemWithProduct[]> {
    let rows;

    if (userId) {
      rows = await db
        .select({ cartItem: cartItems, product: products })
        .from(cartItems)
        .where(or(eq(cartItems.sessionId, sessionId), eq(cartItems.userId, userId)))
        .leftJoin(products, eq(cartItems.productId, products.id));
    } else {
      rows = await db
        .select({ cartItem: cartItems, product: products })
        .from(cartItems)
        .where(eq(cartItems.sessionId, sessionId))
        .leftJoin(products, eq(cartItems.productId, products.id));
    }

    // Deduplicate by productId (in case same product exists via sessionId and userId)
    const seen = new Map<number, CartItemWithProduct>();
    for (const row of rows) {
      if (!row.product) continue;
      const item = { ...row.cartItem, product: row.product };
      const existing = seen.get(item.productId);
      if (existing) {
        // Keep the one with userId if available
        if (item.userId && !existing.userId) seen.set(item.productId, item);
      } else {
        seen.set(item.productId, item);
      }
    }
    return Array.from(seen.values());
  }

  async addToCart(item: InsertCartItem & { userId?: number }): Promise<CartItem> {
    // Check if product already in cart (by userId if available, else sessionId)
    const conditions = item.userId
      ? or(
          and(eq(cartItems.sessionId, item.sessionId), eq(cartItems.productId, item.productId)),
          and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId))
        )
      : and(eq(cartItems.sessionId, item.sessionId), eq(cartItems.productId, item.productId));

    const [existing] = await db.select().from(cartItems).where(conditions);

    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity, userId: item.userId ?? existing.userId })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values({
      productId: item.productId,
      quantity: item.quantity,
      sessionId: item.sessionId,
      userId: item.userId ?? null,
    }).returning();
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async mergeCartOnLogin(sessionId: string, userId: number): Promise<void> {
    // Get session items (not yet linked to this user)
    const sessionItems = await db.select().from(cartItems)
      .where(and(eq(cartItems.sessionId, sessionId)));

    for (const item of sessionItems) {
      if (item.userId === userId) continue; // already linked

      // Check if same product already in user's account cart
      const [userItem] = await db.select().from(cartItems)
        .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, item.productId)));

      if (userItem) {
        // Merge quantities
        await db.update(cartItems)
          .set({ quantity: userItem.quantity + item.quantity })
          .where(eq(cartItems.id, userItem.id));
        // Remove the session duplicate
        await db.delete(cartItems).where(eq(cartItems.id, item.id));
      } else {
        // Link to user
        await db.update(cartItems)
          .set({ userId })
          .where(eq(cartItems.id, item.id));
      }
    }
  }

  async getWishlist(sessionId: string): Promise<WishlistItemWithProduct[]> {
    const items = await db
      .select({ wishlistItem: wishlistItems, product: products })
      .from(wishlistItems)
      .where(eq(wishlistItems.sessionId, sessionId))
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

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({ ...item, orderId: newOrder.id }));
      await db.insert(orderItems).values(itemsWithOrderId);
      for (const item of items) {
        await this.decrementProductStock(item.productId, item.quantity);
      }
    }
    return newOrder;
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

  async getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: string;
    totalProducts: number;
    totalStock: number;
    recentOrders: Order[];
  }> {
    const allOrders = await db.select().from(orders);
    const allProducts = await db.select().from(products);
    const totalRevenue = allOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);
    const totalStock = allProducts.reduce((sum, product) => sum + product.stock, 0);
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
    return result.rowCount > 0;
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
    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return false;
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
      if (product) {
        await db.update(products).set({ stock: product.stock + item.quantity }).where(eq(products.id, item.productId));
      }
    }

    const [updated] = await db.update(orders).set({ approvalStatus: 'cancelled' }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // ── CATEGORIES ──────────────────────────────────────────────
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
    if (!promo) return null;
    if (!promo.active) return null;
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return null;
    if (promo.maxUses !== null && promo.uses >= promo.maxUses) return null;
    return promo;
  }

  async incrementPromoCodeUses(id: number): Promise<void> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
    if (promo) {
      await db.update(promoCodes).set({ uses: promo.uses + 1 }).where(eq(promoCodes.id, id));
    }
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

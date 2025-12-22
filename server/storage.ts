import { db } from "./db";
import {
  users,
  products,
  cartItems,
  orders,
  orderItems,
  wishlistItems,
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
  type WishlistItemWithProduct
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

  // Products
  getProducts(search?: string, category?: string, sortBy?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  getCategories(): Promise<string[]>;
  
  // Cart
  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;
  
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
  updateOrderApprovalStatus(id: number, approvalStatus: string, rejectionReason?: string): Promise<Order | undefined>;
  
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

    // Sort after fetching
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

  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const items = await db
      .select({
        cartItem: cartItems,
        product: products,
      })
      .from(cartItems)
      .where(eq(cartItems.sessionId, sessionId))
      .leftJoin(products, eq(cartItems.productId, products.id));

    return items
      .filter((item): item is { cartItem: CartItem; product: Product } => !!item.product)
      .map(({ cartItem, product }) => ({ ...cartItem, product }));
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(
        eq(cartItems.sessionId, item.sessionId),
        eq(cartItems.productId, item.productId)
      ));

    if (existing) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + item.quantity })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return updated;
    }

    const [newItem] = await db.insert(cartItems).values(item).returning();
    return newItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  async getWishlist(sessionId: string): Promise<WishlistItemWithProduct[]> {
    const items = await db
      .select({
        wishlistItem: wishlistItems,
        product: products,
      })
      .from(wishlistItems)
      .where(eq(wishlistItems.sessionId, sessionId))
      .leftJoin(products, eq(wishlistItems.productId, products.id));

    return items
      .filter((item): item is { wishlistItem: WishlistItem; product: Product } => !!item.product)
      .map(({ wishlistItem, product }) => ({ ...wishlistItem, product }));
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    const [existing] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.sessionId, item.sessionId),
        eq(wishlistItems.productId, item.productId)
      ));

    if (existing) {
      return existing;
    }

    const [newItem] = await db.insert(wishlistItems).values(item).returning();
    return newItem;
  }

  async removeFromWishlist(id: number): Promise<void> {
    await db.delete(wishlistItems).where(eq(wishlistItems.id, id));
  }

  async isInWishlist(sessionId: string, productId: number): Promise<boolean> {
    const [item] = await db
      .select()
      .from(wishlistItems)
      .where(and(
        eq(wishlistItems.sessionId, sessionId),
        eq(wishlistItems.productId, productId)
      ));
    return !!item;
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    if (items.length > 0) {
      const itemsWithOrderId = items.map(item => ({ ...item, orderId: newOrder.id }));
      await db.insert(orderItems).values(itemsWithOrderId);
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

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async updateOrderApprovalStatus(id: number, approvalStatus: string, rejectionReason?: string): Promise<Order | undefined> {
    const [order] = await db.update(orders)
      .set({ approvalStatus, rejectionReason, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }
}

export const storage = new DatabaseStorage();

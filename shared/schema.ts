import { sql } from "drizzle-orm";
import { pgTable, text, serial, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  phoneCountry: text("phone_country"),
  city: text("city"),
  district: text("district"),
  role: text("role").notNull().default("client"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price").notNull(),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  rating: numeric("rating").default("4.5"),
  reviews: integer("reviews").default(0),
  stock: integer("stock").default(100),
  minOrderQty: integer("min_order_qty"), // null = vente normale, ≥ 2 = vente en gros
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  total: numeric("total").notNull(),
  status: text("status").notNull().default("pending"),
  approvalStatus: text("approval_status").notNull().default("pending"),
  email: text("email").notNull(),
  address: text("address").notNull(),
  paymentMethod: text("payment_method").notNull().default("delivery"),
  paymentDetails: text("payment_details"),
  rejectionReason: text("rejection_reason"),
  promoCode: text("promo_code"),
  discount: numeric("discount").default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name"), // nom du produit au moment de la commande
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
});

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"),
  discountValue: numeric("discount_value").notNull(),
  maxUses: integer("max_uses"),
  uses: integer("uses").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── SCHEMAS ───────────────────────────────────────────────────
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  phone: z.string().min(8, "Le numéro de téléphone doit avoir au moins 8 chiffres"),
  phoneCountry: z.string().min(1, "Sélectionnez un pays"),
  city: z.string().min(2, "La ville est requise"),
  district: z.string().min(2, "Le quartier est requis"),
}).omit({ name: true });

export const insertProductSchema = createInsertSchema(products).omit({ id: true }).extend({
  minOrderQty: z.number().int().min(1).optional().nullable(),
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });
export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({ id: true, createdAt: true });

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true, status: true, approvalStatus: true, rejectionReason: true }).extend({
  paymentMethod: z.enum(["delivery", "mynita", "amanata"]).default("delivery"),
  promoCode: z.string().optional(),
  discount: z.string().optional(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true }).extend({
  productName: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true, createdAt: true, uses: true }).extend({
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.string().min(1),
  maxUses: z.number().optional(),
});

// ── TYPES ─────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;

export type CartItemWithProduct = CartItem & { product: Product };
export type WishlistItemWithProduct = WishlistItem & { product: Product };

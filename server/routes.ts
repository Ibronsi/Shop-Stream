import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    await storage.createProduct({
      name: "Wireless Headphones",
      description: "Premium noise-canceling wireless headphones with 30-hour battery life.",
      price: "199.99",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      category: "Electronics"
    });
    await storage.createProduct({
      name: "Minimalist Watch",
      description: "Classic design meets modern minimalism. Genuine leather strap.",
      price: "129.50",
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      category: "Accessories"
    });
    await storage.createProduct({
      name: "Smart Speaker",
      description: "Voice-controlled smart speaker with high-fidelity audio.",
      price: "89.99",
      imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80",
      category: "Electronics"
    });
    await storage.createProduct({
      name: "Designer Backpack",
      description: "Durable and stylish backpack for everyday use.",
      price: "75.00",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      category: "Fashion"
    });
    await storage.createProduct({
      name: "Mechanical Keyboard",
      description: "Tactile switches for the ultimate typing experience.",
      price: "149.00",
      imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
      category: "Electronics"
    });
    await storage.createProduct({
      name: "Polaroid Camera",
      description: "Capture memories instantly with this vintage-style camera.",
      price: "119.95",
      imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
      category: "Photography"
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Seed data on startup
  await seedDatabase();

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });

  // Cart
  app.get(api.cart.list.path, async (req, res) => {
    const items = await storage.getCartItems(req.params.sessionId);
    res.json(items);
  });

  app.post(api.cart.add.path, async (req, res) => {
    try {
      const input = api.cart.add.input.parse(req.body);
      const item = await storage.addToCart(input);
      res.json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.patch(api.cart.update.path, async (req, res) => {
    const input = api.cart.update.input.parse(req.body);
    const item = await storage.updateCartItem(Number(req.params.id), input.quantity);
    res.json(item);
  });

  app.delete(api.cart.delete.path, async (req, res) => {
    await storage.removeFromCart(Number(req.params.id));
    res.status(204).end();
  });

  app.delete(api.cart.clear.path, async (req, res) => {
    await storage.clearCart(req.params.sessionId);
    res.status(204).end();
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      
      // Get cart items to convert to order items
      const cartItems = await storage.getCartItems(input.sessionId);
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }

      const orderItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.product.price
      }));

      const order = await storage.createOrder(input, orderItems);
      
      // Clear cart after order
      await storage.clearCart(input.sessionId);

      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  return httpServer;
}

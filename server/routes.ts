import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { desc } from "drizzle-orm";

async function seedDatabase() {
  const existingProducts = await storage.getProducts();
  if (existingProducts.length === 0) {
    const productsData = [
      {
        name: "Wireless Headphones",
        description: "Premium noise-canceling wireless headphones with 30-hour battery life and premium sound quality.",
        price: "199.99",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        category: "Electronics",
        rating: "4.8",
        reviews: 324,
        stock: 50
      },
      {
        name: "Minimalist Watch",
        description: "Classic design meets modern minimalism. Premium stainless steel with genuine leather strap.",
        price: "129.50",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        category: "Accessories",
        rating: "4.6",
        reviews: 156,
        stock: 75
      },
      {
        name: "Smart Speaker",
        description: "Voice-controlled smart speaker with high-fidelity audio and AI integration.",
        price: "89.99",
        imageUrl: "https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800&q=80",
        category: "Electronics",
        rating: "4.4",
        reviews: 287,
        stock: 120
      },
      {
        name: "Designer Backpack",
        description: "Durable and stylish backpack perfect for everyday use with multiple compartments.",
        price: "75.00",
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
        category: "Fashion",
        rating: "4.5",
        reviews: 203,
        stock: 89
      },
      {
        name: "Mechanical Keyboard",
        description: "Premium mechanical keyboard with tactile switches for the ultimate typing experience.",
        price: "149.00",
        imageUrl: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800&q=80",
        category: "Electronics",
        rating: "4.7",
        reviews: 412,
        stock: 45
      },
      {
        name: "Polaroid Camera",
        description: "Capture memories instantly with this vintage-style instant camera.",
        price: "119.95",
        imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
        category: "Photography",
        rating: "4.3",
        reviews: 189,
        stock: 35
      },
      {
        name: "Portable Charger",
        description: "High-capacity portable charger with fast charging support for multiple devices.",
        price: "49.99",
        imageUrl: "https://images.unsplash.com/photo-1609042231871-5c5b4b8b6b0e?w=800&q=80",
        category: "Electronics",
        rating: "4.6",
        reviews: 521,
        stock: 200
      },
      {
        name: "Leather Messenger Bag",
        description: "Premium genuine leather messenger bag perfect for work and travel.",
        price: "189.00",
        imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80",
        category: "Accessories",
        rating: "4.7",
        reviews: 267,
        stock: 40
      }
    ];

    for (const product of productsData) {
      await storage.createProduct(product);
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  // Products
  app.get(api.products.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const category = req.query.category as string | undefined;
    const sortBy = req.query.sortBy as string | undefined;

    const products = await storage.getProducts(search, category, sortBy);
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  });

  app.post(api.products.create.path, async (req, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
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
    try {
      const input = api.cart.update.input.parse(req.body);
      const item = await storage.updateCartItem(Number(req.params.id), input.quantity);
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

  app.delete(api.cart.delete.path, async (req, res) => {
    await storage.removeFromCart(Number(req.params.id));
    res.status(204).end();
  });

  app.delete(api.cart.clear.path, async (req, res) => {
    await storage.clearCart(req.params.sessionId);
    res.status(204).end();
  });

  // Wishlist
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
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.wishlist.delete.path, async (req, res) => {
    await storage.removeFromWishlist(Number(req.params.id));
    res.status(204).end();
  });

  // Orders
  app.post(api.orders.create.path, async (req, res) => {
    try {
      const input = api.orders.create.input.parse(req.body);
      
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

  app.get(api.orders.list.path, async (req, res) => {
    const orders = await storage.getOrders(req.params.sessionId);
    res.json(orders);
  });

  app.get(api.orders.get.path, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  });

  app.get(api.orders.allOrders.path, async (req, res) => {
    const allOrders = await storage.getAllOrders();
    res.json(allOrders);
  });

  // Admin Stats
  app.get(api.admin.stats.path, async (req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  // Update Product
  app.patch(api.admin.updateProduct.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.updateProduct.input.parse(req.body);
      const product = await storage.updateProduct(id, input);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
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

  // Delete Product
  app.delete(api.admin.deleteProduct.path, async (req, res) => {
    const id = Number(req.params.id);
    const deleted = await storage.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).send();
  });

  // Update Order Status
  app.patch(api.admin.updateOrderStatus.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.updateOrderStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(id, input.status);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
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

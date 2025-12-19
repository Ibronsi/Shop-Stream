import { z } from 'zod';
import { insertProductSchema, insertCartItemSchema, insertOrderSchema, insertWishlistItemSchema, products, cartItems, orders, wishlistItems } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  products: {
    list: {
      method: 'GET' as const,
      path: '/api/products',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(['price-asc', 'price-desc', 'rating', 'newest']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/products/:id',
      responses: {
        200: z.custom<typeof products.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/products',
      input: insertProductSchema,
      responses: {
        201: z.custom<typeof products.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  cart: {
    list: {
      method: 'GET' as const,
      path: '/api/cart/:sessionId',
      responses: {
        200: z.array(z.custom<typeof cartItems.$inferSelect & { product: typeof products.$inferSelect }>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/cart',
      input: insertCartItemSchema,
      responses: {
        200: z.custom<typeof cartItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/cart/:id',
      input: z.object({ quantity: z.number().min(1) }),
      responses: {
        200: z.custom<typeof cartItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/cart/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    clear: {
      method: 'DELETE' as const,
      path: '/api/cart/session/:sessionId',
      responses: {
        204: z.void(),
      },
    },
  },
  wishlist: {
    list: {
      method: 'GET' as const,
      path: '/api/wishlist/:sessionId',
      responses: {
        200: z.array(z.custom<typeof wishlistItems.$inferSelect & { product: typeof products.$inferSelect }>()),
      },
    },
    add: {
      method: 'POST' as const,
      path: '/api/wishlist',
      input: insertWishlistItemSchema,
      responses: {
        200: z.custom<typeof wishlistItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/wishlist/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  orders: {
    create: {
      method: 'POST' as const,
      path: '/api/orders',
      input: insertOrderSchema,
      responses: {
        201: z.custom<typeof orders.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/orders/:sessionId',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/orders/:id',
      responses: {
        200: z.custom<typeof orders.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    allOrders: {
      method: 'GET' as const,
      path: '/api/admin/orders',
      responses: {
        200: z.array(z.custom<typeof orders.$inferSelect>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

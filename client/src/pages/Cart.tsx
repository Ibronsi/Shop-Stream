import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useCart, useUpdateCartItem, useRemoveFromCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export default function Cart() {
  useSEO({
    title: "Shopping Cart",
    description: "Review and manage your shopping cart. Proceed to checkout securely.",
    keywords: "shopping cart, checkout, purchase",
  });
  const sessionId = useSession();
  const { data: cartItems, isLoading } = useCart(sessionId);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveFromCart();

  const total = cartItems?.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  ) ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-4">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            Looks like you haven't added anything to your cart yet. Browse our products to find something you love.
          </p>
          <Link href="/">
            <Button size="lg" className="h-12 px-8 text-lg font-medium">
              Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="font-display text-4xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div 
                key={item.id} 
                className="flex gap-6 p-6 bg-card rounded-xl border border-border/50 shadow-sm"
              >
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        <Link href={`/product/${item.product.id}`} className="hover:text-primary transition-colors">
                          {item.product.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted-foreground">{item.product.category}</p>
                    </div>
                    <p className="font-bold text-lg text-foreground">
                      ${Number(item.product.price) * item.quantity}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3 bg-secondary/50 rounded-lg p-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-white"
                        onClick={() => {
                          if (!sessionId) return;
                          if (item.quantity > 1) {
                            updateItem.mutate({ id: item.id, quantity: item.quantity - 1, sessionId });
                          } else {
                            removeItem.mutate({ id: item.id, sessionId });
                          }
                        }}
                        disabled={updateItem.isPending || removeItem.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-md hover:bg-white"
                        onClick={() => {
                          if (!sessionId) return;
                          updateItem.mutate({ id: item.id, quantity: item.quantity + 1, sessionId });
                        }}
                        disabled={updateItem.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => sessionId && removeItem.mutate({ id: item.id, sessionId })}
                      disabled={removeItem.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg sticky top-24">
              <h2 className="font-display text-2xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-xl text-foreground">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/checkout" className="w-full">
                <Button size="lg" className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/hooks/use-session";
import { useCreateOrder } from "@/hooks/use-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";

const checkoutSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  zipCode: z.string().min(4, "Valid ZIP code is required"),
  name: z.string().min(2, "Full name is required"),
  paymentMethod: z.enum(["delivery", "mynita", "amanata"]).default("delivery"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  useSEO({
    title: "Checkout",
    description: "Complete your purchase securely with multiple payment options including MyNita and MyAmanata.",
    keywords: "checkout, payment, purchase, MyNita, MyAmanata",
  });
  const sessionId = useSession();
  const { data: cartItems } = useCart(sessionId);
  const createOrder = useCreateOrder();
  
  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      address: "",
      city: "",
      zipCode: "",
      name: "",
      paymentMethod: "delivery",
    },
  });

  const total = cartItems?.reduce(
    (acc, item) => acc + Number(item.product.price) * item.quantity,
    0
  ) ?? 0;

  const onSubmit = (data: CheckoutForm) => {
    if (!sessionId || !cartItems || cartItems.length === 0) return;

    let paymentDetails = "";
    if (data.paymentMethod === "mynita") {
      paymentDetails = "MyNita: 97120634";
    } else if (data.paymentMethod === "amanata") {
      paymentDetails = "My Amanata: 97120634";
    }

    createOrder.mutate({
      sessionId,
      email: data.email,
      address: `${data.name}\n${data.address}\n${data.city}, ${data.zipCode}`,
      total: total.toString(),
      paymentMethod: data.paymentMethod,
      paymentDetails,
    });
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Cart is empty</h2>
          <Link href="/"><Button>Go Shopping</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          
          {/* Checkout Form */}
          <div>
            <h1 className="font-display text-3xl font-bold mb-8">Checkout</h1>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-11 rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" type="email" {...field} className="h-11 rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} className="h-11 rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} className="h-11 rounded-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP / Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} className="h-11 rounded-lg" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Méthode de paiement</FormLabel>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "delivery")}>
                          <input type="radio" checked={field.value === "delivery"} onChange={() => form.setValue("paymentMethod", "delivery")} className="cursor-pointer" />
                          <div>
                            <p className="font-semibold">À la réception</p>
                            <p className="text-sm text-muted-foreground">Payer à la livraison</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "mynita")}>
                          <input type="radio" checked={field.value === "mynita"} onChange={() => form.setValue("paymentMethod", "mynita")} className="cursor-pointer" />
                          <div>
                            <p className="font-semibold">MyNita</p>
                            <p className="text-sm text-muted-foreground">Numéro: 97120634</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-secondary/30" onClick={() => form.setValue("paymentMethod", "amanata")}>
                          <input type="radio" checked={field.value === "amanata"} onChange={() => form.setValue("paymentMethod", "amanata")} className="cursor-pointer" />
                          <div>
                            <p className="font-semibold">My Amanata</p>
                            <p className="text-sm text-muted-foreground">Numéro: 97120634</p>
                          </div>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 rounded-xl"
                    disabled={createOrder.isPending}
                  >
                    {createOrder.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <Lock className="h-5 w-5 mr-2" />
                    )}
                    {createOrder.isPending ? "Processing..." : `Pay $${total.toFixed(2)}`}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <Lock className="h-3 w-3" />
                    Payments are secure and encrypted
                  </p>
                </div>
              </form>
            </Form>
          </div>

          {/* Order Preview */}
          <div className="bg-secondary/30 rounded-2xl p-8 h-fit border border-border/50">
            <h2 className="font-display text-xl font-bold mb-6">Your Order</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 items-center">
                  <div className="h-16 w-16 bg-white rounded-md overflow-hidden flex-shrink-0">
                    <img 
                      src={item.product.imageUrl} 
                      alt={item.product.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-foreground">{item.product.name}</p>
                    <p className="text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-primary font-medium">Free</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 text-primary">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

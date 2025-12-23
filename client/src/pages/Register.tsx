import { Navbar } from "@/components/Navbar";
import { useRegister } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { z } from "zod";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PHONE_COUNTRY_CODES = [
  { code: "NE", country: "Niger", dial: "+227" },
  { code: "SN", country: "Sénégal", dial: "+221" },
  { code: "FR", country: "France", dial: "+33" },
  { code: "BF", country: "Burkina Faso", dial: "+226" },
  { code: "ML", country: "Mali", dial: "+223" },
  { code: "CI", country: "Côte d'Ivoire", dial: "+225" },
  { code: "TG", country: "Togo", dial: "+228" },
  { code: "BJ", country: "Bénin", dial: "+229" },
  { code: "GN", country: "Guinée", dial: "+224" },
  { code: "NGA", country: "Nigeria", dial: "+234" },
];

const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit avoir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phoneCountry: z.string().min(1, "Sélectionnez un pays"),
  phone: z.string().min(8, "Le numéro doit avoir au moins 8 chiffres"),
  city: z.string().min(2, "La ville est requise"),
  district: z.string().min(2, "Le quartier est requis"),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  useSEO({
    title: "Register",
    description: "Create a new account on LuxeStore to start shopping and save your preferences.",
    keywords: "register, signup, account creation",
  });

  const { toast } = useToast();
  const [, navigate] = useLocation();
  const register = useRegister();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneCountry: "NE",
      phone: "",
      city: "",
      district: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterForm) => {
    const fullName = `${data.firstName} ${data.lastName}`;
    register.mutate({
      email: data.email,
      password: data.password,
      name: fullName,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      phoneCountry: data.phoneCountry,
      city: data.city,
      district: data.district,
    }, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Inscription réussie! Vous pouvez vous connecter." });
        navigate("/login");
      },
      onError: () => {
        toast({ title: "Erreur", description: "Cet email est déjà utilisé", variant: "destructive" });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <h1 className="font-display text-3xl font-bold mb-8 text-center">S'inscrire</h1>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Names */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} data-testid="input-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} data-testid="input-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jean@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Téléphone</label>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="phoneCountry"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger data-testid="select-phoneCountry">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PHONE_COUNTRY_CODES.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  {country.country} ({country.dial})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="7XXXXXXXX" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Niamey" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quartier</FormLabel>
                        <FormControl>
                          <Input placeholder="Plateau" {...field} data-testid="input-district" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={register.isPending}
                  data-testid="button-register"
                >
                  {register.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Inscription en cours...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      S'inscrire
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Vous avez déjà un compte?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Se connecter
                  </Link>
                </p>
              </form>
            </Form>
          </Card>
        </div>
      </main>
    </div>
  );
}

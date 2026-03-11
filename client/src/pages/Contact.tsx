import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { z } from "zod";
import { useState } from "react";

const contactSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Le téléphone est requis"),
  subject: z.string().min(5, "Le sujet est requis"),
  message: z.string().min(10, "Le message doit avoir au moins 10 caractères"),
});

type ContactForm = z.infer<typeof contactSchema>;

export default function Contact() {
  useSEO({
    title: "Nous Contacter | LuxeStore",
    description: "Contactez LuxeStore pour toute question ou assistance.",
    keywords: "contact, aide, support, luxestore",
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Succès",
        description: "Votre message a été envoyé. Nous vous répondrons bientôt.",
      });
      
      form.reset();
    } catch {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Nous Contacter</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Informations de Contact</h2>
            
            <div className="flex items-start space-x-4">
              <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Téléphone</h3>
                <p className="text-muted-foreground">+227 97 12 06 34</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Email</h3>
                <p className="text-muted-foreground">contact@luxestore.ne</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Adresse</h3>
                <p className="text-muted-foreground">Niamey, Niger</p>
              </div>
            </div>

            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Heures de Service</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Lundi - Vendredi: 9h - 18h</li>
                <li>Samedi: 10h - 16h</li>
                <li>Dimanche: Fermé</li>
              </ul>
            </Card>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Votre nom" {...field} data-testid="input-contact-name" />
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
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="votre@email.com" {...field} data-testid="input-contact-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone</FormLabel>
                        <FormControl>
                          <Input placeholder="+227 XXXXXXXX" {...field} data-testid="input-contact-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sujet</FormLabel>
                        <FormControl>
                          <Input placeholder="Sujet de votre message" {...field} data-testid="input-contact-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Votre message..." 
                            rows={4}
                            {...field} 
                            data-testid="textarea-contact-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    data-testid="button-contact-submit"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le message"
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>
        </div>

        {/* Payment Methods Info */}
        <Card className="p-6 bg-muted/50">
          <h2 className="text-xl font-semibold mb-3">Méthodes de Paiement Supportées</h2>
          <p className="text-muted-foreground mb-3">
            Nous acceptons les paiements via les solutions mobiles les plus populaires au Niger :
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-primary">MyNita</h3>
              <p className="text-sm text-muted-foreground">Paiement mobile sécurisé</p>
            </div>
            <div>
              <h3 className="font-semibold text-primary">MyAmanata</h3>
              <p className="text-sm text-muted-foreground">Service de paiement fiable</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}

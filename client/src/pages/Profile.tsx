import { Navbar } from "@/components/Navbar";
import { useSEO } from "@/hooks/use-seo";
import { useCurrentUser } from "@/hooks/use-auth";
import { useUpdateProfile, useChangePassword } from "@/hooks/use-user";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Loader2, ChevronLeft } from "lucide-react";
import { z } from "zod";
import { useState } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Veuillez entrer votre mot de passe"),
  newPassword: z.string().min(6, "Le nouveau mot de passe doit avoir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function Profile() {
  useSEO({
    title: "Mon Profil",
    description: "Gérez votre profil utilisateur et vos paramètres de compte",
    keywords: "profil, paramètres, compte",
  });

  const { data: currentUser, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  if (!currentUser && !isLoading) {
    navigate("/login");
    return null;
  }

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast({ title: "Succès", description: "Profil mis à jour" });
      },
      onError: () => {
        toast({ title: "Erreur", description: "Impossible de mettre à jour le profil", variant: "destructive" });
      },
    });
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toast({ title: "Succès", description: "Mot de passe changé" });
          passwordForm.reset();
          setShowPasswordForm(false);
        },
        onError: () => {
          toast({ title: "Erreur", description: "Mot de passe incorrect", variant: "destructive" });
        },
      }
    );
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Informations Personnelles</h2>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input placeholder="Votre nom" {...field} data-testid="input-profile-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="votre@email.com" {...field} data-testid="input-profile-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={updateProfile.isPending}
                  data-testid="button-save-profile"
                >
                  {updateProfile.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les modifications"
                  )}
                </Button>
              </form>
            </Form>
          </Card>

          {/* Password Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Sécurité</h2>
              {!showPasswordForm && (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(true)}
                  data-testid="button-change-password"
                >
                  Changer le mot de passe
                </Button>
              )}
            </div>

            {showPasswordForm && (
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Entrez votre mot de passe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Nouveau mot de passe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmez le mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirmez le mot de passe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={changePassword.isPending}
                      data-testid="button-confirm-password"
                    >
                      {changePassword.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Changement...
                        </>
                      ) : (
                        "Changer le mot de passe"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        passwordForm.reset();
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

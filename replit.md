# E-commerce Niger — Documentation Projet

## Vue d'ensemble
Application e-commerce complète et responsive ciblant le marché nigérien. Interface entièrement en français, prix en CFA, paiements locaux MyNita et My Amanata.

## Stack Technique
- **Frontend** : React + TypeScript, TanStack Query, Tailwind CSS, shadcn/ui, Framer Motion, Wouter (routing)
- **Backend** : Express.js + TypeScript, Drizzle ORM, PostgreSQL
- **Auth** : Sessions Express + bcrypt
- **Build** : Vite (frontend) + tsx (backend)

## Architecture
- `client/src/` — frontend React
- `server/` — backend Express (routes.ts, storage.ts, db.ts, index.ts)
- `shared/schema.ts` — types Drizzle partagés frontend/backend
- Serveur unique port 5000 (Express sert aussi le build Vite)

## Base de données (tables)
| Table | Description |
|---|---|
| `users` | Comptes clients & admins |
| `session` | Sessions Express |
| `products` | Catalogue produits |
| `categories` | Catégories dynamiques (admin) |
| `cart_items` | Panier (sessionId + userId optionnel) |
| `wishlist_items` | Liste de souhaits (sessionId) |
| `orders` | Commandes (avec promoCode, discount) |
| `order_items` | Articles par commande |
| `promo_codes` | Codes promo (% ou montant fixe) |

## Fonctionnalités

### Client
- Catalogue produits avec recherche, filtres avancés (prix, catégorie, note), pagination (12/page)
- Panier persistant — lié au compte (userId) lors de la connexion
- Wishlist (liste de souhaits)
- Checkout avec code promo, paiement MyNita/My Amanata/à la livraison
- Page confirmation de commande avec instructions de paiement
- Mes Commandes avec détail des articles, statut temps réel, annulation
- Profil utilisateur (édition nom, email, mot de passe)

### Admin
- Dashboard avec stats (commandes, CA, produits, stock)
- Gestion commandes : changement de statut (en attente → acceptée → en préparation → prête → livrée)
- Gestion produits : ajout/suppression
- **Catégories dynamiques** : création/suppression de catégories depuis le dashboard
- **Codes promo** : création (% ou CFA fixe), activation/désactivation, suppression

### Auth
- Inscription avec validation complète (email, nom, téléphone, ville, quartier)
- Connexion avec fusion automatique du panier session → compte
- Rôles : `client` | `admin`

## Paiements
- **À la livraison** : espèces
- **MyNita** : numéro 97120634
- **My Amanata** : numéro 97120634

## Statuts de commande (approvalStatus)
`pending` → `accepted` → `preparing` → `ready` → `delivered`  
Exception : `rejected` (admin), `cancelled` (client)

## Variables d'environnement
- `DATABASE_URL` — connexion PostgreSQL
- `SESSION_SECRET` — secret sessions Express

## Scripts
```bash
npm run dev      # Démarrer en développement
npm run db:push  # Synchroniser le schéma DB
npm run build    # Build production
```

## Notes importantes
- Le serveur Express **ne se recharge PAS automatiquement** après modification de `server/` — redémarrer le workflow manuellement
- Après `db:push`, redémarrer le workflow
- Les catégories dynamiques utilisent la table `categories`; si vide, la page d'accueil utilise les catégories issues des produits comme fallback
- La validation des codes promo est faite **côté serveur** (recalcul du discount) pour sécurité

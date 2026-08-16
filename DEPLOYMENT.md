# Déploiement de Shop Stream

Ce projet est maintenant prévu pour un déploiement séparé :

- **Supabase** héberge PostgreSQL ;
- **Render** héberge l'API Express ;
- **Vercel** héberge le frontend React/Vite ;
- **UptimeRobot** surveille l'API Render.

## 1. GitHub

Créer le dépôt privé ou public `Ibronsi/Shop-Stream`, puis pousser le contenu du projet.

Ne jamais pousser :

- `.env` ;
- les mots de passe ;
- les secrets de session ;
- `node_modules` ;
- `dist`.

Le fichier `.env.example` peut être publié : il ne contient que des exemples.

## 2. Supabase

1. Créer un projet PostgreSQL Supabase.
2. Récupérer l'URL de connexion PostgreSQL, de préférence la chaîne **Connection Pooler** si le projet utilise beaucoup de connexions.
3. Exécuter une fois, depuis un environnement où `DATABASE_URL` est configurée :

```bash
npm ci
npm run db:push
```

La commande synchronise les tables définies dans `shared/schema.ts`.

Pour Supabase, configurer :

```text
DATABASE_URL=postgresql://...
DB_SSL=true
```

Le serveur détecte également `sslmode=require` dans l'URL.

## 3. Render — backend Express

Le fichier `render.yaml` contient la configuration du service API.

### Build et démarrage

```text
Build command : npm ci && npm run build:server
Start command : npm run start:server
Health check  : /health
```

### Variables Render

Configurer les variables suivantes dans Render :

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL PostgreSQL Supabase |
| `DB_SSL` | `true` |
| `SESSION_SECRET` | secret long et aléatoire |
| `CORS_ORIGIN` | URL Vercel, sans slash final |
| `PUBLIC_API_URL` | URL publique Render, sans slash final |
| `SERVE_STATIC` | `false` |
| `ADMIN_EMAIL` | email du compte administrateur |
| `ADMIN_PASSWORD` | mot de passe administrateur fort |

`ADMIN_EMAIL` et `ADMIN_PASSWORD` sont utilisés uniquement au démarrage pour créer
le compte administrateur s'il n'existe pas encore. Le mot de passe n'est plus
codé dans le dépôt.

## 4. Vercel — frontend React

Importer le même dépôt GitHub dans Vercel et configurer :

```text
Build command   : npm run build:client
Output dir      : dist/public
Install command : npm ci
```

Variable d'environnement Vercel :

```text
VITE_API_URL=https://votre-api.onrender.com
```

Le frontend utilise cette variable pour toutes les requêtes API et les images
hébergées par l'API. Les cookies de session sont configurés pour fonctionner
entre le domaine Vercel et le domaine Render.

Après avoir obtenu l'URL Vercel, reporter cette URL dans Render :

```text
CORS_ORIGIN=https://votre-boutique.vercel.app
```

Pour accepter plusieurs domaines Vercel, les séparer par des virgules.

## 5. UptimeRobot

Créer un monitor HTTP(s) avec :

```text
URL : https://votre-api.onrender.com/health
Intervalle : 5 minutes
```

La réponse attendue est :

```json
{"status":"ok"}
```

## Commandes locales utiles

```bash
npm run check
npm run build
npm run dev
```

Pour tester le backend séparément :

```bash
NODE_ENV=production SERVE_STATIC=false npm run start:server
```

## Limite à traiter avant une boutique à fort trafic

Les images uploadées dans `public/uploads` sont stockées sur le disque local du
serveur Render. Ce disque peut être réinitialisé lors d'un redéploiement.
Pour une exploitation durable, remplacer cet upload par Supabase Storage ou un
autre stockage objet persistant.
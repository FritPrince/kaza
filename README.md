# Kaza — Assistant visuel intelligent de l'habitat

De l'idée floue au rendu photoréaliste, puis du rendu à l'action.

Monorepo Turborepo + pnpm regroupant les trois applications et les contrats partagés
(voir le [cahier des charges](cahier-des-charges-kaza.md)).

## Structure

```
apps/
  api/      API REST NestJS — auth, projets, générations IA (BullMQ), paiements, admin
  admin/    Back-office Next.js (App Router) — réservé à l'équipe
  mobile/   Application Expo / React Native — iOS + Android
packages/
  shared/   Types TypeScript + schémas Zod — source de vérité unique des contrats
```

## Prérequis

- Node.js ≥ 22, pnpm ≥ 11
- PostgreSQL 16+ et Redis 7+ (locaux ou via Docker)
- Un appareil ou émulateur pour l'app mobile (Expo Go suffit en dev)

## Démarrage rapide

```bash
pnpm install

# 1. Base de données
cp apps/api/.env.example apps/api/.env    # renseigner DATABASE_URL, secrets JWT…
pnpm --filter @kaza/api prisma:migrate    # crée le schéma
pnpm --filter @kaza/api prisma:generate

# 2. Lancer les apps (dans des terminaux séparés, ou `pnpm dev` pour tout)
pnpm --filter @kaza/api dev       # API sur http://localhost:3001 (Swagger: /docs)
pnpm --filter @kaza/admin dev     # Back-office sur http://localhost:3000
pnpm --filter @kaza/mobile dev    # Expo (QR code pour Expo Go)
```

Sans clés IA configurées, l'agent d'entretien répond avec une question de
démonstration et les fournisseurs d'images lèvent une erreur explicite : le flux
complet de génération sera branché à l'issue du sprint de validation technique
(cahier des charges §12).

## Commandes

| Commande | Effet |
| --- | --- |
| `pnpm dev` | Lance toutes les apps en parallèle (Turborepo) |
| `pnpm build` | Build de production de toutes les apps |
| `pnpm typecheck` | Vérification TypeScript stricte sur tout le monorepo |
| `pnpm lint` / `pnpm format` | Lint ESLint / formatage Prettier |
| `pnpm --filter @kaza/api prisma:studio` | Explorateur visuel de la base |

## Architecture

- **Contrats partagés** : chaque payload validé côté API l'est avec les schémas Zod
  de `@kaza/shared`, également consommés par le mobile et l'admin — un seul endroit
  à modifier quand un contrat évolue.
- **Générations IA** : file BullMQ (`pending → processing → done/failed`, 3 tentatives,
  remboursement du crédit en cas d'échec définitif). Les clés d'API IA ne quittent
  jamais le serveur.
- **Abstractions fournisseurs** : `ImageProvider` (Replicate/Gemini), `SmsProvider`
  (Termii/Twilio) — bascule par variable d'environnement, sans toucher aux clients.
- **Back-office** : RBAC (super-admin, support, finance, modérateur), 2FA prévue,
  journal d'audit sur chaque action sensible.

## Design

Identité chaleureuse et premium (§7.6) : tons terre — `ink #22201C`, `paper #F7F2E9`,
`sand #E7DCC8`, `clay #B4552D`, `forest #234436`, `gold #C99B3F` — typographie
Fraunces (display) / Archivo (UI), partagée entre le mobile et l'admin.

## Conventions

Voir la [Charte et Conventions de Développement](<# Charte et Conventions de Développement.md>) :
code et commits en anglais, Conventional Commits, PR obligatoires, TypeScript strict,
aucun secret commité (`.env` ignorés, `.env.example` versionnés).

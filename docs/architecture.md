# Architecture technique — Kaza

## Vue d'ensemble

```
┌──────────────┐        ┌──────────────┐
│ apps/mobile  │        │ apps/admin   │
│ Expo / RN    │        │ Next.js      │
└──────┬───────┘        └──────┬───────┘
       │      REST (JWT)       │  REST (JWT admin + RBAC)
       └───────────┬───────────┘
                   ▼
            ┌──────────────┐     ┌────────────┐
            │  apps/api    │────▶│ PostgreSQL │  (Prisma)
            │  NestJS      │     └────────────┘
            │              │     ┌────────────┐
            │  BullMQ ─────┼────▶│   Redis    │  (file de générations)
            └──────┬───────┘     └────────────┘
                   │
      ┌────────────┼─────────────────┐
      ▼            ▼                 ▼
  Claude API   ImageProvider     Stockage S3
  (entretien)  (Replicate/       (photos + rendus,
               Gemini)           URLs signées)
```

`packages/shared` fournit les types et schémas Zod consommés par les trois apps —
une seule source de vérité pour les contrats (§7.3).

## Flux de génération (module B)

1. L'app mobile envoie la photo compressée (~1080p) ; l'API la stocke sur S3.
2. L'entretien conversationnel (`POST /rooms/:id/chat`) est orchestré par
   `InterviewAgentService` (API Claude, sorties JSON structurées → boutons de
   réponse rapide côté mobile).
3. Quand l'agent renvoie `ready-to-generate`, le mobile appelle
   `POST /generations` : les crédits sont décrémentés **atomiquement** puis les
   jobs sont poussés dans BullMQ (1 job par variante).
4. `GenerationProcessor` appelle l'`ImageProvider` actif (ControlNet depth via
   Replicate, ou Gemini editing — choix arbitré au sprint de validation §12).
5. Statut `done` + notification push Expo ; en échec définitif (3 tentatives),
   statut `failed` et **remboursement du crédit**.

## Décisions structurantes

| Décision | Raison |
| --- | --- |
| Validation par Zod partagé plutôt que class-validator | Un seul schéma sert le mobile, l'admin et l'API ; pas de dérive de contrats |
| Crédits décrémentés avant enqueue (updateMany conditionnel) | Empêche un solde négatif en cas de requêtes concurrentes |
| Abstractions `ImageProvider` / `SmsProvider` par symbole DI | Bascule de fournisseur par variable d'env, sans redéploiement des clients |
| Refresh tokens hashés (SHA-256) et à usage unique | Un vol de base ne donne pas de session ; rotation systématique |
| Montants en entiers dans la devise d'affichage | Le FCFA n'a pas de centimes ; évite les flottants |
| `node-linker=hoisted` dans `.npmrc` | Requis par Metro/Expo dans un monorepo pnpm |

## Sécurité

- Clés IA et secrets uniquement côté serveur (`.env`, jamais commités).
- JWT courts (15 min) + refresh 30 j ; OTP hashé, 5 tentatives, TTL 5 min.
- Admin : jeton dédié (`scope: admin`), RBAC par décorateur `@RequireRoles`,
  journal d'audit sur chaque action sensible, 2FA (TOTP) à câbler avant la prod.
- Webhooks paiement : vérification de signature obligatoire en production,
  attribution des crédits idempotente (rejeu sans double crédit).

## À faire (prochaines étapes)

1. **Sprint de validation §12** : benchmark ControlNet vs Gemini sur 30 photos
   réelles. Les deux providers sont implémentés ; renseigner
   `REPLICATE_MODEL_VERSION` (obligatoire) ou `GEMINI_API_KEY` + basculer via
   `IMAGE_PROVIDER`.
2. Intégrations FedaPay/KkiaPay réelles + vérification HMAC des webhooks.
3. Modération des images uploadées avant traitement (§7.5) — brancher sur
   `confirmRoomPhoto`.
4. Export PDF du dossier projet (D2) et partage WhatsApp (D3).
5. Liste d'achats IA à partir d'un rendu (D1).
6. Écran d'enrôlement 2FA dans le back-office (l'API est prête :
   `POST /admin/auth/2fa/setup` + `/enable`).
7. Tests automatisés (charte §7) : unitaires services critiques (crédits,
   webhooks idempotents), e2e auth.

## Fait (sprint 2)

- Stockage S3/R2 signé : upload direct mobile → bucket, clés privées, URLs GET
  limitées dans toutes les réponses.
- `ReplicateImageProvider` (ControlNet depth, polling, coût par run) et
  `GeminiImageProvider` (image editing inline) opérationnels.
- Notifications push Expo (succès + échec remboursé), token enregistré via
  `PUT /users/me/push-token`.
- 2FA TOTP complet côté API (otplib) : setup → enable → enforcement au login.
- Mobile : capture avec guide de cadrage, compression 1080p, upload signé,
  écran d'attente avec messages tournants, comparateur avant/après branché.

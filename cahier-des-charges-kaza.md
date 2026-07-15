# Cahier des charges — Kaza
### Assistant visuel intelligent de l'habitat (nom de code provisoire)

**Version :** 1.1 — Juillet 2026 (ajout du back-office d'administration et de l'architecture web NestJS/Next.js)
**Statut :** Document de cadrage pour développement MVP
**Plateforme cible :** Mobile (iOS + Android) via Expo / React Native

---

## 1. Contexte et problème

La majorité des particuliers sont incapables de se projeter dans un espace avant de s'y engager financièrement. Ce déficit de visualisation se manifeste dans trois situations concrètes : l'emménagement dans un nouveau logement (comment meubler et décorer sans se tromper), la construction d'une maison (comment concevoir sans être architecte et sans les moyens d'en payer un en amont), et la rénovation (comment anticiper le résultat avant d'engager des travaux).

Aujourd'hui, ce besoin est partiellement couvert par des assistants IA généralistes (ChatGPT, Gemini). Ils prouvent que la demande existe, mais l'expérience y est éclatée : pas de mémoire de projet structurée, pas de cohérence garantie entre les pièces, pas de continuité vers l'action (budget, achats, artisans), et une interface non pensée pour ce cas d'usage. Kaza transforme ce bricolage en un produit dédié, guidé et actionnable.

En Afrique de l'Ouest particulièrement, une part importante des logements est auto-construite, sans architecte ni devis fiable. Le marché est donc à la fois global (relooking d'intérieur) et localement différencié (assistance à la construction avec estimation budgétaire en FCFA et paiement Mobile Money).

## 2. Vision produit

Kaza est l'application qui fait passer l'utilisateur **de l'idée floue au rendu photoréaliste, puis du rendu à l'action**. Trois promesses fondatrices :

1. **Voir avant de dépenser** : tout projet d'habitat devient visualisable en quelques minutes.
2. **Être guidé comme par un professionnel** : une IA conversationnelle interroge l'utilisateur comme le ferait un architecte ou un décorateur, plutôt que de le laisser face à un champ de texte vide.
3. **Passer à l'action** : chaque rendu débouche sur des livrables concrets — liste d'achats chiffrée, plans exportables, estimation de construction, dossier partageable avec les artisans.

## 3. Objectifs

**Objectifs produit (12 mois) :** lancer un MVP centré sur le relooking de pièces en 10 semaines ; atteindre 10 000 utilisateurs inscrits et 5 % de conversion payante à M+6 ; lancer le mode Construction à M+4 et la marketplace artisans à M+9.

**Objectifs business :** valider la disposition à payer via un modèle freemium à crédits ; construire un avantage défendable via la donnée projet (goûts, budgets, historique) que les IA généralistes n'ont pas ; capter une commission sur la mise en relation avec les professionnels.

## 4. Cibles et personas

**Persona 1 — Aïcha, 29 ans, nouvelle locataire.** Vient de signer pour un appartement vide à Cotonou. Budget meubles limité, aucune idée de style précis. Attend : photographier son salon, répondre à quelques questions, voir 3 propositions, connaître le coût approximatif.

**Persona 2 — Marcel, 41 ans, auto-constructeur.** A acheté une parcelle et construit sa maison par étapes, sans architecte. Attend : décrire son projet, obtenir des plans crédibles et des rendus pièce par pièce, estimer les quantités de matériaux, montrer le dossier à son maçon.

**Persona 3 — Élodie, 34 ans, propriétaire rénovatrice (marché international).** Veut moderniser sa cuisine avant travaux. Attend : tester plusieurs styles sur sa vraie cuisine, exporter un moodboard pour son artisan.

**Persona 4 (cible secondaire, phase 3) — Le professionnel.** Décorateur, architecte ou artisan qui souhaite recevoir des prospects qualifiés avec un dossier visuel déjà constitué.

## 5. Périmètre fonctionnel

### Module A — Onboarding et profil de goûts
- A1. Inscription par e-mail, Google, Apple ou numéro de téléphone (OTP).
- A2. Quiz visuel de goûts à l'inscription : l'utilisateur balaye des images d'intérieurs (j'aime / j'aime pas) ; l'app en déduit un profil stylistique initial (moderne, bohème, minimaliste, afro-contemporain, etc.).
- A3. Le profil de goûts est persistant et enrichi à chaque projet ; il pré-remplit les futures générations.

### Module B — Mode Relooking (cœur du MVP)
- B1. Capture ou import d'une photo de pièce (expo-camera / expo-image-picker), avec guide de cadrage (tenir le téléphone droit, capturer un angle large).
- B2. Entretien conversationnel : un agent IA pose 3 à 6 questions ciblées et adaptatives (usage de la pièce, style, palette, budget, contraintes — « le canapé reste », « il y a des enfants »). L'agent s'appuie sur le profil de goûts pour ne pas poser de questions déjà résolues.
- B3. Génération du rendu photoréaliste **en conservant la géométrie réelle de la pièce** (murs, fenêtres, portes identiques). Exigence non négociable : c'est ce qui rend la projection crédible. Techniquement : édition d'image guidée par structure (ControlNet depth/canny via Replicate, ou API Gemini image editing).
- B4. Génération de 1 à 3 variantes par requête selon le forfait.
- B5. Itération par chat sur un rendu : « change le canapé en beige », « ajoute des plantes », « éclaircis la pièce ». Chaque itération crée une nouvelle version, l'historique des versions est conservé.
- B6. Comparateur avant/après (slider) et comparateur entre variantes.

### Module C — Mode Construction
- C1. Assistant de programmation architecturale : dialogue guidé qui collecte surface du terrain, orientation, budget global, nombre de pièces, niveaux, style de vie (cuisine ouverte ?, bureau ?, boutique en façade ?), contraintes locales (climat, mitoyenneté).
- C2. Génération d'un plan de masse et d'un plan 2D par niveau (schématiques, cotés approximativement), avec avertissement légal clair : documents d'inspiration, non valables pour permis de construire.
- C3. Génération de rendus photoréalistes pièce par pièce, **cohérents entre eux** (même palette, même style, même niveau de standing) et d'un rendu de façade.
- C4. Itération par chat au niveau projet (« ajoute une chambre », « passe la façade en R+1 »).
- C5. Estimation budgétaire paramétrique de la construction : à partir de la surface et du standing choisi, calcul d'une fourchette de coûts par grands postes (gros œuvre, toiture, menuiseries, électricité/plomberie, finitions), en FCFA ou dans la devise de l'utilisateur. Les ratios de prix sont maintenus dans une table éditable côté serveur, par pays.

### Module D — Passage à l'action
- D1. Liste d'achats intelligente : à partir d'un rendu, l'IA identifie les éléments de mobilier et de décoration, produit une liste nommée et catégorisée avec fourchette de prix par article.
- D2. Export du dossier projet en PDF : rendus, plans, moodboard, liste d'achats, estimation budgétaire.
- D3. Partage par lien, WhatsApp ou e-mail (WhatsApp prioritaire pour le marché ouest-africain).
- D4. (Phase 3) Liens d'achat affiliés vers des marchands, et annuaire d'artisans/professionnels vérifiés avec demande de devis intégrée.

### Module E — Gestion de projets
- E1. Un utilisateur possède plusieurs projets ; un projet contient des pièces ; une pièce contient des versions de rendus et son fil de conversation.
- E2. Tableau de bord listant les projets avec vignette, progression et budget cumulé.
- E3. Sauvegarde cloud automatique, consultation hors ligne des rendus déjà générés.

### Module F — Monétisation et paiement
- F1. Freemium : 3 générations gratuites à l'inscription, puis achat de packs de crédits ou abonnement mensuel (générations illimitées « fair use », variantes multiples, export PDF, mode Construction).
- F2. Paiement : cartes via RevenueCat/stores, **et Mobile Money (FedaPay ou KkiaPay) pour l'Afrique de l'Ouest** — canal indispensable localement, via achat de crédits web pour contourner la limitation des stores sur les paiements alternatifs.
- F3. Parrainage : crédits offerts au parrain et au filleul.

### Module G — Back-office d'administration (web)
Interface web réservée à l'équipe, développée en Next.js et consommant l'API NestJS (voir §7.2 et §7.3) :
- G1. Gestion des utilisateurs : recherche, consultation d'un compte et de ses projets, ajustement manuel de crédits, suspension, suppression RGPD.
- G2. Suivi économique : tableau de bord des revenus (abonnements, packs de crédits, Mobile Money), coût IA par génération et par utilisateur, marge brute en temps réel, alertes de dérive de coûts.
- G3. Édition des tables de coûts de construction (§C5) par pays et par standing, sans redéploiement.
- G4. Modération : file des images signalées ou bloquées par le filtre automatique, validation ou rejet manuel, bannissement.
- G5. CMS léger : gestion des images du quiz de goûts, des styles proposés, des messages d'attente et des textes légaux.
- G6. Configuration produit : feature flags, choix du fournisseur IA actif, nombre de variantes par forfait, tarifs des packs et promotions.
- G7. Gestion des professionnels (phase 3) : validation des profils artisans, suivi des leads et des commissions.
- G8. Sécurité : rôles et permissions (RBAC — super-admin, support, finance, modérateur), authentification à deux facteurs, journal d'audit de toutes les actions sensibles.

### Hors périmètre MVP (explicitement)
Visite 3D navigable en temps réel, réalité augmentée (placement de meubles via caméra), plans certifiés pour permis de construire, application web. Ces éléments sont candidats aux phases ultérieures.

## 6. Parcours utilisateur de référence (Relooking)

1. Aïcha ouvre l'app, s'inscrit par numéro de téléphone, fait le quiz de goûts (90 secondes).
2. Elle crée un projet « Mon appart », choisit « Relooker une pièce », photographie son salon vide.
3. L'agent pose 4 questions ; elle répond par boutons rapides ou texte libre.
4. Écran de génération (15 à 40 s) avec messages d'attente ; le rendu apparaît, fidèle à la géométrie de son salon.
5. Elle itère : « moins de jaune, un tapis plus grand ». Nouvelle version en 20 s.
6. Elle demande la liste d'achats, voit le budget estimé, exporte le PDF et l'envoie à sa sœur sur WhatsApp.
7. À la 4ᵉ génération, paywall doux : pack de crédits ou abonnement, payable par Mobile Money.

## 7. Spécifications techniques

### 7.1 Application mobile
- **Framework :** Expo SDK (dernière version stable), React Native, TypeScript.
- **Navigation :** expo-router (navigation par fichiers).
- **UI :** NativeWind (Tailwind pour RN) ou Tamagui ; design system propre (voir §7.5).
- **Médias :** expo-image-picker, expo-camera, expo-image (cache), expo-file-system.
- **État :** Zustand + TanStack Query pour le cache serveur.
- **Distribution :** EAS Build + EAS Update (mises à jour OTA), TestFlight / Play Console.

### 7.2 Backend applicatif (API)
- **NestJS** (Node.js, TypeScript) : API REST centrale unique, consommée à la fois par l'application mobile et par le back-office. Modules principaux : auth, users, projects, generations, payments, moderation, admin.
- **PostgreSQL** avec **Prisma** (ORM, migrations versionnées).
- **Redis + BullMQ** : file d'attente des générations IA (statuts pending / processing / done / failed, retries automatiques) et tâches planifiées (nettoyage, relances).
- **Stockage objets** compatible S3 (AWS S3 ou Cloudflare R2) pour les photos sources et les rendus, servis par URLs signées à durée limitée.
- **Authentification** : JWT + refresh tokens, OTP téléphone (Termii ou Twilio), OAuth Google/Apple. Option pragmatique pour accélérer le MVP : conserver Supabase pour l'auth et le stockage, branché sur la même base PostgreSQL, la logique métier restant intégralement portée par NestJS.
- Les clés d'API IA ne transitent jamais par les clients ; tous les appels IA sont orchestrés côté NestJS.
- Notifications push via l'API Expo Push à la fin des générations.
- Documentation OpenAPI (Swagger) générée automatiquement ; déploiement conteneurisé (Docker) sur Railway, Render, Fly.io ou VPS.

### 7.3 Back-office d'administration (web)
- **Next.js** (App Router, TypeScript), déployé sur Vercel ou en conteneur, accessible uniquement à l'équipe (SSO + 2FA obligatoire).
- **UI** : Tailwind CSS + shadcn/ui ; tableaux avec TanStack Table, graphiques avec Recharts.
- Consomme l'API NestJS via les mêmes contrats OpenAPI que le mobile, avec contrôle RBAC appliqué côté serveur ; aucune logique métier dupliquée dans le front admin.
- **Monorepo** recommandé (Turborepo + pnpm) : `apps/mobile` (Expo), `apps/admin` (Next.js), `apps/api` (NestJS), `packages/shared` (types TypeScript, schémas de validation Zod, client API généré) — une seule source de vérité pour les types entre les trois applications.

### 7.4 Couche IA
- **Agent conversationnel** (questions, itérations, extraction de la liste d'achats) : API Claude, avec sorties structurées JSON pour piloter l'UI (boutons de réponse rapide, paramètres de génération).
- **Génération/édition d'images** : Replicate (modèles SDXL/Flux + ControlNet depth pour préserver la structure) ou API Gemini image editing. Abstraction « ImageProvider » côté serveur pour pouvoir changer de fournisseur sans toucher à l'app.
- **Plans 2D** : génération assistée (l'agent produit une spécification structurée des pièces et adjacences ; un moteur de rendu serveur trace le plan schématique en SVG). Alternative rapide pour le MVP construction : rendus « vue de plan » générés par IA avec disclaimer renforcé.
- **Coût unitaire cible** : < 0,10 USD par génération d'image ; le prix des crédits est calibré pour une marge brute ≥ 70 %.

### 7.5 Exigences non fonctionnelles
- Temps de génération perçu ≤ 45 s avec écran d'attente engageant ; l'app reste utilisable pendant la génération.
- Fonctionnement dégradé sur réseau lent (3G) : compression des photos avant upload (~1080p), reprise d'upload.
- Langues : français au lancement, anglais en phase 2.
- Sécurité et vie privée : photos privées par défaut, suppression de compte et des données conforme RGPD, consentement explicite si des images sont utilisées pour améliorer le service.
- Modération : filtrage des images uploadées (contenu inapproprié) avant traitement.

### 7.6 Direction design
Identité chaleureuse et premium : tons terre (terracotta, sable, vert profond), typographie moderne, mise en avant plein écran des rendus. L'app doit donner l'impression d'un magazine de décoration vivant, pas d'un outil technique.

## 8. Modèle de données (simplifié)

- **users** (id, téléphone/e-mail, langue, pays, crédits, abonnement)
- **taste_profiles** (user_id, styles favoris, palette, budget type, historique de swipes)
- **projects** (id, user_id, type [relooking | construction], nom, statut, devise)
- **rooms** (id, project_id, type de pièce, photo source, contraintes)
- **generations** (id, room_id, version, prompt structuré, image_url, statut, coût)
- **conversations** (id, room_id/project_id, messages horodatés)
- **shopping_items** (id, generation_id, nom, catégorie, prix min/max, lien éventuel)
- **cost_tables** (pays, poste de construction, ratio prix/m², standing)
- **transactions** (user_id, type [crédits | abo], montant, canal [store | mobile money], statut)
- **admin_users** (id, e-mail, rôle [super-admin | support | finance | modérateur], 2FA activée)
- **audit_logs** (admin_id, action, entité cible, horodatage, détails)
- **app_settings / feature_flags** (clé, valeur, environnement)
- **moderation_queue** (image_id, motif, statut, modérateur, décision)

## 9. Modèle économique

Freemium à crédits : 3 générations offertes, puis packs (ex. 10 générations) et abonnement mensuel premium incluant le mode Construction, les variantes multiples et l'export PDF. Tarification différenciée par zone (pouvoir d'achat local vs international). Revenus complémentaires en phase 3 : affiliation sur les listes d'achats et commission sur les mises en relation artisans (modèle de leads qualifiés — le professionnel reçoit un dossier visuel complet, ce qui justifie un prix au lead élevé).

## 10. Roadmap

**Phase 1 — MVP Relooking (semaines 1-10) :** modules A, B, E, F1-F2 partiel (crédits + Mobile Money web), export PDF simple, **back-office v1** (G1, G2 partiel, G8 : gestion des utilisateurs et crédits, suivi des coûts IA, rôles). Lancement en beta fermée au Bénin + communauté en ligne.

**Phase 2 — Construction (semaines 11-20) :** module C complet, estimation budgétaire, export dossier enrichi, anglais, abonnement dans les stores, **back-office v2** (G3 tables de coûts, G4 modération, G5 CMS, G6 configuration).

**Phase 3 — Écosystème (semaines 21-36) :** liste d'achats avec liens marchands, annuaire et mise en relation artisans (avec **G7** côté admin), parrainage, exploration AR/3D navigable.

## 11. Indicateurs de succès (KPIs)

Activation : % d'inscrits générant au moins 1 rendu (cible ≥ 60 %). Engagement : nombre moyen d'itérations par pièce (cible ≥ 3, signal que la boucle de chat fonctionne). Conversion : % d'utilisateurs payants à 30 jours (cible ≥ 5 %). Viralité : % de projets partagés (cible ≥ 25 %). Économie unitaire : coût IA par utilisateur actif < 30 % du revenu moyen par utilisateur payant.

## 12. Risques et mitigations

- **Fidélité géométrique insuffisante des rendus** → risque produit n°1. Mitigation : sprint technique de validation en semaine 1-2 (benchmark ControlNet vs Gemini editing sur 30 vraies photos), critère d'acceptation défini avant tout développement UI.
- **Coûts d'API dérapants** → quotas par utilisateur, cache des variantes, compression, choix de modèles au meilleur ratio qualité/prix, monitoring du coût par génération dès le jour 1.
- **Concurrence des IA généralistes** → différenciation par le flux guidé, la persistance projet, le budget localisé et le passage à l'action ; vitesse d'exécution sur le marché francophone ouest-africain.
- **Responsabilité juridique sur les plans** → disclaimers systématiques, CGU explicites : documents d'inspiration non contractuels, non valables pour permis de construire.
- **Paiement local** → dépendance aux agrégateurs Mobile Money ; intégrer deux fournisseurs (FedaPay + KkiaPay) pour la redondance.

## 13. Livrables attendus du développement

1. Application Expo iOS/Android publiée en beta (TestFlight + Play interne).
2. API NestJS déployée et conteneurisée, avec documentation OpenAPI, file de génération BullMQ et orchestration IA.
3. Back-office Next.js déployé, avec RBAC, 2FA et journal d'audit opérationnels.
4. Monorepo Turborepo structuré (`apps/mobile`, `apps/admin`, `apps/api`, `packages/shared`) avec CI/CD.
5. Design system Figma et maquettes des écrans clés (mobile et admin).
6. Documentation technique (architecture, variables d'environnement, procédures de déploiement EAS et Docker).
7. Tableau de bord de suivi des coûts IA et des KPIs (intégré au back-office).

---

*Document évolutif — les choix de fournisseurs IA et de tarification seront arbitrés à l'issue du sprint de validation technique (§12).*

# Charte et Conventions de Développement

Ce document regroupe les règles générales, conventions et meilleures pratiques que tous les développeurs doivent suivre sur nos projets afin de garantir la qualité, la lisibilité et la maintenabilité du code.

## 1. Conventions de Nommage (Naming Conventions)

- **Variables, Méthodes et Fonctions** : `camelCase` (ex: `getUserData`, `calculateTotal`). Les noms doivent être descriptifs et explicatifs de leur intention.
- **Classes, Interfaces et Types** : `PascalCase` (ex: `UserService`, `DonationRecord`).
- **Constantes (Globales)** : `UPPER_SNAKE_CASE` (ex: `MAX_RETRY_COUNT`, `API_BASE_URL`).
- **Fichiers et Dossiers** : `kebab-case` (ex: `user-service.ts`, `auth-module/`) pour éviter les problèmes liés aux systèmes de fichiers sensibles à la casse.
- **Langue** : Le code (variables, fonctions, classes) et les messages de commit doivent être rédigés en **anglais** pour faciliter la collaboration.

## 2. Principes Fondamentaux de Codage

- **KISS (Keep It Simple, Stupid)** : Privilégiez toujours la simplicité. Le code le plus facile à maintenir est celui qui est facile à lire et à comprendre.
- **DRY (Don't Repeat Yourself)** : Évitez la duplication. Si un code apparaît plus de deux fois, il doit être extrait dans une fonction, un service ou un composant réutilisable.
- **YAGNI (You Aren't Gonna Need It)** : Implémentez uniquement les fonctionnalités dont vous avez besoin maintenant. N'anticipez pas des besoins futurs hypothétiques.
- **Clean Code & SOLID** :
  - Une fonction/classe ne doit faire qu'une seule chose (Responsabilité unique).
  - Évitez les fonctions trop longues (idéalement moins de 20-30 lignes) et la complexité cyclomatique excessive (trop de `if`/`else` imbriqués).

## 3. Architecture et Structure

- **Séparation des Préoccupations (Separation of Concerns)** : Ne mélangez pas la logique métier, l'accès aux données (base de données) et l'interface utilisateur ou les contrôleurs API.
- **Architecture Modulaire** : Organisez le code par domaine métier ou par fonctionnalité (Feature-based folder structure) plutôt que par type de fichier (ex: grouper le contrôleur, le service et les DTO d'une même entité dans un dossier commun).

## 4. Gestion de Version (Git Workflow)

- **Workflow de Branches** :
  - `main` / `master` : Branche de production, doit toujours être stable et déployable.
  - `develop` : (Optionnel selon le workflow) Branche d'intégration principale.
  - `feature/nom-de-la-feature` : Pour développer une nouvelle fonctionnalité.
  - `bugfix/nom-du-bug` ou `hotfix/nom-du-bug` : Pour la correction de problèmes.
- **Conventions de Commits** : Utilisez le standard **Conventional Commits** :
  - `feat: ` pour une nouvelle fonctionnalité.
  - `fix: ` pour une correction de bug.
  - `docs: `, `style: `, `refactor: `, `test: `, `chore: ` selon la nature des modifications.
- **Pull Requests (PR) / Merge Requests (MR)** :
  - Ne jamais faire de push direct sur `main` ou `develop`.
  - Toute modification doit faire l'objet d'une PR et être validée par une **revue de code (Code Review)** par au moins un autre développeur.

## 5. Formatage, Outillage et Typage

- **Formatage Automatique** : L'utilisation d'un formateur (comme **Prettier**) et d'un linter (comme **ESLint**) configurés dans le projet est obligatoire pour assurer un style uniforme, sans débat.
- **Typage Strict** : Si le projet utilise TypeScript ou un autre langage typé, utilisez le système de types de manière stricte. Bannissez l'utilisation du type `any` ou des contournements de typage non justifiés.

## 6. Commentaires et Documentation

- **Code Expressif** : Le code doit être auto-documenté par un bon choix de noms. C'est la meilleure forme de documentation.
- **Commenter le "Pourquoi", pas le "Comment"** : Ne commentez pas ce qu'une ligne de code fait (le code est censé l'exprimer clairement), mais expliquez _pourquoi_ une approche complexe, inhabituelle ou un hack spécifique a été choisi (règles métier obscures, contournement d'un bug externe).
- **Documentation Publique** : Maintenir le fichier `README.md` à jour avec les instructions d'installation et de lancement. Documenter les API publiques (ex: avec Swagger/OpenAPI).

## 7. Tests et Qualité

- Tout ajout de fonctionnalité ou correction de bug important doit être accompagné de **Tests Automatisés** (unitaires, d'intégration ou E2E).
- Assurez-vous que tous les tests passent localement avant de soumettre une Pull Request.
- Laissez toujours le code dans un état plus propre que celui dans lequel vous l'avez trouvé (règle du Boy Scout).

## 8. Sécurité

- **Aucun Secret dans le Code** : Ne commitez jamais de mots de passe, de clés API, de certificats ou de tokens dans le dépôt. Utilisez des fichiers `.env` (ignorés dans `.gitignore`) et des gestionnaires de secrets.
- **Méfiance envers les Entrées** : Toute donnée provenant de l'utilisateur ou d'un système externe doit être considérée comme dangereuse. Toujours valider, typer et nettoyer les entrées.
- **Mise à jour des Dépendances** : Gardez les librairies externes à jour et surveillez les alertes de sécurité (ex: `npm audit`).

# Benchmark de fidélité géométrique (§12)

Le risque produit n°1 : les rendus doivent conserver la géométrie réelle de la
pièce (murs, fenêtres, portes — exigence B3). Ce script objectivise le choix du
fournisseur d'images avant tout développement UI supplémentaire.

## Prérequis

- `GEMINI_API_KEY` dans `apps/api/.env`, avec **facturation activée** sur le
  projet Google Cloud (les modèles image n'ont pas de palier gratuit).
- Un dossier de vraies photos de pièces (~30 recommandées, .jpg/.png).

## Lancer

```bash
# 1. Déposer les photos
mkdir tools/geometry-benchmark/photos
# ... copier les photos dedans ...

# 2. Lancer (3 styles par photo par défaut : modern, bohemian, afro-contemporary)
node tools/geometry-benchmark/benchmark.mjs

# Variantes
node tools/geometry-benchmark/benchmark.mjs --styles modern --model gemini-3.1-flash-image-preview
```

Les rendus déjà produits sont ignorés au relancement (reprise après erreur ou
quota) ; les résultats vont dans `results/`.

## Noter

Ouvrir `results/report.html` : chaque paire avant/après se note de 1 à 5 sur la
seule fidélité géométrique. Les notes se sauvegardent localement et s'exportent
en JSON. **Critère d'acceptation §12 : moyenne ≥ 4.** Refaire tourner avec un
autre `--model` (ou l'équivalent Replicate) pour comparer.

## Coût estimé

30 photos × 3 styles ≈ 90 générations ≈ **< 4 $** avec gemini-2.5-flash-image.

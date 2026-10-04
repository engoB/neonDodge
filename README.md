# Neon Dodge

Réécriture web originale d'un jeu de dodgeball arcade. Le projet n'émule aucune ROM et n'intègre aucun contenu de jeu commercial.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Canvas 2D avec boucle fixe à 60 Hz
- manifeste PWA et service worker statique pour l'installation et le cache hors ligne
- Vitest pour les règles du moteur

## Développement

```bash
npm install
npm run dev
```

Vérification complète :

```bash
npm test
npm run build
```

## Contrôles

| Action | Clavier |
| --- | --- |
| Déplacement | Flèches ou ZQSD |
| Tir | J ou Espace |
| Interception | K ou Maj gauche |
| Passe | L ou P |
| Pause | Échap |

Les contrôles tactiles apparaissent sur petit écran.

## GitHub Pages

1. Créer un dépôt GitHub et pousser ce dossier sur la branche `main`.
2. Dans **Settings → Pages**, choisir **GitHub Actions** comme source.
3. Le workflow `.github/workflows/deploy.yml` teste, compile et publie automatiquement le site.

`base: './'` rend le build compatible avec un domaine utilisateur comme avec un sous-chemin de projet.

## Architecture

```text
src/game/      Moteur, règles, physique et rendu Canvas
src/ui/        HUD et contrôles React
src/hooks/     Adaptateurs d'entrée
public/assets/ Ressources originales
docs/          Notes d'analyse et feuille de route
```

La logique métier ne dépend pas de React. Une future version peut remplacer Canvas 2D par PixiJS ou WebGL sans réécrire les règles de match.

## Droits

Le code et les ressources de ce dépôt sont des créations originales de démonstration. La ROM analysée n'est ni copiée, ni chargée, ni distribuée par l'application.

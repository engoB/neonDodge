# Neon Slugger

Jeu de baseball arcade mobile à une seule commande. Le personnage agit et court automatiquement ; le toucher de l'écran devient une frappe, une accélération ou une glissade selon la phase de jeu. Une partie enchaîne désormais présentation des batteurs, lancers, impacts, défense, courses, appels, changements de côté et plusieurs manches.

Le laboratoire privé `?romlab=1` sert à analyser et reconstruire les animations de la ROM localement. La ROM et les ressources extraites ne sont jamais intégrées au dépôt public.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Canvas 2D avec boucle fixe à 60 Hz
- stade original en couches, six palettes d'équipe et atlas pixel art de 12 poses par tenue
- illustration de championnat originale et quatre capitaines rivaux
- modes Histoire, Arcade et Entraînement
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

## Contenu de jeu

- Histoire en quatre chapitres avec progression locale sauvegardée ;
- Arcade en cinq manches avec adversaire renforcé ;
- Entraînement sans score adverse ;
- quatre batteurs Neon aux aptitudes différentes ;
- quatre équipes rivales, couleurs, difficultés et lancers courbes propres ;
- pauses de mise en scène entre batteurs et entre manches.

## Commande unique

| Contexte | Action déclenchée |
| --- | --- |
| Lancer en approche | Frapper |
| Course entre deux bases | Accélérer |
| Proximité d'une base | Glisser |
| Présentation, appel ou intermanche | Continuer |

Le joueur touche n'importe où sur l'écran de jeu. Au clavier, Espace, Entrée ou J déclenchent la même action ; Échap met en pause. L'affichage occupe tout l'écran et adapte son cadrage au portrait et au paysage.

## GitHub Pages

1. Créer un dépôt GitHub et pousser ce dossier sur la branche `main`.
2. Dans **Settings → Pages**, choisir **GitHub Actions** comme source.
3. Le workflow `.github/workflows/deploy.yml` teste, compile et publie automatiquement le site.

`base: './'` rend le build compatible avec un domaine utilisateur comme avec un sous-chemin de projet.

## Architecture

```text
src/game/ Moteur, règles, atlas original, animations et rendu Canvas
src/ui/   HUD React et surface tactile unique
src/rom/  Analyse locale de la ROM sélectionnée par l'utilisateur
docs/     Notes d'analyse et feuille de route
```

La logique métier ne dépend pas de React. Une future version peut remplacer Canvas 2D par PixiJS ou WebGL sans réécrire les règles de match.

## Droits

Le code public, les personnages, l'illustration et le terrain sont originaux. La ROM a servi à mesurer la structure du jeu source : quinze profils, 136 poses par profil, 60 états, palettes alternatives, séquences temporisées et assemblage de sprites. Ces principes structurent la réécriture sans publier la ROM ou ses ressources commerciales ; son chargement éventuel reste local au navigateur.

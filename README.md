<h1 align="center">Neon Slugger</h1>
<p align="center"><b>Le dodgeball rencontre le baseball.</b><br>Un jeu d’arcade à un doigt, quatre capitaines et une Neon Cup à conquérir.</p>

Neon Slugger transforme Neon Dodge en un univers de baseball arcade : stade nocturne, quatre capitaines mixtes sur un même plan visuel, uniformes, casquettes, gants de taille naturelle, balles cousues et nouveaux portraits animés. Les règles restent celles du dodgeball : éliminer les quatre intérieurs adverses, avec l’aide de trois extérieurs.

## La version console

- Écran titre épuré : logo et Start Game, puis Histoire / Arcade / Training / Options.
- Sélections aux flèches : équipe, adversaire et lieu; options ON/OFF.
- Histoire en six chapitres : stade en fond plein écran, capitaines opposés et répliques alternées.
- Tir tactile en trois timings : premier tap pour préparer, trois taps dans la zone dorée pour la signature; une erreur déclenche un tir normal. Le monde ralentit pendant la jauge.
- Réception parfaite : arrête la balle et élargit les prochaines zones de timing, sans renvoi automatique.
- Zoom et ralenti sur les impacts spéciaux. KO persistants au sol avec étoiles; finition Grand Slam et batte fantôme.
- Six ballparks distincts : Fox Yard, Skyline Park, Harbor Field, Coyote Canyon, Iron Foundry et Neon Dome.
- Training libre : aucun KO, vies restaurées régulièrement, sans progression ni score sauvegardé.
- Interface plein écran portrait/paysage, scores et temps lisibles, vies individuelles et trois commandes tactiles. Aucun raccourci PC de gameplay.

## Jouer

| Situation             | Geste                             | Effet                                          |
| --------------------- | --------------------------------- | ---------------------------------------------- |
| Balle en main         | Tap TIR                           | Ouvre la jauge                                 |
| Jauge ouverte         | Tap au passage dans la zone dorée | Réussite : jauge suivante; erreur : tir normal |
| Trois timings réussis | Automatique                       | Tir signature                                  |
| Balle en main         | PASSE                             | Choisit le partenaire et passe                 |
| Balle en main         | JUMP SHOT                         | Saute et lance au sommet                       |
| En défense            | Tap juste avant impact            | Réception; timing central : parfaite           |
| Sans balle            | Maintenir                         | Saut d’esquive                                 |

Déplacements et récupération sont automatiques. Le bouton Pause suspend le match et annule la jauge sans tirer.

## Développement

Node.js 22.12+ ou 24+, React, Vite, Canvas 2D et Web Audio. Aucun compte, publicité, suivi ou dépendance à des polices externes. Les scores et réglages restent dans `localStorage`.

```bash
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run assets  # exporte les aperçus et le manifeste des atlas intégrés
npm run test:ui # vérifie les écrans et contrôles dans Chromium / WebKit
```

Les dix atlas bitmap transparents se trouvent dans `assets/sprites/` : 16 images par personnage, sur quatre colonnes, cellules de 160 × 128 pixels. Corps debout de 96 pixels et pieds alignés à 112 pixels : les capitaines mixtes ont la même stature. Le moteur utilise ces PNG en match et dans les portraits, avec des séquences dédiées à la course, au lancer et à la réception. Les états montée / descente partagent le cel de saut ; provocation / victoire partagent le cel de célébration. `atlas.json` décrit les séquences et les cadences. Les équipiers utilisent six profils distincts des capitaines : trois masculins et trois féminins, avec coiffures, visages et gabarits différents. Chaque club compte sept silhouettes distinctes ; les couleurs des tenues suivent son identité. Le choix de silhouette est déterministe et reste le même dans le club et en match. Le stade utilise un panorama bitmap détaillé, avec six architectures et ambiances distinctes.

Les sources ont été créées avec la génération d’images intégrée à partir de la référence arcade fournie. `scripts/prepare-atlas.py` extrait les silhouettes complètes et les aligne, sans redessiner les personnages (Pillow, NumPy et SciPy). Les prompts et les fichiers retenus sont documentés dans [la direction artistique](assets/ART_DIRECTION.md).

La compilation reste compatible avec un sous-chemin GitHub Pages grâce aux chemins relatifs. Le workflow existant déploie après un envoi sur `main`, en exécutant les tests avant publication. La refonte est proposée sur une branche pour revue ; le site public existant ne représente pas cette version avant intégration.

## Validation

Les tests couvrent le tournoi avec des robots au timing humain, la stabilité des six adversaires, les réceptions, la fenêtre de signature, l’annulation des gestes, la pause, la fin de match, les sauvegardes et les rendus des sprites / six stades dans deux formats. Les images de `docs/previews/` sont des rendus du moteur, pas des captures d’une session navigateur.

La compilation et les tests de simulation / rendu sont vérifiés. La CI exécute aussi 54 scénarios d’interface : Chromium ordinateur, petit portrait, portrait, paysage ; WebKit portrait et paysage. Les captures et traces sont jointes aux runs GitHub Actions. Ces émulations ne remplacent pas un tournoi sur Safari iOS et Chrome Android réels avant sortie commerciale. Voir [la revue du projet](docs/REVIEW.md).

Jeu original, sans lien avec une licence sportive ou un éditeur existant.

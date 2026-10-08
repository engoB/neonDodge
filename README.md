<h1 align="center">Neon Slugger</h1>
<p align="center"><b>Le dodgeball rencontre le baseball.</b><br>Un jeu d’arcade à un doigt, quatre capitaines et une Neon Cup à conquérir.</p>

Neon Slugger transforme Neon Dodge en un univers de baseball arcade : stade nocturne, quatre capitaines mixtes sur un même plan visuel, uniformes, casquettes, gants de taille naturelle, balles cousues et nouveaux portraits animés. Les règles restent celles du dodgeball : éliminer les quatre intérieurs adverses, avec l’aide de trois extérieurs.

## La version 2

- Accueil illustré, tournoi, club avec sept fiches de joueurs, animations consultables, playbook et réglages.
- Quatre ballparks : Fox Yard, Skyline Park, Harbor Field, Neon Dome. Six clubs rivaux à difficulté progressive.
- Sprites originaux en pixel art : repos, marche, course, possession, préparation, lancer, réception, montée, descente, impact, KO, provocation et victoire.
- Jauge qui distingue charge, fenêtre signature et dépassement. Balle blanche agrandie, longue traînée, guide de visée et minimap.
- Caméra arcade qui recadre le porteur, suit le lancer et resserre l’action près de la cible. Les joueurs regardent la balle sans retournements parasites.
- Mode Histoire en six chapitres, avec face-à-face dialogués et portraits des capitaines. Les signatures déclenchent une annonce plein écran façon jeu de combat.
- Contrôles tactiles avec capture du pointeur : interrompre un geste ou mettre en pause ne provoque aucun lancer.
- Décompte et pause sans appui bloqué ; temps de jeu distinct du décompte ; fin de match sans dégâts supplémentaires.
- Bonus de réception parfaite conservé pour le prochain élan. Progression de Neon Dodge conservée sur cet appareil.
- Portrait : caméra suivant la balle, minimap et commandes sur deux lignes. Paysage : terrain complet et commandes compactes. Zones de jeu réservées pour laisser le HUD et les commandes visibles.
- Réglages de sons, musique, vibrations et animations réduites ; préférence système prise en compte. Dialogues de réglages, pause et résultats accessibles au clavier.

## Jouer

| Situation                | Geste                                | Effet                                                   |
| ------------------------ | ------------------------------------ | ------------------------------------------------------- |
| Balle en main            | Maintenir, puis relâcher             | Élan, puis lancer vers la cible orange                  |
| Charge dorée après 0,4 s | Relâcher dans la fenêtre de 4 images | Tir signature ; après la fenêtre, tir normal            |
| Balle en main            | Glisser ↑ ou bouton Passe            | Passe ; une passe chargée arme la signature du receveur |
| Balle en main            | Bouton Jump Shot                     | Saut et lancer automatique au sommet                    |
| En défense               | Toucher 2 à 4 images avant l’impact  | Réception ; à 3 images, réception parfaite              |
| Tir signature adverse    | Réception parfaite                   | Seul timing qui permet de l’arrêter                     |
| Sans balle               | Maintenir                            | Saut d’esquive                                          |

Sur ordinateur : **Espace** pour maintenir / relâcher, **↑** pour passer, **X** ou **↓** pour le Jump Shot, **Échap** pour suspendre / reprendre. Le mouvement et la récupération de balle sont automatiques. Une réception parfaite réduit à six images l’élan nécessaire pour la prochaine signature.

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

Les dix atlas bitmap transparents se trouvent dans `assets/sprites/` : 16 images par personnage, sur quatre colonnes, cellules de 160 × 128 pixels. Corps debout de 96 pixels et pieds alignés à 112 pixels : les capitaines mixtes ont la même stature. Le moteur utilise ces PNG en match et dans les portraits, avec des séquences dédiées à la course, au lancer et à la réception. Les états montée / descente partagent le cel de saut ; provocation / victoire partagent le cel de célébration. `atlas.json` décrit les séquences et les cadences. Les équipiers utilisent six profils distincts des capitaines : trois masculins et trois féminins, avec coiffures, visages et gabarits différents. Chaque club compte sept silhouettes distinctes ; les couleurs des tenues suivent son identité. Le choix de silhouette est déterministe et reste le même dans le club et en match. Le stade utilise un panorama bitmap détaillé, avec quatre ambiances de couleur.

Les sources ont été créées avec la génération d’images intégrée à partir de la référence arcade fournie. `scripts/prepare-atlas.py` extrait les silhouettes complètes et les aligne, sans redessiner les personnages (Pillow, NumPy et SciPy). Les prompts et les fichiers retenus sont documentés dans [la direction artistique](assets/ART_DIRECTION.md).

La compilation reste compatible avec un sous-chemin GitHub Pages grâce aux chemins relatifs. Le workflow existant déploie après un envoi sur `main`, en exécutant les tests avant publication. La refonte est proposée sur une branche pour revue ; le site public existant ne représente pas cette version avant intégration.

## Validation

Les tests couvrent le tournoi avec des robots au timing humain, la stabilité des six adversaires, les réceptions, la fenêtre de signature, l’annulation des gestes, la pause, la fin de match, les sauvegardes et les rendus des sprites / quatre stades dans deux formats. Les images de `docs/previews/` sont des rendus du moteur, pas des captures d’une session navigateur.

La compilation et les tests de simulation / rendu sont vérifiés. La CI exécute aussi 42 scénarios d’interface : Chromium ordinateur, petit portrait, portrait, paysage ; WebKit portrait et paysage. Les captures et traces sont jointes aux runs GitHub Actions. Ces émulations ne remplacent pas un tournoi sur Safari iOS et Chrome Android réels avant sortie commerciale. Voir [la revue du projet](docs/REVIEW.md).

Jeu original, sans lien avec une licence sportive ou un éditeur existant.

# Assets Neon Slugger

## Illustration finale

Fichier : `assets/slugger-key-art.webp`, 1536 × 1024 pixels. Générée avec l’outil intégré imagegen, puis encodée en WebP pour la production (environ 484 Ko). La référence fournie par l’utilisateur a servi à la direction artistique. Les premières variantes ont été écartées après ses corrections : il souhaite une distribution mixte, au moins quatre capitaines, un plan visuel comparable et un gant crédible.

Prompt final :

> Use case: stylized-concept. Final original browser game key art for Neon Slugger. Reference attached is original pixel-art mood only. Follow user's FINAL correction: exactly FOUR captains, MIXED male and female, ALL on approximately the SAME PLANE and SAME HEAD SIZE, equal visual importance, no huge character foreground. A waist-up harmonious lineup of four original baseball captains occupying the right 70% of a wide 1536x1024 frame: muscular red-uniformed mustached male bat on shoulder; athletic dark-skinned youthful male teal pitcher holding small white baseball; gold-uniformed clever female with glasses and cap holding a perfectly NORMAL-SIZED baseball mitt; silver-haired agile female purple rival wearing baseball helmet. All faces clear and approx same height/scale, no overlap of faces, similar depth. IMPORTANT glove correction: brown realistic standard fielding glove, compact approximately 1.2x hand size, normal distinct thumb and four connected finger stalls, natural webbing pocket, single glove on the gold captain's left hand, no anatomical mutation or extra fingers, no enormous glove. Other hands normal, no extra arms. Premium 16-bit-inspired Japanese sports arcade PIXEL ART, crisp pixel clusters, beautiful midnight navy baseball stadium, ivory floodlights, crowd and distant city, cyan coral gold violet palette. Left 30% darker uncluttered stadium/field for HTML title, characters begin after left third. Detailed believable baseball equipment, ivory pinstripe pants. Tiny golden trophy at lower center optional. Full bleed cinematic game cover. NO TEXT, NO UI, NO title, NO watermark.

## Sprites

Les sprites sont dessinés par du code original dans `src/game/sprites.js`. `npm run assets` exporte les quatre capitaines dans des PNG transparents, sans appel à un service externe. Chaque atlas comporte 13 poses et 8 cellules par pose ; `assets/sprites/atlas.json` en décrit la structure.

Les capitaines sont Riko (Neon Foxes), Gaspard (Red Bats), Iris (Gold Owls) et Vega (Violet Phantoms). Les différences de kit incluent couleur, teinte de peau, cheveux, lunettes, moustache et casque. Les autres membres du club conservent leurs caractéristiques, leur nom et leur signature. Les PNG et le dessin en jeu proviennent de la même fonction.

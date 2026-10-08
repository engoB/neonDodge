# Assets Neon Slugger

## Illustration finale

Fichier : `assets/slugger-key-art.webp`, 1536 × 1024 pixels. Générée avec l’outil intégré imagegen, puis encodée en WebP pour la production (environ 484 Ko). La référence fournie par l’utilisateur a servi à la direction artistique. Les premières variantes ont été écartées après ses corrections : il souhaite une distribution mixte, au moins quatre capitaines, un plan visuel comparable et un gant crédible.

Prompt final :

> Use case: stylized-concept. Final original browser game key art for Neon Slugger. Reference attached is original pixel-art mood only. Follow user's FINAL correction: exactly FOUR captains, MIXED male and female, ALL on approximately the SAME PLANE and SAME HEAD SIZE, equal visual importance, no huge character foreground. A waist-up harmonious lineup of four original baseball captains occupying the right 70% of a wide 1536x1024 frame: muscular red-uniformed mustached male bat on shoulder; athletic dark-skinned youthful male teal pitcher holding small white baseball; gold-uniformed clever female with glasses and cap holding a perfectly NORMAL-SIZED baseball mitt; silver-haired agile female purple rival wearing baseball helmet. All faces clear and approx same height/scale, no overlap of faces, similar depth. IMPORTANT glove correction: brown realistic standard fielding glove, compact approximately 1.2x hand size, normal distinct thumb and four connected finger stalls, natural webbing pocket, single glove on the gold captain's left hand, no anatomical mutation or extra fingers, no enormous glove. Other hands normal, no extra arms. Premium 16-bit-inspired Japanese sports arcade PIXEL ART, crisp pixel clusters, beautiful midnight navy baseball stadium, ivory floodlights, crowd and distant city, cyan coral gold violet palette. Left 30% darker uncluttered stadium/field for HTML title, characters begin after left third. Detailed believable baseball equipment, ivory pinstripe pants. Tiny golden trophy at lower center optional. Full bleed cinematic game cover. NO TEXT, NO UI, NO title, NO watermark.

## Sprites

Les six profils secondaires et le correctif de course sont décrits dans [TEAMMATE_ART.md](TEAMMATE_ART.md), avec les prompts finaux et les fichiers intégrés.

Les sprites sont des atlas bitmap transparents issus de la génération intégrée imagegen, selon la référence arcade fournie. `src/game/sprites.js` les charge et anime leurs 16 cels. `npm run assets` exporte le manifeste et les aperçus à partir de ces mêmes images ; il ne régénère pas les dessins.

Les capitaines sont Riko (Neon Foxes), Gaspard (Red Bats), Iris (Gold Owls) et Vega (Violet Phantoms). Les différences incluent couleur, teinte de peau, cheveux, lunettes, moustache et casque. Les autres membres du club possèdent six nouvelles silhouettes distinctes des capitaines, avec des palettes aux couleurs du club ; quelques noms rivaux ont été harmonisés avec la distribution mixte, sans modifier les caractéristiques ou signatures.

## Atlas bitmap — référence arcade fournie

Mode : outil intégré imagegen ; nouvelle génération à partir de `arena-atlas(1).png` (style) et `ball-icon-source.png` (qualité de pixel, projectile). Extraction / alignement sans retouche picturale, préservation alpha. Fichiers utilisés par le jeu : `assets/sprites/{riko,gaspard,iris,vega}.png`, `assets/sprites/baseball.png`, `assets/stadium-panorama.webp`. 16 cels par capitaine ; 4 colonnes × 4 lignes, 160 × 128 pixels par cellule, corps debout 96 px, baseline 112 px. Les états partagés et les cadences sont indiqués dans `atlas.json`.

### Prompts finaux

#### riko

```text
Use case: stylized-concept. Asset type: production animation sprite atlas for a premium baseball dodgeball arcade game.
The attached image is a STYLE REFERENCE: match its rich chunky hand-pixelled anime arcade character quality, shaded expressive faces, strong dark pixel outlines, compact athletic bodies, large readable shoes, dynamic animation poses. Adapt to BASEBALL: proper baseball caps, buttoned jerseys, belt, long pants, cleats, small naturally shaped brown baseball glove on LEFT hand, normal white stitched baseball in RIGHT hand. Anatomically coherent wrists and hands. Not vector, not thin geometric bodies, not flat clipart, not a poster.
Output one square 1024x1024 TRANSPARENT PNG sprite sheet in a STRICT uniform 4 columns by 4 rows grid, 256x256 each cell, no visible grid, no labels, no text. EXACTLY 16 separate full-body cels of ONE identical character, each centered inside its own cell with ample empty transparent margins, never crossing cell borders. Feet baseline at the same height per cell; standing character about 185px tall; consistent scale across all cels; camera side-view three-quarter facing RIGHT.
Cell order left to right, top to bottom:
row1: neutral athletic ready stance A; ready stance B slight bob; running right contact pose; running right passing pose.
row2: running right opposite contact; running right opposite passing pose; ball held ready at chest in right hand; pitcher winding up with ball behind head.
row3: explosive rightward ball throw release with EMPTY right hand; throw follow-through EMPTY hand; glove catch reaching forward left hand; successful catch ball in glove at chest.
row4: jumping airborne with knees tucked; recoiling from a hit (no ball); seated knocked-out dizzy pose; victorious fist-pump.
Visible white baseball ONLY on holding/windup frames, never a huge dodgeball. Each frame retains same face, cap, jersey, glove, shoes. Poses match their named action. No background, no shadows outside characters, no scenery. Do not reproduce reference clothing; baseball uniforms required.
Subject: Male captain, warm dark brown skin, black curly hair peeking from teal baseball cap, confident eyebrows. Teal jersey with cream sleeves and brass trim, cream baseball pants, teal cleats. Slim athletic chunky arcade proportions, identifiable confident face.
```

#### gaspard

```text
Use case: stylized-concept. Asset type: production animation sprite atlas for a premium baseball dodgeball arcade game.
The attached image is a STYLE REFERENCE: match its rich chunky hand-pixelled anime arcade character quality, shaded expressive faces, strong dark pixel outlines, compact athletic bodies, large readable shoes, dynamic animation poses. Adapt to BASEBALL: proper baseball caps, buttoned jerseys, belt, long pants, cleats, small naturally shaped brown baseball glove on LEFT hand, normal white stitched baseball in RIGHT hand. Anatomically coherent wrists and hands. Not vector, not thin geometric bodies, not flat clipart, not a poster.
Output one square 1024x1024 TRANSPARENT PNG sprite sheet in a STRICT uniform 4 columns by 4 rows grid, 256x256 each cell, no visible grid, no labels, no text. EXACTLY 16 separate full-body cels of ONE identical character, each centered inside its own cell with ample empty transparent margins, never crossing cell borders. Feet baseline at the same height per cell; standing character about 185px tall; consistent scale across all cels; camera side-view three-quarter facing RIGHT.
Cell order left to right, top to bottom:
row1: neutral athletic ready stance A; ready stance B slight bob; running right contact pose; running right passing pose.
row2: running right opposite contact; running right opposite passing pose; ball held ready at chest in right hand; pitcher winding up with ball behind head.
row3: explosive rightward ball throw release with EMPTY right hand; throw follow-through EMPTY hand; glove catch reaching forward left hand; successful catch ball in glove at chest.
row4: jumping airborne with knees tucked; recoiling from a hit (no ball); seated knocked-out dizzy pose; victorious fist-pump.
Visible white baseball ONLY on holding/windup frames, never a huge dodgeball. Each frame retains same face, cap, jersey, glove, shoes. Poses match their named action. No background, no shadows outside characters, no scenery. Do not reproduce reference clothing; baseball uniforms required.
Subject: Male captain, light tan skin, dark brown hair and prominent compact brown moustache, red baseball cap. Red jersey with cream sleeves and navy trim, cream baseball pants, red cleats. Stockier strong athletic build, expressive determined face.
```

#### iris

```text
Use case: stylized-concept. Asset type: production animation sprite atlas for a premium baseball dodgeball arcade game.
The attached image is a STYLE REFERENCE: match its rich chunky hand-pixelled anime arcade character quality, shaded expressive faces, strong dark pixel outlines, compact athletic bodies, large readable shoes, dynamic animation poses. Adapt to BASEBALL: proper baseball caps, buttoned jerseys, belt, long pants, cleats, small naturally shaped brown baseball glove on LEFT hand, normal white stitched baseball in RIGHT hand. Anatomically coherent wrists and hands. Not vector, not thin geometric bodies, not flat clipart, not a poster.
Output one square 1024x1024 TRANSPARENT PNG sprite sheet in a STRICT uniform 4 columns by 4 rows grid, 256x256 each cell, no visible grid, no labels, no text. EXACTLY 16 separate full-body cels of ONE identical character, each centered inside its own cell with ample empty transparent margins, never crossing cell borders. Feet baseline at the same height per cell; standing character about 185px tall; consistent scale across all cels; camera side-view three-quarter facing RIGHT.
Cell order left to right, top to bottom:
row1: neutral athletic ready stance A; ready stance B slight bob; running right contact pose; running right passing pose.
row2: running right opposite contact; running right opposite passing pose; ball held ready at chest in right hand; pitcher winding up with ball behind head.
row3: explosive rightward ball throw release with EMPTY right hand; throw follow-through EMPTY hand; glove catch reaching forward left hand; successful catch ball in glove at chest.
row4: jumping airborne with knees tucked; recoiling from a hit (no ball); seated knocked-out dizzy pose; victorious fist-pump.
Visible white baseball ONLY on holding/windup frames, never a huge dodgeball. Each frame retains same face, cap, jersey, glove, shoes. Poses match their named action. No background, no shadows outside characters, no scenery. Do not reproduce reference clothing; baseball uniforms required.
Subject: Female captain, fair warm skin, auburn ponytail emerging behind GOLD baseball cap, small dark sport glasses. Gold jersey with cream sleeves and dark brown trim, cream baseball pants, gold cleats. Same height and visual importance as male athletes, athletic body, capable confident expression, no sexualization.
```

#### vega

```text
Use case: stylized-concept. Asset type: production animation sprite atlas for a premium baseball dodgeball arcade game.
The attached image is a STYLE REFERENCE: match its rich chunky hand-pixelled anime arcade character quality, shaded expressive faces, strong dark pixel outlines, compact athletic bodies, large readable shoes, dynamic animation poses. Adapt to BASEBALL: proper baseball caps, buttoned jerseys, belt, long pants, cleats, small naturally shaped brown baseball glove on LEFT hand, normal white stitched baseball in RIGHT hand. Anatomically coherent wrists and hands. Not vector, not thin geometric bodies, not flat clipart, not a poster.
Output one square 1024x1024 TRANSPARENT PNG sprite sheet in a STRICT uniform 4 columns by 4 rows grid, 256x256 each cell, no visible grid, no labels, no text. EXACTLY 16 separate full-body cels of ONE identical character, each centered inside its own cell with ample empty transparent margins, never crossing cell borders. Feet baseline at the same height per cell; standing character about 185px tall; consistent scale across all cels; camera side-view three-quarter facing RIGHT.
Cell order left to right, top to bottom:
row1: neutral athletic ready stance A; ready stance B slight bob; running right contact pose; running right passing pose.
row2: running right opposite contact; running right opposite passing pose; ball held ready at chest in right hand; pitcher winding up with ball behind head.
row3: explosive rightward ball throw release with EMPTY right hand; throw follow-through EMPTY hand; glove catch reaching forward left hand; successful catch ball in glove at chest.
row4: jumping airborne with knees tucked; recoiling from a hit (no ball); seated knocked-out dizzy pose; victorious fist-pump.
Visible white baseball ONLY on holding/windup frames, never a huge dodgeball. Each frame retains same face, cap, jersey, glove, shoes. Poses match their named action. No background, no shadows outside characters, no scenery. Do not reproduce reference clothing; baseball uniforms required.
Subject: Female captain, warm medium brown skin, silver short hair peeking from PURPLE baseball helmet with normal single ear guard. Purple jersey with cream sleeves and mint trim, cream baseball pants, purple cleats. Same height and visual importance as male athletes, athletic body, fierce confident expression, no sexualization.
```

#### Stade

```text
Use case: stylized-concept. Asset type: pixel-art panoramic background layer for a premium baseball arcade game. Create a very WIDE 3:1 landscape pixel art baseball stadium at sunset turning into night, true rich 16/32-bit chunky pixels, no smooth vector art. Camera at ground level from the sideline, looking toward packed tiered grandstands and skyline, beautiful teal and amber floodlights, dense hand-pixelled crowds, steel structures, bunting, a central dark scoreboard with simple blank indicator lights (NO text), ivy brick outfield wall and chainlink fence across bottom. Composition: night indigo sky top 35%, illuminated grandstands middle 50%, low brick wall/fence at bottom15%. No players, no characters in foreground, no baseball diamond or ground floor; foreground game court will be drawn separately. Flat horizontal baseline, entire panorama sharp all the way across. Arcade sports energy. Palette warm cream lamps, amber sunset, teal signage, indigo structure. Opaque image. No text, no logos, no UI, no watermark.
```

#### Balle

```text
Use case: stylized-concept. Asset type: transparent baseball projectile sprite for a premium pixel arcade game. Attached image is a STYLE reference only for chunky shaded pixel quality. Draw exactly ONE perfectly round WHITE/cream BASEBALL with the two characteristic curving RED stitched seams, crisp dark navy pixel outline, tiny cream highlights, chunky square pixels and shaded spherical volume. Centered whole ball with wide transparent margin. No red dodgeball panels. No trail, no flame, no speed lines (engine adds these), no glove, no text, no UI. Reference-quality 16/32-bit arcade pixel art. Truly transparent background.
```

Les sources générées restent disponibles dans les sorties de génération de cette conversation. Les images normalisées sont versionnées dans le dépôt et utilisées directement en match. Les panoramas de Fox Yard / Skyline Park / Harbor Field / Neon Dome partagent un dessin décliné avec des palettes, et ne sont pas quatre nouvelles illustrations indépendantes.

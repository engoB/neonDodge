# Équipiers et correctif de course

Mode : outil intégré imagegen, génération de six nouveaux atlas, puis extraction / alignement des silhouettes avec `atlas_tools.py`. Références : atlas arcade fourni pour le style, cycle de course corrigé pour les appuis. Les capitaines sont réservés aux leaders ; les six profils secondaires ont des identités stables et des couleurs adaptées au club. Fichiers : `assets/sprites/{scout,rookie,dash,ember,echo,nova}.png`, cellules de 160 × 128 pixels, 16 cels chacun.

## Course des capitaines

Les seuls cels 2 à 5 ont été remplacés dans les quatre atlas existants par `prepare-run.py` ; les autres poses sont conservées. Source retenue : `exec-28df3417-ebd2-4466-a864-98573ec576c6.png`. Cycle : contact A, passage A, contact B avec bras / jambes opposés, passage B. La main porteuse de balle suit le cycle dans le rendu. Les différences de silhouette sont inspectées visuellement et contrôlées sur la partie basse des jambes.

### Prompt de génération

```text
Use case: stylized-concept. Production RUN CYCLE sprite sheet to fix a baseball arcade game's BROKEN RUN ANIMATION.
Reference image is the exact FOUR character identities, clothing, body proportions, face detail and pixel-art rendering to KEEP. Create NEW RUNNING POSES, not copies of its running row. The old running row is wrong because it repeats the same forward leg. We need a visibly alternating stepping cycle.
One square transparent sprite atlas, STRICT 4 columns × 4 rows, exactly 16 full-body sprites on empty transparent cells, no grid, no text, no labels. Row 1 only RIKO, teal baseball cap and teal/cream uniform, dark brown skin and curly black hair. Row2 only GASPARD, red cap/red/cream uniform, brown moustache. Row3 only IRIS, female gold cap/gold/cream uniform, auburn ponytail and glasses. Row4 only VEGA, female purple baseball helmet/purple/cream uniform and silver hair. All four same height and quality as reference. Each row is FOUR sequential running frames of that one identical character, all facing RIGHT.
Columns repeat this EXACT FOUR-PHASE animation for each character:
1 CONTACT A: nearer bright leg extends forward RIGHT with foot low/striking ground; darker far leg extends behind LEFT, lifted. Glove left hand swings BACK toward left.
2 PASSING A: nearer leg passes backwards underneath torso, knee almost straight; darker far leg knee raised forward toward right; feet close together horizontally, feet partly overlapping under hips. Glove arm swings forward to right.
3 CONTACT B: darker FAR leg is now extended forward RIGHT with foot striking the ground; nearer bright leg trails BEHIND toward LEFT and is lifted. This MUST be a substantially different silhouette than column1 and clearly swap which knee/leg is in front. Bare arm swings BACK while glove swings forward.
4 PASSING B: darker far leg is underneath torso; nearer bright knee comes up forward RIGHT, distinct knee-lift silhouette, feet again close together horizontally. This MUST differ from column2 by which knee is lifted.
Big visible alternating contact / narrow passing silhouettes. Avoid four repeated wide lunges. Avoid all legs pointing the same way. Keep the cap/head position nearly steady while arms and legs articulate. Both legs complete a circular gait over the four cels. Consistent far-leg darker shading lets the swapped leg read clearly. Strong dark pixel outlines, rich shaded pixel clusters, compact athletic anime arcade sprite quality. Normal brown glove only on left hand, no baseball held. Same pixel detail and proportions as reference. Center hips consistently in each grid cell. Full body and both cleats stay inside each cell with generous transparent spacing. Truly transparent background, no ground shadows, no scenery, no UI. Do not put standing, catching or pitching poses in this RUN-ONLY sheet.
```

### Prompt d’édition retenu

```text
Use case: precise-object-edit. Edit target: attached transparent running atlas. Fix ONLY columns THREE and FOUR in ALL FOUR rows. Preserve first two columns exactly. Preserve all faces, caps, jersey designs, color palettes, canvas layout, grid and transparent background. This is an animation error fix: currently columns3/4 still repeat the same forward leg and same forward glove arm as columns1/2.
Columns THREE and FOUR MUST show the OPPOSITE arms/legs phase:
Column THREE: bare RIGHT hand arm must be extended FORWARD to the right of chest, distinctly in front, empty closed hand. LEFT gloved arm must be swept BACK behind body to the LEFT; glove visible near left hip, NOT at front chest. The FAR leg (darker grey shaded cream pants, behind body) extends FORWARD RIGHT to ground contact. The NEAR leg (bright cream pants with colored side stripe) goes BACK LEFT, heel lifted near left side. Draw the bright-striped thigh leading BACK to left, not forward to right. Both characters' feet fully visible. This reverses the limb depth and arm swing from column1. It cannot look identical to column1.
Column FOUR: bare right arm still forward to right; left glove is swung back near left hip. FAR dark grey leg is near straight down underneath hips supporting body, NEAR bright cream knee lifted FORWARD RIGHT with colored stripe curved around that raised knee, near shoe pulled up under knee. This reverses knee depth from column2.
In both edited columns the BARE HAND IS FORWARD and the BROWN GLOVE IS BACK, an obvious silhouette change. Exactly the same 4 baseball captains in the same 4x4 grid: teal Riko, red mustache Gaspard, gold auburn ponytail glasses Iris, purple helmet silver-hair Vega. Continue rich shaded arcade pixel art, compact gloves. No additional images, no labels, no background. Correct anatomy, no duplicated limbs. Each row's four cels form alternating right/left steps. Keep columns1/2 unchanged.
```

## Prompts des nouveaux équipiers

### scout

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Male adult, medium olive/tan skin, broad stocky shoulders and strong legs, very short dark brown buzz cut visible below cap, wide jaw, thick eyebrows, clean shaven. Broad defender silhouette, compact no huge captain head.
```

### rookie

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Male young adult, fair skin with clear small freckles, straight tousled BLOND fringe showing prominently under cap, slim tall athletic build, narrow youthful face, no facial hair. Distinct slim quick runner silhouette.
```

### dash

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Male young adult, East Asian features, warm pale tan skin, short straight BLACK hair, narrow eyebrows and eyes, compact agile body, TEAL batting HELMET with one ear guard rather than cap. Clean shaven, determined face, no silver hair.
```

### ember

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Female adult, warm tan/olive skin, DARK BROWN WAVY low ponytail emerging behind baseball cap, strong athletic shoulders, long dark eyebrows, round determined face, no glasses. Same stature and athletic importance as men. No sexualization.
```

### echo

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Female young adult, dark brown skin, small dense BLACK CURLY AFRO PUFF behind baseball cap, athletic compact body, broad friendly face, strong eyebrows, no glasses. Distinct hair texture, same stature as men. No sexualization.
```

### nova

```text
Use case: stylized-concept. Production transparent character animation atlas for a baseball arcade game.
References: image1 is the style and detail level, image2 is the CORRECT running phases (not character identity). Create a NEW SECONDARY TEAMMATE, distinct from all four captains in both references. Not a recolored Riko, not a moustached Gaspard, not an auburn glasses Iris, not a silver hair Vega.
Detailed chunky pixel-art anime sports character, shaded expressive face, strong navy pixel outlines, athletic baseball equipment. All uniforms TEAL jersey/cap/cleats with cream sleeves and cream long baseball pants, belt, one compact brown glove on left hand. No red/orange/purple jersey colors; hair and skin must keep natural specified colors. Shirt and cap teal color ramp should be visually separate from hair and skin for game palette swaps.
One square transparent sheet in strict 4columns x4rows, 16 full-body sprites with generous transparent separation, no text/grid/background. Same identical face and body in every cel, camera side-view three-quarter facing RIGHT. Consistent character scale, feet baseline and hip center.
Cels left-to-right top-to-bottom:
row1: ready stance A, ready stance B, RUN contactA (near bright leg forward right, far grey leg back left, glove arm forward, bare arm back), RUN passingA (near supporting leg under hips, far knee forward and up, feet narrow below body);
row2: RUN contactB (far GREY leg forward right, near BRIGHT cream striped leg behind left, BARE HAND arm swings forward right, GLOVE arm swings back left); RUN passingB (far supporting leg under hip, near bright knee forward up, bare hand forward and glove back); holding white baseball in right hand at chest; baseball pitcher windup ball behind head.
row3: rightward baseball throw release, EMPTY right hand; throw follow-through empty hand; left glove reaching to catch; ball caught into left glove at chest.
row4: airborne jump knees tucked; hit recoil; seated dizzy KO; victorious fist pump.
RUN cels 2/3/4/5 must form the four DISTINCT alternating contactA/passingA/contactB/passingB phases visible in reference2; do not repeat same leg-forward pose. Both legs visible, proper natural knees and cleats. Contact poses wide leg separation; passing poses narrow under hips. All white stitched baseballs are small, not big dodgeballs. Normal glove, no extra fingers. Same premium hand-pixelled quality as reference1, no simplified flat geometric bodies. Truly transparent background.
Subject identity: Female adult, East Asian features, light warm skin, short straight BLACK BOB visible beneath cap (no ponytail), sharp focused eyes, slim athletic body, no glasses, no silver hair. Same stature as men, no sexualization.
```

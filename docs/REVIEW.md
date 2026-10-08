# Revue : Neon Dodge → Neon Slugger

## Point de départ

Le moteur était déjà séparé du rendu, avec simulation à 60 Hz, équipes à sept joueurs, contrôles à un doigt, passes, six signatures, IA graduelle et tests de tournoi. Ces fondations ont été conservées. L’interface utilisait des écrans génériques, les sprites étaient des personnages sportifs sans équipement de baseball et les terrains ne partageaient pas une identité cohérente.

## Corrections fonctionnelles

1. Un appui pendant le décompte pouvait rester enregistré et empêcher le prochain geste : les entrées sont désormais acceptées uniquement en jeu.
2. Annuler un pointeur utilisait la même action qu’un relâchement, ce qui pouvait lancer la balle : une annulation explicite remet l’élan à zéro sans tirer.
3. La pause laissait progresser le compteur et pouvait conserver un geste : entrées annulées et simulation suspendue ; le chronomètre compte uniquement le jeu actif.
4. Le HUD disait indéfiniment « super prêt » après la fenêtre utile : états distincts charge / signature disponible / fenêtre dépassée.
5. Le bonus de réception parfaite était écrasé au prochain appui : il est conservé jusqu’au prochain élan et consommé une fois.
6. Le moteur continuait à déplacer la balle après la victoire : seule l’animation de fin et les effets visuels continuent ; les points de vie et le résultat restent stables.
7. Une sauvegarde mal formée pouvait bloquer les écrans : nombres bornés, objets contrôlés et réglages booléens normalisés, sans perdre les anciennes sauvegardes valides.

## Direction artistique et expérience

Accueil illustré, quatre capitaines avec une importance visuelle comparable et une distribution mixte. L’illustration finale remplace les premières variantes. Les gants sont ramenés à des proportions naturelles. Le sprite de réception possède un seul gant, sur la main tendue. Les sprites bitmap incluent casquettes ou casques, uniformes, ceintures, crampons et gants. Quatre silhouettes distinctes sont habillées aux couleurs de chaque équipe par palettes. Un panorama détaillé remplace le décor géométrique, décliné dans les quatre ambiances de stade. Les marques de baseball sont décoratives ; les règles et les collisions restent celles du dodgeball.

Les menus ont une hiérarchie claire : coupe, club, règles, réglages. Les joueurs ont des statistiques consultables et des démonstrations d’animation. Les indications en match changent avec la possession et le timing. La zone de jeu dispose d’une place réservée entre le score et les commandes ; le portrait suit la balle et montre une minimap, le paysage montre toute la largeur du terrain. La mise en page inclut des règles pour petits téléphones, faible hauteur et zones de sécurité.

## Validation et limites

- Tests automatiques du moteur, de la progression, des sauvegardes, des sprites et des quatre stades en portrait / paysage.
- Compilation Vite de production avec assets relatifs, sans récupération de polices externes.
- Inspection visuelle des atlas et des rendus du moteur.
- Suite Playwright : 42 scénarios, six formats / moteurs Chromium et WebKit, captures et traces de navigation conservées en CI. Vérification des limites du terrain, du HUD et des commandes, de la rotation, des dialogues, du clavier, de l’annulation du pointeur et des passes.
- Limite : les émulations navigateur et les rendus Canvas ne valident pas les safe areas matérielles, les particularités de Safari iOS sur appareil ou les vibrations. Un tournoi sur téléphone reste nécessaire avant sortie.

Avant sortie : jouer au moins un tournoi complet sur téléphone, faire pivoter pendant une possession, vérifier l’ouverture / fermeture des dialogues au clavier, le passage en arrière-plan, le bouton Passe, le glissement, la réception d’un tir signature, les safe areas et l’installation du manifeste. L’application ne promet pas de mode hors ligne : le service worker historique reste un script de nettoyage et aucune mise en cache PWA n’a été ajoutée.

## Nouvelle passe graphique

Les anciens personnages procéduraux ont été remplacés par quatre atlas de 16 cels en pixel art détaillé, adaptés à la référence du projet : Riko, Gaspard, Iris, Vega. Même hauteur, deux hommes et deux femmes, gants compacts. Les silhouettes sont extraites globalement pour conserver les bras étendus sans ramener un fragment du sprite voisin. Les portraits attendent le chargement des images et le décompte du match commence seulement quand les assets sont disponibles. Les animations de lancer et réception suivent leur progression réelle. Le terrain a davantage de profondeur pour espacer les personnages, et une texture de gazon / terre.

La reprise au clavier rend le focus au bouton d’action ; Échap reste disponible dans les résultats ; les clics secondaires ne déclenchent pas un lancer. Le HUD, le terrain et le panneau de commandes occupent leurs hauteurs réelles en flex plutôt que des marges fixes. La PR reste en brouillon pour revue visuelle.

## Course et diversité du banc

Les quatre anciennes images de course répétaient presque le même appui. Elles ont été remplacées par un cycle contact / passage / contact opposé / passage opposé, avec alternance des bras, jambes et main qui porte la balle. Le test de rendu vérifie que les jambes s’écartent aux appuis et se rapprochent aux passages. Les aperçus `course-capitaines.gif` et `course-en-match.gif` montrent respectivement le cycle et une simulation du moteur.

Six silhouettes d’équipiers complètent les quatre capitaines : scout, rookie, dash, ember, echo, nova. Les membres d’un club ont chacun une silhouette distincte. La répartition reste stable et varie entre clubs ; les six profils secondaires sont partagés dans la ligue, avec les palettes de chaque club. Les visages des capitaines ne sont plus réutilisés pour les équipiers. Les variantes de couleur en mémoire sont limitées aux besoins des clubs courants.

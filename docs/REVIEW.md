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

Accueil illustré, quatre capitaines avec une importance visuelle comparable et une distribution mixte. L’illustration finale remplace les premières variantes. Les gants sont ramenés à des proportions naturelles. Le sprite de réception possède un seul gant, sur la main tendue. Les sprites incluent casquettes ou casques, uniformes, ceintures, numéros, crampons et gants. Quatre stades originaux possèdent chacun leur palette, des gradins, une ville et des projecteurs. Les marques de baseball sont décoratives ; les règles et les collisions restent celles du dodgeball.

Les menus ont une hiérarchie claire : coupe, club, règles, réglages. Les joueurs ont des statistiques consultables et des démonstrations d’animation. Les indications en match changent avec la possession et le timing. La zone de jeu dispose d’une place réservée entre le score et les commandes ; le portrait suit la balle et montre une minimap, le paysage montre toute la largeur du terrain. La mise en page inclut des règles pour petits téléphones, faible hauteur et zones de sécurité.

## Validation et limites

- Tests automatiques du moteur, de la progression, des sauvegardes, des sprites et des quatre stades en portrait / paysage.
- Compilation Vite de production avec assets relatifs, sans récupération de polices externes.
- Inspection visuelle des atlas et des rendus du moteur.
- Limite : aucune session navigateur complète n’a pu être validée dans cet environnement. Le serveur Vite fonctionne en local, mais le navigateur distant ne peut pas le joindre et bloque les URLs de fichiers. Les rendus Canvas ne valident pas le comportement des boîtes CSS, les dialogues natifs ou les particularités tactiles d’un appareil réel.

Avant sortie : jouer au moins un tournoi complet sur téléphone, faire pivoter pendant une possession, vérifier l’ouverture / fermeture des dialogues au clavier, le passage en arrière-plan, le bouton Passe, le glissement, la réception d’un tir signature, les safe areas et l’installation du manifeste. L’application ne promet pas de mode hors ligne : le service worker historique reste un script de nettoyage et aucune mise en cache PWA n’a été ajoutée.

<h1 align="center">Neon Dodge</h1>
<p align="center"><b>La balle au prisonnier à un doigt.</b><br>Deux équipes de sept, un terrain coupé en deux, des tirs, des passes, des rattrapages au millimètre et des super tirs. Un tournoi de six matchs.</p>
<p align="center"><a href="https://engob.github.io/neonDodge/"><b>▶ Jouer</b></a> · <sub>Statut : <b>En ligne</b></sub></p>

> **Pensé pour le téléphone.** Le jeu s’ouvre dans le navigateur, sans installation, en portrait comme en paysage. Sur ordinateur : barre d’espace (maintenir / relâcher) et flèche du haut pour passer.

---

### Le match

Chaque équipe aligne **4 intérieurs** dans sa moitié de terrain et **3 extérieurs** autour de la moitié adverse (au fond et sur les côtés). Les intérieurs ont des points de vie : un tir qui les touche en retire, un super tir en retire beaucoup. L’équipe qui met KO les 4 intérieurs adverses gagne.

Chaque joueur a ses caractéristiques (force, puissance de tir, vitesse, saut, réception, défense, points de vie) et son propre tir spécial : Comète, Fusée, Serpentin, Météore, Vague ou Éclair.

### Un seul doigt

Les déplacements sont automatiques. Le doigt décide du moment.

| Situation | Geste | Effet |
|---|---|---|
| Votre équipe a la balle | **maintenir** | le porteur court vers la ligne ; la jauge se remplit |
| | **relâcher** | tir sur l’adversaire en face (anneau orange) |
| | relâcher **pile quand la jauge est pleine** | **super tir** (la fenêtre est très courte) |
| | **glisser vers le haut** | passe ; après une course complète, **passe spéciale** : le receveur tire un super tir |
| L’adversaire tire | **toucher juste avant l’impact** | rattrapage (3 images avant : PARFAIT) ; trop tôt, le joueur reste exposé |
| | **maintenir** | saut pour esquiver |

### Les adversaires

Six équipes de plus en plus fortes. L’IA prend 2 ou 3 pas d’élan avant de tirer, choisit au hasard entre tir au sol et tir en saut, vise l’adversaire placé dans un cône devant elle, tente des super tirs et des passes, et rattrape ou esquive de mieux en mieux au fil du tournoi.

### Comment c’est fait

React + Vite + Tailwind CSS pour l’interface, moteur maison en JavaScript sur un `<canvas>` (simulation à pas fixe de 60 images/s, terrain en perspective, séparée du rendu). Personnages et décors dessinés par le code ; musique et bruitages synthétisés à la volée ; aucun fichier image ni son.

Les réglages (vitesses, gravité, élan des tirs, fenêtre de rattrapage, élan du super tir, rebonds, comportement de l’IA) sont regroupés dans [`src/game/constants.js`](src/game/constants.js) : ce sont des valeurs de jeu mesurées puis adaptées au tactile. Le code, les équipes, les personnages, les graphismes et les sons sont entièrement originaux.

**Outils** &nbsp; `React` `Vite` `Tailwind CSS` `Canvas` `Web Audio`

```bash
npm install
npm run dev      # développement
npm test         # tests : équipes, matchs IA contre IA, fenêtre de rattrapage, progression du tournoi
npm run build    # version publiable dans dist/
```

Les tests font jouer un robot qui n’utilise que les gestes à un doigt, avec des erreurs de timing humaines : un joueur moyen doit gagner les premiers matchs et peiner en finale. Le site se déploie seul sur GitHub Pages à chaque envoi sur `main` (`.github/workflows/deploy.yml`).

### Mentions

Jeu original, sans lien avec un éditeur ou une licence existante. Aucune donnée collectée : pas de compte, pas de publicité, pas de suivi. La progression reste dans le navigateur.

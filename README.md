<h1 align="center">Dodge Rush</h1>
<p align="center"><b>La balle au prisonnier qui se joue d’un seul doigt.</b><br>Un jeu de course automatique : on saute, on attrape la balle au vol, on la renvoie, et on garde l’élan pour déclencher un super tir.</p>
<p align="center"><a href="https://engob.github.io/neonDodge/"><b>▶ Jouer</b></a> · <sub>Statut : <b>En ligne</b></sub></p>

> **Pensé pour le téléphone.** Le jeu s’ouvre dans le navigateur, sans installation, en portrait comme en paysage. Sur ordinateur : barre d’espace (ou flèche du haut).

---

### Comment on joue

Une seule commande : **toucher l’écran**. Ce qu’elle fait dépend du moment.

| Situation | Toucher… |
|---|---|
| Rien en approche | **saute** (doigt maintenu : saut plus haut) |
| Une balle arrive | **l’attrape** si on touche juste avant l’impact (« PARFAIT » à 3 images du contact) |
| Balle en main | **tire** sur l’adversaire placé devant, dans un cône de 45° |
| Balle en main, en courant au sol | la jauge se remplit en 24 images : le tir suivant est un **SUPER TIR** (traverse tout, 6 fois plus de dégâts) |

Les petits obstacles et les adversaires se franchissent tout seuls ; on peut aussi retomber sur un adversaire pour le mettre KO. Les balles au ras du sol et les boules de feu ne s’attrapent pas : il faut sauter.

### Contenu

- 4 mondes × 3 niveaux (Gymnase, Toits, Plage, Stade néon), un capitaine en fin de monde
- 3 balles d’or cachées par niveau, record par niveau, progression sauvegardée sur l’appareil
- Course sans fin, de plus en plus difficile, qui traverse les 4 mondes
- Musique et sons synthétisés à la volée, vibrations sur téléphone

### Comment c’est fait

React + Vite + Tailwind CSS pour l’interface, moteur maison en JavaScript sur un `<canvas>` (simulation à pas fixe de 60 images/s, séparée du rendu). Tous les personnages et décors sont dessinés par le code ; aucun fichier image ni son n’est chargé.

Les réglages (vitesses, gravité, fenêtre de rattrapage, élan du super tir, comportement des adversaires) sont regroupés dans [`src/game/constants.js`](src/game/constants.js). Ce sont des valeurs de jeu mesurées puis ajustées pour le tactile ; le code, les personnages, les graphismes et les sons sont entièrement originaux.

**Outils** &nbsp; `React` `Vite` `Tailwind CSS` `Canvas` `Web Audio`

```bash
npm install
npm run dev      # développement
npm test         # tests : génération des niveaux + un robot termine chacun des 12 niveaux
npm run build    # version publiable dans dist/
```

Le site se déploie tout seul sur GitHub Pages à chaque envoi sur `main` (`.github/workflows/deploy.yml`) ; dans les réglages du dépôt, *Pages → Source* doit être sur **GitHub Actions**.

### Mentions

Jeu original, sans lien avec un éditeur ou une licence existante. Aucune donnée collectée : pas de compte, pas de publicité, pas de suivi. La progression reste dans le navigateur.

# Référence technique de la ROM fournie

La ROM a uniquement servi à confirmer la cible matérielle et à cadrer la réécriture. Elle n'est pas incluse dans le projet.

| Champ | Valeur |
| --- | --- |
| Format | Game Boy Advance |
| Taille | 4 194 304 octets (4 Mio) |
| Titre d'en-tête | `SUPERDODGE` |
| Code jeu | `ADFE` |
| Code fabricant | `EB` |
| Révision | 0 |
| Somme de contrôle d'en-tête | Valide (`0xC8`) |
| SHA-256 | `4a66b812a0ab885ab11c0b9c5666084a3c4d013edcb1924100ed80e6881f205a` |

## Stratégie de réécriture

1. Reproduire les sensations générales avec des règles documentées et testables.
2. Utiliser une physique, une IA et une interface entièrement nouvelles.
3. Remplacer les personnages, logos, musiques et décors par des créations originales.
4. Garder le contenu configurable pour permettre de nouvelles équipes, arènes et modes.

## Prochaines briques

- machine à états d'animation avec atlas normalisé ;
- sélection d'équipe et statistiques individuelles ;
- passes spéciales, esquive, charge et super-tirs ;
- campagne pilotée par fichiers JSON ;
- audio original via Web Audio ou banques sous licence compatible ;
- mode deux joueurs local et prise en charge des manettes ;
- tests de simulation reproductibles avec générateur aléatoire injecté.

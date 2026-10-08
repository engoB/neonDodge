// Réglages du jeu.
// Les valeurs de base sont des mesures de mécaniques (vitesses, gravité, délais) relevées sur un jeu
// de balle au prisonnier rétro, exprimées en px/image à 60 images/s, puis mises à l'échelle.
// Seules des mécaniques (des nombres) sont reprises : tout le code et tous les visuels sont originaux.

export const FPS = 60
export const DT = 1 / FPS
export const S = 1.5 // échelle : écran logique de 270 px de haut

// Déplacements
export const RUN = 1.88 * S // vitesse de course (la marche vaut la moitié)
export const JUMP_V = (760 / 256) * S // impulsion du saut
export const GRAVITY = (24 / 256) * S // gravité par image
export const LOW_JUMP_GRAVITY = GRAVITY * 2.6 // doigt relâché tôt : saut court
export const MAX_FALL = 7 * S

// Tirs
export const SHOT = 3.36 * S // tir à l'arrêt
export const SHOT_RUN = 3.85 * S // tir en course (+15 %)
export const SHOT_AI = 3.47 * S // tir de l'adversaire
export const SHOT_DIVE = 3.66 * S // tir en saut, plongeant
export const LOB_GRAVITY = (32 / 256) * S // gravité des balles en cloche
export const SUPER_CHARGE = 24 // images de course balle en main avant le super tir
export const DAMAGE = 2 // dégâts d'un tir normal
export const SUPER_DAMAGE = 12 // dégâts d'un super tir

// Rattrapage : la fenêtre parfaite est 3 images avant le contact.
// En jeu tactile on accepte une marge (latence de l'écran), la fenêtre parfaite donne un bonus.
export const CATCH_PERFECT = 3
export const CATCH_MIN = 0
export const CATCH_MAX = 9

// Rebond après impact sur un joueur
export const BOUNCE_VX = 0.5 * S
export const BOUNCE_VZ = 1.84 * S
export const BOUNCE_GRAVITY = (42 / 256) * S

// IA : 2 ou 3 pas d'élan puis tir
export const AI_STEPS = [2, 3]
export const AI_STEP_FRAMES = 10

// Joueur
export const HEARTS = 3
export const INVULN = 80 // images d'invulnérabilité après un coup
export const PLAYER_SCREEN_X = 0.24 // position du joueur à l'écran (fraction de la largeur)
export const GROUND_Y = 220
export const VIEW_H = 270
export const MIN_VIEW_W = 380

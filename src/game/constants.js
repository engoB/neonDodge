// Réglages du match.
// Base : mécaniques mesurées sur un jeu de balle au prisonnier rétro (px/image à 60 images/s,
// 1 unité = 1 px de terrain). Seules ces mécaniques (des nombres) sont reprises ;
// le code, les personnages, les équipes, les graphismes et les sons sont originaux.

export const FPS = 60

// Terrain (coordonnées de terrain : x horizontal, y profondeur, z hauteur)
export const COURT_W = 480
export const MID = 240
export const DEPTH = 96
export const INFIELD_MARGIN = 14 // les intérieurs restent à cette distance des bords
export const MIDLINE_GAP = 8 // et de la ligne médiane (bloqués avant de la franchir)

// Déplacements (mesurés)
export const WALK = 240 / 256 // 0,94 px/image
export const RUN = 2 * WALK // 1,88 px/image (course)
export const DIAGONAL = 0xb2 / 256 // facteur diagonal ≈ 1/√2
export const JUMP_V = 760 / 256 // impulsion de saut
export const GRAVITY = 24 / 256 // gravité joueur

// Tirs (mesurés)
export const SHOT = 3.36 // tir à l'arrêt
export const SHOT_RUN = 3.85 // tir en course
export const SHOT_JUMP = 3.66 // tir en saut, plongeant
export const SHOT_AI = 3.47 // tir de l'adversaire
export const POWER_SPEED = 20 / 256 // +0,078 px/image par point de puissance
export const PASS_VX = 3.11 // passe en cloche
export const LOB_GRAVITY = 32 / 256
export const WINDUP = 10 // images d'élan avant le départ de la balle (joueur : réactif)
export const WINDUP_AI = 15 // élan mesuré
export const SUPER_CHARGE = 24 // images de course avant le super tir
export const SUPER_ZONE = 4 // il faut relâcher dans ces images-là, sinon le tir redevient normal
export const SPECIAL_WINDOW = 104 // durée d'armement d'une passe spéciale

// Rattrapage : la fenêtre mesurée est 1 image, 3 images avant le contact.
// Au doigt on accepte 2 à 4 images ; 3 images = « parfait ».
export const CATCH_PERFECT = 3
export const CATCH_MIN = 2
export const CATCH_MAX = 4
export const HOLD_TO_JUMP = 7 // images de doigt maintenu avant le saut d'esquive
export const WHIFF = 14 // images de vulnérabilité après un rattrapage manqué

// Rebonds (mesurés)
export const BOUNCE_VX = 0.5
export const BOUNCE_VZ = 1.84
export const BOUNCE_GRAVITY = 42 / 256
export const FLOOR_BOUNCE_VZ = 2.0

// IA (mesurée) : 2 ou 3 pas d'élan puis tir, hasard sol / saut, cible dans un cône
export const AI_STEPS = [2, 3]
export const AI_STEP_FRAMES = 10
export const AI_JUMP_THROW = 0.42
export const CONE = Math.PI / 4 // 45°
export const CONE_WIDE = Math.PI / 2 // 90°

// Dégâts : mesurés 2 PV (tir normal) et 12 PV (super tir) ; la Force les module.
// Points de vie mesurés 17 à 23.
export const damage = (force, sup) => (sup ? 12 + Math.floor(force / 3) : 2 + Math.floor(force / 3))
export const HIT_STUN = 40

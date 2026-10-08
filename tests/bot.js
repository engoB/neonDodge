// Robot « humain » : n'utilise que les commandes à un doigt, avec des réflexes imparfaits.
import { Match } from '../src/game/match.js'
import * as C from '../src/game/constants.js'

export function playMatch(rival, seed, { skill = 0.7, maxFrames = 60 * 60 * 10 } = {}) {
  let out = null
  const m = new Match({ rival, seed, onEnd: (r) => (out = r) })
  m.setView(560)
  let r = seed * 7919
  const rand = () => ((r = (r * 16807) % 2147483647) / 2147483647)
  // erreur de timing d'un doigt humain : loi normale, écart-type (1 - adresse) × 4 images
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())
  const sd = (1 - skill) * 4
  let holdUntil = -1
  let plannedCatch = null
  for (let f = 0; f < maxFrames && !out; f++) {
    if (m.state === 'play') {
      const c = m.controlled
      const h = m.holder
      if (h && c === h) {
        if (!m.input.pressed && h.state === 'hold') {
          m.press()
          // un joueur appliqué court jusqu'au super tir, sinon tir rapide
          // vise le milieu de la zone du super tir, avec l'erreur humaine
          holdUntil = f + Math.round(C.SUPER_CHARGE + C.SUPER_ZONE / 2 + gauss() * sd * 2)
        } else if (m.input.pressed && f >= holdUntil) m.release()
      } else if (c) {
        const ftc = m.framesToContact(c)
        if (ftc !== null && plannedCatch === null && ftc < 30) {
          // vise la fenêtre parfaite avec une erreur de ±2 images selon l'adresse
          const err = Math.round(gauss() * sd)
          plannedCatch = { at: f + Math.max(0, Math.round(ftc - C.CATCH_PERFECT)) + err }
        }
        if (plannedCatch && f >= plannedCatch.at) {
          m.press()
          m.release()
          plannedCatch = null
        }
        if (ftc === null) plannedCatch = null
      }
    }
    m.update()
  }
  return { out, m }
}

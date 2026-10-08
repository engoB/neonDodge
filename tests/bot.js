// Bot de test : joue un niveau avec la même touche unique qu'un joueur.
import { Game } from '../src/game/engine.js'
import * as C from '../src/game/constants.js'

export function playLevel(opts, { maxFrames = 60 * 240, verbose = false } = {}) {
  let result = null
  const g = new Game({ ...opts, onEnd: (r) => (result = r) })
  g.setView(480)
  let holdFor = 0
  const log = []
  for (let f = 0; f < maxFrames && !result; f++) {
    const p = g.p
    if (holdFor > 0 && --holdFor === 0) g.release()
    if (g.state === 'run' && !p.dead && p.bubble === 0 && holdFor === 0) {
      let act = null
      if (p.ball) {
        const tgt = g.pickTarget()
        if (tgt && (p.charged || tgt.x - p.x < 200)) act = 'throw'
      } else {
        const c = g.catchable()
        if (c && c.ftc >= 2 && c.ftc <= 4) act = 'catch'
      }
      if (!act && p.grounded) {
        // trou devant : sauter assez tôt pour le franchir
        const ahead = [16, 26].some((d) => g.groundAt(p.x + d) === null && !g.surfaces(p.x + d).length)
        const danger = g.balls.some((b) => b.owner === 'enemy' && !b.catchable && b.x > p.x && (b.x - p.x) / (C.RUN - b.vx) < 16)
        const enemyBall = g.balls.some((b) => b.owner === 'enemy' && b.catchable && b.x > p.x && (b.x - p.x) / (C.RUN - b.vx) < 1.5)
        if (ahead) act = 'gap'
        else if (danger || (p.ball && enemyBall)) act = 'dodge'
      }
      if (act) {
        g.press()
        holdFor = act === 'gap' ? 30 : act === 'dodge' ? 12 : 1
        if (verbose) log.push(`${f} ${act} x=${p.x | 0}`)
      }
    }
    g.update()
  }
  return { result, g, log }
}

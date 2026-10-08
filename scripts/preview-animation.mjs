import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { drawAthlete, preloadSprites } from '../src/game/sprites.js'
import { CAPTAINS, rosterKit } from '../src/game/teams.js'
await preloadSprites((url) => loadImage(fileURLToPath(url)), createCanvas)
await mkdir('.tmp/animation', { recursive: true })
const sequence = [
  ['idle', 6],
  ['run', 10],
  ['hold', 3],
  ['windup', 3],
  ['throw', 4],
  ['catch', 4],
  ['jump', 4],
  ['hurt', 4],
  ['ko', 6],
  ['cheer', 8],
]
const labels = {
  idle: 'PRÊT',
  run: 'COURSE',
  hold: 'POSSESSION',
  windup: 'PRÉPARATION',
  throw: 'LANCER',
  catch: 'RÉCEPTION',
  jump: 'SAUT',
  hurt: 'IMPACT',
  ko: 'KO',
  cheer: 'VICTOIRE',
}
let n = 0
for (const [pose, frames] of sequence)
  for (let step = 0; step < frames; step++) {
    const canvas = createCanvas(960, 250),
      ctx = canvas.getContext('2d')
    ctx.fillStyle = '#091c29'
    ctx.fillRect(0, 0, 960, 250)
    ctx.textAlign = 'center'
    for (const [col, team] of CAPTAINS.entries()) {
      const x = col * 240 + 120
      ctx.fillStyle = '#122c3b'
      ctx.fillRect(col * 240 + 10, 12, 220, 226)
      ctx.fillStyle = team.accent
      ctx.font = '900 22px sans-serif'
      ctx.fillText(team.players[0].name.toUpperCase(), x, 42)
      drawAthlete(ctx, {
        x,
        y: 204,
        size: 2.7,
        kit: rosterKit(team, 0),
        pose,
        t: step / 12,
        progress: step / frames,
      })
      ctx.fillStyle = '#cad8dc'
      ctx.font = '700 12px sans-serif'
      ctx.fillText(labels[pose], x, 228)
    }
    await writeFile('.tmp/animation/' + String(n++).padStart(3, '0') + '.png', canvas.toBuffer('image/png'))
  }

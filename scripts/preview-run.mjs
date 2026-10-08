// A continuous run loop, both isolated and in the actual match renderer.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { drawAthlete, preloadSprites } from '../src/game/sprites.js'
import { CAPTAINS, RIVALS, rosterKit } from '../src/game/teams.js'
import { Match } from '../src/game/match.js'
import { drawMatch } from '../src/game/render.js'
await preloadSprites((url) => loadImage(fileURLToPath(url)), createCanvas)
await mkdir('.tmp/run-review', { recursive: true })
await mkdir('.tmp/run-ingame', { recursive: true })
for (let frame = 0; frame < 24; frame++) {
  const canvas = createCanvas(960, 250),
    ctx = canvas.getContext('2d')
  ctx.fillStyle = '#091c29'
  ctx.fillRect(0, 0, 960, 250)
  ctx.textAlign = 'center'
  for (const [col, team] of CAPTAINS.entries()) {
    ctx.fillStyle = '#122c3b'
    ctx.fillRect(col * 240 + 10, 12, 220, 226)
    ctx.fillStyle = team.accent
    ctx.font = '900 22px sans-serif'
    ctx.fillText(team.players[0].name.toUpperCase(), col * 240 + 120, 42)
    drawAthlete(ctx, {
      x: col * 240 + 120,
      y: 204,
      size: 2.7,
      kit: rosterKit(team, 0),
      pose: 'run',
      t: frame / 24,
    })
  }
  await writeFile('.tmp/run-review/' + String(frame).padStart(3, '0') + '.png', canvas.toBuffer('image/png'))
}
const match = new Match({ rival: RIVALS[5], seed: 12, auto: true, reducedMotion: true })
match.setView(560)
for (let i = 0; i < 150; i++) match.update()
for (let frame = 0; frame < 72; frame++) {
  for (let tick = 0; tick < 5; tick++) match.update()
  const canvas = createCanvas(844, 360),
    ctx = canvas.getContext('2d')
  const scale = 844 / 560
  ctx.imageSmoothingEnabled = false
  drawMatch(match, ctx, scale, 1, 360 / scale, frame / 12)
  await writeFile('.tmp/run-ingame/' + String(frame).padStart(3, '0') + '.png', canvas.toBuffer('image/png'))
}

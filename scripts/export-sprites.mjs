// Export review images from the very same bitmaps and renderer used in the game.
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { drawAthlete, preloadSprites, FRAME_SEQUENCES, ATHLETE_IDS } from '../src/game/sprites.js'
import { CAPTAINS, rosterKit, RIVALS, PLAYER_TEAM } from '../src/game/teams.js'
import { Match } from '../src/game/match.js'
import { drawMatch } from '../src/game/render.js'
await preloadSprites((url) => loadImage(fileURLToPath(url)), createCanvas)
await mkdir('docs/previews', { recursive: true })
const manifest = {
  frameW: 160,
  frameH: 128,
  columns: 4,
  rows: 4,
  cels: 16,
  standingHeight: 96,
  baseline: 112,
  sequences: FRAME_SEQUENCES,
  fps: { idle: 3, walk: 7, run: 12 },
  athletes: ATHLETE_IDS.map((id) => ({
    id,
    filename: id + '.png',
    role: ['riko', 'gaspard', 'iris', 'vega'].includes(id) ? 'captain' : 'teammate',
  })),
  captains: CAPTAINS.map((team) => ({
    id: rosterKit(team, 0).spriteId,
    team: team.name,
    name: team.players[0].name,
    filename: rosterKit(team, 0).spriteId + '.png',
  })),
}
await writeFile('assets/sprites/atlas.json', JSON.stringify(manifest, null, 2) + '\n')
const poses = ['idle', 'run', 'throw', 'catch']
const sheet = createCanvas(960, 660),
  ctx = sheet.getContext('2d')
ctx.fillStyle = '#091c29'
ctx.fillRect(0, 0, 960, 660)
ctx.textAlign = 'center'
for (const [col, team] of CAPTAINS.entries()) {
  ctx.font = '900 24px sans-serif'
  ctx.fillStyle = team.accent
  ctx.fillText(team.players[0].name.toUpperCase(), col * 220 + 150, 42)
  for (const [row, pose] of poses.entries()) {
    const x = col * 220 + 150,
      y = row * 148 + 182
    ctx.fillStyle = '#102b3a'
    ctx.fillRect(x - 92, y - 123, 184, 134)
    drawAthlete(ctx, { x, y, size: 2.3, kit: rosterKit(team, 0), pose, t: 0.1 })
  }
}
ctx.font = '700 12px sans-serif'
ctx.fillStyle = '#bdcbd1'
for (const [i, name] of ['PRÊT', 'COURSE', 'LANCER', 'RÉCEPTION'].entries()) {
  ctx.save()
  ctx.translate(21, i * 148 + 131)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(name, 0, 0)
  ctx.restore()
}
await writeFile('docs/previews/captains-baseball.png', sheet.toBuffer('image/png'))
const club = createCanvas(1400, 420),
  clubCtx = club.getContext('2d')
clubCtx.fillStyle = '#091c29'
clubCtx.fillRect(0, 0, 1400, 420)
clubCtx.textAlign = 'center'
for (const [i, p] of PLAYER_TEAM.players.entries()) {
  const x = i * 200 + 100
  clubCtx.fillStyle = '#122c3b'
  clubCtx.fillRect(i * 200 + 8, 10, 184, 400)
  clubCtx.fillStyle = '#5de7cd'
  clubCtx.font = '900 20px sans-serif'
  clubCtx.fillText(p.name.toUpperCase(), x, 39)
  clubCtx.fillStyle = '#bdcbd1'
  clubCtx.font = '700 11px sans-serif'
  clubCtx.fillText(i === 0 ? 'CAPITAINE' : 'ÉQUIPIER', x, 59)
  for (const [row, pose] of ['idle', 'run'].entries())
    drawAthlete(clubCtx, { x, y: 193 + row * 185, size: 2.3, kit: rosterKit(PLAYER_TEAM, i), pose, t: 0 })
}
await writeFile('docs/previews/club-lineup.png', club.toBuffer('image/png'))
for (const [label, width, height, viewW] of [
  ['landscape', 844, 300, 560],
  ['portrait', 390, 541, 360],
]) {
  const match = new Match({ rival: RIVALS[5], auto: true, seed: 8 })
  match.setView(viewW)
  for (let frame = 0; frame < 370; frame++) match.update()
  const canvas = createCanvas(width, height),
    context = canvas.getContext('2d')
  context.imageSmoothingEnabled = false
  const scale = width / viewW
  drawMatch(match, context, scale, 1, height / scale, 4)
  await writeFile('docs/previews/arena-' + label + '.png', canvas.toBuffer('image/png'))
}
console.log('Review images rendered from 10 baseball atlases, 16 cels each.')

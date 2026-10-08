import { createCanvas } from '@napi-rs/canvas'
import { mkdir, writeFile } from 'node:fs/promises'
import { drawAthlete, ANIMATION_POSES } from '../src/game/sprites.js'
import { CAPTAINS, rosterKit } from '../src/game/teams.js'

const frameW = 64,
  frameH = 64,
  frames = 8
await mkdir('assets/sprites', { recursive: true })
const manifest = { frameW, frameH, frames, fps: 12, poses: ANIMATION_POSES, captains: [] }
for (const team of CAPTAINS) {
  const canvas = createCanvas(frameW * frames, frameH * ANIMATION_POSES.length)
  const ctx = canvas.getContext('2d')
  for (const [row, pose] of ANIMATION_POSES.entries())
    for (let frame = 0; frame < frames; frame++) {
      drawAthlete(ctx, {
        x: frame * frameW + frameW / 2,
        y: row * frameH + 55,
        kit: rosterKit(team, 0),
        pose,
        t: frame / 12,
        ball: ['hold', 'windup'].includes(pose) ? 'player' : null,
      })
    }
  const filename = `${team.id}-captain.png`
  await writeFile(`assets/sprites/${filename}`, canvas.toBuffer('image/png'))
  manifest.captains.push({ id: team.id, team: team.name, name: team.players[0].name, filename })
}
await writeFile('assets/sprites/atlas.json', JSON.stringify(manifest, null, 2) + '\n')
console.log('Four captain atlases exported: 13 poses × 8 frames, 64 × 64 px, transparent background.')

// Reproducible views of the renderer; these do not pretend to be browser screenshots.
const { Match } = await import('../src/game/match.js')
const { RIVALS } = await import('../src/game/teams.js')
const { drawMatch } = await import('../src/game/render.js')
await mkdir('docs/previews', { recursive: true })
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
  await writeFile(`docs/previews/arena-${label}.png`, canvas.toBuffer('image/png'))
}

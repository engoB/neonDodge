import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { fileURLToPath } from 'node:url'
import {
  drawAthlete,
  ANIMATION_POSES,
  preloadSprites,
  getSpriteAsset,
  animationFrame,
  ATHLETE_IDS,
} from '../src/game/sprites.js'
import { drawMatch } from '../src/game/render.js'
import { Match } from '../src/game/match.js'
import { RIVALS, CAPTAINS, rosterKit } from '../src/game/teams.js'

await preloadSprites((url) => loadImage(fileURLToPath(url)), createCanvas)

test('atlas réels : 16 cellules remplies, alpha préservé et capitaines de même stature', () => {
  for (const id of ATHLETE_IDS) {
    const image = getSpriteAsset(id)
    assert.equal(image.width, 640)
    assert.equal(image.height, 512)
    const canvas = createCanvas(640, 512),
      ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0)
    for (let frame = 0; frame < 16; frame++) {
      const x = (frame % 4) * 160,
        y = Math.floor(frame / 4) * 128
      const data = ctx.getImageData(x, y, 160, 128).data
      assert.ok(
        data.some((v, i) => i % 4 === 3 && v > 0),
        id + ':' + frame,
      )
      assert.equal(data[3], 0)
      for (let i = 0; i < 160; i++) {
        assert.equal(data[i * 4 + 3], 0)
        assert.equal(data[(127 * 160 + i) * 4 + 3], 0)
      }
      if (frame === 0) {
        const rows = [...Array(128).keys()].filter((r) =>
          data.slice(r * 160 * 4, (r + 1) * 160 * 4).some((v, i) => i % 4 === 3 && v > 24),
        )
        assert.ok(rows.at(-1) - rows[0] + 1 >= 94 && rows.at(-1) - rows[0] + 1 <= 98)
      }
    }
  }
})

test('lancer et réception avancent avec leur action, sans revenir au premier cel', () => {
  assert.equal(animationFrame('throw', 99, 0), 8)
  assert.equal(animationFrame('throw', 0, 0.9), 9)
  assert.equal(animationFrame('catch', 99, 0), 10)
  assert.equal(animationFrame('catch', 0, 1), 11)
  assert.notEqual(animationFrame('run', 0), animationFrame('run', 0.1))
})

test('course : appuis étendus et jambes de passage alternent dans tous les atlas', () => {
  for (const id of ATHLETE_IDS) {
    const ctx = createCanvas(640, 512).getContext('2d')
    ctx.drawImage(getSpriteAsset(id), 0, 0)
    const widths = [2, 3, 4, 5].map((cel) => {
      const data = ctx.getImageData((cel % 4) * 160, Math.floor(cel / 4) * 128 + 76, 160, 36).data
      const columns = [...Array(160).keys()].filter((x) =>
        [...Array(36).keys()].some((y) => data[(y * 160 + x) * 4 + 3] > 24),
      )
      return columns.at(-1) - columns[0] + 1
    })
    assert.ok(widths[0] > widths[1] * 1.4, `${id}: pas de passage après le premier appui`)
    assert.ok(widths[2] > widths[3] * 1.4, `${id}: pas de passage après le second appui`)
  }
})

test('chaque club a sept visuels stables et distincts, sans réutiliser ses capitaines comme équipiers', () => {
  const captains = new Set(['riko', 'gaspard', 'iris', 'vega'])
  for (const team of [CAPTAINS[0], ...RIVALS]) {
    const ids = team.players.map((_, i) => rosterKit(team, i).spriteId)
    assert.equal(new Set(ids).size, 7, team.name)
    assert.ok(captains.has(ids[0]))
    assert.ok(ids.slice(1).every((id) => !captains.has(id) && ATHLETE_IDS.includes(id)))
    assert.deepEqual(
      ids,
      team.players.map((_, i) => rosterKit(team, i).spriteId),
    )
  }
})

test('les dix silhouettes et les treize poses se dessinent sans sortir des cellules', () => {
  for (const id of ATHLETE_IDS)
    for (const pose of ANIMATION_POSES) {
      const canvas = createCanvas(80, 72)
      const ctx = canvas.getContext('2d')
      drawAthlete(ctx, { x: 40, y: 63, kit: { spriteId: id, nativePalette: true }, pose, t: 0.25 })
      const pixels = ctx.getImageData(0, 0, 80, 72).data
      assert.ok(
        pixels.some((value, index) => index % 4 === 3 && value > 0),
        `${id} : ${pose} invisible`,
      )
      for (let i = 0; i < 80; i++) {
        assert.equal(pixels[i * 4 + 3], 0, `${id} : ${pose} dépasse en haut`)
        assert.equal(pixels[(71 * 80 + i) * 4 + 3], 0, `${id} : ${pose} dépasse en bas`)
      }
    }
})

test('les six stades remplissent le canvas en portrait et en paysage', () => {
  for (const rival of RIVALS) {
    for (const [width, height, viewW] of [
      [844, 300, 560],
      [390, 541, 360],
    ]) {
      const m = new Match({ rival, seed: 8, auto: true })
      m.setView(viewW)
      for (let i = 0; i < 370; i++) m.update()
      const canvas = createCanvas(width, height),
        ctx = canvas.getContext('2d')
      const scale = width / viewW
      drawMatch(m, ctx, scale, 1, height / scale, 4)
      const corners = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ]
      for (const [x, y] of corners)
        assert.equal(ctx.getImageData(x, y, 1, 1).data[3], 255, `${rival.arena} : coin transparent`)
    }
  }
})

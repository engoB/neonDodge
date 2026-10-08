import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createCanvas } from '@napi-rs/canvas'
import { drawAthlete, ANIMATION_POSES } from '../src/game/sprites.js'
import { drawMatch } from '../src/game/render.js'
import { Match } from '../src/game/match.js'
import { RIVALS, CAPTAINS, rosterKit } from '../src/game/teams.js'

test('les quatre capitaines et les treize poses se dessinent sans sortir des cellules', () => {
  for (const team of CAPTAINS)
    for (const pose of ANIMATION_POSES) {
      const canvas = createCanvas(64, 64)
      const ctx = canvas.getContext('2d')
      drawAthlete(ctx, { x: 32, y: 55, kit: rosterKit(team, 0), pose, t: 0.25 })
      const pixels = ctx.getImageData(0, 0, 64, 64).data
      assert.ok(
        pixels.some((value, index) => index % 4 === 3 && value > 0),
        `${team.name} : ${pose} invisible`,
      )
      for (let i = 0; i < 64; i++) {
        assert.equal(pixels[i * 4 + 3], 0, `${team.name} : ${pose} dépasse en haut`)
        assert.equal(pixels[(63 * 64 + i) * 4 + 3], 0, `${team.name} : ${pose} dépasse en bas`)
      }
    }
})

test('les quatre stades remplissent le canvas en portrait et en paysage', () => {
  for (const rival of [RIVALS[0], RIVALS[1], RIVALS[2], RIVALS[5]]) {
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

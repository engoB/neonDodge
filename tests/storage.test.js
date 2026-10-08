import { test } from 'node:test'
import assert from 'node:assert/strict'
import { load, recordMatch } from '../src/game/storage.js'

test('migration : les scores précédents sont conservés et les réglages enrichis', () => {
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ beaten: 3, best: { 0: 1800 }, trophies: 1, settings: { sound: false } }),
  }
  const progress = load()
  assert.equal(progress.beaten, 3)
  assert.equal(progress.best[0], 1800)
  assert.equal(progress.settings.sound, false)
  assert.equal(typeof progress.settings.reducedMotion, 'boolean')
  delete globalThis.localStorage
})

test('une sauvegarde invalide ne bloque pas le club ou le tournoi', () => {
  globalThis.localStorage = {
    getItem: () => JSON.stringify({ beaten: 999, best: null, trophies: -20, settings: { sound: 'false' } }),
  }
  const progress = load()
  assert.equal(progress.beaten, 6)
  assert.deepEqual(progress.best, {})
  assert.equal(progress.trophies, 0)
  assert.equal(progress.settings.sound, true)
  delete globalThis.localStorage
  assert.equal(load().beaten, 0)
})

test('la finale décerne la coupe une fois et les défaites gardent les records', () => {
  const before = { beaten: 5, best: {}, trophies: 0 }
  const win = recordMatch(before, 5, 6, { win: true, score: 2200 })
  assert.equal(win.trophies, 1)
  assert.equal(recordMatch(win, 5, 6, { win: true, score: 1500 }).trophies, 1)
  assert.equal(recordMatch(win, 5, 6, { win: true, score: 1500 }).best[5], 2200)
  assert.equal(recordMatch(win, 5, 6, { win: false }), win)
})

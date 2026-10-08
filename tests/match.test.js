import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Match } from '../src/game/match.js'
import { RIVALS, PLAYER_TEAM } from '../src/game/teams.js'
import * as C from '../src/game/constants.js'
import { playMatch } from './bot.js'

test('équipes : 7 joueurs, caractéristiques dans les plages mesurées', () => {
  for (const t of [PLAYER_TEAM, ...RIVALS]) {
    assert.equal(t.players.length, 7, t.name)
    for (const p of t.players) {
      for (const k of ['force', 'power', 'speed', 'jump', 'catching', 'defense']) assert.ok(p.stats[k] >= 2 && p.stats[k] <= 11, `${t.name} ${p.name} ${k}`)
      assert.ok(p.stats.hp >= 17 && p.stats.hp <= 23, `${t.name} ${p.name} PV`)
    }
  }
})

test('match IA contre IA : se termine, sans valeur invalide', () => {
  for (const rival of RIVALS) {
    let out = null
    const m = new Match({ rival, seed: 3, auto: true, onEnd: (r) => (out = r) })
    for (let f = 0; f < 60 * 60 * 10 && !out; f++) {
      m.update()
      const b = m.ball
      assert.ok([b.x, b.y, b.z].every(Number.isFinite), `${rival.name} : balle invalide`)
    }
    assert.ok(out, `${rival.name} : le match ne se termine pas`)
  }
})

test('rattrapage : seule la fenêtre de 2 à 4 images avant l’impact fonctionne', () => {
  const m = new Match({ rival: RIVALS[0], seed: 5 })
  m.state = 'play'
  const target = m.players[3]
  const thrower = m.players[8]
  m.giveBall(thrower)
  thrower.throwOpts = { target }
  m.release_ball(thrower)
  let caught = false
  for (let f = 0; f < 200 && !caught; f++) {
    const c = m.controlled
    const ftc = c ? m.framesToContact(c) : null
    if (ftc !== null && Math.abs(ftc - C.CATCH_PERFECT) < 0.5) {
      m.press()
      caught = m.holder === c
      break
    }
    m.update()
  }
  assert.ok(caught, 'un appui 3 images avant l’impact doit attraper la balle')
})

test('progression du tournoi : abordable au début, exigeante en finale', () => {
  const rate = (rival, skill) => {
    let w = 0
    for (let s = 1; s <= 6; s++) if (playMatch(rival, s, { skill }).out?.win) w++
    return w
  }
  const moyen = RIVALS.map((r) => rate(r, 0.5))
  console.log('joueur moyen, victoires sur 6 par adversaire :', moyen.join(' '))
  assert.ok(moyen[0] >= 5, 'le premier adversaire doit être abordable pour un joueur moyen')
  assert.ok(moyen[5] <= 4, 'la finale doit résister à un joueur moyen')
  assert.ok(rate(RIVALS[5], 0.9) >= 4, 'un joueur très adroit doit pouvoir gagner la finale')
})

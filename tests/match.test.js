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
      for (const k of ['force', 'power', 'speed', 'jump', 'catching', 'defense'])
        assert.ok(p.stats[k] >= 2 && p.stats[k] <= 11, `${t.name} ${p.name} ${k}`)
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

test('décompte et pause : les appuis ne verrouillent pas la prochaine action', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.press()
  assert.equal(m.input.pressed, false)
  m.state = 'paused'
  const frame = m.frame
  for (let i = 0; i < 50; i++) m.update()
  assert.equal(m.frame, frame)
  assert.equal(m.playFrames, 0)
  m.state = 'play'
  m.press()
  assert.equal(m.holder.state, 'dash')
})

test('annuler un geste ne lance pas la balle et remet la charge à zéro', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.press()
  for (let i = 0; i < 18; i++) m.update()
  m.cancelInput()
  m.release()
  assert.equal(m.ball.state, 'held')
  assert.equal(m.holder.state, 'hold')
  assert.equal(m.holder.charge, 0)
  assert.equal(m.input.pressed, false)
})

test('le HUD distingue la fenêtre signature d’une charge dépassée', () => {
  let hud
  const m = new Match({
    rival: RIVALS[0],
    onHud: (h) => {
      hud = h
    },
  })
  m.state = 'play'
  m.press()
  for (let i = 0; i < C.SUPER_CHARGE; i++) m.update()
  assert.equal(hud.superReady, true)
  assert.equal(hud.chargeLate, false)
  for (let i = 0; i <= C.SUPER_ZONE; i++) m.update()
  assert.equal(hud.superReady, false)
  assert.equal(hud.chargeLate, true)
  m.release()
  assert.equal(m.holder.throwOpts.sup, false)
})

test('une réception parfaite conserve son bonus pour le prochain élan', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  const p = m.players[0]
  m.catchBall(p, true)
  for (let i = 0; i < 12; i++) m.update()
  m.press()
  assert.equal(p.charge, C.SUPER_CHARGE - 6)
  for (let i = 0; i < 6; i++) m.update()
  m.release()
  assert.equal(p.throwOpts.sup, true)
})

test('les joueurs regardent la balle sans osciller dans la zone morte', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  const p = m.players[1]
  p.x = 100
  p.facing = 1
  m.ball.state = 'loose'
  m.ball.holder = null
  m.ball.x = 40
  m.updateFacing(p)
  assert.equal(p.facing, -1)
  m.ball.x = 104
  m.updateFacing(p)
  assert.equal(p.facing, -1, 'la zone morte conserve la dernière direction')
  m.ball.x = 160
  m.updateFacing(p)
  assert.equal(p.facing, 1)
})

test('le bouton Jump Shot saute puis lance automatiquement au sommet', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  assert.equal(m.jumpShot(), true)
  assert.equal(m.holder.state, 'jump')
  for (let i = 0; i < 90 && m.ball.state === 'held'; i++) m.update()
  assert.equal(m.ball.state, 'flying')
  assert.equal(m.ball.jumpShot, true)
})

test('la caméra cadre l’action et un tir signature déclenche son annonce', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.setView(360)
  const p = m.players[0]
  p.throwOpts = { target: m.players[10], sup: true }
  m.release_ball(p)
  for (let i = 0; i < 24; i++) m.updateCamera()
  assert.ok(m.camZoom > 1.08)
  assert.ok(m.camX < C.MID, 'la caméra se rapproche du lanceur au départ du tir')
  assert.equal(m.superBanner.name, 'COMÈTE FATALE')
})

test('fin du match : plus de dégâts ni de temps de jeu, un seul résultat', () => {
  let ends = 0
  const m = new Match({ rival: RIVALS[0], onEnd: () => ends++ })
  m.state = 'play'
  m.alive(1).forEach((p) => {
    p.ko = true
    p.hp = 0
  })
  m.checkEnd()
  const time = m.playFrames
  const health = m.alive(0).map((p) => p.hp)
  for (let i = 0; i < 220; i++) m.update()
  assert.equal(ends, 1)
  assert.equal(m.playFrames, time)
  assert.deepEqual(
    m.alive(0).map((p) => p.hp),
    health,
  )
})

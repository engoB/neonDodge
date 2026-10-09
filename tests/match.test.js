import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Match } from '../src/game/match.js'
import { poseOf } from '../src/game/render.js'
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
  assert.equal(m.holder.state, 'meter')
  assert.equal(m.shotMeter.stage, 1)
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

test('la jauge enchaîne trois timings puis déclenche le tir signature', () => {
  let hud
  const m = new Match({
    rival: RIVALS[0],
    onHud: (h) => {
      hud = h
    },
  })
  m.state = 'play'
  m.press()
  m.release()
  for (let stage = 1; stage <= 3; stage++) {
    const zone = m.meterWindow()
    m.shotMeter.value = (zone.start + zone.end) / 2
    m.press()
    m.release()
    if (stage < 3) assert.equal(m.shotMeter.stage, stage + 1)
  }
  assert.equal(m.shotMeter, null)
  assert.equal(m.holder.throwOpts.sup, true)
  m.emitHud()
  assert.equal(hud.shotMeter, null)
})

test('la jauge ne fait qu’un passage puis déclenche un tir normal', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.press()
  m.release()
  let previous = m.shotMeter.value
  for (let i = 0; i < 100 && m.shotMeter; i++) {
    m.updateShotMeter()
    if (m.shotMeter) {
      assert.ok(m.shotMeter.value >= previous, 'le curseur ne doit jamais repartir au début')
      previous = m.shotMeter.value
    }
  }
  assert.equal(m.shotMeter, null)
  assert.equal(m.holder.state, 'windup')
  assert.equal(m.holder.throwOpts.sup, undefined)
})

test('une réception parfaite élargit la jauge sans renvoyer la balle', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  const p = m.players[0]
  m.catchBall(p, true)
  assert.equal(m.input.pressed, false)
  assert.equal(m.ball.state, 'held')
  for (let i = 0; i < 12; i++) m.update()
  assert.equal(m.ball.state, 'held', 'la réception ne doit jamais devenir un lancer automatique')
  m.press()
  assert.equal(m.shotMeter.bonus, true)
  const width = m.meterWindow().end - m.meterWindow().start
  assert.ok(width > C.METER_ZONE[0])
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

test('les joueurs extérieurs se stabilisent au lieu de vibrer sur les sous-pixels', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  const side = m.players[4]
  for (let i = 0; i < 90; i++) {
    m.ball.y = i % 2 ? 44.1 : 44.9
    m.updatePlayer(side)
  }
  const y = side.y
  for (let i = 0; i < 30; i++) {
    m.ball.y = i % 2 ? 44.1 : 44.9
    m.updatePlayer(side)
    assert.equal(side.y, y)
  }
  assert.equal(side.state, 'idle')
})

test('à la fin tous les survivants gagnants célèbrent et les perdants sont abattus', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'end'
  m.winner = 0
  const winner = m.players[0]
  const loser = m.players[7]
  winner.state = 'hold'
  loser.state = 'walk'
  assert.equal(poseOf(m, winner), 'cheer')
  assert.equal(poseOf(m, loser), 'hurt')
  loser.ko = true
  assert.equal(poseOf(m, loser), 'ko')
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
  assert.ok(m.camZoom > 1.25)
  assert.ok(m.camX < C.MID, 'la caméra se rapproche du lanceur au départ du tir')
  assert.equal(m.superBanner.name, 'COMÈTE FATALE')
})

test('en portrait la caméra reste centrée sur le porteur, même au bord du terrain', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.setView(360)
  const holder = m.holder
  holder.x = 18
  m.ball.x = holder.x
  for (let i = 0; i < 90; i++) m.updateCamera()
  assert.ok(Math.abs(m.camX - holder.x) <= 21, `porteur gauche hors centre : ${m.camX}`)
  holder.x = C.COURT_W - 18
  m.ball.x = holder.x
  for (let i = 0; i < 90; i++) m.updateCamera()
  assert.ok(Math.abs(m.camX - holder.x) <= 21, `porteur droit hors centre : ${m.camX}`)
})

test('le ralenti garde la boucle à 60 Hz sans recalculer le HUD à chaque image', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.slowMo = 12
  let emissions = 0
  m.emitHud = () => emissions++
  for (let i = 0; i < 8; i++) m.update()
  assert.ok(emissions <= 4, `HUD recalculé ${emissions} fois pendant 8 images de ralenti`)
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

test('un premier tap ouvre la jauge; un timing raté lance un tir normal', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  m.press()
  m.release()
  assert.equal(m.holder.state, 'meter')
  assert.equal(m.shotMeter.stage, 1)
  m.press()
  m.release()
  assert.equal(m.shotMeter, null)
  assert.equal(m.holder.throwOpts.sup, undefined)
  for (let i = 0; i < 12; i++) m.update()
  assert.equal(m.ball.state, 'flying')
  assert.equal(m.ball.sup, false)
})

test('le dernier KO continue sa chute, reste dans le terrain et cadre l’impact', () => {
  const m = new Match({ rival: RIVALS[0] })
  m.state = 'play'
  const target = m.alive(1).at(-1)
  for (const p of m.alive(1))
    if (p !== target) {
      p.ko = true
      p.hp = 0
    }
  target.hp = 1
  const thrower = m.players[0]
  m.giveBall(thrower)
  thrower.throwOpts = { target, sup: true }
  m.release_ball(thrower)
  m.ball.x = target.x
  m.ball.y = target.y
  m.hitPlayer(target, m.ball)
  assert.equal(m.state, 'end')
  assert.ok(m.finisher)
  assert.ok(m.impactFocus)
  for (let i = 0; i < 140; i++) m.update()
  assert.equal(target.ko, true)
  assert.equal(target.z, 0)
  assert.equal(target.vz, 0)
  assert.ok(target.x >= 8 && target.x <= C.COURT_W - 8)
  assert.equal(m.impactFocus, null, 'le zoom impact revient au cadrage normal')
})

test('training : pas de KO ni de fin, restauration des vies et équipe choisie', () => {
  const m = new Match({ rival: RIVALS[0], playerTeam: RIVALS[1], training: true })
  m.state = 'play'
  assert.equal(m.players[0].name, RIVALS[1].players[0].name)
  const target = m.players[7],
    thrower = m.players[0]
  target.hp = 1
  thrower.throwOpts = { target, sup: true }
  m.release_ball(thrower)
  m.hitPlayer(target, m.ball)
  assert.equal(target.ko, false)
  assert.equal(target.hp, 1)
  for (let i = 0; i < 800; i++) m.update()
  assert.equal(m.state, 'play')
  assert.equal(m.stats.kos, 0)
})

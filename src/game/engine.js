// Moteur du jeu : simulation à pas fixe (60 images/s) séparée du rendu.
import * as C from './constants.js'
import { LevelBuilder, WORLDS, HERO_KIT } from './levels.js'
import { drawAthlete, drawBall, drawCoin, drawGold, drawHeart, rr } from './sprites.js'
import { SCENES, drawPlatform, drawCrate, drawGoal } from './scenery.js'
import * as audio from './audio.js'

const sfx = typeof window === 'undefined' ? new Proxy({}, { get: () => () => {} }) : audio.sfx
const HALF_W = 7
const BODY_H = 34

export class Game {
  constructor({ def = null, endless = false, onHud = () => {}, onEnd = () => {}, haptics = true, seed = 7 } = {}) {
    this.def = def
    this.endless = endless
    this.onHud = onHud
    this.onEnd = onEnd
    this.haptics = haptics
    this.builder = endless
      ? new LevelBuilder({ seed, diff: 0.1, endless: true })
      : new LevelBuilder({ ...def })
    if (!endless) this.builder.generateUntil(Infinity)
    this.L = this.builder.L
    this.enemies = this.L.enemies.map((e) => this.spawnEnemy(e))
    this.worldIdx = endless ? 0 : def.world
    this.viewW = 480
    this.viewH = C.VIEW_H
    this.t = 0
    this.frame = 0
    this.state = 'intro'
    this.introT = 120
    this.endT = 0
    this.p = {
      x: 80, y: C.GROUND_Y, vy: 0, grounded: true, coyote: 0, buffer: 0, pressed: false, holdJump: false,
      hp: C.HEARTS, inv: 0, ball: null, charge: 0, charged: false, pose: 'idle', actT: 0, act: null,
      bubble: 0, bubbleFrom: 0, flash: 0, dead: false,
    }
    this.balls = []
    this.parts = []
    this.texts = []
    this.score = 0
    this.coins = 0
    this.golds = [false, false, false]
    this.kos = 0
    this.catches = 0
    this.perfects = 0
    this.supers = 0
    this.combo = 1
    this.bestCombo = 1
    this.shake = 0
    this.camX = 0
    this.lastHud = ''
    this.totalEnemies = this.enemies.length
  }

  spawnEnemy(e) {
    return { ...e, state: 'idle', t: 0, steps: 0, vy: 0, rot: 0, vx: 0, flash: 0, facing: -1, shots: 0, z: 0 }
  }

  // --- Entrées : une seule touche -------------------------------------------

  press() {
    const p = this.p
    p.pressed = true
    if (this.state !== 'run' || p.dead || p.bubble > 0) return
    if (p.act === 'catch') return
    if (p.ball) return this.playerThrow()
    const c = this.catchable()
    if (c) return this.catchBall(c.ball, c.ftc)
    p.buffer = 8
  }

  release() {
    this.p.pressed = false
    this.p.holdJump = false
  }

  // balle attrapable : arrive sur le joueur dans [CATCH_MIN, CATCH_MAX] images
  catchable() {
    const p = this.p
    let best = null
    for (const b of this.balls) {
      if (b.owner !== 'enemy' || !b.catchable || b.dead) continue
      const rel = b.vx - C.RUN
      const dist = b.x - b.r - (p.x + HALF_W)
      if (rel >= -0.1) continue
      const ftc = dist / -rel
      if (ftc < C.CATCH_MIN - 1 || ftc > C.CATCH_MAX) continue
      const yAt = b.y + b.vy * Math.max(0, ftc) + 0.5 * (b.g || 0) * Math.max(0, ftc) ** 2
      if (yAt < p.y - BODY_H - 10 || yAt > p.y + 6) continue
      if (!best || ftc < best.ftc) best = { ball: b, ftc }
    }
    return best
  }

  catchBall(b, ftc) {
    const p = this.p
    b.dead = true
    p.ball = 'player'
    p.charge = 0
    p.charged = false
    p.act = 'catch'
    p.actT = 10
    const perfect = Math.abs(ftc - C.CATCH_PERFECT) <= 1
    this.catches++
    if (perfect) {
      this.perfects++
      this.addScore(100, p.x + 10, p.y - 44, 'PARFAIT !', '#fde047')
      sfx.perfect()
      this.burst(p.x + 10, p.y - 18, '#fde047', 14)
      p.charge = C.SUPER_CHARGE - 8 // bonus : la jauge démarre presque pleine
    } else {
      this.addScore(50, p.x + 10, p.y - 44, 'ATTRAPÉ', '#a5f3fc')
      sfx.catch()
    }
    this.vibrate(perfect ? 25 : 15)
  }

  // cible : adversaire devant, dans un cône de 45°, le plus proche
  pickTarget() {
    const p = this.p
    let best = null
    for (const e of this.enemies) {
      if (e.state === 'ko' || e.state === 'gone') continue
      const dx = e.x - p.x
      if (dx < 20 || e.x > this.camX + this.viewW + 30) continue
      const dy = (e.y - 18) - (p.y - 18)
      if (Math.abs(dy) > dx * Math.tan(Math.PI / 4)) continue
      if (!best || dx < best.x - p.x) best = e
    }
    return best
  }

  playerThrow() {
    const p = this.p
    const target = this.pickTarget()
    const sup = p.charged
    let speed = p.grounded ? C.SHOT_RUN : C.SHOT_DIVE
    if (sup) speed *= 1.7
    const hx = p.x + 10
    const hy = p.y - 22
    let vx = speed
    let vy = 0
    if (target) {
      const tx = target.x
      const ty = target.y - 18
      const d = Math.hypot(tx - hx, ty - hy) || 1
      vx = ((tx - hx) / d) * speed
      vy = ((ty - hy) / d) * speed
      if (vx < speed * 0.5) vx = speed * 0.5
    }
    this.balls.push({
      x: hx, y: hy, vx: vx + C.RUN * 0.3, vy, g: 0, r: sup ? 6 : 5, owner: 'player', kind: sup ? 'super' : 'player',
      dmg: sup ? C.SUPER_DAMAGE : C.DAMAGE, pierce: sup, hit: new Set(), age: 0, target,
    })
    p.ball = null
    p.charge = 0
    p.charged = false
    p.act = 'throw'
    p.actT = 12
    if (sup) {
      this.supers++
      sfx.superShot()
      this.shake = 8
      this.vibrate(40)
      this.addText(p.x + 20, p.y - 48, 'SUPER TIR !', '#67e8f9')
    } else sfx.throw()
  }

  // --- Boucle de simulation -------------------------------------------------

  setView(w) {
    this.viewW = w
  }

  update() {
    this.frame++
    this.t += C.DT
    if (this.state === 'intro') {
      this.introT--
      if (this.introT % 40 === 0 && this.introT > 0) sfx.tick()
      if (this.introT <= 0) {
        this.state = 'run'
        sfx.go()
      }
      this.updateCamera()
      this.emitHud()
      return
    }
    if (this.state === 'paused') return
    if (this.endless) {
      this.builder.generateUntil(this.camX + this.viewW + 900)
      while (this.enemies.length < this.L.enemies.length) this.enemies.push(this.spawnEnemy(this.L.enemies[this.enemies.length]))
      if (this.frame % 120 === 0) this.prune()
    }
    this.updatePlayer()
    this.updateEnemies()
    this.updateBalls()
    this.updateItems()
    this.updateFx()
    this.updateCamera()
    if (this.state === 'run' && !this.endless && this.p.x >= this.L.goalX) this.win()
    if (this.state === 'win' || this.state === 'dead') {
      this.endT--
      if (this.endT === 0) this.finish()
    }
    this.emitHud()
  }

  prune() {
    const cut = this.camX - 400
    this.L.grounds = this.L.grounds.filter((g) => g.x1 > cut)
    this.L.platforms = this.L.platforms.filter((g) => g.x + g.w > cut)
    this.L.crates = this.L.crates.filter((g) => g.x + g.w > cut)
    this.L.items = this.L.items.filter((g) => g.x > cut && !g.taken)
    this.L.hints = this.L.hints.filter((g) => g.x > cut - 400)
  }

  // surfaces sous x (sol, plateformes, caisses)
  surfaces(x) {
    const out = []
    for (const g of this.L.grounds) if (x + 5 > g.x0 && x - 5 < g.x1) out.push(g.y)
    for (const pl of this.L.platforms) if (x + 5 > pl.x && x - 5 < pl.x + pl.w) out.push(pl.y)
    for (const c of this.L.crates) if (x + 5 > c.x && x - 5 < c.x + c.w) out.push(c.y - c.h)
    return out
  }

  groundAt(x) {
    let y = null
    for (const g of this.L.grounds) if (x >= g.x0 && x <= g.x1) y = y === null ? g.y : Math.min(y, g.y)
    return y
  }

  updatePlayer() {
    const p = this.p
    if (this.state === 'dead') {
      p.vy += C.GRAVITY * 2
      p.y += p.vy
      return
    }
    if (p.inv > 0) p.inv--
    if (p.flash > 0) p.flash--
    if (p.actT > 0 && --p.actT === 0) p.act = null
    if (p.bubble > 0) {
      p.bubble--
      const g = this.groundAt(p.x) ?? C.GROUND_Y
      p.y = g - (p.bubble / 60) * 70
      if (p.bubble === 0) {
        p.y = g
        p.vy = 0
        p.grounded = true
      }
      return
    }
    const speed = this.state === 'win' ? C.RUN * 0.7 : C.RUN
    let nx = p.x + speed

    // murs (sol plus haut devant) et caisses : saut automatique ou blocage
    for (const g of this.L.grounds) {
      if (g.y < p.y - 2 && nx + HALF_W > g.x0 && p.x + HALF_W <= g.x0 + 1) {
        if (p.grounded && p.y - g.y <= 32) {
          p.vy = -C.JUMP_V * 0.82
          p.grounded = false
          sfx.hop()
        } else if (p.y - BODY_H < g.y + 40 && p.y > g.y + 1) nx = g.x0 - HALF_W
      }
    }
    for (const c of this.L.crates) {
      const top = c.y - c.h
      if (p.y > top + 1 && nx + HALF_W > c.x && p.x - HALF_W < c.x + c.w) {
        if (p.grounded) {
          p.vy = -C.JUMP_V * 0.78
          p.grounded = false
          sfx.hop()
        } else if (p.x + HALF_W <= c.x + 2) nx = c.x - HALF_W
      }
    }
    p.x = nx

    // saut (avec tampon et tolérance de bord)
    if (p.buffer > 0) p.buffer--
    if (p.coyote > 0) p.coyote--
    if (p.buffer > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = -C.JUMP_V
      p.grounded = false
      p.coyote = 0
      p.buffer = 0
      p.holdJump = true
      if (p.charge > 0 && !p.charged) p.charge = 0 // un saut interrompt la course : la jauge repart à zéro
      sfx.jump()
      this.vibrate(8)
    }
    if (!p.grounded) {
      const g = p.vy < 0 && !(p.holdJump && p.pressed) ? C.LOW_JUMP_GRAVITY : C.GRAVITY
      p.vy = Math.min(C.MAX_FALL, p.vy + g)
    }
    const prevY = p.y
    p.y += p.vy
    if (p.vy >= 0) {
      let land = null
      for (const sy of this.surfaces(p.x)) if (prevY <= sy + 0.5 && p.y >= sy && (land === null || sy < land)) land = sy
      if (land !== null) {
        p.y = land
        p.vy = 0
        if (!p.grounded) this.dust(p.x, p.y)
        p.grounded = true
      } else if (p.grounded) {
        const under = this.surfaces(p.x).some((sy) => Math.abs(sy - p.y) < 1)
        if (!under) {
          p.grounded = false
          p.coyote = 6
        }
      }
    }
    // jauge du super tir : balle en main, au sol, en course
    if (p.ball && p.grounded && this.state === 'run') {
      p.charge++
      if (!p.charged && p.charge >= C.SUPER_CHARGE) {
        p.charged = true
        sfx.charged()
        this.addText(p.x, p.y - 50, 'SUPER PRÊT', '#67e8f9')
        this.vibrate(20)
      }
    }
    // chute dans un trou
    if (p.y > C.VIEW_H + 120) this.fallPit()
    // pose
    p.pose = p.act === 'catch' ? 'catch' : p.act === 'throw' ? 'throw' : !p.grounded ? (p.vy < 0 ? 'jump' : 'fall') : p.ball ? 'hold' : 'run'
    if (this.state === 'win') p.pose = 'cheer'
  }

  fallPit() {
    const p = this.p
    sfx.fall()
    this.hurt(true)
    if (this.state === 'dead') return
    const next = this.L.grounds.find((g) => g.x0 > p.x - 60 && g.x1 - g.x0 > 60) || this.L.grounds.at(-1)
    p.x = Math.max(next.x0 + 20, p.x)
    p.bubble = 60
    p.vy = 0
  }

  hurt(fromPit = false) {
    const p = this.p
    if (!fromPit && p.inv > 0) return
    p.hp--
    p.inv = C.INVULN
    p.flash = 20
    this.combo = 1
    this.shake = 10
    this.vibrate(60)
    if (p.ball) {
      this.balls.push(this.looseBall(p.x, p.y - 22, -1))
      p.ball = null
    }
    p.charge = 0
    p.charged = false
    if (!fromPit) sfx.hurt()
    this.addText(p.x, p.y - 46, '-1', '#fb7185')
    if (p.hp <= 0) this.die()
  }

  die() {
    const p = this.p
    p.dead = true
    p.vy = -6
    p.pose = 'ko'
    this.state = 'dead'
    this.endT = 100
    sfx.lose()
  }

  win() {
    this.state = 'win'
    this.endT = 120
    sfx.win()
    this.vibrate(50)
    for (let i = 0; i < 40; i++) this.confetti(this.p.x + Math.random() * 200 - 40, this.p.y - 120)
  }

  finish() {
    const bonus = this.state === 'win' ? this.p.hp * 300 : 0
    this.score += bonus
    this.onEnd({
      win: this.state === 'win', score: this.score, bonus, coins: this.coins, golds: [...this.golds], kos: this.kos,
      total: this.totalEnemies, catches: this.catches, perfects: this.perfects, supers: this.supers,
      bestCombo: this.bestCombo, hearts: Math.max(0, this.p.hp), distance: Math.round(this.p.x / 16),
      captain: this.enemies.some((e) => e.captain && e.state === 'ko'),
    })
  }

  // --- Adversaires (IA : 2 ou 3 pas d'élan puis tir) --------------------------

  updateEnemies() {
    const p = this.p
    for (const e of this.enemies) {
      if (e.flash > 0) e.flash--
      if (e.state === 'gone') continue
      if (e.state === 'ko') {
        e.vy += C.GRAVITY * 2
        e.y += e.vy
        e.x += e.vx
        e.rot += 0.3
        if (e.y > C.VIEW_H + 200) e.state = 'gone'
        continue
      }
      const dx = e.x - p.x
      const onScreen = e.x < this.camX + this.viewW - 10
      // capitaine : recule pour garder ses distances
      if (e.captain && e.retreatTo && dx < 300 && e.x < e.retreatTo && this.state === 'run') {
        e.x = Math.min(e.retreatTo, Math.max(e.x, p.x + 300))
        e.y = this.groundAt(e.x) ?? e.y
      }
      if (dx < 20 && !e.captain) {
        if (e.state !== 'passed') {
          e.state = 'passed'
          e.facing = 1
        }
        continue
      }
      if (this.state !== 'run' || p.dead) continue
      switch (e.state) {
        case 'idle':
          if (onScreen && dx < 440 && dx > 150 && e.shots < e.throws) {
            if (e.type === 'coureur' || (e.type === 'capitaine' && e.shots % 3 === 2)) {
              e.state = 'charge'
              e.t = C.SUPER_CHARGE
            } else if (e.perch) {
              e.state = 'windup'
              e.t = e.windup
              sfx.windup()
            } else {
              e.state = 'approach'
              e.steps = C.AI_STEPS[Math.floor(Math.random() * C.AI_STEPS.length)]
              e.t = C.AI_STEP_FRAMES
            }
          }
          break
        case 'approach': // un pas toutes les AI_STEP_FRAMES images
          e.x -= 0.9
          if (--e.t <= 0) {
            e.steps--
            e.t = C.AI_STEP_FRAMES
            if (e.steps <= 0) {
              e.state = 'windup'
              e.t = e.windup
              sfx.windup()
            }
          }
          break
        case 'charge': // élan de course : SUPER_CHARGE images puis super tir
          e.x -= C.RUN * 0.8
          e.y = this.groundAt(e.x) ?? e.y
          if (--e.t <= 0) {
            this.enemyThrow(e, 'fire')
            e.state = 'cool'
            e.t = e.cool
          }
          break
        case 'windup':
          if (--e.t <= 0) {
            this.enemyThrow(e)
            e.state = 'cool'
            e.t = e.cool
          }
          break
        case 'cool':
          if (--e.t <= 0) e.state = 'idle'
          break
      }
      // piétinement et saut automatique par-dessus un adversaire
      const over = Math.abs(p.x - e.x) < 12
      if (over && !p.grounded && p.vy > 0 && p.y > e.y - BODY_H - 6 && p.y < e.y - BODY_H + 10) {
        this.knockOut(e, 'stomp')
        p.vy = -C.JUMP_V * 0.9
        p.holdJump = p.pressed
        sfx.stomp()
        this.addScore(150, e.x, e.y - 50, 'BOING !', '#fde047')
      } else if (p.grounded && dx > 0 && dx < 18 && Math.abs(e.y - p.y) < 8 && !e.perch) {
        p.vy = -C.JUMP_V * 0.95
        p.grounded = false
        sfx.hop()
      }
    }
  }

  enemyThrow(e, force) {
    const p = this.p
    const type = force ?? (e.type === 'capitaine' ? (e.shots % 3 === 1 ? 'lob' : 'straight') : { lanceur: 'straight', lobeur: 'lob', rouleur: 'roll', coureur: 'fire' }[e.type])
    e.shots++
    const hx = e.x - 9
    const hy = e.y - 24
    const bonus = 1 + this.builderDiff() * 0.25
    const ty = (this.groundAt(p.x + 60) ?? p.y) - 18
    let b
    if (type === 'straight' || type === 'fire') {
      const speed = C.SHOT_AI * bonus * (type === 'fire' ? 1.5 : 1)
      const t = Math.max(8, (hx - (p.x + HALF_W)) / (speed + C.RUN))
      b = { vx: -speed, vy: (ty - hy) / t, g: 0, kind: type === 'fire' ? 'fire' : 'enemy', catchable: type !== 'fire' }
    } else if (type === 'lob') {
      const t = 54
      const landX = p.x + HALF_W + C.RUN * t
      b = { vx: (landX - hx) / t, vy: (ty - hy - 0.5 * C.LOB_GRAVITY * t * t) / t, g: C.LOB_GRAVITY, kind: 'enemy', catchable: true }
    } else {
      b = { vx: -C.SHOT_AI * 0.85 * bonus, vy: 0, g: 0, kind: 'roll', catchable: false, roll: true }
    }
    this.balls.push({ x: hx, y: type === 'roll' ? e.y - 5 : hy, r: type === 'fire' ? 6 : 5, owner: 'enemy', age: 0, ...b })
    if (type === 'fire') {
      sfx.superShot()
      this.addText(e.x, e.y - 50, 'SUPER TIR', '#fb923c')
    } else sfx.throw()
  }

  builderDiff() {
    return this.endless ? this.builder.diff : this.def.diff
  }

  knockOut(e, how) {
    e.state = 'ko'
    e.vy = -5
    e.vx = 3
    this.kos++
    const pts = 200 * this.combo
    this.addScore(pts, e.x, e.y - 40, `KO ×${this.combo}`, '#fca5a5')
    this.combo = Math.min(9, this.combo + 1)
    this.bestCombo = Math.max(this.bestCombo, this.combo - 1)
    sfx.ko()
    this.burst(e.x, e.y - 18, '#fde047', 18)
    this.shake = Math.max(this.shake, 6)
    if (e.captain) this.addText(e.x, e.y - 64, 'CAPITAINE KO !', '#fde047')
  }

  // --- Balles -----------------------------------------------------------------

  looseBall(x, y, dir) {
    return { x, y, vx: C.BOUNCE_VX * dir, vy: -C.BOUNCE_VZ, g: C.BOUNCE_GRAVITY, r: 5, owner: 'loose', kind: 'loose', age: 0, bounces: 0 }
  }

  updateBalls() {
    const p = this.p
    for (const b of this.balls) {
      if (b.dead) continue
      b.age++
      b.vy += b.g || 0
      b.x += b.vx
      b.y += b.vy
      b.spin = (b.spin || 0) + b.vx * 0.15
      if (b.roll) {
        const g = this.groundAt(b.x)
        if (g === null) b.roll = false, b.g = C.GRAVITY
        else b.y = g - 5
      }
      if (b.kind === 'fire' || b.kind === 'super') if (b.age % 2 === 0) this.trail(b)
      // balle perdue : rebonds au sol (vitesse horizontale ÷ 4 à chaque rebond), puis ramassage
      if (b.owner === 'loose') {
        const g = this.groundAt(b.x)
        if (g !== null && b.y >= g - 5 && b.vy > 0) {
          b.y = g - 5
          b.vy = b.bounces < 2 ? -2.0 * C.S / (b.bounces + 1) : 0
          b.vx /= 4
          b.bounces++
          if (b.bounces > 2) b.g = 0
        }
        if (!p.ball && !p.dead && Math.abs(b.x - p.x) < 14 && b.y > p.y - BODY_H - 6 && b.y < p.y + 4) {
          b.dead = true
          p.ball = 'player'
          p.charge = 0
          sfx.catch()
          this.addText(p.x, p.y - 44, 'RAMASSÉE', '#fef3c7')
        }
      }
      if (b.owner === 'enemy' && !p.dead && p.bubble === 0) {
        if (Math.abs(b.x - p.x) < HALF_W + b.r && b.y > p.y - BODY_H - b.r && b.y < p.y + b.r) {
          if (p.inv <= 0) {
            b.dead = true
            this.hurt()
            this.balls.push(this.looseBall(b.x, b.y, 1))
          }
        }
      }
      if (b.owner === 'player') {
        for (const e of this.enemies) {
          if (e.state === 'ko' || e.state === 'gone' || b.hit.has(e)) continue
          if (Math.abs(b.x - e.x) < 10 + b.r && b.y > e.y - BODY_H - b.r && b.y < e.y + b.r) {
            b.hit.add(e)
            e.hp -= b.dmg
            e.flash = 12
            sfx.hitEnemy()
            this.burst(b.x, b.y, b.kind === 'super' ? '#67e8f9' : '#fef3c7', 8)
            if (e.hp <= 0) this.knockOut(e, b.kind)
            else this.addScore(50, e.x, e.y - 44, `${Math.max(0, e.hp)}/${e.maxHp}`, '#fecaca')
            if (!b.pierce) {
              b.dead = true
              this.balls.push(this.looseBall(b.x, b.y, -1))
            }
          }
        }
      }
      if (b.x < this.camX - 80 || b.x > this.camX + this.viewW + 160 || b.y > C.VIEW_H + 80 || b.age > 600) b.dead = true
    }
    this.balls = this.balls.filter((b) => !b.dead)
  }

  // --- Objets, effets ---------------------------------------------------------

  updateItems() {
    const p = this.p
    for (const it of this.L.items) {
      if (it.taken) continue
      const r = it.kind === 'coin' ? 12 : 16
      if (Math.abs(it.x - p.x) < r && it.y > p.y - BODY_H - r && it.y < p.y + r) {
        it.taken = true
        if (it.kind === 'coin') {
          this.coins++
          this.score += 10
          sfx.coin()
        } else if (it.kind === 'gold') {
          this.golds[it.i] = true
          this.addScore(500, it.x, it.y - 20, 'BALLE D’OR', '#fde047')
          sfx.gold()
          this.burst(it.x, it.y, '#fde047', 20)
        } else if (it.kind === 'heart') {
          if (p.hp < C.HEARTS) p.hp++
          else this.score += 300
          sfx.heart()
        }
      }
    }
  }

  addScore(n, x, y, text, color) {
    this.score += n
    if (text) this.addText(x, y, text, color)
  }

  addText(x, y, text, color = '#fff') {
    // décale vers le haut tant qu'un texte récent occupe déjà la place
    let ty = y
    for (let k = 0; k < 6 && this.texts.some((o) => Math.abs(o.x - x) < 60 && Math.abs(o.y - ty) < 12); k++) ty -= 13
    this.texts.push({ x, y: ty, text, color, t: 50 })
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 1 + Math.random() * 3
      this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 30, color, size: 2 + Math.random() * 2 })
    }
  }

  trail(b) {
    this.parts.push({ x: b.x, y: b.y, vx: -b.vx * 0.1, vy: -0.3, life: 16, color: b.kind === 'fire' ? '#fb923c' : '#67e8f9', size: 4 })
  }

  dust(x, y) {
    for (let i = 0; i < 5; i++) this.parts.push({ x, y, vx: -Math.random() * 1.5, vy: -Math.random(), life: 18, color: 'rgba(255,255,255,0.7)', size: 2 })
  }

  confetti(x, y) {
    const cols = ['#f43f5e', '#facc15', '#22d3ee', '#a3e635', '#c084fc']
    this.parts.push({ x, y, vx: Math.random() * 2 - 1, vy: Math.random() * 2, life: 120, color: cols[Math.floor(Math.random() * 5)], size: 3, conf: true })
  }

  updateFx() {
    for (const q of this.parts) {
      q.x += q.vx
      q.y += q.vy
      q.vy += q.conf ? 0.03 : 0.12
      q.life--
    }
    this.parts = this.parts.filter((q) => q.life > 0)
    for (const tx of this.texts) {
      tx.y -= 0.6
      tx.t--
    }
    this.texts = this.texts.filter((tx) => tx.t > 0)
    if (this.shake > 0) this.shake--
  }

  updateCamera() {
    this.camX = this.p.x - this.viewW * C.PLAYER_SCREEN_X
    if (this.endless) {
      const w = this.builder.endless ? Math.floor((this.p.x + this.viewW / 2) / 7000) % WORLDS.length : this.worldIdx
      if (w !== this.worldIdx) this.worldIdx = w
    }
  }

  vibrate(ms) {
    if (this.haptics && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
  }

  emitHud() {
    const p = this.p
    const goal = this.endless ? 0 : Math.min(1, p.x / this.L.goalX)
    const hud = {
      hp: Math.max(0, p.hp), score: this.score, coins: this.coins, golds: this.golds, ball: !!p.ball,
      charge: p.ball ? Math.min(1, p.charge / C.SUPER_CHARGE) : 0, charged: p.charged, combo: this.combo,
      progress: goal, distance: Math.round(p.x / 16), state: this.state, intro: Math.ceil(this.introT / 40),
    }
    const key = JSON.stringify(hud)
    if (key !== this.lastHud) {
      this.lastHud = key
      this.onHud(hud)
    }
  }

  // --- Rendu ------------------------------------------------------------------

  draw(ctx, scale, dpr, viewH) {
    const world = WORLDS[this.worldIdx].id
    const scene = SCENES[world]
    const offY = (viewH - C.VIEW_H) * 0.6
    const top = -offY
    const bottom = viewH - offY
    const sh = this.shake ? (Math.random() - 0.5) * this.shake : 0
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    ctx.translate(0, offY + sh)
    scene.bg(ctx, this.camX, this.viewW, top, bottom, this.t)
    ctx.translate(-this.camX, 0)
    const x0 = this.camX - 40
    const x1 = this.camX + this.viewW + 40
    // trous : fosse sombre entre deux sols
    ctx.fillStyle = scene.pit
    for (let i = 1; i < this.L.grounds.length; i++) {
      const a = this.L.grounds[i - 1]
      const b = this.L.grounds[i]
      if (b.x0 > a.x1 && b.x0 > x0 && a.x1 < x1) ctx.fillRect(a.x1, Math.min(a.y, b.y) + 6, b.x0 - a.x1, bottom)
    }
    for (const g of this.L.grounds) {
      if (g.x1 < x0 || g.x0 > x1) continue
      SCENES[WORLDS[g.w ?? this.worldIdx].id].ground(ctx, Math.max(g.x0, x0), Math.min(g.x1, x1), g.y, bottom)
    }
    for (const pl of this.L.platforms) if (pl.x + pl.w > x0 && pl.x < x1) drawPlatform(ctx, pl, world)
    for (const c of this.L.crates) if (c.x + c.w > x0 && c.x < x1) drawCrate(ctx, c, world)
    if (!this.endless && this.L.goalX > x0 - 60 && this.L.goalX < x1 + 60) drawGoal(ctx, this.L.goalX, this.groundAt(this.L.goalX) ?? C.GROUND_Y, this.t)
    for (const hnt of this.L.hints) if (hnt.x > x0 - 300 && hnt.x < x1) this.drawHint(ctx, hnt)
    for (const it of this.L.items) {
      if (it.taken || it.x < x0 || it.x > x1) continue
      if (it.kind === 'coin') drawCoin(ctx, it.x, it.y, this.t)
      else if (it.kind === 'gold') drawGold(ctx, it.x, it.y, this.t)
      else drawHeart(ctx, it.x, it.y, this.t)
    }
    for (const e of this.enemies) {
      if (e.state === 'gone' || e.x < x0 - 40 || e.x > x1 + 40) continue
      const kit = WORLDS[e.w ?? this.worldIdx].team
      const pose = e.state === 'ko' ? 'ko' : e.state === 'windup' ? 'windup' : e.state === 'approach' ? 'walk' : e.state === 'charge' ? 'run' : e.state === 'cool' ? 'throw' : e.state === 'passed' ? 'taunt' : 'idle'
      const ball = e.state === 'windup' || e.state === 'approach' || e.state === 'idle' || e.state === 'charge' ? (e.state === 'charge' ? 'fire' : 'enemy') : null
      drawAthlete(ctx, {
        x: e.x, y: e.y, facing: e.facing, pose, t: this.t + e.x * 0.01, kit, rot: e.state === 'ko' ? e.rot : 0,
        ball: e.shots < e.throws ? ball : null, size: e.captain ? 1.25 : e.maxHp > 2 ? 1.1 : 1, flash: e.flash > 0 && e.flash % 4 < 2,
        glow: e.state === 'charge' ? '#fb923c' : null,
      })
      if (e.state !== 'ko' && e.state !== 'passed' && e.maxHp > 2) this.drawHpBar(ctx, e)
      if (e.state === 'windup' || e.state === 'charge') {
        ctx.fillStyle = e.state === 'charge' ? '#fb923c' : '#facc15'
        ctx.font = 'bold 12px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('!', e.x, e.y - (e.captain ? 58 : 48))
      }
    }
    const p = this.p
    if (p.bubble > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'
      ctx.fillStyle = 'rgba(186,230,253,0.35)'
      ctx.beginPath()
      ctx.arc(p.x, p.y - 18, 24, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    if (!(p.inv > 0 && Math.floor(p.inv / 4) % 2 && !p.dead)) {
      drawAthlete(ctx, {
        x: p.x, y: p.y, facing: 1, pose: p.dead ? 'ko' : p.pose, t: this.t, kit: HERO_KIT, ball: p.ball ? (p.charged ? 'super' : 'player') : null,
        flash: p.flash > 0 && p.flash % 4 < 2, glow: p.charged ? '#22d3ee' : null, rot: p.dead ? this.t * 6 : 0,
      })
    }
    if (p.ball && !p.charged && this.state === 'run') {
      const f = Math.min(1, p.charge / C.SUPER_CHARGE)
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(p.x, p.y - 48, 6, 0, Math.PI * 2)
      ctx.stroke()
      ctx.strokeStyle = '#22d3ee'
      ctx.beginPath()
      ctx.arc(p.x, p.y - 48, 6, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2)
      ctx.stroke()
    }
    for (const b of this.balls) drawBall(ctx, b)
    for (const q of this.parts) {
      ctx.globalAlpha = Math.min(1, q.life / 15)
      ctx.fillStyle = q.color
      ctx.fillRect(q.x - q.size / 2, q.y - q.size / 2, q.size, q.size)
    }
    ctx.globalAlpha = 1
    ctx.textAlign = 'center'
    for (const tx of this.texts) {
      ctx.globalAlpha = Math.min(1, tx.t / 15)
      ctx.font = '900 11px system-ui, sans-serif'
      ctx.lineWidth = 3
      ctx.strokeStyle = '#1b1530'
      ctx.strokeText(tx.text, tx.x, tx.y)
      ctx.fillStyle = tx.color
      ctx.fillText(tx.text, tx.x, tx.y)
    }
    ctx.globalAlpha = 1
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
    if (this.state === 'intro') {
      const n = Math.ceil(this.introT / 40)
      ctx.font = '900 46px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.lineWidth = 6
      ctx.strokeStyle = '#1b1530'
      ctx.fillStyle = '#fde047'
      const txt = n > 0 ? String(n) : 'GO !'
      ctx.strokeText(txt, this.viewW / 2, viewH / 2)
      ctx.fillText(txt, this.viewW / 2, viewH / 2)
    }
    if (p.hp === 1 && this.state === 'run') {
      const g = ctx.createRadialGradient(this.viewW / 2, viewH / 2, viewH * 0.3, this.viewW / 2, viewH / 2, viewH)
      g.addColorStop(0, 'rgba(244,63,94,0)')
      g.addColorStop(1, `rgba(244,63,94,${0.18 + Math.sin(this.t * 6) * 0.06})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, this.viewW, viewH)
    }
  }

  drawHpBar(ctx, e) {
    const w = 22
    const y = e.y - (e.captain ? 54 : 46)
    ctx.fillStyle = '#1b1530'
    rr(ctx, e.x - w / 2 - 1, y - 1, w + 2, 5, 2)
    ctx.fill()
    ctx.fillStyle = '#f43f5e'
    ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 3)
  }

  drawHint(ctx, h) {
    ctx.font = '700 11px system-ui, sans-serif'
    const lines = wrap(ctx, h.text, 190)
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 18
    const hh = lines.length * 14 + 10
    const x = h.x
    const y = 44
    ctx.fillStyle = 'rgba(27,21,48,0.85)'
    rr(ctx, x, y, w, hh, 8)
    ctx.fill()
    ctx.fillStyle = '#fef9c3'
    ctx.textAlign = 'left'
    lines.forEach((l, i) => ctx.fillText(l, x + 9, y + 18 + i * 14))
  }
}

function wrap(ctx, text, max) {
  const words = text.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const t = cur ? cur + ' ' + w : w
    if (ctx.measureText(t).width > max && cur) {
      lines.push(cur)
      cur = w
    } else cur = t
  }
  if (cur) lines.push(cur)
  return lines
}

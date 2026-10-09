// Moteur de match : simulation à pas fixe (60 images/s), séparée du rendu.
import * as C from './constants.js'
import { PLAYER_TEAM, rosterKit } from './teams.js'
import * as audio from './audio.js'

const sfx = typeof window === 'undefined' ? new Proxy({}, { get: () => () => {} }) : audio.sfx
const BODY_H = 34
const IN_LO = [C.INFIELD_MARGIN, C.MID + C.MIDLINE_GAP]
const IN_HI = [C.MID - C.MIDLINE_GAP, C.COURT_W - C.INFIELD_MARGIN]

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Positions de départ : 4 intérieurs dans sa moitié, 3 extérieurs autour de la moitié adverse
const FORMATION = [
  [0.62, 0.5],
  [0.3, 0.2],
  [0.3, 0.8],
  [0.12, 0.5],
]

export class Match {
  constructor({
    rival,
    seed = 1,
    onHud = () => {},
    onEnd = () => {},
    haptics = true,
    reducedMotion = false,
    auto = false,
    training = false,
    playerTeam = PLAYER_TEAM,
  }) {
    this.rand = rng(seed)
    this.rival = rival
    this.level = rival.level
    this.onHud = onHud
    this.onEnd = onEnd
    this.reducedMotion = reducedMotion
    this.haptics = haptics
    this.auto = auto // vrai : l'équipe du joueur est aussi pilotée par l'IA (tests, démo)
    this.training = training
    this.teams = [playerTeam, rival]
    this.players = []
    for (let t = 0; t < 2; t++) for (let i = 0; i < 7; i++) this.players.push(this.makePlayer(t, i))
    this.ball = {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      g: 0,
      state: 'held',
      holder: null,
      age: 0,
      hit: new Set(),
      trail: [],
    }
    this.giveBall(this.players[0])
    this.playFrames = 0
    this.frame = 0
    this.state = 'intro'
    this.introT = 150
    this.endT = 0
    this.winner = null
    this.input = { pressed: false, pressFrame: 0, pendingJump: false, threatAtPress: false, meterTap: null }
    this.texts = []
    this.parts = []
    this.shake = 0
    this.armed = [null, null] // passe spéciale armée par équipe : { special, t }
    this.stats = { catches: 0, perfects: 0, supers: 0, hits: 0, kos: 0, taken: 0, passes: 0 }
    this.camX = C.MID
    this.camZoom = 1.14
    this.viewW = 480
    this.superBanner = null
    this.shotMeter = null
    this.slowMo = 0
    this.impactFocus = null
    this.finisher = null
    this.lastHud = ''
    this.hint = 'Maintenez pour courir, relâchez pour tirer'
    this.hintT = 400
  }

  makePlayer(team, i) {
    const td = this.teams[team]
    const pd = td.players[i]
    const role = i < 4 ? 'in' : 'out'
    const p = {
      id: team * 7 + i,
      team,
      idx: i,
      role,
      name: pd.name,
      kit: rosterKit(td, i),
      stats: pd.stats,
      special: pd.special,
      x: 0,
      y: 0,
      z: 0,
      vz: 0,
      kx: 0,
      hp: pd.stats.hp,
      maxHp: pd.stats.hp,
      state: 'idle',
      t: 0,
      facing: team === 0 ? 1 : -1,
      ko: false,
      flash: 0,
      charge: 0,
      meterBonus: false,
      anim: this.randSafe() * 10,
      line: null,
      home: { x: 0, y: 0 },
      decided: null,
      goalX: 0,
      goalY: 0,
    }
    if (role === 'in') {
      const [fx, fy] = FORMATION[i]
      p.home.x = team === 0 ? IN_LO[0] + (IN_HI[0] - IN_LO[0]) * fx : IN_HI[1] - (IN_HI[1] - IN_LO[1]) * fx
      p.home.y = C.DEPTH * fy
    } else {
      p.line = ['back', 'top', 'bottom'][i - 4]
      const far = team === 0 ? C.COURT_W + 14 : -14
      const sideX = team === 0 ? C.MID + 110 : C.MID - 110
      p.home =
        p.line === 'back'
          ? { x: far, y: C.DEPTH / 2 }
          : { x: sideX, y: p.line === 'top' ? -18 : C.DEPTH + 16 }
      p.facing = team === 0 ? -1 : 1
    }
    p.x = p.home.x
    p.y = p.home.y
    p.goalX = p.x
    p.goalY = p.y
    return p
  }

  randSafe() {
    return this.rand ? this.rand() : Math.random()
  }

  // --- Utilitaires ---------------------------------------------------------------

  alive(team) {
    return this.players.filter((p) => p.team === team && p.role === 'in' && !p.ko)
  }

  get holder() {
    return this.ball.state === 'held' ? this.ball.holder : null
  }

  // joueur piloté par le doigt : le porteur de balle de l'équipe, sinon le joueur visé
  get controlled() {
    if (this.auto) return null
    const h = this.holder
    if (h && h.team === 0) return h
    const b = this.ball
    if (b.state === 'flying' && b.team === 1 && b.kind === 'shot') {
      // le joueur que la balle va toucher en premier (pas forcément la cible annoncée)
      let best = null
      for (const p of this.alive(0)) {
        const f = this.framesToContact(p)
        if (f !== null && (!best || f < best.f)) best = { p, f }
      }
      if (best) return best.p
      if (b.target && b.target.team === 0 && !b.target.ko) return b.target
    }
    const mine = this.alive(0)
    if (!mine.length) return null
    return mine.reduce((a, p) =>
      Math.hypot(p.x - b.x, p.y - b.y) < Math.hypot(a.x - b.x, a.y - b.y) ? p : a,
    )
  }

  setView(w) {
    this.viewW = w
  }

  giveBall(p) {
    const b = this.ball
    b.state = 'held'
    b.holder = p
    b.kind = null
    b.special = null
    b.sup = false
    b.target = null
    b.vx = b.vy = b.vz = 0
    b.hit = new Set()
    b.trail = []
    p.state = 'hold'
    p.t = 0
    p.charge = 0
    p.readyCharge = 0
    p.decided = null
    this.updateHeld()
  }

  updateHeld() {
    const b = this.ball
    const p = b.holder
    if (b.state !== 'held' || !p) return
    b.x = p.x + p.facing * 7
    b.y = p.y + 1
    b.z = p.z + 18
  }

  // cible : adversaire intérieur dans un cône de 45° (puis 90°) devant le lanceur, le plus proche
  pickTarget(p) {
    const foes = this.alive(1 - p.team)
    if (!foes.length) return null
    // direction de visée : vers le centre de la moitié adverse
    const cx = p.team === 0 ? (C.MID + C.COURT_W) / 2 : C.MID / 2
    const dir = Math.atan2(C.DEPTH / 2 - p.y, cx - p.x)
    for (const cone of [C.CONE, C.CONE_WIDE, Math.PI]) {
      let best = null
      for (const f of foes) {
        const a = Math.atan2(f.y - p.y, f.x - p.x)
        let da = Math.abs(a - dir)
        if (da > Math.PI) da = 2 * Math.PI - da
        if (da > cone) continue
        const d = Math.hypot(f.x - p.x, f.y - p.y)
        if (!best || d < best.d) best = { f, d }
      }
      if (best) return best.f
    }
    return foes[0]
  }

  // --- Entrées : un seul doigt ------------------------------------------------------

  press() {
    if (this.state !== 'play') return
    const inp = this.input
    if (inp.pressed) return
    inp.pressed = true
    inp.pressFrame = this.frame
    inp.pendingJump = false
    if (this.state !== 'play') return
    const c = this.controlled
    if (!c || c.ko) return
    const h = this.holder
    if (h === c) {
      if (this.shotMeter) {
        inp.meterTap = 'confirm'
        this.confirmShotMeter()
      } else if (c.state === 'hold') {
        inp.meterTap = 'start'
        this.startShotMeter(c)
      }
      return
    }
    if (['hit', 'ko', 'whiff', 'catch'].includes(c.state)) return
    const ftc = this.framesToContact(c)
    if (ftc !== null && ftc >= C.CATCH_MIN - 0.5 && ftc <= C.CATCH_MAX + 0.5) {
      const b = this.ball
      const perfect = Math.abs(ftc - C.CATCH_PERFECT) <= 0.5
      if (!b.sup || perfect) return this.catchBall(c, perfect)
    }
    inp.pendingJump = true
    inp.threatAtPress = ftc !== null && ftc < 40
  }

  release() {
    const inp = this.input
    if (!inp.pressed) return
    inp.pressed = false
    if (this.state !== 'play') return
    const c = this.controlled
    if (!c) return
    if (this.holder === c && this.shotMeter) {
      inp.meterTap = null
      return
    }
    if (
      inp.pendingJump &&
      this.frame - inp.pressFrame < C.HOLD_TO_JUMP &&
      inp.threatAtPress &&
      c.z === 0 &&
      c.state !== 'jump'
    ) {
      // rattrapage tenté trop tôt : le joueur reste exposé un instant
      c.state = 'whiff'
      c.t = C.WHIFF
      this.addText(c, 'TROP TÔT', '#fca5a5')
    }
    inp.pendingJump = false
    inp.meterTap = null
  }

  // Cancellation (lost pointer, blur, pause) never fires a pitch.
  cancelInput() {
    this.input.pressed = false
    this.input.pendingJump = false
    this.input.threatAtPress = false
    this.input.meterTap = null
    this.shotMeter = null
    const h = this.holder
    if (h && h.team === 0 && ['dash', 'meter'].includes(h.state)) {
      h.state = 'hold'
      h.charge = 0
      h.glow = false
    }
  }

  // glissement vers le haut pendant l'appui : passe
  swipeUp() {
    if (this.state !== 'play') return
    const c = this.controlled
    if (!c || this.holder !== c || c.state !== 'hold' || this.shotMeter) return
    this.input.pressed = false
    this.pass(c)
  }

  // Une touche dédiée : le porteur saute et lance automatiquement au sommet.
  jumpShot() {
    if (this.state !== 'play') return false
    const p = this.holder
    if (!p || p.team !== 0 || p.ko || p.state !== 'hold' || this.shotMeter) return false
    p.airShot = { sup: false, running: true }
    this.input.pressed = false
    this.input.pendingJump = false
    this.jump(p)
    this.addText(p, 'JUMP SHOT !', '#ffffff')
    return true
  }

  framesToContact(p) {
    const b = this.ball
    if (b.state !== 'flying' || b.team === p.team || b.kind === 'pass') return null
    const dx = p.x - b.x
    const dy = p.y - b.y
    const vx = b.vx
    const vy = b.vy
    const sp2 = vx * vx + vy * vy
    if (sp2 < 0.01) return null
    const t = (dx * vx + dy * vy) / sp2
    if (t < -1) return null
    const cx = b.x + vx * t - p.x
    const cy = b.y + vy * t - p.y
    if (Math.hypot(cx, cy * 1.4) > 14) return null
    // distance au bord du corps
    return Math.max(0, t - 8 / Math.sqrt(sp2))
  }

  // --- Actions -----------------------------------------------------------------------

  catchBall(p, perfect) {
    const b = this.ball
    this.giveBall(p)
    // La touche de réception est entièrement consommée. Elle ne peut jamais
    // devenir le premier appui d'un lancer quand l'animation se termine.
    this.input.pressed = false
    this.input.pendingJump = false
    this.input.meterTap = null
    p.state = 'catch'
    p.t = 12
    if (p.team === 0) {
      this.stats.catches++
      if (perfect) {
        this.stats.perfects++
        p.meterBonus = true
        this.addText(p, 'PARFAIT !', '#fde047')
        sfx.perfect()
        this.vibrate(25)
      } else {
        this.addText(p, 'ATTRAPÉ', '#a5f3fc')
        sfx.catch()
        this.vibrate(15)
      }
    } else {
      this.addText(p, 'ATTRAPÉ', '#fecaca')
      sfx.catch()
    }
    this.burst(b.x, b.y, b.z, perfect ? '#fde047' : '#fff', perfect ? 14 : 6)
  }

  startShotMeter(p) {
    p.state = 'meter'
    this.shotMeter = {
      player: p,
      stage: 1,
      value: 0,
      age: 0,
      bonus: !!p.meterBonus,
    }
    p.meterBonus = false
    this.addText(p, 'TIMING !', '#f9d57c')
  }

  meterWindow(meter = this.shotMeter) {
    if (!meter) return { start: 0, end: 0 }
    const width = C.METER_ZONE[meter.stage - 1] + (meter.bonus ? 0.07 : 0)
    return { start: 0.5 - width / 2, end: 0.5 + width / 2 }
  }

  confirmShotMeter() {
    const meter = this.shotMeter
    if (!meter) return false
    const { start, end } = this.meterWindow(meter)
    const success = meter.value >= start && meter.value <= end
    const p = meter.player
    if (!success) {
      this.addText(p, meter.stage === 1 ? 'NORMAL' : 'BON TIR', '#f5f0d9')
      this.shotMeter = null
      this.startThrow(p, { running: meter.stage > 1 })
      return false
    }
    this.vibrate(12 + meter.stage * 5)
    sfx.charged()
    if (meter.stage >= 3) {
      this.addText(p, 'PERFECT ×3', '#fde047')
      this.shotMeter = null
      this.startThrow(p, { sup: true, running: true, finisher: true })
      return true
    }
    this.addText(p, meter.stage === 1 ? 'GOOD !' : 'GREAT !', '#67e8f9')
    meter.stage++
    meter.value = 0
    meter.age = 0
    return true
  }

  updateShotMeter() {
    const meter = this.shotMeter
    if (!meter) return
    meter.age++
    meter.value += C.METER_SPEED[meter.stage - 1]
    if (meter.value > 1) meter.value -= 1
    if (meter.age >= C.METER_LIMIT) {
      const p = meter.player
      this.shotMeter = null
      this.addText(p, 'TROP TARD', '#fca5a5')
      this.startThrow(p, { running: meter.stage > 1 })
    }
  }

  startThrow(p, opts = {}) {
    p.state = 'windup'
    p.t = p.team === 0 && !this.auto ? C.WINDUP : C.WINDUP_AI
    p.throwOpts = { ...opts, target: this.pickTarget(p) }
    if (opts.sup || this.armed[p.team]) {
      p.glow = true
    }
    sfx.windup()
  }

  release_ball(p) {
    const b = this.ball
    b.trail = []
    const o = p.throwOpts || {}
    const target = o.target && !o.target.ko ? o.target : this.pickTarget(p)
    const armed = this.armed[p.team]
    const sup = !!o.sup || !!armed
    const special = sup ? (armed ? armed.special : p.special) : null
    if (armed) this.armed[p.team] = null
    let speed = p.team === 1 ? C.SHOT_AI + this.level * 0.08 : o.running ? C.SHOT_RUN : C.SHOT
    if (o.jump) speed = C.SHOT_JUMP
    speed += (p.stats.power - 6) * C.POWER_SPEED
    const tx = target ? target.x : p.x + p.facing * 200
    const ty = target ? target.y : p.y
    const d = Math.hypot(tx - p.x, ty - p.y) || 1
    b.state = 'flying'
    b.holder = null
    b.team = p.team
    b.thrower = p
    b.target = target
    b.kind = 'shot'
    b.sup = sup
    b.special = special
    b.running = !!o.running
    b.jumpShot = !!o.jump
    b.age = 0
    b.impactCue = false
    b.hit = new Set()
    b.speed = speed
    b.dirx = (tx - p.x) / d
    b.diry = (ty - p.y) / d
    b.bx = b.x
    b.by = b.y
    b.bz = b.z
    const frames = d / speed
    b.vzBase = (16 - b.z) / Math.max(1, frames)
    b.vx = b.dirx * speed
    b.vy = b.diry * speed
    b.vz = b.vzBase
    b.g = 0
    p.state = 'throw'
    p.t = 14
    p.glow = false
    p.charge = 0
    if (sup) {
      if (p.team === 0) this.stats.supers++
      this.addText(p, (special ? specialName(special) : 'SUPER') + ' !', p.team === 0 ? '#67e8f9' : '#fb923c')
      sfx.superShot()
      this.shake = 8
      this.superBanner = {
        name: special ? specialName(special) : 'SUPER SLUGGER',
        kicker: `${p.name.toUpperCase()} DÉCHAÎNE`,
        team: p.team,
        t: 84,
      }
      this.vibrate(35)
    } else sfx.throw()
  }

  pass(p) {
    const mates = this.players.filter((q) => q.team === p.team && q !== p && !q.ko)
    if (!mates.length) return
    // passe vers un extérieur si on est intérieur, sinon vers un intérieur
    const pool = mates.filter((q) => (p.role === 'in' ? q.role === 'out' : q.role === 'in'))
    const list = pool.length ? pool : mates
    const r = list.reduce((a, q) =>
      Math.abs(q.y - p.y) + Math.abs(q.x - p.x) * 0.3 < Math.abs(a.y - p.y) + Math.abs(a.x - p.x) * 0.3
        ? q
        : a,
    )
    const b = this.ball
    const special = p.charge >= C.SUPER_CHARGE
    if (special) {
      this.armed[p.team] = { special: p.special, t: C.SPECIAL_WINDOW }
      this.addText(p, 'PASSE SPÉCIALE', '#67e8f9')
      sfx.charged()
    } else sfx.throw()
    const d = Math.hypot(r.x - b.x, r.y - b.y) || 1
    const t = Math.max(18, d / C.PASS_VX)
    b.state = 'flying'
    b.holder = null
    b.kind = 'pass'
    b.team = p.team
    b.thrower = p
    b.target = r
    b.receiver = r
    b.sup = false
    b.special = null
    b.age = 0
    b.vx = (r.x - b.x) / t
    b.vy = (r.y - b.y) / t
    b.g = C.LOB_GRAVITY
    b.vz = (18 - b.z + 0.5 * b.g * t * t) / t
    p.state = 'throw'
    p.t = 12
    p.charge = 0
    if (p.team === 0) this.stats.passes++
  }

  jump(p) {
    if (p.z > 0 || p.ko) return
    p.vz = C.JUMP_V * (0.9 + p.stats.jump * 0.02)
    p.state = 'jump'
    sfx.jump()
  }

  hitPlayer(p, b) {
    const dmg = Math.max(1, C.damage(b.thrower.stats.force, b.sup) - Math.floor(p.stats.defense / 4))
    p.hp = this.training ? Math.max(1, p.hp - dmg) : Math.max(0, p.hp - dmg)
    p.state = 'hit'
    p.t = C.HIT_STUN
    p.kx = Math.sign(b.vx || 1) * 1.6
    p.flash = 18
    if (p.charge) p.charge = 0
    this.addText(p, `-${dmg}`, p.team === 0 ? '#fb7185' : '#fde047')
    sfx.hitEnemy()
    this.burst(b.x, b.y, b.z, b.sup ? '#67e8f9' : '#fef3c7', b.sup ? 18 : 8)
    this.shake = Math.max(this.shake, b.sup ? 10 : 4)
    if (b.sup) {
      this.slowMo = this.reducedMotion ? 10 : 38
      this.impactFocus = { x: p.x, y: p.y, t: this.slowMo }
    }
    if (p.team === 0) {
      this.stats.taken += dmg
      this.vibrate(50)
    } else this.stats.hits++
    // rebond mesuré : la balle repart en arrière et retombe
    b.state = 'loose'
    b.kind = 'loose'
    b.vx = -Math.sign(b.vx || 1) * C.BOUNCE_VX * 2
    b.vy *= 0.2
    b.vz = C.BOUNCE_VZ * 1.6
    b.g = C.BOUNCE_GRAVITY
    b.bounces = 0
    if (p.hp <= 0) {
      p.ko = true
      p.state = 'ko'
      p.vz = 3
      p.kx = Math.sign(b.vx) * -2.2
      if (p.team === 1) this.stats.kos++
      this.addText(p, 'KO !', '#fde047')
      if (b.sup) {
        this.finisher = {
          x: p.x,
          y: p.y,
          team: b.team,
          facing: b.thrower?.facing || 1,
          t: this.reducedMotion ? 24 : 78,
        }
        this.superBanner = {
          name: 'GRAND SLAM KO',
          kicker: 'FATAL FINISH · BATTE FANTÔME',
          team: b.team,
          t: 96,
        }
      }
      sfx.ko()
      this.checkEnd()
    }
  }

  // --- Boucle --------------------------------------------------------------------------

  update() {
    if (this.state === 'paused') return
    this.frame++
    if (this.state === 'intro') {
      this.introT--
      if (this.introT % 40 === 0 && this.introT > 0 && this.introT <= 120) sfx.tick()
      if (this.introT <= 0) {
        this.state = 'play'
        sfx.go()
      }
      this.updateCamera()
      this.emitHud()
      return
    }
    if (this.state === 'end') {
      if (this.slowMo > 0) this.slowMo--
      for (const p of this.players) {
        if (p.ko && (this.slowMo <= 0 || this.frame % 3 === 0)) this.updatePlayer(p)
        else p.anim += 1 / 60
      }
      this.updateCamera()
      this.updateFx()
      if (--this.endT === 0) this.finish()
      this.emitHud()
      return
    }
    if (this.shotMeter) {
      this.updateShotMeter()
      // La jauge transforme l'action en arrêt sur image jouable : les animations
      // respirent encore, mais la trajectoire n'avance qu'un quart du temps.
      if (this.frame % 4 !== 0) {
        for (const p of this.players) p.anim += 1 / 240
        this.updateFx()
        this.updateCamera()
        this.emitHud()
        return
      }
    }
    if (this.slowMo > 0) {
      this.slowMo--
      if (this.impactFocus) this.impactFocus.t = this.slowMo
      if (this.frame % 3 !== 0) {
        this.updateFx()
        this.updateCamera()
        this.emitHud()
        return
      }
    }
    this.playFrames++
    if (this.training && this.playFrames % 180 === 0) for (const p of this.players) p.hp = p.maxHp
    if (this.hintT > 0) this.hintT--
    for (const a of this.armed) if (a && --a.t <= 0) this.armed[this.armed.indexOf(a)] = null
    this.updateInput()
    for (const p of this.players) this.updatePlayer(p)
    if (this.ball.sup && this.ball.state === 'flying' && !this.ball.impactCue) {
      const f = this.ball.target ? this.framesToContact(this.ball.target) : null
      if (f !== null && f < 12) {
        this.ball.impactCue = true
        this.slowMo = this.reducedMotion ? 0 : 30
        this.impactFocus = { x: this.ball.target.x, y: this.ball.target.y, t: 30 }
      }
    }
    this.updateBall()
    this.updateFx()
    this.updateCamera()
    if (this.state === 'end' && --this.endT === 0) this.finish()
    this.emitHud()
  }

  updateInput() {
    const inp = this.input
    if (this.state !== 'play' || !inp.pressed || !inp.pendingJump) return
    if (this.frame - inp.pressFrame >= C.HOLD_TO_JUMP) {
      inp.pendingJump = false
      const c = this.controlled
      if (c && this.holder !== c && c.z === 0 && !['hit', 'ko', 'whiff'].includes(c.state)) this.jump(c)
    }
  }

  updatePlayer(p) {
    p.anim += 1 / 60
    if (p.flash > 0) p.flash--
    // gravité, sauts
    if (p.z > 0 || p.vz > 0) {
      p.z += p.vz
      p.vz -= C.GRAVITY
      if (p.z <= 0) {
        p.z = 0
        p.vz = 0
        if (p.state === 'jump') p.state = this.holder === p ? 'hold' : 'idle'
      }
    }
    if (p.ko) {
      p.x = Math.max(8, Math.min(C.COURT_W - 8, p.x + p.kx))
      p.kx *= 0.88
      if (Math.abs(p.kx) < 0.04) p.kx = 0
      p.t++
      return
    }
    if (p.kx) {
      p.x += p.kx
      p.kx *= 0.85
      if (Math.abs(p.kx) < 0.05) p.kx = 0
    }
    if (p.t > 0 && ['hit', 'catch', 'throw', 'whiff'].includes(p.state)) {
      if (--p.t === 0) p.state = this.holder === p ? 'hold' : 'idle'
    }
    if (this.state !== 'play') {
      this.clamp(p)
      return
    }
    const h = this.holder
    const b = this.ball
    if (h === p) {
      if (p.team === 0 && !this.auto) this.humanHolder(p)
      else this.aiHolder(p)
    } else if (p.state === 'windup') {
      if (--p.t <= 0) this.release_ball(p)
    } else if (['idle', 'walk'].includes(p.state)) {
      // ramasser une balle libre de son côté, sinon regagner sa place
      let tx = p.home.x
      let ty = p.home.y
      if (b.state === 'loose' && this.collector() === p) {
        tx = b.x
        ty = b.y
      } else if (p.role === 'in' && h && h.team !== p.team) {
        // La ligne défensive coulisse avec la balle sans oscillation permanente.
        ty = p.home.y + Math.max(-10, Math.min(10, (b.y - p.home.y) * 0.18))
      } else if (p.role === 'out') {
        // les extérieurs suivent la balle le long de leur ligne
        if (p.line === 'back') ty = Math.max(0, Math.min(C.DEPTH, b.y))
        else
          tx = Math.max(
            p.team === 0 ? C.MID + 10 : 10,
            Math.min(p.team === 0 ? C.COURT_W - 10 : C.MID - 10, b.x),
          )
      }
      const collecting = b.state === 'loose' && this.collector() === p
      const follow = collecting ? 1 : 0.12
      p.goalX += (tx - p.goalX) * follow
      p.goalY += (ty - p.goalY) * follow
      this.moveTo(p, p.goalX, p.goalY, collecting ? C.RUN : C.WALK)
    }
    this.clamp(p)
    this.updateFacing(p)
  }

  moveTo(p, tx, ty, speed) {
    const dx = tx - p.x
    const dy = ty - p.y
    const d = Math.hypot(dx, dy)
    if (d < 0.75) {
      if (p.state === 'walk') p.state = 'idle'
      return
    }
    const k = dx && dy ? C.DIAGONAL * 1.414 : 1 // vitesse diagonale normalisée (mesurée)
    const s = Math.min(d, speed * k)
    p.x += (dx / d) * s
    p.y += (dy / d) * s
    p.state = 'walk'
  }

  updateFacing(p) {
    if (p.ko) return
    let lookX = this.ball.x
    if (this.holder === p) {
      const target = p.throwOpts?.target && !p.throwOpts.target.ko ? p.throwOpts.target : this.pickTarget(p)
      lookX = target?.x ?? (p.team === 0 ? C.COURT_W : 0)
    }
    const dx = lookX - p.x
    // Cette zone morte empêche le sprite de trembler quand la balle passe à sa verticale.
    if (Math.abs(dx) > 6) p.facing = dx < 0 ? -1 : 1
  }

  clamp(p) {
    if (p.ko) return
    if (p.role === 'in') {
      const lo = p.team === 0 ? IN_LO[0] : IN_LO[1]
      const hi = p.team === 0 ? IN_HI[0] : IN_HI[1]
      p.x = Math.max(lo, Math.min(hi, p.x))
      p.y = Math.max(4, Math.min(C.DEPTH - 4, p.y))
    }
  }

  // qui va chercher la balle libre : le plus proche parmi ceux qui ont le droit d'y aller
  collector() {
    const b = this.ball
    if (b.state !== 'loose') return null
    const inside = b.x > 0 && b.x < C.COURT_W && b.y > -4 && b.y < C.DEPTH + 4
    let pool
    if (inside)
      pool = this.players.filter(
        (p) => !p.ko && p.role === 'in' && (b.x < C.MID ? p.team === 0 : p.team === 1),
      )
    else pool = this.players.filter((p) => !p.ko && p.role === 'out')
    if (!pool.length) pool = this.players.filter((p) => !p.ko)
    return pool.reduce(
      (a, p) => (Math.hypot(p.x - b.x, p.y - b.y) < Math.hypot(a.x - b.x, a.y - b.y) ? p : a),
      pool[0],
    )
  }

  humanHolder(p) {
    if (p.state === 'jump') {
      if (p.airShot && p.z > 18 && p.vz <= 0.65) {
        const opts = p.airShot
        p.airShot = null
        this.startThrow(p, { ...opts, jump: true })
      }
      this.updateHeld()
      return
    }
    if (p.state === 'windup' && --p.t <= 0) this.release_ball(p)
    this.updateHeld()
  }

  // IA du porteur (mesurée) : réflexion, puis 2–3 pas d'élan et tir ; parfois course + super tir, ou passe
  aiHolder(p) {
    if (p.state === 'windup') {
      if (--p.t <= 0) this.release_ball(p)
      this.updateHeld()
      return
    }
    if (p.state === 'jump') {
      // tir en saut : la balle part au sommet du saut
      if (p.decided?.plan === 'airshot' && p.z > 22 && p.vz <= 0.6) this.startThrow(p, { jump: true })
      this.updateHeld()
      return
    }
    if (!['hold', 'walk', 'dash', 'idle'].includes(p.state)) {
      this.updateHeld()
      return
    }
    if (p.decided?.plan === 'airshot') {
      // retombé sans avoir tiré : tir au sol
      this.startThrow(p, {})
      this.updateHeld()
      return
    }
    const lvl = this.level
    if (!p.decided) {
      const r = this.rand()
      const pSuper = 0.12 + lvl * 0.065 + (this.armed[p.team] ? 1 : 0)
      const pPass = p.role === 'in' ? 0.14 : 0.3
      p.decided = {
        think: Math.round(10 + this.rand() * (36 - lvl * 3.5)),
        plan: this.armed[p.team]
          ? 'steps'
          : r < pPass
            ? 'pass'
            : r < pPass + pSuper && p.role === 'in'
              ? 'super'
              : 'steps',
        steps: C.AI_STEPS[Math.floor(this.rand() * C.AI_STEPS.length)],
        stepT: C.AI_STEP_FRAMES,
        jump: this.rand() < C.AI_JUMP_THROW,
        dash: 0,
      }
    }
    const d = p.decided
    if (d.think > 0) {
      d.think--
      p.state = 'hold'
      this.updateHeld()
      return
    }
    const dir = p.team === 0 ? 1 : -1
    if (d.plan === 'pass') {
      this.pass(p)
    } else if (d.plan === 'super') {
      p.state = 'dash'
      if (p.role === 'in') p.x += dir * C.RUN
      this.clamp(p)
      if (++d.dash >= C.SUPER_CHARGE + 2) this.startThrow(p, { sup: true, running: true })
    } else {
      p.state = 'walk'
      if (p.role === 'in') p.x += dir * C.WALK
      this.clamp(p)
      if (--d.stepT <= 0) {
        d.steps--
        d.stepT = C.AI_STEP_FRAMES
        if (d.steps <= 0) {
          if (d.jump && p.role === 'in') {
            this.jump(p)
            d.plan = 'airshot'
          } else this.startThrow(p, {})
        }
      }
    }
    this.updateHeld()
  }

  aiDefend(p, b) {
    // une décision par balle et par défenseur, juste avant l'impact
    if (b.hit.has(p.id + 1000)) return
    b.hit.add(p.id + 1000)
    const lvl = this.level
    if (b.sup) {
      // le super tir ne s'attrape pas ; plus on avance dans le tournoi, plus l'IA l'esquive en sautant
      if (this.rand() < 0.1 + lvl * 0.075 + p.stats.jump * 0.01) this.jump(p)
      return
    }
    const pc = Math.max(
      0.05,
      Math.min(
        0.88,
        0.2 + p.stats.catching * 0.035 + lvl * 0.055 - (b.running ? 0.1 : 0) - (b.jumpShot ? 0.08 : 0),
      ),
    )
    const r = this.rand()
    if (r < pc) this.catchBall(p, false)
    else if (r < pc + 0.08 + p.stats.jump * 0.008) this.jump(p)
  }

  updateBall() {
    const b = this.ball
    if (b.state === 'held') {
      if (b.holder.ko) {
        b.state = 'loose'
        b.vx = b.vy = 0
        b.vz = 1
        b.g = C.BOUNCE_GRAVITY
      } else this.updateHeld()
      return
    }
    b.age++
    if (b.state === 'flying') {
      b.trail.push({ x: b.x, y: b.y, z: b.z })
      if (b.trail.length > (b.kind === 'shot' ? 16 : 10)) b.trail.shift()
    }
    if (b.state === 'flying' && b.kind === 'shot') this.moveShot(b)
    else {
      b.vz -= b.g
      b.x += b.vx
      b.y += b.vy
      b.z += b.vz
    }
    if (b.sup && b.age % 2 === 0)
      this.parts.push({
        x: b.x,
        y: b.y,
        z: b.z,
        vx: 0,
        vy: 0,
        vz: 0.2,
        life: 18,
        color: b.team === 0 ? '#67e8f9' : '#fb923c',
        size: 4,
      })
    if (b.state === 'flying' && b.kind === 'pass') {
      const r = b.receiver
      if (r && !r.ko && Math.hypot(b.x - r.x, b.y - r.y) < 14 && b.z < 38) {
        this.giveBall(r)
        r.state = 'catch'
        r.t = 8
        return
      }
      if (b.z <= 0) this.toLoose(b)
      return
    }
    if (b.state === 'flying') {
      for (const p of this.players) {
        if (p.ko || p.team === b.team || p.role !== 'in' || b.hit.has(p.id)) continue
        const near = Math.abs(p.x - b.x) < 9 && Math.abs(p.y - b.y) < 9
        // l'IA décide quelques images avant l'impact
        if (p.team === 1 || this.auto) {
          const ftc = this.framesToContact(p)
          if (ftc !== null && ftc <= 3 && p.state !== 'hit') this.aiDefend(p, b)
          if (this.holder) return
        }
        if (near && b.z >= p.z - 2 && b.z <= p.z + BODY_H) {
          b.hit.add(p.id)
          this.hitPlayer(p, b)
          return
        }
      }
      const out = b.x < -40 || b.x > C.COURT_W + 40 || b.y < -40 || b.y > C.DEPTH + 40 || b.z < -2
      if (out || b.age > 400) this.toLoose(b)
      return
    }
    if (b.state === 'loose') {
      if (b.z <= 0 && b.vz < 0) {
        b.z = 0
        b.bounces = (b.bounces || 0) + 1
        b.vz = b.bounces < 3 ? C.FLOOR_BOUNCE_VZ / b.bounces : 0
        b.vx /= 4 // mesuré : la vitesse horizontale est divisée par 4 à chaque rebond
        b.vy /= 4
        if (b.bounces >= 3) b.g = 0
      }
      b.x = Math.max(-24, Math.min(C.COURT_W + 24, b.x))
      b.y = Math.max(-24, Math.min(C.DEPTH + 24, b.y))
      const c = this.collector()
      if (c && Math.hypot(c.x - b.x, c.y - b.y) < 9 && b.z < 30) {
        this.giveBall(c)
        sfx.catch()
      }
    }
  }

  toLoose(b) {
    b.state = 'loose'
    b.kind = 'loose'
    b.g = C.BOUNCE_GRAVITY
    b.vx *= 0.3
    b.vy *= 0.3
    if (b.z <= 0) {
      b.z = 0
      b.vz = 1.2
    }
    b.sup = false
  }

  // trajectoires : tir droit, ou motif du tir spécial
  moveShot(b) {
    const a = b.age
    let speed = b.speed
    let latY = 0
    let latZ = 0
    switch (b.special) {
      case 'comete':
        speed *= 2.3
        break
      case 'fusee':
        speed *= Math.min(3.2, 0.35 * Math.pow(1.07, a))
        break
      case 'serpentin':
        speed *= 1.4
        latY = Math.sin(a * 0.22) * 22
        break
      case 'eclair':
        speed *= 1.7
        latY = ((Math.floor(a / 7) % 2 ? 1 : -1) * ((a % 7) / 7) * 2 - (Math.floor(a / 7) % 2 ? 1 : -1)) * 14
        break
      case 'vague':
        speed *= 1.5
        latZ = Math.abs(Math.sin(a * 0.16)) * 34
        break
      case 'meteore':
        if (a < 26) {
          speed *= 0.7
          latZ = Math.sin((a / 26) * Math.PI * 0.5) * 90
        } else {
          speed *= 2.4
          latZ = Math.max(0, 90 - (a - 26) * 6)
        }
        break
    }
    // une cible encore en jeu est suivie légèrement (le tir reste « verrouillé »)
    const t = b.target
    if (t && !t.ko && b.kind === 'shot') {
      const dx = t.x - b.bx
      const dy = t.y - b.by
      const d = Math.hypot(dx, dy)
      if (d > 20) {
        b.dirx += (dx / d - b.dirx) * 0.04
        b.diry += (dy / d - b.diry) * 0.04
        const n = Math.hypot(b.dirx, b.diry)
        b.dirx /= n
        b.diry /= n
      }
    }
    b.bx += b.dirx * speed
    b.by += b.diry * speed
    b.bz = Math.max(4, b.bz + b.vzBase)
    const px = b.x
    const py = b.y
    b.x = b.bx
    b.y = b.by + latY
    b.z = b.bz + latZ
    b.vx = b.x - px
    b.vy = b.y - py
  }

  checkEnd() {
    for (let t = 0; t < 2; t++) {
      if (!this.alive(t).length && this.state === 'play') {
        this.state = 'end'
        this.winner = 1 - t
        this.cancelInput()
        // Le dernier joueur reste au sol assez longtemps pour que le KO soit lu
        // avant l'apparition des résultats.
        this.endT = this.reducedMotion ? 150 : 220
        if (this.winner === 0) sfx.win()
        else sfx.lose()
      }
    }
  }

  finish() {
    const me = this.alive(0)
    this.onEnd({
      win: this.winner === 0,
      ...this.stats,
      survivors: me.length,
      hpLeft: me.reduce((a, p) => a + p.hp, 0),
      frames: this.playFrames,
      score:
        this.winner === 0
          ? 1000 + me.reduce((a, p) => a + p.hp, 0) * 20 + this.stats.perfects * 100 + this.stats.supers * 50
          : this.stats.hits * 50,
    })
  }

  // --- Effets ---------------------------------------------------------------------------

  addText(p, text, color) {
    let z = p.z + 52
    for (let k = 0; k < 5 && this.texts.some((o) => Math.abs(o.x - p.x) < 50 && Math.abs(o.z - z) < 12); k++)
      z += 12
    this.texts.push({ x: p.x, y: p.y, z, text, color, t: 55 })
  }

  burst(x, y, z, color, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rand() * Math.PI * 2
      const s = 0.8 + this.rand() * 2.4
      this.parts.push({
        x,
        y,
        z,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.4,
        vz: 1 + this.rand() * 2,
        life: 28,
        color,
        size: 2 + this.rand() * 2,
      })
    }
  }

  updateFx() {
    for (const q of this.parts) {
      q.x += q.vx
      q.y += q.vy
      q.z += q.vz
      q.vz -= 0.12
      if (q.z < 0) q.z = 0
      q.life--
    }
    this.parts = this.parts.filter((q) => q.life > 0)
    for (const t of this.texts) {
      t.z += 0.5
      t.t--
    }
    this.texts = this.texts.filter((t) => t.t > 0)
    if (this.superBanner && --this.superBanner.t <= 0) this.superBanner = null
    if (this.finisher && --this.finisher.t <= 0) this.finisher = null
    if (this.impactFocus && this.slowMo <= 0) this.impactFocus = null
    if (this.shake > 0) this.shake--
  }

  updateCamera() {
    const w = this.viewW
    const b = this.ball
    let focus = b.x
    let wantedZoom = 1.2
    if (this.impactFocus) {
      focus = this.impactFocus.x
      wantedZoom = 1.78
    } else if (b.state === 'held' && b.holder) {
      const target = this.pickTarget(b.holder)
      focus = target ? b.holder.x * 0.58 + target.x * 0.42 : b.holder.x
      wantedZoom = 1.3
    } else if (b.state === 'flying') {
      focus = b.target && !b.target.ko ? b.x * 0.72 + b.target.x * 0.28 : b.x
      const remaining = b.target ? Math.abs(b.target.x - b.x) : 220
      if (b.sup && b.target && this.framesToContact(b.target) < 12) wantedZoom = 1.7
      wantedZoom = remaining < 150 ? 1.48 : 1.36
    } else if (b.state === 'loose') wantedZoom = 1.26
    if ((this.state === 'intro' || this.state === 'end') && !this.impactFocus) {
      focus = C.MID
      wantedZoom = this.state === 'intro' ? 1.14 : 1.2
    }
    wantedZoom = Math.min(
      w < 420 ? (this.impactFocus ? 1.62 : 1.42) : this.impactFocus ? 1.82 : 1.52,
      wantedZoom,
    )
    this.camZoom += (wantedZoom - this.camZoom) * 0.055
    if (Math.abs(wantedZoom - this.camZoom) < 0.002) this.camZoom = wantedZoom
    const half = w / (2 * this.camZoom)
    const lo = -30 + half
    const hi = C.COURT_W + 30 - half
    const goal = lo > hi ? C.MID : Math.max(lo, Math.min(hi, focus))
    this.camX += (goal - this.camX) * 0.085
    if (Math.abs(goal - this.camX) < 0.08) this.camX = goal
  }

  vibrate(ms) {
    if (this.haptics && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(ms)
  }

  emitHud() {
    const team = (t) =>
      this.players
        .filter((p) => p.team === t && p.role === 'in')
        .map((p) => ({ name: p.name, hp: p.hp, max: p.maxHp, ko: p.ko }))
    const c = this.controlled
    const h = this.holder
    const hud = {
      state: this.state,
      score: this.stats.kos * 250 + this.stats.hits * 50 + this.stats.perfects * 100 + this.stats.supers * 50,
      intro: Math.ceil(this.introT / 40),
      us: team(0),
      them: team(1),
      holding: !!h && h.team === 0,
      charge: this.shotMeter?.value || 0,
      shotMeter: this.shotMeter
        ? {
            stage: this.shotMeter.stage,
            value: this.shotMeter.value,
            ...this.meterWindow(),
          }
        : null,
      armed: !!this.armed[0],
      canJumpShot: !!h && h.team === 0 && h.state === 'hold' && !this.shotMeter,
      superReady: this.shotMeter?.stage === 3,
      chargeLate: false,
      slowMo: this.slowMo > 0,
      seconds: Math.floor(this.playFrames / 60),
      threat: c
        ? (() => {
            const f = this.framesToContact(c)
            return f === null ? null : Math.ceil(f)
          })()
        : null,
      ctrl: c ? c.name : '',
      hint: this.hintT > 0 ? this.hint : '',
    }
    const key = JSON.stringify(hud)
    if (key !== this.lastHud) {
      this.lastHud = key
      this.onHud(hud)
    }
  }
}

export function specialName(id) {
  return (
    {
      comete: 'COMÈTE FATALE',
      fusee: 'FUSÉE OMEGA',
      serpentin: 'VIPER CURVE',
      meteore: 'METEOR CRUSH',
      vague: 'TSUNAMI DRIVE',
      eclair: 'THUNDER K.O.',
    }[id] || 'SUPER'
  )
}

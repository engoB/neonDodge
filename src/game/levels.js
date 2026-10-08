// Mondes, niveaux et générateur de parcours (déterministe : même graine = même niveau).
import { GROUND_Y } from './constants.js'

export const WORLDS = [
  {
    id: 'gym', name: 'Gymnase', tagline: 'Le club du quartier', accent: '#f59e0b',
    team: { name: 'Les Chaussettes', jersey: '#3b82f6', trim: '#bfdbfe', shorts: '#1e3a8a', hair: '#3b2416', band: '#f8fafc', skin: '#e9b98c', style: 1 },
  },
  {
    id: 'roof', name: 'Toits', tagline: 'Au-dessus de la ville', accent: '#fb7185',
    team: { name: 'Les Corbeaux', jersey: '#334155', trim: '#ef4444', shorts: '#0f172a', hair: '#111827', band: '#ef4444', skin: '#c68b62', style: 2 },
  },
  {
    id: 'beach', name: 'Plage', tagline: 'Sable chaud, balles brûlantes', accent: '#22d3ee',
    team: { name: 'Les Mouettes', jersey: '#06b6d4', trim: '#ecfeff', shorts: '#facc15', hair: '#fde68a', band: '#f97316', skin: '#f1c9a0', style: 3 },
  },
  {
    id: 'neon', name: 'Stade néon', tagline: 'La finale sous les projecteurs', accent: '#e879f9',
    team: { name: 'Les Éclairs', jersey: '#a855f7', trim: '#22d3ee', shorts: '#1e1b4b', hair: '#e5e7eb', band: '#22d3ee', skin: '#8d5a3b', style: 0 },
  },
]

// Héroïne originale : Riko.
export const HERO_KIT = { jersey: '#f97316', trim: '#fff7ed', shorts: '#0d9488', hair: '#7c3aed', band: '#facc15', skin: '#f2c094', style: 0 }

const TUTORIAL = [
  { c: 'flat', len: 300, hint: 'Touchez l’écran pour sauter' },
  { c: 'gap', w: 70, flat: true },
  { c: 'flat', len: 220, hint: 'Maintenez le doigt pour sauter plus haut' },
  { c: 'gold', v: 'high' },
  { c: 'crates', hint: 'Les petits obstacles se franchissent tout seuls' },
  { c: 'flat', len: 140 },
  { c: 'enemy', type: 'lanceur', len: 520, hp: 2, hint: 'Une balle arrive : touchez juste avant l’impact pour l’ATTRAPER' },
  { c: 'flat', len: 200, hint: 'Balle en main : touchez pour TIRER sur l’adversaire devant vous' },
  { c: 'enemy', type: 'lanceur', len: 480, hp: 2 },
  { c: 'platforms' },
  { c: 'gold', v: 'gap' },
  { c: 'enemy', type: 'rouleur', len: 480, hp: 2, hint: 'Balle au ras du sol : impossible à attraper, sautez !' },
  { c: 'flat', len: 220, hint: 'Gardez la balle en courant au sol : la jauge se remplit, SUPER TIR !' },
  { c: 'enemy', type: 'lanceur', len: 520, hp: 4, hint: 'Les adversaires solides encaissent deux tirs… ou un super tir' },
  { c: 'stairs' },
  { c: 'flat', len: 180, hint: 'Retombez sur un adversaire pour le mettre KO' },
  { c: 'enemy', type: 'lobeur', len: 460, hp: 2 },
  { c: 'gold', v: 'high' },
  { c: 'enemy', type: 'capitaine', len: 600, hp: 8, hint: 'Le capitaine prend son élan : sa boule de feu ne s’attrape pas, sautez !' },
]

export const LEVELS = [
  { id: '1-1', world: 0, name: 'Échauffement', seed: 11, diff: 0.05, script: TUTORIAL },
  { id: '1-2', world: 0, name: 'Tribunes', seed: 12, length: 3400, diff: 0.14 },
  { id: '1-3', world: 0, name: 'Le capitaine', seed: 13, length: 3200, diff: 0.22, captain: true },
  { id: '2-1', world: 1, name: 'Antennes', seed: 21, length: 3800, diff: 0.3 },
  { id: '2-2', world: 1, name: 'Cheminées', seed: 22, length: 4000, diff: 0.38 },
  { id: '2-3', world: 1, name: 'Le corbeau en chef', seed: 23, length: 3700, diff: 0.46, captain: true },
  { id: '3-1', world: 2, name: 'Marée basse', seed: 31, length: 4100, diff: 0.52 },
  { id: '3-2', world: 2, name: 'Jetée', seed: 32, length: 4300, diff: 0.6 },
  { id: '3-3', world: 2, name: 'Roi du sable', seed: 33, length: 4000, diff: 0.68, captain: true },
  { id: '4-1', world: 3, name: 'Projecteurs', seed: 41, length: 4500, diff: 0.76 },
  { id: '4-2', world: 3, name: 'Ola', seed: 42, length: 4700, diff: 0.85 },
  { id: '4-3', world: 3, name: 'La finale', seed: 43, length: 4500, diff: 0.95, captain: true },
]

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const Y_MIN = GROUND_Y - 44
const Y_MAX = GROUND_Y + 12
const clampY = (y) => Math.max(Y_MIN, Math.min(Y_MAX, y))

export function enemyPool(d) {
  if (d < 0.12) return ['lanceur']
  if (d < 0.3) return ['lanceur', 'lanceur', 'lobeur']
  if (d < 0.5) return ['lanceur', 'lobeur', 'rouleur', 'lanceur']
  return ['lanceur', 'lobeur', 'rouleur', 'lanceur', 'coureur']
}

export class LevelBuilder {
  constructor({ seed = 1, diff = 0, endless = false, length = 3000, captain = false, script = null, world = 0 }) {
    this.r = rng(seed)
    this.base = diff
    this.endless = endless
    this.length = length
    this.captain = captain
    this.script = script ? script.map((s) => ({ ...s })) : null
    this.world = world
    this.L = { grounds: [], platforms: [], crates: [], enemies: [], items: [], hints: [], goalX: Infinity, done: false }
    this.x = 0
    this.gy = GROUND_Y
    this.last = ''
    this.goldMarks = endless || script ? [] : [0.24, 0.52, 0.8].map((f) => f * length)
    this.goldIdx = 0
    this.goldCount = 0
    this.nextHeart = 5000
    this.ground(520)
  }

  get diff() {
    return this.endless ? Math.min(1, this.base + this.x / 30000) : this.base
  }

  get worldNow() {
    return this.endless ? Math.floor(this.x / 7000) % WORLDS.length : this.world
  }

  rand(a, b) {
    return a + (b - a) * this.r()
  }

  pick(arr) {
    return arr[Math.floor(this.r() * arr.length)]
  }

  ground(len) {
    const g = this.L.grounds.at(-1)
    const w = this.worldNow
    if (g && g.x1 === this.x && g.y === this.gy && g.w === w) g.x1 += len
    else this.L.grounds.push({ x0: this.x, x1: this.x + len, y: this.gy, w })
    this.x += len
  }

  coin(x, y) {
    this.L.items.push({ kind: 'coin', x, y })
  }

  coinRow(x, y, n, gap = 22) {
    for (let i = 0; i < n; i++) this.coin(x + i * gap, y)
  }

  coinArc(x0, x1, y, h, n) {
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0.5 : i / (n - 1)
      this.coin(x0 + (x1 - x0) * f, y - Math.sin(f * Math.PI) * h)
    }
  }

  hint(x, text) {
    this.L.hints.push({ x, text })
  }

  generateUntil(x) {
    let guard = 0
    while (!this.L.done && this.x < x && guard++ < 300) this.step()
  }

  step() {
    if (this.script) {
      const s = this.script.shift()
      if (!s) return this.finish()
      if (s.hint) this.hint(this.x + 10, s.hint)
      this.last = s.c
      return this[s.c](s)
    }
    if (!this.endless && this.x >= this.length) return this.finish()
    if (this.goldIdx < this.goldMarks.length && this.x >= this.goldMarks[this.goldIdx]) {
      this.goldIdx++
      this.last = 'gold'
      return this.gold({})
    }
    if (this.endless && this.x >= this.nextHeart) {
      this.nextHeart += 5500
      return this.heart()
    }
    const d = this.diff
    const w = {
      flat: 1.1,
      gap: 1.2 + d,
      stairs: 0.8,
      crates: 0.9,
      platforms: 0.9,
      enemy: 1.8 + d * 1.6,
      duo: d > 0.4 ? 0.4 + d : 0,
      perch: d > 0.35 ? 0.4 + d * 0.8 : 0,
    }
    if (['enemy', 'duo', 'perch'].includes(this.last)) {
      w.enemy *= 0.4
      w.duo *= 0.3
      w.perch *= 0.3
    }
    if (w[this.last] !== undefined) w[this.last] *= 0.35
    let total = 0
    for (const k in w) total += w[k]
    let r = this.r() * total
    let k = 'flat'
    for (const key in w) {
      r -= w[key]
      if (r <= 0) {
        k = key
        break
      }
    }
    this.last = k
    this[k]({})
  }

  // --- Morceaux de parcours -------------------------------------------------

  flat(o) {
    const len = o.len ?? Math.round(this.rand(140, 260))
    const x0 = this.x
    this.ground(len)
    if (!o.hint && this.r() < 0.6 && len > 120) {
      if (this.r() < 0.5) this.coinRow(x0 + 30, this.gy - 16, Math.floor((len - 40) / 26), 26)
      else this.coinArc(x0 + 30, x0 + len - 30, this.gy - 18, 52, 5)
    }
  }

  gap(o) {
    this.ground(90)
    const w = o.w ?? Math.round(Math.min(150, 60 + this.diff * 70 + this.rand(0, 20)))
    const x0 = this.x
    const dy = !o.flat && this.r() < 0.35 ? this.pick([-24, -16, 16, 24]) : 0
    const ww = dy < 0 ? w - 30 : w // un trou suivi d'une montée est plus court
    this.coinArc(x0 - 10, x0 + ww + 10, this.gy - 30, 40 + ww * 0.25, 5)
    this.x += ww
    this.gy = clampY(this.gy + dy)
    this.ground(140)
  }

  stairs() {
    this.ground(60)
    const dir = this.gy > GROUND_Y - 6 ? -1 : this.gy < GROUND_Y - 30 ? 1 : this.r() < 0.5 ? -1 : 1
    for (let i = 0; i < 2; i++) {
      this.gy = clampY(this.gy + dir * this.pick([18, 22, 26]))
      this.ground(i === 1 ? 180 : 120)
    }
  }

  crates() {
    const x0 = this.x
    const n = 1 + (this.r() < 0.3 + this.diff * 0.5 ? 1 : 0)
    this.ground(110 + n * 130)
    for (let i = 0; i < n; i++) {
      const cx = x0 + 80 + i * 130
      this.L.crates.push({ x: cx, y: this.gy, w: 22, h: 22 })
      this.coin(cx + 11, this.gy - 58)
    }
  }

  platforms() {
    const x0 = this.x
    this.ground(420)
    const gy = this.gy
    this.L.platforms.push({ x: x0 + 70, y: gy - 62, w: 110 })
    this.coinRow(x0 + 86, gy - 80, 4)
    if (this.r() < 0.65) {
      this.L.platforms.push({ x: x0 + 230, y: gy - 120, w: 100 })
      this.coinRow(x0 + 246, gy - 138, 4)
    }
  }

  mkEnemy(x, y, type, extra = {}) {
    const d = this.diff
    type ??= this.pick(enemyPool(d))
    const hp = extra.hp ?? (type === 'capitaine' ? 8 : d > 0.45 && this.r() < 0.5 ? 4 : 2)
    return {
      x, y, type, hp, maxHp: hp,
      windup: Math.round(26 - d * 10),
      cool: Math.round(80 - d * 30),
      throws: type === 'capitaine' ? 99 : 1 + (d > 0.35 ? 1 : 0) + (d > 0.75 ? 1 : 0),
      w: this.worldNow,
      ...extra,
    }
  }

  enemy(o) {
    this.ground(o.len ?? 500)
    const extra = {}
    if (o.hp) extra.hp = o.hp
    if (o.type === 'capitaine') Object.assign(extra, { captain: true, throws: 99 })
    this.L.enemies.push(this.mkEnemy(this.x - 60, this.gy, o.type, extra))
  }

  duo() {
    this.ground(720)
    this.L.enemies.push(this.mkEnemy(this.x - 300, this.gy))
    this.L.enemies.push(this.mkEnemy(this.x - 60, this.gy))
  }

  perch() {
    const x0 = this.x
    this.ground(520)
    const py = this.gy - 80
    this.L.platforms.push({ x: x0 + 380, y: py, w: 90 })
    this.L.enemies.push(this.mkEnemy(x0 + 425, py, this.pick(['lanceur', 'lobeur']), { perch: true }))
  }

  gold(o) {
    const v = o.v ?? (this.r() < 0.5 ? 'high' : 'gap')
    const i = this.goldCount++
    if (v === 'high') {
      const x0 = this.x
      this.ground(300)
      this.L.items.push({ kind: 'gold', i, x: x0 + 150, y: this.gy - 100 })
    } else {
      this.ground(90)
      const w = 110
      this.L.items.push({ kind: 'gold', i, x: this.x + w / 2, y: this.gy - 96 })
      this.x += w
      this.ground(160)
    }
  }

  heart() {
    const x0 = this.x
    this.ground(220)
    this.L.items.push({ kind: 'heart', x: x0 + 110, y: this.gy - 54 })
  }

  finish() {
    if (this.captain) {
      const x0 = this.x
      this.ground(1500)
      this.hint(x0 + 40, 'Le capitaine recule en lançant : mettez-le KO avant l’arrivée')
      this.L.enemies.push(this.mkEnemy(x0 + 420, this.gy, 'capitaine', { captain: true, hp: 12, retreatTo: x0 + 1300 }))
    }
    this.ground(200)
    this.L.goalX = this.x
    this.ground(1200)
    this.L.done = true
  }
}

export function buildLevel(def) {
  const b = new LevelBuilder({ ...def })
  b.generateUntil(Infinity)
  return b.L
}

import type { BaseballEngine } from './engine'
import { PixelCharacters, type CharacterPose, type Uniform } from './pixelArt'
import { BASES, clamp, CONTACT_TIME, HOME, lerp, PITCH_DURATION, pointOnBasePath, WORLD } from './rules'
import stadiumUrl from '../assets/stadium-gameplay-v1.webp'

const COLORS = {
  ink: '#162a39', cream: '#fff1c9', grass: '#218f63', grassDark: '#197854',
  clay: '#bd764b', chalk: '#f8e6bd', gold: '#ffe077', aqua: '#4ce9dc',
}
const PLAYER_ACCENTS = ['#59eadb', '#ff977b', '#a8d4ff', '#e6a4ff']

function seeded(number: number) {
  const value = Math.sin(number * 127.1 + 78.233) * 43758.5453
  return value - Math.floor(value)
}

export class BaseballRenderer {
  private readonly ctx: CanvasRenderingContext2D
  private readonly output: CanvasRenderingContext2D
  private readonly scene: HTMLCanvasElement
  private readonly field: HTMLCanvasElement
  private readonly characters = new PixelCharacters()
  private cameraZoom = 1
  private cameraX = WORLD.width / 2
  private cameraY = WORLD.height / 2
  private ballTrail: { x: number; y: number; height: number }[] = []
  private ballTrailPhase = ''

  constructor(private canvas: HTMLCanvasElement) {
    this.output = canvas.getContext('2d', { alpha: false })!
    this.scene = document.createElement('canvas')
    this.scene.width = WORLD.width
    this.scene.height = WORLD.height
    this.ctx = this.scene.getContext('2d', { alpha: false })!
    this.ctx.imageSmoothingEnabled = false
    this.field = document.createElement('canvas')
    this.field.width = WORLD.width
    this.field.height = WORLD.height
    const fieldContext = this.field.getContext('2d', { alpha: false })!
    this.paintStadium(fieldContext)
    const stadium = new Image()
    stadium.decoding = 'async'
    stadium.onload = () => {
      fieldContext.imageSmoothingEnabled = true
      fieldContext.drawImage(stadium, 0, 0, WORLD.width, WORLD.height)
      fieldContext.imageSmoothingEnabled = false
    }
    stadium.src = stadiumUrl
  }

  render(engine: BaseballEngine) {
    const ctx = this.ctx
    ctx.drawImage(this.field, 0, 0)
    this.drawCrowd(engine)
    this.drawBases(engine)
    this.drawFielders(engine)
    this.drawPitcher(engine)
    if (engine.phase === 'running') this.drawRunner(engine)
    else if (engine.phase === 'call' && engine.scoringRunners.length) this.drawScoringCelebration(engine)
    else this.drawBatter(engine)
    this.drawBall(engine)
    this.drawEffects(engine)
    if (engine.phase === 'paused') this.overlay('PAUSE', 'TOUCHE POUR REPRENDRE')
    this.present(engine)
  }

  private paintStadium(ctx: CanvasRenderingContext2D) {
    const { width, height } = WORLD
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#0c2031'; ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#142c3d'; ctx.fillRect(0, 0, width, 51)
    ctx.fillStyle = '#274457'; ctx.fillRect(0, 3, width, 3)
    ctx.fillStyle = '#071522'; ctx.fillRect(0, 18, width, 4)

    // Hand placed grandstand tiers, each with small moving crowd silhouettes.
    for (let row = 0; row < 5; row++) {
      const y = 7 + row * 9
      ctx.fillStyle = row % 2 ? '#132a3e' : '#193a4b'
      ctx.fillRect(0, y, width, 8)
      for (let x = 2; x < width; x += 7) {
        const variant = Math.floor(seeded(x + row * 301) * 5)
        ctx.fillStyle = ['#7ab2a7', '#f6ba74', '#df7280', '#738eb2', '#c9bd92'][variant]
        ctx.fillRect(x, y + 2, 3, 2)
        ctx.fillStyle = ['#214a59', '#715566', '#375873'][variant % 3]
        ctx.fillRect(x - 1, y + 4, 5, 4)
      }
    }

    ctx.fillStyle = '#071623'; ctx.fillRect(184, 3, 112, 36)
    ctx.fillStyle = '#d6b965'; ctx.fillRect(188, 6, 104, 2)
    ctx.fillRect(188, 35, 104, 2)
    ctx.fillStyle = '#1a4a58'; ctx.fillRect(188, 9, 104, 25)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffe293'; ctx.font = '900 10px monospace'; ctx.fillText('NEON LEAGUE', 240, 20)
    ctx.fillStyle = '#79e9d2'; ctx.font = '700 7px monospace'; ctx.fillText('★  ARCADE BALLPARK  ★', 240, 30)
    ctx.fillStyle = '#ffe293'; ctx.fillRect(12, 18, 80, 16)
    ctx.fillStyle = '#9f3657'; ctx.fillRect(14, 20, 76, 12)
    ctx.fillStyle = '#fff1c9'; ctx.font = '900 8px monospace'; ctx.fillText('HOT STREAK', 52, 29)
    ctx.fillStyle = '#ffe293'; ctx.fillRect(388, 18, 80, 16)
    ctx.fillStyle = '#186d73'; ctx.fillRect(390, 20, 76, 12)
    ctx.fillStyle = '#fff1c9'; ctx.fillText('HOME TEAM', 428, 29)

    ctx.fillStyle = '#263d48'; ctx.fillRect(0, 46, width, 23)
    ctx.fillStyle = '#344e51'; ctx.fillRect(0, 58, width, 5)
    for (let x = 7; x < width; x += 19) {
      ctx.fillStyle = x % 3 ? '#b5d9b7' : '#e6c678'
      ctx.fillRect(x, 52, 7, 2)
    }

    // Exact base positions are shared with the game engine.
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(5, 98)
    ctx.quadraticCurveTo(240, 20, 475, 98)
    ctx.closePath()
    ctx.fillStyle = COLORS.grass
    ctx.fill()
    ctx.save(); ctx.clip()
    for (let stripe = -10; stripe < 650; stripe += 27) {
      ctx.beginPath()
      ctx.moveTo(stripe, 63)
      ctx.lineTo(stripe + 36, 63)
      ctx.lineTo(stripe + 168, 270)
      ctx.lineTo(stripe + 132, 270)
      ctx.closePath()
      ctx.fillStyle = COLORS.grassDark
      ctx.fill()
    }
    for (let dot = 0; dot < 320; dot++) {
      const x = Math.floor(seeded(dot * 3) * width)
      const y = 72 + Math.floor(seeded(dot * 7 + 4) * 190)
      ctx.fillStyle = dot % 2 ? '#6ab67d' : '#267e60'
      ctx.fillRect(x, y, 2, 1)
    }
    ctx.restore()

    ctx.strokeStyle = '#111f30'; ctx.lineWidth = 5
    ctx.beginPath(); ctx.moveTo(4, 99); ctx.quadraticCurveTo(240, 19, 476, 99); ctx.stroke()
    ctx.strokeStyle = '#e0be74'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(4, 97); ctx.quadraticCurveTo(240, 17, 476, 97); ctx.stroke()

    ctx.fillStyle = '#ad6546'
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(BASES[1].x + 15, BASES[1].y)
    ctx.lineTo(BASES[2].x, BASES[2].y - 12)
    ctx.lineTo(BASES[3].x - 15, BASES[3].y)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#d99a69'; ctx.lineWidth = 20; ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(BASES[1].x, BASES[1].y)
    ctx.lineTo(BASES[2].x, BASES[2].y)
    ctx.lineTo(BASES[3].x, BASES[3].y)
    ctx.closePath(); ctx.stroke()
    ctx.strokeStyle = '#734737'; ctx.lineWidth = 2; ctx.stroke()

    ctx.fillStyle = '#2a9566'
    ctx.beginPath()
    ctx.moveTo(240, 212); ctx.lineTo(331, 169); ctx.lineTo(240, 107); ctx.lineTo(149, 169)
    ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#aa6848'; ctx.beginPath(); ctx.ellipse(240, 149, 25, 12, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#dda272'; ctx.fillRect(232, 145, 16, 3)

    ctx.strokeStyle = COLORS.chalk; ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(5, 98)
    ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(475, 98)
    ctx.stroke()
    ctx.strokeStyle = '#f7dda9'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(HOME.x, HOME.y - 5, 18, Math.PI, 2 * Math.PI); ctx.stroke()
    for (let x = 16; x < width; x += 48) {
      ctx.fillStyle = '#d1b663'; ctx.fillRect(x, 62, 3, 10)
    }
  }

  private drawCrowd(engine: BaseballEngine) {
    const ctx = this.ctx
    const clock = engine.phaseClock
    for (let index = 0; index < 26; index++) {
      if (Math.floor(clock * 5 + index * 7) % 7 !== 0) continue
      const x = 16 + Math.floor(seeded(index * 83) * 448)
      const y = 10 + Math.floor(seeded(index * 27) * 30)
      ctx.fillStyle = index % 2 ? '#ffe89f' : '#80f5df'
      ctx.fillRect(x, y, 2, 2)
    }
  }

  private drawBases(engine: BaseballEngine) {
    const ctx = this.ctx
    for (let index = 1; index <= 3; index++) {
      const base = BASES[index]
      ctx.fillStyle = '#49362f'; ctx.fillRect(base.x - 6, base.y - 2, 13, 8)
      ctx.save(); ctx.translate(base.x, base.y); ctx.rotate(Math.PI / 4)
      ctx.fillStyle = COLORS.cream; ctx.fillRect(-5, -5, 10, 10)
      ctx.fillStyle = '#fffdf0'; ctx.fillRect(-4, -4, 6, 6)
      ctx.restore()
      const runner = engine.baseRunners[index - 1]
      if (runner !== null) this.drawCharacter(base.x, base.y - 6, 'home', 'ready', index === 3, .82, runner)
    }
    ctx.fillStyle = '#774d3c'
    ctx.fillRect(231, 231, 18, 10)
    ctx.fillStyle = '#fff1cb'
    ctx.beginPath(); ctx.moveTo(232, 231); ctx.lineTo(248, 231); ctx.lineTo(246, 240); ctx.lineTo(234, 240); ctx.closePath(); ctx.fill()
  }

  private drawFielders(engine: BaseballEngine) {
    const positions = [
      { x: 370, y: 151, scale: .8 }, { x: 111, y: 151, scale: .8 },
      { x: 190, y: 128, scale: .72 }, { x: 291, y: 128, scale: .72 },
      { x: 78, y: 98, scale: .66 }, { x: 402, y: 98, scale: .66 },
      { x: 240, y: 84, scale: .66 },
    ]
    const activeDefense = engine.phase === 'fielding' || engine.phase === 'running'
    const landing = {
      x: 240 + ((engine.pitchSerial * 71) % 260) - 130,
      y: 92 + (engine.pitchSerial % 3) * 12,
    }
    const chaser = engine.pitchSerial % positions.length
    positions.forEach((position, index) => {
      const bob = Math.floor(Math.sin(engine.phaseClock * 3 + index) * 1.2)
      const runFrames: CharacterPose[] = ['runA', 'runC', 'runB', 'runD']
      const pose: CharacterPose = activeDefense && (index + engine.pitchSerial) % 3 === 0
        ? runFrames[Math.floor(engine.phaseClock * 11 + index) % runFrames.length]
        : Math.floor(engine.phaseClock * 2 + index) % 7 === 0 ? 'catch' : 'ready'
      const chase = activeDefense && index === chaser ? clamp((engine.ballFlight - .4) / .34, 0, 1) * .82 : 0
      const cover = activeDefense && index === (chaser + 2) % positions.length ? clamp((engine.ballFlight - .55) / .4, 0, 1) * .22 : 0
      const destination = BASES[Math.min(3, Math.max(1, engine.targetBases))]
      const x = chase ? lerp(position.x, landing.x, chase) : cover ? lerp(position.x, destination.x, cover) : position.x
      const y = chase ? lerp(position.y, landing.y + 5, chase) : cover ? lerp(position.y, destination.y, cover) : position.y
      this.drawCharacter(x, y + bob, this.opponentUniform(engine), pose, x > position.x, position.scale, index % 4)
    })
  }

  private drawPitcher(engine: BaseballEngine) {
    const clock = engine.pitchClock
    const pose: CharacterPose = engine.phase === 'pitching'
      ? clock < .25 ? 'windup' : clock < .49 ? 'pitch' : 'ready'
      : 'idle'
    this.drawCharacter(240, 164, this.opponentUniform(engine), pose, true, 1, engine.config.opponent.difficulty % 4)
  }

  private drawBatter(engine: BaseballEngine) {
    const ctx = this.ctx
    const pose: CharacterPose = engine.swingClock > .19 ? 'swingA'
      : engine.swingClock > .1 ? 'swingB'
        : engine.swingClock > 0 ? 'swingC' : 'batReady'
    this.drawCharacter(216, 246, 'home', pose, false, 1.16, engine.batterIndex % 4)
    if (engine.phase !== 'pitching') return
    const distance = Math.abs(engine.pitchClock - CONTACT_TIME)
    if (distance > .19) return
    const radius = 11 + Math.floor((.19 - distance) * 27)
    ctx.strokeStyle = distance < .06 ? '#fff4a6' : '#ffc95e'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
      ctx.beginPath(); ctx.arc(240, 232, radius, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2 + engine.pitchClock * 3
      ctx.fillStyle = '#fff8d0'
      ctx.fillRect(Math.round(240 + Math.cos(angle) * (radius + 5)), Math.round(232 + Math.sin(angle) * (radius + 5)), 2, 2)
    }
  }

  private drawRunner(engine: BaseballEngine) {
    const ctx = this.ctx
    const point = pointOnBasePath(engine.runnerProgress)
    const next = pointOnBasePath(Math.min(engine.targetBases, engine.runnerProgress + .06))
    const runFrames: CharacterPose[] = ['runA', 'runC', 'runB', 'runD']
    const pose: CharacterPose = engine.slideClock > 0 ? 'slide'
      : runFrames[Math.floor(engine.phaseClock * (engine.dashClock > 0 ? 18 : 12)) % runFrames.length]
    if (engine.dashClock > 0 || engine.slideClock > 0) {
      for (let i = 0; i < 4; i++) {
        const dx = (point.x - next.x) * (i + 1) * 4
        const dy = (point.y - next.y) * (i + 1) * 4
        ctx.globalAlpha = .26 - i * .05
        this.characters.draw(ctx, point.x + dx, point.y - 7 + dy, 'home', pose, next.x < point.x, 1.08, engine.batterIndex % 4)
      }
      ctx.globalAlpha = 1
    }
    this.drawCharacter(point.x, point.y - 7, 'home', pose, next.x < point.x, 1.08, engine.batterIndex % 4)
    if (engine.slideClock > 0) for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#e6af79' : '#fff0b5'
      ctx.fillRect(Math.round(point.x - 15 - i * 4), Math.round(point.y + 2 + Math.sin(i * 8) * 3), 3, 3)
    }
  }

  private drawScoringCelebration(engine: BaseballEngine) {
    const ctx = this.ctx
    const runners = engine.scoringRunners
    runners.forEach((runner, index) => {
      const spread = index - (runners.length - 1) / 2
      const x = HOME.x + spread * 32
      const y = HOME.y - 7 - Math.abs(Math.sin(engine.phaseClock * 7 + index * 1.3)) * 4
      this.drawCharacter(x, y, 'home', 'cheer', index % 2 === 0, index === runners.length - 1 ? 1.15 : .95, runner)
      ctx.fillStyle = PLAYER_ACCENTS[runner % 4]
      ctx.fillRect(Math.round(x - 2), Math.round(y - 47 - Math.sin(engine.phaseClock * 5 + index) * 3), 4, 4)
    })
  }

  private opponentUniform(engine: BaseballEngine): Uniform {
    const id = engine.config.opponent.id
    return id === 'comets' || id === 'vipers' || id === 'kings' ? id : 'hounds'
  }

  private drawCharacter(x: number, y: number, uniform: Uniform, pose: CharacterPose, flip = false, scale = 1, variant = 0) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgb(8 25 28 / .34)'
    ctx.beginPath(); ctx.ellipse(x, y + 3, 11 * scale, 3 * scale, 0, 0, Math.PI * 2); ctx.fill()
    this.characters.draw(ctx, x, y, uniform, pose, flip, scale, variant)
  }

  private drawBall(engine: BaseballEngine) {
    if (!['pitching', 'contact', 'fielding', 'running'].includes(engine.phase)) return
    let x = 240, y = 163, height = 0
    if (engine.phase === 'pitching') {
      const progress = clamp(engine.pitchClock / PITCH_DURATION, 0, 1)
      const eased = progress * progress * (3 - 2 * progress)
      x = 240 + Math.sin(progress * Math.PI) * engine.pitchCurve
      y = lerp(164, 238, eased)
      height = Math.sin(progress * Math.PI) * 8
    } else {
      const progress = clamp(engine.ballFlight, 0, 1)
      const side = ((engine.pitchSerial * 71) % 260) - 130
      const landing = { x: 240 + side, y: 92 + (engine.pitchSerial % 3) * 12 }
      const destination = BASES[Math.min(4, engine.targetBases)]
      if (progress < .62) {
        const local = progress / .62
        const eased = 1 - Math.pow(1 - local, 2.4)
        x = lerp(HOME.x, landing.x, eased)
        y = lerp(HOME.y - 12, landing.y, eased)
        height = Math.sin(local * Math.PI) * 76 + local * 7
      } else if (progress < .74) {
        const local = (progress - .62) / .12
        x = landing.x + Math.sin(local * Math.PI * 3) * (1 - local) * 3
        y = landing.y + local * 3
        height = (1 - local) * 7 + Math.abs(Math.sin(local * Math.PI * 2)) * 3
      } else {
        const local = (progress - .74) / .26
        const eased = local * local * (3 - 2 * local)
        x = lerp(landing.x, destination.x, eased)
        y = lerp(landing.y + 3, destination.y, eased)
        height = Math.sin(local * Math.PI) * 24
      }
    }
    const ctx = this.ctx
    const trailPhase = `${engine.pitchSerial}:${engine.phase}`
    if (trailPhase !== this.ballTrailPhase) {
      this.ballTrail = []
      this.ballTrailPhase = trailPhase
    }
    this.ballTrail.push({ x, y, height })
    if (this.ballTrail.length > 12) this.ballTrail.shift()

    ctx.fillStyle = 'rgb(4 25 25 / .4)'
    ctx.beginPath(); ctx.ellipse(x, y + 3, 6, 2, 0, 0, Math.PI * 2); ctx.fill()
    for (let index = Math.max(0, this.ballTrail.length - 10); index < this.ballTrail.length - 2; index += 2) {
      const point = this.ballTrail[index]
      const age = (index + 2) / this.ballTrail.length
      ctx.globalAlpha = age * .32
      ctx.fillStyle = engine.phase === 'pitching' ? '#d9f4ec' : '#ffe09a'
      ctx.beginPath(); ctx.arc(point.x, point.y - point.height, 1.4 + age, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
    ctx.fillStyle = '#202a36'; ctx.beginPath(); ctx.arc(x, y - height, 4.3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff9e4'; ctx.beginPath(); ctx.arc(x, y - height, 3.3, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#e05d69'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x - 1, y - height, 1.8, -1.2, 1.2); ctx.stroke()
  }

  private drawEffects(engine: BaseballEngine) {
    const ctx = this.ctx
    if (engine.phase === 'contact' && engine.phaseClock < .58) {
      const progress = engine.phaseClock / .58
      const strength = engine.grade === 'perfect' ? 1 : .6
      ctx.save()
      ctx.globalAlpha = (1 - progress) * strength
      ctx.strokeStyle = PLAYER_ACCENTS[engine.batterIndex % 4]; ctx.lineWidth = 2
      for (let ray = 0; ray < 12; ray++) {
        const angle = ray * Math.PI / 6
        const start = 11 + progress * 15
        const end = start + 8 + strength * 5
        ctx.beginPath()
        ctx.moveTo(240 + Math.cos(angle) * start, 232 + Math.sin(angle) * start)
        ctx.lineTo(240 + Math.cos(angle) * end, 232 + Math.sin(angle) * end)
        ctx.stroke()
      }
      ctx.restore()
    }
    if (engine.phase === 'call' && engine.runsThisPlay > 0) {
      for (let i = 0; i < 18; i++) {
        const x = seeded(i * 11 + engine.pitchSerial) * 460 + 10
        const y = 50 + seeded(i * 29) * 170 + engine.phaseClock * 22
        ctx.fillStyle = i % 2 ? '#ffe27e' : PLAYER_ACCENTS[engine.scoringRunners[i % engine.scoringRunners.length] % 4]
        ctx.fillRect(Math.floor(x), Math.floor(y % 270), 3, 5)
      }
    }
  }

  private overlay(title: string, detail: string) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgb(7 19 31 / .75)'; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#fff0c7'; ctx.font = '900 30px monospace'; ctx.fillText(title, 240, 127)
    ctx.fillStyle = '#59f3d9'; ctx.font = '900 10px monospace'; ctx.fillText(detail, 240, 151)
  }

  private present(engine: BaseballEngine) {
    const cssWidth = Math.max(1, this.canvas.clientWidth)
    const cssHeight = Math.max(1, this.canvas.clientHeight)
    // The scene is intentionally rendered at GBA-like resolution; a large DPR only burns fill-rate.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const width = Math.round(cssWidth * dpr), height = Math.round(cssHeight * dpr)
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width; this.canvas.height = height
    }
    const ctx = this.output
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#0b2335'; ctx.fillRect(0, 0, width, height)

    const portrait = height > width * 1.1
    let desiredZoom = 1
    let desiredX = WORLD.width / 2
    let desiredY = WORLD.height / 2
    if (!portrait) {
      if (engine.phase === 'ready' || engine.phase === 'pitching') {
        desiredZoom = engine.slowMotion ? 1.29 : 1.13
        desiredY = engine.slowMotion ? 199 : 176
      }
      else if (engine.phase === 'contact') { desiredZoom = 1.22; desiredY = 202 }
      else if (engine.phase === 'fielding') { desiredZoom = 1.03; desiredY = 135 }
      else if (engine.phase === 'running') {
        const runner = pointOnBasePath(engine.runnerProgress)
        desiredZoom = 1.09
        desiredX = lerp(240, runner.x, .34)
        desiredY = lerp(144, runner.y, .34)
      } else if (engine.phase === 'call') {
        desiredZoom = engine.runsThisPlay ? 1.24 : 1.08
        desiredY = engine.runsThisPlay ? 211 : 165
      }
    }
    this.cameraZoom = lerp(this.cameraZoom, desiredZoom, engine.slowMotion ? .11 : .075)
    this.cameraX = lerp(this.cameraX, desiredX, .08)
    this.cameraY = lerp(this.cameraY, desiredY, .08)

    const scale = portrait ? Math.min(width / 278, height / 350) : Math.max(width / WORLD.width, height / WORLD.height)
    const zoom = portrait ? 1 : this.cameraZoom
    const targetWidth = Math.round(WORLD.width * scale * zoom)
    const targetHeight = Math.round(WORLD.height * scale * zoom)
    const left = portrait ? Math.round((width - targetWidth) / 2) : Math.round(width / 2 - this.cameraX * scale * zoom)
    const top = portrait ? Math.round((height - targetHeight) / 2 + height * .025) : Math.round(height / 2 - this.cameraY * scale * zoom)

    if (portrait) {
      ctx.fillStyle = '#122f43'; ctx.fillRect(0, 0, width, Math.max(0, top))
      for (let row = 0; row < 8; row++) {
        const y = Math.round((top - row * 22 * dpr))
        ctx.fillStyle = row % 2 ? '#15394b' : '#1b4550'
        ctx.fillRect(0, y, width, 10 * dpr)
        for (let x = 0; x < width; x += 17 * dpr) {
          ctx.fillStyle = seeded(row * 100 + x) > .5 ? '#edaf82' : '#72c3b7'
          ctx.fillRect(x + 3 * dpr, y + 2 * dpr, 4 * dpr, 3 * dpr)
        }
      }
      ctx.fillStyle = '#102c3c'; ctx.fillRect(0, top + targetHeight, width, height)
      ctx.fillStyle = '#276052'; ctx.fillRect(0, top + targetHeight, width, 8 * dpr)
    }

    const shake = engine.phase === 'contact' && engine.phaseClock < .2 && engine.grade === 'perfect'
      ? Math.round(Math.sin(engine.phaseClock * 130) * 3 * dpr) : 0
    ctx.drawImage(this.scene, left + shake, top, targetWidth, targetHeight)
    if (portrait) {
      ctx.fillStyle = '#ffe59c'; ctx.font = `900 ${Math.round(13 * dpr)}px monospace`; ctx.textAlign = 'center'
      ctx.fillText('NEON LEAGUE  ★  ONE TOUCH', width / 2, Math.max(68 * dpr, top - 16 * dpr))
      ctx.strokeStyle = '#d4ba75'; ctx.lineWidth = 2 * dpr
      ctx.strokeRect(16 * dpr, top - 43 * dpr, width - 32 * dpr, 35 * dpr)
    }
  }
}

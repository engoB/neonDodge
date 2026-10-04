import type { BaseballEngine } from './engine'
import { BASES, clamp, CONTACT_TIME, HOME, lerp, PITCH_DURATION, pointOnBasePath, WORLD } from './rules'

export class BaseballRenderer {
  private ctx: CanvasRenderingContext2D

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = WORLD.width
    canvas.height = WORLD.height
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.ctx.imageSmoothingEnabled = false
  }

  render(engine: BaseballEngine) {
    this.drawField()
    this.drawFielders(engine)
    this.drawBases(engine)
    this.drawPitcher(engine)
    if (engine.phase === 'running') this.drawRunner(engine)
    else this.drawBatter(engine)
    this.drawBall(engine)
    if (engine.phase === 'paused') this.overlay('PAUSE', 'Touche pour reprendre')
  }

  private drawField() {
    const ctx = this.ctx
    const sky = ctx.createLinearGradient(0, 0, 0, WORLD.height)
    sky.addColorStop(0, '#082c37')
    sky.addColorStop(1, '#07151d')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)

    ctx.fillStyle = '#19704d'
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(20, 92)
    ctx.quadraticCurveTo(240, -40, 460, 92)
    ctx.closePath()
    ctx.fill()

    ctx.save()
    ctx.clip()
    ctx.globalAlpha = .12
    ctx.strokeStyle = '#9fea82'
    ctx.lineWidth = 13
    for (let x = -180; x < 660; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + 270, 270)
      ctx.stroke()
    }
    ctx.restore()

    ctx.fillStyle = '#b77a48'
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(BASES[1].x, BASES[1].y)
    ctx.lineTo(BASES[2].x, BASES[2].y)
    ctx.lineTo(BASES[3].x, BASES[3].y)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#286a45'
    ctx.beginPath()
    ctx.moveTo(240, 218)
    ctx.lineTo(325, 168)
    ctx.lineTo(240, 108)
    ctx.lineTo(155, 168)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#fff0c7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(20, 92)
    ctx.moveTo(HOME.x, HOME.y)
    ctx.lineTo(460, 92)
    ctx.stroke()

    ctx.fillStyle = '#9e653e'
    ctx.beginPath()
    ctx.ellipse(240, 149, 25, 12, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff0c7'
    ctx.fillRect(233, 147, 14, 3)
  }

  private drawBases(engine: BaseballEngine) {
    const ctx = this.ctx
    for (let index = 1; index <= 3; index++) {
      const base = BASES[index]
      ctx.save()
      ctx.translate(base.x, base.y)
      ctx.rotate(Math.PI / 4)
      ctx.fillStyle = '#fff4d3'
      ctx.fillRect(-6, -6, 12, 12)
      ctx.strokeStyle = '#633d2b'
      ctx.strokeRect(-6, -6, 12, 12)
      ctx.restore()
      if (engine.bases[index - 1]) this.drawPerson(base.x, base.y - 7, '#ffc857', 1, false)
    }
    ctx.fillStyle = '#fff4d3'
    ctx.beginPath()
    ctx.moveTo(232, 232); ctx.lineTo(248, 232); ctx.lineTo(246, 241); ctx.lineTo(234, 241); ctx.closePath(); ctx.fill()
  }

  private drawFielders(engine: BaseballEngine) {
    const positions = [
      { x: 345, y: 146 }, { x: 135, y: 146 }, { x: 240, y: 74 },
      { x: 77, y: 90 }, { x: 403, y: 90 }, { x: 238, y: 38 },
    ]
    positions.forEach((position, index) => {
      const bob = Math.sin(engine.phaseClock * 5 + index) * 1.5
      this.drawPerson(position.x, position.y + bob, '#ff5c70', index < 3 ? -1 : 1, false)
    })
  }

  private drawPitcher(engine: BaseballEngine) {
    const windup = engine.phase === 'pitching' ? Math.sin(clamp(engine.pitchClock / .32, 0, 1) * Math.PI) * 4 : 0
    this.drawPerson(240, 144 - windup, '#ff5c70', -1, false)
  }

  private drawBatter(engine: BaseballEngine) {
    this.drawPerson(218, 224, '#2ee6d6', 1, false)
    const ctx = this.ctx
    ctx.save()
    ctx.translate(219, 207)
    const swingProgress = engine.swingClock > 0 ? 1 - engine.swingClock / .22 : 0
    ctx.rotate(engine.swingClock > 0 ? -1.2 + swingProgress * 2.4 : -.72)
    ctx.strokeStyle = '#ffc857'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(27, -2); ctx.stroke()
    ctx.restore()

    if (engine.phase === 'pitching' && Math.abs(engine.pitchClock - CONTACT_TIME) < .19) {
      const pulse = 1 + Math.sin(engine.pitchClock * 38) * .08
      ctx.strokeStyle = 'rgb(255 200 87 / .8)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(240, 221, 13 * pulse, 0, Math.PI * 2); ctx.stroke()
    }
  }

  private drawRunner(engine: BaseballEngine) {
    const position = pointOnBasePath(engine.runnerProgress)
    const next = pointOnBasePath(Math.min(engine.targetBases, engine.runnerProgress + .04))
    const facing = next.x >= position.x ? 1 : -1
    this.drawPerson(position.x, position.y - 7, '#2ee6d6', facing, engine.slideClock > 0)
  }

  private drawPerson(x: number, y: number, color: string, facing: number, sliding: boolean) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(Math.round(x), Math.round(y))
    ctx.scale(facing, 1)
    ctx.fillStyle = 'rgb(0 0 0 / .28)'
    ctx.beginPath(); ctx.ellipse(0, 7, sliding ? 13 : 8, 3, 0, 0, Math.PI * 2); ctx.fill()
    if (sliding) {
      ctx.fillStyle = color
      ctx.fillRect(-10, -3, 18, 7)
      ctx.fillStyle = '#ffd2a8'
      ctx.fillRect(7, -6, 7, 7)
      ctx.restore()
      return
    }
    ctx.fillStyle = color
    ctx.fillRect(-6, -14, 12, 18)
    ctx.fillStyle = '#ffd2a8'
    ctx.fillRect(-5, -23, 10, 9)
    ctx.fillStyle = color
    ctx.fillRect(-7, -25, 12, 4)
    ctx.fillStyle = '#07151d'
    ctx.fillRect(1, -20, 2, 2)
    ctx.fillStyle = '#fff0c7'
    ctx.fillRect(-6, 4, 5, 7)
    ctx.fillRect(2, 4, 5, 7)
    ctx.restore()
  }

  private drawBall(engine: BaseballEngine) {
    if (engine.phase === 'ready' || engine.phase === 'result' || engine.phase === 'gameover') return
    let x = 240, y = 142, height = 0
    if (engine.phase === 'pitching') {
      const progress = clamp(engine.pitchClock / PITCH_DURATION, 0, 1)
      const eased = progress * progress * (3 - 2 * progress)
      x = 240 + Math.sin(progress * Math.PI) * engine.pitchCurve
      y = lerp(143, 224, eased)
      height = Math.sin(progress * Math.PI) * 8
    } else if (engine.phase === 'running') {
      const progress = clamp(engine.phaseClock / engine.fieldDeadline, 0, 1)
      const side = ((engine.pitchSerial * 71) % 260) - 130
      const landing = { x: 240 + side, y: 48 + (engine.pitchSerial % 3) * 18 }
      const destination = BASES[Math.min(4, engine.targetBases)]
      if (progress < .56) {
        const local = progress / .56
        x = lerp(HOME.x, landing.x, local)
        y = lerp(HOME.y - 12, landing.y, local)
        height = Math.sin(local * Math.PI) * 72
      } else {
        const local = (progress - .56) / .44
        x = lerp(landing.x, destination.x, local)
        y = lerp(landing.y, destination.y, local)
        height = Math.sin(local * Math.PI) * 18
      }
    }

    const ctx = this.ctx
    ctx.fillStyle = 'rgb(0 0 0 / .25)'
    ctx.beginPath(); ctx.ellipse(x, y + 3, 5, 2, 0, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#fff7df'
    ctx.beginPath(); ctx.arc(x, y - height, 4, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#d94255'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.arc(x, y - height, 3, -.8, .8); ctx.stroke()
  }

  private overlay(title: string, detail: string) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgb(4 13 19 / .76)'; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff0c7'; ctx.font = '900 28px system-ui'; ctx.fillText(title, 240, 130)
    ctx.fillStyle = '#2ee6d6'; ctx.font = '700 12px system-ui'; ctx.fillText(detail, 240, 153)
  }
}

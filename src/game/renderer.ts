import type { DodgeEngine } from './engine'
import { COURT, WORLD } from './rules'
import type { Player } from './types'

const spriteX = [8, 350, 610, 755, 1025, 1280]
const actionY: Record<Player['action'], number> = { idle: 0, run: 175, throw: 335, hit: 500, victory: 670 }

export class DodgeRenderer {
  private ctx: CanvasRenderingContext2D
  private atlas = new Image()
  private atlasReady = false

  constructor(private canvas: HTMLCanvasElement) {
    canvas.width = WORLD.width
    canvas.height = WORLD.height
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.ctx.imageSmoothingEnabled = false
    this.atlas.onload = () => { this.atlasReady = true }
    this.atlas.src = `${import.meta.env.BASE_URL}assets/arena-atlas.png`
  }

  render(engine: DodgeEngine) {
    const ctx = this.ctx
    ctx.fillStyle = '#07111f'
    ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    this.drawCourt()
    for (const p of engine.players.filter((player) => player.active).sort((a, b) => a.y - b.y)) this.drawPlayer(p)
    this.drawBall(engine)
    if (engine.status === 'paused') this.overlay('PAUSE', 'Échap pour reprendre')
  }

  private drawCourt() {
    const ctx = this.ctx
    ctx.fillStyle = '#12344a'
    ctx.fillRect(COURT.left, COURT.top, COURT.right - COURT.left, COURT.bottom - COURT.top)
    ctx.fillStyle = '#17475a'
    ctx.fillRect(COURT.left + 5, COURT.top + 5, COURT.middle - COURT.left - 10, COURT.bottom - COURT.top - 10)
    ctx.fillStyle = '#5b293b'
    ctx.fillRect(COURT.middle + 5, COURT.top + 5, COURT.right - COURT.middle - 10, COURT.bottom - COURT.top - 10)
    ctx.strokeStyle = '#fff0c7'
    ctx.lineWidth = 2
    ctx.strokeRect(COURT.left, COURT.top, COURT.right - COURT.left, COURT.bottom - COURT.top)
    ctx.setLineDash([5, 4])
    ctx.beginPath(); ctx.moveTo(COURT.middle, COURT.top); ctx.lineTo(COURT.middle, COURT.bottom); ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = .12
    for (let y = COURT.top + 14; y < COURT.bottom; y += 18) {
      ctx.fillStyle = '#fff0c7'; ctx.fillRect(COURT.left + 2, y, COURT.right - COURT.left - 4, 1)
    }
    ctx.globalAlpha = 1
  }

  private drawPlayer(player: Player) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(Math.round(player.x), Math.round(player.y))
    ctx.fillStyle = 'rgb(0 0 0 / .32)'
    ctx.beginPath(); ctx.ellipse(0, 6, 16, 5, 0, 0, Math.PI * 2); ctx.fill()
    if (player.hitFlash > 0) ctx.globalAlpha = .35
    if (this.atlasReady) {
      const index = player.team === 'azure' ? player.slot : player.slot + 3
      const flip = player.facing < 0 ? -1 : 1
      ctx.scale(flip, 1)
      ctx.drawImage(this.atlas, spriteX[index], actionY[player.action], 100, 165, -22, -55, 44, 72)
    } else {
      ctx.fillStyle = player.team === 'azure' ? '#2ee6d6' : '#ff4f64'
      ctx.beginPath(); ctx.arc(0, -16, 10, 0, Math.PI * 2); ctx.fill()
      ctx.fillRect(-9, -6, 18, 24)
    }
    ctx.restore()
    for (let i = 0; i < player.hp; i++) {
      ctx.fillStyle = player.team === 'azure' ? '#2ee6d6' : '#ff4f64'
      ctx.fillRect(Math.round(player.x - 8 + i * 9), Math.round(player.y - 59), 7, 3)
    }
  }

  private drawBall(engine: DodgeEngine) {
    const ctx = this.ctx, ball = engine.ball
    if (!ball.ownerId) {
      ball.trail.forEach((point, i) => {
        ctx.globalAlpha = Math.max(0, .24 - i * .035)
        ctx.fillStyle = '#2ee6d6'; ctx.beginPath(); ctx.arc(point.x, point.y - ball.z, 5 - i * .45, 0, Math.PI * 2); ctx.fill()
      })
      ctx.globalAlpha = 1
    }
    ctx.fillStyle = 'rgb(0 0 0 / .3)'; ctx.beginPath(); ctx.ellipse(ball.x, ball.y + 5, 7, 3, 0, 0, Math.PI * 2); ctx.fill()
    const y = ball.y - ball.z
    ctx.fillStyle = '#fff0c7'; ctx.beginPath(); ctx.arc(ball.x, y, 7, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ff4f64'; ctx.beginPath(); ctx.arc(ball.x - 2, y, 5, -.9, .9); ctx.fill()
    ctx.strokeStyle = '#7b1534'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ball.x, y, 7, 0, Math.PI * 2); ctx.stroke()
  }

  private overlay(title: string, detail: string) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgb(7 17 31 / .75)'; ctx.fillRect(0, 0, WORLD.width, WORLD.height)
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff0c7'; ctx.font = '900 28px system-ui'; ctx.fillText(title, 240, 130)
    ctx.fillStyle = '#2ee6d6'; ctx.font = '600 12px system-ui'; ctx.fillText(detail, 240, 154)
  }
}

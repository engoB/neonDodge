import { clamp, COURT, distance, MATCH_SECONDS, PLAYER_SPEED, teamHp, THROW_SPEED, winnerFrom } from './rules'
import type { Ball, Controls, MatchSnapshot, MatchStatus, Player, Team } from './types'

const emptyControls = (): Controls => ({ up: false, down: false, left: false, right: false, throw: false, catch: false, pass: false, pause: false })

export class DodgeEngine {
  players: Player[] = []
  ball!: Ball
  timeLeft = MATCH_SECONDS
  status: MatchStatus = 'playing'
  message = 'À toi de jouer !'
  private previous = emptyControls()
  private messageClock = 1.8

  constructor() { this.reset() }

  reset() {
    const make = (team: Team, slot: number, x: number, y: number): Player => ({
      id: `${team}-${slot}`, team, slot, x, y, vx: 0, vy: 0,
      facing: team === 'azure' ? 1 : -1, hp: 2, active: true,
      hasBall: false, cooldown: 0, hitFlash: 0, aiClock: .3 + slot * .25, action: 'idle',
    })
    this.players = [
      make('azure', 0, 145, 145), make('azure', 1, 92, 92), make('azure', 2, 92, 204),
      make('coral', 0, 335, 145), make('coral', 1, 390, 92), make('coral', 2, 390, 204),
    ]
    this.ball = { x: 145, y: 145, z: 18, vx: 0, vy: 0, vz: 0, ownerId: 'azure-0', lastTeam: 'azure', pickupDelay: 0, trail: [] }
    this.players[0].hasBall = true
    this.timeLeft = MATCH_SECONDS
    this.status = 'playing'
    this.message = 'À toi de jouer !'
    this.messageClock = 1.8
    this.previous = emptyControls()
  }

  togglePause() {
    if (this.status === 'playing') this.status = 'paused'
    else if (this.status === 'paused') this.status = 'playing'
  }

  update(dt: number, controls: Controls) {
    const pressed = (key: keyof Controls) => controls[key] && !this.previous[key]
    if (pressed('pause')) this.togglePause()
    if (this.status !== 'playing') { this.previous = { ...controls }; return }

    this.timeLeft = Math.max(0, this.timeLeft - dt)
    this.messageClock -= dt
    for (const player of this.players) {
      player.cooldown = Math.max(0, player.cooldown - dt)
      player.hitFlash = Math.max(0, player.hitFlash - dt)
      if (!player.active) continue
      if (player.id === 'azure-0') this.updateUser(player, dt, controls, pressed)
      else this.updateAi(player, dt)
      this.movePlayer(player, dt)
    }
    this.updateBall(dt, controls)
    this.resolvePlayerSeparation()
    this.resolveEnd()
    this.previous = { ...controls }
  }

  private updateUser(player: Player, _dt: number, controls: Controls, pressed: (key: keyof Controls) => boolean) {
    const dx = Number(controls.right) - Number(controls.left)
    const dy = Number(controls.down) - Number(controls.up)
    const length = Math.hypot(dx, dy) || 1
    player.vx = dx / length * PLAYER_SPEED
    player.vy = dy / length * PLAYER_SPEED
    if (dx) player.facing = Math.sign(dx)
    player.action = dx || dy ? 'run' : 'idle'
    if (player.hasBall && pressed('throw')) this.throwBall(player, dx || player.facing, dy)
    if (player.hasBall && pressed('pass')) this.passBall(player)
  }

  private updateAi(player: Player, dt: number) {
    player.aiClock -= dt
    const target = this.aiTarget(player)
    const dx = target.x - player.x
    const dy = target.y - player.y
    const length = Math.hypot(dx, dy) || 1
    const slow = length < 8 ? 0 : 1
    player.vx = dx / length * PLAYER_SPEED * .72 * slow
    player.vy = dy / length * PLAYER_SPEED * .72 * slow
    if (dx) player.facing = Math.sign(dx)
    player.action = slow ? 'run' : 'idle'
    if (player.hasBall && player.aiClock <= 0) {
      const enemies = this.players.filter((other) => other.active && other.team !== player.team)
      const victim = enemies.sort((a, b) => distance(player, a) - distance(player, b))[0]
      if (victim) this.throwBall(player, victim.x - player.x, victim.y - player.y)
      player.aiClock = .9 + Math.random() * .8
    }
  }

  private aiTarget(player: Player) {
    if (player.hasBall) return { x: player.team === 'azure' ? 184 : 296, y: 90 + player.slot * 55 }
    if (!this.ball.ownerId && this.ball.pickupDelay <= 0) return this.ball
    const jitter = Math.sin(this.timeLeft * .8 + player.slot) * 18
    return { x: player.team === 'azure' ? 120 + player.slot * 24 : 360 - player.slot * 24, y: 90 + player.slot * 56 + jitter }
  }

  private movePlayer(player: Player, dt: number) {
    player.x += player.vx * dt
    player.y += player.vy * dt
    const side = player.team === 'azure'
      ? { min: COURT.left + 12, max: COURT.middle - 14 }
      : { min: COURT.middle + 14, max: COURT.right - 12 }
    player.x = clamp(player.x, side.min, side.max)
    player.y = clamp(player.y, COURT.top + 14, COURT.bottom - 10)
  }

  private throwBall(player: Player, dx: number, dy: number) {
    if (!player.hasBall || player.cooldown > 0) return
    const length = Math.hypot(dx, dy) || 1
    player.hasBall = false
    player.cooldown = .35
    player.action = 'throw'
    this.ball.ownerId = null
    this.ball.lastTeam = player.team
    this.ball.pickupDelay = .15
    this.ball.x = player.x + dx / length * 14
    this.ball.y = player.y + dy / length * 8
    this.ball.z = 19
    this.ball.vx = dx / length * THROW_SPEED
    this.ball.vy = dy / length * THROW_SPEED
    this.ball.vz = 26
    this.message = 'Tir chargé !'
    this.messageClock = .7
  }

  private passBall(player: Player) {
    const mate = this.players
      .filter((other) => other.active && other.team === player.team && other.id !== player.id)
      .sort((a, b) => distance(player, a) - distance(player, b))[0]
    if (mate) this.throwBall(player, mate.x - player.x, mate.y - player.y)
  }

  private updateBall(dt: number, controls: Controls) {
    this.ball.pickupDelay = Math.max(0, this.ball.pickupDelay - dt)
    const owner = this.players.find((player) => player.id === this.ball.ownerId)
    if (owner) {
      this.ball.x = owner.x + owner.facing * 12
      this.ball.y = owner.y - 4
      this.ball.z = 18
      this.ball.trail = []
      return
    }

    this.ball.trail.unshift({ x: this.ball.x, y: this.ball.y })
    this.ball.trail = this.ball.trail.slice(0, 6)
    this.ball.x += this.ball.vx * dt
    this.ball.y += this.ball.vy * dt
    this.ball.z += this.ball.vz * dt
    this.ball.vz -= 70 * dt
    this.ball.vx *= Math.pow(.992, dt * 60)
    this.ball.vy *= Math.pow(.992, dt * 60)

    if (this.ball.z <= 0) {
      this.ball.z = 0
      this.ball.vz = Math.abs(this.ball.vz) * .45
      this.ball.vx *= .86
      this.ball.vy *= .86
    }
    if (this.ball.y < COURT.top || this.ball.y > COURT.bottom) {
      this.ball.y = clamp(this.ball.y, COURT.top, COURT.bottom)
      this.ball.vy *= -.72
    }
    if (this.ball.x < COURT.left || this.ball.x > COURT.right) {
      this.ball.x = clamp(this.ball.x, COURT.left, COURT.right)
      this.ball.vx *= -.72
    }

    const speed = Math.hypot(this.ball.vx, this.ball.vy)
    for (const player of this.players) {
      if (!player.active || distance(player, this.ball) > 15 || this.ball.z > 28 || this.ball.pickupDelay > 0) continue
      const userCatch = player.id === 'azure-0' && controls.catch
      const aiCatch = player.id !== 'azure-0' && Math.random() < .025
      if (speed < 75 || userCatch || aiCatch || player.team === this.ball.lastTeam) {
        this.giveBall(player)
        this.message = userCatch || aiCatch ? 'Interception !' : 'Ballon récupéré'
        this.messageClock = .9
        return
      }
      if (player.team !== this.ball.lastTeam) {
        player.hp = Math.max(0, player.hp - 1)
        player.hitFlash = .35
        player.action = 'hit'
        player.active = player.hp > 0
        this.ball.vx *= -.35
        this.ball.vy *= -.35
        this.ball.vz = 22
        this.ball.pickupDelay = .25
        this.message = player.active ? 'Touché !' : 'Éliminé !'
        this.messageClock = 1.1
        return
      }
    }
  }

  private giveBall(player: Player) {
    for (const other of this.players) other.hasBall = false
    player.hasBall = true
    this.ball.ownerId = player.id
    this.ball.lastTeam = player.team
    this.ball.vx = 0
    this.ball.vy = 0
    this.ball.vz = 0
  }

  private resolvePlayerSeparation() {
    for (let i = 0; i < this.players.length; i++) for (let j = i + 1; j < this.players.length; j++) {
      const a = this.players[i], b = this.players[j]
      if (!a.active || !b.active || a.team !== b.team) continue
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy)
      if (d > 0 && d < 20) { const push = (20 - d) / 2; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push }
    }
  }

  private resolveEnd() {
    const winner = winnerFrom(this.players)
    if (winner) {
      this.status = winner === 'azure' ? 'won' : 'lost'
      this.message = winner === 'azure' ? 'Victoire !' : 'Défaite'
      this.players.filter((p) => p.team === winner).forEach((p) => { p.action = 'victory' })
      return
    }
    if (this.timeLeft <= 0) {
      const azure = teamHp(this.players, 'azure'), coral = teamHp(this.players, 'coral')
      this.status = azure >= coral ? 'won' : 'lost'
      this.message = azure >= coral ? 'Victoire au score !' : 'Temps écoulé'
    }
  }

  snapshot(): MatchSnapshot {
    return {
      status: this.status,
      timeLeft: this.timeLeft,
      azureHp: teamHp(this.players, 'azure'),
      coralHp: teamHp(this.players, 'coral'),
      possession: this.ball.ownerId ? this.players.find((p) => p.id === this.ball.ownerId)?.team ?? null : null,
      message: this.messageClock > 0 ? this.message : '',
    }
  }
}

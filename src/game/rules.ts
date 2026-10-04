import type { ActionCue, GamePhase, HitGrade, Vec2 } from './types'

export const WORLD = { width: 480, height: 270 } as const
export const HOME: Vec2 = { x: 240, y: 236 }
export const BASES: readonly Vec2[] = [
  HOME,
  { x: 348, y: 169 },
  { x: 240, y: 91 },
  { x: 132, y: 169 },
  HOME,
]
export const PITCH_DURATION = 1.05
export const CONTACT_TIME = .78
export const RUN_SPEED = .62

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const lerp = (a: number, b: number, amount: number) => a + (b - a) * amount

export function pointOnBasePath(progress: number): Vec2 {
  const safe = clamp(progress, 0, 4)
  const segment = Math.min(3, Math.floor(safe))
  const local = safe - segment
  return {
    x: lerp(BASES[segment].x, BASES[segment + 1].x, local),
    y: lerp(BASES[segment].y, BASES[segment + 1].y, local),
  }
}

export function gradeSwing(pitchClock: number): Exclude<HitGrade, null> {
  const error = Math.abs(pitchClock - CONTACT_TIME)
  if (error <= .055) return 'perfect'
  if (error <= .13) return 'good'
  if (error <= .2) return 'foul'
  return 'miss'
}

export function actionCue(phase: GamePhase, pitchClock: number, runnerProgress: number, dashCooldown: number): ActionCue {
  if (phase === 'paused') return 'REPRENDS'
  if (phase === 'gameover') return 'REJOUE'
  if (phase === 'ready' || phase === 'result') return 'JOUE'
  if (phase === 'pitching') return Math.abs(pitchClock - CONTACT_TIME) < .19 ? 'FRAPPE' : 'ATTENDS'
  const distanceToBase = Math.ceil(runnerProgress) - runnerProgress
  if (distanceToBase > 0 && distanceToBase < .26) return 'GLISSE'
  return dashCooldown <= 0 ? 'ACCÉLÈRE' : 'ATTENDS'
}

export function advanceBases(current: [boolean, boolean, boolean], gained: number) {
  const next: [boolean, boolean, boolean] = [false, false, false]
  let runs = gained >= 4 ? 1 : 0
  for (let index = 2; index >= 0; index--) {
    if (!current[index]) continue
    const destination = index + gained
    if (destination >= 3) runs++
    else next[destination] = true
  }
  if (gained < 4) next[gained - 1] = true
  return { bases: next, runs }
}

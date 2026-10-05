import type { ActionCue, GamePhase, HitGrade, Vec2 } from './types'

export const WORLD = { width: 480, height: 270 } as const
export const HOME: Vec2 = { x: 240, y: 240 }
export const BASES: readonly Vec2[] = [
  HOME,
  { x: 391, y: 159 },
  { x: 240, y: 134 },
  { x: 89, y: 159 },
  HOME,
]
export const PITCH_DURATION = 1.32
export const CONTACT_TIME = .98
export const RUN_SPEED = .6

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
  if (error <= .058) return 'perfect'
  if (error <= .14) return 'good'
  if (error <= .22) return 'foul'
  return 'miss'
}

export function actionCue(phase: GamePhase, pitchClock: number, runnerProgress: number, dashCooldown: number): ActionCue {
  if (phase === 'paused') return 'REPRENDS'
  if (phase === 'gameover') return 'TERMINÉ'
  if (phase === 'walkup' || phase === 'call' || phase === 'inning_break') return 'CONTINUE'
  if (phase === 'ready' || phase === 'contact' || phase === 'fielding') return 'ATTENDS'
  if (phase === 'pitching') return Math.abs(pitchClock - CONTACT_TIME) < .23 ? 'FRAPPE' : 'ATTENDS'
  const distanceToBase = Math.ceil(runnerProgress) - runnerProgress
  if (distanceToBase > 0 && distanceToBase < .25) return 'GLISSE'
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

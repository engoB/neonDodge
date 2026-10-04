import type { Player, Team } from './types'

export const WORLD = { width: 480, height: 270 } as const
export const COURT = { left: 24, right: 456, top: 48, bottom: 246, middle: 240 } as const
export const PLAYER_SPEED = 90
export const THROW_SPEED = 210
export const MATCH_SECONDS = 90

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
export const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

export function teamHp(players: Player[], team: Team) {
  return players.filter((player) => player.team === team).reduce((sum, player) => sum + player.hp, 0)
}

export function winnerFrom(players: Player[]): Team | null {
  const azure = teamHp(players, 'azure')
  const coral = teamHp(players, 'coral')
  if (azure <= 0) return 'coral'
  if (coral <= 0) return 'azure'
  return null
}

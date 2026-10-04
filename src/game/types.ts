export type Team = 'azure' | 'coral'
export type MatchStatus = 'playing' | 'paused' | 'won' | 'lost'

export interface Vec2 { x: number; y: number }

export interface Player {
  id: string
  team: Team
  slot: number
  x: number
  y: number
  vx: number
  vy: number
  facing: number
  hp: number
  active: boolean
  hasBall: boolean
  cooldown: number
  hitFlash: number
  aiClock: number
  action: 'idle' | 'run' | 'throw' | 'hit' | 'victory'
}

export interface Ball {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  ownerId: string | null
  lastTeam: Team | null
  pickupDelay: number
  trail: Vec2[]
}

export interface MatchSnapshot {
  status: MatchStatus
  timeLeft: number
  azureHp: number
  coralHp: number
  possession: Team | null
  message: string
}

export interface Controls {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  throw: boolean
  catch: boolean
  pass: boolean
  pause: boolean
}

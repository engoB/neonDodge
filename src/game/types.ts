export type GameMode = 'story' | 'arcade' | 'training'

export type GamePhase =
  | 'walkup'
  | 'ready'
  | 'pitching'
  | 'contact'
  | 'fielding'
  | 'running'
  | 'call'
  | 'inning_break'
  | 'paused'
  | 'gameover'

export type HitGrade = 'perfect' | 'good' | 'foul' | 'miss' | null
export type ActionCue = 'CONTINUE' | 'ATTENDS' | 'FRAPPE' | 'ACCÉLÈRE' | 'GLISSE' | 'REPRENDS' | 'TERMINÉ'

export interface Vec2 { x: number; y: number }

export interface TeamProfile {
  id: string
  name: string
  city: string
  shortName: string
  primary: string
  accent: string
  difficulty: number
  motto: string
}

export interface BatterProfile {
  name: string
  number: number
  role: string
  skill: 'speed' | 'power' | 'contact' | 'clutch'
}

export interface MatchConfig {
  mode: GameMode
  opponent: TeamProfile
  maxInnings: number
}

export interface BaseballSnapshot {
  phase: GamePhase
  mode: GameMode
  inning: number
  maxInnings: number
  score: number
  rivalScore: number
  hits: number
  outs: number
  strikes: number
  bases: [boolean, boolean, boolean]
  baseRunners: [number | null, number | null, number | null]
  scoringRunners: number[]
  runsThisPlay: number
  pitchProgress: number
  slowMotion: boolean
  cue: ActionCue
  message: string
  subMessage: string
  grade: HitGrade
  batter: BatterProfile
  opponent: TeamProfile
  playLabel: string
  won: boolean | null
}

export type GamePhase = 'ready' | 'pitching' | 'running' | 'result' | 'paused' | 'gameover'
export type HitGrade = 'perfect' | 'good' | 'foul' | 'miss' | null
export type ActionCue = 'JOUE' | 'ATTENDS' | 'FRAPPE' | 'ACCÉLÈRE' | 'GLISSE' | 'REPRENDS' | 'REJOUE'

export interface Vec2 { x: number; y: number }

export interface BaseballSnapshot {
  phase: GamePhase
  score: number
  hits: number
  outs: number
  strikes: number
  bases: [boolean, boolean, boolean]
  cue: ActionCue
  message: string
  grade: HitGrade
}

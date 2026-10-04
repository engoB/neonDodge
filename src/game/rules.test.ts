import { describe, expect, it } from 'vitest'
import { DodgeEngine } from './engine'
import { teamHp, winnerFrom } from './rules'

describe('match rules', () => {
  it('starts with six health points per team', () => {
    const engine = new DodgeEngine()
    expect(teamHp(engine.players, 'azure')).toBe(6)
    expect(teamHp(engine.players, 'coral')).toBe(6)
  })

  it('declares a winner when a team is eliminated', () => {
    const engine = new DodgeEngine()
    engine.players.filter((p) => p.team === 'coral').forEach((p) => { p.hp = 0; p.active = false })
    expect(winnerFrom(engine.players)).toBe('azure')
  })
})

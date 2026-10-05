import { describe, expect, it } from 'vitest'
import { BaseballEngine } from './engine'
import { matchConfig } from './league'
import { actionCue, advanceBases, CONTACT_TIME, gradeSwing, pointOnBasePath } from './rules'

const engine = () => new BaseballEngine(matchConfig('story', 0))

describe('one-touch baseball rules', () => {
  it('grades a swing from its distance to the contact frame', () => {
    expect(gradeSwing(CONTACT_TIME)).toBe('perfect')
    expect(gradeSwing(CONTACT_TIME + .1)).toBe('good')
    expect(gradeSwing(CONTACT_TIME + .18)).toBe('foul')
    expect(gradeSwing(0)).toBe('miss')
  })

  it('turns the same input into swing, dash, or slide from context', () => {
    expect(actionCue('pitching', CONTACT_TIME, 0, 0)).toBe('FRAPPE')
    expect(actionCue('running', 0, .2, 0)).toBe('ACCÉLÈRE')
    expect(actionCue('running', 0, .8, 0)).toBe('GLISSE')
  })

  it('stages a perfect hit through contact, fielding and running', () => {
    const game = engine()
    game.action()
    game.action()
    game.pitchClock = CONTACT_TIME
    game.action()
    expect(game.phase).toBe('contact')
    for (let frame = 0; frame < 70 && game.phase !== 'running'; frame++) game.update(1 / 60)
    expect(game.phase).toBe('running')
    expect(game.targetBases).toBe(4)
    for (let frame = 0; frame < 700 && game.phase === 'running'; frame++) game.update(1 / 60)
    expect(game.phase).toBe('call')
    expect(game.score).toBe(1)
  })

  it('keeps ball flight continuous across contact, fielding and running', () => {
    const game = engine()
    game.action()
    game.action()
    game.pitchClock = CONTACT_TIME
    game.action()
    const samples: number[] = []
    for (let frame = 0; frame < 90 && ['contact', 'fielding', 'running'].includes(game.phase); frame++) {
      game.update(1 / 60)
      samples.push(game.ballFlight)
    }
    expect(samples.length).toBeGreaterThan(50)
    for (let index = 1; index < samples.length; index++) expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1])
  })

  it('maps touches during auto-run to dash and then slide', () => {
    const game = engine()
    game.phase = 'running'
    game.targetBases = 1
    game.runnerProgress = .2
    game.action()
    expect(game.dashClock).toBe(.34)
    game.runnerProgress = .8
    game.action()
    expect(game.slideClock).toBe(.46)
  })

  it('enters a real inning break after three outs', () => {
    const game = engine()
    game.outs = 2
    game.phase = 'pitching'
    game.strikes = 2
    game.pitchClock = 0
    game.action()
    expect(game.phase).toBe('call')
    expect(game.outs).toBe(3)
    game.action()
    expect(game.phase).toBe('inning_break')
    game.action()
    expect(game.inning).toBe(2)
    expect(game.outs).toBe(0)
  })

  it('loads occupied bases and scores forced runners', () => {
    expect(advanceBases([true, true, true], 1)).toEqual({ bases: [true, true, true], runs: 1 })
    expect(advanceBases([true, false, true], 2)).toEqual({ bases: [false, true, true], runs: 1 })
  })

  it('keeps the runner on the four-segment diamond path', () => {
    expect(pointOnBasePath(0)).toEqual({ x: 240, y: 240 })
    expect(pointOnBasePath(4)).toEqual({ x: 240, y: 240 })
  })
})

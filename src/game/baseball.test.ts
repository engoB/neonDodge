import { describe, expect, it } from 'vitest'
import { BaseballEngine } from './engine'
import { actionCue, advanceBases, CONTACT_TIME, gradeSwing, pointOnBasePath } from './rules'

describe('one-touch baseball rules', () => {
  it('grades a swing from its distance to the contact frame', () => {
    expect(gradeSwing(CONTACT_TIME)).toBe('perfect')
    expect(gradeSwing(CONTACT_TIME + .1)).toBe('good')
    expect(gradeSwing(CONTACT_TIME + .17)).toBe('foul')
    expect(gradeSwing(0)).toBe('miss')
  })

  it('turns the same input into swing, dash, or slide from context', () => {
    expect(actionCue('pitching', CONTACT_TIME, 0, 0)).toBe('FRAPPE')
    expect(actionCue('running', 0, .2, 0)).toBe('ACCÉLÈRE')
    expect(actionCue('running', 0, .8, 0)).toBe('GLISSE')
  })

  it('starts a home run on a perfectly timed touch', () => {
    const engine = new BaseballEngine()
    engine.action()
    engine.pitchClock = CONTACT_TIME
    engine.action()
    expect(engine.phase).toBe('running')
    expect(engine.grade).toBe('perfect')
    expect(engine.targetBases).toBe(4)
    for (let frame = 0; frame < 500 && engine.phase === 'running'; frame++) engine.update(1 / 60)
    expect(engine.phase).toBe('result')
    expect(engine.score).toBe(1)
    expect(engine.outs).toBe(0)
  })

  it('maps touches during auto-run to dash and then slide', () => {
    const engine = new BaseballEngine()
    engine.action()
    engine.pitchClock = CONTACT_TIME + .03
    engine.action()
    engine.runnerProgress = .2
    engine.action()
    expect(engine.dashClock).toBe(.3)
    engine.runnerProgress = .8
    engine.action()
    expect(engine.slideClock).toBe(.42)
  })

  it('records an out after three missed pitches', () => {
    const engine = new BaseballEngine()
    for (let strike = 0; strike < 3; strike++) {
      if (engine.phase === 'result') engine.action()
      if (engine.phase === 'ready') engine.action()
      engine.pitchClock = 0
      engine.action()
    }
    expect(engine.outs).toBe(1)
    expect(engine.strikes).toBe(0)
  })

  it('loads occupied bases and scores forced runners', () => {
    expect(advanceBases([true, true, true], 1)).toEqual({ bases: [true, true, true], runs: 1 })
    expect(advanceBases([true, false, true], 2)).toEqual({ bases: [false, true, true], runs: 1 })
  })

  it('keeps the runner on the four-segment diamond path', () => {
    expect(pointOnBasePath(0)).toEqual({ x: 240, y: 236 })
    expect(pointOnBasePath(4)).toEqual({ x: 240, y: 236 })
  })
})

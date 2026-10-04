import { actionCue, advanceBases, CONTACT_TIME, gradeSwing, PITCH_DURATION, RUN_SPEED } from './rules'
import type { BaseballSnapshot, GamePhase, HitGrade } from './types'

export class BaseballEngine {
  phase: GamePhase = 'ready'
  phaseBeforePause: GamePhase = 'ready'
  phaseClock = 0
  pitchClock = 0
  pitchSerial = 0
  pitchCurve = 0
  runnerProgress = 0
  targetBases = 0
  fieldDeadline = 0
  dashClock = 0
  dashCooldown = 0
  slideClock = 0
  swingClock = 0
  score = 0
  hits = 0
  outs = 0
  strikes = 0
  bases: [boolean, boolean, boolean] = [false, false, false]
  grade: HitGrade = null
  message = 'Une seule commande. Choisis le bon moment.'

  reset() {
    this.phase = 'ready'
    this.phaseBeforePause = 'ready'
    this.phaseClock = 0
    this.pitchClock = 0
    this.pitchSerial = 0
    this.pitchCurve = 0
    this.runnerProgress = 0
    this.targetBases = 0
    this.fieldDeadline = 0
    this.dashClock = 0
    this.dashCooldown = 0
    this.slideClock = 0
    this.swingClock = 0
    this.score = 0
    this.hits = 0
    this.outs = 0
    this.strikes = 0
    this.bases = [false, false, false]
    this.grade = null
    this.message = 'Une seule commande. Choisis le bon moment.'
  }

  update(dt: number) {
    if (this.phase === 'paused' || this.phase === 'gameover') return
    this.phaseClock += dt
    this.dashClock = Math.max(0, this.dashClock - dt)
    this.dashCooldown = Math.max(0, this.dashCooldown - dt)
    this.slideClock = Math.max(0, this.slideClock - dt)
    this.swingClock = Math.max(0, this.swingClock - dt)

    if (this.phase === 'ready' && this.phaseClock >= .72) this.startPitch()
    else if (this.phase === 'pitching') {
      this.pitchClock += dt
      if (this.pitchClock >= PITCH_DURATION) this.resolveStrike('Trop tard !')
    } else if (this.phase === 'running') this.updateRunner(dt)
    else if (this.phase === 'result' && this.phaseClock >= 1.05) this.nextBatter()
  }

  action() {
    if (this.phase === 'paused') {
      this.phase = this.phaseBeforePause
      return
    }
    if (this.phase === 'gameover') {
      this.reset()
      return
    }
    if (this.phase === 'ready') {
      this.startPitch()
      return
    }
    if (this.phase === 'result') {
      this.nextBatter()
      return
    }
    if (this.phase === 'pitching') {
      this.swing()
      return
    }
    if (this.phase === 'running') this.runnerAction()
  }

  togglePause() {
    if (this.phase === 'paused') this.phase = this.phaseBeforePause
    else if (this.phase !== 'gameover') {
      this.phaseBeforePause = this.phase
      this.phase = 'paused'
    }
  }

  private startPitch() {
    this.phase = 'pitching'
    this.phaseClock = 0
    this.pitchClock = 0
    this.pitchSerial++
    this.pitchCurve = ((this.pitchSerial * 47) % 5 - 2) * 5
    this.grade = null
    this.message = 'Observe le lancer…'
  }

  private swing() {
    this.swingClock = .22
    const grade = gradeSwing(this.pitchClock)
    this.grade = grade
    if (grade === 'miss') {
      this.resolveStrike('Swing dans le vide')
      return
    }
    if (grade === 'foul') {
      if (this.strikes < 2) this.strikes++
      this.phase = 'result'
      this.phaseClock = 0
      this.message = 'Fausse balle'
      return
    }

    const error = Math.abs(this.pitchClock - CONTACT_TIME)
    this.targetBases = grade === 'perfect'
      ? (error <= .022 ? 4 : 2 + this.pitchSerial % 2)
      : (this.pitchSerial % 3 === 0 ? 2 : 1)
    this.runnerProgress = 0
    this.fieldDeadline = this.targetBases * 1.52 + (grade === 'perfect' ? .34 : .12)
    this.dashClock = 0
    this.dashCooldown = 0
    this.slideClock = 0
    this.phase = 'running'
    this.phaseClock = 0
    this.hits++
    this.strikes = 0
    this.message = grade === 'perfect' ? 'CONTACT PARFAIT !' : 'Bien frappé !'
  }

  private runnerAction() {
    const nextBase = Math.ceil(this.runnerProgress)
    const distanceToBase = nextBase - this.runnerProgress
    if (nextBase > 0 && distanceToBase < .26) {
      this.slideClock = .42
      this.dashClock = Math.max(this.dashClock, .18)
      this.message = 'Glissade !'
    } else if (this.dashCooldown <= 0) {
      this.dashClock = .3
      this.dashCooldown = .62
      this.message = 'Accélération !'
    }
  }

  private updateRunner(dt: number) {
    const speed = RUN_SPEED + (this.dashClock > 0 ? .5 : 0) + (this.slideClock > 0 ? .12 : 0)
    this.runnerProgress += speed * dt
    if (this.runnerProgress >= this.targetBases) {
      this.runnerProgress = this.targetBases
      this.resolveSafe()
      return
    }

    const slideProtection = this.slideClock > 0 && this.targetBases - this.runnerProgress < .18
    if (this.targetBases < 4 && this.phaseClock >= this.fieldDeadline && !slideProtection) this.resolveOut()
  }

  private resolveSafe() {
    const result = advanceBases(this.bases, this.targetBases)
    this.bases = result.bases
    this.score += result.runs
    this.phase = 'result'
    this.phaseClock = 0
    this.message = this.targetBases === 4 ? 'HOME RUN !' : result.runs ? `SÛR ! +${result.runs} point` : 'SÛR !'
  }

  private resolveOut() {
    this.outs++
    this.phase = this.outs >= 3 ? 'gameover' : 'result'
    this.phaseClock = 0
    this.message = this.outs >= 3 ? `Manche terminée · ${this.score} point${this.score === 1 ? '' : 's'}` : 'Retiré sur la base !'
  }

  private resolveStrike(message: string) {
    this.strikes++
    this.phaseClock = 0
    if (this.strikes >= 3) {
      this.strikes = 0
      this.outs++
      this.phase = this.outs >= 3 ? 'gameover' : 'result'
      this.message = this.outs >= 3 ? `Manche terminée · ${this.score} point${this.score === 1 ? '' : 's'}` : 'Strike out !'
    } else {
      this.phase = 'result'
      this.message = message
    }
  }

  private nextBatter() {
    if (this.outs >= 3) {
      this.phase = 'gameover'
      return
    }
    this.phase = 'ready'
    this.phaseClock = 0
    this.pitchClock = 0
    this.runnerProgress = 0
    this.targetBases = 0
    this.grade = null
    this.message = 'Nouveau lancer'
  }

  snapshot(): BaseballSnapshot {
    return {
      phase: this.phase,
      score: this.score,
      hits: this.hits,
      outs: this.outs,
      strikes: this.strikes,
      bases: [...this.bases] as [boolean, boolean, boolean],
      cue: actionCue(this.phase, this.pitchClock, this.runnerProgress, this.dashCooldown),
      message: this.message,
      grade: this.grade,
    }
  }
}

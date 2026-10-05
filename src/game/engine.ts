import { ROSTER } from './league'
import { actionCue, advanceBases, CONTACT_TIME, gradeSwing, PITCH_DURATION, RUN_SPEED } from './rules'
import type { BaseballSnapshot, GamePhase, HitGrade, MatchConfig } from './types'

export class BaseballEngine {
  phase: GamePhase = 'walkup'
  phaseBeforePause: GamePhase = 'walkup'
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
  contactClock = 0
  ballFlight = 0
  score = 0
  rivalScore = 0
  hits = 0
  outs = 0
  strikes = 0
  inning = 1
  maxInnings: number
  batterIndex = 0
  bases: [boolean, boolean, boolean] = [false, false, false]
  grade: HitGrade = null
  message = 'MIKA FLUX ENTRE EN JEU'
  subMessage = 'Voltigeuse · N° 7 · Spécialité vitesse'
  playLabel = 'BAS DE LA 1re'
  won: boolean | null = null

  constructor(public readonly config: MatchConfig) {
    this.maxInnings = config.maxInnings
    this.setWalkupMessage()
  }

  reset() {
    this.phase = 'walkup'
    this.phaseBeforePause = 'walkup'
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
    this.contactClock = 0
    this.ballFlight = 0
    this.score = 0
    this.rivalScore = 0
    this.hits = 0
    this.outs = 0
    this.strikes = 0
    this.inning = 1
    this.maxInnings = this.config.maxInnings
    this.batterIndex = 0
    this.bases = [false, false, false]
    this.grade = null
    this.won = null
    this.playLabel = 'BAS DE LA 1re'
    this.setWalkupMessage()
  }

  update(dt: number) {
    if (this.phase === 'paused' || this.phase === 'gameover') return
    this.phaseClock += dt
    this.dashClock = Math.max(0, this.dashClock - dt)
    this.dashCooldown = Math.max(0, this.dashCooldown - dt)
    this.slideClock = Math.max(0, this.slideClock - dt)
    this.swingClock = Math.max(0, this.swingClock - dt)

    if (this.phase === 'walkup' && this.phaseClock >= 1.6) this.enterReady()
    else if (this.phase === 'ready' && this.phaseClock >= .9) this.startPitch()
    else if (this.phase === 'pitching') {
      this.pitchClock += dt
      if (this.pitchClock >= PITCH_DURATION) this.resolveStrike('PRISE ! TU AS LAISSÉ PASSER')
    } else if (this.phase === 'contact') {
      this.contactClock += dt
      this.ballFlight = Math.min(1, this.contactClock / .44)
      if (this.contactClock >= .44) this.startFielding()
    } else if (this.phase === 'fielding') {
      this.ballFlight = Math.min(1, .65 + this.phaseClock / .65)
      if (this.phaseClock >= .62) this.startRunning()
    } else if (this.phase === 'running') this.updateRunner(dt)
    else if (this.phase === 'call' && this.phaseClock >= 1.35) this.afterCall()
    else if (this.phase === 'inning_break' && this.phaseClock >= 2.35) this.advanceInning()
  }

  action() {
    if (this.phase === 'paused') {
      this.phase = this.phaseBeforePause
      return
    }
    if (this.phase === 'gameover') return
    if (this.phase === 'walkup') {
      this.enterReady()
      return
    }
    if (this.phase === 'ready') {
      this.startPitch()
      return
    }
    if (this.phase === 'pitching') {
      this.swing()
      return
    }
    if (this.phase === 'running') {
      this.runnerAction()
      return
    }
    if (this.phase === 'call') {
      this.afterCall()
      return
    }
    if (this.phase === 'inning_break') this.advanceInning()
  }

  togglePause() {
    if (this.phase === 'paused') this.phase = this.phaseBeforePause
    else if (this.phase !== 'gameover') {
      this.phaseBeforePause = this.phase
      this.phase = 'paused'
    }
  }

  private setWalkupMessage() {
    const batter = ROSTER[this.batterIndex % ROSTER.length]
    this.message = `${batter.name} ENTRE EN JEU`
    this.subMessage = `${batter.role} · N° ${batter.number} · ${this.skillLabel(batter.skill)}`
  }

  private skillLabel(skill: string) {
    return { speed: 'VITESSE', power: 'PUISSANCE', contact: 'PRÉCISION', clutch: 'SANG-FROID' }[skill] ?? skill
  }

  private enterReady() {
    this.phase = 'ready'
    this.phaseClock = 0
    this.message = 'LE LANCEUR PREND SON SIGNAL'
    this.subMessage = `${this.config.opponent.name} · difficulté ${this.config.opponent.difficulty}/4`
  }

  private startPitch() {
    this.phase = 'pitching'
    this.phaseClock = 0
    this.pitchClock = 0
    this.pitchSerial++
    const difficulty = this.config.opponent.difficulty
    this.pitchCurve = (((this.pitchSerial * 47 + difficulty * 13) % 7) - 3) * (3 + difficulty)
    this.grade = null
    this.message = this.pitchSerial % 3 === 0 ? 'BALLE COURBE… LIS LA TRAJECTOIRE' : 'LE LANCER PART !'
    this.subMessage = 'Observe la balle, puis touche au contact'
  }

  private swing() {
    this.swingClock = .28
    const grade = gradeSwing(this.pitchClock)
    this.grade = grade
    if (grade === 'miss') {
      this.resolveStrike('SWING DANS LE VIDE')
      return
    }
    if (grade === 'foul') {
      if (this.strikes < 2) this.strikes++
      this.phase = 'call'
      this.phaseClock = 0
      this.message = 'FAUSSE BALLE !'
      this.subMessage = 'Le duel continue'
      return
    }

    const batter = ROSTER[this.batterIndex % ROSTER.length]
    const error = Math.abs(this.pitchClock - CONTACT_TIME)
    const powerBonus = batter.skill === 'power' && grade === 'perfect' ? 1 : 0
    this.targetBases = grade === 'perfect'
      ? Math.min(4, (error <= .028 ? 4 : 2 + this.pitchSerial % 2) + powerBonus)
      : (this.pitchSerial % 4 === 0 ? 2 : 1)
    this.runnerProgress = 0
    this.fieldDeadline = this.targetBases * 1.6 + .18 - this.config.opponent.difficulty * .06
    this.dashClock = 0
    this.dashCooldown = 0
    this.slideClock = 0
    this.contactClock = 0
    this.ballFlight = 0
    this.phase = 'contact'
    this.phaseClock = 0
    this.hits++
    this.strikes = 0
    this.message = grade === 'perfect' ? 'IMPACT PARFAIT !' : 'FRAPPE PROPRE !'
    this.subMessage = this.targetBases === 4 ? 'Elle part vers les lumières !' : 'La défense se met en mouvement'
  }

  private startFielding() {
    this.phase = 'fielding'
    this.phaseClock = 0
    this.message = this.targetBases >= 3 ? 'AU FOND DU CHAMP !' : 'LA DÉFENSE POURSUIT LA BALLE'
    this.subMessage = 'Prépare la course'
  }

  private startRunning() {
    this.phase = 'running'
    this.phaseClock = 0
    this.message = this.targetBases === 4 ? 'FAIS LE TOUR DES BASES !' : `VISE ${this.targetBases === 1 ? 'LA PREMIÈRE' : this.targetBases === 2 ? 'LA DEUXIÈME' : 'LA TROISIÈME'} !`
    this.subMessage = 'Touche en ligne droite pour accélérer, près de la base pour glisser'
  }

  private runnerAction() {
    const nextBase = Math.ceil(this.runnerProgress)
    const distanceToBase = nextBase - this.runnerProgress
    if (nextBase > 0 && distanceToBase < .25) {
      this.slideClock = .46
      this.dashClock = Math.max(this.dashClock, .18)
      this.message = 'GLISSADE !'
      this.subMessage = 'Protège la base'
    } else if (this.dashCooldown <= 0) {
      this.dashClock = .34
      this.dashCooldown = .58
      this.message = 'ACCÉLÉRATION !'
      this.subMessage = 'Garde le rythme'
    }
  }

  private updateRunner(dt: number) {
    const batter = ROSTER[this.batterIndex % ROSTER.length]
    const speedBonus = batter.skill === 'speed' ? .08 : 0
    const speed = RUN_SPEED + speedBonus + (this.dashClock > 0 ? .5 : 0) + (this.slideClock > 0 ? .12 : 0)
    this.runnerProgress += speed * dt
    if (this.runnerProgress >= this.targetBases) {
      this.runnerProgress = this.targetBases
      this.resolveSafe()
      return
    }

    const distanceToTarget = this.targetBases - this.runnerProgress
    const slideProtection = this.slideClock > 0 && distanceToTarget < .2
    if (this.targetBases < 4 && this.phaseClock >= this.fieldDeadline && !slideProtection) this.resolveOut('RETIRÉ SUR LA BASE !')
  }

  private resolveSafe() {
    const result = advanceBases(this.bases, this.targetBases)
    this.bases = result.bases
    this.score += result.runs
    this.phase = 'call'
    this.phaseClock = 0
    this.message = this.targetBases === 4 ? 'HOME RUN !' : 'SAFE !'
    this.subMessage = result.runs ? `${result.runs} point${result.runs > 1 ? 's' : ''} pour les Neon Sparks` : `${this.targetBases === 1 ? 'Simple' : this.targetBases === 2 ? 'Double' : 'Triple'} réussi`
  }

  private resolveOut(message: string) {
    this.outs++
    this.phase = 'call'
    this.phaseClock = 0
    this.message = message
    this.subMessage = `${this.outs} retrait${this.outs > 1 ? 's' : ''} dans la manche`
  }

  private resolveStrike(message: string) {
    this.strikes++
    this.phaseClock = 0
    if (this.strikes >= 3) {
      this.strikes = 0
      this.resolveOut('STRIKE OUT !')
    } else {
      this.phase = 'call'
      this.message = message
      this.subMessage = `${this.strikes} prise${this.strikes > 1 ? 's' : ''} · le duel continue`
    }
  }

  private afterCall() {
    if (this.outs >= 3) {
      this.startInningBreak()
      return
    }
    this.batterIndex = (this.batterIndex + 1) % ROSTER.length
    this.runnerProgress = 0
    this.targetBases = 0
    this.grade = null
    this.phase = 'walkup'
    this.phaseClock = 0
    this.setWalkupMessage()
  }

  private startInningBreak() {
    const before = this.rivalScore
    if (this.config.mode !== 'training') {
      const pressure = this.config.opponent.difficulty + this.inning + this.pitchSerial
      if (pressure % 3 === 0 || (this.config.opponent.difficulty >= 3 && pressure % 2 === 0)) this.rivalScore++
    }
    const reply = this.rivalScore - before
    this.phase = 'inning_break'
    this.phaseClock = 0
    this.message = `FIN DE LA ${this.inning}${this.inning === 1 ? 're' : 'e'} MANCHE`
    this.subMessage = reply ? `${this.config.opponent.name} marque 1 point dans sa demi-manche` : 'La défense Neon ferme la manche'
    this.playLabel = 'CHANGEMENT DE CÔTÉ'
  }

  private advanceInning() {
    if (this.inning >= this.maxInnings) {
      if (this.config.mode !== 'training' && this.score === this.rivalScore) {
        this.maxInnings++
        this.message = 'ÉGALITÉ · MANCHE SUPPLÉMENTAIRE'
      } else {
        this.finishMatch()
        return
      }
    }
    this.inning++
    this.outs = 0
    this.strikes = 0
    this.bases = [false, false, false]
    this.runnerProgress = 0
    this.targetBases = 0
    this.batterIndex = (this.batterIndex + 1) % ROSTER.length
    this.phase = 'walkup'
    this.phaseClock = 0
    this.playLabel = `BAS DE LA ${this.inning}${this.inning === 1 ? 're' : 'e'}`
    this.setWalkupMessage()
  }

  private finishMatch() {
    this.phase = 'gameover'
    this.phaseClock = 0
    this.won = this.config.mode === 'training' ? true : this.score > this.rivalScore
    this.message = this.config.mode === 'training' ? 'ENTRAÎNEMENT TERMINÉ' : this.won ? 'VICTOIRE !' : 'DÉFAITE…'
    this.subMessage = this.won ? `${this.score}–${this.rivalScore} · la route continue` : `${this.score}–${this.rivalScore} · reviens plus fort`
    this.playLabel = 'MATCH TERMINÉ'
  }

  snapshot(): BaseballSnapshot {
    return {
      phase: this.phase,
      mode: this.config.mode,
      inning: this.inning,
      maxInnings: this.maxInnings,
      score: this.score,
      rivalScore: this.rivalScore,
      hits: this.hits,
      outs: this.outs,
      strikes: this.strikes,
      bases: [...this.bases] as [boolean, boolean, boolean],
      cue: actionCue(this.phase, this.pitchClock, this.runnerProgress, this.dashCooldown),
      message: this.message,
      subMessage: this.subMessage,
      grade: this.grade,
      batter: ROSTER[this.batterIndex % ROSTER.length],
      opponent: this.config.opponent,
      playLabel: this.playLabel,
      won: this.won,
    }
  }
}

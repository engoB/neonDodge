import { useCallback, useEffect, useRef, useState } from 'react'
import { GameAudio } from '../game/audio'
import { BaseballEngine } from '../game/engine'
import { BaseballRenderer } from '../game/renderer'
import { CONTACT_TIME, PITCH_DURATION } from '../game/rules'
import type { BaseballSnapshot, MatchConfig } from '../game/types'

interface Props {
  config: MatchConfig
  onExit: () => void
  onComplete: (result: BaseballSnapshot) => void
}

const cueText: Record<BaseballSnapshot['cue'], string> = {
  CONTINUE: 'TOUCHE POUR CONTINUER',
  ATTENDS: 'OBSERVE LE JEU',
  FRAPPE: 'FRAPPE !',
  ACCÉLÈRE: 'SPRINT !',
  GLISSE: 'GLISSE !',
  REPRENDS: 'REPRENDRE',
  TERMINÉ: 'MATCH TERMINÉ',
}
const timingLeft = (CONTACT_TIME / PITCH_DURATION) * 100
const timingWidth = (error: number) => (error / PITCH_DURATION) * 100

export function GameView({ config, onExit, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BaseballEngine | null>(null)
  const audioRef = useRef<GameAudio | null>(null)
  const lastSoundRef = useRef('')
  const [snapshot, setSnapshot] = useState<BaseballSnapshot>(() => new BaseballEngine(config).snapshot())
  const act = useCallback(() => engineRef.current?.action(), [])

  useEffect(() => {
    const audio = new GameAudio()
    audioRef.current = audio
    return () => audio.close()
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BaseballEngine(config)
    const renderer = new BaseballRenderer(canvasRef.current)
    engineRef.current = engine
    setSnapshot(engine.snapshot())
    let frame = 0, last = performance.now(), accumulator = 0, hudClock = 0
    const loop = (now: number) => {
      accumulator += Math.min(.1, (now - last) / 1000)
      last = now
      while (accumulator >= 1 / 60) {
        engine.update(1 / 60)
        accumulator -= 1 / 60
        hudClock += 1 / 60
      }
      renderer.render(engine)
      if (hudClock >= .05) { setSnapshot(engine.snapshot()); hudClock = 0 }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [config])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.code === 'Escape') {
        event.preventDefault()
        engineRef.current?.togglePause()
      } else if (event.code === 'Space' || event.code === 'Enter' || event.code === 'KeyJ') {
        event.preventDefault()
        act()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [act])

  useEffect(() => {
    const key = `${snapshot.phase}:${snapshot.message}`
    if (key === lastSoundRef.current) return
    lastSoundRef.current = key
    const audio = audioRef.current
    if (snapshot.phase === 'pitching') audio?.pitch()
    else if (snapshot.phase === 'contact') {
      audio?.hit(snapshot.grade === 'perfect')
      navigator.vibrate?.(snapshot.grade === 'perfect' ? [18, 20, 28] : 18)
    } else if (snapshot.phase === 'call') {
      const success = snapshot.message.includes('SAFE') || snapshot.message.includes('HOME RUN')
      audio?.call(success)
      if (!success) navigator.vibrate?.(22)
    } else if (snapshot.phase === 'inning_break') audio?.inning()
  }, [snapshot.phase, snapshot.message, snapshot.grade])

  const hot = snapshot.cue === 'FRAPPE' || snapshot.cue === 'GLISSE' || snapshot.cue === 'ACCÉLÈRE'
  const cinematic = snapshot.phase === 'walkup' || snapshot.phase === 'inning_break'

  return (
    <section
      className={`game-screen phase-${snapshot.phase}`}
      aria-label={`Match contre ${snapshot.opponent.name}`}
      onPointerDown={(event) => {
        if ((event.target as Element).closest('button, a')) return
        event.preventDefault()
        audioRef.current?.unlock()
        if (engineRef.current?.phase === 'pitching') audioRef.current?.swing()
        act()
      }}
    >
      <canvas ref={canvasRef} className="game-screen__canvas" aria-label="Stade de baseball pixel art animé" />
      <div className="game-screen__scanlines" aria-hidden="true" />

      <header className="game-hud" aria-label="Tableau de score">
        <button className="hud-icon" onClick={onExit} aria-label="Revenir au menu">‹</button>
        <div className={`scoreboard ${snapshot.phase === 'call' && snapshot.runsThisPlay ? 'scoreboard--scored' : ''}`}>
          <div className="scoreboard__team"><span>NEO</span><strong>{snapshot.score}</strong></div>
          <div className="scoreboard__inning"><small>{snapshot.playLabel}</small><b>{snapshot.inning}/{snapshot.maxInnings}</b></div>
          <div className="scoreboard__team scoreboard__team--rival" style={{ color: snapshot.opponent.accent }}><span>{snapshot.opponent.shortName}</span><strong>{snapshot.rivalScore}</strong></div>
        </div>
        <div className="hud-plate" aria-label={`Retraits ${snapshot.outs} sur 3, prises ${snapshot.strikes} sur 3`}>
          <div className="hud-plate__row"><span>OUT</span>{[0, 1, 2].map(index => <i key={index} className={index < snapshot.outs ? 'is-out' : ''} />)}</div>
          <div className="hud-plate__row"><span>STR</span>{[0, 1, 2].map(index => <i key={index} className={index < snapshot.strikes ? 'is-strike' : ''} />)}</div>
        </div>
        <button className="hud-icon hud-icon--pause" onClick={() => engineRef.current?.togglePause()} aria-label="Pause">Ⅱ</button>
      </header>

      {!cinematic && snapshot.phase !== 'gameover' && (
        <div className="game-message" key={snapshot.message} aria-live="polite">
          <strong>{snapshot.message}</strong><small>{snapshot.subMessage}</small>
        </div>
      )}

      {(snapshot.phase === 'ready' || snapshot.phase === 'pitching') && (
        <div className={`timing-meter ${snapshot.slowMotion ? 'timing-meter--focus' : ''}`} aria-label="Barre de timing de frappe">
          <div className="timing-meter__heading"><span>VISÉE DE FRAPPE</span><b>{snapshot.slowMotion ? 'FOCUS ×0,58' : 'ATTENDS LE CONTACT'}</b></div>
          <div className="timing-meter__track">
            <i className="timing-meter__zone timing-meter__zone--foul" style={{ left: `${timingLeft - timingWidth(.22)}%`, width: `${timingWidth(.44)}%` }} />
            <i className="timing-meter__zone timing-meter__zone--good" style={{ left: `${timingLeft - timingWidth(.14)}%`, width: `${timingWidth(.28)}%` }} />
            <i className="timing-meter__zone timing-meter__zone--perfect" style={{ left: `${timingLeft - timingWidth(.058)}%`, width: `${timingWidth(.116)}%` }} />
            <i className="timing-meter__target" style={{ left: `${timingLeft}%` }} />
            <b className="timing-meter__marker" style={{ left: `${snapshot.pitchProgress * 100}%` }} />
          </div>
          <div className="timing-meter__legend"><span>TÔT</span><strong>✦ PARFAIT ✦</strong><span>TARD</span></div>
        </div>
      )}

      {snapshot.phase === 'call' && snapshot.runsThisPlay > 0 && (
        <div className="run-banner" key={`${snapshot.inning}-${snapshot.score}`} aria-live="assertive">
          <span>NEON SPARKS MARQUENT !</span>
          <strong>+{snapshot.runsThisPlay} POINT{snapshot.runsThisPlay > 1 ? 'S' : ''}</strong>
          <small>{snapshot.scoringRunners.length === 1 ? 'UN COUREUR FRANCHIT LE MARBRE' : `${snapshot.scoringRunners.length} COUREURS FRANCHISSENT LE MARBRE`}</small>
        </div>
      )}

      {cinematic && (
        <div className={`sequence-card ${snapshot.phase === 'inning_break' ? 'sequence-card--inning' : ''}`} aria-live="polite">
          <span className="sequence-card__eyebrow">{snapshot.phase === 'walkup' ? `BATTANT N° ${snapshot.batter.number}` : snapshot.playLabel}</span>
          <strong>{snapshot.message}</strong>
          <p>{snapshot.subMessage}</p>
          {snapshot.phase === 'walkup' && <div className={`skill skill--${snapshot.batter.skill}`}>{snapshot.batter.role}</div>}
          {snapshot.phase === 'inning_break' && <div className="inning-score"><b>{snapshot.score}</b><span>—</span><b>{snapshot.rivalScore}</b></div>}
        </div>
      )}

      <div className="base-indicator" aria-label={`Bases occupées : ${snapshot.bases.map((occupied, index) => occupied ? index + 1 : '').filter(Boolean).join(', ') || 'aucune'}`}>
        <span className={snapshot.bases[1] ? 'occupied' : ''} />
        <span className={snapshot.bases[2] ? 'occupied' : ''} />
        <span className={snapshot.bases[0] ? 'occupied' : ''} />
      </div>

      {snapshot.phase !== 'gameover' && (
        <div className={`touch-prompt ${hot ? 'touch-prompt--hot' : ''}`} aria-live="polite">
          <span className="touch-prompt__spark" aria-hidden="true">✦</span>
          <span>{cueText[snapshot.cue]}</span>
          <span className="touch-prompt__spark" aria-hidden="true">✦</span>
        </div>
      )}

      {snapshot.phase === 'gameover' && (
        <div className={`end-card ${snapshot.won ? 'end-card--win' : 'end-card--loss'}`} aria-live="polite">
          <span className="end-card__eyebrow">{snapshot.mode === 'training' ? 'SESSION COMPLÈTE' : snapshot.won ? 'MATCH GAGNÉ' : 'MATCH PERDU'}</span>
          <h2>{snapshot.message}</h2>
          <div className="end-score"><strong>{snapshot.score}</strong><span>—</span><strong>{snapshot.rivalScore}</strong></div>
          <p>{snapshot.hits} coups sûrs · {snapshot.inning} manches</p>
          <div className="end-card__actions">
            <button onClick={() => engineRef.current?.reset()}>REJOUER</button>
            <button className="is-primary" onClick={() => onComplete(snapshot)}>{snapshot.mode === 'story' && snapshot.won ? 'CHAPITRE SUIVANT' : 'CONTINUER'}</button>
          </div>
        </div>
      )}
    </section>
  )
}

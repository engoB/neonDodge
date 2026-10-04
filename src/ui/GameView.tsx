import { useCallback, useEffect, useRef, useState } from 'react'
import { BaseballEngine } from '../game/engine'
import { BaseballRenderer } from '../game/renderer'
import type { BaseballSnapshot } from '../game/types'

interface Props { onExit: () => void }

const initialSnapshot: BaseballSnapshot = {
  phase: 'ready', score: 0, hits: 0, outs: 0, strikes: 0,
  bases: [false, false, false], cue: 'JOUE', message: '', grade: null,
}

const cueText: Record<BaseballSnapshot['cue'], string> = {
  JOUE: 'TOUCHE POUR JOUER',
  ATTENDS: 'GARDE LE RYTHME',
  FRAPPE: 'FRAPPE !',
  ACCÉLÈRE: 'SPRINT !',
  GLISSE: 'GLISSE !',
  REPRENDS: 'REPRENDRE',
  REJOUE: 'NOUVELLE MANCHE',
}

export function GameView({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BaseballEngine | null>(null)
  const [snapshot, setSnapshot] = useState<BaseballSnapshot>(initialSnapshot)
  const act = useCallback(() => engineRef.current?.action(), [])

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new BaseballEngine()
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
  }, [])

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

  const hot = snapshot.cue === 'FRAPPE' || snapshot.cue === 'GLISSE'
  const finish = snapshot.phase === 'gameover'

  return (
    <section
      className="game-screen"
      aria-label="Partie de baseball à une commande"
      onPointerDown={(event) => {
        if ((event.target as Element).closest('button, a')) return
        event.preventDefault()
        act()
      }}
    >
      <canvas ref={canvasRef} className="game-screen__canvas" aria-label="Stade de baseball pixel art animé" />
      <div className="game-screen__scanlines" aria-hidden="true" />

      <header className="game-hud" aria-label="Score de la manche">
        <button className="hud-icon" onClick={onExit} aria-label="Revenir au menu">‹</button>
        <div className="hud-score">
          <span className="hud-score__label">NEON LEAGUE</span>
          <span className="hud-score__value">{String(snapshot.score).padStart(2, '0')}</span>
          <span className="hud-score__label">POINTS</span>
        </div>
        <div className="hud-plate" aria-label={`Retraits ${snapshot.outs} sur 3, prises ${snapshot.strikes} sur 3`}>
          <div className="hud-plate__row"><span>OUT</span>{[0, 1, 2].map(index => <i key={index} className={index < snapshot.outs ? 'is-out' : ''} />)}</div>
          <div className="hud-plate__row"><span>STR</span>{[0, 1, 2].map(index => <i key={index} className={index < snapshot.strikes ? 'is-strike' : ''} />)}</div>
        </div>
        <button className="hud-icon hud-icon--pause" onClick={() => engineRef.current?.togglePause()} aria-label="Pause">Ⅱ</button>
      </header>

      <div className="game-message" key={snapshot.message} aria-live="polite">{snapshot.message}</div>
      <div className="base-indicator" aria-label={`Bases occupées : ${snapshot.bases.map((occupied, index) => occupied ? index + 1 : '').filter(Boolean).join(', ') || 'aucune'}`}>
        <span className={snapshot.bases[1] ? 'occupied' : ''} />
        <span className={snapshot.bases[2] ? 'occupied' : ''} />
        <span className={snapshot.bases[0] ? 'occupied' : ''} />
      </div>

      <div className={`touch-prompt ${hot ? 'touch-prompt--hot' : ''} ${finish ? 'touch-prompt--finish' : ''}`} aria-live="polite">
        <span className="touch-prompt__spark" aria-hidden="true">✦</span>
        <span>{cueText[snapshot.cue]}</span>
        <span className="touch-prompt__spark" aria-hidden="true">✦</span>
      </div>

      {finish && (
        <div className="end-card" aria-live="polite">
          <span className="end-card__eyebrow">FIN DE MANCHE</span>
          <strong>{snapshot.score}</strong>
          <span className="end-card__eyebrow">POINT{snapshot.score === 1 ? '' : 'S'} · {snapshot.hits} COUP{snapshot.hits === 1 ? '' : 'S'}</span>
          <span className="end-card__hint">TOUCHE POUR REJOUER</span>
        </div>
      )}
    </section>
  )
}

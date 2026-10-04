import { useCallback, useEffect, useRef, useState } from 'react'
import { BaseballEngine } from '../game/engine'
import { BaseballRenderer } from '../game/renderer'
import type { BaseballSnapshot } from '../game/types'

interface Props { onExit: () => void }

const initialSnapshot: BaseballSnapshot = {
  phase: 'ready', score: 0, hits: 0, outs: 0, strikes: 0,
  bases: [false, false, false], cue: 'JOUE', message: '', grade: null,
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

  return (
    <section
      className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-3 py-3 sm:px-6"
      onPointerDown={(event) => {
        if ((event.target as Element).closest('button, a')) return
        event.preventDefault()
        act()
      }}
    >
      <header className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-3">
        <button onClick={onExit} className="rounded-full border border-cream/20 px-4 py-2 text-sm font-bold hover:border-cream/60">← Menu</button>
        <div className="flex items-center justify-center gap-4 font-black tabular-nums sm:gap-8">
          <span className="text-teal">SCORE {snapshot.score}</span>
          <span className="hidden text-gold sm:inline">COUPS {snapshot.hits}</span>
          <span className="text-coral">RETRAITS {snapshot.outs}/3</span>
        </div>
        <button onClick={() => engineRef.current?.togglePause()} className="rounded-full border border-cream/20 px-4 py-2 text-sm font-bold hover:border-cream/60">Pause</button>
      </header>

      <div
        className="panel one-touch relative cursor-pointer overflow-hidden rounded-[1.6rem] p-2 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-4"
        role="button"
        tabIndex={0}
        aria-label={`Action contextuelle : ${snapshot.cue}`}
      >
        <canvas ref={canvasRef} className="game-canvas aspect-16/9 w-full rounded-xl bg-ink" aria-label="Terrain de baseball" />

        <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full bg-ink/80 px-3 py-2 text-xs font-black backdrop-blur-sm sm:left-8 sm:top-8">
          <span className="text-cream/55">STRIKES</span>
          {[0, 1, 2].map((index) => <span key={index} className={`h-2.5 w-2.5 rounded-full ${index < snapshot.strikes ? 'bg-gold' : 'bg-cream/15'}`} />)}
        </div>

        <div className="pointer-events-none absolute right-5 top-5 grid h-12 w-12 rotate-45 grid-cols-2 gap-1 sm:right-8 sm:top-8">
          {snapshot.bases.map((occupied, index) => <span key={index} className={`${index === 2 ? 'col-start-1' : ''} rounded-sm border border-cream/50 ${occupied ? 'bg-gold' : 'bg-ink/70'}`} />)}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center sm:bottom-8">
          <div className={`action-cue rounded-full border px-7 py-3 text-center font-black uppercase tracking-[.18em] backdrop-blur-sm ${snapshot.cue === 'FRAPPE' || snapshot.cue === 'GLISSE' ? 'border-gold bg-gold text-ink' : 'border-cream/20 bg-ink/85 text-cream'}`}>
            {snapshot.cue === 'ATTENDS' ? '•••' : snapshot.cue}
          </div>
        </div>

        {snapshot.message && <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 rounded-full bg-ink/80 px-5 py-2 text-center text-xs font-black uppercase tracking-wider text-gold backdrop-blur-sm sm:top-8">{snapshot.message}</div>}

        {snapshot.phase === 'gameover' && (
          <div className="pointer-events-none absolute inset-2 grid place-items-center rounded-xl bg-ink/80 backdrop-blur-sm sm:inset-4">
            <div className="text-center">
              <p className="font-display text-4xl text-cream sm:text-6xl">MANCHE TERMINÉE</p>
              <p className="mt-3 text-xl font-black text-teal">{snapshot.score} POINT{snapshot.score === 1 ? '' : 'S'}</p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[.2em] text-gold">Touche pour rejouer</p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-xs font-bold uppercase tracking-[.16em] text-cream/55">
        Touche n’importe où · Espace ou Entrée · une commande, une action contextuelle
      </p>
    </section>
  )
}

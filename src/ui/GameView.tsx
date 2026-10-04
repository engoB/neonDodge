import { useEffect, useRef, useState } from 'react'
import { DodgeEngine } from '../game/engine'
import { DodgeRenderer } from '../game/renderer'
import type { MatchSnapshot } from '../game/types'
import { useKeyboard } from '../hooks/useKeyboard'
import { TouchControls } from './TouchControls'

interface Props { onExit: () => void }

export function GameView({ onExit }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useKeyboard()
  const engineRef = useRef<DodgeEngine | null>(null)
  const [snapshot, setSnapshot] = useState<MatchSnapshot>({ status: 'playing', timeLeft: 90, azureHp: 6, coralHp: 6, possession: 'azure', message: '' })

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new DodgeEngine()
    const renderer = new DodgeRenderer(canvasRef.current)
    engineRef.current = engine
    let frame = 0, last = performance.now(), accumulator = 0, hudClock = 0
    const loop = (now: number) => {
      accumulator += Math.min(.1, (now - last) / 1000)
      last = now
      while (accumulator >= 1 / 60) { engine.update(1 / 60, controls.current); accumulator -= 1 / 60; hudClock += 1 / 60 }
      renderer.render(engine)
      if (hudClock > .1) { setSnapshot(engine.snapshot()); hudClock = 0 }
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [controls])

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
      <header className="mb-3 flex items-center justify-between gap-3">
        <button onClick={onExit} className="rounded-full border border-cream/20 px-4 py-2 text-sm font-bold hover:border-cream/60">← Menu</button>
        <div className="flex items-center gap-3 font-black tabular-nums">
          <span className="text-teal">AZURE {snapshot.azureHp}</span>
          <span className="rounded-lg bg-cream px-3 py-1 text-lg text-ink">{Math.ceil(snapshot.timeLeft)}</span>
          <span className="text-coral">{snapshot.coralHp} CORAL</span>
        </div>
        <button onClick={() => engineRef.current?.togglePause()} className="rounded-full border border-cream/20 px-4 py-2 text-sm font-bold hover:border-cream/60">Pause</button>
      </header>
      <div className="panel relative overflow-hidden rounded-[1.6rem] p-2 sm:p-4">
        <canvas ref={canvasRef} className="game-canvas aspect-16/9 w-full rounded-xl bg-ink" aria-label="Terrain de Neon Dodge" />
        {snapshot.message && <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 rounded-full bg-ink/85 px-5 py-2 text-sm font-black uppercase tracking-wider text-gold">{snapshot.message}</div>}
        {(snapshot.status === 'won' || snapshot.status === 'lost') && (
          <div className="absolute inset-0 grid place-items-center bg-ink/75 backdrop-blur-sm">
            <div className="text-center"><p className="font-display text-4xl text-cream">{snapshot.status === 'won' ? 'VICTOIRE' : 'REVANCHE ?'}</p>
              <button onClick={() => engineRef.current?.reset()} className="mt-5 rounded-full bg-teal px-6 py-3 font-black text-ink">Rejouer</button></div>
          </div>
        )}
      </div>
      <TouchControls controls={controls} />
      <p className="mt-3 hidden text-center text-xs text-cream/55 md:block">Flèches / ZQSD · J ou Espace : tirer · K ou Maj : attraper · L : passer · Échap : pause</p>
    </section>
  )
}

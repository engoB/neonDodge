import { useEffect, useRef, useState } from 'react'
import { Game } from '../game/engine.js'
import { VIEW_H, MIN_VIEW_W } from '../game/constants.js'
import { unlockAudio, startMusic, stopMusic } from '../game/audio.js'

function Hearts({ n }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <svg key={i} viewBox="0 0 20 18" className={`h-5 w-5 ${i < n ? '' : 'opacity-25 grayscale'}`}>
          <path d="M10 17 C-6 7 3-4 10 4 C17-4 26 7 10 17Z" fill="#f43f5e" stroke="#1b1530" strokeWidth="2" />
        </svg>
      ))}
    </div>
  )
}

function Golds({ golds }) {
  return (
    <div className="flex gap-1">
      {golds.map((g, i) => (
        <span key={i} className={`grid h-5 w-5 place-items-center rounded-full border-2 border-night ${g ? 'bg-sun' : 'bg-white/15'}`} />
      ))}
    </div>
  )
}

export default function GameScreen({ def, endless, settings, onEnd, onQuit, label }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const gameRef = useRef(null)
  const [hud, setHud] = useState(null)
  const [paused, setPaused] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas.getContext('2d')
    const game = new Game({ def, endless, haptics: settings.haptics, seed: Date.now() % 100000, onHud: setHud, onEnd })
    gameRef.current = game
    if (new URLSearchParams(location.search).has('debug')) window.__game = game
    let scale = 1
    let dpr = 1
    let viewH = VIEW_H
    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      scale = Math.min(h / VIEW_H, w / MIN_VIEW_W)
      game.setView(w / scale)
      viewH = h / scale
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now) => {
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      while (acc >= 1 / 60) {
        game.update()
        acc -= 1 / 60
      }
      game.draw(ctx, scale, dpr, viewH)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    if (settings.music) startMusic(game.worldIdx)
    const onVis = () => {
      if (document.hidden && game.state === 'run') {
        game.state = 'paused'
        setPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    const key = (e) => {
      if (e.repeat) return
      if (['Space', 'ArrowUp', 'Enter', 'KeyZ'].includes(e.code)) {
        e.preventDefault()
        if (e.type === 'keydown') {
          unlockAudio()
          game.press()
        } else game.release()
      }
      if (e.code === 'Escape' && e.type === 'keydown') togglePause()
    }
    window.addEventListener('keydown', key)
    window.addEventListener('keyup', key)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('keydown', key)
      window.removeEventListener('keyup', key)
      stopMusic()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  function togglePause() {
    const g = gameRef.current
    if (!g) return
    if (g.state === 'run') {
      g.state = 'paused'
      setPaused(true)
    } else if (g.state === 'paused') {
      g.state = 'run'
      setPaused(false)
    }
  }

  const down = (e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    unlockAudio()
    gameRef.current?.press()
  }
  const up = () => gameRef.current?.release()

  return (
    <div
      ref={wrapRef}
      className="game-surface fixed inset-0 overflow-hidden bg-ink"
      onPointerDown={down}
      onPointerUp={up}
      onPointerCancel={up}
      onPointerLeave={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      {hud && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="flex flex-col gap-1.5 rounded-2xl bg-night/70 px-3 py-2 backdrop-blur">
            <Hearts n={hud.hp} />
            {!endless && <Golds golds={hud.golds} />}
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="font-display text-xs tracking-wider text-white/80">{label}</div>
            {!endless ? (
              <div className="h-2 w-28 overflow-hidden rounded-full bg-white/20 sm:w-48">
                <div className="h-full rounded-full bg-sun" style={{ width: `${hud.progress * 100}%` }} />
              </div>
            ) : (
              <div className="font-display text-lg text-sun text-outline">{hud.distance} m</div>
            )}
            {hud.ball && (
              <div className={`mt-1 rounded-full px-3 py-0.5 text-xs font-black ${hud.charged ? 'animate-pulse bg-aqua text-night' : 'bg-night/70 text-aqua'}`}>
                {hud.charged ? 'SUPER TIR PRÊT' : `Jauge ${Math.round(hud.charge * 100)} %`}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <div className="rounded-2xl bg-night/70 px-3 py-2 text-right backdrop-blur">
              <div className="font-display text-lg leading-none text-sun">{hud.score}</div>
              <div className="text-xs font-bold text-white/70">
                {hud.coins} jeton{hud.coins > 1 ? 's' : ''}{hud.combo > 1 ? ` · combo ×${hud.combo}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={togglePause}
              className="pointer-events-auto grid h-11 w-11 place-items-center rounded-2xl bg-night/70 text-xl font-black backdrop-blur active:scale-95"
              aria-label="Pause"
            >
              ❚❚
            </button>
          </div>
        </div>
      )}
      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-ink/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs animate-pop rounded-3xl border-4 border-night bg-white p-6 text-center text-night shadow-2xl">
            <div className="font-display text-3xl">Pause</div>
            <div className="mt-5 flex flex-col gap-3">
              <button type="button" className="rounded-2xl bg-flame py-3 font-black text-white active:scale-95" onClick={togglePause}>
                Reprendre
              </button>
              <button
                type="button"
                className="rounded-2xl bg-night py-3 font-black text-white active:scale-95"
                onClick={() => {
                  setPaused(false)
                  setAttempt((a) => a + 1)
                }}
              >
                Recommencer
              </button>
              <button type="button" className="rounded-2xl bg-slate-200 py-3 font-black active:scale-95" onClick={onQuit}>
                Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

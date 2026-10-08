import { useEffect, useRef, useState } from 'react'
import { Match } from '../game/match.js'
import { drawMatch, VIEW_H } from '../game/render.js'
import { unlockAudio, startMusic, stopMusic } from '../game/audio.js'

const MIN_VIEW_W = 340
const ARENA_MUSIC = { gym: 0, roof: 1, beach: 2, neon: 3 }

function TeamBar({ name, players, side, accent }) {
  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-1 ${side === 'right' ? 'items-end text-right' : ''}`}>
      <div className="truncate font-display text-[11px] tracking-wide" style={{ color: accent }}>
        {name}
      </div>
      <div className={`flex w-full gap-1 ${side === 'right' ? 'flex-row-reverse' : ''}`}>
        {players.map((p, i) => (
          <div key={i} className={`min-w-0 flex-1 ${p.ko ? 'opacity-35' : ''}`}>
            <div className="truncate text-[9px] font-bold leading-tight text-white/80">{p.ko ? 'KO' : p.name}</div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className={`h-full rounded-full ${p.hp / p.max > 0.35 ? 'bg-emerald-400' : 'bg-rose-500'}`}
                style={{ width: `${(p.hp / p.max) * 100}%`, marginLeft: side === 'right' ? 'auto' : 0 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MatchScreen({ rival, settings, onEnd, onQuit, label, playerAccent }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const matchRef = useRef(null)
  const touch = useRef({ y: 0, swiped: false })
  const [hud, setHud] = useState(null)
  const [paused, setPaused] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas.getContext('2d')
    const m = new Match({ rival, seed: (Date.now() % 100000) + attempt, haptics: settings.haptics, onHud: setHud, onEnd })
    matchRef.current = m
    if (new URLSearchParams(location.search).has('debug')) window.__match = m
    let scale = 1
    let dpr = 1
    let viewH = VIEW_H
    const resize = () => {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      dpr = Math.min(2, window.devicePixelRatio || 1)
      // en portrait on agrandit le terrain : la caméra suit la balle
      scale = Math.min(h / VIEW_H, w / MIN_VIEW_W)
      if (h > w) scale = Math.max(scale, Math.min(h / VIEW_H, (w / MIN_VIEW_W) * 1.35))
      m.setView(w / scale)
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
    const t0 = last
    const loop = (now) => {
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      while (acc >= 1 / 60) {
        m.update()
        acc -= 1 / 60
      }
      drawMatch(m, ctx, scale, dpr, viewH, (now - t0) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    if (settings.music) startMusic(ARENA_MUSIC[rival.arena] ?? 0)
    const onVis = () => {
      if (document.hidden && m.state === 'play') {
        m.state = 'paused'
        setPaused(true)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    const key = (e) => {
      if (e.repeat) return
      if (['Space', 'Enter', 'KeyZ'].includes(e.code)) {
        e.preventDefault()
        if (e.type === 'keydown') {
          unlockAudio()
          m.press()
        } else m.release()
      }
      if (e.code === 'ArrowUp' && e.type === 'keydown') m.swipeUp()
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
    const m = matchRef.current
    if (!m) return
    if (m.state === 'play') {
      m.state = 'paused'
      setPaused(true)
    } else if (m.state === 'paused') {
      m.state = 'play'
      setPaused(false)
    }
  }

  const down = (e) => {
    if (e.target.closest('button')) return
    e.preventDefault()
    unlockAudio()
    touch.current = { y: e.clientY, swiped: false }
    matchRef.current?.press()
  }
  const move = (e) => {
    const t = touch.current
    if (!t.swiped && e.buttons !== 0 && t.y - e.clientY > 40) {
      t.swiped = true
      matchRef.current?.swipeUp()
    }
  }
  const up = () => matchRef.current?.release()

  return (
    <div
      ref={wrapRef}
      className="game-surface fixed inset-0 overflow-hidden bg-ink"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block" />
      {hud && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start gap-2 p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="flex min-w-0 flex-1 items-start gap-3 rounded-2xl bg-night/75 px-3 py-2 backdrop-blur">
            <TeamBar name="Les Néons" players={hud.us} side="left" accent={playerAccent} />
            <div className="self-center font-display text-xs text-white/60">VS</div>
            <TeamBar name={rival.name} players={hud.them} side="right" accent={rival.accent} />
          </div>
          <button
            type="button"
            onClick={togglePause}
            className="pointer-events-auto grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-night/75 text-lg font-black backdrop-blur active:scale-95"
            aria-label="Pause"
          >
            ❚❚
          </button>
        </div>
      )}
      {hud && hud.state === 'play' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {hud.holding ? (
            <div className={`rounded-full px-4 py-1.5 text-xs font-black ${hud.charge >= 1 || hud.armed ? 'animate-pulse bg-aqua text-night' : 'bg-night/75 text-white'}`}>
              {hud.armed
                ? 'PASSE SPÉCIALE REÇUE : relâchez pour le super tir'
                : hud.charge >= 1
                  ? 'SUPER TIR PRÊT : relâchez !'
                  : 'Maintenez : course · Relâchez : tir · Glissez ↑ : passe'}
            </div>
          ) : (
            <div className="rounded-full bg-night/75 px-4 py-1.5 text-xs font-black text-white">
              Touchez au moment de l’impact : attraper · Maintenez : sauter
            </div>
          )}
        </div>
      )}
      {paused && (
        <div className="absolute inset-0 grid place-items-center bg-ink/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xs animate-pop rounded-3xl border-4 border-night bg-white p-6 text-center text-night shadow-2xl">
            <div className="font-display text-3xl">Pause</div>
            <div className="mt-1 text-sm font-bold text-slate-500">{label}</div>
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
                Recommencer le match
              </button>
              <button type="button" className="rounded-2xl bg-slate-200 py-3 font-black active:scale-95" onClick={onQuit}>
                Abandonner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

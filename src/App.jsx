import { useEffect, useRef, useState } from 'react'
import GameScreen from './components/GameScreen.jsx'
import { LEVELS, WORLDS, HERO_KIT } from './game/levels.js'
import { load, save, recordLevel } from './game/storage.js'
import { setSound, setMusic, unlockAudio, sfx } from './game/audio.js'
import { drawAthlete, drawBall } from './game/sprites.js'

// Petite scène animée de l'héroïne (dessin original) pour l'écran titre.
function Mascot() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = 220 * dpr
    c.height = 160 * dpr
    let raf
    const t0 = performance.now()
    const loop = (now) => {
      const t = (now - t0) / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, 220, 160)
      ctx.setTransform(dpr * 2.6, 0, 0, dpr * 2.6, 0, 0)
      const ph = t % 2
      const pose = ph < 1.2 ? 'hold' : ph < 1.45 ? 'windup' : 'throw'
      drawAthlete(ctx, { x: 30, y: 56, pose, t, kit: HERO_KIT, ball: pose === 'throw' ? null : 'player', glow: ph > 0.7 && ph < 1.45 ? '#22d3ee' : null })
      if (pose === 'throw') drawBall(ctx, { x: 40 + (ph - 1.45) * 90, y: 34, kind: 'super', r: 5, spin: t * 8 })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="h-40 w-56" />
}

function Title({ onPlay, onEndless, settings, setSettings, best }) {
  const toggle = (k) => {
    sfx.click()
    setSettings({ ...settings, [k]: !settings[k] })
  }
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-6 overflow-hidden px-6 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#7c3aed_0%,#120a2e_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[repeating-linear-gradient(90deg,#f97316_0_40px,#ea580c_40px_80px)] opacity-20" />
      <div className="relative animate-bob">
        <Mascot />
      </div>
      <h1 className="relative font-display text-5xl leading-none text-sun text-outline sm:text-7xl">
        Dodge
        <br />
        <span className="text-flame">Rush</span>
      </h1>
      <p className="relative max-w-sm font-bold text-white/80">
        La balle au prisonnier qui se joue d’un seul doigt : sautez, attrapez, tirez.
      </p>
      <div className="relative flex w-full max-w-xs flex-col gap-3">
        <button type="button" onClick={onPlay} className="rounded-2xl border-4 border-night bg-flame py-4 font-display text-2xl shadow-[0_6px_0_#1b1530] active:translate-y-1 active:shadow-none">
          Jouer
        </button>
        <button type="button" onClick={onEndless} className="rounded-2xl border-4 border-night bg-aqua py-3 font-display text-lg text-night shadow-[0_6px_0_#1b1530] active:translate-y-1 active:shadow-none">
          Course sans fin
        </button>
        {best > 0 && <div className="text-sm font-bold text-white/60">Record course sans fin : {best} m</div>}
      </div>
      <div className="relative flex gap-2 text-sm font-bold">
        {[
          ['sound', 'Sons'],
          ['music', 'Musique'],
          ['haptics', 'Vibrations'],
        ].map(([k, l]) => (
          <button key={k} type="button" onClick={() => toggle(k)} className={`rounded-full border-2 px-3 py-1.5 ${settings[k] ? 'border-sun bg-sun/15 text-sun' : 'border-white/25 text-white/50'}`}>
            {l} {settings[k] ? 'oui' : 'non'}
          </button>
        ))}
      </div>
      <p className="relative max-w-sm text-xs text-white/40">Jeu original. Tout reste sur l’appareil : aucun compte, aucun suivi.</p>
    </div>
  )
}

function LevelSelect({ progress, onPick, onBack }) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col gap-5 px-4 py-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/10 px-4 py-2 font-black active:scale-95">
          ← Retour
        </button>
        <div className="font-display text-xl text-sun">Niveaux</div>
        <div className="w-20" />
      </div>
      {WORLDS.map((w, wi) => (
        <section key={w.id} className="rounded-3xl border-2 border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-display text-lg" style={{ color: w.accent }}>
              {wi + 1}. {w.name}
            </h2>
            <span className="text-xs font-bold text-white/50">{w.tagline}</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {LEVELS.map((l, i) => ({ l, i }))
              .filter(({ l }) => l.world === wi)
              .map(({ l, i }) => {
                const open = i < progress.unlocked
                const rec = progress.levels[l.id]
                return (
                  <button
                    key={l.id}
                    type="button"
                    disabled={!open}
                    onClick={() => onPick(i)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-4 border-night p-3 text-night shadow-[0_5px_0_#1b1530] active:translate-y-1 active:shadow-none ${open ? 'bg-white' : 'bg-white/20 text-white/40'}`}
                  >
                    <span className="font-display text-xl">{l.id}</span>
                    <span className="text-center text-xs font-bold leading-tight">{open ? l.name : 'Verrouillé'}</span>
                    {open && (
                      <span className="mt-1 flex gap-1">
                        {[0, 1, 2].map((g) => (
                          <span key={g} className={`h-3 w-3 rounded-full border-2 border-night ${rec?.golds[g] ? 'bg-sun' : 'bg-slate-200'}`} />
                        ))}
                      </span>
                    )}
                    {rec?.best > 0 && <span className="text-[10px] font-black text-slate-500">{rec.best} pts</span>}
                  </button>
                )
              })}
          </div>
        </section>
      ))}
    </div>
  )
}

function Results({ r, endless, isLast, onRetry, onNext, onMenu, record }) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop rounded-3xl border-4 border-night bg-white p-6 text-center text-night shadow-2xl">
        <div className={`font-display text-4xl ${r.win ? 'text-flame' : 'text-slate-500'}`}>{endless ? 'Fin de course' : r.win ? 'Victoire !' : 'KO…'}</div>
        {!endless && (
          <div className="mt-3 flex justify-center gap-2">
            {r.golds.map((g, i) => (
              <span key={i} className={`h-8 w-8 rounded-full border-4 border-night ${g ? 'bg-sun' : 'bg-slate-200'}`} />
            ))}
          </div>
        )}
        <div className="mt-4 font-display text-3xl">{endless ? `${r.distance} m` : r.score}</div>
        {record && <div className="text-sm font-black text-flame">Nouveau record !</div>}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-left text-sm font-bold">
          <dt className="text-slate-500">KO</dt>
          <dd className="text-right">{endless ? r.kos : `${r.kos} / ${r.total}`}</dd>
          <dt className="text-slate-500">Balles attrapées</dt>
          <dd className="text-right">
            {r.catches} <span className="text-slate-400">({r.perfects} parfaites)</span>
          </dd>
          <dt className="text-slate-500">Super tirs</dt>
          <dd className="text-right">{r.supers}</dd>
          <dt className="text-slate-500">Jetons</dt>
          <dd className="text-right">{r.coins}</dd>
          <dt className="text-slate-500">Meilleur combo</dt>
          <dd className="text-right">×{r.bestCombo}</dd>
          {r.bonus > 0 && (
            <>
              <dt className="text-slate-500">Bonus cœurs</dt>
              <dd className="text-right">+{r.bonus}</dd>
            </>
          )}
        </dl>
        <div className="mt-6 flex flex-col gap-3">
          {r.win && !endless && !isLast && (
            <button type="button" onClick={onNext} className="rounded-2xl bg-flame py-3 font-black text-white active:scale-95">
              Niveau suivant
            </button>
          )}
          <button type="button" onClick={onRetry} className="rounded-2xl bg-night py-3 font-black text-white active:scale-95">
            Rejouer
          </button>
          <button type="button" onClick={onMenu} className="rounded-2xl bg-slate-200 py-3 font-black active:scale-95">
            Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [progress, setProgress] = useState(load)
  const [screen, setScreen] = useState('title')
  const [levelIdx, setLevelIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [record, setRecord] = useState(false)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    save(progress)
    setSound(progress.settings.sound)
    setMusic(progress.settings.music)
  }, [progress])

  const start = (i) => {
    unlockAudio()
    sfx.click()
    setLevelIdx(i)
    setResult(null)
    setRunId((n) => n + 1)
    setScreen('play')
  }
  const startEndless = () => {
    unlockAudio()
    sfx.click()
    setResult(null)
    setRunId((n) => n + 1)
    setScreen('endless')
  }
  const onEnd = (r) => {
    if (screen === 'endless') {
      setRecord(r.distance > progress.endlessBest)
      setProgress((p) => ({ ...p, endlessBest: Math.max(p.endlessBest, r.distance) }))
    } else {
      const prev = progress.levels[LEVELS[levelIdx].id]?.best || 0
      setRecord(r.win && r.score > prev)
      setProgress((p) => recordLevel(p, levelIdx, LEVELS[levelIdx].id, r))
    }
    setResult(r)
  }

  if (screen === 'title')
    return (
      <Title
        onPlay={() => {
          unlockAudio()
          sfx.click()
          setScreen('select')
        }}
        onEndless={startEndless}
        settings={progress.settings}
        setSettings={(s) => setProgress((p) => ({ ...p, settings: s }))}
        best={progress.endlessBest}
      />
    )
  if (screen === 'select') return <LevelSelect progress={progress} onPick={start} onBack={() => setScreen('title')} />

  const endless = screen === 'endless'
  const def = endless ? null : LEVELS[levelIdx]
  return (
    <>
      <GameScreen
        key={runId}
        def={def}
        endless={endless}
        settings={progress.settings}
        label={endless ? 'Course sans fin' : `${def.id} · ${def.name}`}
        onEnd={onEnd}
        onQuit={() => setScreen(endless ? 'title' : 'select')}
      />
      {result && (
        <Results
          r={result}
          endless={endless}
          record={record}
          isLast={levelIdx >= LEVELS.length - 1}
          onRetry={() => (endless ? startEndless() : start(levelIdx))}
          onNext={() => start(levelIdx + 1)}
          onMenu={() => setScreen(endless ? 'title' : 'select')}
        />
      )}
    </>
  )
}

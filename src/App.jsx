import { useEffect, useRef, useState } from 'react'
import MatchScreen from './components/MatchScreen.jsx'
import { PLAYER_TEAM, RIVALS, SPECIALS, rosterKit } from './game/teams.js'
import { load, save, recordMatch } from './game/storage.js'
import { setSound, setMusic, unlockAudio, sfx } from './game/audio.js'
import { drawAthlete, drawBall } from './game/sprites.js'

// Petit portrait animé d'un joueur (dessin original)
function Portrait({ kit, pose = 'idle', ball = null, className = 'h-24 w-20', scale = 2.2, facing = 1 }) {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const w = c.clientWidth
    const h = c.clientHeight
    c.width = w * dpr
    c.height = h * dpr
    let raf
    const t0 = performance.now()
    const loop = (now) => {
      const t = (now - t0) / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
      drawAthlete(ctx, { x: w / scale / 2, y: h / scale - 4, pose, t, kit, ball, facing })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [kit, pose, ball, scale, facing])
  return <canvas ref={ref} className={className} />
}

// Duel animé de l'écran titre : notre capitaine tire, la balle traverse
function TitleDuel() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    const ctx = c.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    c.width = 300 * dpr
    c.height = 140 * dpr
    let raf
    const t0 = performance.now()
    const rival = RIVALS[5]
    const loop = (now) => {
      const t = (now - t0) / 1000
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, 300, 140)
      ctx.setTransform(dpr * 2, 0, 0, dpr * 2, 0, 0)
      const ph = t % 2.4
      const throwing = ph > 1.1 && ph < 1.35
      const flying = ph >= 1.35 && ph < 2.0
      drawAthlete(ctx, { x: 26, y: 62, pose: ph < 0.9 ? 'hold' : ph < 1.35 ? 'windup' : 'throw', t, kit: PLAYER_TEAM.kit, ball: ph < 1.35 ? 'super' : null, glow: ph > 0.5 && ph < 1.35 ? '#22d3ee' : null })
      const hit = ph >= 2.0
      drawAthlete(ctx, { x: 124, y: 62, facing: -1, pose: hit ? 'hurt' : 'idle', t, kit: rival.kit, flash: hit && ph < 2.15 })
      if (flying) drawBall(ctx, { x: 36 + ((ph - 1.35) / 0.65) * 84, y: 42 + Math.sin((ph - 1.35) * 20) * 6, kind: 'super', r: 5, spin: t * 8 })
      if (throwing) drawBall(ctx, { x: 34, y: 40, kind: 'super', r: 5 })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <canvas ref={ref} className="h-[140px] w-[300px]" />
}

function Toggles({ settings, setSettings }) {
  const toggle = (k) => {
    sfx.click()
    setSettings({ ...settings, [k]: !settings[k] })
  }
  return (
    <div className="flex flex-wrap justify-center gap-2 text-sm font-bold">
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
  )
}

function Title({ onTournament, onQuick, onHowTo, settings, setSettings, trophies }) {
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,#6d28d9_0%,#120a2e_62%)]" />
      <div className="relative">
        <TitleDuel />
      </div>
      <h1 className="relative font-display text-5xl leading-none text-sun text-outline sm:text-7xl">
        Neon
        <br />
        <span className="text-aqua">Dodge</span>
      </h1>
      <p className="relative max-w-sm font-bold text-white/80">La balle au prisonnier à un doigt. Deux équipes, un terrain, un tournoi.</p>
      <div className="relative flex w-full max-w-xs flex-col gap-3">
        <button type="button" onClick={onTournament} className="rounded-2xl border-4 border-night bg-flame py-4 font-display text-2xl shadow-[0_6px_0_#1b1530] active:translate-y-1 active:shadow-none">
          Tournoi
        </button>
        <button type="button" onClick={onQuick} className="rounded-2xl border-4 border-night bg-aqua py-3 font-display text-lg text-night shadow-[0_6px_0_#1b1530] active:translate-y-1 active:shadow-none">
          Match rapide
        </button>
        <button type="button" onClick={onHowTo} className="rounded-2xl border-2 border-white/30 py-2.5 font-black text-white/90 active:scale-95">
          Comment jouer
        </button>
        {trophies > 0 && <div className="text-sm font-black text-sun">🏆 Tournoi gagné {trophies} fois</div>}
      </div>
      <div className="relative">
        <Toggles settings={settings} setSettings={setSettings} />
      </div>
      <p className="relative max-w-sm text-xs text-white/40">Jeu original. Tout reste sur l’appareil : aucun compte, aucun suivi.</p>
    </div>
  )
}

function HowTo({ onBack }) {
  const rows = [
    ['Balle en main', 'Maintenez le doigt : votre joueur court vers la ligne. Relâchez : il tire sur l’adversaire en face (repéré par l’anneau orange).'],
    ['Super tir', 'Courez au moins 0,4 s avant de relâcher : la jauge se remplit et le tir spécial du joueur part. L’adversaire ne peut pas l’attraper.'],
    ['Passe', 'Glissez le doigt vers le haut pendant que vous tenez la balle. Après une course complète, c’est une passe spéciale : le receveur tire un super tir.'],
    ['En défense', 'Le joueur visé est entouré de bleu. Touchez juste avant l’impact pour attraper la balle (3 images avant : PARFAIT). Trop tôt, il reste exposé.'],
    ['Esquiver', 'Maintenez le doigt sans balle : votre joueur saute et laisse passer le tir.'],
    ['Victoire', 'Chaque intérieur a des points de vie. Mettez les 4 intérieurs adverses KO. Les 3 extérieurs de chaque équipe tirent depuis les bords.'],
  ]
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-5 py-8">
      <button type="button" onClick={onBack} className="self-start rounded-xl bg-white/10 px-4 py-2 font-black active:scale-95">
        ← Retour
      </button>
      <h2 className="font-display text-2xl text-sun">Comment jouer</h2>
      {rows.map(([h, t]) => (
        <div key={h} className="rounded-2xl bg-white/5 p-4">
          <div className="font-black text-aqua">{h}</div>
          <div className="mt-1 text-sm font-medium text-white/80">{t}</div>
        </div>
      ))}
      <div className="text-xs text-white/50">Sur ordinateur : barre d’espace (maintenir / relâcher), flèche du haut pour passer.</div>
    </div>
  )
}

function Tournament({ progress, onPick, onBack }) {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/10 px-4 py-2 font-black active:scale-95">
          ← Retour
        </button>
        <div className="font-display text-xl text-sun">Tournoi</div>
        <div className="w-20" />
      </div>
      <div className="rounded-3xl border-2 border-white/10 bg-white/5 p-4">
        <div className="font-display text-sm text-flame">Votre équipe : {PLAYER_TEAM.name}</div>
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {PLAYER_TEAM.players.map((p, i) => (
            <div key={p.name} className="flex shrink-0 flex-col items-center">
              <Portrait kit={rosterKit(PLAYER_TEAM, i)} className="h-16 w-12" scale={1.5} />
              <div className="text-[10px] font-black">{p.name}</div>
              <div className="text-[9px] text-white/50">{i < 4 ? 'intérieur' : 'extérieur'}</div>
            </div>
          ))}
        </div>
      </div>
      {RIVALS.map((r, i) => {
        const open = i <= progress.beaten
        const done = i < progress.beaten
        return (
          <button
            key={r.id}
            type="button"
            disabled={!open}
            onClick={() => onPick(i)}
            className={`flex items-center gap-3 rounded-3xl border-4 border-night p-3 text-left shadow-[0_5px_0_#1b1530] active:translate-y-1 active:shadow-none ${open ? 'bg-white text-night' : 'bg-white/15 text-white/40'}`}
          >
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl" style={{ background: open ? r.accent : '#ffffff22' }}>
              {open ? <Portrait kit={r.kit} className="h-14 w-12" scale={1.4} facing={-1} /> : <span className="font-display text-xl">?</span>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-black uppercase tracking-wider opacity-60">Match {i + 1}{i === RIVALS.length - 1 ? ' · finale' : ''}</div>
              <div className="font-display text-lg leading-tight">{open ? r.name : 'Verrouillé'}</div>
              {open && <div className="text-xs font-bold opacity-60">Tirs spéciaux : {[...new Set(r.players.map((p) => SPECIALS[p.special].name))].join(', ')}</div>}
            </div>
            <div className="text-right text-xs font-black">{done ? <span className="text-emerald-600">Gagné{progress.best[i] ? ` · ${progress.best[i]}` : ''}</span> : open ? 'Jouer →' : ''}</div>
          </button>
        )
      })}
    </div>
  )
}

function Results({ r, rival, isFinal, inTournament, onNext, onRetry, onMenu }) {
  return (
    <div className="fixed inset-0 z-10 grid place-items-center bg-ink/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop rounded-3xl border-4 border-night bg-white p-6 text-center text-night shadow-2xl">
        <div className={`font-display text-4xl ${r.win ? 'text-flame' : 'text-slate-500'}`}>{r.win ? (isFinal && inTournament ? 'Champions !' : 'Victoire !') : 'Défaite…'}</div>
        <div className="mt-1 text-sm font-bold text-slate-500">contre {rival.name}</div>
        {r.win && <div className="mt-3 font-display text-3xl">{r.score}</div>}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-left text-sm font-bold">
          <dt className="text-slate-500">Adversaires KO</dt>
          <dd className="text-right">{r.kos} / 4</dd>
          <dt className="text-slate-500">Tirs au but</dt>
          <dd className="text-right">{r.hits}</dd>
          <dt className="text-slate-500">Balles attrapées</dt>
          <dd className="text-right">
            {r.catches} <span className="text-slate-400">({r.perfects} parfaites)</span>
          </dd>
          <dt className="text-slate-500">Super tirs</dt>
          <dd className="text-right">{r.supers}</dd>
          <dt className="text-slate-500">Joueurs encore debout</dt>
          <dd className="text-right">{r.survivors} / 4</dd>
        </dl>
        <div className="mt-6 flex flex-col gap-3">
          {r.win && inTournament && !isFinal && (
            <button type="button" onClick={onNext} className="rounded-2xl bg-flame py-3 font-black text-white active:scale-95">
              Match suivant
            </button>
          )}
          <button type="button" onClick={onRetry} className="rounded-2xl bg-night py-3 font-black text-white active:scale-95">
            {r.win ? 'Rejouer' : 'Revanche'}
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
  const [idx, setIdx] = useState(0)
  const [tournament, setTournament] = useState(true)
  const [result, setResult] = useState(null)
  const [runId, setRunId] = useState(0)

  useEffect(() => {
    save(progress)
    setSound(progress.settings.sound)
    setMusic(progress.settings.music)
  }, [progress])

  const play = (i, inTournament = true) => {
    unlockAudio()
    sfx.click()
    setIdx(i)
    setTournament(inTournament)
    setResult(null)
    setRunId((n) => n + 1)
    setScreen('match')
  }
  const go = (s) => {
    unlockAudio()
    sfx.click()
    setScreen(s)
  }

  if (screen === 'title')
    return (
      <Title
        onTournament={() => go('tournament')}
        onQuick={() => play(Math.min(progress.beaten, RIVALS.length - 1) === 0 ? 0 : Math.floor(Math.random() * (Math.min(progress.beaten, RIVALS.length - 1) + 1)), false)}
        onHowTo={() => go('howto')}
        settings={progress.settings}
        setSettings={(s) => setProgress((p) => ({ ...p, settings: s }))}
        trophies={progress.trophies}
      />
    )
  if (screen === 'howto') return <HowTo onBack={() => go('title')} />
  if (screen === 'tournament') return <Tournament progress={progress} onPick={(i) => play(i, true)} onBack={() => go('title')} />

  const rival = RIVALS[idx]
  return (
    <>
      <MatchScreen
        key={runId}
        rival={rival}
        settings={progress.settings}
        playerAccent={PLAYER_TEAM.accent}
        label={`${tournament ? `Tournoi · match ${idx + 1}` : 'Match rapide'} · ${rival.name}`}
        onEnd={(r) => {
          if (tournament) setProgress((p) => recordMatch(p, idx, RIVALS.length, r))
          setResult(r)
        }}
        onQuit={() => go(tournament ? 'tournament' : 'title')}
      />
      {result && (
        <Results
          r={result}
          rival={rival}
          isFinal={idx === RIVALS.length - 1}
          inTournament={tournament}
          onNext={() => play(idx + 1, true)}
          onRetry={() => play(idx, tournament)}
          onMenu={() => go(tournament ? 'tournament' : 'title')}
        />
      )}
    </>
  )
}

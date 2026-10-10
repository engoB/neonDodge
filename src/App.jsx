import { useEffect, useRef, useState } from 'react'
import MatchScreen from './components/MatchScreen.jsx'
import { PLAYER_TEAM, RIVALS } from './game/teams.js'
import { load, save, recordMatch } from './game/storage.js'
import { setSound, setMusic, unlockAudio, sfx } from './game/audio.js'
import { drawAthlete, preloadSprites } from './game/sprites.js'
import { drawBackdrop } from './game/scenery.js'
import { storyStage, teamEmblem } from './game/art.js'
import dialogueCaptains from '../assets/dialogue-captains-v2.webp'

const DIALOGUE_PORTRAITS = {
  neons: 0,
  chaussettes: 1,
  corbeaux: 2,
  mouettes: 3,
  cactus: 4,
  requins: 5,
  eclairs: 6,
}

function DialoguePortrait({ team, side, speaking }) {
  const index = DIALOGUE_PORTRAITS[team.id] ?? 0
  const column = index % 4
  const row = Math.floor(index / 4)
  return (
    <div
      className={`dialogue-portrait ${side} ${speaking ? 'speaking' : ''}`}
      style={{
        '--portrait-sheet': `url(${dialogueCaptains})`,
        '--portrait-x': `${column * (100 / 3)}%`,
        '--portrait-y': `${row * 100}%`,
      }}
      aria-hidden="true"
    />
  )
}

function TeamEmblem({ team, className = '' }) {
  return <img className={`team-emblem ${className}`} src={teamEmblem(team)} alt={`Emblème ${team.name}`} />
}

function PortraitOnlyGate() {
  return (
    <aside className="portrait-required" aria-label="Orientation portrait requise">
      <span>↻</span>
      <strong>TOURNEZ L’ÉCRAN</strong>
      <small>NEON SLUGGER SE JOUE EN PORTRAIT</small>
    </aside>
  )
}

export function Portrait({ kit, pose = 'idle', className = '', facing = 1, reducedMotion = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let raf,
      disposed = false
    const draw = (now = 0) => {
      const w = canvas.clientWidth,
        h = canvas.clientHeight
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.imageSmoothingEnabled = false
      const scale = Math.min(w / 58, h / 58)
      ctx.translate(w / 2, h - 5)
      ctx.scale(scale, scale)
      drawAthlete(ctx, {
        x: 0,
        y: 0,
        kit,
        pose,
        facing,
        t: reducedMotion ? 0 : now / 1000,
        ball: ['hold', 'windup'].includes(pose) ? 'player' : null,
      })
      if (!reducedMotion) raf = requestAnimationFrame(draw)
    }
    preloadSprites()
      .then(() => {
        if (!disposed) draw()
      })
      .catch(() => {})
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
    }
  }, [kit, pose, facing, reducedMotion])
  return <canvas ref={ref} className={`portrait ${className}`} aria-hidden="true" />
}

function SceneBackground({ arena, className }) {
  const ref = useRef(null)
  useEffect(() => {
    let active = true,
      observer
    const draw = () => {
      if (!active) return
      const canvas = ref.current
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const width = Math.max(360, Math.round(canvas.clientWidth * dpr)),
        height = Math.max(640, Math.round(canvas.clientHeight * dpr))
      canvas.width = width
      canvas.height = height
      drawBackdrop(arena, canvas.getContext('2d'), width, height)
    }
    preloadSprites()
      .then(() => {
        draw()
        observer = new ResizeObserver(draw)
        observer.observe(ref.current)
      })
      .catch(() => {})
    return () => {
      active = false
      observer?.disconnect()
    }
  }, [arena])
  return <canvas ref={ref} className={className} aria-hidden="true" />
}

function Title({ onStart, trophies }) {
  return (
    <main className="title-screen">
      <section className="title-stage" aria-labelledby="hero-title">
        <div className="hero-art" />
        <div className="hero-grid" />
        <div className="title-lockup title-lockup-minimal">
          <h1 id="hero-title">
            <span>NEON</span>SLUGGER<span className="title-star">✦</span>
          </h1>
          <p>BASEBALL × BALLE AU PRISONNIER</p>
          <button className="start-game" onClick={onStart}>
            JOUER
          </button>
          {trophies > 0 && <p className="title-trophies">✦ CHAMPION × {trophies}</p>}
        </div>
      </section>
    </main>
  )
}

function ConsoleMenu({ onStory, onArcade, onTraining, onOptions, progress }) {
  const [selected, setSelected] = useState(0)
  const items = [
    [
      'HISTOIRE',
      progress.beaten ? `CHAPITRE ${Math.min(6, progress.beaten + 1)}` : 'NOUVELLE PARTIE',
      onStory,
    ],
    ['ARCADE', 'MATCH RAPIDE', onArcade],
    ['ENTRAÎNEMENT', 'APPRENDRE ET ESSAYER', onTraining],
    ['OPTIONS', 'SON · IMAGE · CONFORT', onOptions],
  ]
  return (
    <main className="console-menu-screen">
      <div className="console-menu-bg" />
      <section className="console-menu-panel" aria-label="Menu principal">
        <span className="eyebrow">NEON SLUGGER</span>
        <nav className="console-menu-list" aria-label="Menu principal">
          {items.map(([title, detail, action], i) => (
            <button
              key={title}
              onClick={action}
              onPointerEnter={() => setSelected(i)}
              onFocus={() => setSelected(i)}
              className={i === selected ? 'selected' : ''}
            >
              <span>
                <b>{title}</b>
                <small>{detail}</small>
              </span>
            </button>
          ))}
        </nav>
      </section>
    </main>
  )
}

function ValueStepper({ label, value, onPrev, onNext }) {
  return (
    <div className="value-stepper">
      <span>{label}</span>
      <div>
        <button onClick={onPrev} aria-label={`${label}, valeur précédente`}>
          ◀
        </button>
        <strong>{value}</strong>
        <button onClick={onNext} aria-label={`${label}, valeur suivante`}>
          ▶
        </button>
      </div>
    </div>
  )
}

function ModeSetup({ training, onPlay, onBack, reducedMotion }) {
  const clubs = [PLAYER_TEAM, ...RIVALS]
  const [club, setClub] = useState(0)
  const ownTeam = clubs[club]
  const [selected, setSelected] = useState(0)
  const [venue, setVenue] = useState(0)
  const rival = RIVALS[selected]
  const cycle = (delta) => {
    const next = (selected + delta + RIVALS.length) % RIVALS.length
    setSelected(next)
  }
  return (
    <main className="mode-setup" style={{ '--team-accent': rival.accent }}>
      <SceneBackground arena="gym" className="mode-backdrop arena-gym" />
      <button className="console-back" onClick={onBack}>
        MENU
      </button>
      <section>
        <span className="eyebrow">{training ? 'SALLE D’ENTRAÎNEMENT' : 'DUEL ARCADE'}</span>
        <h1>{training ? 'ENTRAÎNEMENT' : 'MATCH ARCADE'}</h1>
        <div className="versus-select emblem-versus">
          <TeamEmblem team={ownTeam} />
          <b>VS</b>
          <TeamEmblem team={rival} />
        </div>
        <ValueStepper
          label="ÉQUIPE"
          value={ownTeam.name.toUpperCase()}
          onPrev={() => setClub((club - 1 + clubs.length) % clubs.length)}
          onNext={() => setClub((club + 1) % clubs.length)}
        />
        <ValueStepper
          label="ADVERSAIRE"
          value={rival.name.toUpperCase()}
          onPrev={() => cycle(-1)}
          onNext={() => cycle(1)}
        />
        <div className="stadium-picker" aria-label="Terrain sélectionné">
          <span>TERRAIN</span>
          <div className="stadium-card">
            <SceneBackground
              key={RIVALS[venue].arena}
              arena={RIVALS[venue].arena}
              className="stadium-thumb"
            />
            <button
              className="stadium-prev"
              onClick={() => setVenue((venue - 1 + RIVALS.length) % RIVALS.length)}
              aria-label="Terrain précédent"
            >
              ◀
            </button>
            <strong>{RIVALS[venue].stadium.toUpperCase()}</strong>
            <button
              className="stadium-next"
              onClick={() => setVenue((venue + 1) % RIVALS.length)}
              aria-label="Terrain suivant"
            >
              ▶
            </button>
            <small>
              {RIVALS[venue].name.toUpperCase()} · {String(venue + 1).padStart(2, '0')}/06
            </small>
          </div>
        </div>
        <button className="start-game compact" onClick={() => onPlay(selected, ownTeam, RIVALS[venue].arena)}>
          {training ? 'ENTRAÎNEMENT !' : 'MATCH !'}
        </button>
      </section>
    </main>
  )
}

function Tournament({ progress, onPick, reducedMotion, onBack }) {
  const [selected, setSelected] = useState(Math.min(progress.beaten, RIVALS.length - 1))
  const rival = RIVALS[selected]
  const open = selected <= progress.beaten
  return (
    <main className="story-select" style={{ '--team-accent': rival.accent }}>
      <SceneBackground arena="neon" className="mode-backdrop arena-neon" />
      <button className="console-back" onClick={onBack}>
        MENU
      </button>
      <section>
        <span className="eyebrow">COUPE NÉON</span>
        <h1>CHAPITRE {String(selected + 1).padStart(2, '0')}</h1>
        <div className="chapter-stage">
          <img
            src={storyStage(selected)}
            alt={`${PLAYER_TEAM.name} contre ${rival.name}`}
            draggable="false"
            style={{ pointerEvents: 'none' }}
          />
          <button
            className="chapter-prev"
            onClick={() => setSelected((selected - 1 + RIVALS.length) % RIVALS.length)}
            aria-label="Chapitre précédent"
          >
            ◀
          </button>
          <button
            className="chapter-next"
            onClick={() => setSelected((selected + 1) % RIVALS.length)}
            aria-label="Chapitre suivant"
          >
            ▶
          </button>
        </div>
        <div className="chapter-caption">
          <TeamEmblem team={rival} />
          <div>
            <h2>{rival.name}</h2>
            <p>{rival.stadium}</p>
          </div>
          <strong>{open ? `STAGE ${selected + 1}` : 'FERMÉ'}</strong>
        </div>
        <button className="start-game compact" disabled={!open} onClick={() => onPick(selected)}>
          {open ? 'MATCH !' : 'VERROUILLÉ'}
        </button>
      </section>
    </main>
  )
}

const STORY_BEATS = [
  [
    'Gaspard',
    'Le Parc des Renards appartient aux Red Bats. Rentrez chez vous.',
    'Riko',
    'On ne vient pas prendre votre terrain. On vient gagner votre respect.',
  ],
  [
    'Iris',
    'Je connais déjà chacun de tes angles, Riko.',
    'Riko',
    'Alors regarde bien celui que je vais inventer.',
  ],
  [
    'Marin',
    'Ici, même le vent joue pour les Harbor Sharks.',
    'Riko',
    'Parfait. Il poussera notre victoire jusqu’aux tribunes.',
  ],
  [
    'Pico',
    'Notre rythme va vous faire courir après le match.',
    'Riko',
    'Les Renards ne suivent pas le rythme. Ils le déclenchent.',
  ],
  [
    'Bruce',
    'Une balle des Iron Bulls suffit pour éteindre vos néons.',
    'Riko',
    'Essaie. Les nôtres brillent encore plus fort sous les impacts.',
  ],
  [
    'Vega',
    'Tu voulais la couronne. Il faut maintenant me la prendre.',
    'Riko',
    'Pas la prendre, Vega. La mériter devant tout le Dôme.',
  ],
]

function StoryDialog({ rival, index, reducedMotion, onPlay, onClose }) {
  const ref = useRef(null)
  const [line, setLine] = useState(0)
  const beat = STORY_BEATS[index]
  const lines = [
    {
      speaker: 'Riko',
      text: `${rival.stadium}. Les Neon Foxes sont prêts. On joue notre baseball, jusqu’au dernier impact.`,
      side: 'riko',
    },
    { speaker: beat[0], text: beat[1], side: 'rival' },
    { speaker: beat[2], text: beat[3], side: 'riko' },
  ]
  const current = lines[line]
  useEffect(() => {
    ref.current?.showModal()
    return () => ref.current?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="story-dialog"
      aria-label={`Dialogue du chapitre ${index + 1}`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <section className={`story-card arena-${rival.arena}`} style={{ '--rival-accent': rival.accent }}>
        <SceneBackground arena={rival.arena} className="story-background" />
        <div className="story-topline">
          <span>
            CHAPITRE 0{index + 1} · {rival.stadium}
          </span>
        </div>
        <div className="story-versus story-cast">
          <div className={current.side === 'riko' ? 'speaking' : ''}>
            <DialoguePortrait team={PLAYER_TEAM} side="left" speaking={current.side === 'riko'} />
            <b>RIKO</b>
            <small>NEON FOXES</small>
          </div>
          <div className={current.side === 'rival' ? 'speaking' : ''}>
            <DialoguePortrait team={rival} side="right" speaking={current.side === 'rival'} />
            <b>{rival.players[0].name.toUpperCase()}</b>
            <small>{rival.name.toUpperCase()}</small>
          </div>
        </div>
        <div className={`speech-box ${current.side}`}>
          <span>{current.speaker}</span>
          <p>{current.text}</p>
          <i>▼</i>
        </div>
        <div className="story-dots" aria-label={`Dialogue ${line + 1} sur ${lines.length}`}>
          {lines.map((_, i) => (
            <i key={i} className={i === line ? 'active' : ''} />
          ))}
        </div>
        <div className="story-actions">
          <button className="button secondary story-return" onClick={onClose}>
            RETOUR
          </button>
          <button
            className="button primary story-next"
            onClick={() => (line < lines.length - 1 ? setLine(line + 1) : onPlay())}
          >
            {line < lines.length - 1 ? 'SUIVANT' : 'MATCH !'}
          </button>
        </div>
      </section>
    </dialog>
  )
}

function Settings({ settings, setSettings, onClose }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="settings-dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">NEON SLUGGER</span>
          <h2>OPTIONS</h2>
        </div>
        <button className="dialog-back" onClick={onClose} aria-label="Retour au menu">
          RETOUR
        </button>
      </div>
      {[
        ['sound', 'EFFETS SONORES'],
        ['music', 'MUSIQUE'],
        ['reducedMotion', 'ANIMATIONS RÉDUITES'],
      ].map(([key, title]) => (
        <div key={key} className="option-stepper" role="group" aria-label={title}>
          <span>{title}</span>
          <div>
            <button
              onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
              aria-label={`${title}, précédent`}
            >
              ◀
            </button>
            <b>{settings[key] ? 'ACTIF' : 'COUPÉ'}</b>
            <button
              onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
              aria-label={`${title}, suivant`}
            >
              ▶
            </button>
          </div>
        </div>
      ))}
      <button className="start-game compact" onClick={onClose}>
        VALIDER
      </button>
    </dialog>
  )
}

function Results({ r, rival, playerTeam, isFinal, inTournament, onNext, onRetry, onMenu }) {
  const seconds = Math.floor(r.frames / 60)
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    return () => dialog.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="result-dialog"
      aria-labelledby="result-title"
      onCancel={(event) => {
        event.preventDefault()
        onMenu()
      }}
    >
      <section className="result-card">
        <span className="eyebrow">
          {isFinal && r.win && inTournament ? 'COUPE NÉON · LES CHAMPIONS' : 'LE MATCH EST TERMINÉ'}
        </span>
        <div className="result-versus">
          <TeamEmblem team={playerTeam} />
          <b id="result-title">{r.win ? 'VICTOIRE' : 'DÉFAITE'}</b>
          <TeamEmblem team={rival} />
        </div>
        <p>
          <small>
            {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')} · {rival.name}
          </small>
        </p>
        <div className="result-score">
          <span>SCORE FINAL</span>
          <strong>{r.score.toLocaleString('fr-FR')}</strong>
        </div>
        <dl className="result-stats">
          {[
            ['STRIKE OUTS', `${r.kos}/4`],
            ['RATTRAPAGES', r.catches],
            ['PARFAITS', r.perfects],
            ['SUPER TIRS', r.supers],
          ].map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="result-actions">
          {r.win && inTournament && !isFinal && (
            <button className="button primary" onClick={onNext}>
              PROCHAIN MATCH
            </button>
          )}
          <button
            className={`button ${r.win && inTournament && !isFinal ? 'secondary' : 'primary'}`}
            onClick={onRetry}
          >
            {r.win ? 'REJOUER' : 'REVANCHE'}
          </button>
          <button className="button secondary" onClick={onMenu}>
            RETOUR AU CLUB
          </button>
        </div>
      </section>
    </dialog>
  )
}

export default function App() {
  const [progress, setProgress] = useState(load),
    [screen, setScreen] = useState('title'),
    [idx, setIdx] = useState(0),
    [tournament, setTournament] = useState(true),
    [result, setResult] = useState(null),
    [runId, setRunId] = useState(0),
    [settingsOpen, setSettingsOpen] = useState(false),
    [briefing, setBriefing] = useState(null),
    [mode, setMode] = useState('story'),
    [playerTeam, setPlayerTeam] = useState(PLAYER_TEAM),
    [matchArena, setMatchArena] = useState(RIVALS[0].arena)
  useEffect(() => {
    save(progress)
    setSound(progress.settings.sound)
    setMusic(progress.settings.music)
    document.documentElement.dataset.motion = progress.settings.reducedMotion ? 'reduced' : 'full'
  }, [progress])
  const play = (
    i,
    inTournament = true,
    nextMode = inTournament ? 'story' : 'arcade',
    club = PLAYER_TEAM,
    arena = RIVALS[i].arena,
  ) => {
    unlockAudio()
    sfx.click()
    setIdx(i)
    setTournament(inTournament)
    setMode(nextMode)
    setPlayerTeam(club)
    setMatchArena(arena)
    setResult(null)
    setRunId((n) => n + 1)
    setScreen('match')
  }
  const go = (s) => {
    unlockAudio()
    sfx.click()
    setScreen(s)
    window.scrollTo(0, 0)
  }
  if (screen === 'match')
    return (
      <>
        <PortraitOnlyGate />
        <MatchScreen
          key={runId}
          rival={{ ...RIVALS[idx], arena: matchArena }}
          settings={progress.settings}
          label={`${tournament ? `Coupe Néon · match ${idx + 1}` : 'Match express'} · ${RIVALS[idx].name}`}
          training={mode === 'training'}
          playerTeam={playerTeam}
          onEnd={(r) => {
            if (tournament) setProgress((p) => recordMatch(p, idx, RIVALS.length, r))
            setResult(r)
          }}
          onQuit={() => go(tournament ? 'tournament' : 'menu')}
        />
        {result && (
          <Results
            r={result}
            rival={RIVALS[idx]}
            playerTeam={playerTeam}
            isFinal={idx === RIVALS.length - 1}
            inTournament={tournament}
            onNext={() => {
              go('tournament')
              setBriefing(idx + 1)
            }}
            onRetry={() => play(idx, tournament, mode, playerTeam, matchArena)}
            onMenu={() => go(tournament ? 'tournament' : 'menu')}
          />
        )}
      </>
    )
  return (
    <>
      <PortraitOnlyGate />
      {screen === 'title' && <Title onStart={() => go('menu')} trophies={progress.trophies} />}{' '}
      {screen === 'menu' && (
        <ConsoleMenu
          progress={progress}
          onStory={() => go('tournament')}
          onArcade={() => go('arcade')}
          onTraining={() => go('training')}
          onOptions={() => setSettingsOpen(true)}
        />
      )}{' '}
      {screen === 'tournament' && (
        <Tournament
          progress={progress}
          onPick={(i) => setBriefing(i)}
          reducedMotion={progress.settings.reducedMotion}
          onBack={() => go('menu')}
        />
      )}{' '}
      {screen === 'arcade' && (
        <ModeSetup
          onBack={() => go('menu')}
          onPlay={(i, club, arena) => play(i, false, 'arcade', club, arena)}
          reducedMotion={progress.settings.reducedMotion}
        />
      )}{' '}
      {screen === 'training' && (
        <ModeSetup
          training
          onBack={() => go('menu')}
          onPlay={(i, club, arena) => play(i, false, 'training', club, arena)}
          reducedMotion={progress.settings.reducedMotion}
        />
      )}{' '}
      {settingsOpen && (
        <Settings
          settings={progress.settings}
          setSettings={(settings) => setProgress((p) => ({ ...p, settings }))}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {briefing !== null && (
        <StoryDialog
          key={RIVALS[briefing].id}
          rival={RIVALS[briefing]}
          index={briefing}
          reducedMotion={progress.settings.reducedMotion}
          onClose={() => setBriefing(null)}
          onPlay={() => {
            const selected = briefing
            setBriefing(null)
            play(selected, true, 'story')
          }}
        />
      )}
    </>
  )
}

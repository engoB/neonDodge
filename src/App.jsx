import { useEffect, useRef, useState } from 'react'
import MatchScreen from './components/MatchScreen.jsx'
import { PLAYER_TEAM, RIVALS, SPECIALS, rosterKit } from './game/teams.js'
import { load, save, recordMatch } from './game/storage.js'
import { setSound, setMusic, unlockAudio, sfx } from './game/audio.js'
import { drawAthlete, preloadSprites } from './game/sprites.js'

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

function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Neon Slugger, accueil">
      <span className="brand-ball">◈</span>
      <span>
        NEON
        <span className="brand-bottom">
          SLUGGER<span className="brand-dot">✦</span>
        </span>
      </span>
    </button>
  )
}

function Header({ screen, go, onSettings }) {
  return (
    <header className="site-header">
      <Brand onClick={() => go('title')} />
      {screen !== 'title' && (
        <nav aria-label="Navigation principale">
          {[
            ['tournament', 'Histoire'],
            ['roster', 'Équipe'],
            ['howto', 'Commandes'],
          ].map(([id, label]) => (
            <button key={id} className={screen === id ? 'active' : ''} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
      )}
      <button className="icon-button" onClick={onSettings} aria-label="Réglages">
        ⚙
      </button>
    </header>
  )
}

function Title({ onTournament, onQuick, onRoster, onHowTo, trophies, progress }) {
  return (
    <main className="title-screen">
      <section className="title-stage" aria-labelledby="hero-title">
        <div className="hero-art" />
        <div className="hero-grid" />
        <div className="title-lockup">
          <div className="eyebrow">BASEBALL × DODGEBALL</div>
          <h1 id="hero-title">
            <span>NEON</span>SLUGGER<span className="title-star">✦</span>
          </h1>
          <nav className="arcade-menu" aria-label="Menu du jeu">
            <button className="active" onClick={onTournament}>
              <span>01</span>
              <b>MODE HISTOIRE</b>
              <small>{progress.beaten > 0 ? `CONTINUER · ${progress.beaten}/6` : 'NOUVELLE SAISON'}</small>
              <i>▶</i>
            </button>
            <button onClick={onQuick}>
              <span>02</span>
              <b>MATCH ARCADE</b>
              <small>JOUER MAINTENANT</small>
              <i>▶</i>
            </button>
            <button onClick={onRoster}>
              <span>03</span>
              <b>ÉQUIPE</b>
              <small>NEON FOXES</small>
              <i>▶</i>
            </button>
            <button onClick={onHowTo}>
              <span>04</span>
              <b>COMMANDES</b>
              <small>PLAYBOOK</small>
              <i>▶</i>
            </button>
          </nav>
          {trophies > 0 && <p className="title-trophies">✦ CHAMPION × {trophies}</p>}
        </div>
        <div className="title-insert">PRESS START · ONE TOUCH ARCADE</div>
      </section>
    </main>
  )
}

function Tournament({ progress, onPick, reducedMotion }) {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <div className="eyebrow">MODE HISTOIRE · SAISON 01 · NEON CUP</div>
        <h1>
          La route vers la coupe<span>.</span>
        </h1>
        <p>Six clubs à battre. Une place sous les projecteurs.</p>
      </div>
      <div className="season-progress">
        <span>{Math.min(progress.beaten, 6)} / 6 VICTOIRES</span>
        <div>
          <i style={{ width: `${(Math.min(progress.beaten, 6) / 6) * 100}%` }} />
        </div>
        <b>{progress.beaten >= 6 ? 'CHAMPIONS ✦' : 'LA SAISON CONTINUE'}</b>
      </div>
      <div className="fixture-grid">
        {RIVALS.map((r, i) => {
          const open = i <= progress.beaten,
            done = i < progress.beaten
          return (
            <button
              key={r.id}
              disabled={!open}
              className={`fixture ${done ? 'completed' : ''}`}
              style={{ '--team-accent': r.accent }}
              onClick={() => onPick(i)}
            >
              <div className="fixture-top">
                <span>
                  CHAPITRE 0{i + 1} · MATCH 0{i + 1} {i === 5 ? '· FINALE' : ''}
                </span>
                <span>{done ? '✦ GAGNÉ' : open ? 'À VOUS DE JOUER' : 'VERROUILLÉ'}</span>
              </div>
              <div className="fixture-body">
                <Portrait
                  kit={rosterKit(r, 0)}
                  pose={done ? 'cheer' : 'idle'}
                  facing={-1}
                  reducedMotion={reducedMotion || !open}
                />
                <div>
                  <span className="eyebrow">{r.stadium}</span>
                  <h2>{r.name}</h2>
                  <p>{r.description}</p>
                </div>
              </div>
              <div className="fixture-bottom">
                <span>
                  {done
                    ? `RECORD ${progress.best[i] || 0}`
                    : ['DÉCOUVERTE', 'ÉCHAUFFEMENT', 'CONFIRMATION', 'EXPERT', 'ÉLITE', 'LÉGENDE'][i]}
                </span>
                <b>{open ? 'JOUER ↗' : '◈'}</b>
              </div>
            </button>
          )
        })}
      </div>
    </main>
  )
}

function Roster({ reducedMotion }) {
  const [selected, setSelected] = useState(0),
    [pose, setPose] = useState('idle')
  const p = PLAYER_TEAM.players[selected]
  return (
    <main className="page-shell">
      <div className="page-heading">
        <div className="eyebrow">LE CLUB · NEON FOXES</div>
        <h1>
          Sept joueurs. Zéro figurant<span>.</span>
        </h1>
        <p>Chaque joueur a son style, son rythme et son tir signature.</p>
      </div>
      <div className="roster-layout">
        <section className="player-showcase">
          <div className="player-number">0{selected + 1}</div>
          <Portrait kit={rosterKit(PLAYER_TEAM, selected)} pose={pose} reducedMotion={reducedMotion} />
          <span className="eyebrow">
            {selected === 0 ? 'CAPITAINE' : selected < 4 ? 'INTÉRIEUR' : 'EXTÉRIEUR'}
          </span>
          <h2>{p.name}</h2>
          <p>
            {SPECIALS[p.special].name} · {SPECIALS[p.special].desc}
          </p>
          <div className="pose-switch" aria-label="Animations du joueur">
            {[
              ['idle', 'Repos'],
              ['run', 'Course'],
              ['windup', 'Lancer'],
              ['catch', 'Réception'],
              ['cheer', 'Victoire'],
            ].map(([id, l]) => (
              <button key={id} aria-pressed={pose === id} onClick={() => setPose(id)}>
                {l}
              </button>
            ))}
          </div>
        </section>
        <section className="roster-detail">
          <div className="roster-list">
            {PLAYER_TEAM.players.map((player, i) => (
              <button key={player.name} aria-pressed={selected === i} onClick={() => setSelected(i)}>
                <Portrait kit={rosterKit(PLAYER_TEAM, i)} reducedMotion={reducedMotion} />
                <span>
                  {player.name}
                  <small>{i < 4 ? 'Intérieur' : 'Extérieur'}</small>
                </span>
                <b>0{i + 1}</b>
              </button>
            ))}
          </div>
          <div className="stat-list">
            {[
              ['force', 'Force'],
              ['power', 'Puissance'],
              ['speed', 'Vitesse'],
              ['jump', 'Saut'],
              ['catching', 'Réception'],
              ['defense', 'Défense'],
            ].map(([key, l]) => (
              <div key={key}>
                <span>{l}</span>
                <div>
                  <i style={{ width: `${(p.stats[key] / 11) * 100}%` }} />
                </div>
                <b>
                  {p.stats[key]}
                  <small>/11</small>
                </b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function HowTo({ onQuick }) {
  return (
    <main className="page-shell">
      <div className="page-heading">
        <div className="eyebrow">LE PLAYBOOK · UN SEUL DOIGT</div>
        <h1>
          Le bon geste. Au bon moment<span>.</span>
        </h1>
        <p>Mettez KO les quatre intérieurs adverses. Vos trois extérieurs jouent depuis les bords.</p>
      </div>
      <div className="rules-grid">
        {[
          [
            '01',
            '↗',
            'Chargez le lancer',
            'Balle en main : maintenez pour prendre votre élan. Relâchez pour lancer sur la cible orange.',
          ],
          [
            '02',
            '✦',
            'Trouvez la fenêtre',
            'La jauge devient dorée après 0,4 seconde. Relâchez pendant la fenêtre dorée pour un tir signature. Trop tard ? Le tir reste normal.',
          ],
          [
            '03',
            '↑',
            'Passez en une touche',
            'Appuyez sur Passe : le meilleur partenaire est choisi automatiquement. Une passe chargée arme son tir signature.',
          ],
          [
            '04',
            '◎',
            'Lisez la balle',
            'Le joueur ciblé est entouré de cyan. Touchez juste avant l’impact pour réceptionner. Seule une réception parfaite arrête un tir signature.',
          ],
          [
            '05',
            '↗',
            'Déclenchez le Jump Shot',
            'Balle en main : appuyez sur Jump Shot, le joueur saute et lance automatiquement au sommet. En défense, maintenez pour esquiver.',
          ],
          [
            '06',
            '◈',
            'Faites vivre le club',
            'Les joueurs se déplacent et récupèrent les balles seuls. Vous décidez des tirs, des passes et des réceptions.',
          ],
        ].map(([n, icon, title, text]) => (
          <article className="rule-card" key={n}>
            <span className="card-index">GESTE {n}</span>
            <span className="feature-symbol">{icon}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <div className="playbook-footer">
        <span>
          CLAVIER <kbd>Espace</kbd> Tir / réception <kbd>↑</kbd> Passe <kbd>X</kbd> Jump Shot <kbd>Échap</kbd>{' '}
          Pause
        </span>
        <button className="button primary" onClick={onQuick}>
          À VOUS DE JOUER <span>↗</span>
        </button>
      </div>
    </main>
  )
}

const STORY_BEATS = [
  [
    'Gaspard',
    'Le Fox Yard appartient aux Bats. Rentrez chez vous.',
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
    'Ici, même le vent joue pour les Sharks.',
    'Riko',
    'Parfait. Il poussera notre victoire jusqu’aux tribunes.',
  ],
  [
    'Pico',
    'Notre rythme va vous faire courir après le match.',
    'Riko',
    'Les Foxes ne suivent pas le rythme. Ils le déclenchent.',
  ],
  [
    'Bruce',
    'Une balle des Bulls suffit pour éteindre vos néons.',
    'Riko',
    'Essaie. Les nôtres brillent encore plus fort sous les impacts.',
  ],
  [
    'Vega',
    'Tu voulais la couronne. Il faut maintenant me la prendre.',
    'Riko',
    'Pas la prendre, Vega. La mériter devant tout le Dome.',
  ],
]

function StoryDialog({ rival, index, reducedMotion, onPlay, onClose }) {
  const ref = useRef(null)
  const [line, setLine] = useState(0)
  const beat = STORY_BEATS[index]
  const lines = [
    {
      speaker: 'Coach Nova',
      text: `Chapitre ${index + 1}. ${rival.stadium}. ${rival.description}`,
      side: 'coach',
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
      aria-labelledby="story-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <section className="story-card" style={{ '--rival-accent': rival.accent }}>
        <div className="story-topline">
          <span>MODE HISTOIRE · CHAPITRE 0{index + 1}</span>
          <button className="icon-button" onClick={onClose} aria-label="Fermer le dialogue">
            ×
          </button>
        </div>
        <h2 id="story-title">FACE À FACE</h2>
        <div className="story-versus">
          <div className={current.side === 'riko' ? 'speaking' : ''}>
            <Portrait kit={rosterKit(PLAYER_TEAM, 0)} pose="hold" reducedMotion={reducedMotion} />
            <b>RIKO</b>
            <small>NEON FOXES</small>
          </div>
          <span>VS</span>
          <div className={current.side === 'rival' ? 'speaking' : ''}>
            <Portrait kit={rosterKit(rival, 0)} pose="taunt" facing={-1} reducedMotion={reducedMotion} />
            <b>{rival.players[0].name.toUpperCase()}</b>
            <small>{rival.name.toUpperCase()}</small>
          </div>
        </div>
        <div className={`speech-box ${current.side}`}>
          <span>{current.speaker}</span>
          <p>« {current.text} »</p>
        </div>
        <div className="story-dots" aria-label={`Dialogue ${line + 1} sur ${lines.length}`}>
          {lines.map((_, i) => (
            <i key={i} className={i === line ? 'active' : ''} />
          ))}
        </div>
        <button
          className="button primary story-next"
          onClick={() => (line < lines.length - 1 ? setLine(line + 1) : onPlay())}
        >
          {line < lines.length - 1 ? 'CONTINUER' : 'PLAY BALL !'} <span>↗</span>
        </button>
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
          <span className="eyebrow">VOTRE EXPÉRIENCE</span>
          <h2>Réglages</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Fermer les réglages">
          ×
        </button>
      </div>
      {[
        ['sound', 'Effets sonores', 'Lancers, impacts et réceptions.'],
        ['music', 'Musique', 'La bande-son de chaque stade.'],
        ['haptics', 'Vibrations', 'Le timing au bout des doigts, si disponible.'],
        ['reducedMotion', 'Animations réduites', 'Moins de mouvements et de secousses.'],
      ].map(([key, title, text]) => (
        <button
          key={key}
          role="switch"
          aria-checked={settings[key]}
          className="setting-row"
          onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
        >
          <span>
            <b>{title}</b>
            <small>{text}</small>
          </span>
          <i className={settings[key] ? 'on' : ''} />
        </button>
      ))}
      <button className="button primary" onClick={onClose}>
        C’EST PARTI <span>↗</span>
      </button>
    </dialog>
  )
}

function Results({ r, rival, isFinal, inTournament, onNext, onRetry, onMenu }) {
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
          {isFinal && r.win && inTournament ? 'NEON CUP · LES CHAMPIONS' : 'LE MATCH EST TERMINÉ'}
        </span>
        <div className="result-emblem">{r.win ? '✦' : '◇'}</div>
        <h1 id="result-title">{r.win ? 'HOME RUN !' : 'REVANCHE ?'}</h1>
        <p>
          {r.win ? 'Les Foxes font vibrer le stade.' : 'Le prochain lancer sera le vôtre.'}
          <br />
          <small>
            contre {rival.name} · {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
          </small>
        </p>
        <div className="result-score">
          <span>SCORE FINAL</span>
          <strong>{r.score.toLocaleString('fr-FR')}</strong>
        </div>
        <dl className="result-stats">
          {[
            ['KO', `${r.kos}/4`],
            ['Réceptions', r.catches],
            ['Parfaites', r.perfects],
            ['Signatures', r.supers],
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
              PROCHAIN MATCH ↗
            </button>
          )}
          <button
            className={`button ${r.win && inTournament && !isFinal ? 'secondary' : 'primary'}`}
            onClick={onRetry}
          >
            {r.win ? 'REJOUER' : 'PRENDRE MA REVANCHE'} ↗
          </button>
          <button className="text-button" onClick={onMenu}>
            Retour au club →
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
    [briefing, setBriefing] = useState(null)
  useEffect(() => {
    save(progress)
    setSound(progress.settings.sound)
    setMusic(progress.settings.music)
    document.documentElement.dataset.motion = progress.settings.reducedMotion ? 'reduced' : 'full'
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
    window.scrollTo(0, 0)
  }
  const quick = () =>
    play(Math.floor(Math.random() * (Math.min(progress.beaten, RIVALS.length - 1) + 1)), false)
  if (screen === 'match')
    return (
      <>
        <MatchScreen
          key={runId}
          rival={RIVALS[idx]}
          settings={progress.settings}
          label={`${tournament ? `Neon Cup · match ${idx + 1}` : 'Match express'} · ${RIVALS[idx].name}`}
          onEnd={(r) => {
            if (tournament) setProgress((p) => recordMatch(p, idx, RIVALS.length, r))
            setResult(r)
          }}
          onQuit={() => go(tournament ? 'tournament' : 'title')}
        />
        {result && (
          <Results
            r={result}
            rival={RIVALS[idx]}
            isFinal={idx === RIVALS.length - 1}
            inTournament={tournament}
            onNext={() => play(idx + 1)}
            onRetry={() => play(idx, tournament)}
            onMenu={() => go(tournament ? 'tournament' : 'title')}
          />
        )}
      </>
    )
  return (
    <>
      <Header screen={screen} go={go} onSettings={() => setSettingsOpen(true)} />
      {screen === 'title' && (
        <Title
          onTournament={() => go('tournament')}
          onQuick={quick}
          onRoster={() => go('roster')}
          onHowTo={() => go('howto')}
          trophies={progress.trophies}
          progress={progress}
        />
      )}{' '}
      {screen === 'tournament' && (
        <Tournament
          progress={progress}
          onPick={(i) => setBriefing(i)}
          reducedMotion={progress.settings.reducedMotion}
        />
      )}{' '}
      {screen === 'roster' && <Roster reducedMotion={progress.settings.reducedMotion} />}{' '}
      {screen === 'howto' && <HowTo onQuick={quick} />}{' '}
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
            play(selected, true)
          }}
        />
      )}
    </>
  )
}

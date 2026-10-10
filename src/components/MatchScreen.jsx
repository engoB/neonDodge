import { useEffect, useRef, useState } from 'react'
import { Match } from '../game/match.js'
import { drawMatch, VIEW_H } from '../game/render.js'
import { preloadSprites } from '../game/sprites.js'
import { PLAYER_TEAM } from '../game/teams.js'
import { teamEmblem } from '../game/art.js'
import { unlockAudio, startMusic, stopMusic } from '../game/audio.js'
import baseballIcon from '../../assets/sprites/baseball.png'

const ARENA_MUSIC = { gym: 0, roof: 1, beach: 2, desert: 1, foundry: 2, neon: 3 }
function ActionIcon({ type }) {
  return (
    <span className={`pixel-action-icon ${type}`} aria-hidden="true">
      <img src={baseballIcon} alt="" />
      <i />
    </span>
  )
}
function TeamBar({ team, players, side }) {
  return (
    <div className={`score-team ${side}`} style={{ '--team-accent': team.accent }}>
      <div className="score-name">
        <img src={teamEmblem(team)} alt={team.name} />
        <b>{players.filter((p) => !p.ko).length}</b>
      </div>
      <div className="health-line">
        {players.map((p) => (
          <div
            className="health-player"
            key={p.name}
            aria-label={`${p.name} : ${p.hp} points de vie sur ${p.max}`}
          >
            <span>
              <i style={{ width: `${(p.hp / p.max) * 100}%` }} />
            </span>
            <small>{p.ko ? 'KO' : p.name}</small>
          </div>
        ))}
      </div>
    </div>
  )
}
export default function MatchScreen({
  rival,
  settings,
  onEnd,
  onQuit,
  label,
  training = false,
  playerTeam = PLAYER_TEAM,
}) {
  const canvasRef = useRef(null),
    arenaRef = useRef(null),
    matchRef = useRef(null),
    pointer = useRef(null),
    pauseRef = useRef(null),
    actionRef = useRef(null)
  const [hud, setHud] = useState(null),
    [paused, setPaused] = useState(false),
    [attempt, setAttempt] = useState(0),
    [pressing, setPressing] = useState(false),
    [pendingResult, setPendingResult] = useState(null)
  const [assetStatus, setAssetStatus] = useState('loading')
  function clearInput() {
    pointer.current = null
    matchRef.current?.cancelInput()
    setPressing(false)
  }
  function pause() {
    const m = matchRef.current
    if (!m || !['intro', 'play'].includes(m.state)) return
    m.resumeState = m.state
    clearInput()
    m.state = 'paused'
    setPaused(true)
    stopMusic()
  }
  function resume() {
    const m = matchRef.current
    if (!m || m.state !== 'paused') return
    clearInput()
    m.state = m.resumeState || 'play'
    setPaused(false)
    if (settings.music) startMusic(ARENA_MUSIC[rival.arena])
  }
  function togglePause() {
    if (matchRef.current?.state === 'paused') resume()
    else pause()
  }
  useEffect(() => {
    setPendingResult(null)
    const canvas = canvasRef.current,
      arena = arenaRef.current,
      ctx = canvas.getContext('2d', { alpha: false })
    const m = new Match({
      rival,
      seed: Math.floor(Math.random() * 2 ** 32),
      reducedMotion: settings.reducedMotion,
      onHud: setHud,
      onEnd: setPendingResult,
      training,
      playerTeam,
    })
    matchRef.current = m
    if (new URLSearchParams(location.search).has('debug')) window.__match = m
    let scale = 1,
      dpr = 1,
      viewH = VIEW_H,
      raf,
      last = performance.now(),
      acc = 0
    const start = last
    let ready = false,
      disposed = false
    setAssetStatus('loading')
    preloadSprites()
      .then(() => {
        if (disposed) return
        ready = true
        last = performance.now()
        setAssetStatus('ready')
        if (settings.music && m.state !== 'paused') startMusic(ARENA_MUSIC[rival.arena])
      })
      .catch(() => {
        if (!disposed) setAssetStatus('error')
      })
    const resize = () => {
      const w = arena.clientWidth,
        h = arena.clientHeight
      if (!w || !h) return
      dpr = Math.min(2, window.devicePixelRatio || 1)
      const portrait = window.innerHeight > window.innerWidth
      scale = portrait ? Math.min(w / 360, h / VIEW_H) : Math.min(w / 560, h / VIEW_H)
      m.setView(w / scale)
      viewH = h / scale
      m.updateCamera()
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.imageSmoothingEnabled = false
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(arena)
    const loop = (now) => {
      if (!ready) {
        last = now
        raf = requestAnimationFrame(loop)
        return
      }
      acc += Math.min(0.1, (now - last) / 1000)
      last = now
      while (acc >= 1 / 60) {
        m.update()
        acc -= 1 / 60
      }
      drawMatch(m, ctx, scale, dpr, viewH, (now - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const hidden = () => {
      if (document.hidden) pause()
    }
    const blur = () => {
      pause()
    }
    document.addEventListener('visibilitychange', hidden)
    window.addEventListener('blur', blur)
    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      m.cancelInput()
      document.removeEventListener('visibilitychange', hidden)
      window.removeEventListener('blur', blur)
      stopMusic()
      if (window.__match === m) delete window.__match
    }
    // Recreate only for a new attempt; the match settings are fixed for this run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])
  useEffect(() => {
    if (paused) pauseRef.current?.showModal()
    else {
      pauseRef.current?.close()
      if (matchRef.current?.state === 'play') actionRef.current?.focus({ preventScroll: true })
    }
  }, [paused])
  const down = (e) => {
    if (e.target.closest('button') && e.currentTarget.dataset.gameAction !== 'true') return
    if (matchRef.current?.state !== 'play' || pointer.current !== null || !e.isPrimary || e.button !== 0)
      return
    e.preventDefault()
    e.stopPropagation()
    unlockAudio()
    pointer.current = { id: e.pointerId, y: e.clientY, swiped: false }
    e.currentTarget.setPointerCapture(e.pointerId)
    matchRef.current.press()
    setPressing(true)
  }
  const move = (e) => {
    const p = pointer.current
    if (!p || p.id !== e.pointerId) return
    if (!p.swiped && p.y - e.clientY > 40) {
      p.swiped = true
      matchRef.current?.swipeUp()
      setPressing(false)
    }
  }
  const up = (e) => {
    const p = pointer.current
    if (!p || p.id !== e.pointerId) return
    e.stopPropagation()
    pointer.current = null
    matchRef.current?.release()
    setPressing(false)
  }
  const cancel = (e) => {
    if (pointer.current?.id === e.pointerId) clearInput()
  }
  const holding = hud?.holding,
    meter = hud?.shotMeter
  return (
    <div
      className="game-surface"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div ref={arenaRef} className="match-arena">
        <canvas ref={canvasRef} aria-label="Match de baseball dodgeball, contrôles ci-dessous" />
        {assetStatus !== 'ready' && (
          <div className="arena-loading" role="status">
            <strong>{assetStatus === 'error' ? 'LE STADE ATTEND' : 'ENTRÉE AU STADE…'}</strong>
            {assetStatus === 'error' && (
              <button className="button primary" onClick={() => setAttempt((a) => a + 1)}>
                Réessayer
              </button>
            )}
          </div>
        )}
        {meter && (
          <div
            className="shot-meter-accessible"
            role="progressbar"
            aria-label={`Jauge de tir ${meter.stage} sur 3`}
            aria-valuenow={Math.round(meter.value * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        )}
        {pendingResult && (
          <div className="match-end-confirm" role="status">
            <strong>{pendingResult.win ? 'VICTOIRE !' : 'FIN DU MATCH'}</strong>
            <button className="button primary" onClick={() => onEnd(pendingResult)}>
              CONTINUER
            </button>
          </div>
        )}
      </div>
      {hud && (
        <div className="match-hud">
          <div className="scoreboard">
            <TeamBar team={playerTeam} players={hud.us} side="left" />
            <div className="score-middle">
              <small className="arcade-score" aria-label="Score">
                {String(hud.score).padStart(5, '0')}
              </small>
              <span>
                {training ? 'ENTRAÎNEMENT' : label.startsWith('Coupe Néon') ? 'COUPE NÉON' : 'ARCADE'}
              </span>
              <b>
                {Math.floor(hud.seconds / 60)}:{String(hud.seconds % 60).padStart(2, '0')}
              </b>
            </div>
            <TeamBar team={rival} players={hud.them} side="right" />
          </div>
          <button className="icon-button" onClick={togglePause} aria-label="Pause">
            Ⅱ
          </button>
        </div>
      )}
      {hud && ['intro', 'play'].includes(hud.state) && (
        <div className="match-deck">
          <button
            ref={actionRef}
            disabled={hud.state !== 'play'}
            className={`action-pad ${pressing ? 'pressing' : ''}`}
            data-game-action="true"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={cancel}
            onLostPointerCapture={cancel}
            onClick={(e) => {
              if (e.detail === 0) {
                matchRef.current?.press()
                matchRef.current?.release()
              }
            }}
            aria-label={
              holding
                ? meter
                  ? 'Valider le rythme du tir'
                  : 'Préparer un tir'
                : 'Réceptionner ou maintenir pour sauter'
            }
          >
            <ActionIcon type="shot" />
          </button>
          <button
            className="pass-button"
            disabled={!holding || !!meter || hud.state !== 'play'}
            onClick={() => {
              unlockAudio()
              matchRef.current?.swipeUp()
              setPressing(false)
            }}
            aria-label="Passer la balle"
          >
            <ActionIcon type="pass" />
          </button>
          <button
            className="jump-button"
            disabled={!hud.canJumpShot || hud.state !== 'play'}
            onClick={() => {
              unlockAudio()
              matchRef.current?.jumpShot()
              setPressing(false)
            }}
            aria-label="Faire un tir en saut"
          >
            <ActionIcon type="jump" />
          </button>
        </div>
      )}
      <dialog
        ref={pauseRef}
        className="pause-dialog"
        onCancel={(e) => {
          e.preventDefault()
          resume()
        }}
      >
        <section className="pause-card">
          <span className="eyebrow">LE STADE VOUS ATTEND</span>
          <h2>PAUSE</h2>
          <p>
            {label}
            <br />
            {training ? 'Entraînement libre · vies restaurées' : ''}
          </p>
          <button className="button primary" onClick={resume}>
            REPRENDRE
          </button>
          <button
            className="button secondary"
            onClick={() => {
              clearInput()
              setPaused(false)
              setAttempt((a) => a + 1)
            }}
          >
            RECOMMENCER
          </button>
          <button className="text-button" onClick={onQuit}>
            RETOUR AU CLUB
          </button>
        </section>
      </dialog>
    </div>
  )
}

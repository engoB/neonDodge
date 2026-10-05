import { useState } from 'react'
import rivalsKeyArt from './assets/rivals-keyart-v1.webp'
import { matchConfig, MODE_COPY, PLAYER_TEAM, RIVALS } from './game/league'
import type { BaseballSnapshot, GameMode, MatchConfig } from './game/types'
import { GameView } from './ui/GameView'
import { RomWorkspace } from './ui/RomWorkspace'

type Screen = 'menu' | 'modes' | 'briefing' | 'game' | 'champion'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [chapter, setChapter] = useState(() => Number(localStorage.getItem('neon-story-chapter') || 0))
  const [activeConfig, setActiveConfig] = useState<MatchConfig>(() => matchConfig('story', chapter))

  if (new URLSearchParams(window.location.search).has('romlab')) return <RomWorkspace />

  const openMode = (mode: GameMode) => {
    const next = matchConfig(mode, mode === 'story' ? chapter : mode === 'arcade' ? Math.min(chapter + 1, 3) : 0)
    setActiveConfig(next)
    setScreen('briefing')
  }

  const startGame = () => {
    if (window.matchMedia('(pointer: coarse)').matches) void document.documentElement.requestFullscreen?.().catch(() => {})
    setScreen('game')
  }

  const leaveGame = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    setScreen('modes')
  }

  const finishMatch = (result: BaseballSnapshot) => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    if (result.mode === 'story' && result.won) {
      if (chapter >= RIVALS.length - 1) {
        localStorage.setItem('neon-story-champion', '1')
        setScreen('champion')
        return
      }
      const nextChapter = chapter + 1
      setChapter(nextChapter)
      localStorage.setItem('neon-story-chapter', String(nextChapter))
      setActiveConfig(matchConfig('story', nextChapter))
      setScreen('briefing')
      return
    }
    setScreen('modes')
  }

  if (screen === 'game') return <main><GameView config={activeConfig} onExit={leaveGame} onComplete={finishMatch} /></main>

  if (screen === 'briefing') return (
    <main className="briefing-screen">
      <div className="briefing-screen__art" style={{ backgroundImage: `url(${rivalsKeyArt})` }} />
      <button className="corner-back" onClick={() => setScreen('modes')}>‹ MODES</button>
      <section className="briefing-card">
        <span className="kicker">{activeConfig.mode === 'story' ? `CHAPITRE ${chapter + 1} · ${activeConfig.opponent.city}` : MODE_COPY[activeConfig.mode].title}</span>
        <h1>{PLAYER_TEAM.name}<small>VS</small>{activeConfig.opponent.name}</h1>
        <blockquote>« {activeConfig.opponent.motto} »</blockquote>
        <div className="briefing-grid">
          <div><span>FORMAT</span><b>{activeConfig.maxInnings} MANCHES</b></div>
          <div><span>RANG</span><b>{'◆'.repeat(activeConfig.opponent.difficulty)}{'◇'.repeat(4 - activeConfig.opponent.difficulty)}</b></div>
          <div><span>OBJECTIF</span><b>{activeConfig.mode === 'training' ? 'TROUVER LE RYTHME' : 'GAGNER LE MATCH'}</b></div>
        </div>
        {activeConfig.mode === 'story' && (
          <p className="story-copy">La Coupe Lumière a été volée par la Ligue des Quatre. Mika et les Neon Sparks traversent chaque district pour la ramener à Lumen City. Chaque capitaine maîtrise un lancer différent.</p>
        )}
        <button className="arcade-button" onClick={startGame}>ENTRER SUR LE TERRAIN</button>
      </section>
    </main>
  )

  if (screen === 'champion') return (
    <main className="champion-screen">
      <div className="champion-screen__art" style={{ backgroundImage: `url(${rivalsKeyArt})` }} />
      <section>
        <span className="kicker">HISTOIRE TERMINÉE</span>
        <h1>LA COUPE<br />REVIENT À LUMEN</h1>
        <p>Les Neon Sparks sont champions. Les quatre capitaines rivaux rejoignent le mode Arcade.</p>
        <button className="arcade-button" onClick={() => setScreen('modes')}>RETOUR AUX MODES</button>
      </section>
    </main>
  )

  if (screen === 'modes') return (
    <main className="mode-screen">
      <header className="mode-header">
        <button className="corner-back" onClick={() => setScreen('menu')}>‹ ACCUEIL</button>
        <div><span className="kicker">NEON LEAGUE</span><h1>CHOISIS TON MATCH</h1></div>
        <span className="mode-progress">HISTOIRE {chapter + 1}/{RIVALS.length}</span>
      </header>
      <section className="mode-grid">
        {(['story', 'arcade', 'training'] as GameMode[]).map((mode, index) => (
          <button key={mode} className={`mode-card mode-card--${mode}`} onClick={() => openMode(mode)}>
            <span className="mode-card__number">0{index + 1}</span>
            <span className="mode-card__tag">{mode === 'story' ? `CHAPITRE ${chapter + 1}` : mode === 'arcade' ? 'MEILLEUR SCORE' : 'LIBRE'}</span>
            <strong>{MODE_COPY[mode].title}</strong>
            <p>{MODE_COPY[mode].description}</p>
            <span className="mode-card__cta">JOUER →</span>
          </button>
        ))}
      </section>
      <section className="control-strip">
        <div><b>1.</b><span>Observe le lancer</span></div>
        <div><b>2.</b><span>Touche au contact</span></div>
        <div><b>3.</b><span>Accélère et glisse</span></div>
      </section>
    </main>
  )

  return (
    <main className="title-screen">
      <div className="title-screen__art" style={{ backgroundImage: `url(${rivalsKeyArt})` }} role="img" aria-label="Les quatre capitaines de la Neon League dans un stade de nuit" />
      <div className="title-screen__shade" />
      <section className="title-copy">
        <span className="kicker">UNE AVENTURE BASEBALL · 1 TOUCHER</span>
        <h1><span>NEON</span>SLUGGER</h1>
        <p>Quatre districts. Quatre capitaines. Une coupe à reprendre.</p>
        <button className="arcade-button" onClick={() => setScreen('modes')}>COMMENCER</button>
        <small>Appuie n’importe où pendant le match : l’action s’adapte à la situation.</small>
      </section>
      <div className="title-stats"><span>15 PROFILS D’ÉQUIPE</span><span>60 ÉTATS D’ANIMATION</span><span>PWA HORS LIGNE</span></div>
    </main>
  )
}

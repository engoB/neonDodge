import { useState } from 'react'
import { GameView } from './ui/GameView'
import { RomWorkspace } from './ui/RomWorkspace'

export default function App() {
  if (new URLSearchParams(window.location.search).has('romlab')) return <RomWorkspace />
  const [screen, setScreen] = useState<'menu' | 'game'>('menu')
  if (screen === 'game') return <main className="noise min-h-dvh"><GameView onExit={() => setScreen('menu')} /></main>

  return (
    <main className="noise relative min-h-dvh overflow-hidden px-5 py-10 sm:py-16">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full border-[32px] border-teal/10" />
      <div className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rotate-12 rounded-[5rem] border-[32px] border-coral/10" />
      <section className="relative mx-auto grid min-h-[calc(100dvh-8rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-teal">
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal" /> PWA · jouable hors ligne
          </div>
          <h1 className="pixel-shadow font-display text-6xl leading-[.88] tracking-[-.07em] text-cream sm:text-8xl">NEON<br />SLUGGER</h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-cream/70">Un baseball arcade mobile en mouvement permanent. Tu ne diriges rien : un toucher au bon moment suffit pour frapper, accélérer ou glisser.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => setScreen('game')} className="rounded-full bg-coral px-8 py-4 font-black uppercase tracking-wider text-ink shadow-[0_8px_0_#8e203d] transition hover:-translate-y-1 hover:shadow-[0_12px_0_#8e203d] active:translate-y-1 active:shadow-none">Jouer la manche</button>
            <a href="#architecture" className="rounded-full border border-cream/25 px-7 py-4 font-bold text-cream hover:border-teal hover:text-teal">Architecture</a>
          </div>
        </div>
        <div className="panel rotate-1 rounded-[2rem] p-6 sm:p-8">
          <div className="baseball-hero mx-auto" role="img" aria-label="Balle de baseball stylisée" />
          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-wider">
            <div className="rounded-xl bg-teal/10 p-3 text-teal">1 toucher</div>
            <div className="rounded-xl bg-gold/10 p-3 text-gold">60 Hz</div>
            <div className="rounded-xl bg-coral/10 p-3 text-coral">3 retraits</div>
          </div>
        </div>
      </section>
      <section id="architecture" className="mx-auto grid max-w-6xl gap-4 pb-10 sm:grid-cols-3">
        {[
          ['Action contextuelle', 'Le même toucher devient frappe, accélération ou glissade selon la phase.'],
          ['Auto-run à 60 Hz', 'Le jeu avance sans direction manuelle ; le rythme et le timing font tout.'],
          ['React + PWA', 'Canvas léger, interface tactile et installation hors ligne via Vite.'],
        ].map(([title, body]) => <article key={title} className="panel rounded-2xl p-5"><h2 className="font-black text-cream">{title}</h2><p className="mt-2 text-sm leading-relaxed text-cream/60">{body}</p></article>)}
      </section>
    </main>
  )
}

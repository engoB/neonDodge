import { useEffect, useMemo, useRef, useState } from 'react'
import { animationStates, renderRuntimePose, verifyRom } from '../rom/superDodgeProfile'

type Facing = 'a' | 'b'

export function RomWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cacheRef = useRef(new Map<string, ImageData>())
  const [rom, setRom] = useState<ArrayBuffer | null>(null)
  const [status, setStatus] = useState('Sélectionne ta ROM patchée FR. Elle reste sur cet appareil.')
  const [team, setTeam] = useState(0)
  const [player, setPlayer] = useState(0)
  const [stateIndex, setStateIndex] = useState(0)
  const [facing, setFacing] = useState<Facing>('a')
  const [error, setError] = useState('')

  const states = useMemo(() => rom ? animationStates(rom, team) : [], [rom, team])
  const state = states[stateIndex]

  const importRom = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setStatus('Vérification locale de la ROM…')
    try {
      const buffer = await file.arrayBuffer()
      const verified = await verifyRom(buffer)
      cacheRef.current.clear()
      setRom(buffer)
      setStatus(`${verified.header.title} · ${verified.header.gameCode} · empreinte vérifiée`)
    } catch (reason) {
      setRom(null)
      setError(reason instanceof Error ? reason.message : 'Impossible de lire cette ROM.')
      setStatus('Import interrompu.')
    }
  }

  useEffect(() => {
    if (!rom || !state || !canvasRef.current) return
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return
    context.imageSmoothingEnabled = false
    let animationFrame = 0
    let previousPose = -1
    const started = performance.now()
    const draw = (now: number) => {
      const tick = Math.floor((now - started) * 60 / 1000) % state.totalDuration
      let cursor = 0
      let pose = state.frames[0].pose
      for (const frame of state.frames) {
        cursor += frame.duration
        if (tick < cursor) { pose = frame.pose; break }
      }
      if (pose !== previousPose) {
        const key = `${team}:${player}:${stateIndex}:${pose}:${facing}`
        let image = cacheRef.current.get(key)
        if (!image) {
          const rendered = renderRuntimePose(rom, team, player, stateIndex, pose, facing)
          image = new ImageData(rendered.pixels, rendered.width, rendered.height)
          cacheRef.current.set(key, image)
        }
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.putImageData(image, 0, 0)
        previousPose = pose
      }
      animationFrame = requestAnimationFrame(draw)
    }
    animationFrame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animationFrame)
  }, [rom, state, team, player, stateIndex, facing])

  return (
    <main className="noise min-h-dvh px-4 py-8 text-cream sm:px-8">
      <section className="mx-auto max-w-6xl">
        <p className="text-xs font-black uppercase tracking-[.2em] text-teal">Atelier ROM → moteur web</p>
        <h1 className="mt-2 font-display text-4xl sm:text-6xl">Reconstruction fidèle</h1>
        <p className="mt-4 max-w-3xl text-cream/65">Cet écran ne lance ni n’émule la ROM. Il vérifie le fichier puis recompose localement les poses depuis les tuiles, palettes, séquences et objets OAM d’origine.</p>

        {!rom && (
          <label className="panel mt-8 block cursor-pointer rounded-3xl p-8 text-center hover:border-teal/60">
            <span className="block text-lg font-black">Choisir le fichier .gba</span>
            <span className="mt-2 block text-sm text-cream/55">Aucune donnée n’est envoyée sur Internet.</span>
            <input className="sr-only" type="file" accept=".gba,application/octet-stream" onChange={(event) => void importRom(event.target.files?.[0])} />
          </label>
        )}

        <p className={`mt-4 text-sm ${error ? 'text-coral' : 'text-teal'}`}>{error || status}</p>

        {rom && state && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[23rem_1fr]">
            <aside className="panel rounded-3xl p-5">
              <div className="grid grid-cols-2 gap-3">
                <Select label="Équipe" value={team} count={15} onChange={(value) => { setTeam(value); setStateIndex(0); cacheRef.current.clear() }} />
                <Select label="Joueur" value={player} count={8} onChange={(value) => { setPlayer(value); cacheRef.current.clear() }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Select label="État" value={stateIndex} count={60} onChange={setStateIndex} />
                <label className="text-xs font-black uppercase tracking-wider text-cream/55">Orientation
                  <select className="mt-2 w-full rounded-xl border border-cream/15 bg-ink px-3 py-2 text-cream" value={facing} onChange={(event) => setFacing(event.target.value as Facing)}>
                    <option value="a">A</option><option value="b">B</option>
                  </select>
                </label>
              </div>
              <div className="mt-5 grid place-items-center rounded-2xl bg-[#202630] p-4 checkerboard">
                <canvas ref={canvasRef} width={64} height={64} className="h-64 w-64 max-w-full [image-rendering:pixelated]" aria-label={`État ${stateIndex} extrait de la ROM`} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <Metric value={state.frames.length} label="étapes" />
                <Metric value={state.poses.length} label="poses" />
                <Metric value={`${state.totalDuration} f`} label="durée" />
              </dl>
            </aside>

            <section className="panel rounded-3xl p-5">
              <h2 className="font-black">Les 60 états de la ROM</h2>
              <p className="mt-1 text-sm text-cream/55">Sélectionne un état pour lire sa séquence avec ses durées originales à 60 Hz.</p>
              <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
                {states.map((item) => (
                  <button key={item.stateIndex} onClick={() => setStateIndex(item.stateIndex)} className={`rounded-xl border px-2 py-3 text-sm font-black ${item.stateIndex === stateIndex ? 'border-teal bg-teal text-ink' : 'border-cream/10 bg-ink/55 hover:border-cream/40'}`}>
                    {String(item.stateIndex).padStart(2, '0')}<span className="mt-1 block text-[10px] opacity-60">{item.totalDuration} f</span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}

function Select({ label, value, count, onChange }: { label: string; value: number; count: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-black uppercase tracking-wider text-cream/55">{label}
    <select className="mt-2 w-full rounded-xl border border-cream/15 bg-ink px-3 py-2 text-cream" value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {Array.from({ length: count }, (_, index) => <option key={index} value={index}>{String(index).padStart(2, '0')}</option>)}
    </select>
  </label>
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-xl bg-ink/60 p-2"><dt className="font-black text-teal">{value}</dt><dd className="text-cream/45">{label}</dd></div>
}

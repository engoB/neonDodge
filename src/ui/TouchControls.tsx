import type { MutableRefObject, PointerEvent } from 'react'
import type { Controls } from '../game/types'

interface Props { controls: MutableRefObject<Controls> }

export function TouchControls({ controls }: Props) {
  const bind = (key: keyof Controls) => ({
    onPointerDown: (event: PointerEvent) => { event.preventDefault(); controls.current[key] = true; event.currentTarget.setPointerCapture(event.pointerId) },
    onPointerUp: (event: PointerEvent) => { event.preventDefault(); controls.current[key] = false },
    onPointerCancel: () => { controls.current[key] = false },
  })
  const keyClass = 'control-button grid h-14 w-14 place-items-center rounded-2xl border border-cream/20 bg-ink/75 text-xl font-black text-cream shadow-lg active:scale-95 active:bg-teal active:text-ink'
  return (
    <div className="mt-4 flex items-end justify-between gap-5 md:hidden" aria-label="Contrôles tactiles">
      <div className="grid grid-cols-3 gap-1">
        <span /><button className={keyClass} {...bind('up')} aria-label="Haut">▲</button><span />
        <button className={keyClass} {...bind('left')} aria-label="Gauche">◀</button>
        <button className={keyClass} {...bind('down')} aria-label="Bas">▼</button>
        <button className={keyClass} {...bind('right')} aria-label="Droite">▶</button>
      </div>
      <div className="flex items-end gap-2">
        <button className={`${keyClass} h-12 w-12 text-xs`} {...bind('catch')}>CATCH</button>
        <button className={`${keyClass} h-16 w-16 bg-coral text-ink`} {...bind('throw')}>TIR</button>
      </div>
    </div>
  )
}

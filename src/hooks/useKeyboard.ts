import { useEffect, useRef } from 'react'
import type { Controls } from '../game/types'

export const blankControls = (): Controls => ({ up: false, down: false, left: false, right: false, throw: false, catch: false, pass: false, pause: false })

const keys: Record<string, keyof Controls> = {
  ArrowUp: 'up', KeyW: 'up', KeyZ: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyJ: 'throw', Space: 'throw', KeyK: 'catch', ShiftLeft: 'catch', KeyL: 'pass', KeyP: 'pass', Escape: 'pause',
}

export function useKeyboard() {
  const state = useRef(blankControls())
  useEffect(() => {
    const change = (down: boolean) => (event: KeyboardEvent) => {
      const action = keys[event.code]
      if (!action) return
      event.preventDefault()
      state.current[action] = down
    }
    const down = change(true), up = change(false)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])
  return state
}

// Keep the previous key so existing Neon Dodge players retain their progression.
const KEY = 'neon-dodge-v1'
const DEFAULT = {
  beaten: 0,
  best: {},
  trophies: 0,
  settings: {
    sound: true,
    music: true,
    reducedMotion:
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  },
}
const integer = (value, max = Number.MAX_SAFE_INTEGER) =>
  Number.isFinite(value) ? Math.min(max, Math.max(0, Math.floor(value))) : 0
export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!d || typeof d !== 'object') return structuredClone(DEFAULT)
    const settings = { ...DEFAULT.settings }
    for (const key of Object.keys(settings))
      if (typeof d.settings?.[key] === 'boolean') settings[key] = d.settings[key]
    const best = {}
    if (d.best && typeof d.best === 'object')
      for (let i = 0; i < 6; i++) if (Number.isFinite(d.best[i])) best[i] = integer(d.best[i])
    return { beaten: integer(d.beaten, 6), best, trophies: integer(d.trophies), settings }
  } catch {
    return structuredClone(DEFAULT)
  }
}
export function save(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* Gameplay continues if storage is unavailable. */
  }
}
export function recordMatch(progress, index, total, r) {
  if (!r.win) return progress
  const best = { ...progress.best, [index]: Math.max(progress.best[index] || 0, r.score) }
  const beaten = Math.max(progress.beaten, index + 1)
  const trophies = progress.trophies + (index === total - 1 && progress.beaten < total ? 1 : 0)
  return { ...progress, best, beaten, trophies }
}

// Progression sauvegardée sur l'appareil (localStorage, tolérant aux erreurs).
const KEY = 'neon-dodge-v1'
const DEFAULT = { beaten: 0, best: {}, trophies: 0, settings: { sound: true, music: true, haptics: true } }

export function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null')
    return d ? { ...DEFAULT, ...d, settings: { ...DEFAULT.settings, ...(d.settings || {}) } } : structuredClone(DEFAULT)
  } catch {
    return structuredClone(DEFAULT)
  }
}

export function save(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    /* stockage indisponible : la partie continue sans sauvegarde */
  }
}

export function recordMatch(progress, index, total, r) {
  if (!r.win) return progress
  const best = { ...progress.best, [index]: Math.max(progress.best[index] || 0, r.score) }
  const beaten = Math.max(progress.beaten, index + 1)
  const trophies = progress.trophies + (index === total - 1 && progress.beaten < total ? 1 : 0)
  return { ...progress, best, beaten, trophies }
}

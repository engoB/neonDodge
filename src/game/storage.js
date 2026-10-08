// Progression sauvegardée sur l'appareil (localStorage, tolérant aux erreurs).
const KEY = 'dodge-rush-v1'
const DEFAULT = { unlocked: 1, levels: {}, endlessBest: 0, settings: { sound: true, music: true, haptics: true } }

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

export function recordLevel(progress, index, id, r) {
  const prev = progress.levels[id] || { best: 0, golds: [false, false, false], captain: false, done: false }
  const next = {
    best: Math.max(prev.best, r.win ? r.score : 0),
    golds: prev.golds.map((g, i) => g || (r.win && r.golds[i])),
    captain: prev.captain || (r.win && r.captain),
    done: prev.done || r.win,
  }
  return {
    ...progress,
    levels: { ...progress.levels, [id]: next },
    unlocked: r.win ? Math.max(progress.unlocked, index + 2) : progress.unlocked,
  }
}

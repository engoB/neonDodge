import type { BatterProfile, GameMode, MatchConfig, TeamProfile } from './types'

export const ROSTER: BatterProfile[] = [
  { name: 'MIKA FLUX', number: 7, role: 'Voltigeuse', skill: 'speed' },
  { name: 'AXEL KNOX', number: 44, role: 'Frappeur puissant', skill: 'power' },
  { name: 'JUN VEGA', number: 11, role: 'Contact', skill: 'contact' },
  { name: 'BOOMER REYES', number: 23, role: 'Capitaine', skill: 'clutch' },
]

export const PLAYER_TEAM: TeamProfile = {
  id: 'neon', name: 'NEON SPARKS', city: 'LUMEN CITY', shortName: 'NEO',
  primary: '#18d6d0', accent: '#ffe27a', difficulty: 1,
  motto: 'Une seule chance. Le bon timing.',
}

export const RIVALS: TeamProfile[] = [
  { id: 'hounds', name: 'IRON HOUNDS', city: 'FORGE BAY', shortName: 'IRN', primary: '#ef5b68', accent: '#ffd0a0', difficulty: 1, motto: 'Ils cognent avant de réfléchir.' },
  { id: 'comets', name: 'GOLD COMETS', city: 'SOLAR HEIGHTS', shortName: 'GLD', primary: '#f0b83f', accent: '#fff0af', difficulty: 2, motto: 'Leur lanceur lit chaque mouvement.' },
  { id: 'vipers', name: 'VIOLET VIPERS', city: 'NIGHT DOCKS', shortName: 'VPR', primary: '#a365e8', accent: '#edceff', difficulty: 3, motto: 'Personne ne voit venir leur balle courbe.' },
  { id: 'kings', name: 'CROWN KINGS', city: 'GRAND CENTRAL', shortName: 'CRN', primary: '#e95c88', accent: '#ffe78d', difficulty: 4, motto: 'Les champions défendent leur couronne.' },
]

export const MODE_COPY: Record<GameMode, { title: string; description: string; innings: number }> = {
  story: { title: 'HISTOIRE', description: 'Gravis les quatre districts et gagne la Coupe Lumière.', innings: 3 },
  arcade: { title: 'ARCADE', description: 'Cinq manches, difficulté croissante, meilleur score local.', innings: 5 },
  training: { title: 'ENTRAÎNEMENT', description: 'Une manche sans score adverse pour apprendre le rythme.', innings: 1 },
}

export function matchConfig(mode: GameMode, chapter = 0): MatchConfig {
  return {
    mode,
    opponent: mode === 'training' ? RIVALS[0] : RIVALS[Math.min(chapter, RIVALS.length - 1)],
    maxInnings: MODE_COPY[mode].innings,
  }
}

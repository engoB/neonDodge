// Équipes, joueurs et tirs spéciaux : tout est original (noms, couleurs, styles).
// Les caractéristiques suivent les plages mesurées (2 à 11, PV 17 à 23).

export const SPECIALS = {
  comete: { name: 'Comète', desc: 'file en ligne droite à toute vitesse' },
  fusee: { name: 'Fusée', desc: 'part lentement puis accélère' },
  serpentin: { name: 'Serpentin', desc: 'ondule en profondeur' },
  meteore: { name: 'Météore', desc: 'monte très haut puis plonge' },
  vague: { name: 'Vague', desc: 'rebondit en vagues' },
  eclair: { name: 'Éclair', desc: 'zigzague, rapide' },
}

const P = (name, kitOverride, stats, special) => ({ name, kitOverride, stats, special })
// stats : [force, puissance, vitesse, saut, réception, défense, PV]
const s = (force, power, speed, jump, catching, defense, hp) => ({
  force,
  power,
  speed,
  jump,
  catching,
  defense,
  hp,
})

export const PLAYER_TEAM = {
  id: 'neons',
  name: 'Neon Foxes',
  arena: 'gym',
  accent: '#5de7cd',
  kit: {
    jersey: '#1d927f',
    trim: '#f5f0d9',
    shorts: '#e8e8d3',
    hair: '#162b36',
    band: '#1d927f',
    skin: '#b57c55',
    style: 0,
  },
  players: [
    P('Riko', null, s(9, 8, 8, 7, 9, 7, 23), 'comete'),
    P('Malo', { hair: '#1f2937', style: 1, skin: '#c68b62' }, s(8, 7, 6, 6, 7, 9, 22), 'meteore'),
    P('Inès', { hair: '#b91c1c', style: 3, skin: '#f1c9a0' }, s(6, 9, 9, 8, 7, 5, 19), 'serpentin'),
    P('Tao', { hair: '#fde68a', style: 2, skin: '#e9b98c' }, s(7, 6, 7, 9, 8, 6, 20), 'fusee'),
    P('Lou', { hair: '#78350f', style: 0 }, s(6, 7, 7, 6, 6, 6, 20), 'vague'),
    P('Sam', { hair: '#0f172a', style: 1, skin: '#8d5a3b' }, s(7, 6, 6, 6, 6, 7, 20), 'eclair'),
    P('Nour', { hair: '#4c1d95', style: 3 }, s(6, 7, 8, 7, 7, 5, 19), 'comete'),
  ],
}

function team(id, name, arena, accent, kit, roster, specials, level) {
  // roster : noms ; stats générées selon le niveau de l'équipe (déterministe)
  let seed = id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0
  const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296
  const st = (bonus) => {
    const v = () => Math.max(2, Math.min(11, Math.round(3 + level * 0.9 + bonus + rnd() * 3)))
    return s(v(), v(), v(), v(), v(), v(), 17 + Math.round(rnd() * 3 + level * 0.5))
  }
  return {
    id,
    name,
    arena,
    accent,
    kit,
    level,
    players: roster.map((n, i) => P(n, null, st(i === 0 ? 1.5 : 0), specials[i % specials.length])),
  }
}

export const RIVALS = [
  team(
    'chaussettes',
    'Red Bats',
    'gym',
    '#ff596d',
    {
      jersey: '#c64350',
      trim: '#f8e7cb',
      shorts: '#e8e8d3',
      hair: '#3b2416',
      band: '#c64350',
      beard: true,
      skin: '#e9b98c',
      style: 1,
    },
    ['Gaspard', 'Lino', 'Basile', 'Odin', 'Noé', 'Paco', 'Elio'],
    ['fusee', 'comete'],
    0,
  ),
  team(
    'corbeaux',
    'Gold Owls',
    'roof',
    '#f9d57c',
    {
      jersey: '#d5a842',
      trim: '#fff0cf',
      shorts: '#e8e8d3',
      hair: '#673d24',
      band: '#d5a842',
      glasses: true,
      skin: '#c68b62',
      style: 2,
    },
    ['Iris', 'Corvin', 'Nox', 'Ash', 'Kaï', 'Rémi', 'Ozan'],
    ['eclair', 'serpentin'],
    1.5,
  ),
  team(
    'mouettes',
    'Harbor Sharks',
    'beach',
    '#22d3ee',
    {
      jersey: '#06b6d4',
      trim: '#ecfeff',
      shorts: '#facc15',
      hair: '#fde68a',
      band: '#f97316',
      skin: '#f1c9a0',
      style: 3,
    },
    ['Marin', 'Océane', 'Loïc', 'Perle', 'Yann', 'Coral', 'Tim'],
    ['vague', 'meteore'],
    3,
  ),
  team(
    'cactus',
    'Wild Coyotes',
    'roof',
    '#84cc16',
    {
      jersey: '#65a30d',
      trim: '#ecfccb',
      shorts: '#3f6212',
      hair: '#422006',
      band: '#fde047',
      skin: '#d6a274',
      style: 0,
    },
    ['Pico', 'Saguaro', 'Agave', 'Yuca', 'Dune', 'Opu', 'Ray'],
    ['serpentin', 'fusee'],
    4.5,
  ),
  team(
    'requins',
    'Iron Bulls',
    'beach',
    '#0ea5e9',
    {
      jersey: '#0f172a',
      trim: '#38bdf8',
      shorts: '#334155',
      hair: '#e5e7eb',
      band: '#38bdf8',
      skin: '#a87452',
      style: 2,
    },
    ['Bruce', 'Mako', 'Tiburon', 'Fin', 'Rex', 'Gil', 'Orca'],
    ['comete', 'meteore', 'eclair'],
    6,
  ),
  team(
    'eclairs',
    'Violet Phantoms',
    'neon',
    '#e879f9',
    {
      jersey: '#a855f7',
      trim: '#22d3ee',
      shorts: '#1e1b4b',
      hair: '#e5e7eb',
      band: '#7744bb',
      skin: '#ddae86',
      helmet: true,
      style: 0,
    },
    ['Vega', 'Zap', 'Lumen', 'Ion', 'Neo', 'Flux', 'Arc'],
    ['eclair', 'comete', 'fusee', 'vague'],
    7.5,
  ),
]

export function rosterKit(teamDef, i) {
  const p = teamDef.players[i]
  return {
    ...teamDef.kit,
    number: i + 1,
    style: i % 4,
    ...(p.kitOverride || {}),
    helmet: teamDef.kit.helmet || i === 5,
  }
}

const STADIUMS = { gym: 'Fox Yard', roof: 'Skyline Park', beach: 'Harbor Field', neon: 'Neon Dome' }
const DESCRIPTIONS = [
  'Le club historique. Des lancers droits, du cœur et du caractère.',
  'Du sang-froid, des lunettes et des balles qui changent de direction.',
  'Le vent du port dans le dos. Des rebonds difficiles à lire.',
  'Une équipe rapide qui adore vous faire sortir du rythme.',
  'Des lanceurs puissants. Chaque réception devient décisive.',
  'Les maîtres du dernier stade. Le duel pour la Neon Cup.',
]
RIVALS.forEach((r, i) => {
  r.stadium = STADIUMS[r.arena]
  r.description = DESCRIPTIONS[i]
})
export const CAPTAINS = [PLAYER_TEAM, RIVALS[0], RIVALS[1], RIVALS[5]]

RIVALS[1].players[0].kitOverride = { style: 3, glasses: true }
RIVALS[5].players[0].kitOverride = { style: 3, helmet: true }

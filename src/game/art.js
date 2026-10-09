const TEAM_ORDER = ['neons', 'chaussettes', 'corbeaux', 'mouettes', 'cactus', 'requins', 'eclairs']
const EMBLEMS = [
  new URL('../../assets/team-emblems-v2/emblem-0.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-1.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-2.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-3.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-4.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-5.webp', import.meta.url).href,
  new URL('../../assets/team-emblems-v2/emblem-6.webp', import.meta.url).href,
]
const STAGES = [
  new URL('../../assets/story-stages-v3/stage-0.webp', import.meta.url).href,
  new URL('../../assets/story-stages-v3/stage-1.webp', import.meta.url).href,
  new URL('../../assets/story-stages-v3/stage-2.webp', import.meta.url).href,
  new URL('../../assets/story-stages-v3/stage-3.webp', import.meta.url).href,
  new URL('../../assets/story-stages-v3/stage-4.webp', import.meta.url).href,
  new URL('../../assets/story-stages-v3/stage-5.webp', import.meta.url).href,
]

export function teamEmblem(team) {
  const index = Math.max(0, TEAM_ORDER.indexOf(team.id))
  return EMBLEMS[index]
}

export function storyStage(index) {
  return STAGES[index]
}

export const SUPER_IMPACT = new URL('../../assets/super-impact-v2.webp', import.meta.url).href

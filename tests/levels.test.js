import { test } from 'node:test'
import assert from 'node:assert/strict'
import { LEVELS, buildLevel } from '../src/game/levels.js'
import { playLevel } from './bot.js'

test('chaque niveau se génère sans valeur invalide', () => {
  for (const def of LEVELS) {
    const L = buildLevel(def)
    assert.ok(Number.isFinite(L.goalX), def.id)
    for (const g of L.grounds) assert.ok(g.x1 > g.x0 && Number.isFinite(g.y), def.id)
    const gaps = L.grounds.slice(1).map((g, i) => g.x0 - L.grounds[i].x1)
    assert.ok(Math.max(0, ...gaps) <= 160, `${def.id} : trou trop large ${Math.max(...gaps)}`)
    assert.equal(L.items.filter((i) => i.kind === 'gold').length, 3, `${def.id} : 3 balles d'or`)
  }
})

for (const def of LEVELS) {
  test(`le bot termine le niveau ${def.id}`, () => {
    const { result } = playLevel({ def })
    assert.ok(result, `${def.id} : pas de fin`)
    assert.ok(result.win, `${def.id} : perdu (${JSON.stringify(result)})`)
  })
}

test('course sans fin : génère et tient 60 s', () => {
  const { g } = playLevel({ endless: true }, { maxFrames: 3600 })
  assert.ok(g.p.x > 3000)
})

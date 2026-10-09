import { test, expect } from '@playwright/test'

const action = (page) => page.locator('[data-game-action="true"]')
const pause = (page) => page.getByRole('button', { name: 'Pause', exact: true })

async function start(page) {
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await page.getByRole('button', { name: /ARCADE/ }).click()
  await page.getByRole('button', { name: /MATCH !/ }).click()
  await expect(action(page)).toBeEnabled()
  await expect(page.locator('.game-surface')).toBeVisible()
}
async function screenshot(page, info, name) {
  const path = info.outputPath(`${name}.png`)
  await page.screenshot({ path })
  await info.attach(name, { path, contentType: 'image/png' })
}
async function geometry(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const r = document.querySelector(selector).getBoundingClientRect()
      return { top: r.top, right: r.right, bottom: r.bottom, left: r.left, width: r.width, height: r.height }
    }
    return {
      width: innerWidth,
      height: innerHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      arena: rect('.match-arena'),
      hud: rect('.match-hud'),
      controls: rect('.match-deck'),
    }
  })
}
async function expectMatchFits(page) {
  const g = await geometry(page)
  expect(g.overflow).toBe(false)
  expect(g.arena.height).toBeGreaterThan(100)
  expect(g.arena.top).toBeGreaterThanOrEqual(g.hud.bottom - 1)
  expect(g.arena.bottom).toBeLessThanOrEqual(g.controls.top + 1)
  expect(g.controls.bottom).toBeLessThanOrEqual(g.height + 1)
  expect(g.controls.right).toBeLessThanOrEqual(g.width + 1)
  for (const button of [
    action(page),
    page.getByRole('button', { name: 'Passer la balle' }),
    page.getByRole('button', { name: 'Faire un tir en saut' }),
    pause(page),
  ]) {
    const r = await button.boundingBox()
    expect(r.x).toBeGreaterThanOrEqual(0)
    expect(r.y).toBeGreaterThanOrEqual(0)
    expect(r.x + r.width).toBeLessThanOrEqual(g.width + 1)
    expect(r.y + r.height).toBeLessThanOrEqual(g.height + 1)
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'neon-dodge-v1',
      JSON.stringify({
        beaten: 0,
        best: {},
        trophies: 0,
        settings: { sound: false, music: false, reducedMotion: true },
      }),
    )
  })
  await page.goto('/')
})

test('accueil : écran titre épuré puis menu console', async ({ page }, info) => {
  await expect(page.getByRole('button', { name: /^JOUER/ })).toBeVisible()
  await expect(page.getByText('TOUCH TO START')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /NEON.*SLUGGER/ })).toBeVisible()
  const visual = await page.locator('.hero-art').evaluate(async (el) => {
    const source = getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]
    const img = new Image()
    img.src = source
    await img.decode()
    return { width: img.naturalWidth, height: img.naturalHeight }
  })
  expect(visual).toEqual({ width: 941, height: 1672 })
  const box = await page.locator('#hero-title').boundingBox()
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
  await screenshot(page, info, 'accueil')
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await expect(page.locator('.console-menu-list button')).toHaveCount(4)
  await expect(page.getByText('CHOISISSEZ UN MODE')).toHaveCount(0)
  await expect(page.locator('.console-menu-list i')).toHaveCount(0)
})

test('arcade : sélection aux flèches et lancement plein écran', async ({ page }, info) => {
  await page.goto('/?debug')
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await page.getByRole('button', { name: /ARCADE/ }).click()
  await expect(page.getByText('RED BATS', { exact: true })).toBeVisible()
  await expect(page.getByText('PARC DES RENARDS', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /ADVERSAIRE, valeur suivante/ }).click()
  await expect(page.getByText('GOLD OWLS', { exact: true })).toBeVisible()
  await expect(page.getByText('PARC DES RENARDS', { exact: true })).toBeVisible()
  const stadium = page.locator('.stadium-card canvas')
  await expect(stadium).toBeVisible()
  const digest = () =>
    stadium.evaluate((canvas) => {
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      let hash = 2166136261
      for (let i = 0; i < data.length; i += 4096) hash = Math.imul(hash ^ data[i], 16777619)
      return hash >>> 0
    })
  const firstTerrain = await digest()
  const previousBox = await page.getByRole('button', { name: 'Terrain précédent' }).boundingBox()
  const nextBox = await page.getByRole('button', { name: 'Terrain suivant' }).boundingBox()
  expect(previousBox.x).toBeLessThan(nextBox.x)
  await page.getByRole('button', { name: 'Terrain suivant' }).click()
  await expect(page.getByText('PARC DU COUCHANT', { exact: true })).toBeVisible()
  await expect.poll(digest).not.toBe(firstTerrain)
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <= innerWidth &&
        document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
  await screenshot(page, info, 'arcade-select')
  await page.getByRole('button', { name: /MATCH !/ }).click()
  await expect(action(page)).toBeEnabled()
  await page.evaluate(() => {
    const match = window.__match
    const target = match.players[7]
    target.hp = 1
    match.players[0].throwOpts = { target }
    match.release_ball(match.players[0])
    match.hitPlayer(target, match.ball)
    match.emitHud()
  })
  await expect(page.locator('.score-team.right')).toContainText('KO')
})

test('réglages : dialogue sans défilement, retour et sauvegarde', async ({ page }) => {
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await page.getByRole('button', { name: /OPTIONS/ }).click()
  const dialog = page.locator('.settings-dialog')
  await expect(dialog).toBeVisible()
  const sound = page.getByRole('group', { name: 'EFFETS SONORES' })
  await expect(sound).toContainText('COUPÉ')
  await sound.getByRole('button', { name: /suivant/ }).click()
  await expect(sound).toContainText('ACTIF')
  await expect(page.getByText('VIBRATIONS')).toHaveCount(0)
  expect(
    await dialog.evaluate(
      (el) => el.scrollHeight <= el.clientHeight && el.getBoundingClientRect().bottom <= innerHeight,
    ),
  ).toBe(true)
  await page.getByRole('button', { name: /Retour au menu/ }).click()
  await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neon-dodge-v1')).settings.sound)).toBe(
    true,
  )
})

test('coupe : premier match accessible, suivants verrouillés et commandes visibles', async ({
  page,
}, info) => {
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await page.getByRole('button', { name: /HISTOIRE/ }).click()
  await expect(page.getByRole('heading', { name: /CHAPITRE 01/ })).toBeVisible()
  await expect(page.locator('.chapter-stage img')).toBeVisible()
  const firstStage = await page.locator('.chapter-stage img').getAttribute('src')
  await page.getByRole('button', { name: 'Chapitre suivant' }).click()
  await expect(page.getByRole('heading', { name: /CHAPITRE 02/ })).toBeVisible()
  await expect(page.locator('.chapter-stage img')).not.toHaveAttribute('src', firstStage)
  await page.getByRole('button', { name: 'Chapitre précédent' }).click()
  await screenshot(page, info, 'histoire-stage')
  await page.getByRole('button', { name: /MATCH !/ }).click()
  await expect(page.locator('.story-dialog')).toBeVisible()
  await expect(page.locator('.story-versus .dialogue-portrait')).toHaveCount(2)
  await expect(page.locator('.story-dialog').getByRole('button', { name: 'RETOUR' })).toBeVisible()
  await expect(page.locator('.speech-box.riko')).toBeVisible()
  const portraitGeometry = await page.locator('.story-versus > div').evaluateAll((items) =>
    items.map((item) => {
      const rect = item.getBoundingClientRect()
      return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]
    }),
  )
  await screenshot(page, info, 'histoire-gauche')
  await page.getByRole('button', { name: /SUIVANT/ }).click()
  await expect(page.locator('.speech-box.rival')).toBeVisible()
  expect(
    await page.locator('.story-versus > div').evaluateAll((items) =>
      items.map((item) => {
        const rect = item.getBoundingClientRect()
        return [Math.round(rect.x), Math.round(rect.y), Math.round(rect.width), Math.round(rect.height)]
      }),
    ),
  ).toEqual(portraitGeometry)
  await screenshot(page, info, 'histoire-droite')
  await page.getByRole('button', { name: /SUIVANT/ }).click()
  await page
    .locator('.story-dialog')
    .getByRole('button', { name: /MATCH !/ })
    .click()
  await expect(action(page)).toBeEnabled()
  await expectMatchFits(page)
  await screenshot(page, info, 'match')
})

test('tactile : pause, reprise et jauge avec validation séparée', async ({ page }) => {
  await start(page)
  await pause(page).click()
  await expect(page.locator('.pause-dialog')).toBeVisible()
  await page.getByRole('button', { name: /REPRENDRE/ }).click()
  await expect(page.locator('.pause-dialog')).not.toBeVisible()
  await action(page).click()
  await expect(page.getByRole('progressbar', { name: /Jauge de tir 1 sur 3/ })).toBeAttached()
  await expect(page.locator('.arena-status')).toHaveCount(0)
  await pause(page).click()
  await page.getByRole('button', { name: /REPRENDRE/ }).click()
  await expect(page.locator('.shot-meter')).toHaveCount(0)
  await expect(action(page)).toBeEnabled()
})

test('pointeur : annulation sans lancer, passe et reprise', async ({ page }) => {
  await start(page)
  const button = action(page)
  const box = await button.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await expect(button).toHaveClass(/pressing/)
  await button.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true, button: 0 })
  await page.mouse.up()
  await expect(button).not.toHaveClass(/pressing/)
  await expect(action(page)).toBeEnabled()
  await page.getByRole('button', { name: 'Passer la balle' }).click()
  await expect(page.locator('.arena-status')).toHaveCount(0)
  await expectMatchFits(page)
})

test('commandes directes : le tir sauté déclenche un super au sommet', async ({ page }, info) => {
  await page.goto('/?debug')
  await start(page)
  const jump = page.getByRole('button', { name: 'Faire un tir en saut' })
  await expect(jump).toBeEnabled()
  await jump.click()
  await expect(jump).toBeDisabled({ timeout: 2500 })
  await expect.poll(() => page.evaluate(() => window.__match.ball.sup)).toBe(true)
  await screenshot(page, info, 'super-saute')
})

test('fin : le terrain reste visible avant la fiche de résultat', async ({ page }, info) => {
  await page.goto('/?debug')
  await start(page)
  await page.evaluate(() => {
    window.__match.state = 'end'
    window.__match.winner = 0
    window.__match.finish()
  })
  await expect(page.locator('.match-arena')).toBeVisible()
  await expect(page.locator('.result-dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'CONTINUER' })).toBeVisible()
  await page.getByRole('button', { name: 'CONTINUER' }).click()
  await expect(page.locator('.result-dialog')).toBeVisible()
  await expect(page.locator('.result-versus img')).toHaveCount(2)
  expect(
    await page.locator('.result-card').evaluate((card) => {
      const bounds = card.getBoundingClientRect()
      const elements = card.querySelectorAll('.result-versus img, h1, .result-stats, .result-actions')
      return (
        card.scrollWidth <= card.clientWidth &&
        [...elements].every((element) => {
          const rect = element.getBoundingClientRect()
          return rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1
        })
      )
    }),
  ).toBe(true)
  await screenshot(page, info, 'resultat')
})

test('paysage : le jeu demande explicitement le retour au portrait', async ({ page }, info) => {
  const original = page.viewportSize()
  await page.setViewportSize({ width: original.height, height: original.width })
  await expect(page.getByRole('complementary', { name: 'Orientation portrait requise' })).toBeVisible()
  await expect(page.getByText('TOURNEZ L’ÉCRAN')).toBeVisible()
  await screenshot(page, info, 'portrait-required')
  await page.setViewportSize(original)
  await expect(page.getByRole('button', { name: /^JOUER/ })).toBeVisible()
})

test('entraînement : équipe sélectionnée, vies restaurées et retour menu', async ({ page }, info) => {
  await page.getByRole('button', { name: /^JOUER/ }).click()
  await page.getByRole('button', { name: /ENTRAÎNEMENT/ }).click()
  await page.getByRole('button', { name: /ÉQUIPE, valeur suivante/ }).click()
  await expect(page.getByText('RED BATS', { exact: true })).toHaveCount(2)
  await page.getByRole('button', { name: /ENTRAÎNEMENT !/ }).click()
  await expect(action(page)).toBeEnabled()
  await expect(page.locator('.score-team.left img')).toHaveAttribute('alt', 'Red Bats')
  await expectMatchFits(page)
  await screenshot(page, info, 'training')
})

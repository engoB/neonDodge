import { test, expect } from '@playwright/test'

const action = (page) => page.locator('[data-game-action="true"]')
const pause = (page) => page.getByRole('button', { name: 'Pause', exact: true })

async function start(page) {
  await page.getByRole('button', { name: /MATCH EXPRESS/ }).click()
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
  for (const button of [action(page), page.getByRole('button', { name: 'Passer la balle' }), pause(page)]) {
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
        settings: { sound: false, music: false, haptics: false, reducedMotion: true },
      }),
    )
  })
  await page.goto('/')
})

test('accueil : quatre capitaines, illustration chargée et titre lisible', async ({ page }, info) => {
  await expect(page.locator('.captain-badge')).toHaveCount(4)
  await expect(page.getByRole('heading', { name: /NEON.*SLUGGER/ })).toBeVisible()
  const visual = await page.locator('.hero-art').evaluate(async (el) => {
    const source = getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1]
    const img = new Image()
    img.src = source
    await img.decode()
    return { width: img.naturalWidth, height: img.naturalHeight }
  })
  expect(visual).toEqual({ width: 1536, height: 1024 })
  const box = await page.locator('#hero-title').boundingBox()
  expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await screenshot(page, info, 'accueil')
})

test('club et règles : sélection, animations et navigation', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Le club', exact: true }).click()
  await expect(page.locator('.roster-list button')).toHaveCount(7)
  await page.getByRole('button', { name: /Tao Intérieur/ }).click()
  await expect(page.locator('.player-showcase h2')).toHaveText('Tao')
  await page.getByRole('button', { name: 'Course', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Course', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await screenshot(page, info, 'club')
  await page.getByRole('button', { name: 'Les règles', exact: true }).click()
  await expect(page.locator('.rule-card')).toHaveCount(6)
  await page.getByRole('button', { name: /À VOUS DE JOUER/ }).click()
  await expect(action(page)).toBeEnabled()
})

test('réglages : dialogue modal, fermeture clavier et sauvegarde', async ({ page }) => {
  await page.getByRole('button', { name: 'Réglages', exact: true }).click()
  const dialog = page.locator('.settings-dialog')
  await expect(dialog).toBeVisible()
  const sound = page.getByRole('switch', { name: /Effets sonores/ })
  await expect(sound).toHaveAttribute('aria-checked', 'false')
  await sound.click()
  await expect(sound).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neon-dodge-v1')).settings.sound)).toBe(
    true,
  )
})

test('coupe : premier match accessible, suivants verrouillés et commandes visibles', async ({
  page,
}, info) => {
  await page.getByRole('button', { name: /ENTRER DANS LA LIGUE/ }).click()
  await expect(page.locator('.fixture')).toHaveCount(6)
  await expect(page.locator('.fixture:disabled')).toHaveCount(5)
  await page.getByRole('button', { name: /MATCH 01/ }).click()
  await expect(action(page)).toBeEnabled()
  await expectMatchFits(page)
  await screenshot(page, info, 'match')
})

test('clavier : pause, reprise avec focus sur l’action et lancer', async ({ page }) => {
  await start(page)
  await pause(page).click()
  await expect(page.locator('.pause-dialog')).toBeVisible()
  await page.getByRole('button', { name: /REPRENDRE LE MATCH/ }).click()
  await expect(page.locator('.pause-dialog')).not.toBeVisible()
  await expect(action(page)).toBeFocused()
  await page.keyboard.down('Space')
  await expect(action(page)).toHaveClass(/pressing/)
  await expect(page.getByRole('progressbar', { name: 'Charge du tir' })).not.toHaveAttribute(
    'aria-valuenow',
    '0',
  )
  await page.keyboard.up('Space')
  await expect(action(page)).not.toHaveClass(/pressing/)
  await expect(page.locator('.context-copy .eyebrow')).toContainText('DÉFENSE')
  await page.keyboard.press('Escape')
  await expect(page.locator('.pause-dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.pause-dialog')).not.toBeVisible()
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
  await expect(page.locator('.context-copy .eyebrow')).toContainText('ATTAQUE')
  await page.getByRole('button', { name: 'Passer la balle' }).click()
  await expect(page.locator('.context-copy .eyebrow')).toContainText('ATTAQUE')
  await expect(page.locator('.context-copy .eyebrow')).not.toContainText('Riko')
  await expectMatchFits(page)
})

test('rotation : un match en cours conserve les commandes et son état', async ({ page }, info) => {
  await start(page)
  const original = page.viewportSize()
  await page.setViewportSize({ width: original.height, height: original.width })
  await expectMatchFits(page)
  await expect(page.locator('.context-copy .eyebrow')).toContainText('ATTAQUE')
  await screenshot(page, info, 'rotation')
  await pause(page).click()
  await page.getByRole('button', { name: /Retour au club/ }).click()
  await expect(page.getByRole('heading', { name: /NEON.*SLUGGER/ })).toBeVisible()
})

import { test, expect } from '@playwright/test'

const action = (page) => page.locator('[data-game-action="true"]')
const pause = (page) => page.getByRole('button', { name: 'Pause', exact: true })

async function start(page) {
  await page.getByRole('button', { name: /START GAME/ }).click()
  await page.getByRole('button', { name: /ARCADE/ }).click()
  await page.getByRole('button', { name: /PLAY BALL/ }).click()
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
        settings: { sound: false, music: false, haptics: false, reducedMotion: true },
      }),
    )
  })
  await page.goto('/')
})

test('accueil : écran titre épuré puis menu console', async ({ page }, info) => {
  await expect(page.getByRole('button', { name: /START GAME/ })).toBeVisible()
  await expect(page.getByText('TOUCH TO START')).toHaveCount(0)
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
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
  await screenshot(page, info, 'accueil')
  await page.getByRole('button', { name: /START GAME/ }).click()
  await expect(page.locator('.console-menu-list button')).toHaveCount(4)
  await expect(page.getByRole('heading', { name: 'SELECT MODE' })).toBeVisible()
})

test('arcade : sélection aux flèches et lancement plein écran', async ({ page }, info) => {
  await page.getByRole('button', { name: /START GAME/ }).click()
  await page.getByRole('button', { name: /ARCADE/ }).click()
  await expect(page.getByText('RED BATS', { exact: true })).toBeVisible()
  await expect(page.getByText('FOX YARD', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /ADVERSAIRE, valeur suivante/ }).click()
  await expect(page.getByText('GOLD OWLS', { exact: true })).toBeVisible()
  await expect(page.getByText('FOX YARD', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Terrain suivant' }).click()
  await expect(page.getByText('SKYLINE PARK', { exact: true })).toBeVisible()
  await expect(page.locator('.stadium-card canvas')).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true)
  await screenshot(page, info, 'arcade-select')
  await page.getByRole('button', { name: /PLAY BALL/ }).click()
  await expect(action(page)).toBeEnabled()
})

test('réglages : dialogue modal, fermeture clavier et sauvegarde', async ({ page }) => {
  await page.getByRole('button', { name: /START GAME/ }).click()
  await page.getByRole('button', { name: /OPTIONS/ }).click()
  const dialog = page.locator('.settings-dialog')
  await expect(dialog).toBeVisible()
  const sound = page.getByRole('group', { name: 'EFFETS SONORES' })
  await expect(sound).toContainText('OFF')
  await sound.getByRole('button', { name: /suivant/ }).click()
  await expect(sound).toContainText('ON')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('neon-dodge-v1')).settings.sound)).toBe(
    true,
  )
})

test('coupe : premier match accessible, suivants verrouillés et commandes visibles', async ({
  page,
}, info) => {
  await page.getByRole('button', { name: /START GAME/ }).click()
  await page.getByRole('button', { name: /HISTOIRE/ }).click()
  await expect(page.getByRole('heading', { name: /CHAPITRE 01/ })).toBeVisible()
  await page.getByRole('button', { name: /START CHAPTER/ }).click()
  await expect(page.locator('.story-dialog')).toBeVisible()
  await expect(page.locator('.story-versus .dialogue-portrait')).toHaveCount(2)
  await expect(page.locator('.speech-box.riko')).toBeVisible()
  await screenshot(page, info, 'histoire-gauche')
  await page.getByRole('button', { name: /NEXT/ }).click()
  await expect(page.locator('.speech-box.rival')).toBeVisible()
  await screenshot(page, info, 'histoire-droite')
  await page.getByRole('button', { name: /NEXT/ }).click()
  await page.getByRole('button', { name: /PLAY BALL/ }).click()
  await expect(action(page)).toBeEnabled()
  await expectMatchFits(page)
  await screenshot(page, info, 'match')
})

test('tactile : pause, reprise et jauge avec validation séparée', async ({ page }) => {
  await start(page)
  await pause(page).click()
  await expect(page.locator('.pause-dialog')).toBeVisible()
  await page.getByRole('button', { name: /REPRENDRE LE MATCH/ }).click()
  await expect(page.locator('.pause-dialog')).not.toBeVisible()
  await action(page).click()
  await expect(page.getByRole('progressbar', { name: /Jauge de tir 1 sur 3/ })).toBeVisible()
  await expect(page.locator('.arena-status')).toContainText('ATTAQUE')
  await pause(page).click()
  await page.getByRole('button', { name: /REPRENDRE LE MATCH/ }).click()
  await expect(page.locator('.shot-meter')).toHaveCount(0)
  await expect(page.locator('.arena-status')).toContainText('ATTAQUE')
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
  await expect(page.locator('.arena-status')).toContainText('ATTAQUE')
  await page.getByRole('button', { name: 'Passer la balle' }).click()
  await expect(page.locator('.arena-status')).toContainText('ATTAQUE')
  await expect(page.locator('.arena-status')).not.toContainText('Riko')
  await expectMatchFits(page)
})

test('commandes directes : le Jump Shot se déclenche en une touche', async ({ page }) => {
  await start(page)
  const jump = page.getByRole('button', { name: 'Faire un tir en saut' })
  await expect(jump).toBeEnabled()
  await jump.click()
  await expect(page.locator('.arena-status')).toContainText('DÉFENSE', { timeout: 2500 })
})

test('paysage : le jeu demande explicitement le retour au portrait', async ({ page }, info) => {
  const original = page.viewportSize()
  await page.setViewportSize({ width: original.height, height: original.width })
  await expect(page.getByRole('complementary', { name: 'Orientation portrait requise' })).toBeVisible()
  await expect(page.getByText('TOURNEZ L’ÉCRAN')).toBeVisible()
  await screenshot(page, info, 'portrait-required')
  await page.setViewportSize(original)
  await expect(page.getByRole('button', { name: /START GAME/ })).toBeVisible()
})

test('training : équipe sélectionnée, vies restaurées et retour menu', async ({ page }, info) => {
  await page.getByRole('button', { name: /START GAME/ }).click()
  await page.getByRole('button', { name: /TRAINING/ }).click()
  await page.getByRole('button', { name: /ÉQUIPE, valeur suivante/ }).click()
  await expect(page.getByText('RED BATS', { exact: true })).toHaveCount(2)
  await page.getByRole('button', { name: /START TRAINING/ }).click()
  await expect(action(page)).toBeEnabled()
  await expect(page.locator('.score-team.left')).toContainText('Red Bats')
  await expectMatchFits(page)
  await screenshot(page, info, 'training')
})

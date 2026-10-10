// Décors bitmap lumineux : un seul dessin mis en cache par image, sans foule
// procédurale animée. Le rendu est plus lisible et coûte beaucoup moins cher.
import { getSpriteAsset } from './sprites.js'

export const BALLPARKS = {
  gym: { sky: ['#36a9e8', '#dff7ff'], accent: '#5de7cd', label: 'PARC DES RENARDS' },
  roof: { sky: ['#7c45a4', '#ffb04f'], accent: '#ff7b7f', label: 'PARC DU COUCHANT' },
  beach: { sky: ['#3bb8ed', '#dffaff'], accent: '#f9d57c', label: 'STADE DU PORT' },
  desert: { sky: ['#39a9e3', '#ffd487'], accent: '#f7d154', label: 'CANYON COYOTE' },
  foundry: { sky: ['#46a8dc', '#ffe0a1'], accent: '#ff7b35', label: 'FORGE DE FER' },
  neon: { sky: ['#24206a', '#8a4bd2'], accent: '#6ff7ff', label: 'DÔME NÉON' },
}

function drawCover(ctx, image, w, top, height, camX) {
  const scale = Math.max(w / image.width, height / image.height)
  const sw = w / scale
  const sh = height / scale
  const parallax = (camX - 240) * 0.025
  const sx = Math.max(0, Math.min(image.width - sw, (image.width - sw) / 2 + parallax))
  const sy = Math.max(0, Math.min(image.height - sh, image.height * 0.48 - sh / 2))
  ctx.drawImage(image, sx, sy, sw, sh, 0, top, w, height)
}

function stadium(arena, ctx, camX, w, top, bottom) {
  const park = BALLPARKS[arena]
  const height = Math.max(1, bottom - top)
  const image = getSpriteAsset(`stadium-${arena}`)
  ctx.save()
  ctx.imageSmoothingEnabled = false
  if (image) drawCover(ctx, image, w, top, height, camX)
  else {
    const gradient = ctx.createLinearGradient(0, top, 0, bottom)
    gradient.addColorStop(0, park.sky[0])
    gradient.addColorStop(1, park.sky[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, top, w, height)
  }

  // Bande de séparation légère : le décor reste présent sans voler la scène.
  const bandY = bottom - 18
  ctx.fillStyle = 'rgba(8, 25, 45, 0.78)'
  ctx.fillRect(0, bandY, w, 18)
  ctx.fillStyle = park.accent
  ctx.fillRect(0, bandY, w, 2)
  ctx.font = '900 7px "Press Start 2P", monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff8dc'
  ctx.fillText(park.label, w / 2, bottom - 6)
  ctx.restore()
}

export const SCENES = Object.fromEntries(
  Object.keys(BALLPARKS).map((key) => [key, { bg: (...args) => stadium(key, ...args) }]),
)

// Les écrans de menu sont verticaux alors que les stades sont carrés. Les
// étirer sur toute la hauteur grossissait leurs pixels et donnait un fond
// flou. Cette composition conserve l'image à sa définition utile, puis étend
// le décor avec des aplats pixelisés légers.
export function drawBackdrop(arena, ctx, width, height) {
  const park = BALLPARKS[arena]
  const image = getSpriteAsset(`stadium-${arena}`)
  ctx.save()
  ctx.imageSmoothingEnabled = false
  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, park.sky[0])
  sky.addColorStop(0.56, park.sky[1])
  sky.addColorStop(1, '#071725')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  if (image) {
    const sceneTop = Math.round(height * 0.055)
    const sceneHeight = Math.min(Math.round(width * 1.02), Math.round(height * 0.62))
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, sceneTop, width, sceneHeight)
    const fade = ctx.createLinearGradient(0, sceneTop + sceneHeight * 0.68, 0, sceneTop + sceneHeight)
    fade.addColorStop(0, 'rgba(7,23,37,0)')
    fade.addColorStop(1, 'rgba(7,23,37,0.82)')
    ctx.fillStyle = fade
    ctx.fillRect(0, sceneTop, width, sceneHeight)
  }

  const pixel = Math.max(4, Math.round(width / 120))
  ctx.globalAlpha = 0.24
  ctx.fillStyle = park.accent
  for (let y = Math.round(height * 0.67); y < height; y += pixel * 5) {
    for (let x = (y / pixel) % 2 ? 0 : pixel * 3; x < width; x += pixel * 8)
      ctx.fillRect(x, y, pixel * 3, pixel)
  }
  ctx.restore()
}

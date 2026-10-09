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

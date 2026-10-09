// Rich stadium bitmap with restrained palette overlays for each ballpark.
import { getSpriteAsset } from './sprites.js'
const hash = (i, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return v - Math.floor(v)
}
export const BALLPARKS = {
  gym: {
    sky: ['#0b2540', '#326876'],
    crowd: '#152c3e',
    accent: '#5de7cd',
    label: 'FOX YARD',
    city: '#132c43',
  },
  roof: {
    sky: ['#171f45', '#924c62'],
    crowd: '#272138',
    accent: '#ff7b7f',
    label: 'SKYLINE PARK',
    city: '#272840',
  },
  beach: {
    sky: ['#09293e', '#267b81'],
    crowd: '#123844',
    accent: '#f9d57c',
    label: 'HARBOR FIELD',
    city: '#164452',
  },
  desert: {
    sky: ['#35172c', '#c05f3f'],
    crowd: '#3a2027',
    accent: '#f7d154',
    label: 'COYOTE CANYON',
    city: '#502a2b',
  },
  foundry: {
    sky: ['#101820', '#6f3d32'],
    crowd: '#24292f',
    accent: '#ff6b35',
    label: 'IRON FOUNDRY',
    city: '#303841',
  },
  neon: {
    sky: ['#100e32', '#462765'],
    crowd: '#211333',
    accent: '#c2a0ff',
    label: 'NEON DOME',
    city: '#211840',
  },
}
// Architectural silhouettes make each park identifiable beyond its palette.
function landmarks(arena, ctx, w, top, bottom) {
  if (arena === 'gym') return
  const h = bottom - top
  const base = top + h * 0.62
  ctx.save()
  const sky = ctx.createLinearGradient(0, top, 0, base)
  sky.addColorStop(0, BALLPARKS[arena].sky[0])
  sky.addColorStop(1, BALLPARKS[arena].sky[1])
  ctx.fillStyle = sky
  ctx.fillRect(0, top, w, base - top)
  ctx.fillStyle = '#fff0b3'
  ctx.fillRect(w * 0.72, top + h * 0.1, 18, 18)
  if (arena === 'roof') {
    for (let i = 0; i < 14; i++) {
      const x = (i * w) / 13
      const bh = 28 + hash(i, 9) * h * 0.4
      ctx.fillStyle = '#19263f'
      ctx.fillRect(x, base - bh, w / 16, bh)
      ctx.fillStyle = '#f9d57c88'
      for (let y = base - bh + 8; y < base - 8; y += 9)
        for (let k = 0; k < 3; k++) ctx.fillRect(x + 5 + k * 8, y, 3, 4)
    }
  } else if (arena === 'beach') {
    ctx.fillStyle = '#267b81'
    ctx.fillRect(0, base - 24, w, 24)
    ctx.fillStyle = '#8cd8cf'
    for (let i = 0; i < 25; i++) ctx.fillRect((i * w) / 24, base - 19 + (i % 3) * 5, w / 35, 2)
    for (const x of [w * 0.16, w * 0.79]) {
      ctx.fillStyle = '#173c43'
      ctx.fillRect(x, top + 30, 6, base - top - 30)
      ctx.beginPath()
      ctx.moveTo(x + 3, top + 28)
      ctx.lineTo(x - 38, top + 49)
      ctx.lineTo(x + 3, top + 40)
      ctx.lineTo(x + 38, top + 46)
      ctx.closePath()
      ctx.fill()
    }
  } else if (arena === 'desert') {
    ctx.fillStyle = '#63362e'
    for (let i = 0; i < 6; i++) {
      const x = (i * w) / 5
      const bh = h * (0.2 + hash(i, 4) * 0.25)
      ctx.fillRect(x, base - bh, w / 8, bh)
      ctx.fillRect(x - 8, base - bh + 18, w / 6, bh - 18)
    }
    ctx.fillStyle = '#263f32'
    for (const x of [w * 0.2, w * 0.85]) {
      ctx.fillRect(x, base - 46, 7, 46)
      ctx.fillRect(x - 14, base - 32, 21, 6)
      ctx.fillRect(x - 14, base - 45, 6, 18)
      ctx.fillRect(x, base - 21, 21, 6)
      ctx.fillRect(x + 15, base - 35, 6, 20)
    }
  } else if (arena === 'foundry') {
    for (let i = 0; i < 6; i++) {
      const x = (i * w) / 5
      ctx.fillStyle = '#2b2f36'
      ctx.fillRect(x, base - 26, w / 8, 26)
      ctx.fillRect(x + 12, base - 75, 14, 50)
      ctx.fillStyle = '#e7804388'
      ctx.fillRect(x + 12, base - 77, 14, 5)
      ctx.fillStyle = '#76808644'
      ctx.fillRect(x + 6, base - 94, 28, 12)
      ctx.fillRect(x + 20, base - 112, 35, 12)
    }
  } else if (arena === 'neon') {
    ctx.strokeStyle = '#b987fb'
    ctx.lineWidth = 4
    for (let i = 1; i < 8; i++) {
      ctx.beginPath()
      ctx.moveTo(w / 2, top)
      ctx.lineTo((i * w) / 8, base)
      ctx.stroke()
    }
    ctx.strokeStyle = '#67e8f9'
    ctx.strokeRect(w * 0.08, top + 20, w * 0.84, h * 0.42)
    ctx.fillStyle = '#e879f9'
    ctx.fillRect(w * 0.15, base - 8, w * 0.7, 3)
  }
  ctx.restore()
}

function stadium(arena, ctx, camX, w, top, bottom, t) {
  const panorama = getSpriteAsset('stadium')
  if (panorama) {
    ctx.save()
    ctx.imageSmoothingEnabled = false
    const h = bottom - top
    // Cover, with subtle camera parallax; never stretch the panorama's proportions.
    const scale = Math.max(w / panorama.width, h / panorama.height)
    const sw = w / scale,
      sh = h / scale
    const sx = Math.max(0, Math.min(panorama.width - sw, (panorama.width - sw) / 2 + (camX - 240) * 0.35))
    ctx.drawImage(panorama, sx, panorama.height - sh, sw, sh, 0, top, w, h)
    const tint = {
      gym: '#0c405508',
      roof: '#dc733312',
      beach: '#1bdacb16',
      desert: '#e76a3520',
      foundry: '#6620102c',
      neon: '#7438a826',
    }[arena]
    ctx.fillStyle = tint
    ctx.fillRect(0, top, w, h)
    landmarks(arena, ctx, w, top, bottom)
    const park = BALLPARKS[arena]
    ctx.fillStyle = '#06131dde'
    ctx.fillRect(w / 2 - 52, bottom - 25, 104, 21)
    ctx.strokeStyle = park.accent
    ctx.strokeRect(w / 2 - 52, bottom - 25, 104, 21)
    ctx.font = '900 8px monospace'
    ctx.textAlign = 'center'
    ctx.fillStyle = park.accent
    ctx.fillText(park.label, w / 2, bottom - 12)
    ctx.restore()
    return
  }
  const p = BALLPARKS[arena],
    g = ctx.createLinearGradient(0, top, 0, bottom)
  g.addColorStop(0, p.sky[0])
  g.addColorStop(1, p.sky[1])
  ctx.fillStyle = g
  ctx.fillRect(0, top, w, bottom - top)
  ctx.fillStyle = '#fff0c7'
  for (let i = 0; i < w / 16; i++)
    if (hash(i, 6) > 0.8) ctx.fillRect(i * 16, top + 12 + hash(i, 3) * 45, 1, 1)
  const horizon = bottom - 66
  for (let i = -2; i < w / 34 + 3; i++) {
    const x = i * 34 - ((camX * 0.07) % 34),
      h = 18 + hash(i, 2) * 58
    ctx.fillStyle = p.city
    ctx.fillRect(x, horizon - h, 31, h)
    ctx.fillStyle = '#d7bb8460'
    for (let y = horizon - h + 7; y < horizon - 4; y += 9)
      for (let k = 0; k < 3; k++) if (hash(i, k + y) > 0.5) ctx.fillRect(x + 4 + k * 8, y, 3, 4)
  }
  ctx.fillStyle = p.crowd
  ctx.fillRect(0, horizon, w, bottom - horizon)
  // Floodlights are spaced relative to screen width so even portrait gets two towers.
  for (const x of [w * 0.1, w * 0.86]) {
    ctx.fillStyle = '#132f40'
    ctx.fillRect(x - 2, top + 35, 4, bottom - top - 35)
    ctx.fillStyle = '#fff5ce'
    ctx.shadowColor = '#fff4ba'
    ctx.shadowBlur = 12
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 4; c++) ctx.fillRect(x - 13 + c * 7, top + 23 + r * 7, 5, 5)
    ctx.shadowBlur = 0
    ctx.fillStyle = '#fff5b909'
    ctx.beginPath()
    ctx.moveTo(x - 12, top + 40)
    ctx.lineTo(x - 65, bottom)
    ctx.lineTo(x + 80, bottom)
    ctx.lineTo(x + 14, top + 40)
    ctx.fill()
  }
  for (let r = 0; r < 4; r++) {
    const y = horizon + 8 + r * 11
    ctx.fillStyle = '#58758955'
    ctx.fillRect(0, y + 8, w, 2)
    for (let i = 0; i < w / 10 + 1; i++) {
      const x = i * 10 - (r % 2) * 5,
        bob = Math.max(0, Math.sin(t * 4 + i * 0.7 + r)) > 0.8 ? 1 : 0
      ctx.fillStyle = ['#ff6f79', '#80cbb7', '#c49ee8', '#d9bc70', '#719fb5'][Math.floor(hash(i, r) * 5)]
      ctx.fillRect(x, y + 3 - bob, 5, 5)
      ctx.fillStyle = ['#bc845e', '#edbe8d', '#835f48'][Math.floor(hash(i, r + 9) * 3)]
      ctx.fillRect(x + 1, y - bob, 3, 3)
    }
  }
  // Ballpark display and pennants.
  const sx = w / 2
  ctx.fillStyle = '#07151fe8'
  ctx.fillRect(sx - 47, horizon - 26, 94, 24)
  ctx.strokeStyle = p.accent
  ctx.lineWidth = 1
  ctx.strokeRect(sx - 47, horizon - 26, 94, 24)
  ctx.font = '900 8px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = p.accent
  ctx.fillText(p.label, sx, horizon - 12)
  for (let i = 0; i < w / 55; i++) {
    const x = i * 55 + 18
    ctx.fillStyle = i % 2 ? p.accent : '#f5f0d9'
    ctx.beginPath()
    ctx.moveTo(x, bottom - 5)
    ctx.lineTo(x + 17, bottom - 5)
    ctx.lineTo(x + 17, bottom + 8)
    ctx.lineTo(x + 8, bottom + 3)
    ctx.lineTo(x, bottom + 8)
    ctx.fill()
  }
  ctx.fillStyle = '#061923'
  ctx.fillRect(0, bottom - 3, w, 8)
  ctx.fillStyle = p.accent
  ctx.fillRect(0, bottom - 3, w, 1)
}
export const SCENES = Object.fromEntries(
  Object.keys(BALLPARKS).map((key) => [key, { bg: (...args) => stadium(key, ...args) }]),
)

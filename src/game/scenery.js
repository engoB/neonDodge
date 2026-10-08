// Four original ballparks; deterministic pixels keep the crowd stable between frames.
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
  neon: {
    sky: ['#100e32', '#462765'],
    crowd: '#211333',
    accent: '#c2a0ff',
    label: 'NEON DOME',
    city: '#211840',
  },
}
function stadium(arena, ctx, camX, w, top, bottom, t) {
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

// Bitmap cels: the same atlas drives portraits and live gameplay.
export const ANIMATION_POSES = [
  'idle',
  'walk',
  'run',
  'hold',
  'windup',
  'throw',
  'catch',
  'jump',
  'fall',
  'hurt',
  'ko',
  'taunt',
  'cheer',
]
export const FRAME_SEQUENCES = {
  idle: [0, 1],
  walk: [2, 3, 4, 5],
  run: [2, 3, 4, 5],
  hold: [6],
  windup: [7],
  throw: [8, 9],
  catch: [10, 11],
  jump: [12],
  fall: [12],
  hurt: [13],
  ko: [14],
  taunt: [15],
  cheer: [15],
}
export const ASSET_URLS = {
  riko: new URL('../../assets/sprites/riko.png', import.meta.url),
  gaspard: new URL('../../assets/sprites/gaspard.png', import.meta.url),
  iris: new URL('../../assets/sprites/iris.png', import.meta.url),
  vega: new URL('../../assets/sprites/vega.png', import.meta.url),
  scout: new URL('../../assets/sprites/scout.png', import.meta.url),
  rookie: new URL('../../assets/sprites/rookie.png', import.meta.url),
  dash: new URL('../../assets/sprites/dash.png', import.meta.url),
  ember: new URL('../../assets/sprites/ember.png', import.meta.url),
  echo: new URL('../../assets/sprites/echo.png', import.meta.url),
  nova: new URL('../../assets/sprites/nova.png', import.meta.url),
  baseball: new URL('../../assets/sprites/baseball.png', import.meta.url),
  'stadium-gym': new URL('../../assets/stadiums-v2/gym.webp', import.meta.url),
  'stadium-roof': new URL('../../assets/stadiums-v2/roof.webp', import.meta.url),
  'stadium-beach': new URL('../../assets/stadiums-v2/beach.webp', import.meta.url),
  'stadium-desert': new URL('../../assets/stadiums-v2/desert.webp', import.meta.url),
  'stadium-foundry': new URL('../../assets/stadiums-v2/foundry.webp', import.meta.url),
  'stadium-neon': new URL('../../assets/stadiums-v2/neon.webp', import.meta.url),
}
export const ATHLETE_IDS = [
  'riko',
  'gaspard',
  'iris',
  'vega',
  'scout',
  'rookie',
  'dash',
  'ember',
  'echo',
  'nova',
]
const images = new Map()
const variants = new Map()
let createSurface
let loading
const browserLoader = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Impossible de charger ' + url.pathname))
    image.src = url.href
  })
export function preloadSprites(loader = browserLoader, canvasFactory) {
  createSurface =
    canvasFactory ||
    ((w, h) => {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      return canvas
    })
  if (!loading) {
    loading = Promise.all(
      Object.entries(ASSET_URLS).map(async ([id, url]) => {
        images.set(id, await loader(url))
      }),
    ).catch((error) => {
      loading = null
      throw error
    })
  }
  return loading
}
export const getSpriteAsset = (id) => images.get(id)

// Classic arcade palette swaps at runtime. Only the jersey/cap color ramp is
// remapped; skin, leather, cream pants and the dark outlines retain their colors.
function teamAtlas(kit) {
  const source = images.get(kit.spriteId || 'riko')
  if (!source || kit.nativePalette) return source
  const key = kit.spriteId + ':' + kit.jersey
  if (variants.has(key)) {
    const atlas = variants.get(key)
    variants.delete(key)
    variants.set(key, atlas)
    return atlas
  }
  const canvas = createSurface(source.width, source.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(source, 0, 0)
  const pixels = ctx.getImageData(0, 0, source.width, source.height)
  const ramp = { gaspard: [345, 14], iris: [36, 65], vega: [250, 310] }[kit.spriteId] || [155, 205]
  const target = kit.jersey
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
  const targetHsl = rgbToHsl(...target)
  for (let i = 0; i < pixels.data.length; i += 4) {
    if (!pixels.data[i + 3]) continue
    const [h, s, l] = rgbToHsl(pixels.data[i] / 255, pixels.data[i + 1] / 255, pixels.data[i + 2] / 255)
    const within = ramp[0] > ramp[1] ? h >= ramp[0] || h <= ramp[1] : h >= ramp[0] && h <= ramp[1]
    if (!within || s < 0.35 || l < 0.12 || l > 0.85) continue
    const rgb = hslToRgb(targetHsl[0], Math.min(0.95, s * 0.75 + targetHsl[1] * 0.25), l)
    for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.round(rgb[c] * 255)
  }
  ctx.putImageData(pixels, 0, 0)
  variants.set(key, canvas)
  // Enough for both current clubs; avoid keeping every tournament palette in memory.
  if (variants.size > 16) variants.delete(variants.keys().next().value)
  return canvas
}
function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2
  if (!d) return [0, 0, l]
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l]
}
function hslToRgb(h, s, l) {
  const a = s * Math.min(l, 1 - l)
  return [0, 8, 4].map((n) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  })
}

export function animationFrame(pose, t = 0, progress) {
  const frames = FRAME_SEQUENCES[pose] || FRAME_SEQUENCES.idle
  if (progress !== undefined && ['throw', 'catch'].includes(pose))
    return frames[Math.min(frames.length - 1, Math.floor(Math.max(0, progress) * frames.length))]
  const fps = pose === 'idle' ? 3 : pose === 'walk' ? 7 : 12
  return frames[Math.floor(Math.max(0, t) * fps) % frames.length]
}
export function drawAthlete(ctx, o) {
  const {
    x,
    y,
    facing = 1,
    pose = 'idle',
    t = 0,
    progress,
    kit,
    rot = 0,
    alpha = 1,
    ball = null,
    size = 1,
    flash = false,
    glow = null,
  } = o
  const image = teamAtlas(kit)
  if (!image) return
  const frame = animationFrame(pose, t, progress)
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.globalAlpha *= alpha * (flash ? 0.35 : 1)
  ctx.translate(Math.round(x), Math.round(y))
  ctx.scale(facing * size, size)
  if (rot && pose !== 'ko') {
    ctx.translate(0, -24)
    ctx.rotate(rot)
    ctx.translate(0, 24)
  }
  if (glow) {
    ctx.shadowColor = glow
    ctx.shadowBlur = 9
  }
  // 160×128 cells preserve complete reaching arms; body 96px, feet at y=112.
  const bob = ['cheer', 'taunt'].includes(pose) ? -Math.abs(Math.sin(t * 7)) * 2 : 0
  ctx.drawImage(image, (frame % 4) * 160, Math.floor(frame / 4) * 128, 160, 128, -40, -56 + bob, 80, 64)
  ctx.shadowBlur = 0
  if (ball && ![6, 7, 11].includes(frame)) {
    const hand =
      frame === 4
        ? [22, -30]
        : frame === 5
          ? [15, -32]
          : [2, 3].includes(frame)
            ? [-18, -29]
            : frame === 12
              ? [-11, -39]
              : [9, -23]
    drawBall(ctx, { x: hand[0], y: hand[1], r: 4.5, kind: ball, spin: t * 4 })
  }
  ctx.restore()
}
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
export function drawBall(ctx, b) {
  const image = images.get('baseball')
  if (!image) return
  const r = b.r ?? 5
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.translate(Math.round(b.x), Math.round(b.y))
  const powered = ['super', 'fire'].includes(b.kind)
  // La balle normale garde un contour sombre. Les supers reçoivent leurs
  // flammes pixelisées dans le renderer, sans halo circulaire lisse.
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#102337'
  ctx.lineWidth = powered ? 0 : Math.max(1.5, r * 0.28)
  ctx.beginPath()
  ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2)
  ctx.fill()
  if (!powered) ctx.stroke()
  ctx.rotate(b.spin ?? 0)
  ctx.drawImage(image, -r - 1, -r - 1, (r + 1) * 2, (r + 1) * 2)
  ctx.restore()
}

// Original baseball sprites, drawn on a pixel grid. 13 poses, eight animation cels.
const OUT = '#07131f'
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
const POSES = {
  run: (ph) => [Math.sin(ph) * 1.05, -Math.sin(ph) * 1.05, -Math.sin(ph), Math.sin(ph)],
  walk: (ph) => [Math.sin(ph) * 0.45, -Math.sin(ph) * 0.45, -Math.sin(ph) * 0.4, Math.sin(ph) * 0.4],
  hold: (ph) => [Math.sin(ph) * 0.5, -Math.sin(ph) * 0.5, 1.1, 0.8],
  idle: (ph) => [0.14, -0.14, 0.24 + Math.sin(ph / 3) * 0.06, -0.35],
  windup: (ph) => [0.55, -0.3, -2.3 + Math.sin(ph / 4) * 0.12, 0.9],
  throw: (ph) => [0.65, -0.6, 1.65 + Math.sin(ph) * 0.3, -0.8],
  catch: (ph) => [0.35 + Math.sin(ph) * 0.1, -0.4, 1.35 + Math.sin(ph) * 0.12, 1.3],
  jump: (ph) => [1.0 + Math.sin(ph) * 0.12, -0.6, 2.5, -0.6],
  fall: (ph) => [0.6, -0.2, 1.8 + Math.sin(ph) * 0.1, 1.1],
  hurt: (ph) => [-0.6, 0.4, 2.5 + Math.sin(ph) * 0.12, 2.2],
  ko: (ph) => [Math.sin(ph) * 0.9, -Math.sin(ph) * 0.9, 2.5, 2.3],
  cheer: (ph) => [0.2, -0.2, 2.8 + Math.sin(ph) * 0.15, 2.8 - Math.sin(ph) * 0.15],
  taunt: (ph) => [0.12, -0.12, 2.5 + Math.sin(ph) * 0.3, -0.3],
}
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}
function limb(ctx, x, y, angle, len, width, color) {
  const ex = Math.round(x + Math.sin(angle) * len),
    ey = Math.round(y + Math.cos(angle) * len)
  ctx.strokeStyle = OUT
  ctx.lineWidth = width + 2
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.stroke()
  return [ex, ey]
}
function glove(ctx, x, y, open = false) {
  // Compact palm, four finger channels and separate thumb.
  rect(ctx, x - 4, y - 5, 8, 9, OUT)
  rect(ctx, x - 3, y - 4, 6, 7, '#9b5b30')
  rect(ctx, x - 2, y - 3, 4, 4, '#c68a4a')
  rect(ctx, x - 5, y - 1, 2, 5, '#b8783c')
  for (let i = 0; i < 3; i++) rect(ctx, x - 2 + i * 2, y - 4, 1, 3, '#633922')
  rect(ctx, x - 2, y + 2, 4, 1, '#f2be76')
  if (open) rect(ctx, x - 1, y - 1, 2, 3, '#5b3525')
}
export function drawAthlete(ctx, o) {
  const {
    x,
    y,
    facing = 1,
    pose = 'idle',
    t = 0,
    kit,
    rot = 0,
    alpha = 1,
    ball = null,
    size = 1,
    flash = false,
    glow = null,
  } = o
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(Math.round(x), Math.round(y))
  ctx.scale(facing * size, size)
  if (rot) {
    ctx.translate(0, -18)
    ctx.rotate(rot)
    ctx.translate(0, 18)
  }
  ctx.lineCap = 'square'
  ctx.lineJoin = 'miter'
  const cel = Math.floor(t * 12) % 8,
    ph = (cel / 8) * Math.PI * 2
  const [la, lb, aa, ab] = (POSES[pose] || POSES.idle)(ph)
  const bob = ['run', 'walk', 'hold'].includes(pose)
    ? -Math.round(Math.abs(Math.sin(ph)) * 2)
    : pose === 'idle'
      ? Math.round(Math.sin(t * 3))
      : 0
  if (glow) {
    ctx.fillStyle = glow + '28'
    ctx.beginPath()
    ctx.ellipse(0, -22, 17, 26, 0, 0, Math.PI * 2)
    ctx.fill()
    rect(ctx, -16, -17, 2, 9, glow)
    rect(ctx, 15, -31, 2, 9, glow)
  }
  ctx.translate(0, bob)
  const skin = flash ? '#ffffff' : kit.skin,
    jersey = flash ? '#ffffff' : kit.jersey,
    pants = flash ? '#ffffff' : kit.pants || '#e8e8d3'
  const back = limb(ctx, -3, -24, ab, 11, 4, skin)
  const backFoot = limb(ctx, -3, -13, lb, 12, 5, pants)
  rect(ctx, backFoot[0] - 3, backFoot[1] - 2, 8, 4, OUT)
  rect(ctx, backFoot[0] - 2, backFoot[1] - 1, 6, 2, kit.jersey)
  rect(ctx, -8, -29, 16, 18, OUT)
  rect(ctx, -7, -28, 14, 15, jersey)
  rect(ctx, -6, -27, 3, 6, kit.trim)
  rect(ctx, 4, -27, 3, 6, kit.trim)
  rect(ctx, -1, -27, 1, 12, '#ffffff55')
  rect(ctx, -6, -13, 12, 4, pants)
  rect(ctx, -7, -14, 14, 2, OUT)
  rect(ctx, -1, -14, 3, 2, '#d5a457')
  // Jersey number and piping.
  const digits = [
    '010110010010111',
    '111001111100111',
    '111001111001111',
    '101101111001001',
    '111100111001111',
    '111100111101111',
    '111001010010010',
  ]
  const glyph = digits[((kit.number || 1) - 1) % 7]
  for (let i = 0; i < glyph.length; i++)
    if (glyph[i] === '1')
      rect(ctx, facing < 0 ? 3 - (i % 3) : 1 + (i % 3), -23 + Math.floor(i / 3), 1, 1, kit.trim)
  const frontFoot = limb(ctx, 3, -12, la, 12, 5, pants)
  rect(ctx, frontFoot[0] - 2, frontFoot[1] - 5, 4, 3, kit.jersey)
  rect(ctx, frontFoot[0] - 3, frontFoot[1] - 2, 9, 4, OUT)
  rect(ctx, frontFoot[0] - 2, frontFoot[1] - 1, 7, 2, kit.trim)
  rect(ctx, -7, -42, 16, 14, OUT)
  rect(ctx, -6, -41, 14, 12, skin)
  rect(ctx, 6, -35, 3, 4, skin)
  rect(ctx, -5, -37, 3, 8, kit.hair)
  rect(ctx, -4, -31, 2, 3, kit.hair)
  // Cap/helmet: brim points in the player's facing direction.
  rect(ctx, -7, -46, 14, 2, OUT)
  rect(ctx, -8, -44, 17, 6, OUT)
  rect(ctx, -7, -44, 15, 5, kit.band)
  rect(ctx, -5, -45, 11, 2, kit.band)
  rect(ctx, -3, -43, 3, 3, kit.trim)
  rect(ctx, 3, -38, 9, 2, OUT)
  rect(ctx, 3, -39, 9, 2, kit.band)
  if (kit.helmet) {
    rect(ctx, -7, -38, 3, 7, kit.band)
    rect(ctx, -6, -35, 2, 2, kit.trim)
  }
  if (kit.style === 3) {
    rect(ctx, -8, -35, 2, 8, kit.hair)
    rect(ctx, -10, -29, 3, 3, kit.hair)
  }
  if (['hurt', 'ko'].includes(pose)) {
    rect(ctx, 3, -34, 3, 1, OUT)
    rect(ctx, 4, -35, 1, 3, OUT)
  } else {
    rect(ctx, 3, -34, 3, 2, '#fff8e8')
    rect(ctx, 5, -34, 1, 2, OUT)
    rect(ctx, 3, -36, 4, 1, OUT)
  }
  if (kit.glasses) {
    rect(ctx, 2, -35, 5, 4, OUT)
    rect(ctx, 3, -34, 3, 2, '#b2e9eb')
    rect(ctx, 5, -34, 1, 2, OUT)
  }
  if (kit.beard) {
    rect(ctx, 0, -30, 6, 2, kit.hair)
    rect(ctx, 1, -31, 5, 1, kit.hair)
  } else rect(ctx, 4, -29, 3, 1, '#ad604d')
  if (pose !== 'catch') glove(ctx, back[0], back[1])
  const front = limb(ctx, 3, -24, aa, 11, 4, skin)
  rect(ctx, front[0] - 2, front[1] - 2, 4, 4, skin)
  // A reception leads with the glove; a pitch leads with the bare ball hand.
  if (pose === 'catch') glove(ctx, front[0] + 1, front[1], true)
  if (ball) drawBall(ctx, { x: front[0] + 2, y: front[1] - 1, kind: ball, r: 3.5, spin: t * 4 })
  if (pose === 'cheer') {
    rect(ctx, 14, -43, 2, 3, '#f9d57c')
    rect(ctx, -15, -37, 2, 2, '#5de7cd')
  }
  ctx.restore()
}
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}
export function drawBall(ctx, b) {
  const r = b.r ?? 5
  ctx.save()
  ctx.translate(Math.round(b.x), Math.round(b.y))
  if (['super', 'fire'].includes(b.kind)) {
    ctx.shadowColor = b.kind === 'fire' ? '#ff596d' : '#5de7cd'
    ctx.shadowBlur = 12
  }
  ctx.fillStyle = OUT
  ctx.beginPath()
  ctx.arc(0, 0, r + 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = '#f8f2db'
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.rotate(b.spin ?? 0)
  ctx.strokeStyle = '#d95457'
  ctx.lineWidth = 0.8
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(side * r * 0.5, -r * 0.8)
    ctx.quadraticCurveTo(side * r * 0.1, 0, side * r * 0.5, r * 0.8)
    ctx.stroke()
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath()
      ctx.moveTo(side * r * 0.2 - r * 0.18, i * r * 0.45)
      ctx.lineTo(side * r * 0.2 + r * 0.18, i * r * 0.45 + r * 0.12)
      ctx.stroke()
    }
  }
  rect(ctx, -r * 0.5, -r * 0.5, Math.max(1, r * 0.35), 1, '#ffffff')
  ctx.restore()
}

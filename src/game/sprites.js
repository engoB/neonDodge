// Personnages et objets dessinés en vectoriel (création originale).

const OUT = '#1b1530'

function limb(ctx, px, py, ang, len, w, col) {
  const ex = px + Math.sin(ang) * len
  const ey = py + Math.cos(ang) * len
  ctx.strokeStyle = OUT
  ctx.lineWidth = w + 2
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  ctx.strokeStyle = col
  ctx.lineWidth = w
  ctx.beginPath()
  ctx.moveTo(px, py)
  ctx.lineTo(ex, ey)
  ctx.stroke()
  return [ex, ey]
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const r = Math.min(255, ((n >> 16) & 255) * k)
  const g = Math.min(255, ((n >> 8) & 255) * k)
  const b = Math.min(255, (n & 255) * k)
  return `rgb(${r | 0},${g | 0},${b | 0})`
}

// angles : jambe avant, jambe arrière, bras avant, bras arrière (0 = vers le bas, + = vers l'avant)
const POSES = {
  run: (ph) => [Math.sin(ph) * 0.9, -Math.sin(ph) * 0.9, -Math.sin(ph) * 1.0, Math.sin(ph) * 1.0],
  walk: (ph) => [Math.sin(ph) * 0.5, -Math.sin(ph) * 0.5, -Math.sin(ph) * 0.5, Math.sin(ph) * 0.5],
  jump: () => [0.9, -0.35, 2.5, -0.7],
  fall: () => [0.5, -0.2, 1.9, 1.1],
  catch: () => [0.45, -0.45, 1.45, 1.3],
  hold: (ph) => [Math.sin(ph) * 0.9, -Math.sin(ph) * 0.9, 1.2, 1.0],
  throw: () => [0.7, -0.5, 1.7, -0.9],
  windup: () => [0.35, -0.35, -2.4, 0.7],
  idle: (ph, t) => [0.12, -0.12, 0.25 + Math.sin(t * 3) * 0.06, -0.25],
  taunt: (ph, t) => [0.12, -0.12, 2.6 + Math.sin(t * 10) * 0.25, -0.3],
  cheer: (ph, t) => [0.15, -0.15, 2.8 + Math.sin(t * 12) * 0.2, 2.6 - Math.sin(t * 12) * 0.2],
  ko: (ph) => [Math.sin(ph * 1.3) * 1.2, -Math.sin(ph * 1.3) * 1.2, 2.5 + Math.sin(ph) * 0.5, 2.2 - Math.sin(ph) * 0.5],
  hurt: () => [-0.5, 0.4, 2.6, 2.2],
}

export function drawAthlete(ctx, o) {
  const { x, y, facing = 1, pose = 'run', t = 0, kit, rot = 0, alpha = 1, ball = null, size = 1, flash = false, glow = null } = o
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, y)
  if (rot) {
    ctx.translate(0, -16 * size)
    ctx.rotate(rot)
    ctx.translate(0, 16 * size)
  }
  ctx.scale(facing * size, size)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const ph = t * 15
  const [lA, lB, aA, aB] = (POSES[pose] || POSES.run)(ph, t)
  const bob = pose === 'run' || pose === 'hold' ? Math.abs(Math.sin(ph)) * -1.2 : 0

  if (pose !== 'ko') {
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.beginPath()
    ctx.ellipse(0, 0.5, 8, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  if (glow) {
    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = 14
    ctx.strokeStyle = glow
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.ellipse(0, -18, 13, 22, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
  ctx.translate(0, bob)

  const skin = flash ? '#ffffff' : kit.skin
  const jersey = flash ? '#ffffff' : kit.jersey
  const [bx, by] = limb(ctx, -1, -20, aB, 9, 3.2, shade(skin, 0.8))
  limb(ctx, -1, -11, lB, 11, 3.6, shade(kit.shorts, 0.75))
  shoe(ctx, -1, -11, lB, '#2a2342')

  ctx.fillStyle = OUT
  rr(ctx, -7, -23.5, 14, 14, 4)
  ctx.fill()
  ctx.fillStyle = jersey
  rr(ctx, -6, -22.5, 12, 12, 3)
  ctx.fill()
  ctx.fillStyle = kit.trim
  ctx.fillRect(-6, -17.5, 12, 2)
  ctx.fillStyle = kit.shorts
  ctx.fillRect(-6, -12, 12, 4.5)

  limb(ctx, 1, -11, lA, 11, 3.6, kit.shorts)
  shoe(ctx, 1, -11, lA, '#f8fafc')

  ctx.fillStyle = OUT
  ctx.beginPath()
  ctx.arc(1, -28, 8.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.arc(1, -28, 7.4, 0, Math.PI * 2)
  ctx.fill()
  hair(ctx, kit, t)
  ctx.fillStyle = kit.band
  ctx.fillRect(-6.2, -32, 14.4, 3)
  ctx.strokeStyle = kit.band
  ctx.lineWidth = 1.6
  const flap = Math.sin(t * 18) * 2
  ctx.beginPath()
  ctx.moveTo(-6, -31)
  ctx.quadraticCurveTo(-10, -32 + flap, -14, -29 + flap)
  ctx.moveTo(-6, -30)
  ctx.quadraticCurveTo(-10, -28 - flap * 0.5, -13, -25 - flap * 0.5)
  ctx.stroke()
  ctx.fillStyle = OUT
  if (pose === 'ko' || pose === 'hurt') {
    ctx.lineWidth = 1.2
    ctx.strokeStyle = OUT
    ctx.beginPath()
    ctx.moveTo(3, -29.5); ctx.lineTo(6, -26.5)
    ctx.moveTo(6, -29.5); ctx.lineTo(3, -26.5)
    ctx.stroke()
  } else {
    ctx.fillRect(4, -29, 2, 3)
    ctx.fillRect(3, -30.6, 4, 1)
    ctx.fillStyle = 'rgba(255,120,120,0.45)'
    ctx.fillRect(3, -25.6, 3, 1.3)
  }

  const [ax, ay] = limb(ctx, 1, -20, aA, 9, 3.2, skin)
  if (ball) {
    const two = pose === 'catch' || pose === 'hold'
    drawBall(ctx, { x: two ? (ax + bx) / 2 + 3 : ax, y: two ? (ay + by) / 2 : ay, kind: ball, r: 5, spin: t * 4 })
  }
  ctx.restore()
}

function shoe(ctx, px, py, ang, col) {
  const ex = px + Math.sin(ang) * 11
  const ey = py + Math.cos(ang) * 11
  ctx.fillStyle = OUT
  rr(ctx, ex - 2.5, ey - 2, 7, 3.6, 1.6)
  ctx.fill()
  ctx.fillStyle = col
  rr(ctx, ex - 1.8, ey - 1.4, 5.6, 2.2, 1)
  ctx.fill()
}

function hair(ctx, kit, t) {
  ctx.fillStyle = kit.hair
  ctx.strokeStyle = OUT
  ctx.lineWidth = 1
  ctx.beginPath()
  switch (kit.style) {
    case 1: // brosse
      ctx.moveTo(-7, -30)
      ctx.lineTo(-7, -37)
      ctx.lineTo(8, -37)
      ctx.lineTo(8.5, -31)
      break
    case 2: // crête
      ctx.moveTo(-6, -31)
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(-5 + i * 3, -41 + (i % 2) * 3)
        ctx.lineTo(-3.5 + i * 3, -34)
      }
      ctx.lineTo(8, -31)
      break
    case 3: // queue de cheval
      ctx.moveTo(-7, -27)
      ctx.quadraticCurveTo(-8, -37, 1, -37)
      ctx.quadraticCurveTo(9, -37, 8.5, -31)
      ctx.lineTo(-7, -30)
      ctx.moveTo(-6, -32)
      ctx.quadraticCurveTo(-14, -30 + Math.sin(t * 14) * 2, -13, -22)
      ctx.lineTo(-8, -28)
      break
    default: // épis
      ctx.moveTo(-8, -26)
      ctx.lineTo(-12, -33)
      ctx.lineTo(-7, -33)
      ctx.lineTo(-8, -39)
      ctx.lineTo(-2, -36)
      ctx.lineTo(1, -42)
      ctx.lineTo(4, -36)
      ctx.lineTo(9, -38)
      ctx.lineTo(8.5, -31)
      ctx.lineTo(-6, -30)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
}

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

const BALL_COL = {
  enemy: ['#ef4444', '#fecaca'],
  roll: ['#64748b', '#e2e8f0'],
  fire: ['#f97316', '#fde047'],
  player: ['#06b6d4', '#cffafe'],
  super: ['#ffffff', '#67e8f9'],
  loose: ['#f59e0b', '#fef3c7'],
}

export function drawBall(ctx, b) {
  const r = b.r ?? 5
  const [c1, c2] = BALL_COL[b.kind] || BALL_COL.enemy
  ctx.save()
  ctx.translate(b.x, b.y)
  if (b.kind === 'fire' || b.kind === 'super') {
    ctx.shadowColor = b.kind === 'fire' ? '#fb923c' : '#22d3ee'
    ctx.shadowBlur = 12
  }
  ctx.fillStyle = OUT
  ctx.beginPath()
  ctx.arc(0, 0, r + 1, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r)
  g.addColorStop(0, c2)
  g.addColorStop(1, c1)
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.rotate(b.spin ?? 0)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 0.9
  ctx.beginPath()
  ctx.moveTo(-r, 0)
  ctx.quadraticCurveTo(0, r * 0.6, r, 0)
  ctx.stroke()
  ctx.restore()
}

export function drawCoin(ctx, x, y, t) {
  const w = Math.abs(Math.cos(t * 4 + x * 0.05)) * 5 + 1
  ctx.fillStyle = OUT
  ctx.beginPath()
  ctx.ellipse(x, y, w + 1, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.ellipse(x, y, w, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fef3c7'
  ctx.fillRect(x - w * 0.3, y - 3, Math.max(1, w * 0.3), 4)
}

export function drawGold(ctx, x, y, t) {
  const by = y + Math.sin(t * 3) * 2.5
  ctx.save()
  ctx.translate(x, by)
  ctx.rotate(t * 0.8)
  ctx.fillStyle = 'rgba(253,224,71,0.25)'
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-3, 18)
    ctx.lineTo(3, 18)
    ctx.fill()
  }
  ctx.restore()
  ctx.save()
  ctx.shadowColor = '#fde047'
  ctx.shadowBlur = 12
  drawBall(ctx, { x, y: by, r: 8, kind: 'fire', spin: t })
  ctx.restore()
  ctx.fillStyle = '#fff'
  ctx.fillRect(x - 4, by - 5, 2, 2)
}

export function drawHeart(ctx, x, y, t, col = '#f43f5e') {
  const s = 1 + Math.sin(t * 6) * 0.08
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(s, s)
  ctx.fillStyle = OUT
  heartPath(ctx, 7.5)
  ctx.fill()
  ctx.fillStyle = col
  heartPath(ctx, 6)
  ctx.fill()
  ctx.restore()
}

function heartPath(ctx, r) {
  ctx.beginPath()
  ctx.moveTo(0, r * 0.9)
  ctx.bezierCurveTo(-r * 1.4, -r * 0.1, -r * 0.6, -r * 1.1, 0, -r * 0.4)
  ctx.bezierCurveTo(r * 0.6, -r * 1.1, r * 1.4, -r * 0.1, 0, r * 0.9)
  ctx.closePath()
}

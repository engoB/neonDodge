// Rendu du match : terrain en perspective, joueurs triés par profondeur, balle et effets.
import * as C from './constants.js'
import { drawAthlete, drawBall, rr } from './sprites.js'
import { SCENES } from './scenery.js'

export const VIEW_H = 270
const FLOOR_Y = 150 // y écran du fond du terrain (profondeur 0)
const DEPTH_K = 0.9 // more room between the chunky arcade silhouettes
const SHEAR = 0.2 // décalage horizontal selon la profondeur (perspective)

export const toScreen = (x, y, z = 0) => [x + (y - C.DEPTH / 2) * SHEAR, FLOOR_Y + y * DEPTH_K - z]

const FLOORS = {
  gym: { out: '#153a36', in: '#29735a', dirt: '#ab7452', line: '#ecedd0', mid: '#5de7cd' },
  roof: { out: '#243c3e', in: '#386456', dirt: '#aa6e58', line: '#f2dfc6', mid: '#ff7b7f' },
  beach: { out: '#1c4946', in: '#338573', dirt: '#c6945c', line: '#f7e9c7', mid: '#f9d57c' },
  desert: { out: '#4b2527', in: '#765137', dirt: '#c27848', line: '#ffe5a3', mid: '#f7d154' },
  foundry: { out: '#202932', in: '#39444a', dirt: '#814b38', line: '#f0d5b5', mid: '#ff6b35' },
  neon: { out: '#213445', in: '#385367', dirt: '#886781', line: '#e9dcf7', mid: '#c2a0ff' },
}

function quad(ctx, x0, y0, x1, y1) {
  const a = toScreen(x0, y0)
  const b = toScreen(x1, y0)
  const c = toScreen(x1, y1)
  const d = toScreen(x0, y1)
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.lineTo(c[0], c[1])
  ctx.lineTo(d[0], d[1])
  ctx.closePath()
}

function line(ctx, x0, y0, x1, y1) {
  const a = toScreen(x0, y0)
  const b = toScreen(x1, y1)
  ctx.beginPath()
  ctx.moveTo(a[0], a[1])
  ctx.lineTo(b[0], b[1])
  ctx.stroke()
}

export function drawMatch(m, ctx, scale, dpr, viewH, t) {
  const arena = m.rival.arena
  const fl = FLOORS[arena]
  const offY = (viewH - VIEW_H) * 0.85
  const sh = !m.reducedMotion && m.shake ? (Math.sin(t * 90) * m.shake) / 2 : 0
  const zoom = m.camZoom || 1
  const worldLeft = m.camX - m.viewW / (2 * zoom)
  const worldWidth = m.viewW / zoom
  const cameraY = FLOOR_Y + C.DEPTH * DEPTH_K * 0.55
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
  ctx.translate(0, offY)
  // décor du fond (tribunes, ciel…)
  SCENES[arena].bg(ctx, m.camX, m.viewW, -offY, FLOOR_Y - 15, m.reducedMotion ? 0 : t)
  ctx.save()
  ctx.translate(m.viewW / 2 + sh, cameraY)
  ctx.scale(zoom, zoom)
  ctx.translate(-m.camX, -cameraY)
  // sol extérieur jusqu'en bas de l'écran
  ctx.fillStyle = fl.out
  ctx.fillRect(worldLeft - 40, FLOOR_Y - 30, worldWidth + 80, viewH - offY - FLOOR_Y + 40)
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(worldLeft - 40, FLOOR_Y - 30, worldWidth + 80, 4)
  // terrain
  quad(ctx, 0, 0, C.COURT_W, C.DEPTH)
  ctx.fillStyle = fl.in
  ctx.fill()
  // Mown turf stripes, clay infields and four bases. Simulation stays dodgeball.
  for (let x = 0; x < C.COURT_W; x += 32) {
    quad(ctx, x, 0, Math.min(x + 16, C.COURT_W), C.DEPTH)
    ctx.fillStyle = '#ffffff09'
    ctx.fill()
  }
  // Stable short grass strokes, clipped to the playable perspective quadrilateral.
  ctx.save()
  quad(ctx, 0, 0, C.COURT_W, C.DEPTH)
  ctx.clip()
  for (let gx = 2; gx < C.COURT_W; gx += 8) {
    for (let gy = 3; gy < C.DEPTH; gy += 9) {
      const n = (gx * 23 + gy * 41) % 19
      const [sx, sy] = toScreen(gx + (n % 5), gy)
      ctx.fillStyle = n % 3 === 0 ? '#92b58430' : '#092f3328'
      ctx.fillRect(Math.round(sx), Math.round(sy), 2, 1)
    }
  }
  ctx.restore()
  for (const center of [C.MID / 2, C.MID * 1.5]) {
    ctx.beginPath()
    for (const [i, [dx, dy]] of [
      [0, [-68, 0]],
      [1, [0, -36]],
      [2, [68, 0]],
      [3, [0, 36]],
    ]) {
      const [sx, sy] = toScreen(center + dx, C.DEPTH / 2 + dy)
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.closePath()
    ctx.fillStyle = fl.dirt
    ctx.fill()
    ctx.save()
    ctx.clip()
    for (let dx = -68; dx <= 68; dx += 8)
      for (let dy = -36; dy <= 36; dy += 7) {
        const [tx, ty] = toScreen(center + dx, C.DEPTH / 2 + dy)
        ctx.fillStyle = (dx + dy) % 3 ? '#ffe4b824' : '#6a3d352b'
        ctx.fillRect(Math.round(tx + (dy % 4)), Math.round(ty), 2, 1)
      }
    ctx.restore()
    ctx.strokeStyle = '#e8c6a880'
    ctx.lineWidth = 1
    ctx.stroke()
    for (const [dx, dy] of [
      [-68, 0],
      [0, -36],
      [68, 0],
      [0, 36],
    ]) {
      const [sx, sy] = toScreen(center + dx, C.DEPTH / 2 + dy)
      ctx.fillStyle = fl.line
      ctx.fillRect(sx - 3, sy - 2, 6, 3)
    }
    const [sx, sy] = toScreen(center, C.DEPTH / 2)
    ctx.fillStyle = '#d6a378'
    ctx.beginPath()
    ctx.ellipse(sx, sy, 12, 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = fl.line
    ctx.fillRect(sx - 4, sy - 1, 8, 2)
  }
  ctx.strokeStyle = fl.line
  ctx.lineWidth = 2
  quad(ctx, 0, 0, C.COURT_W, C.DEPTH)
  ctx.stroke()
  ctx.strokeStyle = fl.mid
  ctx.lineWidth = 2.5
  line(ctx, C.MID, 0, C.MID, C.DEPTH)
  ctx.strokeStyle = fl.line
  ctx.globalAlpha = 0.5
  ctx.lineWidth = 1
  line(ctx, C.MID - 70, 0, C.MID - 70, C.DEPTH)
  line(ctx, C.MID + 70, 0, C.MID + 70, C.DEPTH)
  ctx.globalAlpha = 1
  // cercle central
  ctx.save()
  const [cx, cy] = toScreen(C.MID, C.DEPTH / 2)
  ctx.strokeStyle = fl.mid
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.ellipse(cx, cy, 22, 22 * DEPTH_K, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  const ctrl = m.controlled
  const holder = m.holder
  const target = holder && holder.team === 0 ? m.pickTarget(holder) : null
  // ombres
  for (const p of m.players) {
    const [sx, sy] = toScreen(p.x, p.y)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.beginPath()
    ctx.ellipse(sx, sy, 12, 3.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  const b = m.ball
  if (b.state !== 'held') {
    const [bx, by] = toScreen(b.x, b.y)
    ctx.fillStyle = 'rgba(0,0,0,0.25)'
    ctx.beginPath()
    ctx.ellipse(bx, by, 5, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // marqueurs au sol : cible verrouillée et joueur piloté
  if (target) ring(ctx, target, '#fb923c', t)
  if (ctrl && !ctrl.ko) ring(ctx, ctrl, '#22d3ee', t)

  if (b.state === 'flying') {
    const trail = b.trail || []
    ctx.save()
    ctx.lineCap = 'round'
    for (let i = 1; i < trail.length; i++) {
      const a = toScreen(trail[i - 1].x, trail[i - 1].y, trail[i - 1].z)
      const c = toScreen(trail[i].x, trail[i].y, trail[i].z)
      const f = i / trail.length
      ctx.globalAlpha = f * (b.sup ? 0.78 : b.kind === 'pass' ? 0.38 : 0.62)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1 + f * (b.sup ? 6 : 3.5)
      ctx.beginPath()
      ctx.moveTo(a[0], a[1])
      ctx.lineTo(c[0], c[1])
      ctx.stroke()
      ctx.globalAlpha *= 0.72
      ctx.strokeStyle = b.team === 0 ? '#67e8f9' : '#fb7185'
      ctx.lineWidth = Math.max(1, ctx.lineWidth * 0.36)
      ctx.stroke()
    }
    ctx.restore()
  }
  // A short dashed aim guide connects the pitcher to the announced target.
  if (holder && target && holder.team === 0 && m.state === 'play') {
    const [x, y] = toScreen(holder.x, holder.y, holder.z + 20)
    const [tx, ty] = toScreen(target.x, target.y, target.z + 20)
    ctx.save()
    ctx.globalAlpha = 0.24
    ctx.strokeStyle = '#f9d57c'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 5])
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(tx, ty)
    ctx.stroke()
    ctx.restore()
  }
  // joueurs et balle, triés par profondeur
  const items = m.players.map((p) => ({ y: p.y, p }))
  if (b.state !== 'held') items.push({ y: b.y + 0.5, ball: true })
  items.sort((a, c) => a.y - c.y)
  for (const it of items) {
    if (it.ball) {
      const [bx, by] = toScreen(b.x, b.y, b.z)
      drawBall(ctx, {
        x: bx,
        y: by,
        r: b.sup ? 8.5 : 7,
        kind: b.sup
          ? b.team === 0
            ? 'super'
            : 'fire'
          : b.kind === 'loose'
            ? 'loose'
            : b.team === 0
              ? 'player'
              : 'enemy',
        spin: b.age * 0.4,
      })
      continue
    }
    const p = it.p
    const [sx, sy] = toScreen(p.x, p.y, p.z)
    const pose = poseOf(m, p)
    drawAthlete(ctx, {
      x: sx,
      y: sy,
      facing: p.facing,
      pose,
      t: p.anim,
      progress: p.state === 'throw' ? (14 - p.t) / 14 : p.state === 'catch' ? (12 - p.t) / 12 : undefined,
      kit: p.kit,
      ball:
        holder === p
          ? p.glow
            ? p.team === 0
              ? 'super'
              : 'fire'
            : p.team === 0
              ? 'player'
              : 'enemy'
          : null,
      flash: p.flash > 0 && p.flash % 4 < 2,
      glow: p === holder && p.glow ? (p.team === 0 ? '#22d3ee' : '#fb923c') : null,
      alpha: p.role === 'out' ? 0.95 : 1,
      rot: p.ko ? Math.min(1.4, p.t * 0.08) * -p.facing : 0,
    })
    if (p.ko && p.z === 0) {
      ctx.save()
      ctx.font = 'bold 10px monospace'
      ctx.fillStyle = '#f9d57c'
      ctx.textAlign = 'center'
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + (m.reducedMotion ? 0 : t * 3)
        ctx.fillText('★', sx + Math.cos(angle) * 14, sy - 20 + Math.sin(angle) * 4)
      }
      ctx.restore()
    }
    if (p === holder && p.team === 0 && p.state === 'dash')
      chargeRing(
        ctx,
        sx,
        sy - 48,
        Math.min(1, p.charge / C.SUPER_CHARGE),
        p.charge > C.SUPER_CHARGE + C.SUPER_ZONE,
      )
    if (p === ctrl || p === target || (p.state === 'hit' && !p.ko))
      nameTag(ctx, p, sx, sy - 50 - (p === holder && p.state === 'dash' ? 10 : 0))
  }
  // particules et textes
  for (const q of m.parts) {
    const [x, y] = toScreen(q.x, q.y, q.z)
    ctx.globalAlpha = Math.min(1, q.life / 12)
    ctx.fillStyle = q.color
    ctx.fillRect(x - q.size / 2, y - q.size / 2, q.size, q.size)
  }
  ctx.globalAlpha = 1
  ctx.textAlign = 'center'
  for (const tx of m.texts) {
    const [x, y] = toScreen(tx.x, tx.y, tx.z)
    ctx.globalAlpha = Math.min(1, tx.t / 14)
    ctx.font = '900 11px monospace'
    ctx.lineWidth = 3
    ctx.strokeStyle = '#1b1530'
    ctx.strokeText(tx.text, x, y)
    ctx.fillStyle = tx.color
    ctx.fillText(tx.text, x, y)
  }
  ctx.globalAlpha = 1
  if (m.finisher) drawBatFinisher(ctx, m.finisher)
  // superpositions écran
  ctx.restore()
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0)
  if (!m.reducedMotion && m.shake > 6) {
    ctx.fillStyle = '#f5f0d912'
    ctx.fillRect(0, 0, m.viewW, viewH)
  }
  if (m.impactFocus) {
    const pulse = 0.1 + Math.abs(Math.sin(m.impactFocus.t * 0.35)) * 0.12
    ctx.fillStyle = `rgba(249,213,124,${pulse})`
    ctx.fillRect(0, 0, m.viewW, viewH)
  }
  const cxs = m.viewW / 2
  const cys = viewH / 2
  if (m.state === 'intro') {
    const n = Math.ceil(m.introT / 40)
    banner(ctx, cxs, cys, n > 3 ? 'PLAY BALL !' : n > 0 ? String(n) : 'GO !', n > 3 ? 28 : 46)
  }
  if (m.state === 'end' && m.endT < 120)
    banner(ctx, cxs, viewH - 18, m.winner === 0 ? 'VICTOIRE !' : 'DÉFAITE…', 24)
  if (m.superBanner) specialBanner(ctx, m.superBanner, m.viewW, viewH)
}

function poseOf(m, p) {
  if (p.ko) return 'ko'
  if (p.state === 'hit') return 'hurt'
  if (p.state === 'catch') return 'catch'
  if (p.state === 'whiff') return 'hurt'
  if (p.state === 'windup') return 'windup'
  if (p.state === 'meter') return 'hold'
  if (p.state === 'throw') return 'throw'
  if (p.z > 0) return p.vz > 0 ? 'jump' : 'fall'
  if (p.state === 'dash') return 'run'
  if (p.state === 'walk') return m.holder === p ? 'hold' : 'walk'
  if (m.state === 'end') return m.winner === p.team ? 'cheer' : 'idle'
  return m.holder === p ? 'hold' : 'idle'
}

function drawBatFinisher(ctx, finisher) {
  const [x, y] = toScreen(finisher.x, finisher.y, 26)
  const enter = Math.min(1, (78 - finisher.t) / 12)
  const angle = (-1.15 + enter * 2.05) * finisher.facing
  ctx.save()
  ctx.translate(x - finisher.facing * 18, y - 8)
  ctx.rotate(angle)
  ctx.shadowColor = finisher.team === 0 ? '#67e8f9' : '#fb7185'
  ctx.shadowBlur = 14
  ctx.fillStyle = '#4b2b20'
  ctx.fillRect(-4, -4, 15, 8)
  ctx.fillStyle = '#f9d57c'
  ctx.fillRect(8, -7, 48, 14)
  ctx.fillStyle = '#fff3c4'
  ctx.fillRect(14, -5, 34, 4)
  ctx.restore()
  ctx.save()
  ctx.translate(x, y)
  ctx.strokeStyle = '#f9d57c'
  ctx.lineWidth = 3
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 8)
    ctx.lineTo(Math.cos(a) * 30, Math.sin(a) * 21)
    ctx.stroke()
  }
  ctx.restore()
}

function ring(ctx, p, color, t) {
  const [sx, sy] = toScreen(p.x, p.y)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.7 + Math.sin(t * 8) * 0.3
  ctx.beginPath()
  ctx.ellipse(sx, sy, 12, 4.5, 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function chargeRing(ctx, x, y, f, late) {
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.beginPath()
  ctx.arc(x, y, 6, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = late ? '#94a3b8' : f >= 1 ? '#fde047' : '#22d3ee'
  ctx.beginPath()
  ctx.arc(x, y, 6, -Math.PI / 2, -Math.PI / 2 + f * Math.PI * 2)
  ctx.stroke()
}

function nameTag(ctx, p, x, y) {
  const w = 30
  ctx.font = '800 7px monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(27,21,48,0.75)'
  rr(ctx, x - w / 2, y - 9, w, 12, 3)
  ctx.fill()
  ctx.fillStyle = p.team === 0 ? '#a5f3fc' : '#fecaca'
  ctx.fillText(p.name, x, y - 2.5)
  if (p.role === 'in') {
    ctx.fillStyle = '#1b1530'
    ctx.fillRect(x - w / 2 + 2, y, w - 4, 2)
    ctx.fillStyle = p.hp / p.maxHp > 0.35 ? '#4ade80' : '#f43f5e'
    ctx.fillRect(x - w / 2 + 2, y, (w - 4) * (p.hp / p.maxHp), 2)
  }
}

function banner(ctx, x, y, text, size) {
  ctx.font = `900 ${size}px Impact, sans-serif`
  ctx.textAlign = 'center'
  ctx.lineWidth = Math.max(4, size / 7)
  ctx.strokeStyle = '#1b1530'
  ctx.strokeText(text, x, y)
  ctx.fillStyle = '#fde047'
  ctx.fillText(text, x, y)
}

function specialBanner(ctx, callout, width, height) {
  const life = callout.t
  const enter = Math.min(1, (84 - life) / 10)
  const leave = Math.min(1, life / 14)
  const alpha = Math.min(enter, leave)
  const accent = callout.team === 0 ? '#67e8f9' : '#fb7185'
  const cardW = Math.min(width - 24, 460)
  const x = (width - cardW) / 2
  const y = Math.max(10, Math.min(22, height * 0.08))
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate((1 - enter) * (callout.team === 0 ? -cardW : cardW), 0)
  ctx.fillStyle = '#060d18df'
  ctx.fillRect(x, y, cardW, 38)
  ctx.fillStyle = accent
  ctx.fillRect(x, y, cardW, 3)
  ctx.fillRect(x, y + 35, cardW, 3)
  ctx.textAlign = 'center'
  ctx.font = '900 7px monospace'
  ctx.fillStyle = '#f5f0d9'
  ctx.fillText(callout.kicker, width / 2, y + 11)
  const size = Math.max(16, Math.min(23, cardW / 18))
  ctx.font = `900 italic ${size}px Impact, sans-serif`
  ctx.lineWidth = Math.max(3, size / 8)
  ctx.strokeStyle = '#111827'
  ctx.strokeText(callout.name, width / 2, y + 30)
  ctx.fillStyle = accent
  ctx.fillText(callout.name, width / 2, y + 30)
  ctx.restore()
}

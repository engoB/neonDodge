// Décors procéduraux des 4 mondes (dessin vectoriel original).
import { rr } from './sprites.js'

const h = (i, s = 0) => {
  const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453
  return v - Math.floor(v)
}

// Répète un motif de période P dans une couche de parallaxe f (coordonnées écran).
function layer(camX, f, P, viewW, fn) {
  const off = camX * f
  const i0 = Math.floor(off / P) - 1
  const i1 = Math.ceil((off + viewW) / P) + 1
  for (let i = i0; i <= i1; i++) fn(i * P - off, i)
}

function sky(ctx, top, bottom, viewW, stops) {
  const g = ctx.createLinearGradient(0, top, 0, bottom)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  ctx.fillStyle = g
  ctx.fillRect(0, top, viewW, bottom - top)
}

export const SCENES = {
  gym: {
    bg(ctx, camX, viewW, top, bottom, t) {
      sky(ctx, top, 200, viewW, [[0, '#fbe3b8'], [1, '#eab676']])
      ctx.fillStyle = '#eab676'
      ctx.fillRect(0, 200, viewW, bottom - 200)
      // fenêtres hautes
      layer(camX, 0.15, 150, viewW, (x) => {
        ctx.fillStyle = '#9fd3f0'
        rr(ctx, x + 20, 26, 90, 44, 4)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillRect(x + 64, 26, 3, 44)
        ctx.fillRect(x + 20, 46, 90, 3)
      })
      // fanions
      layer(camX, 0.25, 60, viewW, (x, i) => {
        ctx.fillStyle = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][((i % 4) + 4) % 4]
        ctx.beginPath()
        ctx.moveTo(x, 86)
        ctx.lineTo(x + 24, 86)
        ctx.lineTo(x + 12, 102)
        ctx.fill()
      })
      // tribunes et public
      layer(camX, 0.4, 40, viewW, (x, i) => {
        for (let r = 0; r < 4; r++) {
          const y = 118 + r * 22
          ctx.fillStyle = r % 2 ? '#9ca3af' : '#b8bec8'
          ctx.fillRect(x, y + 14, 41, 8)
          const c = ['#f87171', '#60a5fa', '#fbbf24', '#34d399', '#c084fc', '#f472b6'][Math.floor(h(i, r) * 6)]
          const jump = Math.max(0, Math.sin(t * 6 + i * 1.7 + r)) * 2
          ctx.fillStyle = c
          ctx.fillRect(x + 12, y + 2 - jump, 12, 12)
          ctx.fillStyle = '#f2c094'
          ctx.beginPath()
          ctx.arc(x + 18, y - 2 - jump, 5, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    },
    pit: '#3b2414',
    ground(ctx, x0, x1, y, bottom) {
      ctx.fillStyle = '#b8743a'
      ctx.fillRect(x0, y, x1 - x0, bottom - y)
      ctx.fillStyle = '#d99a5b'
      ctx.fillRect(x0, y, x1 - x0, 5)
      ctx.fillStyle = 'rgba(80,40,10,0.25)'
      for (let x = Math.ceil(x0 / 28) * 28; x < x1; x += 28) ctx.fillRect(x, y + 5, 1.5, 22)
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.fillRect(x0, y + 12, x1 - x0, 2)
    },
    platform: { top: '#e5e7eb', body: '#3b82f6' },
  },
  roof: {
    bg(ctx, camX, viewW, top, bottom, t) {
      sky(ctx, top, bottom, viewW, [[0, '#2d1b69'], [0.55, '#ff7e5f'], [1, '#feb47b']])
      ctx.fillStyle = '#ffd27a'
      ctx.beginPath()
      ctx.arc(viewW * 0.72 - camX * 0.02, 120, 34, 0, Math.PI * 2)
      ctx.fill()
      layer(camX, 0.12, 70, viewW, (x, i) => {
        const hh = 50 + h(i, 1) * 70
        ctx.fillStyle = '#4a2f7a'
        ctx.fillRect(x, 230 - hh, 66, hh + 100)
      })
      layer(camX, 0.3, 90, viewW, (x, i) => {
        const hh = 40 + h(i, 2) * 90
        ctx.fillStyle = '#2a1b52'
        ctx.fillRect(x, 240 - hh, 80, hh + 100)
        ctx.fillStyle = '#fde68a'
        for (let wy = 250 - hh; wy < 240; wy += 14)
          for (let wx = 8; wx < 72; wx += 16) if (h(i * 31 + wx, wy) > 0.55) ctx.fillRect(x + wx, wy, 6, 7)
      })
    },
    pit: '#120c26',
    ground(ctx, x0, x1, y, bottom) {
      ctx.fillStyle = '#5b6275'
      ctx.fillRect(x0, y, x1 - x0, bottom - y)
      ctx.fillStyle = '#d6dbe6'
      ctx.fillRect(x0, y, x1 - x0, 4)
      ctx.fillStyle = 'rgba(0,0,0,0.18)'
      for (let x = Math.ceil(x0 / 40) * 40; x < x1; x += 40) ctx.fillRect(x, y + 4, 2, bottom - y)
      ctx.fillRect(x0, y + 22, x1 - x0, 2)
    },
    platform: { top: '#cbd5e1', body: '#475569' },
  },
  beach: {
    bg(ctx, camX, viewW, top, bottom, t) {
      sky(ctx, top, 175, viewW, [[0, '#4cc3f0'], [1, '#c4f1ff']])
      ctx.fillStyle = '#fff4b0'
      ctx.beginPath()
      ctx.arc(viewW * 0.8, 52, 22, 0, Math.PI * 2)
      ctx.fill()
      layer(camX, 0.08, 160, viewW, (x, i) => {
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        const y = 40 + h(i, 4) * 40
        ctx.beginPath()
        ctx.ellipse(x + 40, y, 30, 10, 0, 0, Math.PI * 2)
        ctx.ellipse(x + 62, y - 6, 20, 10, 0, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.fillStyle = '#1ba3d8'
      ctx.fillRect(0, 168, viewW, bottom - 168)
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1.5
      layer(camX, 0.2, 50, viewW, (x, i) => {
        const y = 176 + (i % 3) * 12 + Math.sin(t * 2 + i) * 2
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.quadraticCurveTo(x + 12, y - 4, x + 24, y)
        ctx.stroke()
      })
      layer(camX, 0.55, 240, viewW, (x, i) => {
        if (h(i, 9) < 0.4) return
        ctx.strokeStyle = '#7c4a1e'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.moveTo(x + 40, 228)
        ctx.quadraticCurveTo(x + 30, 180, x + 48, 140)
        ctx.stroke()
        ctx.fillStyle = '#16a34a'
        for (let k = 0; k < 5; k++) {
          ctx.beginPath()
          ctx.ellipse(x + 48, 140, 30, 7, -0.8 + k * 0.45 + Math.sin(t * 2) * 0.05, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    },
    pit: '#0e6f99',
    ground(ctx, x0, x1, y, bottom) {
      ctx.fillStyle = '#e8c27a'
      ctx.fillRect(x0, y, x1 - x0, bottom - y)
      ctx.fillStyle = '#fbe7b5'
      ctx.fillRect(x0, y, x1 - x0, 5)
      ctx.fillStyle = 'rgba(160,110,40,0.35)'
      for (let x = Math.ceil(x0 / 13) * 13; x < x1; x += 13) ctx.fillRect(x, y + 9 + ((x * 7) % 11), 2, 2)
    },
    platform: { top: '#fde68a', body: '#92400e' },
  },
  neon: {
    bg(ctx, camX, viewW, top, bottom, t) {
      sky(ctx, top, bottom, viewW, [[0, '#06031a'], [1, '#2a0b4a']])
      ctx.fillStyle = '#fff'
      layer(camX, 0.03, 37, viewW, (x, i) => {
        if (h(i, 5) > 0.6) ctx.fillRect(x, 10 + h(i, 6) * 90, 1.5, 1.5)
      })
      layer(camX, 0.2, 220, viewW, (x, i) => {
        ctx.fillStyle = '#1e1b4b'
        ctx.fillRect(x + 100, 40, 8, 160)
        ctx.fillStyle = '#fefce8'
        ctx.shadowColor = '#fde047'
        ctx.shadowBlur = 16
        for (let k = 0; k < 3; k++) ctx.fillRect(x + 84 + k * 14, 30, 10, 10)
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(253,224,71,0.06)'
        ctx.beginPath()
        ctx.moveTo(x + 104, 40)
        ctx.lineTo(x + 40 + Math.sin(t + i) * 30, 240)
        ctx.lineTo(x + 170 + Math.sin(t + i) * 30, 240)
        ctx.fill()
      })
      layer(camX, 0.45, 26, viewW, (x, i) => {
        ctx.fillStyle = '#140a30'
        const hh = 18 + h(i, 7) * 10 + Math.max(0, Math.sin(t * 8 + i * 0.6)) * 4
        ctx.beginPath()
        ctx.arc(x + 13, 205 - hh, 9, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillRect(x + 4, 205 - hh, 18, hh + 20)
        if (h(i, Math.floor(t * 3)) > 0.9) {
          ctx.fillStyle = '#e879f9'
          ctx.fillRect(x + 10, 196 - hh - 14, 4, 4)
        }
      })
    },
    pit: '#030010',
    ground(ctx, x0, x1, y, bottom) {
      ctx.fillStyle = '#14102e'
      ctx.fillRect(x0, y, x1 - x0, bottom - y)
      ctx.strokeStyle = '#2a2160'
      ctx.lineWidth = 1
      for (let x = Math.ceil(x0 / 30) * 30; x < x1; x += 30) {
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, bottom)
        ctx.stroke()
      }
      ctx.save()
      ctx.shadowColor = '#22d3ee'
      ctx.shadowBlur = 10
      ctx.fillStyle = '#22d3ee'
      ctx.fillRect(x0, y, x1 - x0, 2.5)
      ctx.restore()
    },
    platform: { top: '#e879f9', body: '#3b0764' },
  },
}

export function drawPlatform(ctx, p, world) {
  const s = SCENES[world].platform
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(p.x + 6, p.y + 10, 4, 18)
  ctx.fillRect(p.x + p.w - 10, p.y + 10, 4, 18)
  ctx.fillStyle = '#1b1530'
  rr(ctx, p.x - 1, p.y - 1, p.w + 2, 12, 3)
  ctx.fill()
  ctx.fillStyle = s.body
  rr(ctx, p.x, p.y, p.w, 10, 3)
  ctx.fill()
  ctx.fillStyle = s.top
  ctx.fillRect(p.x + 2, p.y + 1, p.w - 4, 3)
}

export function drawCrate(ctx, c, world) {
  const col = { gym: '#2563eb', roof: '#78716c', beach: '#b45309', neon: '#7c3aed' }[world]
  ctx.fillStyle = '#1b1530'
  rr(ctx, c.x - 1, c.y - c.h - 1, c.w + 2, c.h + 2, 3)
  ctx.fill()
  ctx.fillStyle = col
  rr(ctx, c.x, c.y - c.h, c.w, c.h, 3)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(c.x + 3, c.y - c.h + 3)
  ctx.lineTo(c.x + c.w - 3, c.y - 3)
  ctx.moveTo(c.x + c.w - 3, c.y - c.h + 3)
  ctx.lineTo(c.x + 3, c.y - 3)
  ctx.stroke()
}

export function drawGoal(ctx, x, y, t) {
  for (const px of [x - 30, x + 30]) {
    ctx.fillStyle = '#1b1530'
    ctx.fillRect(px - 3, y - 100, 6, 100)
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(px - 2, y - 99, 4, 98)
  }
  const wave = Math.sin(t * 4) * 2
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#111827' : '#f8fafc'
      ctx.fillRect(x - 28 + i * 5.6, y - 98 + j * 6 + Math.sin(i * 0.7 + t * 4) * 1.5 + wave * 0, 5.6, 6)
    }
  }
  ctx.fillStyle = '#facc15'
  ctx.font = 'bold 10px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ARRIVÉE', x, y - 104)
}

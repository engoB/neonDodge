/** Original 32×40 pixel characters. Every pose is painted once into an atlas. */
export type CharacterPose =
  | 'idle' | 'ready' | 'windup' | 'pitch' | 'batReady' | 'swingA'
  | 'swingB' | 'runA' | 'runB' | 'slide' | 'catch' | 'cheer'

export type Uniform = 'home' | 'away' | 'runner'

const POSES: CharacterPose[] = [
  'idle', 'ready', 'windup', 'pitch', 'batReady', 'swingA',
  'swingB', 'runA', 'runB', 'slide', 'catch', 'cheer',
]
const TEAMS: Uniform[] = ['home', 'away', 'runner']
const W = 32, H = 40

const COLORS: Record<Uniform, { shirt: string; light: string; dark: string; cap: string; trim: string }> = {
  home: { shirt: '#16c5c9', light: '#78f7e4', dark: '#087c90', cap: '#0a617e', trim: '#ffe179' },
  away: { shirt: '#ee5069', light: '#ff9b83', dark: '#a42b51', cap: '#8f2a57', trim: '#fff0ae' },
  runner: { shirt: '#ffba49', light: '#ffe392', dark: '#bd723a', cap: '#5a5078', trim: '#fff4c9' },
}

type Point = [number, number]

function paint(ctx: CanvasRenderingContext2D, team: Uniform, pose: CharacterPose) {
  const color = COLORS[team]
  const ink = '#263047', skin = '#f6b67c', shade = '#c97768'
  const block = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill; ctx.fillRect(x, y, w, h)
  }
  const segment = (from: Point, to: Point, fill: string, width: number) => {
    ctx.strokeStyle = ink; ctx.lineWidth = width + 2; ctx.lineCap = 'square'
    ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...to); ctx.stroke()
    ctx.strokeStyle = fill; ctx.lineWidth = width
    ctx.beginPath(); ctx.moveTo(...from); ctx.lineTo(...to); ctx.stroke()
  }

  if (pose === 'slide') {
    block(1, 30, 30, 5, ink)
    block(2, 28, 21, 6, color.shirt)
    block(4, 29, 9, 2, color.light)
    block(22, 26, 7, 7, skin)
    block(21, 24, 9, 3, color.cap)
    block(28, 30, 3, 2, ink)
    block(1, 35, 12, 3, '#f7e8bd')
    block(15, 35, 8, 3, '#f7e8bd')
    return
  }

  const running = pose === 'runA' || pose === 'runB'
  const leaning = running || pose === 'pitch'
  const bodyShift = leaning ? 1 : 0
  const legs: [Point, Point] = pose === 'runA'
    ? [[8, 37], [25, 32]]
    : pose === 'runB'
      ? [[22, 37], [6, 32]]
      : pose === 'windup'
        ? [[11, 37], [24, 27]]
        : pose === 'pitch'
          ? [[5, 33], [25, 37]]
          : [[11, 37], [21, 37]]

  segment([13, 28], [12, 32], '#f3e5c6', 5)
  segment([12, 32], legs[0], '#f3e5c6', 5)
  segment([19, 28], [20, 32], '#f3e5c6', 5)
  segment([20, 32], legs[1], '#f3e5c6', 5)
  block(legs[0][0] - 4, legs[0][1] - 1, 8, 3, ink)
  block(legs[1][0] - 3, legs[1][1] - 1, 8, 3, ink)
  block(legs[0][0] - 3, legs[0][1] - 1, 4, 1, color.trim)

  let backHand: Point = [7, 27]
  let frontHand: Point = [26, 26]
  if (pose === 'runA') { backHand = [8, 18]; frontHand = [23, 31] }
  if (pose === 'runB') { backHand = [7, 30]; frontHand = [27, 18] }
  if (pose === 'windup') { backHand = [7, 8]; frontHand = [24, 24] }
  if (pose === 'pitch') { backHand = [4, 19]; frontHand = [29, 13] }
  if (pose === 'catch') { backHand = [6, 11]; frontHand = [25, 10] }
  if (pose === 'cheer') { backHand = [5, 7]; frontHand = [27, 7] }
  if (pose === 'batReady' || pose === 'swingA' || pose === 'swingB') {
    backHand = [18, 22]; frontHand = [23, 20]
  }

  segment([11, 20], backHand, color.dark, 4)
  block(backHand[0] - 2, backHand[1] - 2, 5, 5, pose === 'catch' ? '#b67c50' : skin)

  block(9 + bodyShift, 17, 14, 14, ink)
  block(10 + bodyShift, 18, 12, 11, color.shirt)
  block(10 + bodyShift, 18, 5, 3, color.light)
  block(18 + bodyShift, 21, 4, 8, color.dark)
  block(10 + bodyShift, 28, 12, 2, color.trim)
  block(14 + bodyShift, 21, 2, 5, '#f6efc6')
  block(16 + bodyShift, 22, 2, 5, ink)
  segment([21 + bodyShift, 20], frontHand, color.shirt, 4)
  block(frontHand[0] - 2, frontHand[1] - 2, 5, 5, skin)

  // Face, hair, visor and a single readable eye at native resolution.
  block(10 + bodyShift, 8, 13, 11, ink)
  block(11 + bodyShift, 9, 11, 9, skin)
  block(11 + bodyShift, 15, 3, 3, shade)
  block(21 + bodyShift, 14, 3, 2, shade)
  block(19 + bodyShift, 12, 2, 2, ink)
  block(11 + bodyShift, 6, 12, 6, ink)
  block(12 + bodyShift, 7, 11, 4, color.cap)
  block(13 + bodyShift, 7, 7, 1, color.light)
  block(19 + bodyShift, 10, 8, 2, ink)
  block(20 + bodyShift, 10, 7, 1, color.trim)
  block(12 + bodyShift, 18, 3, 2, '#fff4cc')

  if (pose === 'batReady' || pose === 'swingA' || pose === 'swingB') {
    const tip: Point = pose === 'batReady' ? [28, 1] : pose === 'swingA' ? [3, 8] : [29, 25]
    segment(frontHand, tip, '#d39448', 3)
    block(tip[0] - 2, tip[1] - 2, 4, 4, '#f9df82')
  }
  if (pose === 'catch' || pose === 'windup') {
    block(backHand[0] - 3, backHand[1] - 3, 7, 7, ink)
    block(backHand[0] - 2, backHand[1] - 2, 5, 5, '#bb8252')
    block(backHand[0] - 1, backHand[1] - 1, 2, 2, '#e4ac69')
  }
}

export class PixelCharacters {
  private readonly atlas: HTMLCanvasElement

  constructor() {
    this.atlas = document.createElement('canvas')
    this.atlas.width = POSES.length * W
    this.atlas.height = TEAMS.length * H
    const ctx = this.atlas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    TEAMS.forEach((team, row) => POSES.forEach((pose, column) => {
      ctx.save()
      ctx.translate(column * W, row * H)
      paint(ctx, team, pose)
      ctx.restore()
    }))
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number, team: Uniform, pose: CharacterPose, flip = false, scale = 1) {
    ctx.save()
    ctx.translate(Math.round(x), Math.round(y))
    if (flip) ctx.scale(-1, 1)
    ctx.drawImage(
      this.atlas, POSES.indexOf(pose) * W, TEAMS.indexOf(team) * H, W, H,
      -16 * scale, -35 * scale, W * scale, H * scale,
    )
    ctx.restore()
  }
}

// Sons synthétisés (WebAudio) et musique originale générée à la volée.

let ac = null
let master = null
let musicBus = null
let soundOn = true
let musicOn = true

function ctx() {
  if (!ac) {
    const C = window.AudioContext || window.webkitAudioContext
    if (!C) return null
    ac = new C()
    master = ac.createGain()
    master.gain.value = 0.32
    master.connect(ac.destination)
    musicBus = ac.createGain()
    musicBus.gain.value = musicOn ? 0.14 : 0
    musicBus.connect(ac.destination)
  }
  if (ac.state === 'suspended') ac.resume()
  return ac
}

export function unlockAudio() {
  ctx()
}

export function setSound(v) {
  soundOn = v
}

export function setMusic(v) {
  musicOn = v
  if (musicBus) musicBus.gain.value = v ? 0.14 : 0
}

function tone({ f = 440, f2 = null, d = 0.12, type = 'square', v = 0.25, delay = 0, bus = null }) {
  const a = ctx()
  if (!a || (!soundOn && !bus)) return
  const t = a.currentTime + delay
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(f, t)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d)
  g.gain.setValueAtTime(v, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + d)
  o.connect(g).connect(bus || master)
  o.start(t)
  o.stop(t + d + 0.02)
}

let noiseBuf = null
function noise({ d = 0.15, v = 0.3, f = 1500, delay = 0, q = 1 }) {
  const a = ctx()
  if (!a || !soundOn) return
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.5, a.sampleRate)
    const ch = noiseBuf.getChannelData(0)
    for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1
  }
  const t = a.currentTime + delay
  const s = a.createBufferSource()
  s.buffer = noiseBuf
  const flt = a.createBiquadFilter()
  flt.type = 'bandpass'
  flt.frequency.value = f
  flt.Q.value = q
  const g = a.createGain()
  g.gain.setValueAtTime(v, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + d)
  s.connect(flt).connect(g).connect(master)
  s.start(t)
  s.stop(t + d + 0.02)
}

export const sfx = {
  jump: () => tone({ f: 280, f2: 620, d: 0.11, v: 0.12 }),
  hop: () => tone({ f: 360, f2: 540, d: 0.07, v: 0.08 }),
  coin: () => { tone({ f: 988, d: 0.06, v: 0.1 }); tone({ f: 1319, d: 0.12, v: 0.1, delay: 0.05 }) },
  gold: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone({ f, d: 0.14, v: 0.12, type: 'triangle', delay: i * 0.06 })),
  heart: () => [440, 554, 659, 880].forEach((f, i) => tone({ f, d: 0.12, v: 0.12, type: 'triangle', delay: i * 0.05 })),
  windup: () => tone({ f: 200, f2: 320, d: 0.12, type: 'triangle', v: 0.06 }),
  throw: () => noise({ d: 0.12, v: 0.18, f: 2200, q: 0.7 }),
  catch: () => { noise({ d: 0.06, v: 0.3, f: 600 }); tone({ f: 660, d: 0.08, v: 0.12 }) },
  perfect: () => { noise({ d: 0.06, v: 0.3, f: 600 }); [784, 1175, 1568].forEach((f, i) => tone({ f, d: 0.1, v: 0.12, delay: i * 0.04 })) },
  hitEnemy: () => { noise({ d: 0.12, v: 0.3, f: 900 }); tone({ f: 420, f2: 260, d: 0.15, type: 'square', v: 0.1 }) },
  ko: () => { noise({ d: 0.2, v: 0.35, f: 900 }); tone({ f: 600, f2: 120, d: 0.35, type: 'sawtooth', v: 0.1 }) },
  stomp: () => { tone({ f: 200, f2: 900, d: 0.12, v: 0.12 }); noise({ d: 0.08, v: 0.25, f: 700 }) },
  hurt: () => { tone({ f: 220, f2: 70, d: 0.3, type: 'sawtooth', v: 0.16 }); noise({ d: 0.15, v: 0.3, f: 300 }) },
  fall: () => tone({ f: 700, f2: 90, d: 0.6, type: 'triangle', v: 0.14 }),
  charged: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone({ f, d: 0.16, v: 0.1, type: 'sawtooth', delay: i * 0.035 })),
  superShot: () => { noise({ d: 0.4, v: 0.3, f: 3000, q: 0.5 }); tone({ f: 150, f2: 1200, d: 0.35, type: 'sawtooth', v: 0.12 }) },
  go: () => { tone({ f: 523, d: 0.1, v: 0.12 }); tone({ f: 1047, d: 0.25, v: 0.12, delay: 0.1 }) },
  tick: () => tone({ f: 523, d: 0.08, v: 0.1 }),
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone({ f, d: 0.18, v: 0.12, type: 'square', delay: i * 0.1 })),
  lose: () => [392, 330, 262, 196].forEach((f, i) => tone({ f, d: 0.25, v: 0.12, type: 'triangle', delay: i * 0.18 })),
  click: () => tone({ f: 880, d: 0.04, v: 0.06 }),
}

// --- Musique : séquenceur 16 pas, progression et motif propres à chaque monde ----

const SCALES = [
  { root: 57, prog: [0, 5, 3, 4], tempo: 132 },
  { root: 55, prog: [0, 3, 5, 4], tempo: 140 },
  { root: 60, prog: [0, 4, 5, 3], tempo: 124 },
  { root: 52, prog: [0, 5, 6, 4], tempo: 148 },
]
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16]
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12)

let seqTimer = null
let step = 0
let nextTime = 0
let current = 0
let motif = []

export function startMusic(world = 0) {
  const a = ctx()
  if (!a) return
  stopMusic()
  current = world % SCALES.length
  step = 0
  nextTime = a.currentTime + 0.05
  let s = 7 + world * 13
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  motif = Array.from({ length: 16 }, (_, i) => (i % 4 === 3 && rnd() < 0.5 ? -1 : Math.floor(rnd() * 5)))
  seqTimer = setInterval(schedule, 40)
}

export function stopMusic() {
  if (seqTimer) clearInterval(seqTimer)
  seqTimer = null
}

function schedule() {
  const a = ac
  if (!a) return
  const sc = SCALES[current]
  const dur = 60 / sc.tempo / 4
  while (nextTime < a.currentTime + 0.15) {
    const bar = Math.floor(step / 16) % 4
    const chord = sc.prog[bar]
    const i = step % 16
    const delay = nextTime - a.currentTime
    if (i % 2 === 0) {
      const n = sc.root - 12 + MAJOR[chord] + (i % 8 === 4 ? 12 : 0)
      tone({ f: midi(n), d: dur * 1.6, type: 'triangle', v: 0.5, delay, bus: musicBus })
    }
    const m = motif[i]
    if (m >= 0 && (i % 2 === 0 || step % 32 >= 16)) {
      const n = sc.root + 12 + MAJOR[(chord + m) % MAJOR.length]
      tone({ f: midi(n), d: dur * 0.9, type: 'square', v: 0.16, delay, bus: musicBus })
    }
    if (i % 4 === 2) tone({ f: 6000, d: 0.03, type: 'square', v: 0.03, delay, bus: musicBus })
    nextTime += dur
    step++
  }
}

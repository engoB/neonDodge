export class GameAudio {
  private context: AudioContext | null = null

  unlock() {
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') void this.context.resume()
  }

  private tone(frequency: number, duration: number, type: OscillatorType, volume: number, delay = 0, endFrequency = frequency) {
    const context = this.context
    if (!context) return
    const start = context.currentTime + delay
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), start + duration)
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume, start + .01)
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + duration + .02)
  }

  pitch() {
    this.tone(520, .12, 'sine', .025, 0, 260)
  }

  swing() {
    this.tone(180, .08, 'sawtooth', .018, 0, 70)
  }

  hit(perfect: boolean) {
    this.tone(perfect ? 145 : 120, .09, 'square', .06, 0, 85)
    this.tone(perfect ? 880 : 620, .22, 'triangle', .035, .025, perfect ? 1320 : 760)
    if (perfect) this.tone(1760, .16, 'sine', .018, .08, 1100)
  }

  call(success: boolean) {
    if (success) {
      this.tone(440, .12, 'square', .025)
      this.tone(660, .18, 'square', .02, .1)
    } else {
      this.tone(190, .25, 'sawtooth', .022, 0, 95)
    }
  }

  inning() {
    this.tone(330, .12, 'triangle', .025)
    this.tone(440, .12, 'triangle', .025, .11)
    this.tone(660, .22, 'triangle', .025, .22)
  }

  close() {
    void this.context?.close()
    this.context = null
  }
}

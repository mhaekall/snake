export class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmLoop: ReturnType<typeof setTimeout> | null = null;
  private bgmGain: GainNode | null = null;
  private tempo = 120;
  private isIntense = false;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  private osc(type: OscillatorType, freq: number, dur: number, vol: number, rampFreq?: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (rampFreq) o.frequency.exponentialRampToValueAtTime(rampFreq, this.ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    o.stop(this.ctx.currentTime + dur);
  }

  playEat() {
    this.osc("square", 440, 0.1, 0.08, 880);
  }

  playSkillActivate() {
    this.osc("sawtooth", 220, 0.5, 0.15, 55);
  }

  playSkillReady() {
    this.osc("sine", 880, 0.2, 0.08, 1760);
  }

  playGameOver() {
    this.osc("triangle", 440, 1, 0.15);
    if (this.ctx) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(440, this.ctx.currentTime);
      o.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 1);
      g.gain.setValueAtTime(0.15, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + 1);
    }
  }

  playDodge() {
    this.osc("sine", 1200, 0.1, 0.08, 400);
  }

  playCombo() {
    this.osc("sine", 660, 0.15, 0.06, 1320);
  }

  initBGM() {
    if (!this.ctx || this.bgmLoop) return;
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.bgmGain.connect(this.ctx.destination);
    this.startBGM();
  }

  private startBGM() {
    const tick = () => {
      if (!this.ctx || !this.bgmGain) return;
      const now = this.ctx.currentTime;
      const beat = 60.0 / this.tempo;

      // Kick
      const ko = this.ctx.createOscillator();
      const kg = this.ctx.createGain();
      ko.frequency.setValueAtTime(150, now);
      ko.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      kg.gain.setValueAtTime(0.2, now);
      kg.gain.linearRampToValueAtTime(0, now + 0.1);
      ko.connect(kg);
      kg.connect(this.bgmGain);
      ko.start(now);
      ko.stop(now + 0.1);

      // Bass
      const bo = this.ctx.createOscillator();
      const bg = this.ctx.createGain();
      bo.type = "sawtooth";
      bo.frequency.setValueAtTime(this.isIntense ? 110 : 55, now);
      bg.gain.setValueAtTime(0.04, now);
      bg.gain.linearRampToValueAtTime(0, now + 0.15);
      bo.connect(bg);
      bg.connect(this.bgmGain);
      bo.start(now);
      bo.stop(now + 0.15);

      if (this.isIntense) {
        const noise = this.ctx.createBufferSource();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        noise.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = "highpass";
        f.frequency.value = 5000;
        const hg = this.ctx.createGain();
        hg.gain.setValueAtTime(0.02, now + beat / 2);
        hg.gain.linearRampToValueAtTime(0, now + beat / 2 + 0.05);
        noise.connect(f);
        f.connect(hg);
        hg.connect(this.bgmGain);
        noise.start(now + beat / 2);
      }

      this.bgmLoop = setTimeout(tick, beat * 500);
    };
    tick();
  }

  setIntensity(v: boolean) {
    this.isIntense = v;
  }

  updateTempo(score: number) {
    this.tempo = 120 + Math.min(60, Math.floor(score / 50) * 5);
  }

  stopBGM() {
    if (this.bgmLoop) {
      clearTimeout(this.bgmLoop);
      this.bgmLoop = null;
    }
  }
}

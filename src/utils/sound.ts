// Synthesized realistic Go sound effects using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Realistic click of a slate or shell stone hitting a wooden board
  playStoneClick() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Wood body resonance thud (low pitch, quickly damped)
      const woodOsc = this.ctx.createOscillator();
      const woodGain = this.ctx.createGain();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(220 + Math.random() * 30, now);
      woodOsc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

      woodGain.gain.setValueAtTime(0.5, now);
      woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      woodOsc.connect(woodGain);
      woodGain.connect(this.ctx.destination);
      woodOsc.start(now);
      woodOsc.stop(now + 0.1);

      // 2. Stone sharp click / crack (bandpass noise)
      const bufferSize = this.ctx.sampleRate * 0.03; // 30ms burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
      filter.Q.setValueAtTime(3.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noiseSource.start(now);
    } catch {
      // AudioContext could be blocked prior to user interaction
    }
  }

  // Captured stones clattering into bowl
  playCapture() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [0, 0.04, 0.08].forEach((delay, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450 + idx * 160 + Math.random() * 60, now + delay);
        osc.frequency.exponentialRampToValueAtTime(150, now + delay + 0.06);

        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.08);
      });
    } catch {
      // Ignore
    }
  }

  // Victory chime
  playSuccess() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.45);
      });
    } catch {
      // Ignore
    }
  }

  // Failure sound
  playFailure() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.28);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.32);
    } catch {
      // Ignore
    }
  }
}

export const soundManager = new SoundManager();

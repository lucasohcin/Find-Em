// Web Audio Synthesizer for retro & cyber gaming sounds

class SoundEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a successful scan/unlock fanfare
  playUnlockFanfare(rarity: string = 'rare') {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = rarity === 'mythic' ? 'triangle' : 'sine';
    gain.connect(this.ctx.destination);
    osc.connect(gain);

    const notes = rarity === 'mythic' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98] // C5 E5 G5 C6 E6 G6
      : [440, 554.37, 659.25, 880]; // A4 C#5 E5 A5

    notes.forEach((freq, idx) => {
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
    });

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + notes.length * 0.12 + 0.3);

    osc.start(now);
    osc.stop(now + notes.length * 0.12 + 0.35);
  }

  // Play proximity radar pulse
  playRadarPing(distanceMeters: number) {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Higher pitch if closer
    const pitch = Math.max(300, Math.min(1200, 1200 - distanceMeters * 8));
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);

    gain.connect(this.ctx.destination);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Play error buzz
  playErrorBuzz() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.setValueAtTime(100, now + 0.1);

    gain.connect(this.ctx.destination);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Play button click / tap
  playClick() {
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);

    gain.connect(this.ctx.destination);
    osc.connect(gain);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const sounds = new SoundEngine();

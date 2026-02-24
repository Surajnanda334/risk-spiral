// Web Audio API procedural sound system

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientNode = null;
    this.ambientGain = null;
    this._initialized = false;
    this._currentFloor = 1;
    this._ambientOscillators = [];
  }

  init() {
    if (this._initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this._initialized = true;
    } catch (e) {
      console.warn('AudioManager: Web Audio not available', e);
    }
  }

  _ensureInit() {
    if (!this._initialized) this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return true;
  }

  _createOscillator(freq, type = 'sine', gainVal = 0.3) {
    if (!this.ctx) return null;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.masterGain);
    return { osc, gain };
  }

  _playTone(freq, duration, type = 'sine', gainVal = 0.3, attack = 0.01, release = 0.1) {
    if (!this._ensureInit()) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + attack);
    gain.gain.setValueAtTime(gainVal, now + duration - release);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playAmbient() {
    if (!this._ensureInit()) return;
    this.stopAmbient();

    const now = this.ctx.currentTime;
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, now);
    this.ambientGain.gain.linearRampToValueAtTime(0.15, now + 2);
    this.ambientGain.connect(this.masterGain);

    // Base drone
    const baseFreq = 60 + (this._currentFloor * 0.5);
    const drone = this.ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(baseFreq, now);

    // Soft filter for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400 + this._currentFloor * 5, now);
    filter.Q.setValueAtTime(1.5, now);

    drone.connect(filter);
    filter.connect(this.ambientGain);
    drone.start(now);

    // Tension harmonics — get louder with floor depth
    const tension = this.ctx.createOscillator();
    tension.type = 'sine';
    tension.frequency.setValueAtTime(baseFreq * 1.5, now);
    const tensionGain = this.ctx.createGain();
    const tensionLevel = Math.min(0.08, 0.01 + this._currentFloor * 0.001);
    tensionGain.gain.setValueAtTime(tensionLevel, now);
    tension.connect(tensionGain);
    tensionGain.connect(this.ambientGain);
    tension.start(now);

    this._ambientOscillators = [drone, tension];
  }

  stopAmbient() {
    if (!this._ensureInit()) return;
    const now = this.ctx.currentTime;
    if (this.ambientGain) {
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    this._ambientOscillators.forEach(osc => {
      try { osc.stop(now + 0.6); } catch (e) {}
    });
    this._ambientOscillators = [];
    this.ambientGain = null;
  }

  setFloor(n) {
    this._currentFloor = n;
    if (this.ambientGain && this.ctx) {
      const now = this.ctx.currentTime;
      // Raise tension with floor
      const tension = Math.min(0.3, 0.1 + n * 0.003);
      this.ambientGain.gain.linearRampToValueAtTime(tension, now + 1);
    }
  }

  playDoorTension() {
    if (!this._ensureInit()) return;
    // Rising arpeggio before door entry
    const notes = [220, 277, 330, 415];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.15, 'triangle', 0.2, 0.01, 0.05), i * 80);
    });
  }

  playRewardChime() {
    if (!this._ensureInit()) return;
    // Pleasant ascending chord
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.4, 'sine', 0.25, 0.01, 0.2), i * 60);
    });
  }

  playFailure() {
    if (!this._ensureInit()) return;
    // Deep bass drop + discordant hit
    this._playTone(80, 1.0, 'sawtooth', 0.4, 0.005, 0.5);
    setTimeout(() => this._playTone(55, 0.8, 'square', 0.3, 0.01, 0.4), 100);
    setTimeout(() => this._playTone(40, 1.5, 'sawtooth', 0.35, 0.01, 0.8), 200);
  }

  playFloorAscend() {
    if (!this._ensureInit()) return;
    // Quick ascending tone sequence
    const notes = [440, 554, 659];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.2, 'sine', 0.3, 0.01, 0.08), i * 100);
    });
  }

  playBankSound() {
    if (!this._ensureInit()) return;
    // Satisfying locked-in chime — major chord with slight reverb feel
    const chords = [523, 659, 784, 1047, 1319];
    chords.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.6, 'sine', 0.3 - i * 0.04, 0.01, 0.3), i * 40);
    });
    // Low sub
    setTimeout(() => this._playTone(130, 0.5, 'triangle', 0.25, 0.01, 0.3), 0);
  }

  playClick() {
    if (!this._ensureInit()) return;
    this._playTone(800, 0.05, 'square', 0.1, 0.001, 0.02);
  }

  playNearMiss() {
    if (!this._ensureInit()) return;
    // Tense near-miss sound
    this._playTone(200, 0.3, 'sawtooth', 0.2, 0.01, 0.15);
    setTimeout(() => this._playTone(300, 0.2, 'triangle', 0.15, 0.01, 0.1), 150);
  }

  playShieldPickup() {
    if (!this._ensureInit()) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this._playTone(freq, 0.35, 'triangle', 0.2, 0.01, 0.15), i * 70);
    });
  }

  playFortune(won) {
    if (!this._ensureInit()) return;
    if (won) {
      // Triumphant fanfare
      const notes = [523, 659, 784, 1047, 1319, 1568];
      notes.forEach((freq, i) => {
        setTimeout(() => this._playTone(freq, 0.3, 'sine', 0.3, 0.01, 0.15), i * 80);
      });
    } else {
      // Wah wah
      this._playTone(400, 0.4, 'sawtooth', 0.3, 0.01, 0.2);
      setTimeout(() => this._playTone(300, 0.4, 'sawtooth', 0.3, 0.01, 0.2), 200);
      setTimeout(() => this._playTone(200, 0.6, 'sawtooth', 0.25, 0.01, 0.4), 400);
    }
  }

  setMasterVolume(vol) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }
}

export default AudioManager;

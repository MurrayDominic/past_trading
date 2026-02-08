// AudioEngine - Web Audio API for dynamic sounds and adaptive music
class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.volume = 0.7;
    this.musicOscillators = [];
    this.currentIntensity = 0;
  }

  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;

      this.musicGain = this.audioContext.createGain();
      this.musicGain.connect(this.masterGain);
      this.musicGain.gain.value = 0.3;

      this.sfxGain = this.audioContext.createGain();
      this.sfxGain.connect(this.masterGain);
      this.sfxGain.gain.value = 0.5;

      return true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
      return false;
    }
  }

  playSmallGain() {
    if (!this.audioContext || this.muted) return;

    // +5% net worth: Quick chirp
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playWinningSound() {
    if (!this.audioContext || this.muted) return;

    // +10% or +$10k: Triumphant arpeggio (C-E-G-C)
    const now = this.audioContext.currentTime;
    const notes = [523, 659, 784, 1047];
    const duration = 0.12;

    notes.forEach((freq, i) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = now + (i * duration);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  playLossSound() {
    if (!this.audioContext || this.muted) return;

    // Significant loss: Descending sweep
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.8);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  playTradeClick() {
    if (!this.audioContext || this.muted) return;

    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'square';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playIllegalAction() {
    if (!this.audioContext || this.muted) return;

    // Dark, ominous tone
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  startMusic() {
    if (!this.audioContext || this.muted) return;

    this.stopMusic();
    const now = this.audioContext.currentTime;

    // Base drone (C2, 130Hz)
    const drone = this.audioContext.createOscillator();
    const droneGain = this.audioContext.createGain();
    drone.type = 'sine';
    drone.frequency.value = 130;
    droneGain.gain.value = 0.15;
    drone.connect(droneGain);
    droneGain.connect(this.musicGain);
    drone.start(now);

    // Harmony (E2, 164Hz)
    const harmony = this.audioContext.createOscillator();
    const harmonyGain = this.audioContext.createGain();
    harmony.type = 'sine';
    harmony.frequency.value = 164;
    harmonyGain.gain.value = 0.12;
    harmony.connect(harmonyGain);
    harmonyGain.connect(this.musicGain);
    harmony.start(now);

    this.musicOscillators.push({ osc: drone, gain: droneGain });
    this.musicOscillators.push({ osc: harmony, gain: harmonyGain });
  }

  updateMusicIntensity(daysRemaining, totalDays) {
    if (!this.audioContext || this.muted) return;

    const targetIntensity = 1 - (daysRemaining / totalDays);
    this.currentIntensity += (targetIntensity - this.currentIntensity) * 0.05;

    // Add tension layer when past 50%
    if (this.currentIntensity > 0.5 && this.musicOscillators.length < 4) {
      const now = this.audioContext.currentTime;

      // Pulse oscillator
      const pulse = this.audioContext.createOscillator();
      const pulseGain = this.audioContext.createGain();

      pulse.type = 'triangle';
      pulse.frequency.value = 523; // C5

      // LFO for pulsing effect
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      lfo.frequency.value = 2;
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(pulseGain.gain);

      pulseGain.gain.value = 0.05;
      pulse.connect(pulseGain);
      pulseGain.connect(this.musicGain);

      pulse.start(now);
      lfo.start(now);

      this.musicOscillators.push({ osc: pulse, gain: pulseGain, lfo });
    }

    // Add dramatic high layer when past 80%
    if (this.currentIntensity > 0.8 && this.musicOscillators.length < 6) {
      const now = this.audioContext.currentTime;

      const high = this.audioContext.createOscillator();
      const highGain = this.audioContext.createGain();

      high.type = 'sine';
      high.frequency.value = 1046; // C6
      highGain.gain.value = 0.08;

      high.connect(highGain);
      highGain.connect(this.musicGain);
      high.start(now);

      this.musicOscillators.push({ osc: high, gain: highGain });
    }
  }

  stopMusic() {
    if (!this.audioContext) return;

    this.musicOscillators.forEach(({ osc, lfo }) => {
      try {
        osc.stop();
        if (lfo) lfo.stop();
      } catch (e) {
        // Oscillator already stopped
      }
    });
    this.musicOscillators = [];
    this.currentIntensity = 0;
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  resume() {
    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

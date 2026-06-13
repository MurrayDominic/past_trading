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

    // HTML5 audio element for background music
    this.musicEl = null;
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

      // HTML5 audio element for background music — simpler and works on all browsers.
      // Must be in the DOM to guarantee loading in all browser/sandbox combinations.
      this.musicEl = document.createElement('audio');
      this.musicEl.loop = true;
      this.musicEl.volume = 0.15;
      this.musicEl.preload = 'auto';
      this.musicEl.src = 'assets/music/background.mp3';
      this.musicEl.style.display = 'none';
      document.body.appendChild(this.musicEl);

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
    if (!this.audioContext || !this.musicEl) return;
    this.resume();
    this.stopMusic();
    this.musicEl.currentTime = 0;
    this.musicEl.muted = this.muted;
    const attempt = this.musicEl.play();
    if (attempt) {
      attempt.catch(() => {
        // Autoplay blocked — retry as soon as the audio is ready to play
        const retry = () => {
          this.musicEl.play().catch(() => {});
          this.musicEl.removeEventListener('canplay', retry);
        };
        this.musicEl.addEventListener('canplay', retry);
      });
    }
  }

  updateMusicIntensity(daysRemaining, totalDays) {
    if (!this.audioContext || this.muted || !this.musicEl) return;

    const targetIntensity = 1 - (daysRemaining / totalDays);
    this.currentIntensity += (targetIntensity - this.currentIntensity) * 0.05;

    // Volume builds up as run progresses: 0.15 -> 0.45
    this.musicEl.volume = 0.15 + this.currentIntensity * 0.3;
  }

  stopMusic() {
    if (this.musicEl) {
      this.musicEl.pause();
      this.musicEl.currentTime = 0;
    }
    this.musicOscillators.forEach(({ osc, lfo }) => {
      try { osc.stop(); if (lfo) lfo.stop(); } catch (e) {}
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
    if (this.musicEl) {
      this.musicEl.muted = this.muted;
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

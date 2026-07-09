// ============================================================================
// PAST TRADING - Destination Draft + Jump Cinematic (v2, Phase 3)
// The Time Machine offers 2-3 windows; the player picks where history takes
// them next. Then the jump itself: a brief committed cinematic while the
// market loads the new era.
// ============================================================================

class DestinationDraft {
  constructor(juice) {
    this.juice = juice;
    this._el = null;
    this._cinematic = null;
  }

  show(offers, onPick) {
    this.dismiss();

    const el = document.createElement('div');
    el.id = 'destination-overlay';
    el.innerHTML = `
      <div class="dest-card">
        <div class="quarter-kicker">TEMPORAL DRIVE CHARGED</div>
        <div class="dest-title">WHERE TO NEXT?</div>
        <div class="dest-sub">The machine found three stable windows. Positions cannot travel; everything liquidates on departure.</div>
        <div class="dest-row">
          ${offers.map((d, i) => `
            <button class="dest-option" data-idx="${i}">
              <div class="dest-year">${d.year}</div>
              <div class="dest-phase">${d.phase.toUpperCase()} IN THE YEAR</div>
              <div class="dest-hint">${d.hint}</div>
            </button>`).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;

    const audio = this.juice._getAudio();
    if (audio && audio.playTone) audio.playTone(330, 0.2, 'sine', 0.22);

    el.querySelectorAll('.dest-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = offers[parseInt(btn.dataset.idx)];
        this.dismiss();
        onPick(dest);
      });
    });
  }

  showCinematic(dest) {
    this.hideCinematic();
    const el = document.createElement('div');
    el.id = 'jump-cinematic';
    el.innerHTML = `
      <div class="jump-flicker"></div>
      <div class="jump-text">
        <div class="jump-label">ENGAGING TEMPORAL DRIVE</div>
        <div class="jump-year">${dest.year}</div>
        <div class="jump-dest">${dest.phase.toUpperCase()} ${dest.year} · HOLD ON</div>
      </div>
    `;
    document.body.appendChild(el);
    this._cinematic = el;

    const audio = this.juice._getAudio();
    if (audio && audio.playTone) {
      audio.playTone(110, 0.9, 'sawtooth', 0.25);
      setTimeout(() => audio.playTone(220, 0.5, 'sawtooth', 0.2), 300);
      setTimeout(() => audio.playTone(440, 0.35, 'triangle', 0.2), 650);
    }
  }

  hideCinematic() {
    if (this._cinematic && this._cinematic.parentNode) {
      const el = this._cinematic;
      el.classList.add('jump-out');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 450);
    }
    this._cinematic = null;
  }

  dismiss() {
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
  }
}

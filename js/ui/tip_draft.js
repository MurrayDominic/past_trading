// ============================================================================
// PAST TRADING - Tip Draft Modal (v2, Phase 2)
// Once a quarter: pick 1 of 3 informants. Hidden accuracy, visible track
// record, visible SEC heat. The run's build system.
// ============================================================================

class TipDraft {
  constructor(juice) {
    this.juice = juice;
    this._el = null;
  }

  show(offer, tips, onPick, onSkip) {
    this.dismiss();

    const el = document.createElement('div');
    el.id = 'tip-draft-overlay';
    el.innerHTML = `
      <div class="tip-draft-card">
        <div class="quarter-kicker">YOUR NETWORK</div>
        <div class="tip-draft-title">SOMEONE HAS A TIP</div>
        <div class="tip-draft-sub">Pick one source. Their accuracy is hidden. Their track record is not.</div>
        <div class="tip-draft-row">
          ${offer.map(s => `
            <button class="tip-source" data-source="${s.id}">
              <div class="tip-source-icon">${s.def.icon}</div>
              <div class="tip-source-name">${s.def.name}</div>
              <div class="tip-source-desc">${s.def.desc}</div>
              <div class="tip-source-record">${tips.getRecordLabel(s.id)}</div>
              ${s.def.secHeat
                ? `<div class="tip-source-heat">+${s.def.secHeat} SEC heat</div>`
                : '<div class="tip-source-heat clean">No heat</div>'}
            </button>`).join('')}
        </div>
        <button class="btn btn-muted" id="tip-draft-skip">No informants this quarter</button>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;

    const audio = this.juice._getAudio();
    if (audio && audio.playTone) audio.playTone(392, 0.14, 'triangle', 0.2);

    el.querySelectorAll('.tip-source').forEach(btn => {
      btn.addEventListener('click', () => {
        this.dismiss();
        onPick(btn.dataset.source);
      });
    });
    el.querySelector('#tip-draft-skip').addEventListener('click', () => {
      this.dismiss();
      onSkip();
    });
  }

  dismiss() {
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
  }
}

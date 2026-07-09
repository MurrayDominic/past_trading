// ============================================================================
// PAST TRADING - Quarter Evaluation Screen (v2 Feel Overhaul, Phase 1)
// The "boss blind" moment: hitting a quarterly target auto-pauses the game
// and takes over the screen. DESIGN.md section 3, moment 2 (tier 4).
// ============================================================================

class QuarterScreen {
  constructor(juice) {
    this.juice = juice;
    this._el = null;
    this._timers = [];
  }

  // data: { level, netWorth, target, nextTarget, allComplete, boss: {title, message}, onContinue }
  show(data) {
    this.dismiss();

    const pct = Math.max(0, (data.netWorth / data.target) * 100);
    const fillPct = Math.min(100, pct);

    const el = document.createElement('div');
    el.id = 'quarter-overlay';
    el.innerHTML = `
      <div class="quarter-card">
        <div class="quarter-kicker">QUARTERLY REVIEW</div>
        <div class="quarter-title">${data.allComplete ? 'ALL 8 TARGETS COMPLETE' : `QUARTER ${data.level} COMPLETE`}</div>
        <div class="quarter-networth-label">NET WORTH</div>
        <div class="quarter-networth">${Juice.formatMoney(data.netWorth)}</div>
        <div class="quarter-bar"><div class="quarter-bar-fill"></div>
          <div class="quarter-bar-target">TARGET ${Juice.formatMoney(data.target)}</div>
        </div>
        <div class="quarter-stamp hidden">TARGET MET · ${Math.round(pct)}%</div>
        ${data.mandate ? `<div class="quarter-mandate ${data.mandate.satisfied ? 'passed' : 'failed'}">BOARD MANDATE · ${data.mandate.name} · ${data.mandate.satisfied ? `PASSED, BONUS ${Juice.formatMoney(data.mandate.bonus)}` : 'FAILED, NO BONUS'}</div>` : ''}
        ${data.liquidated ? `<div class="quarter-mandate passed">TEMPORAL TRANSIT · ${data.liquidated} POSITION${data.liquidated === 1 ? '' : 'S'} SETTLED INTO CASH</div>` : ''}
        ${data.boss ? `<div class="quarter-boss"><div class="quarter-boss-title">${data.boss.title}</div><div class="quarter-boss-msg">${data.boss.message}</div></div>` : ''}
        ${data.nextTarget ? `<div class="quarter-next">NEXT TARGET <span>${Juice.formatMoney(data.nextTarget)}</span> · 91 DAYS</div>` : `<div class="quarter-next quarter-next-final">RIDE OUT THE CLOCK. THE BILLION IS YOURS.</div>`}
        <button class="btn btn-primary btn-large" id="quarter-continue-btn">BACK TO THE DESK</button>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;

    const audio = this.juice._getAudio();
    if (audio && audio.playPitchLadder) audio.playPitchLadder(4, 392, 110);

    // The bar races toward the target with rising tones, then the stamp slams in
    const fill = el.querySelector('.quarter-bar-fill');
    const stamp = el.querySelector('.quarter-stamp');
    this._timers.push(setTimeout(() => {
      fill.style.width = fillPct + '%';
      [0.25, 0.5, 0.75].forEach((step, i) => {
        this._timers.push(setTimeout(() => {
          if (audio && audio.playTone) audio.playTone(440 * (1 + i * 0.25), 0.09, 'triangle', 0.16);
        }, 250 + step * 900));
      });
      this._timers.push(setTimeout(() => {
        stamp.classList.remove('hidden');
        this.juice.shake(4);
        if (audio && audio.playTone) {
          audio.playTone(784, 0.18, 'triangle', 0.28);
          audio.playTone(98, 0.6, 'sine', 0.5);   // the bass drop
        }
      }, 250 + 950));
    }, 350));

    el.querySelector('#quarter-continue-btn').addEventListener('click', () => {
      this.dismiss();
      if (typeof data.onContinue === 'function') data.onContinue();
    });
  }

  dismiss() {
    this._timers.forEach(t => clearTimeout(t));
    this._timers = [];
    if (this._el && this._el.parentNode) this._el.parentNode.removeChild(this._el);
    this._el = null;
  }
}

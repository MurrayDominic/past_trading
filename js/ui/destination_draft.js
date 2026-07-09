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

  show(offers, onPick, perkCtx = null) {
    this.dismiss();
    this._offers = [...offers];
    this._onPick = onPick;
    this._bought = new Set();

    const el = document.createElement('div');
    el.id = 'destination-overlay';
    el.innerHTML = `
      <div class="dest-card">
        <div class="quarter-kicker">TEMPORAL DRIVE CHARGED</div>
        <div class="dest-title">WHERE TO NEXT?</div>
        <div class="dest-sub">Your portfolio was liquidated for transit. Spend cash on supplies below, then pick a window.</div>
        ${perkCtx ? '<div class="perk-row" id="jump-perk-row"></div>' : ''}
        <div class="dest-row" id="dest-row"></div>
      </div>
    `;
    document.body.appendChild(el);
    this._el = el;

    const audio = this.juice._getAudio();
    if (audio && audio.playTone) audio.playTone(330, 0.2, 'sine', 0.22);

    this._renderOffers();
    if (perkCtx) this._renderPerks(perkCtx);
  }

  _renderOffers() {
    const row = this._el.querySelector('#dest-row');
    const badge = (m) => m === 'crypto' ? '₿ CRYPTO · ' : m === 'commodities' ? '🛢️ COMMODITIES · ' : m === 'forex' ? '💱 FOREX · ' : '';
    row.innerHTML = this._offers.map((d, i) => `
      <button class="dest-option ${d.market && d.market !== 'stocks' ? 'dest-' + d.market : ''}" data-idx="${i}">
        <div class="dest-year">${d.year}</div>
        <div class="dest-phase">${badge(d.market)}${d.phase.toUpperCase()} IN THE YEAR</div>
        <div class="dest-hint">${d.hint}</div>
      </button>`).join('');
    row.querySelectorAll('.dest-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = this._offers[parseInt(btn.dataset.idx)];
        this.dismiss();
        this._onPick(dest);
      });
    });
  }

  _renderPerks(perkCtx) {
    const row = this._el.querySelector('#jump-perk-row');
    if (!row) return;
    const perks = perkCtx.getPerks();
    row.innerHTML = perks.map(p => {
      const bought = this._bought.has(p.def.id);
      const disabled = bought || !p.affordable;
      return `
        <button class="jump-perk ${disabled ? 'perk-disabled' : ''}" data-perk="${p.def.id}" ${disabled ? 'disabled' : ''}
                data-tip="${p.def.desc}">
          <span class="perk-icon">${p.def.icon}</span>
          <span class="perk-name">${p.def.name}</span>
          <span class="perk-cost">${bought ? 'BOUGHT' : Juice.formatMoney(p.cost)}</span>
        </button>`;
    }).join('');
    row.querySelectorAll('.jump-perk:not(.perk-disabled)').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = perkCtx.buy(btn.dataset.perk);
        if (result && result.success) {
          this._bought.add(btn.dataset.perk);
          const audio = this.juice._getAudio();
          if (audio && audio.playTone) audio.playTone(660, 0.12, 'triangle', 0.2);
          if (result.extraOffer) {
            this._offers.push(result.extraOffer);
            this._renderOffers();
          }
        }
        this._renderPerks(perkCtx);
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

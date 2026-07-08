// ============================================================================
// PAST TRADING - Juice Engine (v2 Feel Overhaul, Phase 1)
// Rolling counters, tiered P&L popups, screen shake. See DESIGN.md section 7.
// Every effect here is EVENT-GATED. Nothing in this file may run per tick.
// ============================================================================

// A money display that rolls toward its target instead of snapping.
// set() retargets mid-flight, so any event rate collapses into one animation.
class RollingCounter {
  constructor(el, formatFn) {
    this.el = el;
    this.format = formatFn || Juice.formatMoney;
    this.displayed = null;   // value currently painted
    this.target = null;
    this._raf = null;
    this._animStart = 0;
    this._animFrom = 0;
    this.duration = 600; // ms, DESIGN.md motion table
  }

  set(value) {
    if (!this.el || !isFinite(value)) return;
    // First paint: snap, don't roll up from nothing
    if (this.displayed === null) {
      this.displayed = value;
      this.target = value;
      this._paint(value);
      return;
    }
    if (value === this.target) return;
    this.target = value;
    this._animFrom = this.displayed;
    this._animStart = performance.now();
    if (!this._raf) this._raf = requestAnimationFrame((t) => this._step(t));
  }

  snap(value) {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    this.displayed = value;
    this.target = value;
    this._paint(value);
  }

  _step(t) {
    const p = Math.min(1, (t - this._animStart) / this.duration);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    this.displayed = this._animFrom + (this.target - this._animFrom) * eased;
    this._paint(this.displayed);
    if (p < 1) {
      this._raf = requestAnimationFrame((tt) => this._step(tt));
    } else {
      this._raf = null;
      this.displayed = this.target;
      this._paint(this.target);
    }
  }

  _paint(value) {
    this.el.textContent = this.format(value);
    // Exact figure always available on hover (DESIGN.md precision tiers)
    this.el.title = '$' + Math.round(this.target !== null ? this.target : value).toLocaleString();
  }
}

class Juice {
  constructor(getAudio) {
    // getAudio is a function so we don't depend on construction order
    this._getAudio = typeof getAudio === 'function' ? getAudio : () => getAudio;
    this.shakeEl = null;
    this.popupLayer = null;
    this._shakeTimeout = null;
    // Popup aggregation: events landing within AGG_MS merge into one popup
    this._agg = null; // { sum, count, el, lockTimer }
  }

  static AGG_MS = 400;

  // DESIGN.md precision tiers for ambient money displays:
  // whole dollars with separators below $1M, 3 significant figures above.
  static formatMoney(value) {
    const sign = value < 0 ? '-' : '';
    const abs = Math.abs(value);
    if (abs >= 1e9) return sign + '$' + (abs / 1e9).toPrecision(3) + 'B';
    if (abs >= 1e6) return sign + '$' + (abs / 1e6).toPrecision(3) + 'M';
    return sign + '$' + Math.round(abs).toLocaleString();
  }

  attachShakeTarget(el) { this.shakeEl = el; }
  attachPopupLayer(el) { this.popupLayer = el; }

  counter(el, formatFn) { return new RollingCounter(el, formatFn); }

  // Celebration tier from DESIGN.md section 7: log-relative to net worth.
  // 1 = small (<2% of net worth), 2 = medium (2-10%), 3 = big (>10%).
  tierFor(amount, netWorth) {
    const base = Math.max(1, Math.abs(netWorth) || 1);
    const ratio = Math.abs(amount) / base;
    if (ratio >= 0.10) return 3;
    if (ratio >= 0.02) return 2;
    return 1;
  }

  // Floating P&L popup with 400ms aggregation. Event-gated: callers fire this
  // on realized P&L and large one-tick swings only, never on ambient drift.
  moneyPopup(amount, netWorth) {
    const layer = this.popupLayer || this.shakeEl;
    if (!layer || !amount) return;

    // Merge into an open aggregation window
    if (this._agg && this._agg.el && this._agg.el.parentNode) {
      this._agg.sum += amount;
      this._agg.count += 1;
      this._renderPopup(this._agg, netWorth);
      return;
    }

    const el = document.createElement('div');
    const randomOffset = Math.random() * 60 - 30;
    el.style.left = `calc(50% + ${randomOffset}px)`;
    layer.appendChild(el);

    this._agg = { sum: amount, count: 1, el };
    this._renderPopup(this._agg, netWorth);

    // Close the aggregation window, then let the animation finish and clean up
    this._agg.lockTimer = setTimeout(() => {
      const agg = this._agg;
      this._agg = null;
      if (agg && agg.el) {
        setTimeout(() => { if (agg.el.parentNode) agg.el.parentNode.removeChild(agg.el); }, 1800);
      }
    }, Juice.AGG_MS);
  }

  _renderPopup(agg, netWorth) {
    const tier = this.tierFor(agg.sum, netWorth);
    const dir = agg.sum > 0 ? 'up' : 'down';
    const sign = agg.sum > 0 ? '+' : '';
    agg.el.className = `juice-pop juice-pop-${dir} juice-pop-t${tier}`;
    agg.el.textContent = agg.count > 1
      ? `${sign}${Juice.formatMoney(agg.sum)} ×${agg.count}`
      : `${sign}${Juice.formatMoney(agg.sum)}`;

    if (tier >= 3) {
      this.shake(3);
      const audio = this._getAudio();
      if (audio && typeof audio.playPitchLadder === 'function' && agg.sum > 0) {
        audio.playPitchLadder(5);
      }
    }
  }

  // Screen shake as a data channel. Reserved for tier 3+ (DESIGN.md).
  shake(tier) {
    if (!this.shakeEl || tier < 3) return;
    const cls = tier >= 4 ? 'juice-shake-4' : 'juice-shake-3';
    this.shakeEl.classList.remove('juice-shake-3', 'juice-shake-4');
    // Force restart of the animation
    void this.shakeEl.offsetWidth;
    this.shakeEl.classList.add(cls);
    if (this._shakeTimeout) clearTimeout(this._shakeTimeout);
    this._shakeTimeout = setTimeout(() => {
      this.shakeEl.classList.remove('juice-shake-3', 'juice-shake-4');
    }, tier >= 4 ? 550 : 350);
  }
}

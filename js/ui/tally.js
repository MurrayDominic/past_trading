// ============================================================================
// PAST TRADING - Trade Tally (v2 Feel Overhaul, Phase 1)
// The "scoring a hand" moment: closing a position plays out as a staged
// line-by-line receipt with rising pitch, ending in a rolling P&L number.
// See DESIGN.md sections 3 and 7. Event-gated: fires once per closed position.
// ============================================================================

class TradeTally {
  constructor(juice) {
    this.juice = juice;       // Juice instance: audio getter, shake, tiers
    this.layer = null;
    this._current = null;     // { el, timers: [] }
  }

  attach(layer) { this.layer = layer; }

  static STEP_MS = 220;       // DESIGN.md: one tally line per 220ms
  static RATIOS = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2]; // rising pentatonic steps

  // Trade-ticket precision: cents below $1,000, tiered above (DESIGN.md)
  static formatPnL(value) {
    const sign = value < 0 ? '-' : '+';
    const abs = Math.abs(value);
    if (abs < 1000) return sign + '$' + abs.toFixed(2);
    return sign + Juice.formatMoney(abs).replace('$', '$');
  }

  // trade: enriched SELL record from trading.js (entryPrice, exitPrice,
  // leverage, type, quantity, fee, profit). netWorth sets the celebration tier.
  show(trade, netWorth) {
    if (!this.layer || !trade || trade.action !== 'SELL') return;
    this._dismiss();

    const basis = trade.entryPrice * trade.quantity;
    const proceeds = trade.exitPrice * trade.quantity;
    const gross = trade.type === 'long' ? (proceeds - basis) : (basis - proceeds);
    // Unlock bonuses (CNBC Regular etc.) make profit differ from gross - fee
    const bonus = trade.profit - (gross - trade.fee);

    const rows = [
      { label: `ENTRY · ${trade.quantity < 1 ? trade.quantity.toFixed(4) : Math.round(trade.quantity).toLocaleString()} @ ${formatPrice(trade.entryPrice)}`, value: Juice.formatMoney(basis) },
      { label: `EXIT · @ ${formatPrice(trade.exitPrice)}`, value: Juice.formatMoney(proceeds) },
    ];
    if (trade.leverage > 1) rows.push({ label: 'LEVERAGE', value: `×${trade.leverage}` });
    rows.push({ label: 'FEES', value: '-' + Juice.formatMoney(trade.fee).replace('$', '$') });
    if (Math.abs(bonus) >= 0.01) rows.push({ label: 'TRADER BONUS', value: TradeTally.formatPnL(bonus) });

    const tier = this.juice.tierFor(trade.profit, netWorth);
    const dir = trade.profit >= 0 ? 'up' : 'down';

    const el = document.createElement('div');
    el.className = 'trade-tally';
    el.innerHTML = `
      <div class="tally-head">${trade.type === 'short' ? 'COVERED' : 'SOLD'} ${trade.ticker}${trade.leverage > 1 ? ` <span class="tally-lev">${trade.leverage}x</span>` : ''}</div>
      ${rows.map(r => `<div class="tally-row"><span>${r.label}</span><span class="tally-val">${r.value}</span></div>`).join('')}
      <div class="tally-total tally-${dir} tally-t${tier}"><span>P&amp;L</span><span class="tally-pnl">+$0.00</span></div>
    `;
    this.layer.appendChild(el);

    const current = { el, timers: [] };
    this._current = current;
    const audio = this.juice._getAudio();
    const rowEls = el.querySelectorAll('.tally-row');
    const totalEl = el.querySelector('.tally-total');
    const pnlEl = el.querySelector('.tally-pnl');

    // Stage the lines with rising pitch
    rowEls.forEach((rowEl, i) => {
      current.timers.push(setTimeout(() => {
        rowEl.classList.add('shown');
        if (audio && audio.playTone) audio.playTone(523 * TradeTally.RATIOS[Math.min(i, TradeTally.RATIOS.length - 1)], 0.1, 'triangle', 0.18);
      }, i * TradeTally.STEP_MS));
    });

    // The total lands last: rolling number, top tone, tier-3 fire + shake
    const totalDelay = rowEls.length * TradeTally.STEP_MS;
    current.timers.push(setTimeout(() => {
      totalEl.classList.add('shown');
      const counter = new RollingCounter(pnlEl, TradeTally.formatPnL);
      counter.snap(0);
      counter.set(trade.profit);
      if (audio && audio.playTone) audio.playTone(523 * 2, 0.16, 'triangle', 0.24);
      if (tier >= 3) {
        totalEl.classList.add('tally-fire');
        this.juice.shake(3);
        if (trade.profit > 0 && audio && audio.playPitchLadder) audio.playPitchLadder(5, 659);
      }
    }, totalDelay));

    // Fade and clean up
    current.timers.push(setTimeout(() => el.classList.add('tally-out'), totalDelay + 2200));
    current.timers.push(setTimeout(() => this._dismiss(current), totalDelay + 2800));
  }

  _dismiss(only) {
    const cur = this._current;
    if (!cur || (only && only !== cur)) return;
    cur.timers.forEach(t => clearTimeout(t));
    if (cur.el && cur.el.parentNode) cur.el.parentNode.removeChild(cur.el);
    this._current = null;
  }
}

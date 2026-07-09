// ============================================================================
// PAST TRADING - Tip System (v2, Phase 2)
// The in-run build system: draft an informant each quarter, receive a tip
// generated from REAL future data (an inaccurate source flips the direction
// of a real move; nothing is invented), then learn who to trust by watching
// their track record.
// ============================================================================

class TipSystem {
  constructor() {
    this.reset();
  }

  reset() {
    this.sources = [];        // per-run: { id, def, accuracy(hidden), correct, total }
    this.activeTips = [];     // { sourceId, ticker, direction, issuedDay, expiresDay, startPrice, resolved, correct }
    this.lastDraftQuarter = -1;
  }

  init() {
    this.reset();
    this.sources = TIP_SOURCES.map(def => ({
      id: def.id,
      def,
      accuracy: def.accuracyRange[0] + Math.random() * (def.accuracyRange[1] - def.accuracyRange[0]),
      correct: 0,
      total: 0,
    }));
  }

  // Offer 3 distinct sources for the draft
  offerDraft() {
    const pool = [...this.sources];
    const offer = [];
    while (offer.length < 3 && pool.length) {
      offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return offer;
  }

  // Player picked a source: generate a tip against real future data.
  // Accepting a hot source costs SEC heat immediately.
  acceptSource(sourceId, market, sec, currentDay) {
    const src = this.sources.find(s => s.id === sourceId);
    if (!src) return null;

    const assets = market.getAllAssets().filter(a => a.hasHistoricalData && a.price > 0);
    for (let attempt = 0; attempt < 12 && assets.length; attempt++) {
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const horizon = 5 + Math.floor(Math.random() * 11); // 5-15 days
      const future = market.peekFutureClose(asset.ticker, horizon);
      if (future === null) continue;

      const trueDir = future >= asset.price ? 'up' : 'down';
      const truthful = Math.random() < src.accuracy;
      const direction = truthful ? trueDir : (trueDir === 'up' ? 'down' : 'up');

      const tip = {
        sourceId: src.id,
        sourceName: src.def.name,
        icon: src.def.icon,
        ticker: asset.ticker,
        direction,
        issuedDay: currentDay,
        expiresDay: currentDay + horizon,
        startPrice: asset.price,
        resolved: false,
        correct: null,
      };
      this.activeTips.push(tip);
      if (src.def.secHeat && sec) {
        sec.addAttention(src.def.secHeat, `Consorting with ${src.def.name}`);
      }
      return tip;
    }
    return null;
  }

  // Resolve expired tips against what actually happened
  tick(currentDay, market, news) {
    for (const tip of this.activeTips) {
      if (tip.resolved || currentDay < tip.expiresDay) continue;
      tip.resolved = true;
      const asset = market.getAsset(tip.ticker);
      if (!asset) continue;
      const actualDir = asset.price >= tip.startPrice ? 'up' : 'down';
      tip.correct = actualDir === tip.direction;
      const src = this.sources.find(s => s.id === tip.sourceId);
      if (src) {
        src.total++;
        if (tip.correct) src.correct++;
      }
      if (news) {
        news.addNews(
          tip.correct
            ? `${tip.sourceName} called it: ${tip.ticker} moved ${actualDir === 'up' ? 'UP' : 'DOWN'}.`
            : `${tip.sourceName} was WRONG about ${tip.ticker}. Adjust your trust accordingly.`,
          tip.correct ? 'milestone' : 'satirical',
          currentDay
        );
      }
    }
    if (this.activeTips.length > 24) this.activeTips = this.activeTips.slice(-24);
  }

  getActiveTips() {
    return this.activeTips.filter(t => !t.resolved);
  }

  getRecordLabel(sourceId) {
    const s = this.sources.find(x => x.id === sourceId);
    if (!s || s.total === 0) return 'No track record yet';
    return `${s.correct}/${s.total} right this run`;
  }
}

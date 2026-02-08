// ============================================================================
// PAST TRADING - Market Simulation Engine
// ============================================================================

class Market {
  constructor() {
    this.assets = {};         // ticker -> { price, history[], basePrice, highestPrice, lowestPrice }
    this.currentMode = null;
    this.activeEvent = null;
    this.eventCooldown = 0;
    this.dayCount = 0;
  }

  init(mode) {
    this.currentMode = mode;
    this.assets = {};
    this.dayCount = 0;

    const modeConfig = TRADING_MODES[mode];
    if (!modeConfig) return;

    for (const asset of modeConfig.assets) {
      const startPrice = asset.basePrice * (0.9 + Math.random() * 0.2); // +-10% randomization
      this.assets[asset.ticker] = {
        ticker: asset.ticker,
        name: asset.name,
        price: startPrice,
        previousPrice: startPrice,
        basePrice: asset.basePrice,
        highestPrice: startPrice,
        lowestPrice: startPrice,
        history: [startPrice],
        daysSinceChange: 0,
        trend: 0,       // -1 to 1, momentum
        isOption: asset.isOption || false,
        optionType: asset.optionType || null,
        strike: asset.strike || 0,
        expiryDays: asset.expiry || 0,
        daysToExpiry: asset.expiry || 0,
      };
    }
  }

  tick() {
    this.dayCount++;
    const modeConfig = TRADING_MODES[this.currentMode];
    if (!modeConfig) return;

    const volatility = CONFIG.BASE_VOLATILITY * modeConfig.volatilityMod;

    // Check for market event
    let eventEffect = 0;
    if (this.eventCooldown <= 0 && Math.random() < CONFIG.EVENT_CHANCE_PER_DAY) {
      const event = this.generateEvent();
      if (event) {
        this.activeEvent = event;
        eventEffect = event.effect;
        this.eventCooldown = 3 + Math.floor(Math.random() * 5); // 3-7 day cooldown
      }
    } else {
      this.eventCooldown--;
      this.activeEvent = null;
    }

    // Update each asset price
    for (const ticker in this.assets) {
      const asset = this.assets[ticker];
      asset.previousPrice = asset.price;

      if (asset.isOption) {
        this.updateOptionPrice(asset, volatility, eventEffect);
      } else {
        this.updateAssetPrice(asset, volatility, eventEffect);
      }

      asset.history.push(asset.price);
      if (asset.history.length > 400) asset.history.shift(); // keep last 400 days

      asset.highestPrice = Math.max(asset.highestPrice, asset.price);
      asset.lowestPrice = Math.min(asset.lowestPrice, asset.price);
      asset.daysSinceChange++;
    }
  }

  updateAssetPrice(asset, volatility, eventEffect) {
    // Geometric brownian motion with mean reversion and momentum
    const randomShock = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (asset.basePrice - asset.price) / asset.basePrice * 0.005;
    const momentum = asset.trend * 0.002;
    const drift = CONFIG.BULL_DRIFT;

    const dailyReturn = drift + randomShock + meanReversion + momentum + eventEffect;
    asset.price = Math.max(0.01, asset.price * (1 + dailyReturn));

    // Update trend (momentum factor)
    const actualReturn = (asset.price - asset.previousPrice) / asset.previousPrice;
    asset.trend = asset.trend * 0.95 + actualReturn * 5; // exponential decay + new signal
    asset.trend = Math.max(-1, Math.min(1, asset.trend));
  }

  updateOptionPrice(asset, volatility, eventEffect) {
    // Simplified option pricing: intrinsic + time value
    asset.daysToExpiry--;

    // Find underlying price (strip the -C or -P suffix)
    const underlyingTicker = asset.ticker.split('-')[0];
    let underlyingPrice = asset.basePrice;
    for (const t in this.assets) {
      if (t === underlyingTicker) {
        underlyingPrice = this.assets[t].price;
        break;
      }
    }

    let intrinsic = 0;
    if (asset.optionType === 'call') {
      intrinsic = Math.max(0, underlyingPrice - asset.strike);
    } else {
      intrinsic = Math.max(0, asset.strike - underlyingPrice);
    }

    // Time value decays as expiry approaches
    const timeValue = Math.max(0, asset.basePrice * (asset.daysToExpiry / (asset.expiryDays || 30)));

    // Add some randomness
    const noise = (Math.random() - 0.5) * volatility * asset.basePrice;

    asset.price = Math.max(0.01, intrinsic + timeValue + noise + eventEffect * asset.basePrice);

    // Reset option if expired
    if (asset.daysToExpiry <= 0) {
      asset.price = intrinsic; // settle at intrinsic
      asset.daysToExpiry = asset.expiryDays; // new contract
    }
  }

  generateEvent() {
    // Filter events relevant to current mode
    const modeConfig = TRADING_MODES[this.currentMode];
    const relevantEvents = MARKET_EVENTS.filter(e => {
      if (e.type === 'macro') return true;
      if (e.type === 'crypto' && (this.currentMode === 'crypto')) return true;
      if (e.type === 'commodity' && (this.currentMode === 'commodities')) return true;
      if (e.type === 'sector' && ['stocks', 'dayTrading', 'options'].includes(this.currentMode)) return true;
      return false;
    });

    if (relevantEvents.length === 0) return null;
    return relevantEvents[Math.floor(Math.random() * relevantEvents.length)];
  }

  getAsset(ticker) {
    return this.assets[ticker] || null;
  }

  getAllAssets() {
    return Object.values(this.assets);
  }

  getPriceChange(ticker) {
    const asset = this.assets[ticker];
    if (!asset) return 0;
    return (asset.price - asset.previousPrice) / asset.previousPrice;
  }

  // Generate an insider tip (future event knowledge)
  generateInsiderTip() {
    const assets = Object.values(this.assets);
    if (assets.length === 0) return null;

    const target = assets[Math.floor(Math.random() * assets.length)];
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const magnitude = 0.05 + Math.random() * 0.15; // 5-20% move

    return {
      ticker: target.ticker,
      direction,
      magnitude,
      daysUntil: 2 + Math.floor(Math.random() * 5),
      text: `Heard from a "friend" that ${target.name} is about to go ${direction} big...`
    };
  }

  // Apply insider tip effect (called when tip's day arrives)
  applyInsiderEffect(tip) {
    const asset = this.assets[tip.ticker];
    if (!asset) return;

    const effect = tip.direction === 'up' ? tip.magnitude : -tip.magnitude;
    asset.price = Math.max(0.01, asset.price * (1 + effect));
  }
}

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
    this.dataLoader = null;   // Historical data loader
  }

  async init(mode, dataLoader) {
    this.currentMode = mode;
    this.assets = {};
    this.dayCount = 0;
    this.dataLoader = dataLoader;

    const modeConfig = TRADING_MODES[mode];
    if (!modeConfig) return;

    // Load historical data for all assets
    const category = this.getCategoryForMode(mode);
    const loadPromises = modeConfig.assets.map(async (assetDef) => {
      let historicalData = null;
      let hasHistoricalData = false;

      // Try to load historical data
      if (dataLoader && category) {
        try {
          historicalData = await dataLoader.loadAssetData(assetDef.ticker, category);
          hasHistoricalData = !!historicalData;
        } catch (e) {
          console.warn(`Failed to load historical data for ${assetDef.ticker}:`, e);
        }
      }

      // Determine starting price
      let startPrice = assetDef.basePrice * (0.9 + Math.random() * 0.2);
      if (hasHistoricalData && historicalData.ohlc && historicalData.ohlc.length > 0) {
        startPrice = historicalData.ohlc[0].close;
      }

      this.assets[assetDef.ticker] = {
        ticker: assetDef.ticker,
        name: assetDef.name,
        price: startPrice,
        previousPrice: startPrice,
        basePrice: assetDef.basePrice,
        highestPrice: startPrice,
        lowestPrice: startPrice,
        history: [startPrice],
        ohlcHistory: [],  // For candlestick charts
        daysSinceChange: 0,
        trend: 0,       // -1 to 1, momentum
        isOption: assetDef.isOption || false,
        optionType: assetDef.optionType || null,
        strike: assetDef.strike || 0,
        expiryDays: assetDef.expiry || 0,
        daysToExpiry: assetDef.expiry || 0,
        hasHistoricalData,
        historicalData
      };
    });

    await Promise.all(loadPromises);
  }

  getCategoryForMode(mode) {
    const categoryMap = {
      stocks: 'stocks',
      dayTrading: 'etfs',
      options: 'stocks',
      forex: 'forex',
      commodities: 'commodities',
      crypto: 'crypto',
      scalping: 'etfs',
      arbitrage: 'etfs',
      marketMaking: 'etfs',
      algoTrading: 'stocks'
    };
    return categoryMap[mode] || 'stocks';
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

      // Limit OHLC history as well
      if (asset.ohlcHistory && asset.ohlcHistory.length > 400) {
        asset.ohlcHistory.shift();
      }

      asset.highestPrice = Math.max(asset.highestPrice, asset.price);
      asset.lowestPrice = Math.min(asset.lowestPrice, asset.price);
      asset.daysSinceChange++;
    }
  }

  updateAssetPrice(asset, volatility, eventEffect) {
    // Try to use historical data first
    if (asset.hasHistoricalData && asset.historicalData.ohlc && this.dayCount < asset.historicalData.ohlc.length) {
      const ohlc = asset.historicalData.ohlc[this.dayCount];
      asset.price = ohlc.close;

      // Store OHLC for candlestick charts
      asset.ohlcHistory.push({
        open: ohlc.open,
        high: ohlc.high,
        low: ohlc.low,
        close: ohlc.close
      });

      // Calculate trend from historical data
      const actualReturn = (asset.price - asset.previousPrice) / asset.previousPrice;
      asset.trend = asset.trend * 0.95 + actualReturn * 5;
      asset.trend = Math.max(-1, Math.min(1, asset.trend));

      return;
    }

    // Fallback to synthetic generation (existing GBM code)
    const randomShock = (Math.random() - 0.5) * 2 * volatility;
    const meanReversion = (asset.basePrice - asset.price) / asset.basePrice * 0.005;
    const momentum = asset.trend * 0.002;
    const drift = CONFIG.BULL_DRIFT;

    const dailyReturn = drift + randomShock + meanReversion + momentum + eventEffect;
    const newPrice = Math.max(0.01, asset.price * (1 + dailyReturn));

    // Generate synthetic OHLC for day trading mode
    const open = asset.price;
    const close = newPrice;
    const wickSize = Math.abs(dailyReturn) * 0.5 * (0.5 + Math.random());
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);

    asset.ohlcHistory.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2))
    });

    asset.price = newPrice;

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

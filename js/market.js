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

  async init(mode, dataLoader, progression, startYear = null, endYear = null) {
    this.currentMode = mode;
    this.assets = {};
    this.dayCount = 0;
    this.dataLoader = dataLoader;

    // Calculate start date and offset (random year 2000-2024 if not specified)
    this.startYear = startYear || 2000 + Math.floor(Math.random() * 25);
    this.endYear = endYear || this.startYear;
    this.startDate = new Date(this.startYear, 0, 1);

    console.log(`Starting market simulation from ${this.startDate.toDateString()} to year ${this.endYear}`);

    const modeConfig = TRADING_MODES[mode];
    if (!modeConfig) return;

    // Filter assets by unlocked categories for stocks mode
    let availableAssets = modeConfig.assets;
    if (mode === 'stocks' && progression) {
      availableAssets = modeConfig.assets.filter(asset => {
        const category = asset.category || 'consumer';  // Default fallback
        return this.isCategoryUnlocked(category, progression);
      });
      console.log(`Filtered to ${availableAssets.length} unlocked stocks`);
    }

    // Load historical data for all assets
    const category = this.getCategoryForMode(mode);
    const loadPromises = availableAssets.map(async (assetDef) => {
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

      // Determine starting price and pre-populate history for charts
      let startPrice = assetDef.basePrice * (0.9 + Math.random() * 0.2);
      let initialHistory = [startPrice];
      let initialOhlcHistory = [];
      let highestPrice = startPrice;
      let lowestPrice = startPrice;

      // Store actual data start date for late-IPO stocks
      let actualDataStartDate = null;

      if (hasHistoricalData && historicalData.ohlc && historicalData.ohlc.length > 0) {
        // Parse actual start date from historical data
        actualDataStartDate = new Date(historicalData.period.start);

        // Calculate offset from actual data start, not from 2000-01-01
        const elapsedMs = this.startDate - actualDataStartDate;
        const calendarDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

        // If start date is BEFORE data availability, use index 0
        // If start date is AFTER data start, calculate correct offset
        let requestedOffset = 0;
        if (calendarDays > 0) {
          requestedOffset = Math.floor(calendarDays * (252 / 365)); // Scale to trading days
        }

        // Clamp to available data range
        const dayOffset = Math.min(requestedOffset, historicalData.ohlc.length - 1);

        if (dayOffset >= 0) {
          startPrice = historicalData.ohlc[dayOffset].close;

          // Pre-populate history with last 90 days (or all available data)
          const historyStartIdx = Math.max(0, dayOffset - 90);
          initialHistory = [];
          initialOhlcHistory = [];

          for (let i = historyStartIdx; i <= dayOffset; i++) {
            const ohlc = historicalData.ohlc[i];
            initialHistory.push(ohlc.close);
            initialOhlcHistory.push({
              open: ohlc.open,
              high: ohlc.high,
              low: ohlc.low,
              close: ohlc.close
            });
            highestPrice = Math.max(highestPrice, ohlc.high);
            lowestPrice = Math.min(lowestPrice, ohlc.low);
          }
        } else {
          // Game starts BEFORE stock IPO - use first available data point
          startPrice = historicalData.ohlc[0].close;
          initialHistory = [startPrice];  // At least one data point
          initialOhlcHistory = [{
            open: historicalData.ohlc[0].open,
            high: historicalData.ohlc[0].high,
            low: historicalData.ohlc[0].low,
            close: historicalData.ohlc[0].close
          }];
        }
      }

      this.assets[assetDef.ticker] = {
        ticker: assetDef.ticker,
        name: assetDef.name,
        price: startPrice,
        previousPrice: startPrice,
        basePrice: assetDef.basePrice,
        highestPrice: highestPrice,
        lowestPrice: lowestPrice,
        history: initialHistory,
        ohlcHistory: initialOhlcHistory,
        daysSinceChange: 0,
        trend: 0,       // -1 to 1, momentum
        isOption: assetDef.isOption || false,
        optionType: assetDef.optionType || null,
        strike: assetDef.strike || 0,
        expiryDays: assetDef.expiry || 0,
        daysToExpiry: assetDef.expiry || 0,
        hasHistoricalData,
        historicalData,
        actualDataStartDate  // Store for calculateDataDay()
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

    // ============================================================================
    // DISABLED: Random market event shocks
    // Historical prices already reflect real market events - no artificial shocks
    // ============================================================================
    // Real events will come from news_events.json with actual dates
    this.activeEvent = null;

    // Update each asset price
    for (const ticker in this.assets) {
      const asset = this.assets[ticker];

      if (asset.isOption) {
        this.updateOptionPrice(asset, volatility, 0);
      } else {
        // updateAssetPrice handles history updates internally now
        this.updateAssetPrice(asset, volatility, 0);
      }

      asset.daysSinceChange++;
    }
  }

  tickIntraday(minute) {
    // Scale volatility for minute bars (divide by sqrt(390))
    const modeConfig = TRADING_MODES[this.currentMode];
    if (!modeConfig) return;

    const dailyVol = CONFIG.BASE_VOLATILITY * modeConfig.volatilityMod;
    const minuteVol = dailyVol / Math.sqrt(390);

    for (const ticker in this.assets) {
      const asset = this.assets[ticker];
      asset.previousPrice = asset.price;

      // Random price movement (scaled for 1-minute interval)
      const randomShock = (Math.random() - 0.5) * 2 * minuteVol;
      const drift = CONFIG.BULL_DRIFT / 390; // Scale drift

      const minuteReturn = drift + randomShock;
      const newPrice = Math.max(0.01, asset.price * (1 + minuteReturn));

      asset.price = newPrice;
      asset.history.push(newPrice);

      // Track minute OHLC for charts
      if (!asset.intradayOhlc) asset.intradayOhlc = [];

      asset.intradayOhlc.push({
        minute,
        time: new Date(), // Current time for display
        open: asset.previousPrice,
        high: Math.max(asset.previousPrice, newPrice),
        low: Math.min(asset.previousPrice, newPrice),
        close: newPrice
      });

      // Limit history
      if (asset.history.length > 400) asset.history.shift();
      if (asset.intradayOhlc.length > 390) asset.intradayOhlc.shift();

      // Update highs/lows
      if (newPrice > asset.highestPrice) asset.highestPrice = newPrice;
      if (newPrice < asset.lowestPrice) asset.lowestPrice = newPrice;
    }
  }

  updateAssetPrice(asset, volatility, eventEffect) {
    // ============================================================================
    // CRITICAL: Use ONLY real historical prices - ZERO artificial modifications
    // ============================================================================
    // Calculate which day in historical data to use
    const dataDay = this.calculateDataDay(asset);

    // Use historical data EXACTLY as provided - NO modifications
    if (asset.hasHistoricalData && asset.historicalData.ohlc &&
        dataDay >= 0 && dataDay < asset.historicalData.ohlc.length) {
      const ohlc = asset.historicalData.ohlc[dataDay];

      // Use REAL historical prices - NO randomness, NO adjustments
      asset.previousPrice = asset.price;
      asset.price = ohlc.close;

      // Store OHLC for candlestick charts (real data)
      asset.ohlcHistory.push({
        open: ohlc.open,
        high: ohlc.high,
        low: ohlc.low,
        close: ohlc.close
      });

      // Update history array for line charts
      asset.history.push(ohlc.close);

      // Update highs/lows from historical data
      asset.highestPrice = Math.max(asset.highestPrice, ohlc.high);
      asset.lowestPrice = Math.min(asset.lowestPrice, ohlc.low);

      // Limit history size
      if (asset.history.length > 400) asset.history.shift();
      if (asset.ohlcHistory.length > 400) asset.ohlcHistory.shift();

      return;
    }

    // Data missing - some stocks IPO'd after 2000, so data may be incomplete
    if (asset.hasHistoricalData && !asset._historicalDataWarned) {
      console.warn(`Historical data not available for ${asset.ticker} at day ${dataDay} (has ${asset.historicalData.ohlc.length} days)`);
      console.warn(`This stock may have IPO'd after your start date. Price will be held constant.`);
      asset._historicalDataWarned = true;
    }

    // Freeze at last price if data exhausted
    // Keep updating arrays so charts continue to render
    asset.ohlcHistory.push({
      open: asset.price,
      high: asset.price,
      low: asset.price,
      close: asset.price
    });

    // CRITICAL: Also update regular history array for line charts!
    asset.history.push(asset.price);

    // Limit history size
    if (asset.history.length > 400) asset.history.shift();
    if (asset.ohlcHistory.length > 400) asset.ohlcHistory.shift();
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

    // Bug Fix #39: Price floor of 0.01 is intentional to prevent negative prices
    // For very low-value options, this may create a floor effect, which is acceptable
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

  calculateDataDay(asset) {
    // If no historical data, return 0
    if (!asset.hasHistoricalData || !asset.actualDataStartDate) {
      return 0;
    }

    // Calculate days elapsed since THIS asset's data start date
    const elapsedMs = this.startDate - asset.actualDataStartDate;
    const calendarDaysSinceAssetStart = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));

    // Scale to trading days
    const TRADING_DAYS_PER_YEAR = 252;
    const GAME_DAYS_PER_YEAR = 365;
    const scale = TRADING_DAYS_PER_YEAR / GAME_DAYS_PER_YEAR;

    // Calculate base offset (may be negative if game starts before asset IPO)
    const baseTradingDay = Math.floor(calendarDaysSinceAssetStart * scale);
    const currentTradingDay = Math.floor(this.dayCount * scale);

    const dataDay = baseTradingDay + currentTradingDay;

    // Bug Fix #17: Validate array is not empty before accessing
    if (!asset.historicalData || !asset.historicalData.ohlc || asset.historicalData.ohlc.length === 0) {
      console.error('Empty or invalid historical data for asset:', asset.ticker);
      return 0; // Safe fallback
    }

    // Clamp to valid range [0, data.length - 1]
    return Math.max(0, Math.min(dataDay, asset.historicalData.ohlc.length - 1));
  }

  isCategoryUnlocked(category, progression) {
    const categoryConfig = STOCK_CATEGORIES[category];
    if (!categoryConfig) return false;
    if (categoryConfig.unlocked) return true;

    const unlockKey = Object.keys(UNLOCKS).find(key =>
      UNLOCKS[key].unlocksCategory === category
    );
    return unlockKey && progression.data.unlocks[unlockKey];
  }
}

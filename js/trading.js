// ============================================================================
// PAST TRADING - Trading Engine
// ============================================================================

class TradingEngine {
  constructor() {
    this.positions = [];     // { ticker, quantity, entryPrice, entryDay, type: 'long'|'short' }
    this.cash = 0;
    this.netWorth = 0;
    this.netWorthHistory = [];
    this.tradeHistory = [];
    this.lastTradeTime = 0;
    this.stats = this.freshStats();
  }

  freshStats() {
    return {
      totalTrades: 0,
      dayTrades: 0,
      quickSells: 0,
      winStreak: 0,
      maxWinStreak: 0,
      loseStreak: 0,
      totalProfit: 0,
      totalLoss: 0,
      illegalActions: 0,
      totalDonations: 0,
      maxNetWorth: 0,
      maxSecAttention: 0,
      survived: false,
      wentBankrupt: false,
      marginCallsRecovered: 0,
      hadMarginCall: false,
      longestLosingHoldThenProfit: 0,
      cryptoCrashHold: false,
      boughtAtBottom: false,
      soldAtTop: false,
      totalArrests: 0,  // pulled from meta progression
    };
  }

  init(startingCash, metaProgression) {
    // Apply starting cash bonuses
    let cash = startingCash;
    if (metaProgression) {
      if (metaProgression.unlocks.startingCash5x) cash = CONFIG.STARTING_CASH * 5;
      else if (metaProgression.unlocks.startingCash2x) cash = CONFIG.STARTING_CASH * 2;

      // Title bonuses
      if (metaProgression.equippedTitle === 'wolfOfWallSt') {
        cash += ACHIEVEMENTS.wolfOfWallSt.titleBonus.startingCashBonus;
      }
    }

    this.cash = cash;
    this.netWorth = cash;
    this.netWorthHistory = [cash];
    this.positions = [];
    this.tradeHistory = [];
    this.lastTradeTime = 0;
    this.stats = this.freshStats();
    this.stats.totalArrests = metaProgression ? (metaProgression.totalArrests || 0) : 0;
  }

  getMaxPositions(metaProgression) {
    let max = CONFIG.MAX_POSITIONS;
    if (metaProgression && metaProgression.unlocks.morePositions) {
      max = UNLOCKS.morePositions.maxPositions;
    }
    return max;
  }

  getLeverage(metaProgression) {
    if (!metaProgression) return 1;
    if (metaProgression.unlocks.leverage50x) return 50;
    if (metaProgression.unlocks.leverage10x) return 10;
    if (metaProgression.unlocks.leverage5x) return 5;
    if (metaProgression.unlocks.leverage2x) return 2;
    return 1;
  }

  getFeeReduction(metaProgression) {
    if (!metaProgression) return 0;
    if (metaProgression.unlocks.reducedFees3) return 0.75;
    if (metaProgression.unlocks.reducedFees2) return 0.50;
    if (metaProgression.unlocks.reducedFees1) return 0.25;
    return 0;
  }

  getCooldown(metaProgression) {
    let cd = CONFIG.BASE_COOLDOWN_MS;
    if (metaProgression && metaProgression.equippedTitle === 'maleAstrology') {
      cd *= (1 - ACHIEVEMENTS.maleAstrology.titleBonus.cooldownReduction);
    }
    return cd;
  }

  canTrade(metaProgression) {
    const now = Date.now();
    const cooldown = this.getCooldown(metaProgression);
    return now - this.lastTradeTime >= cooldown;
  }

  buy(ticker, quantity, market, metaProgression, currentDay) {
    const asset = market.getAsset(ticker);
    if (!asset) return { success: false, message: 'Asset not found' };

    const maxPos = this.getMaxPositions(metaProgression);
    if (this.positions.length >= maxPos) {
      return { success: false, message: `Max ${maxPos} positions reached` };
    }

    if (!this.canTrade(metaProgression)) {
      return { success: false, message: 'Trade on cooldown' };
    }

    const leverage = this.getLeverage(metaProgression);
    const feeReduction = this.getFeeReduction(metaProgression);
    const modeConfig = TRADING_MODES[market.currentMode];
    const feePercent = CONFIG.BASE_FEE_PERCENT * modeConfig.feeMod * (1 - feeReduction);

    const totalCost = asset.price * quantity;
    const fee = totalCost * feePercent / 100;
    const cashNeeded = totalCost / leverage + fee;

    if (cashNeeded > this.cash) {
      return { success: false, message: `Need ${formatMoney(cashNeeded)}, have ${formatMoney(this.cash)}` };
    }

    this.cash -= cashNeeded;
    this.positions.push({
      ticker,
      name: asset.name,
      quantity,
      entryPrice: asset.price,
      entryDay: currentDay,
      type: 'long',
      leverage,
      lowestPriceSinceEntry: asset.price,
      daysInLoss: 0,
    });

    this.lastTradeTime = Date.now();
    this.stats.totalTrades++;

    // Check if bought at the lowest price (within 1%)
    if (asset.price <= asset.lowestPrice * 1.01) {
      this.stats.boughtAtBottom = true;
    }

    const trade = { action: 'BUY', ticker, quantity, price: asset.price, fee, day: currentDay };
    this.tradeHistory.push(trade);

    return { success: true, message: `Bought ${quantity} ${ticker} @ ${formatPrice(asset.price)}`, trade };
  }

  sell(ticker, positionIndex, market, metaProgression, currentDay) {
    if (positionIndex < 0 || positionIndex >= this.positions.length) {
      return { success: false, message: 'Invalid position' };
    }

    if (!this.canTrade(metaProgression)) {
      return { success: false, message: 'Trade on cooldown' };
    }

    const pos = this.positions[positionIndex];
    const asset = market.getAsset(pos.ticker);
    if (!asset) return { success: false, message: 'Asset no longer exists' };

    const feeReduction = this.getFeeReduction(metaProgression);
    const modeConfig = TRADING_MODES[market.currentMode];
    const feePercent = CONFIG.BASE_FEE_PERCENT * modeConfig.feeMod * (1 - feeReduction);

    const saleValue = asset.price * pos.quantity;
    const fee = saleValue * feePercent / 100;

    let profit;
    if (pos.type === 'long') {
      profit = (asset.price - pos.entryPrice) * pos.quantity * pos.leverage - fee;
      // Return the collateral + profit
      const collateral = pos.entryPrice * pos.quantity / pos.leverage;
      this.cash += collateral + profit;
    } else {
      // Short
      profit = (pos.entryPrice - asset.price) * pos.quantity * pos.leverage - fee;
      const collateral = pos.entryPrice * pos.quantity / pos.leverage;
      this.cash += collateral + profit;
    }

    this.lastTradeTime = Date.now();
    this.stats.totalTrades++;

    // Track stats
    if (currentDay - pos.entryDay <= 1) {
      this.stats.dayTrades++;
      this.stats.quickSells++;
    }

    if (profit > 0) {
      this.stats.winStreak++;
      this.stats.loseStreak = 0;
      this.stats.maxWinStreak = Math.max(this.stats.maxWinStreak, this.stats.winStreak);
      this.stats.totalProfit += profit;

      // Diamond hands check
      if (pos.daysInLoss >= 30) {
        this.stats.longestLosingHoldThenProfit = Math.max(
          this.stats.longestLosingHoldThenProfit,
          pos.daysInLoss
        );
      }

      // Margin call recovery
      if (this.stats.hadMarginCall) {
        this.stats.marginCallsRecovered++;
        this.stats.hadMarginCall = false;
      }
    } else {
      this.stats.loseStreak++;
      this.stats.winStreak = 0;
      this.stats.totalLoss += Math.abs(profit);
    }

    // Sold at top check
    if (asset.price >= asset.highestPrice * 0.99) {
      this.stats.soldAtTop = true;
    }

    this.positions.splice(positionIndex, 1);

    const trade = { action: 'SELL', ticker: pos.ticker, quantity: pos.quantity, price: asset.price, profit, fee, day: currentDay };
    this.tradeHistory.push(trade);

    return { success: true, message: `Sold ${pos.quantity} ${pos.ticker} @ ${formatPrice(asset.price)} (${profit >= 0 ? '+' : ''}${formatMoney(profit)})`, trade, profit };
  }

  short(ticker, quantity, market, metaProgression, currentDay) {
    const asset = market.getAsset(ticker);
    if (!asset) return { success: false, message: 'Asset not found' };

    const maxPos = this.getMaxPositions(metaProgression);
    if (this.positions.length >= maxPos) {
      return { success: false, message: `Max ${maxPos} positions reached` };
    }

    if (!this.canTrade(metaProgression)) {
      return { success: false, message: 'Trade on cooldown' };
    }

    const leverage = this.getLeverage(metaProgression);
    const feeReduction = this.getFeeReduction(metaProgression);
    const modeConfig = TRADING_MODES[market.currentMode];
    const feePercent = CONFIG.BASE_FEE_PERCENT * modeConfig.feeMod * (1 - feeReduction);

    const totalValue = asset.price * quantity;
    const fee = totalValue * feePercent / 100;
    const collateral = totalValue / leverage + fee;

    if (collateral > this.cash) {
      return { success: false, message: `Need ${formatMoney(collateral)} collateral, have ${formatMoney(this.cash)}` };
    }

    this.cash -= collateral;
    this.positions.push({
      ticker,
      name: asset.name,
      quantity,
      entryPrice: asset.price,
      entryDay: currentDay,
      type: 'short',
      leverage,
      lowestPriceSinceEntry: asset.price,
      daysInLoss: 0,
    });

    this.lastTradeTime = Date.now();
    this.stats.totalTrades++;

    const trade = { action: 'SHORT', ticker, quantity, price: asset.price, fee, day: currentDay };
    this.tradeHistory.push(trade);

    return { success: true, message: `Shorted ${quantity} ${ticker} @ ${formatPrice(asset.price)}`, trade };
  }

  updatePositions(market, currentDay) {
    // Update P&L, check margin calls, track stats
    let totalPositionValue = 0;

    for (let i = this.positions.length - 1; i >= 0; i--) {
      const pos = this.positions[i];
      const asset = market.getAsset(pos.ticker);
      if (!asset) continue;

      let posValue;
      if (pos.type === 'long') {
        posValue = (asset.price - pos.entryPrice) * pos.quantity * pos.leverage;
        posValue += pos.entryPrice * pos.quantity / pos.leverage; // + collateral
      } else {
        posValue = (pos.entryPrice - asset.price) * pos.quantity * pos.leverage;
        posValue += pos.entryPrice * pos.quantity / pos.leverage; // + collateral
      }

      totalPositionValue += Math.max(0, posValue);

      // Track if position is in loss
      const pnl = pos.type === 'long'
        ? (asset.price - pos.entryPrice) * pos.quantity
        : (pos.entryPrice - asset.price) * pos.quantity;

      if (pnl < 0) {
        pos.daysInLoss++;
      }

      pos.lowestPriceSinceEntry = Math.min(pos.lowestPriceSinceEntry, asset.price);

      // Liquidation check: if position value drops below 10% of collateral
      const collateral = pos.entryPrice * pos.quantity / pos.leverage;
      if (posValue < collateral * 0.1) {
        // Liquidated
        this.positions.splice(i, 1);
        this.stats.hadMarginCall = true;
      }
    }

    this.netWorth = this.cash + totalPositionValue;
    this.netWorthHistory.push(this.netWorth);
    this.stats.maxNetWorth = Math.max(this.stats.maxNetWorth, this.netWorth);

    if (this.netWorth <= 0) {
      this.stats.wentBankrupt = true;
    }
  }

  getRiskLevel(market) {
    if (this.positions.length === 0) return 0;

    let totalExposure = 0;
    for (const pos of this.positions) {
      const asset = market.getAsset(pos.ticker);
      if (!asset) continue;
      totalExposure += asset.price * pos.quantity * pos.leverage;
    }

    const riskPercent = (totalExposure / Math.max(1, this.netWorth)) * CONFIG.RISK_PER_POSITION_PERCENT;
    return Math.min(100, riskPercent);
  }

  getPositionPnL(pos, market) {
    const asset = market.getAsset(pos.ticker);
    if (!asset) return { pnl: 0, pnlPercent: 0, currentPrice: 0 };

    let pnl;
    if (pos.type === 'long') {
      pnl = (asset.price - pos.entryPrice) * pos.quantity * pos.leverage;
    } else {
      pnl = (pos.entryPrice - asset.price) * pos.quantity * pos.leverage;
    }

    const invested = pos.entryPrice * pos.quantity;
    const pnlPercent = invested > 0 ? pnl / invested : 0;

    return { pnl, pnlPercent, currentPrice: asset.price };
  }

  // Passive income from scalping/arbitrage/market-making
  processPassiveIncome(mode, metaProgression) {
    const modeConfig = TRADING_MODES[mode];
    if (!modeConfig || !modeConfig.isPassive) return 0;

    let income = modeConfig.passiveIncomePerDay;

    // Leverage applies to passive income too
    const leverage = this.getLeverage(metaProgression);
    income *= Math.sqrt(leverage); // diminishing returns on passive leverage

    this.cash += income;
    return income;
  }
}

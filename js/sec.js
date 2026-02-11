// ============================================================================
// PAST TRADING - SEC Attention & Investigation System
// ============================================================================

class SECSystem {
  constructor() {
    this.attention = 0;
    this.investigationStage = 'safe';
    this.frozenAssets = false;
    this.tradeRestricted = false;
    this.donationCount = 0;
    this.totalDonations = 0;
    this.pendingTips = [];       // insider tips waiting to resolve
    this.activeIllegalActions = [];
    this.warningShown = false;
    // Randomize arrest threshold between 60-100%
    this.arrestThreshold = 60 + Math.random() * 40;
  }

  init() {
    this.attention = CONFIG.STARTING_SEC_ATTENTION;
    this.investigationStage = 'safe';
    this.frozenAssets = false;
    this.tradeRestricted = false;
    this.donationCount = 0;
    this.totalDonations = 0;
    this.pendingTips = [];
    this.activeIllegalActions = [];
    this.warningShown = false;
    // Randomize arrest threshold for each new run
    this.arrestThreshold = 60 + Math.random() * 40;
  }

  tick(tradingEngine, market, metaProgression) {
    // Natural decay
    let decay = CONFIG.SEC_DECAY_PER_DAY;

    // Passive decay bonus from unlocks
    if (metaProgression) {
      if (metaProgression.unlocks.lowerSurv2) {
        decay *= 1.4;
      } else if (metaProgression.unlocks.lowerSurv1) {
        decay *= 1.2;
      }
      // Teflon Don title
      if (metaProgression.equippedTitle === 'teflonDon') {
        decay *= 1.25;
      }
    }

    this.attention = Math.max(0, this.attention - decay);

    // Check for suspicious returns
    if (tradingEngine.netWorthHistory.length >= 2) {
      const prev = tradingEngine.netWorthHistory[tradingEngine.netWorthHistory.length - 2];
      const curr = tradingEngine.netWorth;
      const dailyReturn = prev > 0 ? (curr - prev) / prev : 0;

      if (Math.abs(dailyReturn) > CONFIG.SUSPICIOUS_RETURN_THRESHOLD) {
        this.addAttention(CONFIG.SUSPICIOUS_RETURN_SEC_HIT, 'Unusual returns flagged');
      }
    }

    // Process pending insider tips
    for (let i = this.pendingTips.length - 1; i >= 0; i--) {
      this.pendingTips[i].daysUntil--;
      if (this.pendingTips[i].daysUntil <= 0) {
        market.applyInsiderEffect(this.pendingTips[i]);
        this.pendingTips.splice(i, 1);
      }
    }

    // Update investigation stage
    this.updateStage();

    // Apply investigation effects
    if (this.investigationStage === 'investigation') {
      // Random chance of freezing assets
      if (!this.frozenAssets && Math.random() < 0.05) {
        this.frozenAssets = true;
        this.tradeRestricted = true;
      }
    } else if (this.investigationStage === 'grandJury') {
      this.tradeRestricted = true;
    } else if (this.attention < CONFIG.SEC_THRESHOLDS.INVESTIGATION) {
      this.frozenAssets = false;
      this.tradeRestricted = false;
    }

    // Track max attention in stats
    tradingEngine.stats.maxSecAttention = Math.max(
      tradingEngine.stats.maxSecAttention,
      this.attention
    );

    return this.isArrested();
  }

  isArrested() {
    // No arrest possible below 60%
    if (this.attention < 60) return false;

    // Guarantee arrest at 95%+
    if (this.attention >= 95) return true;

    // Between 60-95%, arrest when threshold is reached
    return this.attention >= this.arrestThreshold;
  }

  updateStage() {
    if (this.attention >= CONFIG.SEC_THRESHOLDS.GRAND_JURY) {
      this.investigationStage = 'grandJury';
    } else if (this.attention >= CONFIG.SEC_THRESHOLDS.INVESTIGATION) {
      this.investigationStage = 'investigation';
    } else if (this.attention >= CONFIG.SEC_THRESHOLDS.INQUIRY) {
      this.investigationStage = 'inquiry';
    } else if (this.attention >= CONFIG.SEC_THRESHOLDS.SAFE) {
      this.investigationStage = 'monitoring';
    } else {
      this.investigationStage = 'safe';
    }
  }

  addAttention(amount, reason) {
    this.attention = Math.min(100, this.attention + amount);
    this.activeIllegalActions.push({ amount, reason, day: 0 });
    // Keep only recent 20
    if (this.activeIllegalActions.length > 20) {
      this.activeIllegalActions.shift();
    }
  }

  doInsiderTrade(market, tradingEngine) {
    const tip = market.generateInsiderTip();
    if (!tip) return null;

    this.addAttention(ILLEGAL_ACTIONS.insiderTrading.secHit, 'Insider trading detected');
    tradingEngine.stats.illegalActions++;
    this.pendingTips.push(tip);

    return tip;
  }

  doLiborRig(tradingEngine) {
    this.addAttention(ILLEGAL_ACTIONS.liborRigging.secHit, 'LIBOR manipulation detected');
    tradingEngine.stats.illegalActions++;

    // Guaranteed profit
    const profit = tradingEngine.netWorth * 0.05; // 5% of net worth
    tradingEngine.cash += profit;

    return { profit, message: `LIBOR rigged. +${formatMoney(profit)} guaranteed.` };
  }

  doFrontRun(tradingEngine) {
    this.addAttention(ILLEGAL_ACTIONS.frontRunning.secHit, 'Front running detected');
    tradingEngine.stats.illegalActions++;

    const profit = tradingEngine.netWorth * 0.02;
    tradingEngine.cash += profit;

    return { profit, message: `Front-ran a large order. +${formatMoney(profit)}` };
  }

  doPumpAndDump(ticker, market, tradingEngine) {
    this.addAttention(ILLEGAL_ACTIONS.pumpAndDump.secHit, 'Pump & dump scheme detected');
    tradingEngine.stats.illegalActions++;

    const asset = market.getAsset(ticker);
    if (!asset) return null;

    // Pump the price
    const pumpAmount = 0.30 + Math.random() * 0.20; // 30-50% pump
    asset.price *= (1 + pumpAmount);

    const profit = tradingEngine.netWorth * 0.08;
    tradingEngine.cash += profit;

    // Price will crash next tick
    setTimeout(() => {
      asset.price *= 0.5; // crash 50%
    }, 0);

    return { profit, message: `Pumped ${ticker} +${(pumpAmount * 100).toFixed(0)}%, dumped for +${formatMoney(profit)}` };
  }

  doWashTrade(tradingEngine) {
    this.addAttention(ILLEGAL_ACTIONS.washTrading.secHit, 'Wash trading detected');
    tradingEngine.stats.illegalActions++;

    const profit = tradingEngine.netWorth * 0.01;
    tradingEngine.cash += profit;

    return { profit, message: `Wash traded for fake volume. +${formatMoney(profit)}` };
  }

  makeDonation(tradingEngine, metaProgression) {
    let cost = CONFIG.DONATION_BASE_COST * Math.pow(CONFIG.DONATION_COST_MULTIPLIER, this.donationCount);

    // Lobbyist title discount
    if (metaProgression && metaProgression.equippedTitle === 'theLobbyist') {
      cost *= (1 - ACHIEVEMENTS.theLobbyist.titleBonus.donationDiscount);
    }

    if (tradingEngine.cash < cost) {
      return { success: false, message: `Need ${formatMoney(cost)} for donation, have ${formatMoney(tradingEngine.cash)}` };
    }

    tradingEngine.cash -= cost;
    this.donationCount++;
    this.totalDonations += cost;
    tradingEngine.stats.totalDonations += cost;

    const reduction = CONFIG.DONATION_SEC_REDUCTION;
    this.attention = Math.max(0, this.attention - reduction);

    const nextCost = CONFIG.DONATION_BASE_COST * Math.pow(CONFIG.DONATION_COST_MULTIPLIER, this.donationCount);

    return {
      success: true,
      message: `Donated ${formatMoney(cost)} to PAC. SEC attention -${reduction}. Next donation: ${formatMoney(nextCost)}`,
      cost,
      newAttention: this.attention
    };
  }

  getLabel() {
    for (const threshold of [95, 80, 60, 30, 0]) {
      if (this.attention >= threshold) {
        return CONFIG.SEC_LABELS[threshold];
      }
    }
    return CONFIG.SEC_LABELS[0];
  }

  canDoIllegalAction(actionId, metaProgression, runCount) {
    const action = ILLEGAL_ACTIONS[actionId];
    if (!action) return false;

    if (this.tradeRestricted) return false;

    if (action.requires && metaProgression && !metaProgression.unlocks[action.requires]) {
      return false;
    }

    if (action.unlockRun && runCount < action.unlockRun) {
      return false;
    }

    return true;
  }
}

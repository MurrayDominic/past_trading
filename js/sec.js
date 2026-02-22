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
    // Randomize arrest threshold between 60-100%
    this.arrestThreshold = 60 + Math.random() * 40;
    // Survival unlock tracking
    this.fallGuyUsed = false;
    this.bailFundUsed = false;
    this.offshoreEscapeUsed = false;
  }

  tick(tradingEngine, market, metaProgression) {
    // Cache metaProgression for use in illegal action methods
    this._meta = metaProgression;

    // Natural decay
    let decay = CONFIG.SEC_DECAY_PER_DAY;

    // Passive decay bonus from unlocks
    if (metaProgression) {
      if (metaProgression.unlocks.ghostMode) {
        decay *= 1.6;
      } else if (metaProgression.unlocks.lowerSurv2) {
        decay *= 1.4;
      } else if (metaProgression.unlocks.lowerSurv1) {
        decay *= 1.2;
      }
      // Lobbyist Network doubles decay rate
      if (metaProgression.unlocks.lobbyistNetwork) {
        decay *= 2.0;
      }
      // Teflon Don title
      if (metaProgression.equippedTitle === 'teflonDon') {
        decay *= 1.25;
      }
      // Charity Foundation: extra SEC decay per day
      if (metaProgression.unlocks.charityFoundation) {
        decay += UNLOCKS.charityFoundation.extraDecay;
      }
    }

    this.attention = Math.max(0, this.attention - decay);

    // Check for suspicious returns
    if (tradingEngine.netWorthHistory.length >= 2) {
      const prev = tradingEngine.netWorthHistory[tradingEngine.netWorthHistory.length - 2];
      let curr = tradingEngine.netWorth;

      // Offshore Accounts: hide a portion of net worth from SEC suspicion
      if (metaProgression && metaProgression.unlocks.offshoreAccounts) {
        curr = curr * (1 - UNLOCKS.offshoreAccounts.netWorthHidePercent);
      }

      const dailyReturn = prev > 0 ? (curr - prev) / prev : 0;

      if (Math.abs(dailyReturn) > CONFIG.SUSPICIOUS_RETURN_THRESHOLD) {
        let suspiciousHit = CONFIG.SUSPICIOUS_RETURN_SEC_HIT;
        // Media Contact: reduce suspicious return SEC hits by 30%
        if (metaProgression && metaProgression.unlocks.mediaContact) {
          suspiciousHit *= (1 - UNLOCKS.mediaContact.suspiciousReturnReduction);
        }
        this.addAttention(suspiciousHit, 'Unusual returns flagged');
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

    // Offshore Escape: auto-escape at 95+ SEC, once per run
    if (metaProgression && metaProgression.unlocks.offshoreEscape
        && !this.offshoreEscapeUsed
        && this.attention >= UNLOCKS.offshoreEscape.escapeThreshold) {
      this.offshoreEscapeUsed = true;
      this.attention = UNLOCKS.offshoreEscape.resetTo;
      this.frozenAssets = false;
      this.tradeRestricted = false;
      this.updateStage();
      this._offshoreEscapeTriggered = true; // flag for UI notification
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

  // Helper: get SEC hit for illegal actions (reduced by Burner Phone)
  getIllegalSecHit(baseHit) {
    if (this._meta && this._meta.unlocks.burnerPhone) {
      return baseHit * (1 - UNLOCKS.burnerPhone.illegalSecReduction);
    }
    return baseHit;
  }

  // Helper: get profit multiplier for illegal actions (doubled by Cayman Shell Corp)
  getIllegalProfitMult() {
    if (this._meta && this._meta.unlocks.caymanShellCorp) {
      return UNLOCKS.caymanShellCorp.illegalProfitMultiplier;
    }
    return 1;
  }

  doInsiderTrade(market, tradingEngine) {
    const tip = market.generateInsiderTip();
    if (!tip) return null;

    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.insiderTrading.secHit), 'Insider trading detected');
    tradingEngine.stats.illegalActions++;
    this.pendingTips.push(tip);

    return tip;
  }

  doLiborRig(tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.liborRigging.secHit), 'LIBOR manipulation detected');
    tradingEngine.stats.illegalActions++;

    // Guaranteed profit
    const profit = tradingEngine.netWorth * 0.05 * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    return { profit, message: `LIBOR rigged. +${formatMoney(profit)} guaranteed.` };
  }

  doFrontRun(tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.frontRunning.secHit), 'Front running detected');
    tradingEngine.stats.illegalActions++;

    const profit = tradingEngine.netWorth * 0.02 * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    return { profit, message: `Front-ran a large order. +${formatMoney(profit)}` };
  }

  doPumpAndDump(ticker, market, tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.pumpAndDump.secHit), 'Pump & dump scheme detected');
    tradingEngine.stats.illegalActions++;

    const asset = market.getAsset(ticker);
    if (!asset) return null;

    // Pump the price
    const pumpAmount = 0.30 + Math.random() * 0.20; // 30-50% pump
    asset.price *= (1 + pumpAmount);

    const profit = tradingEngine.netWorth * 0.08 * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    // Price will crash next tick
    setTimeout(() => {
      asset.price *= 0.5; // crash 50%
    }, 0);

    return { profit, message: `Pumped ${ticker} +${(pumpAmount * 100).toFixed(0)}%, dumped for +${formatMoney(profit)}` };
  }

  doWashTrade(tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.washTrading.secHit), 'Wash trading detected');
    tradingEngine.stats.illegalActions++;

    const profit = tradingEngine.netWorth * 0.01 * this.getIllegalProfitMult();
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

    let reduction = CONFIG.DONATION_SEC_REDUCTION;

    // Politician on Retainer: donations are 2x more effective
    if (metaProgression && metaProgression.unlocks.politicianRetainer) {
      reduction *= UNLOCKS.politicianRetainer.donationEffectiveness;
    }

    this.attention = Math.max(0, this.attention - reduction);

    const nextCost = CONFIG.DONATION_BASE_COST * Math.pow(CONFIG.DONATION_COST_MULTIPLIER, this.donationCount);

    return {
      success: true,
      message: `Donated ${formatMoney(cost)} to PAC. SEC attention -${reduction.toFixed(0)}. Next donation: ${formatMoney(nextCost)}`,
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

  useFallGuy() {
    if (this.fallGuyUsed) return { success: false, message: 'Already used this run' };
    if (!this._meta || !this._meta.unlocks.fallGuy) return { success: false, message: 'Not unlocked' };

    this.fallGuyUsed = true;
    const reduction = UNLOCKS.fallGuy.secReduction;
    this.attention = Math.max(0, this.attention - reduction);
    this.updateStage();

    return { success: true, message: `Blamed the intern. SEC attention -${reduction}.` };
  }

  useBailFund() {
    if (this.bailFundUsed) return false;
    if (!this._meta || !this._meta.unlocks.bailFund) return false;

    this.bailFundUsed = true;
    // Judge on Retainer: resets to 40 instead of 60
    const resetLevel = (this._meta && this._meta.unlocks.judgeOnRetainer)
      ? UNLOCKS.judgeOnRetainer.bailResetLevel : 60;
    this.attention = resetLevel;
    this.frozenAssets = false;
    this.tradeRestricted = false;
    this.updateStage();
    return true;
  }

  doFakeNews(market, tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.fakeNews.secHit), 'Fake news campaign detected');
    tradingEngine.stats.illegalActions++;

    // Pump a random asset by 15%
    const assets = market.assets.filter(a => market.isAssetLive(a));
    if (assets.length === 0) return null;
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const pumpAmount = ILLEGAL_ACTIONS.fakeNews.profitMultiplier - 1; // 0.15 = 15%
    asset.price *= (1 + pumpAmount);

    const profit = tradingEngine.netWorth * 0.03 * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    return { profit, message: `Planted fake news about ${asset.ticker}. +${formatMoney(profit)}`, ticker: asset.ticker };
  }

  doMoneyLaunder(tradingEngine) {
    const action = ILLEGAL_ACTIONS.moneyLaunder;
    this.addAttention(this.getIllegalSecHit(action.secHit), 'Money laundering detected');
    tradingEngine.stats.illegalActions++;

    // Flat cash bonus
    const profit = action.flatProfit * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    // Also reduces SEC attention
    this.attention = Math.max(0, this.attention - action.secReduction);

    return { profit, message: `Laundered funds through shell companies. +${formatMoney(profit)}, SEC -${action.secReduction}` };
  }

  doPonzi(tradingEngine) {
    this.addAttention(this.getIllegalSecHit(ILLEGAL_ACTIONS.ponzi.secHit), 'Ponzi scheme uncovered');
    tradingEngine.stats.illegalActions++;

    const profit = tradingEngine.netWorth * 0.15 * this.getIllegalProfitMult();
    tradingEngine.cash += profit;

    return { profit, message: `Ponzi scheme paid out. +${formatMoney(profit)}. Investors are getting suspicious...` };
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

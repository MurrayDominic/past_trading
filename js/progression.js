// ============================================================================
// PAST TRADING - Meta Progression & Prestige System
// ============================================================================

class ProgressionSystem {
  constructor() {
    this.data = this.getDefaultData();
  }

  getDefaultData() {
    return {
      prestigePoints: 0,
      totalPrestigeEarned: 0,
      runCount: 0,
      totalArrests: 0,
      unlocks: {},
      equippedTitle: null,
      earnedAchievements: {},
      runHistory: [],
      bestScores: {
        sharpe: 0,
        longestSurvival: 0,
        cleanestProfit: 0,
        brazenProfit: 0,
        speedrunTo1M: Infinity,
      }
    };
  }

  load() {
    try {
      const saved = localStorage.getItem('pastTrading_progression');
      if (saved) {
        this.data = { ...this.getDefaultData(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load progression:', e);
    }
  }

  save() {
    try {
      localStorage.setItem('pastTrading_progression', JSON.stringify(this.data));
    } catch (e) {
      console.warn('Failed to save progression:', e);
    }
  }

  endRun(tradingEngine, secSystem, currentDay, wasArrested) {
    this.data.runCount++;

    if (wasArrested) {
      this.data.totalArrests++;
    }

    // Calculate prestige points earned
    const profit = tradingEngine.netWorth - CONFIG.STARTING_CASH;
    let pp = Math.max(0, profit * CONFIG.PRESTIGE_PER_DOLLAR_EARNED);

    // Clean run bonus
    if (tradingEngine.stats.illegalActions === 0) {
      pp *= CONFIG.PRESTIGE_BONUS_CLEAN_RUN;
    }

    // Survival bonus
    pp += Math.floor(currentDay / 100) * CONFIG.PRESTIGE_BONUS_SURVIVAL;

    // Title bonus (Clean Hands)
    if (this.data.equippedTitle === 'cleanHands') {
      pp *= (1 + ACHIEVEMENTS.cleanHands.titleBonus.prestigeBonus);
    }

    pp = Math.floor(pp * 10) / 10; // round to 1 decimal

    this.data.prestigePoints += pp;
    this.data.totalPrestigeEarned += pp;

    // Record run history
    const runRecord = {
      run: this.data.runCount,
      netWorth: tradingEngine.netWorth,
      profit: profit,
      days: currentDay,
      arrested: wasArrested,
      bankrupt: tradingEngine.stats.wentBankrupt,
      illegalActions: tradingEngine.stats.illegalActions,
      trades: tradingEngine.stats.totalTrades,
      prestigeEarned: pp,
      maxSecAttention: tradingEngine.stats.maxSecAttention,
    };
    this.data.runHistory.push(runRecord);
    if (this.data.runHistory.length > 50) this.data.runHistory.shift();

    // Check achievements
    const stats = {
      ...tradingEngine.stats,
      survived: !wasArrested && !tradingEngine.stats.wentBankrupt,
      totalArrests: this.data.totalArrests,
    };
    const newAchievements = this.checkAchievements(stats);

    // Update best scores
    this.updateBestScores(tradingEngine, currentDay, wasArrested);

    this.save();

    return { pp, runRecord, newAchievements };
  }

  checkAchievements(stats) {
    const newlyEarned = [];

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (this.data.earnedAchievements[id]) continue;

      try {
        if (achievement.check(stats)) {
          this.data.earnedAchievements[id] = true;
          newlyEarned.push({ id, ...achievement });
        }
      } catch (e) {
        // Achievement check failed, skip
      }
    }

    return newlyEarned;
  }

  updateBestScores(tradingEngine, currentDay, wasArrested) {
    // Sharpe ratio (simplified)
    const returns = [];
    const hist = tradingEngine.netWorthHistory;
    for (let i = 1; i < hist.length; i++) {
      if (hist[i - 1] > 0) {
        returns.push((hist[i] - hist[i - 1]) / hist[i - 1]);
      }
    }
    if (returns.length > 1) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
      const std = Math.sqrt(variance);
      const sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0; // annualized
      this.data.bestScores.sharpe = Math.max(this.data.bestScores.sharpe, sharpe);
    }

    // Longest survival
    this.data.bestScores.longestSurvival = Math.max(this.data.bestScores.longestSurvival, currentDay);

    // Cleanest profit (no illegal, highest profit)
    if (tradingEngine.stats.illegalActions === 0) {
      const profit = tradingEngine.netWorth - CONFIG.STARTING_CASH;
      this.data.bestScores.cleanestProfit = Math.max(this.data.bestScores.cleanestProfit, profit);
    }

    // Most brazen (profit before arrest)
    if (wasArrested) {
      const profit = tradingEngine.stats.maxNetWorth - CONFIG.STARTING_CASH;
      this.data.bestScores.brazenProfit = Math.max(this.data.bestScores.brazenProfit, profit);
    }

    // Speedrun to $1M
    if (tradingEngine.stats.maxNetWorth >= 1000000) {
      // Find the day they first hit $1M
      for (let i = 0; i < hist.length; i++) {
        if (hist[i] >= 1000000) {
          this.data.bestScores.speedrunTo1M = Math.min(this.data.bestScores.speedrunTo1M, i);
          break;
        }
      }
    }
  }

  purchaseUnlock(unlockId) {
    const unlock = UNLOCKS[unlockId];
    if (!unlock) return { success: false, message: 'Unknown unlock' };

    if (this.data.unlocks[unlockId]) {
      return { success: false, message: 'Already unlocked' };
    }

    if (unlock.requires && !this.data.unlocks[unlock.requires]) {
      return { success: false, message: `Requires: ${UNLOCKS[unlock.requires].name}` };
    }

    if (this.data.prestigePoints < unlock.cost) {
      return { success: false, message: `Need ${unlock.cost} PP, have ${this.data.prestigePoints.toFixed(1)}` };
    }

    this.data.prestigePoints -= unlock.cost;
    this.data.unlocks[unlockId] = true;
    this.save();

    return { success: true, message: `Unlocked: ${unlock.name}!` };
  }

  equipTitle(titleId) {
    if (!this.data.earnedAchievements[titleId]) {
      return { success: false, message: 'Achievement not earned' };
    }

    const achievement = ACHIEVEMENTS[titleId];
    if (!achievement || !achievement.title) {
      return { success: false, message: 'Not a title' };
    }

    this.data.equippedTitle = titleId;
    this.save();
    return { success: true, message: `Equipped title: ${achievement.name}` };
  }

  unequipTitle() {
    this.data.equippedTitle = null;
    this.save();
  }

  getAvailableModes() {
    const available = [];
    for (const [id, mode] of Object.entries(TRADING_MODES)) {
      if (this.data.runCount >= mode.unlockRun) {
        available.push({ id, ...mode });
      }
    }
    return available;
  }

  getAvailableUnlocks() {
    const available = [];
    for (const [id, unlock] of Object.entries(UNLOCKS)) {
      if (this.data.unlocks[id]) continue;
      if (unlock.requires && !this.data.unlocks[unlock.requires]) continue;
      available.push({ id, ...unlock });
    }
    return available;
  }

  getEquippedTitleBonus() {
    if (!this.data.equippedTitle) return null;
    const achievement = ACHIEVEMENTS[this.data.equippedTitle];
    return achievement ? achievement.titleBonus : null;
  }

  resetProgress() {
    this.data = this.getDefaultData();
    this.save();
  }
}

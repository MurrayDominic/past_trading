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
      unlockedModes: ['stocks'],  // Always start with stocks unlocked
      ownedTools: [],
      equippedTool: null,
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

        // MIGRATION: Convert old runCount-based unlocks to new PP-based system
        if (!this.data.unlockedModes) {
          this.data.unlockedModes = ['stocks']; // Always unlocked

          // Check which modes were unlocked by runCount
          for (const [id, mode] of Object.entries(TRADING_MODES)) {
            if (mode.unlockRun && this.data.runCount >= mode.unlockRun) {
              if (!this.data.unlockedModes.includes(id)) {
                this.data.unlockedModes.push(id);
              }
            }
          }

          console.log('Migrated old save data - unlocked modes:', this.data.unlockedModes);
          this.save();
        }
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

    // Calculate Sharpe ratio
    const sharpe = this.calculateSharpe(tradingEngine.netWorthHistory);

    // Get skill metrics
    const { winRate, maxDrawdown } = tradingEngine.getSkillMetrics();

    // BASE PRESTIGE
    let pp = CONFIG.BASE_PRESTIGE_PER_RUN;

    // SHARPE MULTIPLIER
    // Sharpe 2.0 = 1x, Sharpe 4.0 = 2x, negative Sharpe = 0x
    const sharpeMultiplier = Math.max(0, sharpe / CONFIG.SHARPE_DIVISOR);
    pp *= (1 + sharpeMultiplier);

    // WIN RATE MULTIPLIER
    // 30% win rate = 0x, 50% = 0.6x, 70% = 1.2x
    const winRateAboveBaseline = Math.max(0, winRate - CONFIG.WIN_RATE_BASELINE);
    const winRateMultiplier = winRateAboveBaseline * CONFIG.WIN_RATE_SCALE;
    pp *= (1 + winRateMultiplier);

    // DRAWDOWN BONUS
    // <20% max drawdown = 1.5x multiplier
    if (maxDrawdown < CONFIG.DRAWDOWN_BONUS_THRESHOLD) {
      pp *= CONFIG.DRAWDOWN_BONUS_MULTIPLIER;
    }

    // Title bonus (Clean Hands)
    if (this.data.equippedTitle === 'cleanHands') {
      pp *= (1 + ACHIEVEMENTS.cleanHands.titleBonus.prestigeBonus);
    }

    // Round to 1 decimal
    pp = Math.floor(pp * 10) / 10;

    this.data.prestigePoints += pp;
    this.data.totalPrestigeEarned += pp;

    // Record run with skill metrics
    const profit = tradingEngine.netWorth - CONFIG.STARTING_CASH;
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

      // Skill metrics
      sharpe: sharpe.toFixed(2),
      winRate: (winRate * 100).toFixed(1) + '%',
      maxDrawdown: (maxDrawdown * 100).toFixed(1) + '%',
      winningTrades: tradingEngine.stats.winningTrades,
      losingTrades: tradingEngine.stats.losingTrades,
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

  calculateSharpe(netWorthHistory) {
    const returns = [];
    for (let i = 1; i < netWorthHistory.length; i++) {
      if (netWorthHistory[i - 1] > 0) {
        returns.push((netWorthHistory[i] - netWorthHistory[i - 1]) / netWorthHistory[i - 1]);
      }
    }

    if (returns.length < 2) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    const std = Math.sqrt(variance);

    // Annualized Sharpe (assuming 252 trading days)
    return std > 0 ? (mean / std) * Math.sqrt(252) : 0;
  }

  updateBestScores(tradingEngine, currentDay, wasArrested) {
    // Sharpe ratio
    const sharpe = this.calculateSharpe(tradingEngine.netWorthHistory);
    this.data.bestScores.sharpe = Math.max(this.data.bestScores.sharpe, sharpe);

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

  unlockMode(modeId) {
    const mode = TRADING_MODES[modeId];
    if (!mode) return { success: false, message: 'Unknown mode' };

    // Initialize unlockedModes if needed
    if (!this.data.unlockedModes) {
      this.data.unlockedModes = ['stocks']; // Default mode
    }

    if (this.data.unlockedModes.includes(modeId)) {
      return { success: false, message: 'Already unlocked' };
    }

    const cost = mode.unlockCost || 0;
    if (this.data.prestigePoints < cost) {
      return { success: false, message: `Need ${cost} PP, have ${this.data.prestigePoints.toFixed(1)}` };
    }

    this.data.prestigePoints -= cost;
    this.data.unlockedModes.push(modeId);
    this.save();

    return { success: true, message: `Unlocked: ${mode.name}!`, mode: mode };
  }

  getAvailableModes() {
    // Initialize if needed
    if (!this.data.unlockedModes) {
      this.data.unlockedModes = ['stocks'];
    }

    const available = [];
    for (const [id, mode] of Object.entries(TRADING_MODES)) {
      const isUnlocked = this.data.unlockedModes.includes(id);
      available.push({
        id,
        ...mode,
        unlocked: isUnlocked
      });
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

  purchaseTool(toolId) {
    const tool = EQUIPABLE_TOOLS[toolId];
    if (!tool) return { success: false, message: 'Unknown tool' };

    if (this.data.ownedTools.includes(toolId)) {
      return { success: false, message: 'Already owned' };
    }

    if (tool.requires && !this.data.unlocks[tool.requires]) {
      return { success: false, message: `Requires: ${UNLOCKS[tool.requires].name}` };
    }

    if (this.data.prestigePoints < tool.cost) {
      return { success: false, message: `Need ${tool.cost} PP, have ${this.data.prestigePoints.toFixed(1)}` };
    }

    this.data.prestigePoints -= tool.cost;
    this.data.ownedTools.push(toolId);
    this.save();

    return { success: true, message: `Purchased: ${tool.name}!` };
  }

  equipTool(toolId) {
    if (!this.data.ownedTools.includes(toolId)) {
      return { success: false, message: 'Tool not owned' };
    }

    this.data.equippedTool = toolId;
    this.save();
    return { success: true, message: `Equipped tool: ${EQUIPABLE_TOOLS[toolId].name}` };
  }

  unequipTool() {
    this.data.equippedTool = null;
    this.save();
  }

  resetProgress() {
    this.data = this.getDefaultData();
    this.save();
  }
}

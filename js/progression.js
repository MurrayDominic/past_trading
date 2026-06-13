// ============================================================================
// PAST TRADING - Meta Progression & Prestige System
// ============================================================================

class ProgressionSystem {
  constructor() {
    this.data = this.getDefaultData();
  }

  getDefaultData() {
    return {
      upgradeCredits: 0,
      totalCreditsEarned: 0,
      runCount: 0,
      totalArrests: 0,
      unlocks: {},
      ownedUnlocks: {},
      unlockedModes: ['stocks'],  // Always start with stocks unlocked
      ownedTools: [],
      equippedTool: null,
      equippedTitle: null,
      hideTutorial: false,
      watchlist: [],
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
      // Migrate localStorage to file saves on first Electron launch
      saveManager.migrateFromLocalStorage();

      const savedData = saveManager.load('pastTrading_progression');
      if (savedData) {
        // Bug Fix #34: Deep merge instead of shallow copy for nested objects
        const defaultData = this.getDefaultData();

        // Merge top-level properties
        this.data = { ...defaultData, ...savedData };

        // Deep merge nested objects (unlocks, bestScores, etc.)
        if (savedData.unlocks) {
          this.data.unlocks = { ...defaultData.unlocks, ...savedData.unlocks };
        }
        if (savedData.ownedUnlocks) {
          this.data.ownedUnlocks = { ...defaultData.ownedUnlocks, ...savedData.ownedUnlocks };
        }
        if (savedData.bestScores) {
          this.data.bestScores = { ...defaultData.bestScores, ...savedData.bestScores };
        }

        // MIGRATION: Backfill ownedUnlocks from unlocks for existing saves
        if (!savedData.ownedUnlocks && savedData.unlocks) {
          this.data.ownedUnlocks = { ...savedData.unlocks };
          this.save();
        }

        // MIGRATION: Convert old prestigePoints to upgradeCredits
        if (savedData.prestigePoints !== undefined && savedData.upgradeCredits === undefined) {
          this.data.upgradeCredits = (savedData.prestigePoints || 0) * 10000;
          this.data.totalCreditsEarned = (savedData.totalPrestigeEarned || 0) * 10000;
          console.log('Migrated prestigePoints to upgradeCredits:', this.data.upgradeCredits);
          this.save();
        }

        // Bug Fix #12: bestScores migration already handled by deep merge above

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

        // MIGRATION: Give existing players some category unlocks
        if (!this.data.unlocks.hasOwnProperty('financeStocks') && this.data.runCount >= 3) {
          // Auto-unlock first few categories for veteran players
          this.data.unlocks.financeStocks = true;
          this.data.unlocks.healthcareStocks = true;
          console.log('Migrated save: unlocked finance and healthcare sectors');
          this.save();
        }

        // MIGRATION: Move old tutorial flag into progression data
        const oldTutorialFlag = saveManager.load('pastTrading_hideTutorial');
        if (oldTutorialFlag) {
          this.data.hideTutorial = true;
          saveManager.remove('pastTrading_hideTutorial');
          this.save();
        }
      }
    } catch (e) {
      console.warn('Failed to load progression:', e);
    }
  }

  save() {
    try {
      saveManager.save('pastTrading_progression', this.data);
    } catch (e) {
      console.warn('Failed to save progression:', e);
    }
  }

  endRun(tradingEngine, secSystem, currentDay, wasArrested, quarterlySystem = null) {
    this.data.runCount++;

    if (wasArrested) {
      this.data.totalArrests++;
    }

    // Calculate Sharpe ratio (still used for display/achievements)
    const sharpe = this.calculateSharpe(tradingEngine.netWorthHistory);

    // Get skill metrics (still used for display/achievements)
    const { winRate, maxDrawdown } = tradingEngine.getSkillMetrics();

    // Credits earned = net worth profit above starting cash
    const profit = tradingEngine.netWorth - CONFIG.STARTING_CASH;
    let creditsEarned = Math.max(0, profit);

    // Golden Parachute: 50% bonus credits when fired for missing quarterly targets
    if (quarterlySystem && quarterlySystem.fired && this.data.unlocks.goldenParachute) {
      creditsEarned *= 1.5;
    }

    // Dead Man's Switch: 50% bonus credits when arrested
    if (wasArrested && this.data.unlocks.deadMansSwitch) {
      creditsEarned *= (1 + UNLOCKS.deadMansSwitch.ppBonus);
    }

    // Title bonus (prestigeBonus applies to credits)
    if (this.data.equippedTitle) {
      const achievement = ACHIEVEMENTS[this.data.equippedTitle];
      if (achievement && achievement.titleBonus && achievement.titleBonus.prestigeBonus) {
        creditsEarned *= (1 + achievement.titleBonus.prestigeBonus);
      }
    }

    creditsEarned = Math.floor(creditsEarned);

    this.data.upgradeCredits += creditsEarned;
    this.data.totalCreditsEarned += creditsEarned;

    // Record run with skill metrics
    const runRecord = {
      run: this.data.runCount,
      netWorth: tradingEngine.netWorth,
      profit: profit,
      days: currentDay,
      arrested: wasArrested,
      bankrupt: tradingEngine.stats.wentBankrupt,
      illegalActions: tradingEngine.stats.illegalActions,
      trades: tradingEngine.stats.totalTrades,
      creditsEarned: creditsEarned,
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

    return { creditsEarned, runRecord, newAchievements };
  }

  checkAchievements(stats) {
    const newlyEarned = [];

    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (this.data.earnedAchievements[id]) continue;

      try {
        if (achievement.check(stats)) {
          this.data.earnedAchievements[id] = true;
          newlyEarned.push({ id, ...achievement });

          // Fire Steam achievement if available
          if (window.electronAPI && window.electronAPI.steam) {
            window.electronAPI.steam.unlockAchievement(id);
          }
        }
      } catch (e) {
        // Bug Fix #20: Log achievement check failures for debugging
        console.warn(`Achievement check failed for ${id}:`, e.message);
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

    // Bug Fix #1: Undefined variable - use tradingEngine.netWorthHistory
    // Speedrun to $1M
    if (tradingEngine.stats.maxNetWorth >= 1000000) {
      // Find the day they first hit $1M
      for (let i = 0; i < tradingEngine.netWorthHistory.length; i++) {
        if (tradingEngine.netWorthHistory[i] >= 1000000) {
          this.data.bestScores.speedrunTo1M = Math.min(this.data.bestScores.speedrunTo1M, i);
          break;
        }
      }
    }
  }

  purchaseUnlock(unlockId) {
    const unlock = UNLOCKS[unlockId];
    if (!unlock) return { success: false, message: 'Unknown unlock' };

    if (this.data.ownedUnlocks[unlockId]) {
      return { success: false, message: 'Already owned' };
    }

    if (unlock.requires && !this.data.ownedUnlocks[unlock.requires]) {
      return { success: false, message: `Requires: ${UNLOCKS[unlock.requires].name}` };
    }

    if ((this.data.upgradeCredits || 0) < unlock.cost) {
      return { success: false, message: `Need ${formatMoney(unlock.cost)}, have ${formatMoney(this.data.upgradeCredits || 0)}` };
    }

    this.data.upgradeCredits -= unlock.cost;
    this.data.ownedUnlocks[unlockId] = true;
    this.data.unlocks[unlockId] = true;

    this.save();

    return { success: true, message: `Unlocked: ${unlock.name}!` };
  }

  toggleEquip(unlockId) {
    if (!this.data.ownedUnlocks[unlockId]) {
      return { success: false, message: 'Not owned' };
    }

    if (this.data.unlocks[unlockId]) {
      // Unequip
      delete this.data.unlocks[unlockId];
      this.save();
      return { success: true, equipped: false };
    } else {
      // Equip - check that prerequisites are still equipped
      const unlock = UNLOCKS[unlockId];
      if (unlock && unlock.requires && !this.data.unlocks[unlock.requires]) {
        return { success: false, message: `Requires ${UNLOCKS[unlock.requires].name} to be equipped` };
      }
      this.data.unlocks[unlockId] = true;
      this.save();
      return { success: true, equipped: true };
    }
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
    if ((this.data.upgradeCredits || 0) < cost) {
      return { success: false, message: `Need ${formatMoney(cost)}, have ${formatMoney(this.data.upgradeCredits || 0)}` };
    }

    this.data.upgradeCredits -= cost;
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

    if ((this.data.upgradeCredits || 0) < tool.cost) {
      return { success: false, message: `Need ${formatMoney(tool.cost)}, have ${formatMoney(this.data.upgradeCredits || 0)}` };
    }

    this.data.upgradeCredits -= tool.cost;
    this.data.ownedTools.push(toolId);
    this.save();

    return { success: true, message: `Purchased: ${tool.name}!` };
  }

  equipTool(toolId) {
    // Bug Fix #30/#35: Validate tool exists and is owned
    const tool = EQUIPABLE_TOOLS[toolId];
    if (!tool) {
      return { success: false, message: 'Unknown tool' };
    }

    if (!this.data.ownedTools.includes(toolId)) {
      return { success: false, message: 'Tool not owned' };
    }

    this.data.equippedTool = toolId;
    this.save();
    return { success: true, message: `Equipped tool: ${tool.name}` };
  }

  unequipTool() {
    this.data.equippedTool = null;
    this.save();
  }

  resetProgress() {
    this.data = this.getDefaultData();
    this.save();
  }

  // Check if a stock category is unlocked
  isCategoryUnlocked(category) {
    const categoryConfig = STOCK_CATEGORIES[category];
    if (!categoryConfig) return false;
    if (categoryConfig.unlocked) return true;  // Default unlocked

    // Find unlock that unlocks this category
    const unlockKey = Object.keys(UNLOCKS).find(key =>
      UNLOCKS[key].unlocksCategory === category
    );
    return unlockKey && this.data.unlocks[unlockKey];
  }

  // Get all unlocked categories
  getUnlockedCategories() {
    return Object.keys(STOCK_CATEGORIES).filter(cat =>
      this.isCategoryUnlocked(cat)
    );
  }
}

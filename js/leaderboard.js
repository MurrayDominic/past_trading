// ============================================================================
// PAST TRADING - Leaderboard System
// ============================================================================

class LeaderboardSystem {
  constructor() {
    this.boards = {
      riskAdjusted: [],    // Best Sharpe ratio
      longestSurvival: [],  // Most days
      cleanestRun: [],      // Best profit, no illegal
      mostBrazen: [],       // Best profit before arrest
      speedrun: [],         // Fastest to $1M
    };
  }

  load() {
    try {
      const saved = localStorage.getItem('pastTrading_leaderboards');
      if (saved) {
        this.boards = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load leaderboards:', e);
    }
  }

  save() {
    try {
      localStorage.setItem('pastTrading_leaderboards', JSON.stringify(this.boards));
    } catch (e) {
      console.warn('Failed to save leaderboards:', e);
    }
  }

  submitRun(tradingEngine, currentDay, wasArrested, runNumber) {
    const netWorth = tradingEngine.netWorth;
    const profit = netWorth - CONFIG.STARTING_CASH;
    const stats = tradingEngine.stats;
    const hist = tradingEngine.netWorthHistory;

    // Calculate Sharpe ratio
    const returns = [];
    for (let i = 1; i < hist.length; i++) {
      if (hist[i - 1] > 0) {
        returns.push((hist[i] - hist[i - 1]) / hist[i - 1]);
      }
    }
    let sharpe = 0;
    if (returns.length > 1) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
      const std = Math.sqrt(variance);
      sharpe = std > 0 ? (mean / std) * Math.sqrt(252) : 0;
    }

    const entry = {
      run: runNumber,
      date: new Date().toLocaleDateString(),
    };

    // Risk-adjusted return
    this.addEntry('riskAdjusted', { ...entry, score: sharpe, display: `Sharpe: ${sharpe.toFixed(2)}` }, (a, b) => b.score - a.score);

    // Longest survival
    this.addEntry('longestSurvival', { ...entry, score: currentDay, display: `${currentDay} days` }, (a, b) => b.score - a.score);

    // Cleanest run
    if (stats.illegalActions === 0) {
      this.addEntry('cleanestRun', { ...entry, score: profit, display: formatMoney(profit) }, (a, b) => b.score - a.score);
    }

    // Most brazen
    if (wasArrested) {
      this.addEntry('mostBrazen', { ...entry, score: stats.maxNetWorth, display: formatMoney(stats.maxNetWorth) }, (a, b) => b.score - a.score);
    }

    // Speedrun to $1M
    if (stats.maxNetWorth >= 1000000) {
      let dayTo1M = hist.length;
      for (let i = 0; i < hist.length; i++) {
        if (hist[i] >= 1000000) { dayTo1M = i; break; }
      }
      this.addEntry('speedrun', { ...entry, score: dayTo1M, display: `${dayTo1M} days to $1M` }, (a, b) => a.score - b.score);
    }

    this.save();
  }

  addEntry(board, entry, sortFn) {
    this.boards[board].push(entry);
    this.boards[board].sort(sortFn);
    if (this.boards[board].length > CONFIG.MAX_LEADERBOARD_ENTRIES) {
      this.boards[board] = this.boards[board].slice(0, CONFIG.MAX_LEADERBOARD_ENTRIES);
    }
  }

  getBoard(boardName) {
    return this.boards[boardName] || [];
  }

  getBoardNames() {
    return {
      riskAdjusted: 'Best Risk-Adjusted Return',
      longestSurvival: 'Longest Survival',
      cleanestRun: 'Cleanest Run (No Crime)',
      mostBrazen: 'Most Brazen (Before Arrest)',
      speedrun: 'Speedrun to $1M',
    };
  }
}

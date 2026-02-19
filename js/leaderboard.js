// ============================================================================
// PAST TRADING - Leaderboard System
// ============================================================================

class LeaderboardSystem {
  constructor() {
    this.boards = {
      highScore: [],    // Personal best net worth
    };
  }

  load() {
    try {
      const parsed = saveManager.load('pastTrading_leaderboards');
      if (parsed) {
        // Migration: if old format, keep highScore or convert longestSurvival
        if (parsed.highScore) {
          this.boards = { highScore: parsed.highScore };
        } else {
          // Old save - start fresh
          this.boards = { highScore: [] };
        }
      }
    } catch (e) {
      console.warn('Failed to load leaderboards:', e);
    }
  }

  save() {
    try {
      saveManager.save('pastTrading_leaderboards', this.boards);
    } catch (e) {
      console.warn('Failed to save leaderboards:', e);
    }
  }

  submitRun(tradingEngine, currentDay, wasArrested, runNumber) {
    const netWorth = tradingEngine.netWorth;
    const profit = netWorth - CONFIG.STARTING_CASH;
    const stats = tradingEngine.stats;

    const entry = {
      run: runNumber,
      date: new Date().toLocaleDateString(),
    };

    // Personal high score by net worth
    this.addEntry('highScore', {
      ...entry,
      score: netWorth,
      display: formatMoney(netWorth),
      profit: formatMoney(profit),
      days: currentDay,
    }, (a, b) => b.score - a.score);

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
      highScore: 'Personal High Scores',
    };
  }

  getRankForScore(score, boardName) {
    const board = this.boards[boardName || 'highScore'] || [];
    if (board.length === 0) return { rank: null, isRanked: false };

    // Find position in sorted board (descending - higher is better)
    let rank = 1;
    for (const entry of board) {
      if (score > entry.score) break;
      rank++;
    }

    const isRanked = rank <= CONFIG.MAX_LEADERBOARD_ENTRIES;
    const minScore = board.length >= CONFIG.MAX_LEADERBOARD_ENTRIES
      ? board[CONFIG.MAX_LEADERBOARD_ENTRIES - 1].score
      : null;

    return { rank, isRanked, minScore, total: board.length };
  }
}

// ============================================================================
// PAST TRADING - Main Game Controller
// ============================================================================

class Game {
  constructor() {
    this.market = new Market();
    this.trading = new TradingEngine();
    this.sec = new SECSystem();
    this.news = new NewsSystem();
    this.progression = new ProgressionSystem();
    this.leaderboard = new LeaderboardSystem();
    this.dataLoader = new DataLoader();
    this.audio = new AudioEngine();
    this.ui = null; // set after UI init

    this.state = 'menu';     // menu | playing | paused | runEnd | loading
    this.currentDay = 0;
    this.totalDays = CONFIG.DEFAULT_RUN_DAYS;
    this.speed = 1;
    this.tickInterval = null;
    this.selectedMode = 'stocks';
    this.selectedAsset = null;

    this.pendingInsiderTips = [];
    this.activeInsiderTip = null;
    this.pendingInsiderDecision = null;

    this.runEndReason = '';
    this.lastNetWorth = 0;
  }

  init() {
    this.progression.load();
    this.leaderboard.load();
    this.ui = new GameUI(this);
    this.ui.init();

    // Initialize audio engine
    this.audio.init();

    this.showMenu();
  }

  showMenu() {
    this.state = 'menu';
    this.stopTicker();
    this.ui.showMenu();
  }

  async startRun(mode) {
    this.selectedMode = mode;
    this.currentDay = 0;
    this.totalDays = CONFIG.DEFAULT_RUN_DAYS;
    this.speed = 1;
    this.runEndReason = '';
    this.pendingInsiderTips = [];
    this.activeInsiderTip = null;
    this.lastNetWorth = CONFIG.STARTING_CASH;

    // Show loading screen
    this.state = 'loading';
    this.ui.showLoading();

    try {
      // Load news events
      await this.dataLoader.loadNewsEvents();

      // Init subsystems (market.init is now async)
      await this.market.init(mode, this.dataLoader);
      this.trading.init(CONFIG.STARTING_CASH, this.progression.data);
      this.sec.init();
      this.news.init(this.dataLoader);

      // Select first asset
      const assets = this.market.getAllAssets();
      this.selectedAsset = assets.length > 0 ? assets[0].ticker : null;

      // Start audio
      this.audio.resume();
      this.audio.startMusic();

      this.state = 'playing';
      this.ui.showGame();
      this.ui.update(this);
      this.startTicker();
    } catch (error) {
      console.error('Failed to start run:', error);
      alert('Failed to load game data. Please refresh and try again.');
      this.showMenu();
    }
  }

  startTicker() {
    this.stopTicker();
    const ms = CONFIG.TICK_MS / this.speed;
    this.tickInterval = setInterval(() => this.tick(), ms);
  }

  stopTicker() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  setSpeed(speed) {
    this.speed = speed;
    if (this.state === 'playing') {
      this.startTicker();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      this.stopTicker();
      this.ui.showPauseOverlay(true);
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.startTicker();
      this.ui.showPauseOverlay(false);
    }
  }

  tick() {
    if (this.state !== 'playing') return;

    this.currentDay++;

    // Market tick
    this.market.tick();

    // Passive income for scalping/arb/market-making modes
    const passiveIncome = this.trading.processPassiveIncome(this.selectedMode, this.progression.data);
    if (passiveIncome > 0) {
      this.news.addTradeNews(`Passive income: +${formatMoney(passiveIncome)}`, this.currentDay);
    }

    // Update positions
    this.trading.updatePositions(this.market, this.currentDay);

    // Audio feedback based on net worth changes
    const currentNetWorth = this.trading.netWorth;
    const netWorthChange = currentNetWorth - this.lastNetWorth;
    const percentChange = this.lastNetWorth > 0 ? netWorthChange / this.lastNetWorth : 0;

    if (percentChange >= 0.05 && percentChange < 0.10) {
      this.audio.playSmallGain();
    }
    if (percentChange >= 0.10 || netWorthChange >= 10000) {
      this.audio.playWinningSound();
    }
    if (percentChange <= -0.08) {
      this.audio.playLossSound();
    }

    this.lastNetWorth = currentNetWorth;

    // Update music intensity
    this.audio.updateMusicIntensity(this.totalDays - this.currentDay, this.totalDays);

    // SEC tick
    const arrested = this.sec.tick(this.trading, this.market, this.progression.data);

    // News tick
    this.news.tick(this.currentDay, this.market, this.sec);

    // Milestone news
    this.news.addMilestoneNews(this.trading.netWorth, this.currentDay);

    // Check run-end conditions
    if (arrested) {
      this.endRun('arrested');
      return;
    }

    if (this.trading.stats.wentBankrupt) {
      this.endRun('bankrupt');
      return;
    }

    if (this.currentDay >= this.totalDays) {
      this.endRun('timeUp');
      return;
    }

    // Update UI
    this.ui.update(this);
  }

  endRun(reason) {
    this.stopTicker();
    this.audio.stopMusic();
    this.state = 'runEnd';
    this.runEndReason = reason;

    // Mark survival
    this.trading.stats.survived = (reason === 'timeUp');

    // Process progression
    const result = this.progression.endRun(
      this.trading,
      this.sec,
      this.currentDay,
      reason === 'arrested'
    );

    // Submit to leaderboard
    this.leaderboard.submitRun(
      this.trading,
      this.currentDay,
      reason === 'arrested',
      this.progression.data.runCount
    );

    // Get ranking
    const ranking = this.leaderboard.getRankForScore(this.trading.netWorth, 'longestSurvival');

    this.ui.showRunEnd(this, result, ranking);
  }

  // --- Player Actions ---

  buyAsset(quantity) {
    if (this.state !== 'playing' || !this.selectedAsset) return;
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    const result = this.trading.buy(
      this.selectedAsset, quantity, this.market,
      this.progression.data, this.currentDay
    );

    if (result.success) {
      this.audio.playTradeClick();
      this.news.addTradeNews(result.message, this.currentDay);

      // SEC watches large trades
      const asset = this.market.getAsset(this.selectedAsset);
      if (asset && asset.price * quantity > this.trading.netWorth * 0.3) {
        this.sec.addAttention(1, 'Large position opened');
      }
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  sellPosition(index) {
    if (this.state !== 'playing') return;
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    const result = this.trading.sell(
      this.selectedAsset, index, this.market,
      this.progression.data, this.currentDay
    );

    if (result.success) {
      this.audio.playTradeClick();
      this.news.addTradeNews(result.message, this.currentDay);

      // Suspicious timing with events
      if (this.market.activeEvent && result.profit > 0) {
        this.sec.addAttention(2, 'Suspiciously timed trade');
      }
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  shortAsset(quantity) {
    if (this.state !== 'playing' || !this.selectedAsset) return;
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    const result = this.trading.short(
      this.selectedAsset, quantity, this.market,
      this.progression.data, this.currentDay
    );

    if (result.success) {
      this.audio.playTradeClick();
      this.news.addTradeNews(result.message, this.currentDay);
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  doInsiderTrade() {
    if (this.state !== 'playing') return;
    if (!this.sec.canDoIllegalAction('insiderTrading', this.progression.data, this.progression.data.runCount)) {
      return;
    }

    // Generate tip without applying SEC hit yet
    const assets = this.market.getAllAssets();
    if (assets.length === 0) return;

    const asset = assets[Math.floor(Math.random() * assets.length)];
    const direction = Math.random() > 0.5 ? 'up' : 'down';
    const magnitude = 10 + Math.random() * 15; // 10-25%
    const daysUntil = 3 + Math.floor(Math.random() * 5); // 3-7 days

    const tip = {
      ticker: asset.ticker,
      direction,
      magnitude,
      daysUntil,
      dayReceived: this.currentDay,
      text: `${asset.ticker} will move ${direction} ${magnitude.toFixed(0)}% in ${daysUntil} days`
    };

    // Pause game and show modal
    if (this.state === 'playing') {
      this.togglePause();
    }

    this.ui.showInsiderModal(tip);
  }

  acceptInsiderTip(tip) {
    this.audio.playIllegalAction();

    // Apply SEC hit
    this.sec.addAttention(CONFIG.INSIDER_TRADE_SEC_HIT, 'Insider trading');
    this.trading.stats.illegalActions++;

    // Add tip to pending
    this.pendingInsiderTips.push(tip);
    this.activeInsiderTip = tip;

    this.news.addSecNews(`INSIDER TIP: ${tip.text}`, this.currentDay);

    // Resume game
    if (this.state === 'paused') {
      this.togglePause();
    }

    this.ui.hideInsiderModal();
    this.ui.update(this);
  }

  ignoreInsiderTip() {
    // Just resume game
    if (this.state === 'paused') {
      this.togglePause();
    }

    this.ui.hideInsiderModal();
  }

  doLiborRig() {
    if (this.state !== 'playing') return;
    if (!this.sec.canDoIllegalAction('liborRigging', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doLiborRig(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  doPumpAndDump() {
    if (this.state !== 'playing' || !this.selectedAsset) return;
    if (!this.sec.canDoIllegalAction('pumpAndDump', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doPumpAndDump(this.selectedAsset, this.market, this.trading);
    if (result) {
      this.news.addSecNews(result.message, this.currentDay);
    }
    this.ui.update(this);
  }

  doWashTrade() {
    if (this.state !== 'playing') return;
    if (!this.sec.canDoIllegalAction('washTrading', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doWashTrade(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  doFrontRun() {
    if (this.state !== 'playing') return;
    if (!this.sec.canDoIllegalAction('frontRunning', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doFrontRun(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  makeDonation() {
    if (this.state !== 'playing') return;
    if (!this.progression.data.unlocks.politicalDonations) return;

    const result = this.sec.makeDonation(this.trading, this.progression.data);
    if (result.success) {
      this.news.addNews(
        SATIRICAL_NEWS[Math.floor(Math.random() * SATIRICAL_NEWS.length)],
        'satirical',
        this.currentDay
      );
    }
    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  getCurrentDate() {
    const startDate = new Date(CONFIG.GAME_START_DATE);
    const currentDate = new Date(startDate.getTime() + this.currentDay * 24 * 60 * 60 * 1000);
    return currentDate;
  }

  selectAsset(ticker) {
    this.selectedAsset = ticker;

    // Auto-manage chart tabs when asset is selected
    if (this.ui.chartManager && this.state === 'playing') {
      // Check if chart tab already exists for this ticker
      const existingTab = this.ui.chartManager.tabs.find(t => t.ticker === ticker);

      if (existingTab) {
        // Switch to existing tab
        this.ui.chartManager.setActiveTab(existingTab.id);
      } else {
        // Create new tab for this asset
        this.ui.chartManager.addTab(ticker, 'line');
      }
    }

    this.ui.update(this);
  }

  purchaseUnlock(unlockId) {
    const result = this.progression.purchaseUnlock(unlockId);
    return result;
  }

  equipTitle(titleId) {
    return this.progression.equipTitle(titleId);
  }

  exitToMenu() {
    if (this.state !== 'playing' && this.state !== 'paused') return;

    if (confirm('Exit to menu? Current progress will be lost.')) {
      this.stopTicker();
      this.audio.stopMusic();
      this.showMenu();
    }
  }
}

// ============================================================================
// Boot
// ============================================================================

let game;

window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  game.init();
});

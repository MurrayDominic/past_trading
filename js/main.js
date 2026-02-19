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
    this.quarterly = new QuarterlyTargetSystem();
    this.ui = null; // set after UI init

    this.state = 'menu';     // menu | playing | paused | runEnd | loading
    this.currentDay = 0;
    this.totalDays = CONFIG.DEFAULT_RUN_DAYS;
    this.speed = 1;
    this.tickInterval = null;
    this.selectedMode = 'stocks';
    this.selectedAsset = null;
    this.selectedYears = { start: 2008, end: 2009 }; // Default: 2-year fixed run

    // Intraday time tracking
    this.isIntraday = false;
    this.currentMinute = 0;
    this.currentTime = null;

    this.pendingInsiderTips = [];
    this.activeInsiderTip = null;
    this.pendingInsiderDecision = null;

    this.runEndReason = '';
    this.lastNetWorth = 0;

    // Animation tracking
    this.rocketShown = false;    // Rocket at $10k
    this.confettiShown = false;  // Confetti at $1B
  }

  // Bug Fix #37: Centralized state checking helpers to reduce duplication
  isPlaying() {
    return this.state === 'playing';
  }

  isPlayingOrPaused() {
    return this.state === 'playing' || this.state === 'paused';
  }

  canTrade() {
    return this.state === 'playing' && !this.sec.tradeRestricted;
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
    // Bug Fix #6: Race condition - prevent concurrent startRun calls
    if (this.state === 'loading') {
      console.warn('Already loading, ignoring duplicate startRun');
      return;
    }

    // Stop any existing ticker first
    this.stopTicker();

    this.selectedMode = mode;
    this.currentDay = 0;
    this.speed = 1;
    this.runEndReason = '';
    this.pendingInsiderTips = [];
    this.activeInsiderTip = null;
    this.lastNetWorth = CONFIG.STARTING_CASH;

    // Reset speed button UI to 1x
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.classList.remove('active');
      if (parseFloat(btn.dataset.speed) === 1) {
        btn.classList.add('active');
      }
    });

    // Check if intraday mode
    this.isIntraday = (mode === 'dayTrading');

    if (this.isIntraday) {
      this.currentMinute = 0;
      this.totalDays = 1;  // Single day
      this.currentTime = new Date();
      this.currentTime.setHours(CONFIG.MARKET_OPEN_HOUR, CONFIG.MARKET_OPEN_MINUTE, 0, 0);
    } else {
      // Calculate extra years from "Time in the Market" unlocks
      let extraYears = 0;
      if (this.progression.data.unlocks.timeInMarket3) extraYears = 3;
      else if (this.progression.data.unlocks.timeInMarket2) extraYears = 2;
      else if (this.progression.data.unlocks.timeInMarket1) extraYears = 1;

      const runYears = CONFIG.FIXED_RUN_YEARS + extraYears;
      this.totalDays = runYears * 365;
      this.currentTime = null;

      // Update end year to match actual run length
      this.selectedYears.end = this.selectedYears.start + runYears - 1;

      console.log(`Starting ${runYears}-year run (${this.totalDays} days): ${this.selectedYears.start}-${this.selectedYears.end}`);
    }

    // Show loading screen
    this.state = 'loading';
    this.ui.showLoading();

    // Bug Fix #26: Add timeout wrapper for async initialization
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Loading timeout after 30 seconds')), 30000)
    );

    try {
      // Load news events with timeout
      await Promise.race([
        this.dataLoader.loadNewsEvents(),
        timeoutPromise
      ]);

      // Init subsystems (market.init is now async) with timeout
      // Pass selected year range from year selection UI
      await Promise.race([
        this.market.init(mode, this.dataLoader, this.progression, this.selectedYears.start, this.selectedYears.end),
        timeoutPromise
      ]);
      this.trading.init(CONFIG.STARTING_CASH, this.progression.data);
      // Extra years are added at the START as a head start before targets begin
      let extraYearDays = 0;
      if (this.progression.data.unlocks.timeInMarket3) extraYearDays = 3 * 365;
      else if (this.progression.data.unlocks.timeInMarket2) extraYearDays = 2 * 365;
      else if (this.progression.data.unlocks.timeInMarket1) extraYearDays = 1 * 365;
      this.quarterly.init(CONFIG.STARTING_CASH, extraYearDays);
      this.sec.init();
      this.news.init(this.dataLoader);

      // Bug Fix #25: Validate assets loaded before selecting
      const assets = this.market.getAllAssets();
      if (assets.length === 0) {
        throw new Error('No assets loaded for mode: ' + mode);
      }
      this.selectedAsset = assets[0].ticker;

      // Reset animation flags
      this.rocketShown = false;
      this.confettiShown = false;

      // Start audio
      this.audio.resume();
      this.audio.startMusic();

      this.state = 'playing';
      this.ui.showGame();
      this.ui.update(this);

      // Show tutorial popup if user hasn't dismissed it
      if (!this.progression.data.hideTutorial) {
        this.showTutorial();
      } else {
        this.startTicker();
      }
    } catch (error) {
      console.error('Failed to start run:', error);
      alert('Failed to load game data. Please refresh and try again.');
      this.showMenu();
    }
  }

  startTicker() {
    // Bug Fix #7: Memory leak - always stop existing ticker first
    this.stopTicker();

    // Don't start if not in playing state
    if (this.state !== 'playing') {
      console.warn('startTicker called in non-playing state:', this.state);
      return;
    }

    // Use intraday tick rate for day trading
    const baseTickMs = this.isIntraday ? CONFIG.INTRADAY_TICK_MS : CONFIG.TICK_MS;
    const ms = baseTickMs / this.speed;
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
    // Bug Fix #7 & #29: Explicitly stop ticker before restarting to prevent memory leak
    if (this.isPlaying()) {
      this.stopTicker();
      this.startTicker();
    }
  }

  togglePause() {
    // Bug Fix #8: Pause logic - only allow pause/unpause during active run
    if (this.isPlaying()) {
      this.state = 'paused';
      this.stopTicker();
      this.ui.showPauseOverlay(true);
      return true;
    } else if (this.state === 'paused') {
      this.state = 'playing';
      this.startTicker();
      this.ui.showPauseOverlay(false);
      return true;
    }

    // Invalid state for pause
    console.warn('togglePause called in invalid state:', this.state);
    return false;
  }

  tick() {
    if (!this.isPlaying()) return;  // Bug Fix #37

    if (this.isIntraday) {
      this.tickIntraday();
    } else {
      this.tickDaily();
    }
  }

  tickDaily() {
    this.currentDay++;

    // Market tick
    this.market.tick();

    // Passive income for scalping/arb/market-making modes
    // Bug Fix #15: Pass isIntraday flag to scale passive income correctly
    const passiveIncome = this.trading.processPassiveIncome(this.selectedMode, this.progression.data, false);
    if (passiveIncome > 0) {
      this.news.addTradeNews(`Passive income: +${formatMoney(passiveIncome)}`, this.currentDay);
    }

    // Update positions
    this.trading.updatePositions(this.market, this.currentDay);

    // Bug Fix #43: Show liquidation notifications
    if (this.trading.recentLiquidations && this.trading.recentLiquidations.length > 0) {
      for (const liq of this.trading.recentLiquidations) {
        this.news.addSecNews(`MARGIN CALL: ${liq.ticker} ${liq.type} position liquidated (-${formatMoney(liq.loss)})`, this.currentDay);
      }
    }

    // Check risk limit (pass metaProgression for Risk Immunity)
    if (this.trading.isOverRiskLimit(this.market, this.progression.data)) {
      this.endRun('fired');
      return;
    }

    // Quarterly target check (net worth thresholds - pass instantly when hit)
    const quarterResult = this.quarterly.tick(this.currentDay, this.trading.netWorth);
    if (quarterResult.fired) {
      this.news.addSecNews(
        `MISSED QUARTERLY TARGET - Needed ${formatMoney(quarterResult.failInfo.target)} net worth, had ${formatMoney(quarterResult.failInfo.netWorth)}`,
        this.currentDay
      );
      this.endRun('quarterFail');
      return;
    }
    if (quarterResult.levelUp) {
      const info = quarterResult.levelUpInfo;
      if (info.allComplete) {
        this.news.addNews(`ALL 8 QUARTERLY TARGETS COMPLETE! Bonus: +${info.bonusPP} Pts`, 'milestone', this.currentDay);
      } else {
        this.news.addNews(
          `NET WORTH TARGET HIT! Level ${info.level} complete (+${info.pp} Pts). Next: reach ${formatMoney(this.quarterly.getCurrentTarget().target)}`,
          'milestone', this.currentDay
        );
      }
    }

    // Audio feedback based on net worth changes
    const currentNetWorth = this.trading.netWorth;
    const netWorthChange = currentNetWorth - this.lastNetWorth;
    const percentChange = this.lastNetWorth > 0 ? netWorthChange / this.lastNetWorth : 0;

    // Floating text for significant P&L changes
    if (Math.abs(netWorthChange) >= 1000) {
      this.ui.spawnFloatingPnL(netWorthChange);
    }

    if (percentChange >= 0.05 && percentChange < 0.10) {
      this.audio.playSmallGain();
    }
    if (percentChange >= 0.10 || netWorthChange >= 10000) {
      this.audio.playWinningSound();
    }
    if (percentChange <= -0.08) {
      this.audio.playLossSound();
    }

    // Rocket ship when net worth first crosses $10k (only if they started below)
    if (!this.rocketShown && currentNetWorth >= 10000) {
      // Only trigger if starting cash was below $10k (otherwise it's meaningless)
      const startingCash = this.trading.netWorthHistory[0] || CONFIG.STARTING_CASH;
      if (startingCash < 10000 || this.lastNetWorth < 10000) {
        this.rocketShown = true;
        this.spawnRocket();
      } else {
        this.rocketShown = true; // Skip silently if they started at/above 10k
      }
    }

    // Confetti at $1B net worth
    if (!this.confettiShown && currentNetWorth >= 1000000000) {
      this.confettiShown = true;
      this.spawnConfetti();
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
      // Bail Fund: survive one arrest per run
      if (this.sec.useBailFund()) {
        this.news.addSecNews('BAIL POSTED! Your lawyers got you out. SEC attention reset to 60%.', this.currentDay);
      } else {
        this.endRun('arrested');
        return;
      }
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

  tickIntraday() {
    this.currentMinute++;

    // Advance time by 1 game minute
    this.currentTime.setMinutes(this.currentTime.getMinutes() + 1);

    // Market tick with intraday volatility
    if (this.market.tickIntraday) {
      this.market.tickIntraday(this.currentMinute);
    }

    // Passive income (scaled for intraday)
    // Bug Fix #15: Pass isIntraday=true to scale passive income correctly
    const passiveIncome = this.trading.processPassiveIncome(this.selectedMode, this.progression.data, true);
    if (passiveIncome > 0) {
      this.news.addTradeNews(`Passive: +${formatMoney(passiveIncome)}`, this.currentMinute);
    }

    // Update positions
    this.trading.updatePositions(this.market, this.currentMinute);

    // Bug Fix #43: Show liquidation notifications (intraday)
    if (this.trading.recentLiquidations && this.trading.recentLiquidations.length > 0) {
      for (const liq of this.trading.recentLiquidations) {
        this.news.addSecNews(`MARGIN CALL: ${liq.ticker} ${liq.type} position liquidated (-${formatMoney(liq.loss)})`, this.currentMinute);
      }
    }

    // Check risk limit (pass metaProgression for Risk Immunity)
    if (this.trading.isOverRiskLimit(this.market, this.progression.data)) {
      this.endRun('fired');
      return;
    }

    // Audio feedback
    const currentNetWorth = this.trading.netWorth;
    const netWorthChange = currentNetWorth - this.lastNetWorth;
    const percentChange = this.lastNetWorth > 0 ? netWorthChange / this.lastNetWorth : 0;

    // Floating text for significant P&L changes
    if (Math.abs(netWorthChange) >= 1000) {
      this.ui.spawnFloatingPnL(netWorthChange);
    }

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

    // Update music intensity (use minutes remaining)
    this.audio.updateMusicIntensity(CONFIG.INTRADAY_TOTAL_TICKS - this.currentMinute, CONFIG.INTRADAY_TOTAL_TICKS);

    // SEC tick (scaled for intraday)
    const arrested = this.sec.tick(this.trading, this.market, this.progression.data);

    // News tick - will add tickIntraday to news.js
    if (this.news.tickIntraday) {
      this.news.tickIntraday(this.currentMinute, this.market, this.sec);
    }

    // Check end conditions
    if (arrested) {
      if (this.sec.useBailFund()) {
        this.news.addSecNews('BAIL POSTED! Your lawyers got you out.', this.currentMinute);
      } else {
        this.endRun('arrested');
        return;
      }
    }

    if (this.trading.stats.wentBankrupt) {
      this.endRun('bankrupt');
      return;
    }

    // Bug Fix #28: Intraday boundary edge case - ensure we don't exceed max ticks
    if (this.currentMinute >= CONFIG.INTRADAY_TOTAL_TICKS) {
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

    // Bug Fix #36: Reset selected asset so it doesn't carry over to next run
    this.selectedAsset = null;

    // Add news for fired condition
    if (reason === 'fired') {
      this.news.addSecNews('RISK LIMIT EXCEEDED - You have been terminated', this.currentDay);
    }

    // Mark survival
    this.trading.stats.survived = (reason === 'timeUp');

    // Process progression (using quarterly PP instead of old formula)
    const result = this.progression.endRun(
      this.trading,
      this.sec,
      this.currentDay,
      reason === 'arrested',
      this.quarterly
    );

    // Submit to leaderboard
    this.leaderboard.submitRun(
      this.trading,
      this.currentDay,
      reason === 'arrested',
      this.progression.data.runCount
    );

    // Get ranking
    const ranking = this.leaderboard.getRankForScore(this.trading.netWorth, 'highScore');

    this.ui.showRunEnd(this, result, ranking);
  }

  // --- Player Actions ---

  buyAsset(dollarAmount) {
    if (!this.isPlaying() || !this.selectedAsset) return;  // Bug Fix #37
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    const result = this.trading.buy(
      this.selectedAsset, dollarAmount, this.market,
      this.progression.data, this.currentDay
    );

    if (result.success) {
      this.audio.playTradeClick();
      this.news.addTradeNews(result.message, this.currentDay);

      // SEC watches large trades (Dark Pool Access reduces this)
      if (dollarAmount > this.trading.netWorth * 0.3) {
        let secHit = 1;
        if (this.progression.data.unlocks.darkPoolAccess) {
          secHit *= (1 - UNLOCKS.darkPoolAccess.largeTradeSECReduction);
        }
        this.sec.addAttention(secHit, 'Large position opened');
      }
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  sellPosition(index) {
    if (!this.isPlaying()) return;  // Bug Fix #37
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

  sellPositionByIdentifier(ticker, type, entryDay) {
    if (!this.isPlaying()) return;  // Bug Fix #37
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    // Find position by stable identifier
    const index = this.trading.positions.findIndex(p =>
      p.ticker === ticker &&
      p.type === type &&
      p.entryDay === entryDay
    );

    if (index === -1) {
      this.ui.showTradeResult({
        success: false,
        message: 'Position no longer exists'
      });
      return;
    }

    const result = this.trading.sell(
      ticker, index, this.market,
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

  shortAsset(dollarAmount) {
    if (!this.isPlaying() || !this.selectedAsset) return;  // Bug Fix #37
    if (this.sec.tradeRestricted) {
      this.news.addSecNews('Trade blocked: Under investigation', this.currentDay);
      return;
    }

    const result = this.trading.short(
      this.selectedAsset, dollarAmount, this.market,
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
    if (!this.isPlaying()) return;  // Bug Fix #37
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
    if (this.isPlaying()) {
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

  doFrontRun() {
    if (!this.isPlaying()) return;  // Bug Fix #37
    if (!this.sec.canDoIllegalAction('frontRunning', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doFrontRun(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  useFallGuy() {
    if (!this.isPlaying()) return;
    const result = this.sec.useFallGuy();
    if (result.success) {
      this.audio.playIllegalAction();
      this.news.addSecNews(result.message, this.currentDay);
    }
    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  makeDonation() {
    if (!this.isPlaying()) return;  // Bug Fix #37
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

  showTutorial() {
    // Pause the game while tutorial is shown
    this.stopTicker();

    const modal = document.getElementById('tutorial-modal');
    const startBtn = document.getElementById('tutorial-start-btn');
    const dontShowCheckbox = document.getElementById('tutorial-dont-show');

    if (!modal || !startBtn) {
      this.startTicker();
      return;
    }

    modal.classList.remove('hidden');

    const dismiss = () => {
      if (dontShowCheckbox && dontShowCheckbox.checked) {
        this.progression.data.hideTutorial = true;
        this.progression.save();
      }
      modal.classList.add('hidden');
      this.startTicker();
    };

    startBtn.onclick = dismiss;
  }

  spawnRocket() {
    const rocket = document.createElement('div');
    rocket.className = 'rocket-animation';
    rocket.textContent = '🚀';
    document.body.appendChild(rocket);

    setTimeout(() => {
      if (rocket.parentNode) rocket.parentNode.removeChild(rocket);
    }, 2500);
  }

  spawnConfetti() {
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#00C805', '#5AC8FA', '#BD10E0', '#FFD60A', '#FF5000', '#FFFFFF'];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = Math.random() * 1.5 + 's';
      piece.style.animationDuration = (2 + Math.random() * 2) + 's';
      piece.style.width = (6 + Math.random() * 8) + 'px';
      piece.style.height = (6 + Math.random() * 8) + 'px';
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      container.appendChild(piece);
    }

    setTimeout(() => {
      if (container.parentNode) container.parentNode.removeChild(container);
    }, 5000);
  }

  getCurrentDate() {
    const startDate = new Date(this.market.startDate);
    const currentDate = new Date(startDate.getTime() + this.currentDay * 24 * 60 * 60 * 1000);
    return currentDate;
  }

  selectAsset(ticker) {
    this.selectedAsset = ticker;

    // Bug Fix #27: Check chartManager existence early
    if (!this.ui.chartManager) {
      this.ui.update(this);
      return;
    }

    // Auto-manage chart tabs when asset is selected
    if (this.isPlaying()) {
      // Prevent chart creation at high speeds
      if (this.speed > 5) {
        // Don't show error, just silently skip chart tab creation
        this.ui.update(this);
        return;
      }

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
    if (!this.isPlayingOrPaused()) return;  // Bug Fix #37

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

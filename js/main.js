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
    this.tips = new TipSystem();          // v2 informant drafting
    this.timeMachine = new TimeMachine(); // v2 flagship run format
    this.runFormat = 'career';            // 'career' | 'timeMachine'
    this.ui = null; // set after UI init

    this.state = 'menu';     // menu | playing | paused | runEnd | loading
    this.currentDay = 0;
    this.totalDays = CONFIG.DEFAULT_RUN_DAYS;
    this.speed = 1;
    this.tickInterval = null;
    this.selectedMode = 'stocks';
    this.selectedAsset = null;
    this.selectedYears = { start: 2008, end: 2009 }; // Default: 2-year fixed run
    this.ascensionLevel = 0;  // v2 difficulty ladder, chosen at year select

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

    // Warning tracking (to show each threshold only once per run)
    this.shownSecWarnings = new Set();
    this.shownRiskWarnings = new Set();
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

  async startRun(mode, format = 'career') {
    // Bug Fix #6: Race condition - prevent concurrent startRun calls
    if (this.state === 'loading') {
      console.warn('Already loading, ignoring duplicate startRun');
      return;
    }

    // Stop any existing ticker first
    this.stopTicker();

    this.runFormat = format;
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
    } else if (format === 'timeMachine') {
      // Time Machine (v2): 8 quarters, each in a different era. The machine
      // picks the first insertion point; later jumps are drafted.
      this.timeMachine.start();
      const dest = this.timeMachine.randomDestination();
      this.timeMachine.recordJump(dest);
      this.selectedYears = { start: dest.year, end: dest.year + 1 };
      this.totalDays = CONFIG.TOTAL_QUARTERS * CONFIG.QUARTER_DAYS;
      this.currentTime = null;
      console.log(`Time Machine run: first insertion ${dest.phase} ${dest.year} (month ${dest.month})`);
    } else {
      // Calculate extra years from "Time in the Market" unlocks
      let extraYears = 0;
      if (this.progression.data.unlocks.timeInMarket3) extraYears = 3;
      else if (this.progression.data.unlocks.timeInMarket2) extraYears = 2;
      else if (this.progression.data.unlocks.timeInMarket1) extraYears = 1;

      const runYears = CONFIG.FIXED_RUN_YEARS + extraYears;
      this.totalDays = runYears * 365;

      // Groundhog Day: add extra days to run
      if (this.progression.data.unlocks.groundhogDay) {
        this.totalDays += UNLOCKS.groundhogDay.extraDays;
      }

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
        this.market.init(mode, this.dataLoader, this.progression, this.selectedYears.start, this.selectedYears.end,
          format === 'timeMachine' ? this.timeMachine.currentDest.month : 0),
        timeoutPromise
      ]);
      this.trading.init(CONFIG.STARTING_CASH, this.progression.data);
      // Extra years are added at the START as a head start before targets begin
      // (career only; Time Machine is always exactly 8 quarters)
      let extraYearDays = 0;
      if (format !== 'timeMachine') {
        if (this.progression.data.unlocks.timeInMarket3) extraYearDays = 3 * 365;
        else if (this.progression.data.unlocks.timeInMarket2) extraYearDays = 2 * 365;
        else if (this.progression.data.unlocks.timeInMarket1) extraYearDays = 1 * 365;
      }
      this.quarterly.init(CONFIG.STARTING_CASH, extraYearDays);
      setRunAscension(this.ascensionLevel);
    this.sec.init();
    this.tips.init();

      // TED Talk: start with reduced SEC attention
      if (this.progression.data.unlocks.tedTalk) {
        this.sec.attention = Math.max(0, this.sec.attention - UNLOCKS.tedTalk.secReduction);
      }

      this.news.init(this.dataLoader);
      if (format === 'timeMachine') {
        const d = this.timeMachine.currentDest;
        this.news.addNews(`INSERTION: ${d.phase} ${d.year}. ${d.hint}`, 'milestone', 0);
      }

      // Bug Fix #25: Validate assets loaded before selecting
      const assets = this.market.getAllAssets();
      if (assets.length === 0) {
        throw new Error('No assets loaded for mode: ' + mode);
      }
      this.selectedAsset = assets[0].ticker;

      // Reset animation flags
      this.rocketShown = false;
      this.confettiShown = false;

      // Reset warning tracking for new run
      this.shownSecWarnings = new Set();
      this.shownRiskWarnings = new Set();

      // Start audio
      this.audio.resume();
      this.audio.startMusic();

      this.state = 'playing';
      this.ui.showGame();
      this.ui.update(this);

      // Show guided tutorial for new players, or start immediately
      if (!this.progression.data.hideTutorial) {
        this.startGuidedTutorial();
      } else {
        this.startTicker();
      }
    } catch (error) {
      console.error('Failed to start run:', error);
      this.ui.showAlert('Error', 'Failed to load game data. Please refresh and try again.');
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

    // Update positions (pass metaProgression for stop loss / take profit)
    this.trading.updatePositions(this.market, this.currentDay, this.progression.data);

    // Bug Fix #43: Show liquidation notifications
    if (this.trading.recentLiquidations && this.trading.recentLiquidations.length > 0) {
      for (const liq of this.trading.recentLiquidations) {
        const reason = liq.reason || 'MARGIN CALL';
        this.news.addSecNews(`${reason}: ${liq.ticker} ${liq.type} position liquidated (-${formatMoney(liq.loss)})`, this.currentDay);
      }
    }

    // Dollar Cost Average: auto-invest periodically
    const dcaResult = this.trading.processDCA(this.market, this.progression.data, this.currentDay);
    if (dcaResult) {
      this.news.addTradeNews(`DCA: Auto-bought ${dcaResult.ticker} for ${formatMoney(dcaResult.amount)}`, this.currentDay);
    }

    // Check risk limit (pass metaProgression for Risk Immunity)
    if (this.trading.isOverRiskLimit(this.market, this.progression.data)) {
      this.endRun('fired');
      return;
    }

    // Quarterly target check (net worth thresholds - pass instantly when hit)
    const quarterResult = this.quarterly.tick(this.currentDay, this.trading.netWorth, this.trading, this.market);
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
      const nextTarget = this.quarterly.isAllComplete() ? null : this.quarterly.getCurrentTarget().target;
      if (info.allComplete) {
        this.news.addNews(`ALL 8 QUARTERLY TARGETS COMPLETE! Bonus awarded.`, 'milestone', this.currentDay);
      } else {
        this.news.addNews(
          `NET WORTH TARGET HIT! Level ${info.level} complete. Next: reach ${formatMoney(nextTarget)}`,
          'milestone', this.currentDay
        );
      }
      this.ui.flashQuarterlyLevelUp();

      if (info.mandateResult && info.mandateResult.satisfied) {
        this.news.addNews(
          `BOARD MANDATE MET: ${info.mandateResult.name}. Compliance bonus ${formatMoney(info.mandateResult.bonus)} paid.`,
          'milestone', this.currentDay
        );
      }

      // Quarter evaluation takeover: auto-pauses at any speed (DESIGN.md tier 4)
      this.stopTicker();
      this.ui.showQuarterScreen({
        level: info.level,
        netWorth: this.trading.netWorth,
        target: info.target,
        nextTarget,
        allComplete: info.allComplete,
        mandate: info.mandateResult,
        boss: this.getBossMessage(info.level, nextTarget),
        onContinue: () => {
          if (this.runFormat === 'timeMachine' && !info.allComplete) {
            this.beginJump();
          } else if (this.isPlaying()) {
            this.startTicker();
          }
        }
      });
    }

    // Audio feedback based on net worth changes
    const currentNetWorth = this.trading.netWorth;
    const netWorthChange = currentNetWorth - this.lastNetWorth;
    const percentChange = this.lastNetWorth > 0 ? netWorthChange / this.lastNetWorth : 0;

    // Floating text for significant one-day swings only (tier 2+, DESIGN.md):
    // a flat $1000 threshold spams popups every tick once net worth is large
    if (this.lastNetWorth > 0 && Math.abs(netWorthChange) >= Math.max(1000, this.lastNetWorth * 0.02)) {
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

    // Offshore Escape notification
    if (this.sec._offshoreEscapeTriggered) {
      this.sec._offshoreEscapeTriggered = false;
      this.news.addSecNews('OFFSHORE ESCAPE ACTIVATED! You fled to the Caymans. SEC attention reset to 50%.', this.currentDay);
    }

    // News tick
    this.news.tick(this.currentDay, this.market, this.sec);

    // Tips: resolve expired ones against real outcomes (v2)
    this.tips.tick(this.currentDay, this.market, this.news);

    // Tip draft: once per quarter, 3 days in (v2)
    const qNow = this.quarterly.currentQuarter;
    if (!this.quarterly.isAllComplete() && !this.quarterly.fired
        && this.tips.lastDraftQuarter < qNow
        && this.currentDay >= this.quarterly.dayOffset + qNow * CONFIG.QUARTER_DAYS + 3) {
      this.tips.lastDraftQuarter = qNow;
      this.openTipDraft();
    }

    // "You called it" (v2): a historical event just fired and the player was
    // already positioned to profit from it. Celebrate the foresight.
    if (this.news.todaysEvents && this.news.todaysEvents.length) {
      for (const ev of this.news.todaysEvents) {
        if (!ev.tickers_affected || !ev.tickers_affected.length) continue;
        for (const pos of this.trading.positions) {
          if (!ev.tickers_affected.includes(pos.ticker)) continue;
          const daysBefore = this.currentDay - pos.entryDay;
          if (daysBefore < 3) continue;
          const asset = this.market.getAsset(pos.ticker);
          if (!asset) continue;
          const pnl = pos.type === 'long'
            ? (asset.price - pos.entryPrice) * pos.quantity
            : (pos.entryPrice - asset.price) * pos.quantity;
          if (pnl <= 0) continue;
          this.ui.showCalledIt({
            headline: ev.headline,
            ticker: pos.ticker,
            type: pos.type,
            daysBefore,
            pnl,
          });
          break; // one celebration per event
        }
      }
    }

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

    // SEC attention threshold warnings (25, 50, 75)
    const secPct = this.sec.attention;
    for (const threshold of [25, 50, 75]) {
      if (secPct >= threshold && !this.shownSecWarnings.has(threshold)) {
        this.shownSecWarnings.add(threshold);
        const secWarnings = {
          25: ['🔍 SEC Notice', "Someone at the SEC has opened a file on you. It's probably routine. They open files on everyone. Just... maybe cool it with the suspicious returns."],
          50: ['📋 Under Inquiry', "You are officially under formal inquiry. An actual human at the SEC is reading your trades right now. They have a coffee and a highlighter. Be cool."],
          75: ['🚨 Grand Jury Convened', "A grand jury has been convened. Your lawyer has gone very quiet. The SEC agent outside your building has started bringing a thermos. This is not good."]
        };
        const [title, msg] = secWarnings[threshold];
        this.showWarning(title, msg);
      }
    }

    // Risk threshold warnings (25, 50, 75)
    const riskPct = this.trading.getRiskLevel(this.market, this.progression.data);
    for (const threshold of [25, 50, 75]) {
      if (riskPct >= threshold && !this.shownRiskWarnings.has(threshold)) {
        this.shownRiskWarnings.add(threshold);
        const riskWarnings = {
          25: ['📊 Risk Notice', "Your position sizes are getting chunky. Risk management is giving you side-eye. Nothing to worry about yet, but maybe don't go bigger."],
          50: ['⚠️ Risk Warning', "You're halfway to the risk limit. The compliance desk has sent a strongly-worded internal memo. They used bold text. They never use bold text."],
          75: ['🔴 Critical Risk', "Your risk level is critical. One bad tick and you're looking at a margin call. The compliance desk is standing outside your office. They brought a box."]
        };
        const [title, msg] = riskWarnings[threshold];
        this.showWarning(title, msg);
      }
    }

    // Autosave every 7 game days (v2): long runs must survive crashes
    if (this.currentDay % 7 === 0) this.saveRunState();

    // Update UI
    this.ui.update(this);
  }

  // ---- Mid-run autosave / resume (v2, Phase 3) ----

  _buildAutosave() {
    return {
      version: 1,
      runFormat: this.runFormat,
      mode: this.selectedMode,
      selectedYears: this.selectedYears,
      ascensionLevel: this.ascensionLevel,
      currentDay: this.currentDay,
      totalDays: this.totalDays,
      selectedAsset: this.selectedAsset,
      lastNetWorth: this.lastNetWorth,
      market: {
        startYear: this.market.startYear,
        endYear: this.market.endYear,
        startMonth: this.market.startDate ? this.market.startDate.getMonth() : 0,
        dayCount: this.market.dayCount,
      },
      trading: {
        cash: this.trading.cash,
        netWorth: this.trading.netWorth,
        positions: this.trading.positions,
        tradeHistory: this.trading.tradeHistory,
        netWorthHistory: this.trading.netWorthHistory,
        stats: this.trading.stats,
        lastTradedTicker: this.trading.lastTradedTicker,
      },
      sec: {
        attention: this.sec.attention,
        arrestThreshold: this.sec.arrestThreshold,
        donationCount: this.sec.donationCount,
        totalDonations: this.sec.totalDonations,
        tradeRestricted: this.sec.tradeRestricted,
      },
      quarterly: {
        currentQuarter: this.quarterly.currentQuarter,
        completedLevels: this.quarterly.completedLevels,
        fired: this.quarterly.fired,
        dayOffset: this.quarterly.dayOffset,
        mandateId: this.quarterly.mandate ? this.quarterly.mandate.id : null,
        mandateViolated: this.quarterly.mandateViolated,
        mandateProgress: this.quarterly.mandateProgress,
        mandateStartDay: this.quarterly.mandateStartDay,
      },
      tips: {
        sources: this.tips.sources.map(s => ({ id: s.id, accuracy: s.accuracy, correct: s.correct, total: s.total })),
        activeTips: this.tips.activeTips,
        lastDraftQuarter: this.tips.lastDraftQuarter,
      },
      timeMachine: {
        active: this.timeMachine.active,
        visited: this.timeMachine.visited,
        jumpCount: this.timeMachine.jumpCount,
        currentDest: this.timeMachine.currentDest,
      },
    };
  }

  saveRunState() {
    if (!this.isPlayingOrPaused() || this.isIntraday) return;
    try {
      saveManager.save('pastTrading_autosave', this._buildAutosave());
    } catch (e) {
      console.warn('Autosave failed:', e);
    }
  }

  clearRunState() {
    try { saveManager.remove('pastTrading_autosave'); } catch (e) { /* best effort */ }
  }

  hasAutosave() {
    try { return !!saveManager.load('pastTrading_autosave'); } catch (e) { return false; }
  }

  async resumeRun() {
    if (this.state === 'loading') return;
    const save = saveManager.load('pastTrading_autosave');
    if (!save || save.version !== 1) return;

    this.stopTicker();
    this.runFormat = save.runFormat || 'career';
    this.selectedMode = save.mode || 'stocks';
    this.selectedYears = save.selectedYears;
    this.ascensionLevel = save.ascensionLevel || 0;
    this.isIntraday = false;
    this.currentDay = save.currentDay;
    this.totalDays = save.totalDays;
    this.lastNetWorth = save.lastNetWorth || CONFIG.STARTING_CASH;
    this.runEndReason = '';
    this.speed = 1;

    this.state = 'loading';
    this.ui.showLoading();
    try {
      await this.dataLoader.loadNewsEvents();
      await this.market.init(this.selectedMode, this.dataLoader, this.progression,
        save.market.startYear, save.market.endYear, save.market.startMonth);
      this.market.fastForward(save.market.dayCount);

      this.trading.init(CONFIG.STARTING_CASH, this.progression.data);
      this.trading.cash = save.trading.cash;
      this.trading.netWorth = save.trading.netWorth;
      this.trading.positions = save.trading.positions || [];
      this.trading.tradeHistory = save.trading.tradeHistory || [];
      this.trading.netWorthHistory = save.trading.netWorthHistory || [];
      this.trading.lastTradedTicker = save.trading.lastTradedTicker || null;
      Object.assign(this.trading.stats, save.trading.stats || {});

      setRunAscension(this.ascensionLevel);
      this.sec.init();
      Object.assign(this.sec, save.sec || {});

      this.quarterly.init(CONFIG.STARTING_CASH, save.quarterly.dayOffset || 0);
      this.quarterly.currentQuarter = save.quarterly.currentQuarter;
      this.quarterly.completedLevels = save.quarterly.completedLevels;
      this.quarterly.fired = save.quarterly.fired;
      this.quarterly.mandate = BOARD_MANDATES.find(m => m.id === save.quarterly.mandateId) || null;
      this.quarterly.mandateViolated = save.quarterly.mandateViolated;
      this.quarterly.mandateProgress = save.quarterly.mandateProgress;
      this.quarterly.mandateStartDay = save.quarterly.mandateStartDay;

      this.tips.init();
      this.tips.sources.forEach(s => {
        const savedSrc = (save.tips.sources || []).find(x => x.id === s.id);
        if (savedSrc) { s.accuracy = savedSrc.accuracy; s.correct = savedSrc.correct; s.total = savedSrc.total; }
      });
      this.tips.activeTips = save.tips.activeTips || [];
      this.tips.lastDraftQuarter = save.tips.lastDraftQuarter != null ? save.tips.lastDraftQuarter : -1;

      this.timeMachine.reset();
      Object.assign(this.timeMachine, save.timeMachine || {});

      this.news.init(this.dataLoader);
      this.news.addNews(`Run resumed on day ${this.currentDay}. The machine remembers.`, 'system', this.currentDay);

      const assets = this.market.getAllAssets();
      this.selectedAsset = (save.selectedAsset && this.market.getAsset(save.selectedAsset))
        ? save.selectedAsset
        : (assets.length ? assets[0].ticker : null);

      this.rocketShown = true;
      this.confettiShown = true;
      this.shownSecWarnings = new Set();
      this.shownRiskWarnings = new Set();

      this.audio.resume();
      this.audio.startMusic();
      this.state = 'playing';
      this.ui.showGame();
      this.ui.update(this);
      this.startTicker();
    } catch (e) {
      console.error('Resume failed:', e);
      this.clearRunState();
      this.ui.showAlert('Error', 'Could not resume the saved run.');
      this.showMenu();
    }
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

    // Update positions (pass metaProgression for stop loss / take profit)
    this.trading.updatePositions(this.market, this.currentMinute, this.progression.data);

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

    // Floating text for significant one-day swings only (tier 2+, DESIGN.md):
    // a flat $1000 threshold spams popups every tick once net worth is large
    if (this.lastNetWorth > 0 && Math.abs(netWorthChange) >= Math.max(1000, this.lastNetWorth * 0.02)) {
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
      this.quarterly,
      this.ascensionLevel
    );

    // The run is over; the autosave must not survive it
    this.clearRunState();

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
    if (!this.isPlayingOrPaused() || !this.selectedAsset) return;
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

      // SEC watches large trades (Whale Status eliminates, Dark Pool Access reduces)
      if (dollarAmount > this.trading.netWorth * 0.3) {
        if (!this.progression.data.unlocks.whaleStatus) {
          let secHit = 1;
          if (this.progression.data.unlocks.darkPoolAccess) {
            secHit *= (1 - UNLOCKS.darkPoolAccess.largeTradeSECReduction);
          }
          this.sec.addAttention(secHit, 'Large position opened');
        }
      }
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  sellPosition(index) {
    if (!this.isPlayingOrPaused()) return;
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

      this.ui.showSellTally(result.trade);
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  sellPositionByIdentifier(ticker, type, entryDay) {
    if (!this.isPlayingOrPaused()) return;
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

      this.ui.showSellTally(result.trade);
    }

    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  shortAsset(dollarAmount) {
    if (!this.isPlayingOrPaused() || !this.selectedAsset) return;
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

  // Time Machine jump (v2): liquidate first (cash funds the perk shop),
  // draft a destination, re-init the market in the new era, resume.
  // Ticker is already stopped (quarter screen).
  beginJump() {
    // You cannot carry positions (or informants) through time
    const sold = this.trading.liquidateAll(this.market, this.progression.data, this.currentDay);
    if (sold.length) {
      this.news.addTradeNews(`Temporal transit: ${sold.length} position${sold.length === 1 ? '' : 's'} liquidated`, this.currentDay);
    }
    this.tips.activeTips = [];

    const offers = this.timeMachine.offerDestinations();
    const perkCtx = {
      getPerks: () => JUMP_PERKS.map(def => {
        const cost = Math.max(def.costMin, Math.floor(this.trading.netWorth * def.costPct));
        return { def, cost, affordable: this.trading.cash >= cost };
      }),
      buy: (id) => this.applyJumpPerk(id),
    };
    this.ui.showDestinationDraft(offers, async (dest) => {
      try {
        this.ui.showJumpCinematic(dest);
        await this.market.init(this.selectedMode, this.dataLoader, this.progression, dest.year, dest.year + 1, dest.month);
        this.timeMachine.recordJump(dest);

        const assets = this.market.getAllAssets();
        this.selectedAsset = assets.length ? assets[0].ticker : null;
        this.news.addNews(`ARRIVAL: ${dest.phase} ${dest.year}. ${dest.hint}`, 'milestone', this.currentDay);

        // Insider Dossier perk: a clean whistleblower-grade tip on arrival
        if (this._pendingDossier) {
          this._pendingDossier = false;
          const tip = this.tips.acceptSource('whistleblower', this.market, null, this.currentDay);
          if (tip) {
            const days = tip.expiresDay - tip.issuedDay;
            this.news.addNews(`DOSSIER: ${tip.ticker} moves ${tip.direction.toUpperCase()} within ${days} days.`, 'milestone', this.currentDay);
          }
        }

        this.ui.hideJumpCinematic();
        if (this.isPlaying()) this.startTicker();
        this.ui.update(this);
      } catch (e) {
        console.error('Jump failed:', e);
        this.ui.hideJumpCinematic();
        if (this.isPlaying()) this.startTicker();
      }
    }, perkCtx);
  }

  // Jump perk purchase (v2): costs computed from net worth at purchase time
  applyJumpPerk(id) {
    const def = JUMP_PERKS.find(p => p.id === id);
    if (!def) return { success: false, message: 'Unknown perk' };
    const cost = Math.max(def.costMin, Math.floor(this.trading.netWorth * def.costPct));
    if (this.trading.cash < cost) {
      return { success: false, message: `Need ${formatMoney(cost)} cash` };
    }
    this.trading.cash -= cost;

    if (id === 'greasedPalms') {
      this.sec.attention = Math.max(0, this.sec.attention - 15);
      this.news.addSecNews(`Greased palms: SEC attention eased (${formatMoney(cost)})`, this.currentDay);
      return { success: true, message: 'SEC attention -15' };
    }
    if (id === 'dossier') {
      this._pendingDossier = true;
      this.news.addTradeNews(`Bought an insider dossier (${formatMoney(cost)})`, this.currentDay);
      return { success: true, message: 'Tip on arrival' };
    }
    if (id === 'aperture') {
      const extra = this.timeMachine.offerDestinations()[0];
      return { success: true, message: 'Window revealed', extraOffer: extra };
    }
    return { success: false, message: 'Unknown perk' };
  }

  // Tip draft (v2): pause, offer 3 informants, resume on choice or skip
  openTipDraft() {
    if (!this.isPlaying()) return;
    const offer = this.tips.offerDraft();
    if (!offer.length) return;
    this.stopTicker();
    this.ui.showTipDraft(offer, this.tips,
      (sourceId) => {
        const tip = this.tips.acceptSource(sourceId, this.market, this.sec, this.currentDay);
        if (tip) {
          const days = tip.expiresDay - tip.issuedDay;
          this.news.addNews(
            `TIP (${tip.sourceName}): ${tip.ticker} moves ${tip.direction.toUpperCase()} within ${days} days.`,
            'milestone', this.currentDay
          );
          this.showToast(
            `${tip.icon} ${tip.sourceName}`,
            `"${tip.ticker}. ${tip.direction === 'up' ? 'It goes up.' : 'It drops.'} Within ${days} days. That is all I know."`,
            'info', 9000
          );
        }
        if (this.isPlaying()) this.startTicker();
        this.ui.update(this);
      },
      () => { if (this.isPlaying()) this.startTicker(); }
    );
  }

  // One-click trading from asset rows (v2)
  quickBuy(ticker) {
    if (!this.isPlayingOrPaused() || !ticker) return;
    this.selectAsset(ticker);
    const amount = parseFloat(this.ui.el.tradeQuantity.value) || 1000;
    this.buyAsset(amount);
  }

  quickSell(ticker) {
    if (!this.isPlayingOrPaused() || !ticker) return;
    // Close the newest open position for this ticker
    let pos = null;
    for (let i = this.trading.positions.length - 1; i >= 0; i--) {
      if (this.trading.positions[i].ticker === ticker) { pos = this.trading.positions[i]; break; }
    }
    if (!pos) {
      this.ui.showTradeResult({ success: false, message: `No open ${ticker} position` });
      return;
    }
    this.selectAsset(ticker);
    this.sellPositionByIdentifier(pos.ticker, pos.type, pos.entryDay);
  }

  doInsiderTrade() {
    if (!this.isPlayingOrPaused()) return;
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

    // Pause game and show modal (track if we were already paused)
    this._wasPausedBeforeInsider = this.state === 'paused';
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

    // Resume game only if it wasn't already paused before the modal
    if (this.state === 'paused' && !this._wasPausedBeforeInsider) {
      this.togglePause();
    }

    this.ui.hideInsiderModal();
    this.ui.update(this);
  }

  ignoreInsiderTip() {
    // Resume game only if it wasn't already paused before the modal
    if (this.state === 'paused' && !this._wasPausedBeforeInsider) {
      this.togglePause();
    }

    this.ui.hideInsiderModal();
  }

  doFrontRun() {
    if (!this.isPlayingOrPaused()) return;
    if (!this.sec.canDoIllegalAction('frontRunning', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doFrontRun(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  doFakeNews() {
    if (!this.isPlayingOrPaused()) return;
    if (!this.sec.canDoIllegalAction('fakeNews', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doFakeNews(this.market, this.trading);
    if (result) {
      this.news.addSecNews(result.message, this.currentDay);
    }
    this.ui.update(this);
  }

  doMoneyLaunder() {
    if (!this.isPlayingOrPaused()) return;
    if (!this.sec.canDoIllegalAction('moneyLaunder', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doMoneyLaunder(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  doPonzi() {
    if (!this.isPlayingOrPaused()) return;
    if (!this.sec.canDoIllegalAction('ponzi', this.progression.data, this.progression.data.runCount)) return;

    this.audio.playIllegalAction();
    const result = this.sec.doPonzi(this.trading);
    this.news.addSecNews(result.message, this.currentDay);
    this.ui.update(this);
  }

  useFallGuy() {
    if (!this.isPlayingOrPaused()) return;
    const result = this.sec.useFallGuy();
    if (result.success) {
      this.audio.playIllegalAction();
      this.news.addSecNews(result.message, this.currentDay);
    }
    this.ui.showTradeResult(result);
    this.ui.update(this);
  }

  makeDonation() {
    if (!this.isPlayingOrPaused()) return;
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

  startGuidedTutorial() {
    const container = document.getElementById('guided-tutorial');
    if (!container) { this.startTicker(); return; }

    const overlay = container.querySelector('.guided-overlay');
    const spotlight = container.querySelector('.guided-spotlight');
    const tooltip = container.querySelector('.guided-tooltip');
    const message = container.querySelector('.guided-message');
    const stepIndicator = container.querySelector('.guided-step-indicator');
    const skipBtn = container.querySelector('.guided-skip');

    this.stopTicker();
    container.classList.remove('hidden');

    let currentStep = 0;
    const steps = [
      {
        target: '#asset-selector .asset-btn:first-child',
        fallback: '.asset-section',
        message: 'Pick a stock to see its price chart. Try clicking one now.',
        listenFor: 'assetSelected'
      },
      {
        target: '#buy-btn',
        fallback: '.trade-section',
        message: 'Set your amount and hit Buy to open a position.',
        listenFor: 'tradeExecuted'
      },
      {
        target: '.positions-section',
        fallback: '.col-networth-positions',
        message: "You're trading! Watch your P&L update each day. Hit quarterly targets to earn points.",
        listenFor: null
      }
    ];

    const positionSpotlight = (targetSelector, fallbackSelector) => {
      const el = document.querySelector(targetSelector) || document.querySelector(fallbackSelector);
      if (!el) { spotlight.style.display = 'none'; return; }
      const rect = el.getBoundingClientRect();
      const pad = 8;
      spotlight.style.display = 'block';
      spotlight.style.top = (rect.top - pad) + 'px';
      spotlight.style.left = (rect.left - pad) + 'px';
      spotlight.style.width = (rect.width + pad * 2) + 'px';
      spotlight.style.height = Math.min(rect.height + pad * 2, 300) + 'px';

      // Position tooltip near spotlight
      const tooltipTop = rect.bottom + 16;
      const tooltipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - 340));
      tooltip.style.top = tooltipTop + 'px';
      tooltip.style.left = tooltipLeft + 'px';
      if (tooltipTop + 120 > window.innerHeight) {
        tooltip.style.top = (rect.top - 120) + 'px';
      }
    };

    const showStep = (idx) => {
      if (idx >= steps.length) {
        dismiss();
        return;
      }
      currentStep = idx;
      const step = steps[idx];
      stepIndicator.textContent = `Step ${idx + 1} of ${steps.length}`;
      message.textContent = step.message;
      positionSpotlight(step.target, step.fallback);

      // Auto-dismiss step 3 after delay
      if (!step.listenFor) {
        setTimeout(() => dismiss(), 4000);
      }
    };

    // Listen for game events to auto-advance
    const originalSelectAsset = this.selectAsset.bind(this);
    this.selectAsset = (ticker) => {
      originalSelectAsset(ticker);
      if (currentStep === 0) showStep(1);
    };

    const originalShowTradeResult = this.ui.showTradeResult.bind(this.ui);
    this.ui.showTradeResult = (result) => {
      originalShowTradeResult(result);
      if (currentStep === 1 && result.success) showStep(2);
    };

    const dismiss = () => {
      container.classList.add('hidden');
      this.progression.data.hideTutorial = true;
      this.progression.save();
      // Restore original methods
      this.selectAsset = originalSelectAsset;
      this.ui.showTradeResult = originalShowTradeResult;
      this.startTicker();
    };

    skipBtn.onclick = dismiss;

    showStep(0);
  }

  showTutorial() {
    // Track if we were already paused so we don't auto-resume
    const wasPaused = this.state === 'paused';
    this.stopTicker();

    const modal = document.getElementById('tutorial-modal');
    const startBtn = document.getElementById('tutorial-start-btn');
    const dontShowCheckbox = document.getElementById('tutorial-dont-show');

    if (!modal || !startBtn) {
      if (!wasPaused) this.startTicker();
      return;
    }

    modal.classList.remove('hidden');

    const dismiss = () => {
      if (dontShowCheckbox && dontShowCheckbox.checked) {
        this.progression.data.hideTutorial = true;
        this.progression.save();
      }
      modal.classList.add('hidden');
      if (!wasPaused) this.startTicker();
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

    const colors = ['#00BFFF', '#5AC8FA', '#BD10E0', '#FFD60A', '#FF5000', '#FFFFFF'];
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
    if (this.isPlayingOrPaused()) {
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

  getBossMessage(quarterLevel, nextTarget) {
    const nextStr = nextTarget ? formatMoney(nextTarget) : null;

    const messages = [
      // Q1 - $15K
      `Nice work, kid. I've taken the liberty of bumping Q2's target to ${nextStr}. Standard stuff. The partners barely noticed. Keep it up and there might be a stapler in it for you.`,
      // Q2 - $50K
      `Not bad, not bad at all! The partners are... cautiously pleased. We've adjusted Q3 upward to ${nextStr}. Nothing crazy. Totally reasonable. I may have told them you were "exceptional." No pressure.`,
      // Q3 - $250K
      `Excellent work this quarter! The board convened an emergency meeting specifically about you. The consensus was: raise the Q4 target to ${nextStr}. I know that sounds like a lot. It is a lot. But you've got that THING, you know? That energy. I believe in you. Also I already told the investors.`,
      // Q4 - $1M
      `A MILLION DOLLARS! Do you understand what you've done?! I have been screaming in the bathroom for twenty minutes. We're doubling down. Q1 Y2 target is ${nextStr}. Yes I wrote that correctly. I may have made some promises to some people in exchange for some funding. It's fine. It's all fine. YOU'VE GOT THIS.`,
      // Q5 - $10M
      `TEN MILLION DOLLARS. I have been on the phone all morning. Senator Williams asked if you'd like a yacht. I said yes on your behalf. The Q2 Y2 target is ${nextStr}. Before you say anything — the Cayman account people are very supportive. I haven't slept since Tuesday but that's unrelated. Please don't quit.`,
      // Q6 - $100M
      `ONE HUNDRED MILLION DOLLARS. I CANNOT STOP SCREAMING. I quit my last three jobs to be here for this moment. My therapist called it "delusional optimism." WHO'S LAUGHING NOW JANET. The Q3 Y2 target is ${nextStr}. I signed some paperwork I haven't fully read. It's probably fine. YOU ARE A GOD.`,
      // Q7 - $500M
      `HALF A BILLION. HALF. A. BILLION. I have not slept in 72 hours. My wife left me but honestly she was holding me back. The final target is ${nextStr}. ONE BILLION DOLLARS. I promised certain parties certain things and some of those things may be technically illegal but that is a TOMORROW problem. I love you. Not in a weird way. In a "you are printing money and I am leveraged 60x" way. DO NOT STOP.`,
      // Q8 - $1B (completed)
      `A BILLION DOLLARS. WE DID IT. I am going to prison. There are some regulatory issues I kept meaning to mention. The SEC has had a van outside my house since Q5. None of that matters right now. YOU DID IT. Pack up the offshore accounts. Take the yacht. I love you. Goodbye forever. It was an honor.`
    ];

    const idx = Math.min(quarterLevel - 1, messages.length - 1);
    const title = quarterLevel === 8 ? '📞 Your Boss (Final Call)' : `📞 Your Boss (Q${quarterLevel} Complete)`;
    return { title, message: messages[idx] };
  }

  showWarning(title, message) {
    this.showToast(title, message, 'warning', 8000);
  }

  showToast(title, message, type = 'info', duration = 6000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast${type === 'warning' ? ' toast-warning' : type === 'danger' ? ' toast-danger' : ''}`;
    toast.innerHTML = `<div class="toast-title">${title}</div><div class="toast-msg">${message}</div>`;
    container.appendChild(toast);

    const dismiss = () => {
      toast.classList.add('toast-hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    setTimeout(dismiss, duration);
    toast.addEventListener('click', dismiss);
  }

  exitToMenu() {
    if (!this.isPlayingOrPaused()) return;  // Bug Fix #37

    this.ui.showConfirm('Exit Run', 'Exit to menu? Current progress will be lost.', () => {
      this.stopTicker();
      this.audio.stopMusic();
      this.showMenu();
    }, 'Exit');
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

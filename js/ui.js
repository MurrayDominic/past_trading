// ============================================================================
// PAST TRADING - UI Renderer
// ============================================================================

class GameUI {
  constructor(game) {
    this.game = game;
    this.graphCanvas = null;
    this.graphCtx = null;
    this.achievementQueue = [];
    this.tradeResultTimeout = null;
    this.chartManager = null;
    this.netWorthTimeRange = 'max';  // Time range filter for net worth graph
    this.currentSearchTerm = '';  // Store search term across ticks
    this.currentCategoryFilter = 'all';  // Store category filter across ticks
  }

  init() {
    // Cache DOM elements
    this.el = {
      menuScreen: document.getElementById('menu-screen'),
      yearSelectScreen: document.getElementById('year-select-screen'),
      gameScreen: document.getElementById('game-screen'),
      runEndScreen: document.getElementById('run-end-screen'),
      loadingOverlay: document.getElementById('loading-overlay'),

      // Header
      dayCounter: document.getElementById('day-counter'),
      countdownTimer: document.getElementById('countdown-timer'),
      pauseBtn: document.getElementById('pause-btn'),
      muteBtn: document.getElementById('mute-btn'),
      volumeSlider: document.getElementById('volume-slider'),

      // Trading panel
      categoryPills: document.getElementById('category-pills'),
      assetSearch: document.getElementById('asset-search'),
      assetSelector: document.getElementById('asset-selector'),
      tradeQuantity: document.getElementById('trade-quantity'),
      sharesPreview: document.getElementById('shares-preview'),
      buyBtn: document.getElementById('buy-btn'),
      sellBtn: document.getElementById('sell-btn'),
      shortBtn: document.getElementById('short-btn'),
      tradeResult: document.getElementById('trade-result'),

      // Graphs
      graphCanvas: document.getElementById('net-worth-graph'),
      chartContainer: document.getElementById('chart-container'),
      chartTabsBar: document.getElementById('chart-tabs-bar'),
      addChartBtn: document.getElementById('add-chart-btn'),

      // Meters
      riskFill: document.getElementById('risk-fill'),
      riskValue: document.getElementById('risk-value'),
      secFill: document.getElementById('sec-fill'),
      secValue: document.getElementById('sec-value'),
      secLabel: document.getElementById('sec-label'),

      // Portfolio
      portfolioList: document.getElementById('portfolio-list'),
      cashDisplay: document.getElementById('cash-display'),
      netWorthDisplay: document.getElementById('net-worth-display'),

      // News
      newsFeed: document.getElementById('news-feed'),

      // Help
      helpBtn: document.getElementById('help-btn'),

      // Menu
      menuPP: document.getElementById('menu-pp'),
      menuRunCount: document.getElementById('menu-run-count'),
      playBtn: document.getElementById('play-btn'),
      menuAchievements: document.getElementById('menu-achievements'),
      menuLeaderboards: document.getElementById('menu-leaderboards'),
      titleSelector: document.getElementById('title-selector'),

      // Year Selection
      startYearSlider: document.getElementById('start-year-slider'),
      startYearDisplay: document.getElementById('start-year-display'),
      endYearDisplay: document.getElementById('end-year-display'),

      // Quarterly Target Panel
      quarterlyPanel: document.getElementById('quarterly-panel'),
      quarterlyBadges: document.getElementById('quarterly-badges'),
      quarterlyLabel: document.getElementById('quarterly-label'),
      quarterlyTargetValue: document.getElementById('quarterly-target-value'),
      quarterlyEarningsValue: document.getElementById('quarterly-earnings-value'),
      quarterlyProgressFill: document.getElementById('quarterly-progress-fill'),
      quarterlyTimerValue: document.getElementById('quarterly-timer-value'),

      // Shop
      shopPP: document.getElementById('shop-pp'),
      progressionTree: document.getElementById('progression-tree'),
      shopItemDetail: document.getElementById('shop-item-detail'),

      // Run end
      runEndTitle: document.getElementById('run-end-title'),
      runEndStats: document.getElementById('run-end-stats'),
      runEndAchievements: document.getElementById('run-end-achievements'),

      // Overlays
      pauseOverlay: document.getElementById('pause-overlay'),
      insiderModal: document.getElementById('insider-modal'),
      insiderTipText: document.getElementById('insider-tip-text'),
      achievementPopup: document.getElementById('achievement-popup'),
    };

    this.graphCanvas = this.el.graphCanvas;
    if (this.graphCanvas) {
      this.graphCtx = this.graphCanvas.getContext('2d');
    }

    this.bindEvents();

    // Resize handler for canvas scaling
    window.addEventListener('resize', () => {
      if (this.game && this.game.isPlayingOrPaused()) {
        this.renderGraph(this.game);
        if (this.chartManager) {
          this.chartManager.renderActiveChart(
            this.game.market, this.game.currentDay,
            this.game.selectedMode, this.game.trading.positions
          );
        }
      }
    });
  }

  bindEvents() {
    // Menu tab bar navigation
    document.querySelectorAll('.menu-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.menuTab;

        // Switch active tab
        document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Switch content
        document.querySelectorAll('.menu-tab-content').forEach(c => c.classList.remove('active'));
        const content = document.querySelector(`[data-menu-tab-content="${tabName}"]`);
        if (content) content.classList.add('active');

        // Render content when switching to specific tabs
        if (tabName === 'shop') {
          this.renderShop();
        } else if (tabName === 'settings') {
          this.renderSettingsState();
        }
      });
    });

    // Settings controls
    const settingsVolume = document.getElementById('settings-volume');
    if (settingsVolume) {
      settingsVolume.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        this.game.audio.setVolume(val);
        document.getElementById('settings-volume-value').textContent = e.target.value + '%';
        // Sync in-game slider if it exists
        if (this.el.volumeSlider) this.el.volumeSlider.value = e.target.value;
      });
    }
    const settingsMuteBtn = document.getElementById('settings-mute-btn');
    if (settingsMuteBtn) {
      settingsMuteBtn.addEventListener('click', () => {
        const muted = this.game.audio.toggleMute();
        settingsMuteBtn.textContent = muted ? 'On' : 'Off';
        settingsMuteBtn.classList.toggle('active', muted);
        if (this.el.muteBtn) this.el.muteBtn.textContent = muted ? '🔇' : '🔊';
      });
    }
    const settingsTutorialBtn = document.getElementById('settings-tutorial-btn');
    if (settingsTutorialBtn) {
      settingsTutorialBtn.addEventListener('click', () => {
        this.game.progression.data.hideTutorial = !this.game.progression.data.hideTutorial;
        this.game.progression.save();
        this.renderSettingsState();
      });
    }
    // Display settings (Electron only)
    const displayGroup = document.getElementById('settings-display-group');
    if (displayGroup && window.electronAPI) {
      displayGroup.style.display = '';
    }
    const fullscreenBtn = document.getElementById('settings-fullscreen-btn');
    if (fullscreenBtn && window.electronAPI) {
      fullscreenBtn.addEventListener('click', async () => {
        await window.electronAPI.toggleFullscreen();
        const state = await window.electronAPI.getFullscreenState();
        fullscreenBtn.textContent = state.fullscreen ? 'On' : 'Off';
        fullscreenBtn.classList.toggle('active', state.fullscreen);
      });
    }
    const borderlessBtn = document.getElementById('settings-borderless-btn');
    if (borderlessBtn && window.electronAPI) {
      borderlessBtn.addEventListener('click', async () => {
        await window.electronAPI.toggleBorderless();
        const state = await window.electronAPI.getFullscreenState();
        borderlessBtn.textContent = state.borderless ? 'On' : 'Off';
        borderlessBtn.classList.toggle('active', state.borderless);
      });
    }

    const settingsHowToPlayBtn = document.getElementById('settings-howtoplay-btn');
    if (settingsHowToPlayBtn) {
      settingsHowToPlayBtn.addEventListener('click', () => {
        this.game.showTutorial();
      });
    }
    const settingsResetBtn = document.getElementById('settings-reset-btn');
    if (settingsResetBtn) {
      settingsResetBtn.addEventListener('click', () => {
        this.showConfirm('Reset Progress', 'Reset ALL progress? This cannot be undone.', () => {
          this.game.progression.resetProgress();
          this.showMenu();
        }, 'Reset');
      });
    }

    // Year selection screen
    if (this.el.startYearSlider) {
      this.el.startYearSlider.addEventListener('input', (e) => {
        const startYear = parseInt(e.target.value);
        this.updateYearDisplay(startYear);
      });
    }
    if (this.el.startYearDisplay) {
      this.el.startYearDisplay.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val >= 2000 && val <= 2023) {
          this.el.startYearSlider.value = val;
          this.updateYearDisplay(val);
        }
      });
      this.el.startYearDisplay.addEventListener('blur', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 2000) val = 2000;
        if (val > 2023) val = 2023;
        this.el.startYearSlider.value = val;
        this.updateYearDisplay(val);
      });
    }
    document.querySelectorAll('.year-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const startYear = parseInt(btn.dataset.start);
        this.el.startYearSlider.value = startYear;
        this.updateYearDisplay(startYear);
      });
    });
    const yearSelectBackBtn = document.getElementById('year-select-back-btn');
    if (yearSelectBackBtn) {
      yearSelectBackBtn.addEventListener('click', () => this.showMenu());
    }
    const yearSelectStartBtn = document.getElementById('year-select-start-btn');
    if (yearSelectStartBtn) {
      yearSelectStartBtn.addEventListener('click', () => {
        if (this._pendingMode) {
          this.game.startRun(this._pendingMode);
        }
      });
    }

    // Speed controls
    document.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const speed = parseFloat(btn.dataset.speed);
        this.game.setSpeed(speed);
        document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Pause
    if (this.el.pauseBtn) {
      this.el.pauseBtn.addEventListener('click', () => this.game.togglePause());
    }

    // Pause (alternate button near timer)
    const pauseBtnAlt = document.getElementById('pause-btn-alt');
    if (pauseBtnAlt) {
      pauseBtnAlt.addEventListener('click', () => this.game.togglePause());
    }

    // Exit run (in-game)
    const exitBtn = document.getElementById('exit-btn');
    if (exitBtn) {
      exitBtn.addEventListener('click', () => this.game.exitToMenu());
    }

    // Exit game (home screen - close the app, Electron only)
    const exitGameBtn = document.getElementById('exit-game-btn');
    if (exitGameBtn) {
      if (window.electronAPI && window.electronAPI.quitApp) {
        exitGameBtn.addEventListener('click', () => {
          this.showConfirm('Exit Game', 'Are you sure you want to close the game?', () => {
            window.electronAPI.quitApp();
          }, 'Exit', true);
        });
      } else {
        // Hide in browser - can't close tabs programmatically
        exitGameBtn.style.display = 'none';
      }
    }

    // Unpause button in overlay
    const unpauseBtn = document.getElementById('unpause-btn');
    if (unpauseBtn) {
      unpauseBtn.addEventListener('click', () => this.game.togglePause());
    }

    // Audio controls
    if (this.el.muteBtn) {
      this.el.muteBtn.addEventListener('click', () => {
        const muted = this.game.audio.toggleMute();
        this.el.muteBtn.textContent = muted ? '🔇' : '🔊';
      });
    }

    if (this.el.volumeSlider) {
      this.el.volumeSlider.addEventListener('input', (e) => {
        this.game.audio.setVolume(e.target.value / 100);
      });
    }

    // Help button
    if (this.el.helpBtn) {
      this.el.helpBtn.addEventListener('click', () => {
        this.game.showTutorial();
      });
    }

    // Asset search
    if (this.el.assetSearch) {
      this.el.assetSearch.addEventListener('input', (e) => {
        this.currentSearchTerm = e.target.value;  // Store term
        this.filterAssets(e.target.value);
      });
    }

    // Add chart button
    if (this.el.addChartBtn) {
      this.el.addChartBtn.addEventListener('click', () => {
        if (this.game.selectedAsset && this.chartManager) {
          // Prevent at high speeds
          if (this.game.speed > 5) {
            this.showTradeResult({
              success: false,
              message: 'Charts disabled above 5x speed'
            });
            return;
          }

          if (!this.chartManager.hasTab(this.game.selectedAsset)) {
            this.chartManager.addTab(this.game.selectedAsset, 'line');
          }
        }
      });
    }

    // Chart timeframe buttons
    document.querySelectorAll('.timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const range = btn.dataset.range;

        // Update active button
        document.querySelectorAll('.timeframe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update chart manager
        if (this.chartManager) {
          this.chartManager.setTimeRange(range);
          // Trigger re-render
          if (this.game.isPlayingOrPaused()) {
            this.chartManager.renderActiveChart(
              this.game.market,
              this.game.currentDay,
              this.game.selectedMode,
              this.game.trading.positions
            );
          }
        }
      });
    });

    // Net worth graph timeframe buttons
    document.querySelectorAll('.nw-timeframe-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const range = btn.dataset.range;

        // Update active button
        document.querySelectorAll('.nw-timeframe-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update time range
        this.netWorthTimeRange = range;

        // Trigger re-render
        if (this.game.isPlayingOrPaused()) {
          this.renderGraph(this.game);
        }
      });
    });

    // Max amount button
    const maxQtyBtn = document.getElementById('max-qty-btn');
    if (maxQtyBtn) {
      maxQtyBtn.addEventListener('click', () => {
        if (!this.game.isPlayingOrPaused() || !this.game.selectedAsset) return;

        const asset = this.game.market.getAsset(this.game.selectedAsset);
        if (!asset) return;

        const leverage = this.game.trading.getLeverage(this.game.progression.data);
        const feeReduction = this.game.trading.getFeeReduction(this.game.progression.data);
        const modeConfig = TRADING_MODES[this.game.selectedMode];
        const feePercent = CONFIG.BASE_FEE_PERCENT * modeConfig.feeMod * (1 - feeReduction);

        // Calculate max dollar amount: cash * leverage, accounting for fees
        const maxDollarAmount = Math.floor(this.game.trading.cash * leverage / (1 + feePercent / (100 * leverage)));

        this.el.tradeQuantity.value = Math.max(1, maxDollarAmount);
      });
    }

    // Quick buy percentage buttons
    document.querySelectorAll('.quick-buy-buttons .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this.game.isPlayingOrPaused() || !this.game.selectedAsset) return;

        const asset = this.game.market.getAsset(this.game.selectedAsset);
        if (!asset) return;

        const percent = parseFloat(btn.dataset.percent);
        const leverage = this.game.trading.getLeverage(this.game.progression.data);
        const feeReduction = this.game.trading.getFeeReduction(this.game.progression.data);
        const modeConfig = TRADING_MODES[this.game.selectedMode];
        const feePercent = CONFIG.BASE_FEE_PERCENT * modeConfig.feeMod * (1 - feeReduction);

        // Calculate max amount accounting for leverage and fees
        const maxDollarAmount = this.game.trading.cash * leverage / (1 + feePercent / (100 * leverage));
        const amount = Math.floor(maxDollarAmount * (percent / 100));

        this.el.tradeQuantity.value = Math.max(1, amount);

        // Trigger input event to update shares preview
        this.el.tradeQuantity.dispatchEvent(new Event('input'));
      });
    });

    // Buy
    if (this.el.buyBtn) {
      this.el.buyBtn.addEventListener('click', () => {
        const amount = parseFloat(this.el.tradeQuantity.value) || 1000;
        this.game.buyAsset(amount);
      });
    }

    // Sell (close first position of selected asset)
    if (this.el.sellBtn) {
      this.el.sellBtn.addEventListener('click', () => {
        const positions = this.game.trading.positions;
        const ticker = this.game.selectedAsset;
        const posIndex = positions.findIndex(p => p.ticker === ticker);

        if (posIndex >= 0) {
          this.game.sellPosition(posIndex);
        } else {
          this.showTradeResult({ success: false, message: 'No position to sell' });
        }
      });
    }

    // Short
    if (this.el.shortBtn) {
      this.el.shortBtn.addEventListener('click', () => {
        const amount = parseFloat(this.el.tradeQuantity.value) || 1000;
        this.game.shortAsset(amount);
      });
    }

    // Insider modal buttons
    const insiderAcceptBtn = document.getElementById('insider-accept');
    const insiderIgnoreBtn = document.getElementById('insider-ignore');
    if (insiderAcceptBtn) {
      insiderAcceptBtn.addEventListener('click', () => {
        if (this.game.pendingInsiderDecision) {
          this.game.acceptInsiderTip(this.game.pendingInsiderDecision);
          this.game.pendingInsiderDecision = null;
        }
      });
    }
    if (insiderIgnoreBtn) {
      insiderIgnoreBtn.addEventListener('click', () => {
        this.game.ignoreInsiderTip();
        this.game.pendingInsiderDecision = null;
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // F11 fullscreen toggle (works on any screen)
      if (e.key === 'F11') {
        e.preventDefault();
        if (window.electronAPI && window.electronAPI.toggleFullscreen) {
          window.electronAPI.toggleFullscreen();
        }
        return;
      }

      // Don't intercept keys when user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (this.game.state !== 'playing' && this.game.state !== 'paused') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.game.togglePause();
          break;
        case '1': this.game.setSpeed(1); break;
        case '2': this.game.setSpeed(2); break;
        case '3': this.game.setSpeed(5); break;
        case '4': this.game.setSpeed(10); break;
      }
    });
  }

  // ---- Screen Management ----

  showMenu() {
    this.el.menuScreen.classList.remove('hidden');
    this.el.yearSelectScreen.classList.add('hidden');
    this.el.gameScreen.classList.add('hidden');
    this.el.runEndScreen.classList.add('hidden');
    if (this.el.loadingOverlay) {
      this.el.loadingOverlay.classList.add('hidden');
    }
    this.renderMenu();

    // Clear chart manager
    if (this.chartManager) {
      this.chartManager.clear();
      this.chartManager = null;
    }
  }

  showLoading() {
    this.el.menuScreen.classList.add('hidden');
    this.el.yearSelectScreen.classList.add('hidden');
    this.el.gameScreen.classList.add('hidden');
    this.el.runEndScreen.classList.add('hidden');
    if (this.el.loadingOverlay) {
      this.el.loadingOverlay.classList.remove('hidden');
    }
  }

  showYearSelect(mode) {
    this._pendingMode = mode;
    this.el.menuScreen.classList.add('hidden');
    this.el.yearSelectScreen.classList.remove('hidden');
    // In demo mode, lock to 2020. Disable slider and year input so the user can't change them.
    if (DEMO_MODE) {
      this.el.startYearSlider.value = 2020;
      this.el.startYearSlider.disabled = true;
      if (this.el.startYearDisplay) this.el.startYearDisplay.readOnly = true;
      this.updateYearDisplay(2020);
    } else {
      this.el.startYearSlider.disabled = false;
      document.querySelectorAll('.year-preset-btn').forEach(btn => btn.style.display = '');
      const startYear = parseInt(this.el.startYearSlider.value);
      this.updateYearDisplay(startYear);
    }
  }

  getRunYears() {
    let extraYears = 0;
    const prog = this.game.progression;
    if (prog && prog.data) {
      if (prog.data.unlocks.timeInMarket3) extraYears = 3;
      else if (prog.data.unlocks.timeInMarket2) extraYears = 2;
      else if (prog.data.unlocks.timeInMarket1) extraYears = 1;
    }
    return CONFIG.FIXED_RUN_YEARS + extraYears;
  }

  updateYearDisplay(startYear) {
    const totalYears = this.getRunYears();
    const endYear = startYear + totalYears - 1;

    this.el.startYearDisplay.value = startYear;
    this.el.endYearDisplay.textContent = endYear;

    // Update subtitle text
    const subtitle = document.getElementById('year-section-subtitle');
    if (subtitle) {
      subtitle.textContent = `Choose when to start your ${totalYears}-year run (2000-2023)`;
    }

    // Store selected years in game object
    this.game.selectedYears = { start: startYear, end: endYear };
  }

  showGame() {
    this.el.menuScreen.classList.add('hidden');
    this.el.yearSelectScreen.classList.add('hidden');
    this.el.gameScreen.classList.remove('hidden');
    this.el.runEndScreen.classList.add('hidden');
    if (this.el.loadingOverlay) {
      this.el.loadingOverlay.classList.add('hidden');
    }

    // Reset filters on new run
    this.currentSearchTerm = '';
    if (this.el.assetSearch) {
      this.el.assetSearch.value = '';
    }

    // Populate category pills
    this.renderCategoryPills();

    // Initialize chart manager
    if (!this.chartManager && this.el.chartContainer && this.el.chartTabsBar) {
      this.chartManager = new ChartManager(
        this.el.chartContainer,
        this.el.chartTabsBar
      );
      this.chartManager.onTabChange = (ticker) => {
        this.game.selectedAsset = ticker;
      };

      // Add default tab for first asset
      if (this.game.selectedAsset) {
        this.chartManager.addTab(this.game.selectedAsset, 'line');
      }
    }
  }

  renderCategoryPills() {
    if (!this.el.categoryPills) return;

    const unlockedCategories = this.game.progression.getUnlockedCategories();

    const sortedCategories = Object.entries(STOCK_CATEGORIES)
      .filter(([key]) => unlockedCategories.includes(key))
      .sort((a, b) => a[1].sortOrder - b[1].sortOrder);

    // Analyst Reports: sector momentum indicators
    const hasAnalyst = this.game.progression.data.unlocks.analystReports;
    const momentum = hasAnalyst ? this.game.market.getSectorMomentum() : {};

    let html = `<button class="category-pill ${this.currentCategoryFilter === 'all' ? 'active' : ''}" data-category="all">All</button>`;

    for (const [key, config] of sortedCategories) {
      const isActive = this.currentCategoryFilter === key ? 'active' : '';
      let momentumTag = '';
      if (hasAnalyst && momentum[key]) {
        const m = momentum[key];
        momentumTag = m.label === 'HOT' ? ' \u25B2' : m.label === 'COLD' ? ' \u25BC' : '';
      }
      html += `<button class="category-pill ${isActive}" data-category="${key}">${config.icon} ${config.name}${momentumTag}</button>`;
    }

    this.el.categoryPills.innerHTML = html;

    // Bind pill click events
    this.el.categoryPills.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        this.currentCategoryFilter = pill.dataset.category;
        this.el.categoryPills.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.filterAssets(this.currentSearchTerm);
      });
    });
  }

  showPauseOverlay(show) {
    if (this.el.pauseOverlay) {
      this.el.pauseOverlay.classList.toggle('hidden', !show);
    }
  }

  // ---- Menu Rendering ----

  renderMenu() {
    const prog = this.game.progression;
    console.log('[Mode Unlock] renderMenu called - unlockedModes:', prog.data.unlockedModes);
    console.log('[Mode Unlock] prog === this.game.progression?', prog === this.game.progression);
    console.log('[Mode Unlock] prog object ID:', prog);

    // Stats
    this.el.menuPP.textContent = formatMoney(prog.data.upgradeCredits || 0);
    this.el.menuRunCount.textContent = prog.data.runCount;

    // Billion progress bar
    const GOAL = 1e9;
    const bestNet = prog.data.runHistory.length > 0
      ? Math.max(...prog.data.runHistory.map(r => r.netWorth))
      : 0;
    const pct = Math.min(100, (bestNet / GOAL) * 100);
    const bestValueEl = document.getElementById('billion-best-value');
    const pctEl = document.getElementById('billion-pct');
    const fillEl = document.getElementById('billion-fill');
    if (bestValueEl) bestValueEl.textContent = formatMoney(bestNet);
    if (pctEl) pctEl.textContent = pct < 0.01 && bestNet > 0 ? '<0.01%' : pct.toFixed(2) + '%';
    if (fillEl) fillEl.style.width = Math.max(pct, bestNet > 0 ? 0.5 : 0) + '%';

    // Update year display (may have changed from shop unlocks)
    if (this.el.startYearSlider) {
      const currentStart = parseInt(this.el.startYearSlider.value);
      this.updateYearDisplay(currentStart);
    }

    // Bind play button
    if (this.el.playBtn) {
      this.el.playBtn.onclick = () => this.showYearSelect('stocks');
    }

    // Unlock shop - MOVED TO SHOP SCREEN, COMMENTING OUT OLD CODE
    /*
    const unlocks = prog.getAvailableUnlocks();
    const purchased = Object.keys(prog.data.unlocks);

    let unlockHtml = '';

    // Available unlocks as tiles
    if (unlocks.length === 0 && purchased.length === 0) {
      unlockHtml = '<p class="muted">No unlocks available yet.</p>';
    } else {
      unlockHtml = '<div class="shop-grid">';

      // Available unlocks
      for (const unlock of unlocks) {
        const canAfford = prog.data.prestigePoints >= unlock.cost;
        const stateClass = canAfford ? 'affordable' : 'locked';

        unlockHtml += `
          <div class="shop-tile ${stateClass}" data-unlock="${unlock.id}">
            <div class="shop-tile-header">
              <div class="shop-tile-name">${unlock.name}</div>
              <div class="shop-tile-cost">${unlock.cost} Pts</div>
            </div>
            <div class="shop-tile-description">${unlock.description}</div>
            <button class="btn btn-small ${canAfford ? 'btn-accent' : 'btn-disabled'}"
                    data-unlock="${unlock.id}" ${canAfford ? '' : 'disabled'}>
              ${canAfford ? 'Purchase' : 'Locked'}
            </button>
          </div>
        `;
      }

      // Purchased unlocks
      for (const id of purchased) {
        const u = UNLOCKS[id];
        if (u) {
          unlockHtml += `
            <div class="shop-tile owned">
              <div class="shop-tile-header">
                <div class="shop-tile-name">${u.name}</div>
                <div class="shop-tile-badge">✓ OWNED</div>
              </div>
              <div class="shop-tile-description">${u.description}</div>
            </div>
          `;
        }
      }

      unlockHtml += '</div>';
    }

    this.el.unlockShop.innerHTML = unlockHtml;

    // Bind unlock buttons
    document.querySelectorAll('[data-unlock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.game.purchaseUnlock(btn.dataset.unlock);
        if (result.success) this.renderMenu();
      });
    });
    */

    // Equipable Tools - MOVED TO SHOP SCREEN, COMMENTING OUT OLD CODE
    /*
    const ownedTools = prog.data.ownedTools || [];
    const equippedTool = prog.data.equippedTool;

    let toolHtml = '<div class="shop-grid">';

    // Available tools
    for (const [id, tool] of Object.entries(EQUIPABLE_TOOLS)) {
      const isOwned = ownedTools.includes(id);
      const isEquipped = equippedTool === id;
      const canAfford = prog.data.prestigePoints >= tool.cost;
      const hasRequirement = !tool.requires || prog.data.unlocks[tool.requires];

      if (!isOwned) {
        // Show as purchasable
        const canPurchase = canAfford && hasRequirement;
        toolHtml += `
          <div class="shop-tile ${canPurchase ? 'affordable' : 'locked'}">
            <div class="shop-tile-header">
              <div class="shop-tile-name">${tool.name}</div>
              <div class="shop-tile-cost">${tool.cost} Pts</div>
            </div>
            <div class="shop-tile-description">${tool.description}</div>
            ${!hasRequirement ? `<div class="muted" style="font-size: 11px; margin-top: 4px;">Requires: ${UNLOCKS[tool.requires]?.name}</div>` : ''}
            <button class="btn btn-small ${canPurchase ? 'btn-accent' : 'btn-disabled'}"
                    data-tool="${id}" data-action="purchase" ${canPurchase ? '' : 'disabled'}>
              ${canPurchase ? 'Purchase' : 'Locked'}
            </button>
          </div>
        `;
      } else {
        // Show as owned with equip/unequip
        toolHtml += `
          <div class="shop-tile ${isEquipped ? 'equipped' : 'owned'}">
            <div class="shop-tile-header">
              <div class="shop-tile-name">${tool.name}</div>
              <div class="shop-tile-badge">${isEquipped ? '⚡ ACTIVE' : '✓ OWNED'}</div>
            </div>
            <div class="shop-tile-description">${tool.description}</div>
            <div class="tool-stats" style="font-family: var(--font-mono); font-size: 12px; color: var(--rh-green); margin-top: 4px;">
              +${formatMoney(tool.passiveIncomePerDay)}/day
            </div>
            <button class="btn btn-small ${isEquipped ? 'btn-danger' : 'btn-primary'}"
                    data-tool="${id}" data-action="${isEquipped ? 'unequip' : 'equip'}">
              ${isEquipped ? 'Unequip' : 'Equip'}
            </button>
          </div>
        `;
      }
    }

    toolHtml += '</div>';

    this.el.toolSelector.innerHTML = toolHtml;

    // Bind tool buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.dataset.tool;
        const action = btn.dataset.action;

        if (action === 'purchase') {
          const result = prog.purchaseTool(toolId);
          if (result.success) this.renderMenu();
        } else if (action === 'equip') {
          prog.equipTool(toolId);
          this.renderMenu();
        } else if (action === 'unequip') {
          prog.unequipTool();
          this.renderMenu();
        }
      });
    });
    */

    // Achievements
    const achProgress = AchievementUI.getProgressSummary(prog);
    const earned = AchievementUI.getEarnedList(prog);
    const locked = AchievementUI.getLockedList(prog);

    let achHtml = `<p>${achProgress.earned}/${achProgress.total} (${achProgress.percent}%)</p>`;
    for (const a of earned) {
      achHtml += `<div class="achievement-card earned"><strong>${a.name}</strong> <span>${a.description}</span></div>`;
    }
    for (const a of locked) {
      achHtml += `<div class="achievement-card locked"><strong>${a.name}</strong> <span class="muted">${a.hint}</span></div>`;
    }
    this.el.menuAchievements.innerHTML = achHtml;

    // Titles
    const titles = AchievementUI.getTitleList(prog);
    let titleHtml = '';
    for (const t of titles) {
      const cls = t.earned ? (t.equipped ? 'equipped' : '') : 'locked';
      titleHtml += `
        <div class="title-card ${cls}">
          <strong>${t.earned ? t.name : '???'}</strong>
          <span>${t.earned ? t.description : 'Not yet earned'}</span>
          ${t.earned ? `<button class="btn btn-small btn-title" data-title="${t.id}">${t.equipped ? 'Unequip' : 'Equip'}</button>` : ''}
        </div>
      `;
    }
    this.el.titleSelector.innerHTML = titleHtml;

    // Bind title buttons
    document.querySelectorAll('.btn-title').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.title;
        if (prog.data.equippedTitle === id) {
          prog.unequipTitle();
        } else {
          this.game.equipTitle(id);
        }
        this.renderMenu();
      });
    });

    // Leaderboards
    this.renderLeaderboards();

    // Pre-render for tab switching
    this.renderShop();
    this.renderSettingsState();
  }

  renderLeaderboards() {
    const lb = this.game.leaderboard;
    const entries = lb.getBoard('highScore');
    let html = '<h4>Personal High Scores</h4>';

    if (entries.length === 0) {
      html += '<p class="muted">No runs completed yet</p>';
    } else {
      html += '<ol class="leaderboard-list">';
      for (const e of entries.slice(0, 10)) {
        const nameLabel = e.name ? `<strong>${e.name}</strong> - ` : '';
        html += `<li>${nameLabel}${e.display} <span class="muted">Run #${e.run} (${e.date})</span></li>`;
      }
      html += '</ol>';
      html += '<button class="btn btn-danger" id="clear-leaderboard-btn" style="margin-top: 16px;">Clear Leaderboard</button>';
    }

    this.el.menuLeaderboards.innerHTML = html;

    const clearBtn = document.getElementById('clear-leaderboard-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.showConfirm('Clear Leaderboard', 'Are you sure you want to clear the leaderboard? This cannot be undone.', () => {
          lb.clearAll();
          this.renderLeaderboards();
        }, 'Clear');
      });
    }
  }

  // ---- Shop ----

  showShop() {
    this.renderShop();
  }

  showSettings() {
    this.renderSettingsState();
  }

  renderSettingsState() {
    const volumeSlider = document.getElementById('settings-volume');
    const volumeValue = document.getElementById('settings-volume-value');
    const muteBtn = document.getElementById('settings-mute-btn');
    const tutorialBtn = document.getElementById('settings-tutorial-btn');

    if (volumeSlider) {
      const vol = Math.round(this.game.audio.volume * 100);
      volumeSlider.value = vol;
      if (volumeValue) volumeValue.textContent = vol + '%';
    }
    if (muteBtn) {
      muteBtn.textContent = this.game.audio.muted ? 'On' : 'Off';
      muteBtn.classList.toggle('active', this.game.audio.muted);
    }
    if (tutorialBtn) {
      const showTutorial = !this.game.progression.data.hideTutorial;
      tutorialBtn.textContent = showTutorial ? 'On' : 'Off';
      tutorialBtn.classList.toggle('active', showTutorial);
    }
  }

  renderShop() {
    const prog = this.game.progression;
    console.log('renderShop called - Current unlocks:', prog.data.unlocks);

    // Update credits display (both shop and top-of-menu)
    const creditsFormatted = formatMoney(prog.data.upgradeCredits || 0);
    this.el.shopPP.textContent = creditsFormatted;
    this.el.menuPP.textContent = creditsFormatted;

    // Define progression tree structure (store as instance property)
    // Now reading costs and requirements from UNLOCKS config
    this.treeStructure = [
      {
        category: 'Stock Sectors',
        icon: '📊',
        nodes: [
          { id: 'financeStocks', name: 'Finance', icon: '🏦', cost: UNLOCKS.financeStocks.cost },
          { id: 'healthcareStocks', name: 'Healthcare', icon: '💊', cost: UNLOCKS.healthcareStocks.cost },
          { id: 'industrialsStocks', name: 'Industrials', icon: '🏭', cost: UNLOCKS.industrialsStocks.cost },
          { id: 'energyStocks', name: 'Energy', icon: '🛢️', cost: UNLOCKS.energyStocks.cost },
          { id: 'techStocks', name: 'Tech', icon: '💻', cost: UNLOCKS.techStocks.cost },
          { id: 'memeStocks', name: 'Meme', icon: '🚀', cost: UNLOCKS.memeStocks.cost, requires: [UNLOCKS.memeStocks.requires] },
          { id: 'cryptoTrading', name: 'Crypto', icon: '₿', cost: UNLOCKS.cryptoTrading.cost, requires: [UNLOCKS.cryptoTrading.requires] },
        ]
      },
      {
        category: 'Trading Power',
        icon: '',
        nodes: [
          { id: 'leverage2x', name: '2x Leverage', icon: '', cost: UNLOCKS.leverage2x.cost },
          { id: 'leverage5x', name: '5x Leverage', icon: '', cost: UNLOCKS.leverage5x.cost, requires: [UNLOCKS.leverage5x.requires] },
          { id: 'leverage10x', name: '10x Leverage', icon: '', cost: UNLOCKS.leverage10x.cost, requires: [UNLOCKS.leverage10x.requires] },
          { id: 'leverage50x', name: '50x Leverage', icon: '', cost: UNLOCKS.leverage50x.cost, requires: [UNLOCKS.leverage50x.requires] },
        ]
      },
      {
        category: 'Fee Reduction',
        icon: '',
        nodes: [
          { id: 'reducedFees1', name: 'Fees -25%', icon: '', cost: UNLOCKS.reducedFees1.cost },
          { id: 'reducedFees2', name: 'Fees -50%', icon: '', cost: UNLOCKS.reducedFees2.cost, requires: [UNLOCKS.reducedFees2.requires] },
          { id: 'reducedFees3', name: 'Fees -75%', icon: '', cost: UNLOCKS.reducedFees3.cost, requires: [UNLOCKS.reducedFees3.requires] },
        ]
      },
      {
        category: 'Career Path',
        icon: '',
        nodes: [
          { id: 'morePositions', name: 'Portfolio+', icon: '', cost: UNLOCKS.morePositions.cost },
          { id: 'startingCash2x', name: 'Trust Fund', icon: '', cost: UNLOCKS.startingCash2x.cost },
          { id: 'startingCash5x', name: 'Rich Parents', icon: '', cost: UNLOCKS.startingCash5x.cost, requires: [UNLOCKS.startingCash5x.requires] },
          { id: 'silverSpoon', name: 'Silver Spoon', icon: '', cost: UNLOCKS.silverSpoon.cost, requires: [UNLOCKS.silverSpoon.requires] },
          { id: 'oligarchHeir', name: "Oligarch's Heir", icon: '', cost: UNLOCKS.oligarchHeir.cost, requires: [UNLOCKS.oligarchHeir.requires] },
        ]
      },
      {
        category: 'Risk Management',
        icon: '',
        nodes: [
          { id: 'riskManager1', name: 'Risk Mgr I', icon: '', cost: UNLOCKS.riskManager1.cost },
          { id: 'riskManager2', name: 'Risk Mgr II', icon: '', cost: UNLOCKS.riskManager2.cost, requires: [UNLOCKS.riskManager2.requires] },
          { id: 'riskManager3', name: 'Risk Mgr III', icon: '', cost: UNLOCKS.riskManager3.cost, requires: [UNLOCKS.riskManager3.requires] },
          { id: 'riskImmunity', name: 'Risk Immunity', icon: '', cost: UNLOCKS.riskImmunity.cost, requires: [UNLOCKS.riskImmunity.requires] },
        ]
      },
      {
        category: 'Stealth',
        icon: '',
        nodes: [
          { id: 'lowerSurv1', name: 'Low Profile I', icon: '', cost: UNLOCKS.lowerSurv1.cost },
          { id: 'lowerSurv2', name: 'Low Profile II', icon: '', cost: UNLOCKS.lowerSurv2.cost, requires: [UNLOCKS.lowerSurv2.requires] },
          { id: 'ghostMode', name: 'Ghost Mode', icon: '', cost: UNLOCKS.ghostMode.cost, requires: [UNLOCKS.ghostMode.requires] },
        ]
      },
      {
        category: 'Market Intel',
        icon: '',
        nodes: [
          { id: 'bloombergTerminal', name: 'Bloomberg', icon: '', cost: UNLOCKS.bloombergTerminal.cost },
          { id: 'analystReports', name: 'Analyst Reports', icon: '', cost: UNLOCKS.analystReports.cost, requires: [UNLOCKS.analystReports.requires] },
          { id: 'timeTravelersAlmanac', name: "Almanac", icon: '', cost: UNLOCKS.timeTravelersAlmanac.cost, requires: [UNLOCKS.timeTravelersAlmanac.requires] },
          { id: 'earningsCalendar', name: 'Earnings Calendar', icon: '', cost: UNLOCKS.earningsCalendar.cost, requires: [UNLOCKS.earningsCalendar.requires] },
          { id: 'volatilityScanner', name: 'Volatility Scanner', icon: '', cost: UNLOCKS.volatilityScanner.cost, requires: [UNLOCKS.volatilityScanner.requires] },
        ]
      },
      {
        category: 'Time in the Market',
        icon: '',
        nodes: [
          { id: 'timeInMarket1', name: '+1 Year (3yr)', icon: '', cost: UNLOCKS.timeInMarket1.cost },
          { id: 'timeInMarket2', name: '+2 Years (4yr)', icon: '', cost: UNLOCKS.timeInMarket2.cost, requires: [UNLOCKS.timeInMarket2.requires] },
          { id: 'timeInMarket3', name: '+3 Years (5yr)', icon: '', cost: UNLOCKS.timeInMarket3.cost, requires: [UNLOCKS.timeInMarket3.requires] },
        ]
      },
      {
        category: 'Passive Income',
        icon: '',
        nodes: [
          { id: 'dividendPortfolio', name: 'Dividends', icon: '', cost: UNLOCKS.dividendPortfolio.cost },
          { id: 'hedgeFundFee', name: 'Hedge Fund Fee', icon: '', cost: UNLOCKS.hedgeFundFee.cost, requires: [UNLOCKS.hedgeFundFee.requires] },
        ]
      },
      {
        category: 'Naughty Activities',
        icon: '',
        nodes: [
          { id: 'insiderNetwork', name: 'Insider Network', icon: '', cost: UNLOCKS.insiderNetwork.cost },
          { id: 'burnerPhone', name: 'Burner Phone', icon: '', cost: UNLOCKS.burnerPhone.cost, requires: [UNLOCKS.burnerPhone.requires] },
          { id: 'caymanShellCorp', name: 'Cayman Shell Corp', icon: '', cost: UNLOCKS.caymanShellCorp.cost, requires: [UNLOCKS.caymanShellCorp.requires] },
          { id: 'fakeNewsBot', name: 'Fake News Bot', icon: '', cost: UNLOCKS.fakeNewsBot.cost, requires: [UNLOCKS.fakeNewsBot.requires] },
          { id: 'moneyLaundering', name: 'Money Laundering', icon: '', cost: UNLOCKS.moneyLaundering.cost, requires: [UNLOCKS.moneyLaundering.requires] },
          { id: 'ponziScheme', name: 'Ponzi Scheme', icon: '', cost: UNLOCKS.ponziScheme.cost, requires: [UNLOCKS.ponziScheme.requires] },
        ]
      },
      {
        category: 'Political',
        icon: '',
        nodes: [
          { id: 'politicalDonations', name: 'PAC Access', icon: '', cost: UNLOCKS.politicalDonations.cost },
        ]
      },
      {
        category: 'Connections',
        icon: '',
        nodes: [
          { id: 'darkPoolAccess', name: 'Dark Pool', icon: '', cost: UNLOCKS.darkPoolAccess.cost },
          { id: 'offshoreAccounts', name: 'Offshore Accounts', icon: '', cost: UNLOCKS.offshoreAccounts.cost, requires: [UNLOCKS.offshoreAccounts.requires] },
          { id: 'politicianRetainer', name: 'Politician', icon: '', cost: UNLOCKS.politicianRetainer.cost, requires: [UNLOCKS.politicianRetainer.requires] },
          { id: 'lobbyistNetwork', name: 'Lobbyist Network', icon: '', cost: UNLOCKS.lobbyistNetwork.cost, requires: [UNLOCKS.lobbyistNetwork.requires] },
          { id: 'mediaContact', name: 'Media Contact', icon: '', cost: UNLOCKS.mediaContact.cost, requires: [UNLOCKS.mediaContact.requires] },
          { id: 'secMole', name: 'SEC Mole', icon: '', cost: UNLOCKS.secMole.cost, requires: [UNLOCKS.secMole.requires] },
          { id: 'judgeOnRetainer', name: 'Judge on Retainer', icon: '', cost: UNLOCKS.judgeOnRetainer.cost, requires: [UNLOCKS.judgeOnRetainer.requires] },
        ]
      },
      {
        category: 'Survival',
        icon: '',
        nodes: [
          { id: 'goldenParachute', name: 'Golden Parachute', icon: '', cost: UNLOCKS.goldenParachute.cost },
          { id: 'fallGuy', name: 'Fall Guy', icon: '', cost: UNLOCKS.fallGuy.cost, requires: [UNLOCKS.fallGuy.requires] },
          { id: 'bailFund', name: 'Bail Fund', icon: '', cost: UNLOCKS.bailFund.cost, requires: [UNLOCKS.bailFund.requires] },
          { id: 'deadMansSwitch', name: "Dead Man's Switch", icon: '', cost: UNLOCKS.deadMansSwitch.cost, requires: [UNLOCKS.deadMansSwitch.requires] },
          { id: 'offshoreEscape', name: 'Offshore Escape', icon: '', cost: UNLOCKS.offshoreEscape.cost, requires: [UNLOCKS.offshoreEscape.requires] },
        ]
      },
      {
        category: 'Automation',
        icon: '',
        nodes: [
          { id: 'stopLoss', name: 'Stop Loss', icon: '', cost: UNLOCKS.stopLoss.cost },
          { id: 'takeProfit', name: 'Take Profit', icon: '', cost: UNLOCKS.takeProfit.cost, requires: [UNLOCKS.takeProfit.requires] },
          { id: 'dollarCostAverage', name: 'DCA Bot', icon: '', cost: UNLOCKS.dollarCostAverage.cost, requires: [UNLOCKS.dollarCostAverage.requires] },
        ]
      },
      {
        category: 'Time Travel',
        icon: '',
        nodes: [
          { id: 'dejaVu', name: 'Deja Vu', icon: '', cost: UNLOCKS.dejaVu.cost },
          { id: 'butterflyEffect', name: 'Butterfly Effect', icon: '', cost: UNLOCKS.butterflyEffect.cost, requires: [UNLOCKS.butterflyEffect.requires] },
          { id: 'temporalArbitrage', name: 'Temporal Arbitrage', icon: '', cost: UNLOCKS.temporalArbitrage.cost, requires: [UNLOCKS.temporalArbitrage.requires] },
          { id: 'groundhogDay', name: 'Groundhog Day', icon: '', cost: UNLOCKS.groundhogDay.cost, requires: [UNLOCKS.groundhogDay.requires] },
        ]
      },
      {
        category: 'Reputation',
        icon: '',
        nodes: [
          { id: 'charityFoundation', name: 'Charity Foundation', icon: '', cost: UNLOCKS.charityFoundation.cost },
          { id: 'tedTalk', name: 'TED Talk', icon: '', cost: UNLOCKS.tedTalk.cost, requires: [UNLOCKS.tedTalk.requires] },
          { id: 'bookDeal', name: 'Book Deal', icon: '', cost: UNLOCKS.bookDeal.cost, requires: [UNLOCKS.bookDeal.requires] },
          { id: 'cnbcRegular', name: 'CNBC Regular', icon: '', cost: UNLOCKS.cnbcRegular.cost, requires: [UNLOCKS.cnbcRegular.requires] },
        ]
      },
      {
        category: 'Portfolio Bonuses',
        icon: '',
        nodes: [
          { id: 'diversificationBonus', name: 'Diversification', icon: '', cost: UNLOCKS.diversificationBonus.cost },
          { id: 'sectorRotation', name: 'Sector Rotation', icon: '', cost: UNLOCKS.sectorRotation.cost, requires: [UNLOCKS.sectorRotation.requires] },
          { id: 'whaleStatus', name: 'Whale Status', icon: '', cost: UNLOCKS.whaleStatus.cost, requires: [UNLOCKS.whaleStatus.requires] },
        ]
      },
      {
        category: 'Algo Tools',
        icon: '',
        nodes: [
          { id: 'algoEngine', name: 'Algo Engine', icon: '', cost: UNLOCKS.algoEngine.cost },
          { id: 'scalping', name: 'Scalping Bot', icon: '', cost: EQUIPABLE_TOOLS.scalping.cost, requires: ['algoEngine'], isTool: true },
          { id: 'arbitrage', name: 'Arbitrage Scanner', icon: '', cost: EQUIPABLE_TOOLS.arbitrage.cost, isTool: true },
          { id: 'marketMaking', name: 'Market Making', icon: '', cost: EQUIPABLE_TOOLS.marketMaking.cost, isTool: true },
          { id: 'algoTrading', name: 'Algo Trading', icon: '', cost: EQUIPABLE_TOOLS.algoTrading.cost, isTool: true },
        ]
      },
    ];

    // Render tree
    let treeHtml = '';
    for (const category of this.treeStructure) {
      treeHtml += `<div class="tree-category">`;
      treeHtml += `<div class="tree-category-title">${category.category}</div>`;
      treeHtml += `<div class="tree-nodes">`;

      for (let i = 0; i < category.nodes.length; i++) {
        const node = category.nodes[i];
        const owned = node.isTool
          ? prog.data.ownedTools.includes(node.id)
          : (prog.data.ownedUnlocks[node.id] || false);
        const equipped = node.isTool
          ? prog.data.equippedTool === node.id
          : (prog.data.unlocks[node.id] || false);
        const canAfford = (prog.data.upgradeCredits || 0) >= node.cost;

        // Check if prerequisites are met
        let prereqsMet = true;
        let missingPrereq = null;

        // Explicit requires from config
        if (node.requires) {
          prereqsMet = node.requires.every(req => prog.data.ownedUnlocks[req]);
          if (!prereqsMet) {
            missingPrereq = node.requires.find(req => !prog.data.ownedUnlocks[req]);
          }
        }

        // Implicit: each node requires the previous node in the row to be owned
        if (prereqsMet && i > 0) {
          const prevNode = category.nodes[i - 1];
          const prevOwned = prevNode.isTool
            ? prog.data.ownedTools.includes(prevNode.id)
            : (prog.data.ownedUnlocks[prevNode.id] || false);
          if (!prevOwned) {
            prereqsMet = false;
            missingPrereq = prevNode.id;
          }
        }

        // Demo mode: check if this unlock is restricted
        const isDemoLocked = DEMO_MODE && !DEMO_ALLOWED_UNLOCKS.has(node.id) && !owned;

        // Determine node state
        let statusClass, statusText;
        if (isDemoLocked) {
          statusClass = 'demo-locked';
          statusText = 'Full Game Only';
        } else if (owned && equipped) {
          statusClass = 'unlocked';
          statusText = 'Equipped';
        } else if (owned && !equipped) {
          statusClass = 'unequipped';
          statusText = 'Unequipped';
        } else if (!prereqsMet) {
          statusClass = 'blocked';
          const prereqName = UNLOCKS[missingPrereq]?.name || EQUIPABLE_TOOLS[missingPrereq]?.name || missingPrereq;
          statusText = `Requires: ${prereqName}`;
        } else if (!canAfford) {
          statusClass = 'locked';
          statusText = 'Too Expensive';
        } else {
          statusClass = 'available';
          statusText = 'Available';
        }

        treeHtml += `
          <div class="tree-node ${statusClass}" data-node-id="${node.id}" ${!prereqsMet && !isDemoLocked ? `data-blocked-reason="Requires: ${UNLOCKS[missingPrereq]?.name || missingPrereq}"` : ''}>
            <div class="node-name">${node.name}</div>
            <div class="node-cost">${isDemoLocked ? '🔒' : formatMoney(node.cost)}</div>
            <div class="node-status ${statusClass}">${statusText}</div>
          </div>
        `;
      }

      treeHtml += `</div></div>`;
    }

    this.el.progressionTree.innerHTML = treeHtml;
    console.log('Tree HTML updated. Unlocked nodes in DOM:',
      document.querySelectorAll('.tree-node.unlocked').length);

    // Bind node click events
    document.querySelectorAll('.tree-node').forEach(node => {
      node.addEventListener('click', () => {
        const nodeId = node.dataset.nodeId;
        this.showNodeDetail(nodeId);
      });
    });
  }

  showNodeDetail(nodeId) {
    const prog = this.game.progression;
    console.log('showNodeDetail called for:', nodeId, 'Current unlocks:', prog.data.unlocks);

    // Demo mode: block purchase of restricted unlocks
    if (DEMO_MODE && !DEMO_ALLOWED_UNLOCKS.has(nodeId) && !prog.data.ownedUnlocks[nodeId]) {
      this.showToast('Available in the full game on Steam!', 'info');
      return;
    }

    // Find the node in tree structure
    let nodeData = null;
    for (const category of this.treeStructure) {
      const found = category.nodes.find(n => n.id === nodeId);
      if (found) {
        nodeData = found;
        break;
      }
    }

    if (!nodeData) {
      console.log('Node data not found for:', nodeId);
      return;
    }

    // Get unlock details from config
    const unlock = UNLOCKS[nodeId] || EQUIPABLE_TOOLS[nodeId];
    if (!unlock) {
      console.log('Unlock config not found for:', nodeId);
      return;
    }

    const isTool = nodeData.isTool || false;
    const owned = isTool
      ? prog.data.ownedTools.includes(nodeId)
      : (prog.data.ownedUnlocks[nodeId] || false);
    const equipped = isTool
      ? prog.data.equippedTool === nodeId
      : (prog.data.unlocks[nodeId] || false);
    const canAfford = (prog.data.upgradeCredits || 0) >= nodeData.cost;

    let prereqsMet = true;
    let prereqText = 'None';
    if (nodeData.requires) {
      prereqsMet = nodeData.requires.every(req => prog.data.ownedUnlocks[req]);
      if (!prereqsMet) {
        const missing = nodeData.requires.filter(req => !prog.data.ownedUnlocks[req]);
        prereqText = `Requires: ${missing.map(r => {
          for (const cat of this.treeStructure) {
            const n = cat.nodes.find(node => node.id === r);
            if (n) return n.name;
          }
          return UNLOCKS[r]?.name || r;
        }).join(', ')}`;
      }
    }

    // Implicit: each node requires the previous node in its row
    if (prereqsMet) {
      for (const cat of this.treeStructure) {
        const idx = cat.nodes.findIndex(n => n.id === nodeId);
        if (idx > 0) {
          const prevNode = cat.nodes[idx - 1];
          const prevOwned = prevNode.isTool
            ? prog.data.ownedTools.includes(prevNode.id)
            : (prog.data.ownedUnlocks[prevNode.id] || false);
          if (!prevOwned) {
            prereqsMet = false;
            prereqText = `Requires: ${prevNode.name}`;
          }
          break;
        }
      }
    }

    let detailHtml = `
      <div class="detail-header">
        <div class="detail-icon">${nodeData.icon}</div>
        <div class="detail-name">${nodeData.name}</div>
        <div class="detail-cost">${formatMoney(nodeData.cost)}</div>
      </div>

      <div class="detail-section">
        <div class="detail-section-title">Description</div>
        <div class="detail-description">${unlock.description}</div>
      </div>
    `;

    // Show passive income for tools
    if (isTool && unlock.passiveIncomePerDay) {
      detailHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Passive Income</div>
          <div class="detail-description" style="color: var(--rh-green); font-family: var(--font-mono);">+${formatMoney(unlock.passiveIncomePerDay)}/day</div>
        </div>
      `;
    }

    if (nodeData.requires) {
      detailHtml += `
        <div class="detail-section">
          <div class="detail-section-title">Prerequisites</div>
          <div class="detail-prereqs">${prereqText}</div>
        </div>
      `;
    }

    detailHtml += `<div class="detail-action">`;

    if (owned && equipped) {
      detailHtml += `<button class="btn btn-equip equipped" data-toggle-equip="${nodeId}">Unequip</button>`;
    } else if (owned && !equipped) {
      detailHtml += `<button class="btn btn-equip" data-toggle-equip="${nodeId}">Equip</button>`;
    } else if (!prereqsMet) {
      detailHtml += `<button class="btn btn-disabled" disabled>Prerequisites Not Met</button>`;
    } else if (!canAfford) {
      detailHtml += `<button class="btn btn-disabled" disabled>Cannot Afford (${formatMoney(nodeData.cost)})</button>`;
    } else {
      detailHtml += `<button class="btn btn-accent" data-unlock="${nodeId}">Purchase for ${formatMoney(nodeData.cost)}</button>`;
    }

    detailHtml += `</div>`;

    this.el.shopItemDetail.innerHTML = detailHtml;

    // Bind purchase button
    const unlockBtn = this.el.shopItemDetail.querySelector('[data-unlock]');
    if (unlockBtn) {
      unlockBtn.addEventListener('click', () => {
        const result = isTool ? prog.purchaseTool(nodeId) : prog.purchaseUnlock(nodeId);
        if (result.success) {
          this.renderShop();
          this.showNodeDetail(nodeId);
        } else {
          this.showAlert('Cannot Purchase', result.message);
        }
      });
    }

    // Bind equip/unequip toggle button
    const toggleBtn = this.el.shopItemDetail.querySelector('[data-toggle-equip]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (isTool) {
          if (equipped) {
            prog.unequipTool();
            this.renderShop();
            this.showNodeDetail(nodeId);
          } else {
            const result = prog.equipTool(nodeId);
            if (result.success) {
              this.renderShop();
              this.showNodeDetail(nodeId);
            } else {
              this.showAlert('Cannot Equip', result.message);
            }
          }
        } else {
          const result = prog.toggleEquip(nodeId);
          if (result.success) {
            this.renderShop();
            this.showNodeDetail(nodeId);
          } else {
            this.showAlert('Cannot Equip', result.message);
          }
        }
      });
    }

    // Scroll sidebar into view so it's always visible after selection
    const sidebar = document.querySelector('.shop-detail-sidebar');
    if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ---- Game Rendering ----

  update(game) {
    // Bug Fix #40: Null check for game object
    if (!game) return;
    // Bug Fix #37: Use centralized state check
    if (!game.isPlayingOrPaused()) return;

    // Header - Time display
    if (game.isIntraday && game.currentTime) {
      // Intraday mode: show time-of-day
      const timeStr = game.currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      this.el.dayCounter.textContent = timeStr;

      // Countdown
      const remaining = CONFIG.INTRADAY_TOTAL_TICKS - game.currentMinute;
      this.el.countdownTimer.textContent = `T-${remaining} min`;

      // Color coding
      if (remaining > 200) {
        this.el.countdownTimer.style.color = 'var(--rh-green)';
      } else if (remaining > 60) {
        this.el.countdownTimer.style.color = 'var(--rh-yellow)';
      } else {
        this.el.countdownTimer.style.color = 'var(--rh-red)';
      }
    } else {
      // Daily mode: show calendar date
      const currentDate = game.getCurrentDate();
      const dateStr = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      this.el.dayCounter.textContent = dateStr;

      // Countdown timer
      if (this.el.countdownTimer) {
        const remaining = game.totalDays - game.currentDay;
        this.el.countdownTimer.textContent = `T-${remaining} days`;

        // Color code based on percentage remaining
        const percentRemaining = remaining / game.totalDays;
        if (percentRemaining > 0.3) {
          this.el.countdownTimer.style.color = 'var(--rh-green)';
        } else if (percentRemaining > 0.1) {
          this.el.countdownTimer.style.color = 'var(--rh-yellow)';
        } else {
          this.el.countdownTimer.style.color = 'var(--rh-red)';
        }
      }
    }

    // Cooldown indicator
    // Cooldown system removed for better UX

    // Update shares preview
    if (this.el.sharesPreview && game.selectedAsset) {
      const amount = parseFloat(this.el.tradeQuantity.value) || 0;
      const asset = game.market.getAsset(game.selectedAsset);
      if (asset && amount > 0) {
        const shares = amount / asset.price;
        this.el.sharesPreview.textContent = `~${shares.toFixed(4)} shares`;
      } else {
        this.el.sharesPreview.textContent = '~0 shares';
      }
    }

    // Asset selector - re-apply filters every tick (same pattern as search)
    this.filterAssets(this.currentSearchTerm || '');

    // Net worth graph
    this.renderGraph(game);

    // Chart manager
    if (this.chartManager) {
      this.chartManager.renderActiveChart(game.market, game.currentDay, game.selectedMode, game.trading.positions);
    }

    // Quarterly target panel
    this.renderQuarterlyTarget(game);

    // Meters with risk warnings
    const risk = game.trading.getRiskLevel(game.market, game.progression.data);
    this.el.riskFill.style.width = risk + '%';
    this.el.riskValue.textContent = Math.round(risk) + '%';

    // Add warning classes
    let riskClass = 'safe';
    if (risk >= CONFIG.RISK_DANGER_PERCENT) {
      riskClass = 'danger';
    } else if (risk >= CONFIG.RISK_WARNING_PERCENT) {
      riskClass = 'warning';
    }
    this.el.riskFill.className = `meter-fill risk ${riskClass}`;

    this.el.secFill.style.width = game.sec.attention + '%';
    // SEC Mole: show exact attention and hidden arrest threshold
    if (game.progression.data.unlocks.secMole) {
      this.el.secValue.textContent = game.sec.attention.toFixed(1) + '%';
      this.el.secLabel.textContent = `${game.sec.getLabel()} (arrest: ${Math.round(game.sec.arrestThreshold)}%)`;
    } else {
      this.el.secValue.textContent = Math.round(game.sec.attention) + '%';
      this.el.secLabel.textContent = game.sec.getLabel();
    }

    // Portfolio
    this.renderPortfolio(game);

    // Actions (illegal actions, donations, etc.)
    this.renderActions(game);

    // News
    this.renderNews(game);

    // Cash and net worth displays
    this.el.cashDisplay.textContent = formatMoney(game.trading.cash);
    this.el.netWorthDisplay.textContent = formatMoney(game.trading.netWorth);
  }

  renderAssetSelector(game, filteredAssets = null) {
    const assets = filteredAssets || game.market.getAllAssets();
    const modeConfig = TRADING_MODES[game.selectedMode];

    if (modeConfig && (modeConfig.isPassive || modeConfig.isAlgo)) {
      this.el.assetSelector.innerHTML = `<div style="padding: 16px; color: var(--rh-text-secondary);">${modeConfig.name} - Passive Mode</div>`;
      return;
    }

    const hasBloomberg = game.progression.data.unlocks.bloombergTerminal;

    let html = '';
    for (const asset of assets) {
      const change = game.market.getPriceChange(asset.ticker);
      const changeClass = change >= 0 ? 'positive' : 'negative';
      const selected = asset.ticker === game.selectedAsset ? 'selected' : '';
      const impacted = game.news.isTickerImpacted(asset.ticker);
      const impactClass = impacted ? 'asset-impacted' : '';

      // Category emoji
      const assetDef = SP500_ASSETS.find(a => a.ticker === asset.ticker)
        || (TRADING_MODES.crypto && TRADING_MODES.crypto.assets.find(a => a.ticker === asset.ticker));
      const category = assetDef ? (assetDef.category || 'consumer') : 'consumer';
      const categoryIcon = STOCK_CATEGORIES[category] ? STOCK_CATEGORIES[category].icon : '';

      // Bloomberg Terminal: 5-day trend arrow
      let trendHtml = '';
      if (hasBloomberg) {
        const trend = game.market.get5DayTrend(asset.ticker);
        trendHtml = `<span class="asset-trend trend-${trend.className}">${trend.arrow}</span>`;
      }

      // Deja Vu: 10-day price change %
      let dejaVuHtml = '';
      if (game.progression.data.unlocks.dejaVu && asset.history.length >= 10) {
        const priceNow = asset.price;
        const price10Ago = asset.history[asset.history.length - 10];
        if (price10Ago > 0) {
          const pctChange = ((priceNow - price10Ago) / price10Ago) * 100;
          const dvClass = pctChange >= 0 ? 'positive' : 'negative';
          dejaVuHtml = `<span class="deja-vu-indicator ${dvClass}" title="10-day change">${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}%</span>`;
        }
      }

      // Volatility Scanner: show volatility rating
      let volHtml = '';
      if (game.progression.data.unlocks.volatilityScanner && asset.history.length >= 5) {
        const recentPrices = asset.history.slice(-20);
        let sumSqReturns = 0;
        for (let j = 1; j < recentPrices.length; j++) {
          const ret = (recentPrices[j] - recentPrices[j-1]) / recentPrices[j-1];
          sumSqReturns += ret * ret;
        }
        const vol = Math.sqrt(sumSqReturns / (recentPrices.length - 1)) * 100;
        let volLabel, volClass;
        if (vol < 1.5) { volLabel = 'LOW'; volClass = 'vol-low'; }
        else if (vol < 3.5) { volLabel = 'MED'; volClass = 'vol-med'; }
        else { volLabel = 'HIGH'; volClass = 'vol-high'; }
        volHtml = `<span class="vol-indicator ${volClass}" title="Volatility: ${vol.toFixed(1)}%">${volLabel}</span>`;
      }

      html += `
        <button class="asset-btn ${selected} ${impactClass}" data-ticker="${asset.ticker}">
          <div class="asset-btn-left">
            ${impacted ? '<span class="impact-indicator">📰</span>' : ''}
            <span class="asset-ticker">${categoryIcon} ${asset.ticker}</span>
            <span class="asset-name">${asset.name}</span>
          </div>
          <div class="asset-btn-right">
            ${dejaVuHtml}
            ${volHtml}
            ${trendHtml}
            <span class="asset-price">${formatPrice(asset.price)}</span>
            <span class="asset-change ${changeClass}">${(change >= 0 ? '+' : '')}${(change * 100).toFixed(1)}%</span>
          </div>
        </button>
      `;
    }
    this.el.assetSelector.innerHTML = html;

    // Bind asset buttons
    document.querySelectorAll('.asset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        game.selectAsset(btn.dataset.ticker);
      });
    });
  }

  filterAssets(searchTerm) {
    if (!this.game || !this.game.isPlayingOrPaused()) return;

    // Only show stocks that are live (publicly traded) at the current game date
    const assets = this.game.market.getLiveAssets();
    const searchLower = searchTerm.toLowerCase().trim();

    let filtered = assets;

    // Apply category filter first
    if (this.currentCategoryFilter !== 'all') {
      filtered = filtered.filter(asset => {
        // Get category from SP500_ASSETS or crypto assets by ticker
        const assetDef = SP500_ASSETS.find(a => a.ticker === asset.ticker)
          || (TRADING_MODES.crypto && TRADING_MODES.crypto.assets.find(a => a.ticker === asset.ticker));
        const category = assetDef ? (assetDef.category || 'consumer') : 'consumer';
        return category === this.currentCategoryFilter;
      });
    }

    // Then apply search filter
    if (searchTerm) {
      filtered = filtered.filter(asset => {
        const ticker = asset.ticker.toLowerCase();
        const name = asset.name.toLowerCase();

        // Exact match
        if (ticker === searchLower || name === searchLower) return true;

        // Contains match
        if (ticker.includes(searchLower) || name.includes(searchLower)) return true;

        // Fuzzy match (allow 1 character difference)
        return this.fuzzyMatch(searchLower, ticker) || this.fuzzyMatch(searchLower, name);
      });
    }

    this.renderAssetSelector(this.game, filtered);
  }

  fuzzyMatch(search, target) {
    if (search.length < 2) return false;

    let searchIdx = 0;
    for (let i = 0; i < target.length && searchIdx < search.length; i++) {
      if (target[i] === search[searchIdx]) {
        searchIdx++;
      }
    }

    return searchIdx >= search.length - 1; // Allow 1 missing character
  }

  renderGraph(game) {
    const canvas = this.graphCanvas;
    const ctx = this.graphCtx;
    if (!canvas || !ctx) return;

    // Bug Fix #42: Validate parent element exists and is visible
    if (!canvas.parentElement) return;

    const rect = canvas.parentElement.getBoundingClientRect();

    // Bug Fix #9: Canvas sizing race condition - validate dimensions before rendering
    if (rect.width === 0 || rect.height === 0) {
      return; // Skip render if not ready
    }

    // Only resize if dimensions changed
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Apply time range filter
    let data;
    if (this.netWorthTimeRange === 'max') {
      data = game.trading.netWorthHistory;
    } else {
      const days = parseInt(this.netWorthTimeRange);
      data = game.trading.netWorthHistory.slice(-days);
    }

    if (data.length < 2) {
      // Show "No data in this time range" message
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#888';
      ctx.font = '18px var(--font-primary)';
      ctx.textAlign = 'center';
      ctx.fillText('No data in this time range', w / 2, h / 2);
      return;
    }

    const w = canvas.width;
    const h = canvas.height;
    const padding = 55;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Find min/max (include quarterly target in range so it's always visible)
    let min = Infinity, max = -Infinity;
    for (const v of data) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
    if (game.quarterly && !game.quarterly.isAllComplete()) {
      const targetVal = game.quarterly.getCurrentTarget().target;
      min = Math.min(min, targetVal);
      max = Math.max(max, targetVal);
    }
    if (min === max) { min -= 1; max += 1; }

    const range = max - min;

    // Draw grid lines
    ctx.strokeStyle = '#2a2a3a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (h - padding * 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();

      // Label
      const value = max - (range * i / 4);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(value), padding - 4, y + 4);
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = data[data.length - 1] >= data[0] ? '#4caf50' : '#f44336';
    ctx.lineWidth = 2;

    const xStep = (w - padding - 10) / Math.max(1, data.length - 1);
    for (let i = 0; i < data.length; i++) {
      const x = padding + i * xStep;
      const y = padding + (1 - (data[i] - min) / range) * (h - padding * 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Fill under the line
    const lastX = padding + (data.length - 1) * xStep;
    const lastY = padding + (1 - (data[data.length - 1] - min) / range) * (h - padding * 2);
    ctx.lineTo(lastX, h - padding);
    ctx.lineTo(padding, h - padding);
    ctx.closePath();
    ctx.fillStyle = data[data.length - 1] >= data[0]
      ? 'rgba(76, 175, 80, 0.1)'
      : 'rgba(244, 67, 54, 0.1)';
    ctx.fill();

    // Current value label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(formatMoney(data[data.length - 1]), w - 10, lastY - 6);

    // Quarterly target line
    if (game.quarterly && !game.quarterly.isAllComplete()) {
      const targetValue = game.quarterly.getCurrentTarget().target;
      if (targetValue >= min && targetValue <= max) {
        const targetY = padding + (1 - (targetValue - min) / range) * (h - padding * 2);
        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = 'rgba(255, 214, 10, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(padding, targetY);
        ctx.lineTo(w - 10, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 214, 10, 0.8)';
        ctx.font = '14px monospace';
        ctx.textAlign = 'right';
        ctx.fillText('Target: ' + formatMoney(targetValue), w - 14, targetY - 8);
      }
    }

    // X-axis date labels
    if (game.market && game.market.startDate) {
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';

      const totalDays = data.length;
      const labelCount = Math.min(5, totalDays);
      const xLabelStep = Math.floor(totalDays / labelCount);

      // Calculate offset for filtered data
      const fullHistory = game.trading.netWorthHistory;
      const startOffset = fullHistory.length - data.length;

      for (let i = 0; i < labelCount; i++) {
        const dayIdx = i * xLabelStep;
        if (dayIdx < totalDays) {
          const x = padding + dayIdx * xStep;
          const y = h - padding + 20;

          // Calculate date accounting for filtered range, include year
          const actualDayIdx = startOffset + dayIdx;
          const date = new Date(game.market.startDate);
          date.setDate(date.getDate() + actualDayIdx);
          const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          ctx.fillText(label, x, y);
        }
      }
    }
  }

  renderPortfolio(game) {
    const positions = game.trading.positions;
    if (positions.length === 0) {
      this.el.portfolioList.innerHTML = '<div style="padding: 16px; color: var(--rh-text-secondary); text-align: center;">No open positions</div>';
      return;
    }

    let html = '';
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const { pnl, pnlPercent, currentPrice } = game.trading.getPositionPnL(pos, game.market);
      const pnlClass = pnl >= 0 ? 'positive' : 'negative';
      const typeLabel = pos.type === 'short' ? 'Short' : 'Long';
      const typeClass = pos.type === 'short' ? 'short' : 'long';

      html += `
        <div class="position-card">
          <div class="position-header">
            <span class="position-ticker">${pos.ticker}</span>
            <span class="position-type ${typeClass}">${typeLabel}</span>
          </div>
          <div class="position-details">
            <div class="position-detail-item">
              <span class="position-detail-label">Quantity</span>
              <span class="position-detail-value">${pos.quantity}</span>
            </div>
            <div class="position-detail-item">
              <span class="position-detail-label">Entry</span>
              <span class="position-detail-value">${formatPrice(pos.entryPrice)}</span>
            </div>
            <div class="position-detail-item">
              <span class="position-detail-label">Current</span>
              <span class="position-detail-value">${formatPrice(currentPrice)}</span>
            </div>
            <div class="position-detail-item">
              <span class="position-detail-label">P&L</span>
              <span class="position-detail-value ${pnlClass}">${pnl >= 0 ? '+' : ''}${formatMoney(pnl)}</span>
            </div>
          </div>
          ${pos.leverage > 1 ? `<div style="font-size: 11px; color: var(--rh-yellow); margin-bottom: 8px;">${pos.leverage}x Leverage</div>` : ''}
          <button class="btn btn-sell btn-small" style="width: 100%;"
                  data-ticker="${pos.ticker}"
                  data-type="${pos.type}"
                  data-entry-day="${pos.entryDay}">Close Position</button>
        </div>
      `;
    }

    this.el.portfolioList.innerHTML = html;

    // Bind sell buttons using stable identifiers
    document.querySelectorAll('.btn-sell').forEach(btn => {
      btn.addEventListener('click', () => {
        const ticker = btn.dataset.ticker;
        const type = btn.dataset.type;
        const entryDay = parseInt(btn.dataset.entryDay);
        game.sellPositionByIdentifier(ticker, type, entryDay);
      });
    });
  }

  renderNews(game) {
    let html = '';

    // Time Traveler's Almanac / Earnings Calendar: show upcoming events
    if (game.progression.data.unlocks.timeTravelersAlmanac) {
      // Earnings Calendar extends preview to 5 days (from 3)
      const previewDays = game.progression.data.unlocks.earningsCalendar
        ? UNLOCKS.earningsCalendar.previewDays : 3;
      const upcoming = game.news.getUpcomingEvents(game.currentDay, previewDays);
      for (const event of upcoming) {
        const daysAway = event.day - game.currentDay;
        html += `<div class="news-item almanac">
          <span class="news-timestamp">in ${daysAway}d</span>
          <span class="almanac-tag">ALMANAC</span> ${event.headline}
        </div>`;
      }
    }

    const news = game.news.getRecentNews(12);
    for (const item of news) {
      html += `<div class="news-item ${item.type}">
        <span class="news-timestamp">Day ${item.day}</span>
        ${item.text}
      </div>`;
    }
    this.el.newsFeed.innerHTML = html;
  }

  renderActions(game) {
    const panel = document.getElementById('actions-section');
    if (!panel) return;

    const prog = game.progression.data;
    const sec = game.sec;
    let btns = '';

    // Political Donations
    if (prog.unlocks.politicalDonations) {
      const cost = CONFIG.DONATION_BASE_COST * Math.pow(CONFIG.DONATION_COST_MULTIPLIER, sec.donationCount);
      btns += `<button class="btn btn-small btn-action" data-action="donate" title="Donate to PAC (-SEC)">💰 Donate (${formatMoney(cost)})</button>`;
    }

    // Fall Guy
    if (prog.unlocks.fallGuy && !sec.fallGuyUsed) {
      btns += `<button class="btn btn-small btn-action" data-action="fallGuy" title="Blame someone (-40 SEC)">🎭 Fall Guy</button>`;
    }

    // Insider Trading
    if (sec.canDoIllegalAction('insiderTrading', prog, prog.runCount)) {
      btns += `<button class="btn btn-small btn-action btn-illegal" data-action="insider" title="Get insider tip (+${ILLEGAL_ACTIONS.insiderTrading.secHit} SEC)">🤫 Insider Tip</button>`;
    }

    // Front Running
    if (sec.canDoIllegalAction('frontRunning', prog, prog.runCount)) {
      btns += `<button class="btn btn-small btn-action btn-illegal" data-action="frontRun" title="Front run (+${ILLEGAL_ACTIONS.frontRunning.secHit} SEC)">⚡ Front Run</button>`;
    }

    // Fake News Bot
    if (sec.canDoIllegalAction('fakeNews', prog, prog.runCount)) {
      btns += `<button class="btn btn-small btn-action btn-illegal" data-action="fakeNews" title="Plant fake news (+${ILLEGAL_ACTIONS.fakeNews.secHit} SEC)">📰 Fake News</button>`;
    }

    // Money Laundering
    if (sec.canDoIllegalAction('moneyLaunder', prog, prog.runCount)) {
      btns += `<button class="btn btn-small btn-action btn-illegal" data-action="moneyLaunder" title="Launder money (+${ILLEGAL_ACTIONS.moneyLaunder.secHit} SEC, -5 SEC)">🧹 Launder</button>`;
    }

    // Ponzi Scheme
    if (sec.canDoIllegalAction('ponzi', prog, prog.runCount)) {
      btns += `<button class="btn btn-small btn-action btn-illegal" data-action="ponzi" title="Run ponzi scheme (+${ILLEGAL_ACTIONS.ponzi.secHit} SEC)">🔺 Ponzi</button>`;
    }

    if (btns) {
      panel.innerHTML = `<div class="section-title">Actions</div><div class="action-buttons">${btns}</div>`;

      // Bind action buttons
      panel.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'donate') game.makeDonation();
          else if (action === 'fallGuy') game.useFallGuy();
          else if (action === 'insider') game.doInsiderTrade();
          else if (action === 'frontRun') game.doFrontRun();
          else if (action === 'fakeNews') game.doFakeNews();
          else if (action === 'moneyLaunder') game.doMoneyLaunder();
          else if (action === 'ponzi') game.doPonzi();
        });
      });
    } else {
      panel.innerHTML = '';
    }
  }

  renderQuarterlyTarget(game) {
    if (!this.el.quarterlyPanel || !game.quarterly) return;

    const q = game.quarterly;
    const target = q.getCurrentTarget();
    const netWorth = game.trading.netWorth;
    const daysRemaining = q.getDaysRemainingInQuarter(game.currentDay);

    // Level badges (1-8)
    let badgesHtml = '';
    for (let i = 0; i < CONFIG.TOTAL_QUARTERS; i++) {
      let badgeClass = 'quarterly-badge';
      if (i < q.completedLevels) {
        badgeClass += ' completed';
      } else if (i === q.currentQuarter && !q.isAllComplete()) {
        badgeClass += ' current';
      } else {
        badgeClass += ' locked';
      }
      badgesHtml += `<div class="${badgeClass}">${i + 1}</div>`;
    }
    this.el.quarterlyBadges.innerHTML = badgesHtml;

    // Quarter label
    if (q.isAllComplete()) {
      this.el.quarterlyLabel.textContent = 'COMPLETE';
      this.el.quarterlyLabel.style.color = 'var(--rh-green)';
    } else if (q.isInHeadStart(game.currentDay)) {
      this.el.quarterlyLabel.textContent = 'HEAD START';
      this.el.quarterlyLabel.style.color = 'var(--rh-accent)';
    } else {
      this.el.quarterlyLabel.textContent = q.getQuarterLabel();
      this.el.quarterlyLabel.style.color = '';
    }

    // Target value
    this.el.quarterlyTargetValue.textContent = formatMoney(target.target);

    // Balance value (compared against target)
    this.el.quarterlyEarningsValue.textContent = formatMoney(netWorth);
    if (netWorth < target.target) {
      this.el.quarterlyEarningsValue.classList.add('behind');
    } else {
      this.el.quarterlyEarningsValue.classList.remove('behind');
    }

    // Countdown bar - shows days remaining (counts down)
    const daysInQuarter = CONFIG.QUARTER_DAYS || 91;
    const percentRemaining = (daysRemaining / daysInQuarter) * 100;
    this.el.quarterlyProgressFill.style.width = percentRemaining + '%';

    if (daysRemaining <= 14) {
      this.el.quarterlyProgressFill.classList.add('urgent');
    } else {
      this.el.quarterlyProgressFill.classList.remove('urgent');
    }

    // Timer
    this.el.quarterlyTimerValue.textContent = daysRemaining;
  }

  showTradeResult(result) {
    if (!this.el.tradeResult) return;
    this.el.tradeResult.textContent = result.message;
    this.el.tradeResult.className = 'trade-result ' + (result.success ? 'success' : 'error');

    clearTimeout(this.tradeResultTimeout);
    this.tradeResultTimeout = setTimeout(() => {
      this.el.tradeResult.textContent = '';
      this.el.tradeResult.className = 'trade-result';
    }, 3000);
  }

  spawnFloatingPnL(amount) {
    // Create floating text element
    const floatingText = document.createElement('div');
    floatingText.className = amount > 0 ? 'floating-pnl floating-pnl-up' : 'floating-pnl floating-pnl-down';

    // Format text: +$1,234 or -$1,234
    const sign = amount > 0 ? '+' : '';
    floatingText.textContent = `${sign}${formatMoney(amount)}`;

    // Position near center with slight random offset to avoid overlapping
    const randomOffset = Math.random() * 50 - 25; // -25px to +25px
    floatingText.style.left = `calc(50% + ${randomOffset}px)`;

    // Append to game screen
    this.el.gameScreen.appendChild(floatingText);

    // Remove after animation completes (2 seconds)
    setTimeout(() => {
      if (floatingText.parentNode) {
        floatingText.parentNode.removeChild(floatingText);
      }
    }, 2000);
  }

  // ---- Run End Screen ----

  showRunEnd(game, result, ranking = null) {
    this.el.menuScreen.classList.add('hidden');
    this.el.yearSelectScreen.classList.add('hidden');
    this.el.gameScreen.classList.add('hidden');
    this.el.runEndScreen.classList.remove('hidden');

    const reasonText = {
      arrested: 'ARRESTED BY THE SEC',
      bankrupt: 'BANKRUPT',
      timeUp: 'ALL QUARTERS COMPLETE',
      fired: 'FIRED - RISK LIMIT EXCEEDED',
      quarterFail: 'FIRED - MISSED QUARTERLY TARGET'
    };

    const reasonClass = {
      arrested: 'text-danger',
      bankrupt: 'text-danger',
      timeUp: 'text-success',
      fired: 'text-danger',
      quarterFail: 'text-danger'
    };

    this.el.runEndTitle.textContent = reasonText[game.runEndReason] || 'RUN OVER';
    this.el.runEndTitle.className = 'run-end-title ' + (reasonClass[game.runEndReason] || '');

    const rec = result.runRecord;

    // Add ranking info if available
    let rankingHTML = '';
    if (ranking && ranking.isRanked) {
      rankingHTML = `
        <div class="ranking-display">
          <h3>🏆 Rank #${ranking.rank} of ${Math.max(ranking.total, CONFIG.MAX_LEADERBOARD_ENTRIES)}</h3>
        </div>
      `;
    } else if (ranking && !ranking.isRanked && ranking.minScore !== null) {
      rankingHTML = `
        <div class="ranking-display unranked">
          <h3>Unranked</h3>
          <p class="muted">Top ${CONFIG.MAX_LEADERBOARD_ENTRIES} minimum: ${formatMoney(ranking.minScore)}</p>
        </div>
      `;
    }

    // Build trade history table
    const trades = game.trading.tradeHistory || [];
    let tradeTableHtml = '';
    if (trades.length === 0) {
      tradeTableHtml = '<p class="muted" style="text-align: center; padding: 20px;">No trades this run</p>';
    } else {
      tradeTableHtml = `
        <div class="trade-summary-scroll">
          <table class="trade-summary-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Action</th>
                <th>Ticker</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Fee</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
      `;
      for (const t of trades) {
        const actionClass = t.action === 'BUY' ? 'positive' : t.action === 'SHORT' ? 'negative' : '';
        const pnlHtml = t.profit !== undefined
          ? `<span class="${t.profit >= 0 ? 'positive' : 'negative'}">${t.profit >= 0 ? '+' : ''}${formatMoney(t.profit)}</span>`
          : '-';
        tradeTableHtml += `
          <tr>
            <td>${t.day}</td>
            <td class="${actionClass}">${t.action}</td>
            <td>${t.ticker}</td>
            <td>${t.quantity.toFixed(2)}</td>
            <td>${formatPrice(t.price)}</td>
            <td>${formatMoney(t.fee)}</td>
            <td>${pnlHtml}</td>
          </tr>
        `;
      }
      tradeTableHtml += '</tbody></table></div>';
    }

    this.el.runEndStats.innerHTML = `
      ${rankingHTML}

      <div class="run-end-tabs">
        <button class="run-end-tab active" data-tab="stats">Stats</button>
        <button class="run-end-tab" data-tab="trades">Trade History (${trades.length})</button>
      </div>

      <div class="run-end-tab-content active" data-tab-content="stats">
        <div class="stat-grid">
          <div class="stat-item">
            <span class="stat-label">Final Net Worth</span>
            <span class="stat-value">${formatMoney(rec.netWorth)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Profit</span>
            <span class="stat-value ${rec.profit >= 0 ? 'positive' : 'negative'}">${rec.profit >= 0 ? '+' : ''}${formatMoney(rec.profit)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Days Survived</span>
            <span class="stat-value">${rec.days} / ${game.totalDays}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Trades</span>
            <span class="stat-value">${rec.trades}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Sharpe Ratio</span>
            <span class="stat-value text-accent">${rec.sharpe || '0.00'}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Win Rate</span>
            <span class="stat-value text-accent">${rec.winRate || '0.0%'}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">IRR (Annualized)</span>
            <span class="stat-value text-accent">${(() => {
              const days = rec.days || 1;
              const irr = Math.pow(rec.netWorth / CONFIG.STARTING_CASH, 365 / days) - 1;
              const irrPct = (irr * 100).toFixed(1);
              return (irr >= 0 ? '+' : '') + irrPct + '%';
            })()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Winning Trades</span>
            <span class="stat-value text-success">${rec.winningTrades || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Losing Trades</span>
            <span class="stat-value text-danger">${rec.losingTrades || 0}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Illegal Actions</span>
            <span class="stat-value ${rec.illegalActions > 0 ? 'text-danger' : 'text-success'}">${rec.illegalActions}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Max SEC Attention</span>
            <span class="stat-value">${Math.round(rec.maxSecAttention)}%</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Quarters Completed</span>
            <span class="stat-value text-accent">${game.quarterly.completedLevels} / ${CONFIG.TOTAL_QUARTERS}</span>
          </div>
          <div class="stat-item highlight">
            <span class="stat-label">Credits Earned</span>
            <span class="stat-value text-accent">+${formatMoney(result.creditsEarned)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Credits</span>
            <span class="stat-value">${formatMoney(game.progression.data.upgradeCredits || 0)}</span>
          </div>
        </div>
      </div>

      <div class="run-end-tab-content" data-tab-content="trades">
        ${tradeTableHtml}
      </div>
    `;

    // Bind tab switching
    this.el.runEndStats.querySelectorAll('.run-end-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        // Update active tab button
        this.el.runEndStats.querySelectorAll('.run-end-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show corresponding content
        this.el.runEndStats.querySelectorAll('.run-end-tab-content').forEach(c => c.classList.remove('active'));
        const content = this.el.runEndStats.querySelector(`[data-tab-content="${tabName}"]`);
        if (content) content.classList.add('active');
      });
    });

    // New achievements
    let achHtml = '';
    if (result.newAchievements.length > 0) {
      for (const ach of result.newAchievements) {
        achHtml += `
          <div class="achievement-card earned new">
            <strong>${ach.title ? '👑' : '🏆'} ${ach.name}</strong>
            <span>${ach.description}</span>
            ${ach.title ? `<em class="text-accent">Title unlocked: ${ach.titleDescription}</em>` : ''}
          </div>
        `;
      }
    } else {
      achHtml = '<p class="muted">No new achievements this run</p>';
    }
    this.el.runEndAchievements.innerHTML = achHtml;

    // Clear run name input
    const runNameInput = document.getElementById('run-name-input');
    if (runNameInput) runNameInput.value = '';

    // Back to menu button - save run name before navigating
    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) {
      backBtn.onclick = () => {
        const nameInput = document.getElementById('run-name-input');
        if (nameInput && nameInput.value.trim()) {
          this.game.leaderboard.nameLastRun(nameInput.value);
        }
        this.game.showMenu();
      };
    }
  }

  // ---- Helpers ----

  getRiskColor(risk) {
    if (risk < 30) return 'meter-green';
    if (risk < 60) return 'meter-yellow';
    if (risk < 80) return 'meter-orange';
    return 'meter-red';
  }

  getSecColor(attention) {
    if (attention < 30) return 'meter-green';
    if (attention < 60) return 'meter-yellow';
    if (attention < 80) return 'meter-orange';
    return 'meter-red';
  }

  showInsiderModal(tip) {
    if (!this.el.insiderModal || !this.el.insiderTipText) return;

    this.el.insiderTipText.textContent = tip.text;
    this.el.insiderModal.classList.remove('hidden');
    this.game.pendingInsiderDecision = tip;
  }

  hideInsiderModal() {
    if (!this.el.insiderModal) return;
    this.el.insiderModal.classList.add('hidden');

    // Bug Fix #23: Clear pending insider decision when modal closes
    this.game.pendingInsiderDecision = null;
  }

  showConfirm(title, message, onConfirm, confirmLabel = 'Confirm', isDanger = true) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = confirmLabel;
    okBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
    modal.classList.remove('hidden');

    const cleanup = () => {
      modal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanup();
      onConfirm();
    };

    cancelBtn.onclick = () => {
      cleanup();
    };
  }

  showAlert(title, message) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const okBtn = document.getElementById('confirm-ok-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');

    titleEl.textContent = title;
    msgEl.textContent = message;
    okBtn.textContent = 'OK';
    okBtn.className = 'btn btn-primary';
    cancelBtn.style.display = 'none';
    modal.classList.remove('hidden');

    okBtn.onclick = () => {
      modal.classList.add('hidden');
      cancelBtn.style.display = '';
      okBtn.onclick = null;
    };
  }
}

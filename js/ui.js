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
  }

  init() {
    // Cache DOM elements
    this.el = {
      menuScreen: document.getElementById('menu-screen'),
      gameScreen: document.getElementById('game-screen'),
      runEndScreen: document.getElementById('run-end-screen'),
      loadingOverlay: document.getElementById('loading-overlay'),

      // Header
      dayCounter: document.getElementById('day-counter'),
      pauseBtn: document.getElementById('pause-btn'),
      muteBtn: document.getElementById('mute-btn'),
      volumeSlider: document.getElementById('volume-slider'),

      // Trading panel
      assetSelector: document.getElementById('asset-selector'),
      tradeQuantity: document.getElementById('trade-quantity'),
      buyBtn: document.getElementById('buy-btn'),
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
      pnlDisplay: document.getElementById('pnl-display'),
      modeDisplay: document.getElementById('mode-display'),

      // News
      newsFeed: document.getElementById('news-feed'),

      // Actions
      actionsPanel: document.getElementById('actions-panel'),

      // Menu
      menuPP: document.getElementById('menu-pp'),
      menuRunCount: document.getElementById('menu-run-count'),
      modeSelector: document.getElementById('mode-selector'),
      unlockShop: document.getElementById('unlock-shop'),
      menuAchievements: document.getElementById('menu-achievements'),
      menuLeaderboards: document.getElementById('menu-leaderboards'),
      titleSelector: document.getElementById('title-selector'),

      // Run end
      runEndTitle: document.getElementById('run-end-title'),
      runEndStats: document.getElementById('run-end-stats'),
      runEndAchievements: document.getElementById('run-end-achievements'),

      // Overlays
      pauseOverlay: document.getElementById('pause-overlay'),
      achievementPopup: document.getElementById('achievement-popup'),
    };

    this.graphCanvas = this.el.graphCanvas;
    if (this.graphCanvas) {
      this.graphCtx = this.graphCanvas.getContext('2d');
    }

    this.bindEvents();
  }

  bindEvents() {
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

    // Add chart button
    if (this.el.addChartBtn) {
      this.el.addChartBtn.addEventListener('click', () => {
        if (this.game.selectedAsset && this.chartManager) {
          if (!this.chartManager.hasTab(this.game.selectedAsset)) {
            this.chartManager.addTab(this.game.selectedAsset, 'line');
          }
        }
      });
    }

    // Buy
    if (this.el.buyBtn) {
      this.el.buyBtn.addEventListener('click', () => {
        const qty = parseInt(this.el.tradeQuantity.value) || 1;
        this.game.buyAsset(qty);
      });
    }

    // Short
    if (this.el.shortBtn) {
      this.el.shortBtn.addEventListener('click', () => {
        const qty = parseInt(this.el.tradeQuantity.value) || 1;
        this.game.shortAsset(qty);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
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
    this.el.gameScreen.classList.add('hidden');
    this.el.runEndScreen.classList.add('hidden');
    if (this.el.loadingOverlay) {
      this.el.loadingOverlay.classList.remove('hidden');
    }
  }

  showGame() {
    this.el.menuScreen.classList.add('hidden');
    this.el.gameScreen.classList.remove('hidden');
    this.el.runEndScreen.classList.add('hidden');
    if (this.el.loadingOverlay) {
      this.el.loadingOverlay.classList.add('hidden');
    }

    // Initialize chart manager
    if (!this.chartManager && this.el.chartContainer && this.el.chartTabsBar) {
      this.chartManager = new ChartManager(
        this.el.chartContainer,
        this.el.chartTabsBar
      );

      // Add default tab for first asset
      if (this.game.selectedAsset) {
        this.chartManager.addTab(this.game.selectedAsset, 'line');
      }
    }
  }

  showPauseOverlay(show) {
    if (this.el.pauseOverlay) {
      this.el.pauseOverlay.classList.toggle('hidden', !show);
    }
  }

  // ---- Menu Rendering ----

  renderMenu() {
    const prog = this.game.progression;

    // Stats
    this.el.menuPP.textContent = prog.data.prestigePoints.toFixed(1);
    this.el.menuRunCount.textContent = prog.data.runCount;

    // Mode selector
    const modes = prog.getAvailableModes();
    const lockedModes = Object.entries(TRADING_MODES).filter(([id]) => !modes.find(m => m.id === id));

    let modeHtml = '';
    for (const mode of modes) {
      modeHtml += `
        <div class="mode-card" data-mode="${mode.id}">
          <h3>${mode.name}</h3>
          <p>${mode.description}</p>
          <button class="btn btn-primary start-run-btn" data-mode="${mode.id}">Play</button>
        </div>
      `;
    }
    for (const [id, mode] of lockedModes) {
      modeHtml += `
        <div class="mode-card locked">
          <h3>${mode.name}</h3>
          <p>Unlocks after run ${mode.unlockRun}</p>
        </div>
      `;
    }
    this.el.modeSelector.innerHTML = modeHtml;

    // Bind start buttons
    document.querySelectorAll('.start-run-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game.startRun(btn.dataset.mode);
      });
    });

    // Unlock shop
    const unlocks = prog.getAvailableUnlocks();
    let unlockHtml = '';
    if (unlocks.length === 0) {
      unlockHtml = '<p class="muted">All unlocks purchased!</p>';
    }
    for (const unlock of unlocks) {
      const canAfford = prog.data.prestigePoints >= unlock.cost;
      unlockHtml += `
        <div class="unlock-card ${canAfford ? '' : 'locked'}">
          <div class="unlock-info">
            <strong>${unlock.name}</strong>
            <span>${unlock.description}</span>
          </div>
          <button class="btn btn-small ${canAfford ? 'btn-accent' : 'btn-disabled'}"
                  data-unlock="${unlock.id}" ${canAfford ? '' : 'disabled'}>
            ${unlock.cost} PP
          </button>
        </div>
      `;
    }

    // Show purchased unlocks
    const purchased = Object.keys(prog.data.unlocks);
    if (purchased.length > 0) {
      unlockHtml += '<h4 class="mt-1">Purchased</h4>';
      for (const id of purchased) {
        const u = UNLOCKS[id];
        if (u) {
          unlockHtml += `<div class="unlock-card purchased"><strong>${u.name}</strong> <span class="muted">owned</span></div>`;
        }
      }
    }

    this.el.unlockShop.innerHTML = unlockHtml;

    // Bind unlock buttons
    document.querySelectorAll('[data-unlock]').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = this.game.purchaseUnlock(btn.dataset.unlock);
        if (result.success) this.renderMenu();
      });
    });

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
  }

  renderLeaderboards() {
    const lb = this.game.leaderboard;
    const names = lb.getBoardNames();
    let html = '';

    for (const [id, name] of Object.entries(names)) {
      const entries = lb.getBoard(id);
      html += `<h4>${name}</h4>`;
      if (entries.length === 0) {
        html += '<p class="muted">No entries yet</p>';
      } else {
        html += '<ol class="leaderboard-list">';
        for (const e of entries.slice(0, 5)) {
          html += `<li>Run #${e.run} - ${e.display} <span class="muted">(${e.date})</span></li>`;
        }
        html += '</ol>';
      }
    }

    this.el.menuLeaderboards.innerHTML = html;
  }

  // ---- Game Rendering ----

  update(game) {
    if (game.state !== 'playing' && game.state !== 'paused') return;

    // Header
    this.el.dayCounter.textContent = `Day ${game.currentDay} / ${game.totalDays}`;

    // Asset selector
    this.renderAssetSelector(game);

    // Net worth graph
    this.renderGraph(game);

    // Chart manager
    if (this.chartManager) {
      this.chartManager.renderActiveChart(game.market, game.currentDay, game.selectedMode);
    }

    // Meters
    const risk = game.trading.getRiskLevel(game.market);
    this.el.riskFill.style.width = risk + '%';
    this.el.riskValue.textContent = Math.round(risk) + '%';

    this.el.secFill.style.width = game.sec.attention + '%';
    this.el.secValue.textContent = Math.round(game.sec.attention) + '%';
    this.el.secLabel.textContent = game.sec.getLabel();

    // Portfolio
    this.renderPortfolio(game);

    // News
    this.renderNews(game);

    // Actions panel
    this.renderActions(game);

    // Bottom bar
    this.el.cashDisplay.textContent = formatMoney(game.trading.cash);
    this.el.netWorthDisplay.textContent = formatMoney(game.trading.netWorth);

    if (this.el.pnlDisplay) {
      const pnl = game.trading.netWorth - CONFIG.STARTING_CASH;
      const pnlClass = pnl >= 0 ? 'positive' : 'negative';
      this.el.pnlDisplay.innerHTML = `<span class="${pnlClass}">${formatMoney(pnl)}</span>`;
    }

    if (this.el.modeDisplay) {
      const modeName = TRADING_MODES[game.selectedMode]?.name || game.selectedMode;
      this.el.modeDisplay.textContent = modeName;
    }
  }

  renderAssetSelector(game) {
    const assets = game.market.getAllAssets();
    const modeConfig = TRADING_MODES[game.selectedMode];

    if (modeConfig && (modeConfig.isPassive || modeConfig.isAlgo)) {
      this.el.assetSelector.innerHTML = `<div style="padding: 16px; color: var(--rh-text-secondary);">${modeConfig.name} - Passive Mode</div>`;
      return;
    }

    let html = '';
    for (const asset of assets) {
      const change = game.market.getPriceChange(asset.ticker);
      const changeClass = change >= 0 ? 'positive' : 'negative';
      const selected = asset.ticker === game.selectedAsset ? 'selected' : '';
      const impacted = game.news.isTickerImpacted(asset.ticker);
      const impactClass = impacted ? 'asset-impacted' : '';

      html += `
        <button class="asset-btn ${selected} ${impactClass}" data-ticker="${asset.ticker}">
          <div class="asset-btn-left">
            ${impacted ? '<span class="impact-indicator">📰</span>' : ''}
            <span class="asset-ticker">${asset.ticker}</span>
            <span class="asset-name">${asset.name}</span>
          </div>
          <div class="asset-btn-right">
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

  renderGraph(game) {
    const canvas = this.graphCanvas;
    const ctx = this.graphCtx;
    if (!canvas || !ctx) return;

    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const data = game.trading.netWorthHistory;
    if (data.length < 2) return;

    const w = canvas.width;
    const h = canvas.height;
    const padding = 40;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Find min/max
    let min = Infinity, max = -Infinity;
    for (const v of data) {
      min = Math.min(min, v);
      max = Math.max(max, v);
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
      ctx.fillStyle = '#666';
      ctx.font = '10px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(formatMoney(value), padding - 4, y + 3);
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
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(formatMoney(data[data.length - 1]), lastX + 4, lastY - 4);
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
          <button class="btn btn-sell btn-small" style="width: 100%;" data-pos-index="${i}">Close Position</button>
        </div>
      `;
    }

    this.el.portfolioList.innerHTML = html;

    // Bind sell buttons
    document.querySelectorAll('.btn-sell').forEach(btn => {
      btn.addEventListener('click', () => {
        game.sellPosition(parseInt(btn.dataset.posIndex));
      });
    });
  }

  renderNews(game) {
    const news = game.news.getRecentNews(12);
    let html = '';
    for (const item of news) {
      html += `<div class="news-item ${item.type}">
        <span class="news-timestamp">Day ${item.day}</span>
        ${item.text}
      </div>`;
    }
    this.el.newsFeed.innerHTML = html;
  }

  renderActions(game) {
    const prog = game.progression.data;
    let html = '';

    // Insider trading
    if (game.sec.canDoIllegalAction('insiderTrading', prog, prog.runCount)) {
      html += `<button class="btn btn-danger action-btn" id="action-insider">Insider Tip</button>`;
    }

    // LIBOR rigging
    if (game.sec.canDoIllegalAction('liborRigging', prog, prog.runCount)) {
      html += `<button class="btn btn-danger action-btn" id="action-libor">Rig LIBOR</button>`;
    }

    // Pump & dump
    if (game.sec.canDoIllegalAction('pumpAndDump', prog, prog.runCount)) {
      html += `<button class="btn btn-danger action-btn" id="action-pump">Pump & Dump</button>`;
    }

    // Wash trading
    if (game.sec.canDoIllegalAction('washTrading', prog, prog.runCount)) {
      html += `<button class="btn btn-danger action-btn" id="action-wash">Wash Trade</button>`;
    }

    // Front running
    if (game.sec.canDoIllegalAction('frontRunning', prog, prog.runCount)) {
      html += `<button class="btn btn-danger action-btn" id="action-front">Front Run</button>`;
    }

    // Political donations
    if (prog.unlocks.politicalDonations) {
      const cost = CONFIG.DONATION_BASE_COST * Math.pow(CONFIG.DONATION_COST_MULTIPLIER, game.sec.donationCount);
      html += `<button class="btn btn-accent action-btn" id="action-donate">Donate to PAC (${formatMoney(cost)})</button>`;
    }

    // Insider tip display
    if (game.activeInsiderTip) {
      const tip = game.activeInsiderTip;
      html += `<div class="insider-tip">INSIDER: ${tip.text} (${tip.daysUntil}d)</div>`;
    }

    this.el.actionsPanel.innerHTML = html;

    // Bind action buttons
    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', fn);
    };

    bind('action-insider', () => game.doInsiderTrade());
    bind('action-libor', () => game.doLiborRig());
    bind('action-pump', () => game.doPumpAndDump());
    bind('action-wash', () => game.doWashTrade());
    bind('action-front', () => game.doFrontRun());
    bind('action-donate', () => game.makeDonation());
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

  // ---- Run End Screen ----

  showRunEnd(game, result) {
    this.el.menuScreen.classList.add('hidden');
    this.el.gameScreen.classList.add('hidden');
    this.el.runEndScreen.classList.remove('hidden');

    const reasonText = {
      arrested: 'ARRESTED BY THE SEC',
      bankrupt: 'BANKRUPT',
      timeUp: 'TIME\'S UP'
    };

    const reasonClass = {
      arrested: 'text-danger',
      bankrupt: 'text-danger',
      timeUp: 'text-success'
    };

    this.el.runEndTitle.textContent = reasonText[game.runEndReason] || 'RUN OVER';
    this.el.runEndTitle.className = 'run-end-title ' + (reasonClass[game.runEndReason] || '');

    const rec = result.runRecord;
    this.el.runEndStats.innerHTML = `
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
        <div class="stat-item">
          <span class="stat-label">Illegal Actions</span>
          <span class="stat-value ${rec.illegalActions > 0 ? 'text-danger' : 'text-success'}">${rec.illegalActions}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Max SEC Attention</span>
          <span class="stat-value">${Math.round(rec.maxSecAttention)}%</span>
        </div>
        <div class="stat-item highlight">
          <span class="stat-label">Prestige Earned</span>
          <span class="stat-value text-accent">+${result.pp.toFixed(1)} PP</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Prestige</span>
          <span class="stat-value">${game.progression.data.prestigePoints.toFixed(1)} PP</span>
        </div>
      </div>
    `;

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

    // Back to menu button
    const backBtn = document.getElementById('back-to-menu');
    if (backBtn) {
      backBtn.onclick = () => this.game.showMenu();
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
}

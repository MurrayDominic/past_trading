// ChartManager - Manages multiple chart tabs with candlestick and line rendering
class ChartManager {
  constructor(containerEl, tabBarEl) {
    this.tabs = [];
    this.activeTabId = null;
    this.containerEl = containerEl;
    this.tabBarEl = tabBarEl;
    this.nextId = 0;
    this.timeRange = 'max';  // Time range filter: 7, 30, 252, or 'max'
    this.onTabChange = null;  // callback(ticker) when active tab changes
  }

  setTimeRange(range) {
    this.timeRange = range;
  }

  addTab(ticker, type = 'line') {
    const id = `tab-${this.nextId++}`;
    const canvas = document.createElement('canvas');
    canvas.id = `canvas-${id}`;
    canvas.className = 'chart-canvas';
    this.containerEl.appendChild(canvas);

    const tab = {
      id,
      ticker,
      type,
      active: false,
      canvas,
      ctx: canvas.getContext('2d')
    };

    this.tabs.push(tab);
    this.renderTabBar();
    this.setActiveTab(id);

    return tab;
  }

  closeTab(id) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index === -1) return;

    const tab = this.tabs[index];
    tab.canvas.remove();
    this.tabs.splice(index, 1);

    if (this.activeTabId === id) {
      const nextTab = this.tabs[index] || this.tabs[index - 1] || this.tabs[0];
      if (nextTab) this.setActiveTab(nextTab.id);
      else this.activeTabId = null;
    }

    this.renderTabBar();
  }

  setActiveTab(id) {
    this.tabs.forEach(t => {
      t.active = (t.id === id);
      t.canvas.style.display = t.active ? 'block' : 'none';
    });
    this.activeTabId = id;
    this.renderTabBar();
    const activeTab = this.tabs.find(t => t.id === id);
    if (activeTab && this.onTabChange) {
      this.onTabChange(activeTab.ticker);
    }
  }

  renderTabBar() {
    const container = this.tabBarEl.querySelector('.tabs-scroll-container');
    if (!container) return;

    container.innerHTML = '';

    this.tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `tab-btn ${tab.active ? 'active' : ''}`;
      btn.dataset.tabId = tab.id;

      const label = document.createElement('span');
      label.textContent = tab.ticker;

      const close = document.createElement('span');
      close.className = 'tab-close';
      close.textContent = '×';
      close.onclick = (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      };

      btn.appendChild(label);
      btn.appendChild(close);
      btn.onclick = () => this.setActiveTab(tab.id);

      container.appendChild(btn);
    });
  }

  renderActiveChart(market, currentDay, mode, positions = []) {
    const activeTab = this.tabs.find(t => t.active);
    if (!activeTab) return;

    const asset = market.getAsset(activeTab.ticker);
    if (!asset) return;

    // Resize canvas to fit container
    const rect = activeTab.canvas.parentElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    activeTab.canvas.width = rect.width;
    activeTab.canvas.height = rect.height;

    if (mode === 'dayTrading' && asset.ohlcHistory && asset.ohlcHistory.length > 1) {
      this.renderCandlestickChart(activeTab, asset, positions, market.startDate, currentDay);
    } else if (asset.history && asset.history.length > 1) {
      this.renderLineChart(activeTab, asset, positions, market.startDate, currentDay);
    } else {
      // Show "Loading..." message when data is insufficient
      const ctx = activeTab.canvas.getContext('2d');
      const w = activeTab.canvas.width;
      const h = activeTab.canvas.height;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText('Loading chart data...', w / 2, h / 2);
    }
  }

  renderCandlestickChart(tab, asset, positions = [], startDate = null, currentDay = 0) {
    const ctx = tab.ctx;
    const canvas = tab.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const padding = 60;

    ctx.clearRect(0, 0, w, h);

    // Apply time range filter
    let data;
    if (this.timeRange === 'max') {
      data = asset.ohlcHistory;
    } else {
      const days = parseInt(this.timeRange);
      data = asset.ohlcHistory.slice(-days);
    }

    if (data.length < 2) {
      // Show "No data in this time range" message
      ctx.fillStyle = '#888';
      ctx.font = '14px var(--font-primary)';
      ctx.textAlign = 'center';
      ctx.fillText('No data in this time range', w / 2, h / 2);
      return;
    }

    // Find min/max
    let min = Infinity, max = -Infinity;
    data.forEach(bar => {
      min = Math.min(min, bar.low);
      max = Math.max(max, bar.high);
    });

    // Check for position entry price to include in range
    const position = positions.find(p => p.ticker === asset.ticker);
    if (position) {
      min = Math.min(min, position.entryPrice);
      max = Math.max(max, position.entryPrice);
    }

    const range = max - min;
    if (range === 0) return;

    // Draw gridlines and Y-axis labels
    ctx.font = '12px var(--font-mono)';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = min + (range * i / 5);
      const y = h - padding - (h - padding * 2) * (i / 5);
      ctx.fillText(this.formatPrice(price), padding - 10, y + 4);

      // Gridline
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // Draw candlesticks
    const candleWidth = Math.max(1, (w - padding - 20) / data.length * 0.7);
    const candleSpacing = (w - padding - 20) / data.length;

    // Define toY function BEFORE the forEach loop so it's in scope for entry price line
    const toY = (price) => h - padding - ((price - min) / range) * (h - padding * 2);

    data.forEach((bar, i) => {
      const x = padding + (i + 0.5) * candleSpacing;
      const isGreen = bar.close >= bar.open;
      const color = isGreen ? '#00C805' : '#FF5000';

      // Map prices to Y coordinates
      const openY = toY(bar.open);
      const closeY = toY(bar.close);
      const highY = toY(bar.high);
      const lowY = toY(bar.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1, Math.abs(openY - closeY));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw entry price line if position exists
    if (position) {
      const entryY = toY(position.entryPrice);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, entryY);
      ctx.lineTo(w - 20, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Entry price label
      ctx.font = '11px var(--font-mono)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(`Entry: ${this.formatPrice(position.entryPrice)}`, padding + 10, entryY - 6);
    }

    // Current price label
    const lastBar = data[data.length - 1];
    const isGreen = lastBar.close >= lastBar.open;
    ctx.font = 'bold 18px var(--font-primary)';
    ctx.fillStyle = isGreen ? '#00C805' : '#FF5000';
    ctx.textAlign = 'left';
    ctx.fillText(this.formatPrice(lastBar.close), 20, 30);

    // Asset name
    ctx.font = '14px var(--font-primary)';
    ctx.fillStyle = '#fff';
    ctx.fillText(asset.ticker, 20, 50);

    // X-axis date labels (for candlestick chart, each candle is a day or minute)
    if (startDate) {
      ctx.fillStyle = '#fff';
      ctx.font = '11px var(--font-mono)';
      ctx.textAlign = 'center';

      const visibleData = data;
      const xStep = Math.floor(visibleData.length / 5);

      for (let i = 0; i < 5; i++) {
        const dataIdx = i * xStep;
        if (dataIdx < visibleData.length) {
          const x = padding + dataIdx * candleSpacing + candleSpacing / 2;
          const y = h - padding + 20;

          // Calculate date - for intraday, use minutes; otherwise use days with year
          const daysFromStart = currentDay - (visibleData.length - 1 - dataIdx);
          const date = new Date(startDate);
          date.setDate(date.getDate() + daysFromStart);
          const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          ctx.fillText(label, x, y);
        }
      }
    }
  }

  renderLineChart(tab, asset, positions = [], startDate = null, currentDay = 0) {
    const ctx = tab.ctx;
    const canvas = tab.canvas;
    const w = canvas.width;
    const h = canvas.height;
    const padding = 60;

    ctx.clearRect(0, 0, w, h);

    // Apply time range filter
    let data;
    if (this.timeRange === 'max') {
      data = asset.history;
    } else {
      const days = parseInt(this.timeRange);
      data = asset.history.slice(-days);
    }

    if (data.length < 2) {
      // Show "No data in this time range" message
      ctx.fillStyle = '#888';
      ctx.font = '14px var(--font-primary)';
      ctx.textAlign = 'center';
      ctx.fillText('No data in this time range', w / 2, h / 2);
      return;
    }

    // Guard against empty arrays
    if (asset.history.length === 0) {
      const ctx = tab.canvas.getContext('2d');
      const w = tab.canvas.width;
      const h = tab.canvas.height;

      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText('No price data available', w / 2, h / 2);
      return;
    }

    // Find min/max from FULL history, not just visible data
    let min = Math.min(...asset.history);
    let max = Math.max(...asset.history);

    // Check for position entry price to include in range
    const position = positions.find(p => p.ticker === asset.ticker);
    if (position) {
      min = Math.min(min, position.entryPrice);
      max = Math.max(max, position.entryPrice);
    }

    const range = max - min;
    if (range === 0 || !isFinite(range)) return;

    // Draw gridlines and Y-axis labels
    ctx.font = '12px var(--font-mono)';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const price = min + (range * i / 5);
      const y = h - padding - (h - padding * 2) * (i / 5);
      ctx.fillText(this.formatPrice(price), padding - 10, y + 4);

      // Gridline
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
    }

    // Draw line
    const toY = (price) => h - padding - ((price - min) / range) * (h - padding * 2);
    const spacing = (w - padding - 20) / (data.length - 1);

    ctx.strokeStyle = '#5AC8FA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((price, i) => {
      const x = padding + i * spacing;
      const y = toY(price);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(padding + (data.length - 1) * spacing, h - padding);
    ctx.lineTo(padding, h - padding);
    ctx.closePath();
    ctx.fillStyle = 'rgba(90, 200, 250, 0.1)';
    ctx.fill();

    // Draw entry price line if position exists
    if (position) {
      const entryY = toY(position.entryPrice);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, entryY);
      ctx.lineTo(w - 20, entryY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Entry price label
      ctx.font = '11px var(--font-mono)';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(`Entry: ${this.formatPrice(position.entryPrice)}`, padding + 10, entryY - 6);
    }

    // Current price label
    const lastPrice = data[data.length - 1];
    const isPositive = data.length > 1 && lastPrice >= data[data.length - 2];
    ctx.font = 'bold 18px var(--font-primary)';
    ctx.fillStyle = isPositive ? '#00C805' : '#FF5000';
    ctx.textAlign = 'left';
    ctx.fillText(this.formatPrice(lastPrice), 20, 30);

    // Asset name
    ctx.font = '14px var(--font-primary)';
    ctx.fillStyle = '#fff';
    ctx.fillText(asset.ticker, 20, 50);

    // X-axis date labels
    if (startDate) {
      ctx.fillStyle = '#fff';
      ctx.font = '11px var(--font-mono)';
      ctx.textAlign = 'center';

      const visibleData = data;
      const xStep = Math.floor(visibleData.length / 5);

      for (let i = 0; i < 5; i++) {
        const dataIdx = i * xStep;
        if (dataIdx < visibleData.length) {
          const x = padding + dataIdx * spacing;
          const y = h - padding + 20;

          // Calculate date with year
          const daysFromStart = currentDay - (visibleData.length - 1 - dataIdx);
          const date = new Date(startDate);
          date.setDate(date.getDate() + daysFromStart);
          const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

          ctx.fillText(label, x, y);
        }
      }
    }
  }

  formatPrice(price) {
    if (price >= 1000) return `$${price.toFixed(0)}`;
    if (price >= 10) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(3)}`;
    return `$${price.toFixed(4)}`;
  }

  getActiveTab() {
    return this.tabs.find(t => t.active);
  }

  hasTab(ticker) {
    return this.tabs.some(t => t.ticker === ticker);
  }

  clear() {
    this.tabs.forEach(tab => tab.canvas.remove());
    this.tabs = [];
    this.activeTabId = null;
    this.renderTabBar();
  }
}

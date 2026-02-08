// ============================================================================
// PAST TRADING - News Ticker System
// ============================================================================

class NewsSystem {
  constructor() {
    this.feed = [];          // { text, type, day }
    this.maxEntries = 50;
    this.satiricalCooldown = 0;
  }

  init() {
    this.feed = [];
    this.satiricalCooldown = 0;
    this.addNews('Welcome to the market. You know the future. Use it wisely.', 'system', 0);
  }

  tick(day, market, secSystem) {
    // Add market event news
    if (market.activeEvent) {
      this.addNews(market.activeEvent.text, 'market', day);
    }

    // Satirical news based on SEC attention
    this.satiricalCooldown--;
    if (this.satiricalCooldown <= 0) {
      if (secSystem.attention > 50 && Math.random() < 0.15) {
        // SEC-related satire when under investigation
        const secSatire = [
          'SEC investigator takes lunch break, loses your file',
          'Your lawyer plays golf with the judge this weekend',
          'Congressional committee announces investigation into the investigation',
          'SEC enforcement budget redirected to office renovation',
          'Prosecutor admits they don\'t understand what a derivative is',
        ];
        this.addNews(secSatire[Math.floor(Math.random() * secSatire.length)], 'satirical', day);
        this.satiricalCooldown = 8;
      } else if (Math.random() < 0.08) {
        // Random satirical news
        const satire = SATIRICAL_NEWS[Math.floor(Math.random() * SATIRICAL_NEWS.length)];
        this.addNews(satire, 'satirical', day);
        this.satiricalCooldown = 10;
      }
    }

    // Special news for milestones
    return null;
  }

  addNews(text, type, day) {
    this.feed.unshift({ text, type, day });
    if (this.feed.length > this.maxEntries) {
      this.feed.pop();
    }
  }

  addTradeNews(text, day) {
    this.addNews(text, 'trade', day);
  }

  addSecNews(text, day) {
    this.addNews(text, 'sec', day);
  }

  addMilestoneNews(netWorth, day) {
    const milestones = [100000, 500000, 1000000, 5000000, 10000000, 50000000, 100000000];
    for (const m of milestones) {
      if (netWorth >= m && !this._hitMilestone) {
        this.addNews(`NET WORTH MILESTONE: ${formatMoney(m)}!`, 'milestone', day);
        this._hitMilestone = m;
        return;
      }
    }
  }

  getRecentNews(count = 5) {
    return this.feed.slice(0, count);
  }

  getNewsColor(type) {
    switch (type) {
      case 'market': return '#4fc3f7';
      case 'satirical': return '#ffd54f';
      case 'trade': return '#81c784';
      case 'sec': return '#ef5350';
      case 'milestone': return '#ce93d8';
      case 'system': return '#90a4ae';
      default: return '#ccc';
    }
  }
}

// DataLoader - Loads and manages historical market data from JSON files
class DataLoader {
  constructor() {
    this.cache = new Map();
    this.newsEvents = null;
    this.baseUrl = 'assets/market_data/';
    this.startDate = null;
  }

  async loadAssetData(ticker, category) {
    // Return cached data if available
    if (this.cache.has(ticker)) {
      return this.cache.get(ticker);
    }

    try {
      const response = await fetch(`${this.baseUrl}${category}/${ticker}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load ${ticker}`);
      }

      const data = await response.json();
      this.cache.set(ticker, data);

      // Set start date from first loaded asset
      if (!this.startDate && data.period) {
        this.startDate = new Date(data.period.start);
      }

      return data;
    } catch (error) {
      console.warn(`Data load failed for ${ticker}, using synthetic fallback:`, error);
      return null;
    }
  }

  async loadNewsEvents() {
    if (this.newsEvents) return this.newsEvents;

    try {
      const response = await fetch(`${this.baseUrl}news_events.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      this.newsEvents = data.market_events || [];
      return this.newsEvents;
    } catch (error) {
      console.warn('News events failed to load, using empty array:', error);
      this.newsEvents = [];
      return [];
    }
  }

  getOHLCForDay(ticker, day) {
    const data = this.cache.get(ticker);
    if (!data || !data.ohlc || day >= data.ohlc.length) return null;
    return data.ohlc[day];
  }

  getEventsForDay(day) {
    if (!this.newsEvents) return [];
    return this.newsEvents.filter(e => e.day === day);
  }

  getStartDate() {
    return this.startDate || new Date(2020, 0, 1);
  }

  clearCache() {
    this.cache.clear();
    this.newsEvents = null;
    this.startDate = null;
  }
}

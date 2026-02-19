// DataLoader - Loads and manages historical market data from JSON files
// Supports both Electron (Node.js fs) and browser (fetch) modes
class DataLoader {
  constructor() {
    this.cache = new Map();
    this.newsEvents = null;
    this.baseUrl = 'assets/market_data/';
    this.startDate = null;
    this.isElectron = !!(window.electronAPI && window.electronAPI.isElectron);
  }

  async loadAssetData(ticker, category) {
    // Return cached data if available
    if (this.cache.has(ticker)) {
      return this.cache.get(ticker);
    }

    try {
      let data;
      const relativePath = `${this.baseUrl}${category}/${ticker}.json`;

      if (this.isElectron) {
        // Try compressed first, then uncompressed fallback
        const compressedPath = `${this.baseUrl}compressed/${category}/${ticker}.json.gz`;
        const cachePath = window.electronAPI.getCachePath(category, `${ticker}.json`);
        let raw = window.electronAPI.readCompressedFile(compressedPath, cachePath);
        if (!raw) {
          // Fallback to uncompressed (development mode)
          raw = window.electronAPI.readFile(relativePath);
        }
        if (!raw) throw new Error(`File not found: ${relativePath}`);
        data = JSON.parse(raw);
      } else {
        const response = await fetch(relativePath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to load ${ticker}`);
        }
        data = await response.json();
      }

      this.cache.set(ticker, data);

      // Set start date from first loaded asset's actual OHLC data
      if (!this.startDate && data.ohlc && data.ohlc.length > 0) {
        this.startDate = new Date(data.ohlc[0].date);
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
      let data;
      const relativePath = `${this.baseUrl}news_events.json`;

      if (this.isElectron) {
        const raw = window.electronAPI.readFile(relativePath);
        if (!raw) throw new Error('News events file not found');
        data = JSON.parse(raw);
      } else {
        const response = await fetch(relativePath);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        data = await response.json();
      }

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

  // Time Traveler's Almanac: get events in a future range
  getUpcomingEvents(currentDay, daysAhead) {
    if (!this.newsEvents) return [];
    return this.newsEvents.filter(e => e.day > currentDay && e.day <= currentDay + daysAhead);
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

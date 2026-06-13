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

    // Demo build: use preloaded inline data — no fetch required
    if (typeof DEMO_STOCK_DATA !== 'undefined' && DEMO_STOCK_DATA[ticker]) {
      const data = DEMO_STOCK_DATA[ticker];
      this.cache.set(ticker, data);
      if (!this.startDate && data.ohlc && data.ohlc.length > 0) {
        this.startDate = new Date(data.ohlc[0].date);
      }
      return data;
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
        // Browser mode: try compressed first, always fall back to plain JSON on any failure.
        // Compressed and plain-JSON paths are independent — a failure in compressed
        // (bad response, HTML body, missing DecompressionStream, parse error) will
        // always cause a retry against the plain .json path.
        let loaded = false;

        if (typeof DecompressionStream !== 'undefined') {
          try {
            const compressedPath = `${this.baseUrl}compressed/${category}/${ticker}.json.gz`;
            const compressedResponse = await fetch(compressedPath);
            if (compressedResponse.ok) {
              const buffer = await compressedResponse.arrayBuffer();
              const bytes = new Uint8Array(buffer);
              if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
                // Valid gzip — decompress manually
                const ds = new DecompressionStream('gzip');
                const writer = ds.writable.getWriter();
                writer.write(bytes);
                writer.close();
                const chunks = [];
                const reader = ds.readable.getReader();
                while (true) {
                  const { value, done } = await reader.read();
                  if (done) break;
                  chunks.push(value);
                }
                const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
                const merged = new Uint8Array(totalLength);
                let offset = 0;
                for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
                data = JSON.parse(new TextDecoder().decode(merged));
                loaded = true;
              } else if (bytes[0] === 0x7B || bytes[0] === 0x5B) {
                // Already decompressed by CDN (Content-Encoding: gzip) — bytes are JSON
                data = JSON.parse(new TextDecoder().decode(bytes));
                loaded = true;
              }
              // If bytes look like HTML or anything else, fall through to plain JSON
            }
          } catch (e) {
            // Compressed attempt failed — will retry with plain JSON below
          }
        }

        if (!loaded) {
          // Plain JSON fallback (always present in itch.io demo build)
          const response = await fetch(relativePath);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to load ${ticker}`);
          }
          data = await response.json();
        }
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

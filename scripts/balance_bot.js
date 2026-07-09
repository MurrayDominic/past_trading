// ============================================================================
// PAST TRADING - Balance Bot (v2, Phase 2)
// Simulates lazy buy-and-hold strategies against the quarterly targets using
// the REAL shipped data files and the same rules the game uses (91 trading
// days per quarter, 0.1% fee, ascension target multipliers).
//
// Question it answers: can a player beat the game without making decisions?
// Design goal: buy-and-hold should NOT clear the ladder, especially at
// higher ascension levels.
//
// Run: node scripts/balance_bot.js
// ============================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'assets', 'market_data', 'stocks');

// Pull SP500_ASSETS and the config tables out of the game files
function loadGlobals() {
  const tickersSrc = fs.readFileSync(path.join(ROOT, 'js', 'sp500_tickers.js'), 'utf8');
  const configSrc = fs.readFileSync(path.join(ROOT, 'js', 'config.js'), 'utf8');
  const fn = new Function(tickersSrc + '\n' + configSrc +
    '\nreturn { SP500_ASSETS, CONFIG, ASCENSION_LEVELS };');
  return fn();
}

const { SP500_ASSETS, CONFIG, ASCENSION_LEVELS } = loadGlobals();

const UNLOCKED_CATEGORIES = ['utilities', 'consumer']; // default player start
const QUARTER_DAYS = CONFIG.QUARTER_DAYS;               // 91
const TOTAL_QUARTERS = CONFIG.TOTAL_QUARTERS;           // 8
const START_CASH = CONFIG.STARTING_CASH;                // 10000
const FEE = CONFIG.BASE_FEE_PERCENT / 100;              // 0.001

function loadSeries(ticker) {
  const file = path.join(DATA_DIR, `${ticker}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return data.ohlc || null;
  } catch (e) {
    return null;
  }
}

// First index at or after Jan 1 of the given year
function startIndex(ohlc, year) {
  const target = `${year}-01-01`;
  for (let i = 0; i < ohlc.length; i++) {
    if (ohlc[i].date >= target) return i;
  }
  return -1;
}

// How many quarters a buy-and-hold of this multiple-path passes.
// valueAt(q) = net worth at the END of quarter q (1-indexed).
function quartersPassed(valueAt, targetMult) {
  for (let q = 1; q <= TOTAL_QUARTERS; q++) {
    const target = Math.round(CONFIG.QUARTERLY_TARGETS[q - 1].target * targetMult);
    // The game passes a quarter the moment net worth touches the target,
    // so use the MAX inside the quarter, not the end value.
    if (valueAt(q) < target) return q - 1;
  }
  return TOTAL_QUARTERS;
}

function simulate() {
  const tickers = SP500_ASSETS
    .filter(a => UNLOCKED_CATEGORIES.includes(a.category))
    .map(a => a.ticker);

  const series = {};
  for (const t of tickers) {
    const s = loadSeries(t);
    if (s && s.length > 500) series[t] = s;
  }
  const loaded = Object.keys(series);
  console.log(`Loaded ${loaded.length}/${tickers.length} tickers in [${UNLOCKED_CATEGORIES.join(', ')}]\n`);

  const ascLevels = [0, 5, 10];
  const header = ['Year', 'EqualWeight', ...ascLevels.map(l => `Oracle@A${l}`)];
  console.log(header.join('\t'));

  const oracleTotals = {};
  ascLevels.forEach(l => oracleTotals[l] = 0);
  let ewTotal = 0;
  let years = 0;

  for (let year = 2000; year <= 2022; year++) {
    // Per-ticker: intra-quarter MAX multiple relative to entry (the game
    // passes on touch, so use the running max within each quarter)
    const perTicker = {};
    for (const t of loaded) {
      const s = series[t];
      const i0 = startIndex(s, year);
      if (i0 < 0 || i0 + QUARTER_DAYS * TOTAL_QUARTERS >= s.length) continue;
      const entry = s[i0].close;
      if (!entry) continue;
      const maxMultAtQ = [];
      let runningMax = 0;
      for (let q = 1; q <= TOTAL_QUARTERS; q++) {
        for (let d = (q - 1) * QUARTER_DAYS; d < q * QUARTER_DAYS; d++) {
          const c = s[i0 + d].close;
          if (c / entry > runningMax) runningMax = c / entry;
        }
        maxMultAtQ[q] = runningMax;
      }
      perTicker[t] = maxMultAtQ;
    }

    const usable = Object.keys(perTicker);
    if (usable.length < 5) continue;
    years++;

    // Equal-weight portfolio of everything unlocked (ascension 0)
    const ewValue = (q) => {
      let sum = 0;
      for (const t of usable) sum += perTicker[t][q];
      return START_CASH * (1 - FEE) * (sum / usable.length);
    };
    const ewQ = quartersPassed(ewValue, 1);
    ewTotal += ewQ;

    // Oracle single stock: the best possible buy-and-hold pick (upper bound
    // on any single-stock hold strategy)
    const row = [year, `Q${ewQ}`];
    for (const lvl of ascLevels) {
      const mult = (ASCENSION_LEVELS[lvl].targetMult || 1);
      let best = 0;
      for (const t of usable) {
        const v = (q) => START_CASH * (1 - FEE) * perTicker[t][q];
        const passed = quartersPassed(v, mult);
        if (passed > best) best = passed;
      }
      oracleTotals[lvl] += best;
      row.push(`Q${best}`);
    }
    console.log(row.join('\t'));
  }

  console.log('\n--- Averages over ' + years + ' start years ---');
  console.log(`Equal-weight buy-and-hold:        Q${(ewTotal / years).toFixed(1)} of 8`);
  for (const lvl of ascLevels) {
    console.log(`Oracle single-stock @ascension ${lvl}:  Q${(oracleTotals[lvl] / years).toFixed(1)} of 8`);
  }
  console.log('\nReading: if the ORACLE (perfect pick, impossible in practice)');
  console.log('cannot clear Q3-Q4, real lazy players will fail earlier. The');
  console.log('ladder from Q3 up must require leverage, shorts, crimes, or');
  console.log('actual knowledge-driven trading. That is the design intent.');
}

simulate();

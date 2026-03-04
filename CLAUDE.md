# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

**Desktop (Electron):**
```bash
npm install
npm start
```

**Browser (Development):**
```bash
python -m http.server 8000
```
Then visit http://localhost:8000. Or double-click `start_game.bat` on Windows.

The game loads JSON data files using `fetch()`, which browsers block from `file://` protocol. Must be served over HTTP in browser mode.

**See HOW_TO_RUN.md for detailed instructions and troubleshooting.**

## Architecture Overview

**Past Trading** ("Second Chance at a Billion") is a roguelike trading game where players travel back in time with knowledge of future market events. Built with vanilla JavaScript, packaged as an Electron desktop app with Steamworks integration.

The game operates on a tick-based system where 1 tick = 1 game day. Each run spans 2 years (8 quarters of 91 days each). The game ticks at `CONFIG.TICK_MS` intervals (default 1000ms), adjustable via speed controls (0.5x to 10x).

### Core Game Loop

```
Menu → Year Select → Play Run (tick loop) → Run Ends → Score → Unlock Progression → Menu
```

### System Architecture

The game is composed of **11 subsystems** that communicate through the central `Game` controller:

| # | System | File | Role |
|---|--------|------|------|
| 1 | **Market** | `market.js` | Replays real historical OHLC price data (2000–2024) |
| 2 | **TradingEngine** | `trading.js` | Portfolio management, P&L, buy/sell/short, stop-loss/take-profit |
| 3 | **SECSystem** | `sec.js` | Regulatory attention tracking, investigation stages, illegal actions |
| 4 | **NewsSystem** | `news.js` | Event feed with historical market events and satirical commentary |
| 5 | **QuarterlyTargetSystem** | `quarterly.js` | 8-quarter net worth targets, PP rewards, firing mechanic |
| 6 | **ProgressionSystem** | `progression.js` | Meta-game unlocks, prestige points, run history |
| 7 | **LeaderboardSystem** | `leaderboard.js` | High score tracking with player naming |
| 8 | **ChartManager** | `chart_manager.js` | Multi-tab price charts with time range filters |
| 9 | **AudioEngine** | `audio_engine.js` | Web Audio API synthesis + MP3 background music |
| 10 | **DataLoader** | `data_loader.js` | Historical OHLC data loading (JSON or gzip-compressed) |
| 11 | **SaveManager** | `save_manager.js` | Electron file saves + browser localStorage fallback |

The **Game controller** (`main.js`) orchestrates these systems:
- Maintains game state (`menu | loading | yearSelect | playing | paused | runEnd`)
- Runs the tick loop via `setInterval` at the current speed
- Coordinates system updates: `market.tick()` → `trading.updatePositions()` → `sec.tick()` → `news.tick()` → `quarterly.tick()`
- Handles player actions (buy, sell, illegal activities, donations)
- Manages run lifecycle (start, pause, end)

The **GameUI** (`ui.js`) is a rendering-only layer:
- Reads game state and renders to DOM
- Delegates chart rendering to ChartManager
- Handles user input events and delegates to Game controller
- No game logic, purely presentational

### Script Load Order (Critical)

Scripts must load in this exact order (see `index.html` lines 506-521):

```
sp500_tickers.js → config.js → save_manager.js → data_loader.js →
market.js → trading.js → sec.js → news.js → quarterly.js →
progression.js → achievements.js → leaderboard.js → chart_manager.js →
audio_engine.js → ui.js → main.js
```

- `sp500_tickers.js` defines S&P 500 asset data used by config and market
- `config.js` defines global constants used by all other modules
- `save_manager.js` and `data_loader.js` provide persistence and data loading
- Core systems (market, trading, sec, news, quarterly, progression, leaderboard) are independent
- `chart_manager.js` and `audio_engine.js` are presentation systems
- `ui.js` reads from all systems but doesn't modify them
- `main.js` instantiates everything and wires it together

## Key Data Structures

### Asset (in Market)
```javascript
{
  ticker: 'AAPL',
  price: 150.25,           // current price (from real historical data)
  previousPrice: 149.80,   // last tick's price
  history: [150, 149, ...], // array of closing prices (max 400 days)
  ohlcHistory: [{open, high, low, close}, ...], // real OHLC for candlestick charts
  trend: 0.15,             // momentum factor (-1 to 1)
  highestPrice: 160.50,
  lowestPrice: 140.00,
  hasHistoricalData: true,
  historicalData: {...},    // raw loaded data
  actualDataStartDate: Date // for late-IPO stocks
}
```

### Position (in TradingEngine)
```javascript
{
  ticker: 'AAPL',
  quantity: 100,
  entryPrice: 145.00,
  entryDay: 15,
  type: 'long' | 'short',
  leverage: 2,
  daysInLoss: 0           // tracking for "diamond hands" achievement
}
```

### Progression Data (persisted via SaveManager)
```javascript
{
  prestigePoints: 45.2,
  runCount: 8,
  unlocks: { leverage2x: true, reducedFees1: true, ... },
  equippedTitle: 'maleAstrology' | null,
  earnedAchievements: { maleAstrology: true, ... },
  runHistory: [{ run, netWorth, profit, days, arrested, ... }],
  bestScores: { sharpe, longestSurvival, cleanestProfit, ... }
}
```

## Trading Modes

6 trading modes are defined in `config.js` as `TRADING_MODES` object. Each mode has:
- `volatilityMod`, `feeMod`, `secHeatMod`: Multipliers affecting gameplay
- `assets`: Array of tradeable assets for this mode
- `comingSoon`: Flag for modes not yet playable

Currently playable: **stocks** only. Coming soon: dayTrading, options, forex, commodities, crypto.

Additionally, 4 **equipable tools** exist in `EQUIPABLE_TOOLS` (scalping bot, arbitrage scanner, market making bot, algo trading suite) — these are passive income items requiring the `algoEngine` unlock, not standalone modes.

## Quarterly Target System

The core progression mechanic. Each run has 8 quarters (91 days each):

| Quarter | Target | PP Reward |
|---------|--------|-----------|
| Q1 Y1 | $15,000 | 2 PP |
| Q2 Y1 | $50,000 | 3 PP |
| Q3 Y1 | $250,000 | 4 PP |
| Q4 Y1 | $1,000,000 | 5 PP |
| Q1 Y2 | $10,000,000 | 7 PP |
| Q2 Y2 | $100,000,000 | 9 PP |
| Q3 Y2 | $500,000,000 | 12 PP |
| Q4 Y2 | $1,000,000,000 | 16 PP |

- Completing all 8 quarters grants a +10 PP bonus
- **Pity PP**: 1 PP if player doesn't pass any target
- **Golden Parachute**: 50% bonus PP when fired for missing targets
- **Dead Man's Switch**: 50% bonus PP when arrested
- Targets can cascade (hit multiple in one day)
- "Time in the Market" unlocks extend deadlines

## SEC Attention System

The SEC attention meter (0-100) creates the core risk mechanic:
- **Rises** from: suspicious returns (>15% daily), illegal actions, large positions
- **Falls** from: passive decay per tick, political donations, staying inactive
- **Stages**: Safe (0-30) → Monitoring (30-60) → Inquiry (60-80) → Investigation (80-95) → Grand Jury (95+)
- **Arrest threshold is randomized**: between 60-100% each run (unpredictable)
- At arrest, the run immediately ends

**Illegal Actions** (defined in `config.js` as `ILLEGAL_ACTIONS`):
- **Insider Trading**: Future price tips, +12 SEC attention (requires `insiderNetwork`)
- **Front Running**: Guaranteed profit, +15 SEC attention (requires `hedgeFund`)
- **Fake News**: Small profit, +18 SEC attention (requires `fakeNewsBot`)
- **Money Laundering**: Flat $10K profit + SEC reduction, +8 net SEC (requires `moneyLaundering`)
- **Ponzi Scheme**: 2x profit multiplier, +25 SEC attention (requires `ponziScheme`)

## Configuration Constants

All game balance is centralized in `config.js` in the `CONFIG` object:
- Tick timing, run length, starting values
- Trading fees, cooldowns, position limits
- SEC thresholds, decay rates, illegal action penalties
- Quarterly targets and PP rewards
- Risk limits and leverage multipliers

Key constants:
- `STARTING_CASH`: $10,000
- `BASE_FEE_PERCENT`: 0.1%
- `BASE_VOLATILITY`: 2%
- `SEC_DECAY_PER_DAY`: 0.15
- `QUARTER_DAYS`: 91
- `FIXED_RUN_YEARS`: 2
- `TOTAL_QUARTERS`: 8

**To rebalance the game**, modify values in `CONFIG`. The codebase references these constants throughout, so changes propagate automatically.

## Achievement System

Achievements are defined in `config.js` as `ACHIEVEMENTS` object. Each has:
- `name`, `description`: Display text
- `check(stats)`: Function that returns true if earned (receives full run stats)
- `title`: Boolean - if true, this achievement unlocks an equippable title
- `titleBonus`: Object defining gameplay bonus when title is equipped (e.g., `{ cooldownReduction: 0.3 }`)

18 achievements total, 12 with equippable titles. Example title bonuses:
- Male Astrology: 30% faster trade cooldown
- Diamond Hands: +10% returns on held positions
- Teflon Don: 25% slower SEC attention growth
- Clean Hands: +50% prestige points

Achievements are checked at run end in `progression.js`. Title bonuses are applied throughout the codebase by checking `progression.data.equippedTitle`.

## Chart Rendering

**ChartManager** (`chart_manager.js`) handles all chart rendering:
- Multi-tab system for viewing multiple assets simultaneously
- Candlestick charts for day trading mode, line charts for other modes
- Time range filters: 7 days, 30 days, 252 days, max
- Net worth graph rendered separately on `#net-worth-graph` canvas

Both use `canvas.parentElement.getBoundingClientRect()` for dynamic sizing.

## Data Persistence

**SaveManager** (`save_manager.js`) abstracts persistence:
- **Electron**: Saves to `%APPDATA%/Second Chance at a Billion/saves/` as JSON files
- **Browser**: Falls back to localStorage
- Saves: `pastTrading_progression.json` and `pastTrading_leaderboards.json`
- Handles one-time migration from old localStorage format to Electron file saves

## Modifying Game Balance

**To adjust difficulty:**
- `CONFIG.STARTING_CASH`: Starting money (default $10k)
- `CONFIG.BASE_VOLATILITY`: Market movement magnitude (default 2%)
- `CONFIG.SEC_DECAY_PER_DAY`: How quickly SEC attention falls (default 0.15/day)
- `CONFIG.QUARTERLY_TARGETS`: Array of target objects with `target` and `pp` values

**To add new illegal actions:**
1. Add entry to `ILLEGAL_ACTIONS` in `config.js` with `secHit` and `profitMultiplier`
2. Add handler method in `sec.js` (e.g., `doNewCrime(tradingEngine)`)
3. Add button rendering in `ui.js` `renderActions()`
4. Add action binding in `main.js` (e.g., `doNewCrime()` method)

**To add new achievements:**
1. Add entry to `ACHIEVEMENTS` in `config.js` with `check(stats)` function
2. If it's a title, add `title: true` and `titleBonus` object
3. The rest is automatic - progression system will check it at run end

## CSS Grid Layout

The game screen uses CSS Grid (`#game-screen` in `style.css`):
```
grid-template-rows: var(--header-height) auto 1fr
grid-template-columns: 1fr
grid-template-areas: "header" "quarterly" "content"
```

The content area uses a 3-column sub-grid:
```
grid-template-columns: 1fr 1fr 2fr
```
- Column 1: Assets list + News feed
- Column 2: Chart + Trade controls + Action buttons
- Column 3: Net worth graph + Meters (Risk/SEC) + Positions

## Common Pitfalls

1. **Script order matters**: If classes are undefined, check that scripts load in the correct order in `index.html`

2. **Canvas sizing**: Canvases size dynamically based on parent element's `getBoundingClientRect()`. If a canvas shows 0 height, the parent element may be hidden or not laid out yet.

3. **Data persistence**: SaveManager abstracts between Electron (file) and browser (localStorage). If testing persistence, check `%APPDATA%/Second Chance at a Billion/saves/` in Electron or browser DevTools → Application → Local Storage.

4. **Speed multiplier**: At 10x speed, the game ticks 10 times per second. Heavy operations in the tick loop (like complex canvas rendering) can cause frame drops. The current implementation is optimized for this.

5. **SEC attention overflow**: SEC attention is clamped to 100. Any code adding to `sec.attention` should use `Math.min(100, sec.attention + amount)`.

6. **Position liquidation**: Positions can be liquidated during `trading.updatePositions()` if they drop below 10% of collateral value. This happens mid-tick, so the positions array can change during iteration (handled via reverse iteration).

7. **Late-IPO stocks**: Some stocks (e.g., META) IPO'd after 2000. The market system tracks `actualDataStartDate` and only shows assets that are "live" at the current game date via `market.isAssetLive()`.

## Game State Flow

```
MENU state:
  - Show menu UI with tabs (Play, Shop, Titles, Leaderboard, Achievements, Settings)
  - Load progression via SaveManager
  - Render unlock shop, achievements, leaderboards
  - User clicks "Play" → YEARSELECT state

YEARSELECT state:
  - Player selects starting year (2000-2023)
  - Presets available (2008 Crisis, 2020 Pandemic, etc.)
  - User clicks "Start" → LOADING → PLAYING state

PLAYING state:
  - Tick interval active
  - Each tick: market → trading → sec → news → quarterly → ui.update()
  - User can trade, take illegal actions, donate to PAC
  - Run ends when: quarterly target missed (fired) OR arrested OR time expires → RUNEND state

PAUSED state:
  - Tick interval stopped
  - Show pause overlay
  - User can unpause → PLAYING state

RUNEND state:
  - Calculate prestige points from quarterly targets
  - Check achievements
  - Update leaderboards (player can name their run)
  - Show run summary screen
  - User clicks "Back to Menu" → MENU state
```

State transitions are managed by `Game` controller. The UI reflects state but doesn't control it.

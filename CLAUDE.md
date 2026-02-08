# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

**To play:** Simply open `index.html` in any modern browser. No build step, no server, no dependencies.

The game runs entirely client-side with no backend. All state persists via browser LocalStorage.

## Architecture Overview

**Past Trading** is a browser-based roguelike trading game where players travel back in time with knowledge of future market events. The game is built with vanilla JavaScript and operates on a tick-based system where 1 tick = 1 game day.

### Core Game Loop

```
Menu → Pick Mode → Play Run (tick loop) → Run Ends → Score → Unlock Progression → Menu
```

Each run lasts 365 days (configurable). The game ticks at `CONFIG.TICK_MS` intervals (default 1000ms = 1 day/second), adjustable via speed controls (0.5x to 10x).

### System Architecture

The game is composed of **six independent subsystems** that communicate through the central `Game` controller:

1. **Market** (`market.js`) - Price simulation using geometric Brownian motion with mean reversion and momentum
2. **TradingEngine** (`trading.js`) - Portfolio management, P&L calculation, buy/sell/short execution
3. **SECSystem** (`sec.js`) - Regulatory attention tracking, investigation stages, illegal actions
4. **NewsSystem** (`news.js`) - Event feed with market events and satirical commentary
5. **ProgressionSystem** (`progression.js`) - Meta-game unlocks, prestige points, run history (persisted to LocalStorage)
6. **LeaderboardSystem** (`leaderboard.js`) - Score calculation and leaderboard tracking (persisted to LocalStorage)

The **Game controller** (`main.js`) orchestrates these systems:
- Maintains game state (`menu | playing | paused | runEnd`)
- Runs the tick loop via `setInterval` at the current speed
- Coordinates system updates: `market.tick()` → `trading.updatePositions()` → `sec.tick()` → `news.tick()`
- Handles player actions (buy, sell, illegal activities, donations)
- Manages run lifecycle (start, pause, end)

The **GameUI** (`ui.js`) is a rendering-only layer:
- Reads game state and renders to DOM
- Manages two canvas elements for charts (net worth graph, asset price chart)
- Handles user input events and delegates to Game controller
- No game logic, purely presentational

### Script Load Order (Critical)

Scripts must load in this exact order (see `index.html` lines 197-206):

```
config.js → market.js → trading.js → sec.js → news.js →
progression.js → achievements.js → leaderboard.js → ui.js → main.js
```

- `config.js` defines global constants used by all other modules
- Systems (market, trading, sec, news, progression, leaderboard) are independent and have no interdependencies
- `ui.js` reads from all systems but doesn't modify them
- `main.js` instantiates everything and wires it together

## Key Data Structures

### Asset (in Market)
```javascript
{
  ticker: 'AAPL',
  price: 150.25,           // current price
  previousPrice: 149.80,   // last tick's price
  history: [150, 149, ...], // array of closing prices (max 400 days)
  ohlcHistory: [{open, high, low, close}, ...], // for candlestick charts
  trend: 0.15,             // momentum factor (-1 to 1)
  highestPrice: 160.50,
  lowestPrice: 140.00
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

### Progression Data (persisted to LocalStorage)
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

Trading modes are defined in `config.js` as `TRADING_MODES` object. Each mode has:
- `unlockRun`: Minimum run count required to unlock
- `volatilityMod`, `feeMod`, `secHeatMod`: Multipliers affecting gameplay
- `assets`: Array of tradeable assets for this mode
- `isPassive`: True for scalping/arbitrage/market-making (generates passive income)
- `isAlgo`: True for algo trading mode

The game currently has 10 modes: stocks, dayTrading, options, forex, commodities, crypto, scalping, arbitrage, marketMaking, algoTrading.

## SEC Attention System

The SEC attention meter (0-100) creates the core risk mechanic:
- **Rises** from: suspicious returns (>15% daily), illegal actions, large positions
- **Falls** from: passive decay per tick, political donations, staying inactive
- **Stages**: Safe (0-30) → Monitoring (30-60) → Inquiry (60-80) → Investigation (80-95) → Grand Jury (95+) → Arrested (100)
- At 100, the run immediately ends

**Illegal Actions** (defined in `config.js` as `ILLEGAL_ACTIONS`):
- Insider Trading: Receive future price tips, +SEC attention
- LIBOR Rigging: Guaranteed profit, massive +SEC attention
- Front Running: Small guaranteed profit, medium +SEC attention
- Pump & Dump: Temporarily inflate asset price, dump for profit
- Wash Trading: Fake volume for small profit

Each illegal action requires specific unlocks (`insiderNetwork`, `hedgeFund`, etc.) and has run count requirements.

## Configuration Constants

All game balance is centralized in `config.js` in the `CONFIG` object:
- Tick timing, run length, starting values
- Trading fees, cooldowns, position limits
- SEC thresholds, decay rates, illegal action penalties
- Market volatility, event chances, price drift
- Prestige point formulas, leaderboard limits

**To rebalance the game**, modify values in `CONFIG`. The codebase references these constants throughout, so changes propagate automatically.

## Achievement System

Achievements are defined in `config.js` as `ACHIEVEMENTS` object. Each has:
- `name`, `description`: Display text
- `check(stats)`: Function that returns true if earned (receives full run stats)
- `title`: Boolean - if true, this achievement unlocks an equippable title
- `titleBonus`: Object defining gameplay bonus when title is equipped (e.g., `{ cooldownReduction: 0.3 }`)

Achievements are checked at run end in `progression.js`. Title bonuses are applied throughout the codebase by checking `progression.data.equippedTitle`.

## Canvas Rendering

Two canvas elements render graphs:
- `#net-worth-graph`: Line chart of `trading.netWorthHistory[]` over time
- `#asset-price-chart`: Line chart (or candlestick in day trading mode) of selected asset's price history

Both use `canvas.parentElement.getBoundingClientRect()` for dynamic sizing. The rendering pattern:
1. Size canvas to parent's dimensions
2. Clear canvas
3. Calculate min/max for Y-axis scaling
4. Draw gridlines with labels
5. Plot data
6. Fill area under line
7. Label current value

For candlestick rendering (day trading mode only), the chart uses `asset.ohlcHistory[]` which is synthesized during `market.tick()` by adding random wicks to the open/close range.

## News System

News items have a `type` field that determines styling:
- `market`: Blue - market events (Fed announcements, earnings, crashes)
- `sec`: Red - SEC-related events (investigations, arrests)
- `trade`: Green - player trade confirmations
- `milestone`: Purple - net worth milestones
- `satirical`: Yellow - comedic commentary on finance/politics
- `system`: Gray - meta-game messages

Important news (market events, SEC alerts, milestones) trigger toast popup notifications in addition to appearing in the scrolling feed.

## Modifying Game Balance

**To adjust difficulty:**
- `CONFIG.STARTING_CASH`: Starting money (default $10k)
- `CONFIG.BASE_VOLATILITY`: Market movement magnitude (default 2%)
- `CONFIG.SEC_DECAY_PER_DAY`: How quickly SEC attention falls (default 0.15/day)
- `CONFIG.PRESTIGE_PER_DOLLAR_EARNED`: How fast unlocks come (default 1 PP per $10k profit)

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
grid-template-rows: 40px 1fr 80px 40px
grid-template-columns: 300px 1fr
```

- Row 1 (40px): Header with day counter, speed controls, pause button
- Row 2 (1fr): Left trading panel (300px) + right panel (graphs & meters)
- Row 3 (80px): News feed (left half) + action buttons (right half)
- Row 4 (40px): Bottom bar with cash and net worth

The right panel uses flexbox column layout with `.graph-area` and `.asset-chart-area` each having `flex: 1` to split space 50/50.

## Common Pitfalls

1. **Script order matters**: If classes are undefined, check that scripts load in the correct order in `index.html`

2. **Canvas sizing**: Canvases size dynamically based on parent element's `getBoundingClientRect()`. If a canvas shows 0 height, the parent element may be hidden or not laid out yet.

3. **LocalStorage persistence**: `ProgressionSystem` and `LeaderboardSystem` save to LocalStorage on every change. If testing persistence, use browser DevTools → Application → Local Storage to inspect/clear.

4. **Speed multiplier**: At 10x speed, the game ticks 10 times per second. Heavy operations in the tick loop (like complex canvas rendering) can cause frame drops. The current implementation is optimized for this.

5. **SEC attention overflow**: SEC attention is clamped to 100. Any code adding to `sec.attention` should use `Math.min(100, sec.attention + amount)`.

6. **Position liquidation**: Positions can be liquidated during `trading.updatePositions()` if they drop below 10% of collateral value. This happens mid-tick, so the positions array can change during iteration (handled via reverse iteration).

## Game State Flow

```
MENU state:
  - Show menu UI
  - Load progression from LocalStorage
  - Render unlock shop, achievements, leaderboards
  - User clicks "Play" → startRun() → PLAYING state

PLAYING state:
  - Tick interval active
  - Each tick: market → trading → sec → news → ui.update()
  - User can trade, take illegal actions, donate to PAC
  - Run ends when: time expires OR bankrupt OR arrested → RUNEND state

PAUSED state:
  - Tick interval stopped
  - Show pause overlay
  - User can unpause → PLAYING state

RUNEND state:
  - Calculate prestige points earned
  - Check achievements
  - Update leaderboards
  - Show run summary screen
  - User clicks "Back to Menu" → MENU state
```

State transitions are managed by `Game` controller. The UI reflects state but doesn't control it.

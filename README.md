# Second Chance at a Billion

A roguelike trading simulation game where you travel back in time with knowledge of future market events. Balance profit-seeking against regulatory risk across 10 trading modes using real historical market data from 2000-2024.

## Features

- **Real Historical Data** - Trade using actual OHLC price data across stocks, ETFs, commodities, crypto, and forex
- **10 Trading Modes** - Stocks, day trading, options, forex, commodities, crypto, scalping, arbitrage, market making, and algo trading
- **SEC Attention System** - Push your luck with insider trading, front running, and other illegal actions, but get caught and your run ends
- **Meta-game Progression** - Earn prestige points, unlock new trading modes and abilities, equip achievement titles with gameplay bonuses
- **Quarterly Targets** - Hit escalating profit targets across 8 quarters or get fired
- **Achievements & Leaderboards** - Track your best runs and compete against yourself

## Getting Started

### Desktop App (Electron)

```bash
npm install
npm start
```

### Browser (Development)

```bash
python -m http.server 8000
```

Then visit http://localhost:8000

Or double-click `start_game.bat` on Windows.

> The game loads data via `fetch()`, so it must be served over HTTP - opening `index.html` directly won't work.

## Building

```bash
npm run build:win    # Windows (NSIS installer)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage)
```

## Tech Stack

- Vanilla JavaScript (no frameworks)
- Electron for desktop packaging
- HTML5 Canvas for price charts and portfolio graphs
- CSS Grid layout
- Steamworks integration
- LocalStorage for save data

## Architecture

Six independent subsystems orchestrated by a central game controller:

| System | File | Role |
|--------|------|------|
| Market | `market.js` | Replays real historical OHLC price data |
| Trading Engine | `trading.js` | Portfolio management, P&L, buy/sell/short |
| SEC | `sec.js` | Regulatory attention, investigations, illegal actions |
| News | `news.js` | Event feed with market events and commentary |
| Progression | `progression.js` | Prestige points, unlocks, run history |
| Leaderboard | `leaderboard.js` | Score calculation and tracking |

## Built With

This project was built using [Claude Code](https://claude.ai/code) as an AI-assisted development tool.

# Second Chance at a Billion

A roguelike trading simulation game where you travel back in time with knowledge of future market events. Balance profit-seeking against regulatory risk using real historical market data from 2000-2024.

## Features

- **Real Historical Data** - Trade using actual OHLC price data across stocks, ETFs, commodities, crypto, and forex
- **6 Trading Modes** - Stocks (playable), plus day trading, options, forex, commodities, and crypto (coming soon)
- **SEC Attention System** - Push your luck with insider trading, front running, and other illegal actions, but get caught and your run ends
- **Quarterly Targets** - Hit escalating net worth targets across 8 quarters or get fired
- **Meta-game Progression** - Earn prestige points, unlock abilities and tools, equip achievement titles with gameplay bonuses
- **Achievements & Leaderboards** - 18 achievements (12 with equippable titles), high score tracking

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
- Web Audio API for synthesized sound effects and music
- Steamworks integration
- LocalStorage / Electron file-based save system

## Architecture

11 subsystems orchestrated by a central game controller:

| System | File | Role |
|--------|------|------|
| Market | `market.js` | Replays real historical OHLC price data |
| Trading Engine | `trading.js` | Portfolio management, P&L, buy/sell/short |
| SEC | `sec.js` | Regulatory attention, investigations, illegal actions |
| News | `news.js` | Event feed with market events and commentary |
| Quarterly Targets | `quarterly.js` | 8-quarter net worth targets with PP rewards |
| Progression | `progression.js` | Prestige points, unlocks, run history |
| Leaderboard | `leaderboard.js` | High score tracking |
| Chart Manager | `chart_manager.js` | Multi-tab price charts with time range filters |
| Audio Engine | `audio_engine.js` | Web Audio synthesis + MP3 playback |
| Data Loader | `data_loader.js` | Historical data loading (JSON/gzip) |
| Save Manager | `save_manager.js` | Electron file saves + localStorage fallback |

## Built With

This project was built using [Claude Code](https://claude.ai/code) as an AI-assisted development tool.

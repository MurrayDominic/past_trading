# Quick Start Guide - Past Trading (Robinhood Edition)

## Playing the Game

1. **Open `index.html` in your browser**
   - Works offline, no server needed
   - Supports Chrome, Firefox, Edge, Safari

2. **Select a Trading Mode**
   - Start with "Stocks" for the classic experience
   - Each mode has different assets and mechanics

3. **Trade Assets**
   - Click on an asset in the left panel to select it
   - Enter quantity and click "Buy" or "Short"
   - Positions appear below with real-time P&L
   - Click "Close Position" to sell

4. **Watch the Charts**
   - Default chart shows your selected asset
   - Click "+" to add more chart tabs
   - Click "×" to close a tab
   - Day Trading mode shows candlestick charts

5. **Audio Controls**
   - 🔊 button to mute/unmute
   - Slider to adjust volume
   - Sounds play for trades, gains, losses

6. **Speed Controls**
   - 0.5x to 10x speed
   - Default is 1x (1 second = 1 game day)
   - Press Space to pause/unpause

7. **Watch for News**
   - News feed in right panel
   - 📰 indicator shows impacted assets
   - Historical events appear on correct days

## Key Features

### Historical Data
- Game uses real 2020 market data
- 365 days of trading
- Falls back to synthetic if data missing

### Charts
- **Line charts**: All modes except day trading
- **Candlestick charts**: Day trading mode only
- Shows last 90 days/bars
- Updates in real-time

### Audio
- **Click**: Trade executed
- **Chirp**: +5% net worth gain
- **Arpeggio**: +10% or +$10k gain
- **Descending sweep**: -8% loss
- **Ominous tone**: Illegal action
- **Background music**: Builds intensity over time

### News Types
- **Blue (Market)**: Fed announcements, earnings, crashes
- **Red (SEC)**: Investigations, arrests
- **Green (Trade)**: Your trades
- **Purple (Milestone)**: Net worth achievements
- **Yellow (Satirical)**: Financial satire
- **Gray (System)**: Meta-game messages

## Tips

1. **Start slow** - Use 1x speed until you understand the mechanics
2. **Watch the news** - Historical events affect prices
3. **Manage risk** - SEC attention meter is dangerous
4. **Use charts** - Add tabs for assets you're watching
5. **Listen** - Audio cues help you react faster at high speeds

## Troubleshooting

**No audio?**
- Click anywhere on the page first (browser policy)
- Check mute button (should show 🔊)
- Check volume slider

**Charts not showing?**
- Click "+" to add a chart
- Make sure an asset is selected
- Try selecting a different asset

**Loading takes a while?**
- First load downloads ~4MB of market data
- Subsequent loads use browser cache
- Check browser console (F12) for errors

**Game too slow/fast?**
- Use speed controls in header
- 10x speed may lag on older devices
- Reduce speed if charts stutter

## Keyboard Shortcuts

- **Space**: Pause/unpause
- **1**: Set speed to 1x
- **2**: Set speed to 2x
- **3**: Set speed to 5x
- **4**: Set speed to 10x

## Files Structure

```
past_trading/
├── index.html              # Main game file
├── css/style.css          # Robinhood styling
├── js/
│   ├── config.js          # Game constants
│   ├── data_loader.js     # Historical data loader
│   ├── market.js          # Price simulation
│   ├── trading.js         # Portfolio management
│   ├── sec.js             # Regulatory system
│   ├── news.js            # News feed
│   ├── progression.js     # Unlocks & achievements
│   ├── leaderboard.js     # Score tracking
│   ├── chart_manager.js   # Multi-tab charts
│   ├── audio_engine.js    # Sound effects & music
│   ├── ui.js              # Rendering
│   └── main.js            # Game controller
└── assets/market_data/
    ├── stocks/            # AAPL, TSLA, etc.
    ├── etfs/              # SPY, QQQ, etc.
    ├── commodities/       # GOLD, OIL, etc.
    ├── crypto/            # BTC, ETH, etc.
    └── news_events.json   # Historical events
```

## Data Files

All market data is pre-generated for 2020:
- **Stocks**: AAPL, TSLA, AMZN, GOOG, META, NFLX, NVDA, JPM
- **ETFs**: SPY, QQQ, IWM, DIA
- **Commodities**: GOLD, OIL, SLVR, WHEAT, NAT.G
- **Crypto**: BTC, ETH, DOGE, SOL

Each file contains:
- 365 days of OHLC data
- Volume information
- Asset-specific events

## Regenerating Data

To create new market data:

```bash
node generate_market_data.js
```

This will regenerate all JSON files in `assets/market_data/`.

## Developer Notes

- Game state stored in LocalStorage
- No backend required
- All processing client-side
- Uses Web Audio API (requires user interaction)
- Charts use Canvas API
- Data loaded via Fetch API

## Credits

Built with vanilla JavaScript. No frameworks, no dependencies.

- **Design**: Inspired by Robinhood
- **Audio**: Web Audio API
- **Charts**: HTML5 Canvas
- **Data**: Synthetic (inspired by 2020 market)

## License

See main repository for license information.

---

**Have fun trading! Watch out for the SEC. 📈🚔**

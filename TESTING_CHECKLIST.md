# Testing Checklist - Robinhood UI Overhaul

## Data Loading
- [ ] Open browser console and check for no errors on page load
- [ ] Verify market data files load from assets/market_data/
- [ ] Test fallback to synthetic data if JSON files missing
- [ ] Verify news events load from news_events.json
- [ ] Check that historical dates display correctly

## Visual Design
- [ ] Robinhood theme applied (dark background, system fonts, clean lines)
- [ ] 3-column grid layout visible (left sidebar, center charts, right stats)
- [ ] Pill-shaped buttons with correct colors (green for buy, red for sell/short)
- [ ] Asset list shows ticker, name, price, and % change
- [ ] Position cards display with proper styling
- [ ] News feed scrolls correctly with colored borders
- [ ] Meters (risk, SEC) display with gradient fills
- [ ] Loading screen appears when starting a run

## Chart System
- [ ] Default chart tab appears when game starts
- [ ] Can add new chart tabs with + button
- [ ] Can close chart tabs with × button
- [ ] Active tab highlighted correctly
- [ ] Candlestick charts render in day trading mode
- [ ] Line charts render in other modes
- [ ] Charts update smoothly at 10x speed
- [ ] Net worth graph renders in top-right panel

## Audio System
- [ ] Audio initialized without errors
- [ ] Trade click sound plays on buy/sell/short
- [ ] Small gain sound plays on +5% net worth
- [ ] Winning sound (arpeggio) plays on +10% or +$10k gain
- [ ] Loss sound plays on significant drops
- [ ] Illegal action sound plays when doing insider trading, LIBOR, etc.
- [ ] Background music starts when run begins
- [ ] Music intensity increases as run progresses
- [ ] Mute button works (🔊 ↔ 🔇)
- [ ] Volume slider adjusts audio level
- [ ] Music stops when run ends

## News Integration
- [ ] Historical events appear on correct days
- [ ] Asset impact indicator (📰) shows when ticker affected
- [ ] Impacted assets pulse with green highlight
- [ ] Impact indicator clears after 5 seconds
- [ ] News types styled correctly (market=blue, sec=red, trade=green, etc.)

## Gameplay
- [ ] Can select different trading modes
- [ ] Assets load correctly for each mode
- [ ] Can buy, sell, and short assets
- [ ] Position cards show correct P&L
- [ ] Close position button works
- [ ] Illegal actions trigger SEC attention and audio
- [ ] Speed controls work (0.5x to 10x)
- [ ] Pause/resume works correctly
- [ ] Game runs smoothly at 10x speed without lag

## Cross-Browser
- [ ] Chrome: All features work
- [ ] Firefox: All features work
- [ ] Edge: All features work
- [ ] Safari (if available): Web Audio API works

## Performance
- [ ] No console errors during gameplay
- [ ] Smooth rendering at 10x speed
- [ ] Charts don't cause frame drops
- [ ] Memory usage stable over long runs
- [ ] No memory leaks in chart tabs

## Errors to Watch For
- Look for "Failed to load" messages in console
- Check for "Web Audio API not supported" warnings
- Verify no "undefined" errors for new components
- Ensure canvas sizing doesn't show 0 width/height errors

## Quick Test Path
1. Open index.html in browser
2. Check console for errors (F12)
3. Click on a trading mode (e.g., Stocks)
4. Verify loading screen appears briefly
5. Check that game loads with 3-panel layout
6. Verify default chart tab exists
7. Click + to add another chart
8. Buy an asset and listen for click sound
9. Set speed to 10x and verify smooth playback
10. Check that music is playing
11. Toggle mute button
12. Do an illegal action (if unlocked) and listen for ominous sound
13. Watch for historical news events
14. Complete a run and verify run end screen

## Known Limitations
- Audio requires user interaction to start (browser policy)
- Some browsers may require clicking on page before audio plays
- Historical data only covers 2020 (365 days)
- Charts limited to last 90 days for performance

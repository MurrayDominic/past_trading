# Quick Start Guide

## Playing the Game

### Desktop (Recommended)
```bash
npm install
npm start
```

### Browser (Development)
Double-click `start_game.bat` on Windows, or run:
```bash
python -m http.server 8000
```
Then visit http://localhost:8000

> Opening `index.html` directly in a browser will **not** work — the game loads market data via HTTP and browsers block this from `file://` protocol. See `HOW_TO_RUN.md` for troubleshooting.

---

## How to Play

1. **Pick a starting year** (2000–2023) — or choose a preset like "2008 Financial Crisis" or "2020 Pandemic"
2. **Buy and short stocks** from the S&P 500 using real historical prices
3. **Hit quarterly net worth targets** — $15K → $50K → $250K → $1M → $10M → $100M → $500M → $1B
4. **Manage your SEC attention meter** — suspicious returns and illegal actions attract regulators
5. **Earn Prestige Points** at run end to unlock upgrades, and replay

---

## Key Controls

| Action | How |
|--------|-----|
| Select asset | Click any stock in the left panel |
| Buy / Short | Enter quantity, click Buy or Short |
| Close position | Click "Close" on your open position |
| Pause | Space bar |
| Speed | 0.5x to 10x via header controls, or keys 1/2/3/4 |
| Mute audio | 🔊 button in header |

---

## Game Mechanics

### Quarterly Targets
8 quarters across 2 years. Miss a target and you're fired. Hit all 8 for a bonus PP reward.

| Quarter | Target |
|---------|--------|
| Q1 Y1 | $15,000 |
| Q2 Y1 | $50,000 |
| Q3 Y1 | $250,000 |
| Q4 Y1 | $1,000,000 |
| Q1 Y2 | $10,000,000 |
| Q2 Y2 | $100,000,000 |
| Q3 Y2 | $500,000,000 |
| Q4 Y2 | $1,000,000,000 |

### SEC Attention
- Rises from: suspicious returns, large positions, illegal actions
- Falls from: time passing, political donations, inactivity
- Arrest threshold is **randomised each run** — you never know exactly when it will trigger

### Illegal Actions (unlockable)
- **Insider Trading** — future price tips (+12 SEC heat)
- **Front Running** — guaranteed profit (+15 SEC heat)
- **Fake News** — small profit (+18 SEC heat)
- **Money Laundering** — flat profit + SEC reduction (+8 net)
- **Ponzi Scheme** — 2× profit multiplier (+25 SEC heat)

### Meta-Progression
Earn Prestige Points (PP) at the end of each run. Spend them in the shop between runs to unlock leverage, lower fees, illegal actions, passive income tools, and more.

---

## News Feed
- **Blue** — Market events (Fed announcements, earnings, crashes)
- **Red** — SEC events (investigations, arrests)
- **Green** — Your trades
- **Purple** — Net worth milestones
- **Yellow** — Satirical financial news
- **Gray** — System messages

---

## Audio Cues
- **Click** — Trade executed
- **Rising chirp** — +5% net worth gain
- **Arpeggio** — +10% or +$10K gain
- **Descending sweep** — −8% loss
- **Ominous tone** — Illegal action taken

> Audio requires a first click/interaction due to browser policy.

---

## Troubleshooting

**No audio?** Click anywhere on the page first, then check the mute button (🔊) and volume slider.

**Charts not showing?** Click "+" to open a chart tab and select an asset from the left panel.

**Game too slow/fast?** Use speed controls in the header. At 10x, older devices may stutter.

**Data not loading?** Make sure you're running via HTTP (not `file://`). See `HOW_TO_RUN.md`.

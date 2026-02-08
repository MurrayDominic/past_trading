# Past Trading - Roguelike Trading Time-Travel Game

## Overview
A browser-based roguelike trading game where you travel to the past with knowledge of what's coming. Start small, unlock mechanics each run, and choose between playing clean or going full white-collar criminal. Semi-serious simulation with heavy satire.

---

## Tech Stack
- **Frontend**: HTML/CSS/JavaScript (vanilla + Canvas for graphs)
- **No framework** — keeps it fast, portable, single-folder project
- **Single `index.html`** entry point with modular JS files
- **LocalStorage** for persistent meta-progression (unlocks, leaderboards, achievements)

---

## Core Game Loop

```
[New Run] → Pick era/mode → Trade for X days → Run ends (time up / arrested / bankrupt)
                ↓                                        ↓
        Use unlocked perks                    Score calculated → Unlock new perks
                                                     ↓
                                              Leaderboard updated
```

Each run:
1. **Pick a time period** (e.g., 2008 crash, dot-com bubble, crypto 2017)
2. **Pick a trading mode** (stocks, options, forex, etc.)
3. **Trade** — day passes at ~1 second per tick (adjustable)
4. **Manage risk** — SEC attention rises with suspicious trades
5. **Run ends** when: timer expires, you go bankrupt, or you get arrested
6. **Score & unlock** — earn unlock currency, hit achievements

---

## Trading Modes (unlocked progressively)

| Mode | Unlock | Description |
|------|--------|-------------|
| **Stocks** | Start | Buy/sell equities. Simple. |
| **Day Trading** | Start | Fast trades, pattern day trader rules |
| **Options** | Run 2+ | Calls/puts with expiry, leverage |
| **Forex** | Run 3+ | Currency pairs, 24h market |
| **Commodities** | Run 4+ | Oil, gold, wheat — geopolitical events matter |
| **Crypto** | Run 5+ | Wild volatility, no regulation (lower SEC heat) |
| **Scalping (Passive)** | Run 6+ | Auto-trades tiny margins, income per tick |
| **Arbitrage** | Run 8+ | Spot price differences across markets |
| **Market Making** | Run 10+ | Provide liquidity, earn spread |
| **Algo Trading** | Run 12+ | Write simple trade rules, fully automated |

---

## Meta-Progression Unlocks (earned between runs)

Unlocks are purchased with **Prestige Points** earned from run score.

| Unlock | Cost | Effect |
|--------|------|--------|
| Leverage (2x → 5x → 10x → 50x) | 1/3/8/20 | Multiply position sizes |
| Reduced Fees | 2/5/10 | Lower commission per trade |
| Better Starting Rep | 3/7 | Start as analyst → trader → quant → fund manager |
| Hedge Fund Access | 15 | Trade with firm capital, higher stakes |
| Lower Surveillance | 5/10 | SEC attention grows slower |
| Insider Network | 8 | Access to insider tips (risky) |
| Political Donations | 6 | Spend money to reduce SEC heat |
| Algo Trading Engine | 12 | Unlock the algo trading mode |
| Fund Manager Mode | 20 | Manage other people's money, bonus from AUM |

---

## Illegal Activities & SEC Mechanic

### Illegal Actions
- **Insider Trading**: Get tips about upcoming events, trade on them. Huge edge, huge risk.
- **LIBOR Rigging**: Manipulate rates for guaranteed profit. Extreme SEC attention.
- **Front Running**: Trade ahead of large orders you know about.
- **Pump & Dump**: Inflate a stock, dump it. Works great until it doesn't.
- **Wash Trading**: Fake volume to manipulate prices.

### SEC Attention Meter (0–100)
- Rises with: suspicious trade timing, unusual returns, large positions, illegal actions
- Falls with: time passing, political donations, laying low (not trading)
- **0–30**: Safe, nobody cares
- **30–60**: "Routine inquiry" — small penalties possible
- **60–80**: "Under investigation" — trade restrictions, frozen assets possible
- **80–95**: "Grand jury" — run is in serious danger
- **95–100**: **Arrested** — run ends, assets seized, score penalty

### Political Donations
- Spend money to reduce SEC attention
- Costs scale exponentially (like real lobbying)
- Satirical news ticker: "Senator thanks generous constituent"

---

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│  PAST TRADING              Day 47/365    ⏱ 1x speed    │
├──────────────────────┬──────────────────────────────────┤
│                      │                                  │
│   TRADING WINDOW     │     NET WORTH GRAPH              │
│                      │     (moving line chart)          │
│   [Asset selector]   │                                  │
│   Price: $142.50     │     $1,000,000 ─────────╱        │
│   Position: +500     │                    ╱             │
│                      │     $100,000  ────╱              │
│   [BUY]  [SELL]      │                                  │
│   [SHORT] [COVER]    │     $10,000 ──╱                  │
│   Amount: [____]     │                                  │
│                      │                                  │
├──────────────────────┼──────────────────────────────────┤
│  RISK METER          │  SEC ATTENTION                   │
│  ██████░░░░ 60%      │  ████░░░░░░ 37%                  │
│  Internal risk level │  "Routine monitoring"            │
│                      │                                  │
│  PORTFOLIO           │  NEWS TICKER                     │
│  AAPL: +500 (+12%)   │  "Fed raises rates unexpectedly" │
│  TSLA: -200 (-3%)    │  "Senator blocks SEC funding"    │
│  Cash: $45,230       │                                  │
├──────────────────────┴──────────────────────────────────┤
│  [Insider Tip 💰]  [Donate to PAC 🏛]  [Algo Config ⚙] │
│  Net Worth: $1,247,500  |  Starting: $10,000            │
└─────────────────────────────────────────────────────────┘
```

---

## Achievements & Titles

### Titles (equip for bonuses)
| Title | How to Earn | Bonus |
|-------|-------------|-------|
| **Male Astrology** | Day trade 100+ times in one run | Faster trade cooldown |
| **Diamond Hands** | Hold a losing position for 30+ days then profit | +10% hold returns |
| **Paper Hands** | Sell within 1 day 50 times | Faster sell execution |
| **The Oracle** | 10 correct directional trades in a row | Better price info |
| **Teflon Don** | Reach 90+ SEC attention and survive | Slower SEC growth |
| **Wolf of Wall St** | Make $10M+ in a single run | Start with more cash |
| **Margin Call Survivor** | Get margin called and recover | Higher margin limit |
| **HODL King** | Hold crypto through 50%+ crash, profit | Crypto volatility bonus |
| **The Lobbyist** | Spend $1M+ on political donations | Cheaper donations |
| **Clean Hands** | Complete a run with 0 SEC attention | Prestige point bonus |
| **Speed Demon** | 500+ trades in one run (scalping) | Unlocks turbo mode |
| **Literally Criminal** | Get arrested 5 times across runs | "Consultant" role unlock |

---

## Leaderboards

1. **Best Risk-Adjusted Return** — Sharpe ratio of net worth curve
2. **Longest Survival** — Most days completed
3. **Cleanest Run** — Highest profit with 0 illegal actions
4. **Most Brazen** — Maximum profit before getting arrested
5. **Speedrun** — Fastest to $1M / $10M / $100M

---

## File Structure

```
past_trading/
├── index.html              # Entry point, main layout
├── css/
│   └── style.css           # All styling, dark trading terminal aesthetic
├── js/
│   ├── main.js             # Game init, main loop, state management
│   ├── market.js           # Price simulation, events, market data
│   ├── trading.js          # Buy/sell/short logic, portfolio management
│   ├── sec.js              # SEC attention, investigation, arrest logic
│   ├── progression.js      # Meta unlocks, prestige points, run tracking
│   ├── achievements.js     # Achievement/title system
│   ├── ui.js               # DOM updates, graph rendering, meters
│   ├── leaderboard.js      # Score calculation, leaderboard storage
│   ├── news.js             # News ticker, satirical events
│   └── config.js           # Constants, balance numbers, unlock costs
├── assets/
│   └── (sound effects if desired later)
└── PLAN.md                 # This file
```

---

## Implementation Phases

### Phase 1 — Core Engine (build first)
1. `config.js` — all game constants
2. `main.js` — game state, main tick loop (1 day/second)
3. `market.js` — price generation (random walk + events)
4. `trading.js` — buy/sell/position tracking/P&L
5. `ui.js` — basic DOM layout, price display, portfolio view
6. `index.html` + `css/style.css` — dark terminal UI shell

**Playable result**: Can buy/sell stocks, watch price move, see P&L.

### Phase 2 — Risk & Regulation
7. `sec.js` — SEC attention meter, investigation events, arrest
8. `news.js` — news ticker with market events + satirical political news
9. Add insider trading mechanic + SEC consequences
10. Add political donation mechanic
11. Net worth graph (canvas line chart)
12. Risk meter UI

**Playable result**: Full single-run loop with SEC tension.

### Phase 3 — Meta-Progression
13. `progression.js` — prestige points, unlock store, run history
14. `achievements.js` — achievement tracking, title equipping
15. `leaderboard.js` — score calculation, local leaderboard
16. Run-end screen with stats, unlocks earned
17. Main menu with unlock shop

**Playable result**: Full roguelike loop — play, score, unlock, replay.

### Phase 4 — All Trading Modes
18. Options trading (calls/puts with expiry)
19. Forex pairs
20. Commodities
21. Crypto (with meme coin events)
22. Scalping (passive income mechanic)
23. Arbitrage
24. Market making
25. Algo trading (simple rule builder)

### Phase 5 — Polish
26. Sound effects
27. More achievements/titles
28. Balance tuning
29. More historical scenarios
30. Tutorial / first-run experience

---

## Key Design Decisions

- **No backend** — everything runs client-side, LocalStorage for persistence
- **Satirical tone** — news ticker is the primary comedy vehicle ("SEC commissioner distracted by Congressional hearing on TikTok")
- **Balanced risk/reward** — illegal actions should be tempting but genuinely dangerous
- **Prestige system** — keeps runs feeling fresh as new mechanics unlock
- **1 day = ~1 second** — fast enough to be engaging, slow enough to make decisions

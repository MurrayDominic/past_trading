# DESIGN.md: Second Chance at a Billion 2.0

The single source of truth for every visual, motion, and audio decision in v2.
If code and this document disagree, one of them is a bug.

---

## 1. Identity

**The aesthetic: a 2000s trading terminal, painted.**
Bloomberg-terminal phosphor data over the shipped painted NYSE artwork. Ticker tape, news lower-thirds, LED-matrix accents, subtle CRT glow. It should feel period-authentic to the eras the player visits (2000-2024), not retro-for-retro's-sake, and never a Balatro clone.

Three rules stolen from Balatro's success:
1. **Commit totally.** One palette, one font system, one treatment, zero exceptions.
2. **The interface IS the game.** All polish budget lands on things the player touches.
3. **Juice is information.** Every animation communicates magnitude or causality. Nothing moves just to move.

## 2. Semantic color palette

Five sacred colors. A color is never reused for another meaning, and every number on screen is colored by what it IS. Backgrounds stay dark and desaturated so the sacred colors own the screen.

| Role | Name | Hex | Usage |
|---|---|---|---|
| Profit / gain | `--profit` | `#33D69F` | Realized and unrealized gains, up-ticks, pass states |
| Loss | `--loss` | `#FF5C5C` | Losses, down-ticks, liquidations, fail states |
| Money / cash | `--money` | `#F5C542` | Cash, net worth hero, PP, prices being paid |
| Heat / illegal | `--heat` | `#B95CFF` | SEC attention, crimes, investigation stages, arrest |
| Info / neutral | `--info` | `#5CA8FF` | Neutral market data, tooltips, system text |

Supporting neutrals:

| Role | Hex |
|---|---|
| Background deep | `#0B0E14` |
| Panel surface | `#131826` |
| Panel raised / hover | `#1B2233` |
| Hairline borders | `#2A3247` |
| Text primary | `#E8ECF4` |
| Text secondary | `#8B94A8` |
| Phosphor accent (terminal flavor text, tickers) | `#7FE8C3` at reduced opacity |

**Colorblind rules (non-negotiable):**
- Gain/loss is never hue alone: always paired with a direction glyph (▲ ▼) or a sign (+ / -).
- Settings toggle swaps profit/loss to blue `#4FA3FF` / orange `#FF9F40` across the whole UI (all colors live in CSS variables, so this is one class on `<body>`).

## 3. Typography

| Layer | Font | Where |
|---|---|---|
| Display | **Copperplate Gothic Bold** (system, existing brand) | Screen titles, quarter ceremony, event headlines, endings |
| Data | **IBM Plex Mono** (bundled, `assets/fonts/`) | Every live number: prices, P&L, net worth, meters, dates |
| UI | **IBM Plex Sans** (bundled) | Labels, buttons, tooltips, news body text |

Rules:
- `font-variant-numeric: tabular-nums` on ALL numeric elements (Plex Mono is naturally tabular; Sans needs the property). Numbers must never jitter horizontally while ticking.
- **Precision tiers:** cents only in the trade ticket and per-share prices ($151.23); whole dollars with separators up to $999,999; 3 significant figures abbreviated above $1M ($1.23M, $45.6M, $1.00B) on ambient displays; the exact figure always available on hover.
- **Hierarchy by size, not count.** The one number that matters right now is enormous (net worth normally; the tally during a sale; the target during quarter evaluation). Everything else stays small and stable. Never fix clutter by deleting data experts use.
- Base sizes: data rows 14px, hero net worth 34px, quarter-ceremony numbers 64px+, labels 12px uppercase with 0.08em tracking.

## 4. Layout and spacing

- Single-screen cockpit. Grid areas: header (with hero numbers and dread-curve target strip), ticker tape, assets column, chart stage (dominant, roughly half the width), positions/risk column, news lower-third.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32px. Panel padding 12px, panel gap 8px, border-radius 6px (10px for cards that "lift").
- The chart is the stage: it gets the most area and the most motion. Meters and lists stay calm.
- Diegetic garnish is a coat, not a floor plan: desk/monitor framing, phone for crimes, newspaper for news. Prices and positions stay clean instant UI.

## 5. Terminal treatment

**APPROVED DIRECTION (Dominic, 2026-07-08): the Painted Trading Floor blend.** Painted NYSE artwork glowing through behind floating translucent panels (mockup B), plus mockup A's scanline layer at reduced strength. Gold-forward accents, soft panel shadows, no hard phosphor-green styling except flavor text.

Applied as one full-screen overlay layer plus per-panel styles, all cheap CSS:
- Scanlines: repeating-linear-gradient, 3px period, 2.4% white opacity (the approved value from the blended mockup). Subtle. Must survive a screenshot without reading as a bug.
- Phosphor glow: text-shadow `0 0 6px` of the text's own color at ~35% on data displays only (never body text).
- Vignette: radial-gradient darkening corners ~12%.
- Ticker tape: one continuous crawl under the header, real tickers and prices from the live market state.
- News lower-third: CNBC-style bar that slides in for headlines; BREAKING variant (loss-red flash) for historical crash events.
- Painted NYSE artwork remains the backdrop of menu/year-select/endings and shows through the cockpit at low opacity behind panels.

## 6. Motion

| Token | Value | Use |
|---|---|---|
| `--ease-overshoot` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Rolling digits, cards lifting, panels entering |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Everything else |
| Fast | 120ms | Hovers, presses |
| Medium | 240ms | Panel/card transitions |
| Tally step | 220ms per line | Staged P&L tallies |
| Rolling counter | 400-700ms, retargetable mid-flight | All money displays |

Rules:
- Rolling counters are the atomic primitive. New values retarget the animation; they never queue or stack.
- Hover lifts interactive cards 4px with overshoot; press depresses 1px. Asset rows lift like cards.
- The chart line draws forward with a glowing leading dot; on asset switch it draws in over 300ms, never snaps.

## 7. Juice spec (event-gated celebration tiers)

Magnitude is measured in log scale relative to current net worth, so a $500 win is loud at $10K net worth and silent at $100M. **Nothing fires per tick. Ever.**

| Tier | Trigger | Popup | Shake | Audio | Pause |
|---|---|---|---|---|---|
| 0 ambient | Daily unrealized drift | none | none | none | no |
| 1 small | Realized P&L < 2% of net worth | small float, 14px | none | single tick note | no |
| 2 medium | Realized P&L 2-10% of net worth | 20px pop-scale float | 0.2s / 2px | rising 3-note step | no |
| 3 big | Realized P&L > 10%, order-of-magnitude crossing ($100K, $1M, $10M...) | 28px, gold burst particles | 0.3s / 4px | 5-note ladder + ka-ching | 150ms hit-stop |
| 4 landmark | Quarter passed, run won | full-screen ceremony | 0.5s / 8px + 1° | bass drop + flash | auto-pause |
| 5 catastrophe | Fired, arrested, liquidated, exchange collapse | full-screen, cold variant | 0.5s / 8px | music hard-cut + record scratch (arrest) | auto-pause |

- Aggregation: 3+ P&L events within 400ms merge into one popup showing the sum ("+$48,200 · 3 trades") at the tier of the total.
- At 10x speed: tiers 1-2 popups shorten by half; tiers 3-5 do NOT shorten (they pause or hit-stop instead).
- **Juice as risk telegraph:** tier 2+ celebrations pulse the SEC meter in the same beat, scaled to the heat the profit generated. Spectacle attracts attention; the player must feel it.
- Staged tally (position close / quarter cash-out): entry → exit → x leverage → - fees → = P&L, one line per 220ms, each with a rising pitch; final number rolls with overshoot; tier 3+ results catch fire.

## 8. Audio identity

- One musical theme with 3-4 intensity variations, crossfaded by SEC stage (Balatro's proven trick: chill base layer under rising stakes). Commissioning decision still open; until then, existing MP3s mapped to the same crossfade slots.
- Pitch ladders: tally lines and combo events step up a scale; order-of-magnitude crossings get a distinct ka-ching layer.
- SEC drone: a low pad that thickens per investigation stage, audible awareness without reading the meter.
- Arrest: hard music cut, record scratch, cold blue flash. Fired: sad brass sting. Both endings own distinct soundscapes.

## 9. Do / Don't

- DO show cause and effect as staged sequences (the tally teaches the math).
- DO put state on the play surface (position cards glow hotter as SEC rises) before adding another meter.
- DO keep tooltips instant, nested, and mechanical ("+12 SEC attention. Arrest threshold is hidden, somewhere between 60-100.").
- DON'T hide data to look cleaner (the Football Manager 26 failure). Fix hierarchy instead.
- DON'T tick-gate any effect. Event-gate everything (the 10x rule).
- DON'T use the sacred colors for decoration. If it's gold, it's money.
- DON'T use em dashes in any player-facing copy.

## 10. Mockups

`mockups/cockpit-b-tradingfloor.html`: **THE APPROVED DIRECTION.** Painted trading floor blended with subtle scanlines.
`mockups/cockpit-a-phosphor.html`: the full-terminal alternative, kept for reference only.
Open in any browser. Both use the bundled fonts and this palette; both animate the rolling net worth counter and ticker tape so the motion rules can be felt, not imagined.

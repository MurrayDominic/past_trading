# Version 2 Plan: "Second Chance at a Billion" 2.0

**Date:** 2026-07-08 (v2 of plan, restructured around two run formats)
**Status:** Draft for Dominic's review
**Ships as:** Free update to the existing Steam app, marketed as a 2.0 relaunch
**Research basis:** RESEARCH_SUMMARY.md and research-1 through research-5 in this folder

---

## The pitch

You work for a time-traveling hedge fund. The fund's machine throws you into the past with nothing but $10,000 and everything you already know about what happens next. Hit your quarterly numbers or get fired. Get greedy and the SEC gets you. Real historical data, real events, real prices: the only fake thing is you being there.

## Guiding principles

1. **Sacred and untouchable:** real historical market data and the foreknowledge fantasy. Every feature serves "could YOU make a billion with what you know?"
2. **Refit, not rewrite.** The engine survives: market replay, data pipeline, trading engine, saves, Steam integration. The presentation layer and run structure get rebuilt without sentimentality.
3. **Never fake data.** No interpolated prices, no invented history. Options mode is SHELVED for this reason (real chains unshippable). Day trading mode uses only real minute data on indices/FX/gold for curated famous days.
4. **Fix boredom before beauty.** Decision density first, juice second, both before launch.
5. **One aesthetic, zero exceptions.** 2000s trading floor / terminal treatment over the painted NYSE art. One font system, one semantic palette, one audio identity.
6. **One loud launch.** Everything below ships together as 2.0 (except options, shelved). If one item threatens the date, day trading mode is the designated slip candidate.

---

## The two run formats

### Format 1: CAREER (normal mode)
The evolved version of today's game. One era, one continuous 2-year climb, 8 quarterly targets from $15K to $1B.
- Year select stays (and the presets: 2008 Crisis, 2020 Pandemic, etc.), plus a random-year option.
- Enhanced with all the new shared systems: board mandates, tip drafting at quarter breaks, SEC ascension ladder, rebalanced shop, quarter-end report pause.
- This is the home of the long-hold fantasy ("I bought Amazon in 2001 and held") and the gentler on-ramp for new players. Tutorial lives here.

### Format 2: TIME MACHINE (insane mode, the flagship)
The Balatro-structured run. You don't choose when you go; the machine does.
- A run is 8 jumps. Each jump = one quarter (91 days) somewhere in 2000-2024, in some market.
- **Destination drafting:** before each jump the machine offers 2-3 windows with vague, flavorful hints ("late 90s tech, feels frothy" / "somewhere in 2008, buckle up" / "a 24/7 casino, coins only"). Player picks one. Perks upgrade this: more offers, sharper hints, and the premium perk: choose your exact date.
- **Forced cash-out at quarter end.** You can't carry positions through time. Every position closes in a staged tally (the big juice moment), target is checked, then the shop.
- **The between-jump shop:** spend profits on run-scoped perks: informants (tips), lawyers (SEC relief), leverage lines, steering charges, mode-specific gear (cold wallet for crypto eras). This is the in-run build system.
- **Modes are destinations, not menus.** A crypto quarter lands you in 2013 or 2017 or 2021; a forex quarter lands you on Brexit week; a commodities quarter lands you in negative-oil April 2020. Unlocking a mode in the meta shop adds its destinations to the machine's deck.
- Escalating targets same as career; miss = fired mid-history; SEC/mode-equivalent risk carries between jumps (your file follows you through time).
- Naming provisional: "Time Machine" vs "Insane" vs lore name TBD.

**Shared between both formats:** the entire feel overhaul, juice engine, cockpit, chart-as-stage, shop content, tips, mandates, ascension, achievements, leaderboards, all mode data. The formats are two run-lifecycle scripts over one game.

---

## Workstream A: The Feel Overhaul (UI/UX + juice)

### A1. Design system first
- `DESIGN.md`: semantic palette (4-5 sacred colors: profit, loss, money, SEC/illegal, neutral info), two-font system (Copperplate display + tabular-numeral workhorse), spacing, motion curves, precision tiers (cents in trade ticket, $1.23M ambient, full figure on hover).
- Colorblind-safe from day one (glyphs + weight, optional blue/orange swap).
- Terminal-era treatment: subtle scanline/glow, phosphor accents, ticker-tape crawl, news lower-thirds. Cheap in CSS, unifies with shipped painted art.

### A2. The juice engine (new module)
- **Rolling counters** with overshoot easing: the atomic UI primitive for all money displays; absorbs any event rate (solves 10x speed).
- **Event-gated celebration tiers** (never per-tick): log-magnitude-scaled popups, aggregation when events land together, shake reserved for rare tiers, hit-stop time dilation for landmarks.
- **Audio pitch laddering** via existing AudioEngine: rising notes on tallies, ka-ching on order-of-magnitude crossings, SEC drone thickening per stage.

### A3. The theatrical moments
1. **Close position / quarter cash-out = scoring a hand.** Line-by-line tally (entry, exit, x leverage, minus fees, = P&L), rising pitch, particles to the cash counter, fire state on huge wins. In Time Machine mode the quarter cash-out tallies the whole portfolio.
2. **Quarter evaluation = boss blind.** Auto-pause at any speed, full-screen net worth roll-up against target, bass drop on pass, firing scene on fail.
3. **The jump sequence (Time Machine).** Cash-out → evaluation → shop → destination draft → jump cinematic (cheap but committed: screen tear, date spinning up like an odometer, era-establishing headline). This 60-second ceremony IS the pacing.
4. **"You called it."** When a historical event fires and the player positioned for it beforehand: headline slams in, qualifying positions highlighted, "Position opened 43 days before the crash: +$2.4M." Our unique moment; no other game can do it with real data.
5. **Juice as risk telegraph:** big celebrations visibly pulse the SEC meter in the same beat. Spectacle attracts heat, taught viscerally.

### A4. Cockpit redesign (single screen, fixed hierarchy)
- Net worth is the hero number; days-remaining and upcoming targets always visible (the dread curve).
- **One-click trading from the asset list** (Offworld pattern); detailed ticket remains for sizing/leverage.
- **Chart as the stage:** buy/sell markers with cost-basis lines, news event flags on the timeline, glowing leading dot, volatility-reactive line weight. Candles as unlocked pro view.
- **Fuzzy memory of the future:** translucent confidence bands on the chart's future that sharpen with intel unlocks; insider tips ghost the real line briefly. The intel/crime economy as literal chart UI.
- **Diegetic garnish, not floor plan:** desk framing, period phone for crimes, sliding newspaper for news, meta menus in a Blackberry-style device. Prices/positions stay clean instant UI. Scene cuts at run boundaries (fired = office in boxes, arrested = FBI raid, jump = time machine).
- Progressive disclosure: nested tooltips everywhere, panels revealed as unlocks earn them, drill-in on any aggregate number.
- Optional: SEC agent as an always-visible portrait whose expression escalates (bored → curious → staring → subpoena).

### A5. Run endings as anecdotes
Near-miss callouts ("94% of the way to Q3"), stats framed as a story, distinct art per ending, one-click copy/share. In Time Machine mode the ending recaps the itinerary ("You visited 1999, 2008, 2013, 2021...").

## Workstream B: Decision Density + Run Variety (shared gameplay systems)

1. **SEC ascension ladder** (10-20 levels, mostly config) + **random start date within year** for career mode.
2. **Board mandates:** random quarterly directives ("no tech", "15% from shorts", "hold 5+ sectors") with bonus PP.
3. **Tip drafting:** draft 1 of 3 information sources with hidden reliability, discovered through use; better sources cost money or heat. Tips verified against shipped data.
4. **Shop rebalance:** ~70% sideways content (archetypes, event decks, crimes, modifiers, destinations) / 30% power. Free respec. Generous PP income.
5. **Archetype starts:** Day Trader, Hedge Fund, Crypto Bro, Activist Short-Seller, Politician's Nephew.
6. **Daily challenge run:** fixed seed (start date + modifiers + hidden-year twist), one attempt, Steam leaderboard.
7. **Balance testing, continuous:** scripted buy-and-hold bot must NOT beat the game at mid ascension; every quarter tier must change verbs, not just digits; manual playtests at 1x and 10x.

## Workstream C: Market Content (modes as data + rules packages)

Each package = real data + distinct risk system + era events. Used by both formats (career variants + Time Machine destinations).

1. **Crypto.** Bitstamp BTC daily 2012+, Binance dumps 2017+. 24/7 (no weekend gaps), extreme volatility, **Exchange Exposure** replaces SEC: on-exchange funds can vanish in real collapses (Mt Gox 2014, FTX 2022) unless in cold wallet (safe but slow). Leverage, staking traps (LUNA/Anchor), rug-pulls. Verify dataset licenses at build time.
2. **Forex.** Fed H.10 / ECB daily (public domain). Leverage/margin mode: carry trades on real rate differentials, margin stop-outs, macro calendar. SNB depeg 2015, Brexit 2016.
3. **Commodities.** EIA public domain daily spots (real negative oil, April 2020) + commodity ETFs via existing pipeline. Expiry, roll/contango, physical delivery comedy, CFTC position limits.
4. **Day trading (slip candidate).** Curated famous days on indices/FX/gold, real 1-minute bars (HistData): Flash Crash, Lehman day, Volmageddon. One day per life. Pattern Day Trader rule as mechanic. If it threatens the launch date, it slips to 2.1.
5. **Options: SHELVED.** Real chains unshippable; revisit post-launch only if demand appears.

## Workstream D: Quality Infrastructure

- Refactor ui.js into focused modules as each panel is rebuilt; keep script-load-order discipline, no build system.
- Run-integrity: autosave/resume mid-run (run-destroying crashes were the top complaint pattern against competitors).
- Playtest cadence per phase (browser QA tooling), Electron cache-clear discipline, syntax checks.
- Performance guardrail: all juice event-gated; frame budget verified at 10x.

---

## Phasing (all pre-launch except noted)

| Phase | Content | Outcome |
|---|---|---|
| **0. Design foundation** | DESIGN.md, palette/typography, terminal treatment mockups, juice spec | Approved look before code |
| **1. Feel Overhaul** | Juice engine, theatrical moments, cockpit redesign, one-click trading, chart-as-stage, endings | The game feels transformed (career mode) |
| **2. Shared gameplay systems** | Ascension, mandates, tip drafting, shop rebalance, quarter-break report | Every quarter has decisions |
| **3. Time Machine mode** | Jump run lifecycle, destination drafting, forced cash-out, between-jump shop, jump cinematic | The flagship format exists |
| **4. Market content** | Crypto package, then forex, then commodities (as destinations + career variants) | The machine's deck fills up |
| **5. Variety + retention** | Archetypes, daily challenge + Steam leaderboards, hidden-year modifier | "One more run" pull |
| **6. Day trading package** | Famous-days library (slip candidate) | Bonus mode |
| **7. Polish + balance pass** | Full QA, balance bots, trailer/screenshot assets | Launch readiness |
| **→ 2.0 RELAUNCH** | Everything above, new trailer, press push on the verified-unique hook | The second first impression |

Sequencing logic: feel first so every later system lands inside the new presentation; Time Machine before market content so modes ship as destinations from day one; day trading late because it's the designated slip.

## Open decisions (Dominic)

1. Naming: "Time Machine" vs "Insane" vs a lore name for the jump format; also whether career or jump mode is the menu default.
2. SEC agent character portrait: yes/no (needs art).
3. Music: commission one theme with intensity variations (Balatro's approach) or keep current audio.
4. Day trading: confirm it's the slip candidate if the date is threatened.

## Next steps after plan approval

1. Optional: run through review skills (/plan-ceo-review, /plan-design-review, /plan-eng-review).
2. Phase 0: design system + mockups for approval.
3. Build Phase 1.

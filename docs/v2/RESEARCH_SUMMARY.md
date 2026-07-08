# V2 Research Summary

**Date:** 2026-07-08
**Purpose:** Foundation research for Version 2: full UI/UX overhaul, gameplay balance, and new trading modes.
**Full reports:** research-1 (Balatro) through research-5 (trading modes) in this folder.

---

## The one-paragraph verdict

The concept is validated and the market position is unclaimed: no game on Steam combines real historical market data with the time-travel foreknowledge fantasy. The two things holding v1 back are (1) the game between quarterly deadlines is mostly waiting at 10x speed, with almost no decisions to make, and (2) the presentation reads as a spreadsheet rather than a game. V2's job is to fix decision density and juice, in that order of importance, while wrapping everything in one committed aesthetic. The new modes are a content ladder on top, and crypto is by far the easiest and best first addition.

---

## Finding 1: The core design problem is "perfect information plus no constraints"

Because the data is real and the player may know history, every run risks collapsing into "buy the winners you remember, fast-forward, win." The fix is NOT to touch the prices (sacred). The fix is to randomize everything around the prices:

- **Board mandates**: random quarterly constraints ("no tech this quarter", "15% must come from shorts"). Low cost, fixes mid-run dead air.
- **Tip drafting**: periodically pick 1 of 3 information sources with hidden reliability. This becomes the run's "build system", the equivalent of Balatro's Jokers. Top recommendation of the retention report.
- **Archetype starts**: Day Trader, Hedge Fund, Crypto Bro, Short-Seller, Politician's Nephew. Each invalidates the memorized strategy differently.
- **SEC ascension ladder**: 20 difficulty levels, mostly config changes. Turned Slay the Spire from a 20-hour game into a 500-hour game.
- **Hidden year / mystery start**: deduce the date from the news feed before betting big. Turns foreknowledge from a cheat sheet into a deduction minigame.
- **Daily seeded runs** with Steam leaderboards: the strongest daily-retention tool per unit of effort (Spelunky's proven pattern).
- **Random start date within the year**: trivial to build, real variety.

Shop rebalance: unlocks that add NEW KINDS of decisions (sectors, crimes, archetypes, modifiers) are good; raw power unlocks (leverage tiers, fee cuts) make the degenerate strategy stronger and should be de-emphasized. Target roughly 70% sideways content, 30% power.

## Finding 2: The game already has Balatro's skeleton; v2 must make it FELT

8 quarterly targets = 8 antes. Exponential targets = exponential blinds. Fired/arrested = two fail states. What's missing is the theatre:

- **Stage the "close position" moment** like Balatro scores a hand: entry, exit, leverage, fees ticking in line by line with rising audio pitch, rolling digits, particles flying to the cash counter. This is the single most important juice change.
- **Quarterly evaluation day is the Boss Blind**: auto-pause, full-screen net worth roll-up against the target, bass drop on pass.
- **Event-gate the juice, never tick-gate it**: at 10x speed the game ticks 10 times a second; per-tick effects would be noise and lag. Juice fires on trades, quarter ends, SEC stage changes, news events, arrest.
- **Rolling counters are the atomic UI primitive**: they absorb any event rate gracefully, which solves the variable-speed problem.
- **Juice as risk telegraph** (unique to us): the bigger the profit fireworks, the more the SEC meter visibly pulses in the same beat. Spectacle attracts heat, taught viscerally.
- **"You called it" moments**: when a historical event fires and the player positioned for it beforehand, celebrate it explicitly ("Position opened 43 days before the crash: +$2.4M"). No other game can do this with real data.
- **Aesthetic**: do not copy pixel-art CRT casino. Our thematically inevitable equivalent is the 2000s trading floor / Bloomberg terminal era, layered over the existing painted NYSE artwork. One font system, one palette, one audio identity, zero exceptions.

## Finding 3: What the market rewards (competitor evidence)

- **Committed aesthetic beats simulation depth**: STONKS-9800, a shallow sim with a perfect 1980s Japan vibe, sold 25,000+ copies at 97% positive.
- **Anecdote generation**: top reviews of every successful competitor are retellable stories ("got killed by yakuza 10/10"). Run endings should be engineered as shareable story artifacts.
- **Legibility**: Insider Trading (the Balatro-for-stocks game, 79% positive) is dinged because players can't tell why they won or lost. Our history-based market is the antidote; keep cause and effect visible.
- **Power fantasy**: players want to feel rich and dangerous, not like "a nervous nerd." Lean into swagger and lifestyle, not just meters.
- **Failure modes to avoid**: news that deterministically signals trades (Simon Says), late-game sameness where scale changes digits but not verbs, education framing (Trade Bots used real data as homework: 63% Mixed), run-destroying bugs in long runs.
- **Uniqueness verified**: nobody else ships real data + named tickers + foreknowledge. But the hook only lands if the game constantly reminds you it's real: real dates, real headlines, achievements for nailing famous events.

## Finding 4: UI architecture direction

- **Single-screen cockpit**, not multiple screens (Offworld Trading Company pattern; The Invisible Hand's four screens failed). The current 3-column dashboard's problem is hierarchy, not screen count. FM26's disastrous overhaul proves "game-like" must not mean hiding data.
- **One-click trading from the asset list** (Offworld's sidebar pattern) to kill the multi-step trade flow.
- **The chart is the stage**: player buy/sell markers with cost-basis lines, news event flags on the timeline, and fuzzy "memory of the future" bands that sharpen with intel unlocks (Into the Breach clarity + Outer Wilds incomplete-knowledge pattern). Most differentiating UI feature available to us.
- **Progressive disclosure**: nested tooltips (Crusader Kings 3), panels revealed by unlock progression, universal drill-in on any aggregate number.
- **Diegetic garnish, not diegetic floor plan**: desk framing, a period phone for crimes, a newspaper for news, but prices and positions stay clean instant UI. Scene cuts only at run boundaries (fired = office packed into boxes; arrested = FBI raid).
- **Typography**: tabular numerals everywhere (numbers must not jitter), two-font system (Copperplate display + workhorse numeric), colorblind-safe P&L encoding (never hue alone), precision tiers (cents in trade ticket, $1.23M abbreviated ambient, full figure on hover).
- **Characterful UI idea worth considering**: the SEC agent as an always-visible portrait whose expression escalates with attention (Potionomics pattern). Faces read instantly at 10x speed.

## Finding 5: New modes, ranked by data feasibility x distinctiveness x appeal

| Rank | Mode | Data verdict | Build call |
|---|---|---|---|
| 1 | Crypto | Excellent: Bitstamp BTC from 2012, Binance dumps 2017+, tiny files | Build first |
| 2 | Forex | Excellent: Fed/ECB data is public domain | Build second |
| 3 | Commodities | Good: EIA public domain (includes negative oil April 2020) + commodity ETFs via existing pipeline | Build third |
| 4 | Day trading | Hard: individual US stock intraday data effectively unshippable; pivot to famous days on indices/FX/gold via HistData | Build fourth, scoped |
| 5 | Options | Worst: real chains unlicensable and huge; would require computing premiums (Black-Scholes) from real underlying prices | Build last, needs a Dominic decision |

Mode mechanics should differ genuinely: crypto gets 24/7 markets + exchange collapse/custody risk (Mt Gox, FTX) instead of the SEC; forex is the leverage/margin/carry-trade game; commodities get contract expiry, contango, and physical delivery comedy; day trading inverts pacing (one real famous day per life, minute bars); options are theta decay and convexity with natural SEC synergy.

**Two decisions that touch the "never fake data" rule, flagged for Dominic:**
1. Options premiums would be computed from real underlying prices using the standard pricing formula (this is how real brokers quote; it is derived from real data, not invented). Accept or shelve the mode.
2. Day trading cannot use fake interpolated intraday paths (rejected outright); accept the indices/famous-days scope instead.

## Open design tension: run length

Retention research says 10-30 minute runs are the roguelike sweet spot; our 2-year runs are longer and mostly waiting. Two directions: (a) keep the 8-quarter structure but fill dead air with decision cadence (mandates, tips, events), or (b) also offer shorter run formats (single year, single quarter sprint, daily challenge). Probably both. Needs a decision in the plan phase.

## What the plan phase must decide

1. Rebuild the UI on the existing engine vs a fresh codebase (engine, data pipeline, saves, and Steam integration are solid and reusable; presentation layer is the problem).
2. Run length / format lineup.
3. Which run-variety mechanics make the v2 cut (recommended order: SEC ascension + random start date, board mandates, tip drafting, archetypes, daily runs, hidden year).
4. Shop rebalance scope.
5. Mode 1 scope (crypto) and whether options/day trading compromises are acceptable.
6. Aesthetic commitment: 2000s trading terminal treatment over painted NYSE art, one font/palette/audio identity.

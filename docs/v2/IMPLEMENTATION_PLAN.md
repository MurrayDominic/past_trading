# V2 Implementation Plan

**Date:** 2026-07-08
**Companion to:** V2_PLAN.md (the what and why). This document is the how: concrete tasks, files, order, and acceptance checks.
**Effort unit:** a "session" = one focused working session with Claude. Estimates are honest guesses and will be wrong in both directions.

---

## Ground rules for the whole build

- Never break the running game: master stays playable at all times. Each phase merges only when the game boots, a full career run completes, and saves load cleanly.
- Script load order is sacred (index.html). New modules get added to the chain deliberately.
- All balance values live in `js/config.js`. No magic numbers in systems code.
- Syntax check every touched file (`node -c js/file.js`). Browser test via `python -m http.server 8000`. Electron test requires cache clear first.
- Old saves must keep working. `progression.data` only ever gains fields, never renames them. Migration shims in save_manager.js if needed.
- ui.js gets dismantled incrementally: every panel we rebuild moves out of ui.js into a new `js/ui/` module. No big-bang rewrite.

---

## Phase 0: Design Foundation (est. 2-3 sessions)

Goal: every visual and audio decision made once, on paper, before code.

| # | Task | Output |
|---|------|--------|
| 0.1 | Write `DESIGN.md`: semantic palette (profit, loss, money, SEC/illegal, neutral), both fonts, spacing scale, motion curves, precision tiers, colorblind rules | DESIGN.md at repo root |
| 0.2 | Pick and bundle the workhorse font (tabular numerals, free license, e.g. IBM Plex family) alongside Copperplate display | Font files in assets/fonts/ |
| 0.3 | Build 2-3 static HTML mockups of the new cockpit with the terminal treatment (scanline/glow pass, ticker tape, lower-third news) over the painted art | mockups/ folder, viewable in browser |
| 0.4 | Write the juice spec: every event type mapped to its celebration tier (popup size, shake, audio, pause behavior) at each game speed | Section in DESIGN.md |
| 0.5 | Dominic reviews mockups, picks direction | Approval gate |

Acceptance: Dominic signs off a mockup before Phase 1 starts.

## Phase 1: Feel Overhaul (est. 8-12 sessions)

Goal: career mode looks and feels transformed. No new game rules yet.

| # | Task | Files |
|---|------|-------|
| 1.1 | Create `js/ui/juice.js`: rolling counter component (overshoot easing, staggered digits, retargeting), floating popup system with log-magnitude tiers and 400ms aggregation, screen shake tiers, hit-stop helper | new file + index.html |
| 1.2 | Audio pitch ladders in audio_engine.js: tally note steps, order-of-magnitude ka-ching, SEC drone layer per stage | js/audio_engine.js |
| 1.3 | Convert all money displays to rolling counters; tabular numerals + precision tiers everywhere | js/ui.js → js/ui/hud.js, css |
| 1.4 | Staged close-position tally (entry, exit, x leverage, minus fees, = P&L) with pitch ladder and particles; fire state above threshold | js/ui/tally.js, trading.js hook |
| 1.5 | Quarter evaluation boss moment: auto-pause, full-screen roll-up vs target, pass/fail ceremony, quarter report (P&L, best trade, SEC status, next target) | js/ui/quarter_screen.js, quarterly.js hook, main.js pause |
| 1.6 | Cockpit relayout: net worth hero, days-remaining + next targets persistent, semantic colors applied, terminal treatment CSS | css/style.css, index.html, js/ui/ |
| 1.7 | One-click trading from asset rows (buy/sell at current sizing); detailed ticket stays for sizing/leverage | js/ui/asset_list.js, main.js |
| 1.8 | Chart as stage: buy/sell markers with cost-basis line and shaded unrealized P&L gap, news event flags on timeline, glowing leading dot | js/chart_manager.js |
| 1.9 | "You called it" moment: when a news event fires, detect qualifying pre-positioned holdings, celebrate with headline + position callout | js/news.js, js/ui/juice.js |
| 1.10 | Juice-as-risk-telegraph: celebrations pulse the SEC meter proportionally | js/ui/juice.js, sec.js read |
| 1.11 | Run endings v2: near-miss callout, story-framed stats, per-ending art, copy-to-clipboard summary | js/ui/run_end.js |
| 1.12 | Nested tooltip system (hoverable terms inside tooltips, pinnable) | js/ui/tooltips.js |
| 1.13 | Performance pass at 10x: frame budget, event-gating audit | all |

Acceptance: a full career run at 1x and 10x feels dramatically better; no frame drops at 10x; Dominic playtest.

## Phase 2: Shared Gameplay Systems (est. 6-8 sessions)

Goal: every quarter has decisions. All systems work in career mode first.

| # | Task | Files |
|---|------|-------|
| 2.1 | SEC ascension ladder: 10-20 levels of config multipliers (decay, thresholds, persistence, heat scaling); level picker pre-run; PP multiplier per level | js/config.js, sec.js, ui |
| 2.2 | Random start date within year option for career mode | main.js, market.js |
| 2.3 | Board mandates: directive table in config, roll per quarter, compliance check in quarterly.js, bonus PP, UI card | config.js, quarterly.js, ui |
| 2.4 | Tip system: source archetypes with hidden reliability, tip generation verified against shipped future data ("ticker X moves Y% by date Z"), draft UI (pick 1 of 3), tip journal panel, SEC heat costs | new js/tips.js, config.js, ui |
| 2.5 | Shop rebalance: audit UNLOCKS toward 70% sideways / 30% power, free respec, PP income retune | config.js, progression.js, ui shop |
| 2.6 | Balance bot: Node script that simulates buy-and-hold and simple strategies across years and ascension levels, reports which quarters they pass | scripts/balance_bot.js |

Acceptance: buy-and-hold bot fails by mid ascension; playtest confirms mandates + tips create real decisions each quarter.

## Phase 3: Time Machine Mode (est. 8-10 sessions)

Goal: the flagship format exists end to end.

| # | Task | Files |
|---|------|-------|
| 3.1 | Run-format abstraction in main.js: career vs timeMachine lifecycle scripts sharing all systems | main.js, config.js |
| 3.2 | Destination generator: pick candidate windows (era + market package + start date) from available data ranges, weighted for variety and drama; hint text table | new js/time_machine.js, config.js |
| 3.3 | Destination draft screen (2-3 windows, vague hints, flavor art) | js/ui/destination_draft.js |
| 3.4 | Forced cash-out at quarter end: liquidate all positions through the staged tally, then evaluation | trading.js, quarterly.js, ui/tally.js |
| 3.5 | Between-jump shop: run-scoped perks (informants, lawyers, leverage lines, steering charges, mode gear), separate from meta PP shop | js/time_machine.js, ui |
| 3.6 | Steering perks: more offers, sharper hints, choose exact date | config.js, time_machine.js |
| 3.7 | Jump cinematic: screen tear, date odometer spin, era-establishing headline; SEC file carries across jumps | js/ui/jump_cinematic.js, sec.js |
| 3.8 | Time Machine run-end recap (itinerary of eras visited) + separate leaderboard category | ui/run_end.js, leaderboard.js |
| 3.9 | Mid-run autosave/resume for both formats | save_manager.js, main.js |

Acceptance: full 8-jump run playable start to finish with saves surviving a restart; Dominic playtest of the loop's rhythm.

## Phase 4: Market Content (est. 8-12 sessions, sequential packages)

Goal: crypto, then forex, then commodities, each as data + rules + events, plugged into both formats.

Crypto (4.1-4.5):
- 4.1 Data pipeline: download/convert Bitstamp BTC 2012+ and Binance daily klines 2017+ to our JSON format; license check documented | scripts/fetch_crypto.py, assets/market_data/crypto/
- 4.2 Market support for 24/7 assets (no weekend gaps) and asset-class metadata | market.js, data_loader.js
- 4.3 Exchange Exposure system replacing SEC in crypto contexts: on-exchange vs cold wallet, withdrawal delays, historical collapse events (Mt Gox, FTX) that seize on-exchange funds | new js/exchange_risk.js, config.js
- 4.4 Crypto events pack: bull runs, collapses, LUNA/Anchor yield trap, rug-pull small caps | news data, config.js
- 4.5 Crypto destinations in Time Machine deck + crypto career variant | time_machine.js, config.js

Forex (4.6-4.8): Fed H.10/ECB data pipeline, pairs as assets, leverage/margin stop-outs, carry interest from real rate differentials, macro events (SNB 2015, Brexit 2016).

Commodities (4.9-4.11): EIA spot pipeline (incl. negative oil) + commodity ETFs, futures wrapper (expiry, roll/contango, delivery comedy), CFTC position-limit risk system.

Acceptance per package: playable quarter in both formats; data verified against known historical values (spot checks); no license red flags.

## Phase 5: Variety + Retention (est. 4-6 sessions)

- 5.1 Archetype starts (Day Trader, Hedge Fund, Crypto Bro, Short-Seller, Politician's Nephew) as config bundles + shop unlocks
- 5.2 Hidden-year modifier: scrub explicit dates from news/UI, deduce the era; ties into ascension and dailies
- 5.3 Daily challenge: seeded destination/modifier bundle, one attempt, Steam leaderboard via Steamworks API
- 5.4 Fuzzy memory bands on chart (confidence bands sharpened by intel unlocks; tips ghost the real line)

Acceptance: daily run works on a second machine; archetypes meaningfully change play.

## Phase 6: Day Trading Package (est. 4-6 sessions, SLIP CANDIDATE)

- 6.1 HistData 1-minute pipeline for indices/FX/gold; curate ~100 famous days
- 6.2 Intraday tick mode (1 minute per tick), session open/close, halts at historical timestamps
- 6.3 PDT rule mechanic + broker risk desk
- If launch date pressure appears, this whole phase moves to update 2.1.

## Phase 7: Polish + Launch Readiness (est. 4-6 sessions)

- 7.1 Full QA pass (browser + Electron), bug triage and fixes
- 7.2 Balance bot final pass + hand playtests at every ascension checkpoint
- 7.3 Tutorial refresh for the new cockpit (career mode)
- 7.4 Steam assets: new screenshots, capsule refresh if needed, trailer capture, store copy rewrite around the verified-unique hook
- 7.5 Update CLAUDE.md/docs to match the shipped architecture
- 7.6 Build, SteamPipe upload, set live, 2.0 announcement

---

## Total honest estimate

44-63 sessions of focused work. At a few sessions per week this is roughly 4-6 months to the 2.0 relaunch. Cutting day trading (Phase 6) and archetypes (5.1) saves ~8-10 sessions if speed matters more.

## Status log

- **2026-07-09 (phases 5-7):** Phase 5 SHIPPED: memory bands (Almanac-gated fuzzy cone of real future data + gold insider-tip ghost line), five archetypes (unlocked by completing the ladder once), Mystery Year mode (dates render as 20??; deduce the era from prices and headlines), Daily Challenge (date-seeded secret insertion, one attempt per real day, local record; Steam leaderboard integration deferred to launch work since steamworks needs Electron testing). Phase 6 (day trading) SLIPPED to 2.1 as pre-agreed. Phase 7 progress: QA sweeps green across career/Time Machine/crypto/commodities/forex/mystery runs; the v1 inline-script CSP console error fixed (js/demo_mode.js); How to Play refreshed for v2 systems; CLAUDE.md updated to the v2 architecture. REMAINING (needs Dominic): playtest verdict (phase 1 gate + Q1 feasibility → shop rebalance), data licensing decision (yfinance provenance vs clean re-source), Steam assets/trailer/store copy, build + SteamPipe upload, 2.0 announcement.

- **2026-07-09 (balance bot findings):** `scripts/balance_bot.js` simulates buy-and-hold against the quarterly ladder using the real shipped data. Results over 23 start years: equal-weight buy-and-hold of all default-unlocked stocks passes ZERO quarters every year; a perfect-hindsight single-stock pick averages Q1.2 of 8 (best ever: Q3 in 2021). Conclusion: passive play cannot beat the ladder, which matches the design intent that decisions are mandatory. Open question for playtesting: whether ACTIVE knowledge-driven trading can reasonably clear Q1 (+50% in 91 days) on the two starter sectors with no unlocks, or whether new players are mathematically doomed on run 1 (a possible driver of the v1 refunds). Do not rebalance targets until playtest data answers this. Re-run the bot after the shop rebalance as a power-creep guardrail.

- **2026-07-08:** Research phase complete (5 reports + summary). All strategic decisions locked: refit not rewrite, free 2.0 update, two run formats (Career + Time Machine), options shelved, day trading is the slip candidate. Plans committed to master via v2-planning branch (commit 6c1c41c). Phase task list created in the session task tracker. **Phase 0 started same day**: DESIGN.md, bundled fonts, and cockpit mockups (mockups/ folder) produced for Dominic's review.

## Standing risks

1. **Scope creep inside phases.** The phase gates exist to force "playable and merged" before moving on.
2. **Electron/browser drift.** Test both at every phase gate, not just at the end.
3. **Data licenses.** Verify at build time (Phase 4), document each source's terms in the repo.
4. **Balance of Time Machine mode.** Forced cash-outs + random eras is a genuinely new economy; the balance bot and playtests are the guardrail, and targets may need a separate curve from career mode.
5. **Save compatibility.** Old progression files must load after every phase; test with a copy of a real save.

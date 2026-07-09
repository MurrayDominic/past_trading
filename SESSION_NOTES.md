## Session: 2026-07-09 (playtest round 2)

### What was done
- Shipped the last of the deferred nice-to-haves (commit 4604ffd): free respec button in the shop, passive income floor that scales with progress, Time Machine leaderboard category, and the Pilot License jump perk (buy the wheel, pick your exact destination year).
- Fixed all four points from Dominic's second playtest (commit 8020421):
  1. Tip chips are now clickable and open that stock's chart.
  2. Markets strip clarified: owned markets show a green tick, locked ones show their shop price in the badge, and clicking a locked badge jumps straight to the Shop. (Crypto showed "unlocked" for Dominic because his v1 save already owns it - that was correct, just unlabelled.)
  3. Real bug: Commodities and Forex were missing from the shop's hardcoded node list, so they could never be bought. Now in the tree after Crypto (50K -> 100K -> 250K).
  4. More Options simplified: Difficulty and Archetype rows hide behind one locked explainer line until the player completes all 8 quarters once; the Extras row got plain-English descriptions.
- All changes browser-verified with screenshots (shop nodes render, strip shows prices/ticks, locked note shows on a fresh save).

### What was changed
- js/ui.js, index.html, css/style.css

### What is broken or incomplete
- Nothing known broken. Everything pushed through commit 8020421.
- Note for playtesting: Dominic's own save will still show Difficulty/Archetype rows because he has completed runs - that is intended veteran behavior.

### Next steps
1. Dominic playtests again, especially: click a tip chip, buy Commodities/Forex in the shop, and give the Q1 ($15K in 91 days) difficulty verdict.
2. Q1 verdict unblocks the shop rebalance (task #9).
3. Decide data licensing (yfinance-sourced files vs clean re-source) before 2.0 publicity.
4. Launch work together: Steam screenshots, trailer, store copy, build, SteamPipe upload, 2.0 announcement.

### Open questions
- Q1 difficulty verdict (drives shop rebalance)
- Data licensing: keep yfinance-sourced files or re-source cleanly
- Market gating: keep shop unlocks or open some markets by default

---

## Session: 2026-07-09 (playtest round 1)

### What was done
- Dominic playtested v2 for the first time. Verdict so far: the design looks a lot better; the run setup screen had too many options; the other markets were invisible.
- Rebuilt the run setup screen from that feedback: two format cards (Career / Time Machine), one start button, year picker only for Career, difficulty/archetype/extras folded behind a collapsed More Options toggle.
- Added a MARKETS strip showing all five asset classes with lock state and shop prices, and Day Trading marked as coming in 2.1. This answers "where are the other modes": they are unlockable markets woven into runs, not separate menus.
- Task list cleaned: phases 0-6 complete; leftovers tracked as "Shop rebalance" (blocked on the Q1 verdict) and "2.0 nice-to-haves".

### What was changed
- index.html, js/ui.js, css/style.css (setup screen restructure, markets strip)

### What is broken or incomplete
- Nothing known broken. All pushed through commit bb00af7.

### Next steps
1. Dominic keeps playtesting. The key verdict: does Q1 ($15K in 91 days) feel clearable on a fresh save? That unblocks the shop rebalance.
2. Decide the data licensing question (v1 dataset is yfinance-sourced; clean replacements researched if wanted before 2.0 publicity).
3. Consider whether markets should be less gated (e.g. crypto available from the start): one-line change per market.
4. Launch work together: Steam screenshots, trailer, store copy, build, SteamPipe upload, 2.0 announcement.

### Open questions
- Q1 difficulty verdict (drives shop rebalance)
- Data licensing: keep yfinance-sourced files or re-source cleanly
- Market gating: keep shop unlocks or open some markets by default

---

## Session: 2026-07-08 and 2026-07-09 (the V2 build)

### What was done
The full Version 2 build, from research to launch-ready. Roughly 30 commits, all pushed to origin.
- Research: 5 reports + summary in docs/v2/ (Balatro feel, competitors, retention, UI patterns, mode data). Verified nobody else ships real data + foreknowledge.
- Plans: docs/v2/V2_PLAN.md (two run formats) and IMPLEMENTATION_PLAN.md (phases, estimates, status log).
- Phase 0: DESIGN.md, bundled IBM Plex fonts, cockpit mockups. Approved look: painted trading floor + subtle scanlines.
- Phase 1 (feel): juice engine (rolling counters, tiered popups, shake), staged sell tally, quarter ceremony with the boss call, full palette re-skin, one-click B/S trading, chart trade markers, "You called it" banners, near-miss endings with copyable run story, instant tooltips, in-place panel rendering (fixed per-tick DOM churn).
- Phase 2 (systems): ascension ladder (11 levels), board mandates with cash bonuses, informant tip drafting (hidden accuracy, real-data tips), balance bot (finding: passive play passes ZERO quarters; even a perfect single pick averages Q1.2/8).
- Phase 3 (Time Machine): the flagship format. 8 quarters across drafted random eras, forced liquidation at jumps, jump perk shop (Greased Palms / Insider Dossier / Wider Aperture), jump cinematic, mid-run autosave + Resume button.
- Phase 4 (markets): 75-event real history pack (fixed events firing in wrong eras), Exchange Exposure (Mt Gox/Bitfinex/FTX seize exchange funds on their real dates; cold wallet survives), commodities (incl. the real negative oil day; fixed CL ticker collision with Colgate), forex from ECB reference rates (cleanly licensed). All join the Time Machine as destination windows via a shop unlock chain.
- Phase 5 (variety): chart memory bands (fuzzy cone of real future + insider ghost line), 5 archetypes, Mystery Year mode (dates show 20??), Daily Challenge (seeded, one attempt/day, local record).
- Phase 6 (day trading): slipped to 2.1 as pre-agreed (intraday stock data not legally shippable).
- Phase 7 partials: QA sweeps green across all formats, console now fully clean (moved the demo-mode inline script to a file), How to Play refreshed, CLAUDE.md updated to v2.

### What is broken or incomplete
- Nothing known broken. All increments browser-verified.
- Deferred: shop rebalance (waiting on the Q1-feasibility playtest), Steam leaderboards for dailies (needs steamworks testing in Electron), exact-date steering perk, TM leaderboard category, "You called it" banner not yet seen live (needs a profitable pre-positioned trade).

### Next steps (Dominic)
1. PLAYTEST. Browser or Electron (clear Electron cache first). This closes the Phase 1 gate and answers whether Q1 ($15K) is clearable on a fresh save.
2. Decide on the data licensing question: v1's dataset came from Yahoo Finance; research identified clean replacements if wanted before the bigger 2.0 spotlight.
3. Launch work together: Steam screenshots/trailer/store copy, build, SteamPipe upload, 2.0 announcement.

---

## Session: 2026-07-01

### What was done
- Catchup on project status (no code changes since June 14)
- Drafted a new Reddit post for r/smallstreetbets with a different angle: "would you still lose money with time travel?" challenge format
- Discussed subreddit targeting: WSB is off limits (banned for self-promo), sticking with r/smallstreetbets
- Post is ready to copy/paste, needs a screenshot attachment (ideally a funny failure: getting arrested or fired)

### What was changed
- No code files changed

### What is broken or incomplete
- Nothing broken
- Reddit post not yet posted (needs screenshot and Dominic to post manually)

### Next steps
1. Pick a good screenshot to attach (getting arrested or fired is ideal for the "you'd still lose" angle)
2. Post to r/smallstreetbets with the drafted copy, flair as Shitpost
3. Consider posting variations to other subs (r/stocks, r/IndieGaming) if this one gets traction
4. Still outstanding from previous sessions: update Steam store screenshots, replace header rocket logo, achievement icons

### Open questions
- Which screenshot to use for the post?
- Worth trying other subreddits with variations of this angle?
- Has the itch.io demo ever been confirmed working? (carried over from March sessions)

---

## Session: 2026-06-14 (artwork)

### What was done
- Rewrote Midjourney art direction from scratch: dropped "cyan glow / retro-futurism" AI slop, landed on painted illustration of empty NYSE trading floor, atmospheric, muted palette, no people
- Tested 5 art styles (vintage editorial, Saul Bass, woodcut, flat, watercolour) and multiple subjects (desk still life, rocket chart, NYSE floor) before finding the right look
- Generated 10 Midjourney images for Steam store and in-game use
- Built add_text_overlay.py to add Copperplate Gothic Bold title text to capsule images
- Integrated darkened backgrounds into menu, year select, and run end screens (success = warm golden, arrested = cold blue)
- Removed rocket logo from menu screen
- Moved "Back to Menu" button to top-right of run end screen
- Fixed run end stat boxes not filling container width
- Uploaded all store artwork and library assets to Steam
- Built and uploaded new game build (BuildID 23730979) via SteamPipe
- Set build live on default branch
- Published store page with new artwork

### What was changed
- MIDJOURNEY_ART_GUIDE.md (complete rewrite with new art direction)
- css/style.css (background images on menu/year-select/run-end, run-end-stats layout fix, run-end-arrested class)
- index.html (removed rocket logo from menu, moved back-to-menu button to top)
- js/ui.js (run end arrested background class toggle)
- add_text_overlay.py (text overlay generation script)
- artwork/ (10 original Midjourney images)
- artwork/with-text/ (resized + text overlay versions for Steam)
- assets/backgrounds/ (4 darkened JPEGs for in-game use)

### What is broken or incomplete
- Nothing broken
- Game header still uses old rocket SVG logo (small icon, low priority)
- Achievement icons are still auto-generated (not yet tackled)

### Next steps
- Consider updating Steam store screenshots to match the new UI
- Optionally replace game header rocket logo with something matching the new style
- Achievement icons (Priority 4) if desired
- Monitor Steam store page to confirm artwork displays correctly across all views

### Open questions
- Does the rocket logo in the game header need replacing, or is it fine as a small icon?
- Are achievement icons worth doing in Midjourney or better as simple designed icons?

---

## Session: 2026-06-14 (final)

### What was done
- Fixed net worth graph text stretching (root cause: using parent element rect instead of canvas rect, parent includes header so height was wrong)
- Made net worth graph Y-axis dynamic (fewer grid lines on small screens, removed decimal points from labels)
- Reduced graph padding from 55px all sides to minimal (10px top, 20px bottom for labels, dynamic left)
- Fixed X-axis date labels overlapping with bottom grid line
- Fixed run end screen trade history overflowing its container box
- Discovered Electron was caching old JS files, cleared cache

### What was changed
- `js/ui.js` - Net worth graph: use canvas.getBoundingClientRect(), dynamic padding, dynamic grid line count, compact axis labels, proper X-axis label spacing
- `css/style.css` - Removed global canvas width:100%, run end tab content max-height + overflow scroll

### What is broken or incomplete
- Nothing known broken. Net worth graph confirmed working after Electron cache clear.
- All changes still not pushed to remote

### Next steps
1. Clear Electron cache before each test session (or add cache-busting to main.js)
2. Full playtest of all features
3. Push to origin
4. Midjourney artwork (deferred, needs style iteration)

---

## Session: 2026-06-14 (continued)

### What was done
- Fixed Top Movers flickering (was rebuilding DOM every tick, now only re-renders on day change)
- Made Top Movers collapsible (closed by default, slim header bar, click to expand)
- Fixed Top Movers toggle not responding to clicks (was waiting for next tick, now toggles CSS class directly)
- Fixed Top Movers header styling to match existing section titles instead of looking like a separate button
- Fixed net worth graph text stretching (4 attempts, root cause: code was using parent element rect which includes the header, not the canvas's own rect)
- Removed decimal points from net worth graph Y-axis labels ($10K not $10.0K)
- Attempted Midjourney prompt iterations (3 rounds, all too AI-looking, deferred)

### What was changed
- `js/ui.js` - Top movers: collapsible with cached render, direct CSS toggle. Net worth graph: use canvas.getBoundingClientRect() instead of parentElement, compact Y-axis labels
- `css/style.css` - Top movers header styled as section label, canvas CSS rules cleaned up

### What is broken or incomplete
- Net worth graph fix needs verification by Dominic (4 failed attempts before finding root cause, may still not be right)
- Midjourney art style not resolved, deferred to future session
- None of the session's changes have been pushed to remote
- All new features (top movers, watchlist, P&L sorting, guided tutorial, trade animations) still need thorough playtesting

### Next steps
1. Restart game (npm start) and verify net worth graph text is no longer stretched
2. Playtest all features end-to-end in a full run
3. Report any remaining bugs
4. Push to origin when satisfied
5. Come back to Midjourney artwork with fresh approach (try generating reference images manually first, then use --sref)

### Open questions
- Is the net worth graph finally fixed? Root cause was using parent rect instead of canvas rect
- Top Movers: is collapsible the right UX, or should it be removed/simplified?

---

## Session: 2026-06-14

### What was done
- Committed all outstanding work from March sessions (268 files, commit 90ec3e5)
- Ran full CEO Review in SELECTIVE EXPANSION mode - accepted 6 feature expansions + artwork overhaul
- Ran Design Review - scored C+ baseline, found 10 design issues
- Fixed all 10 design issues (color softening, net worth wrap, touch targets, speed buttons, quarter pills, news header, category pills, number formatting)
- Built Top Movers panel - collapsible, closed by default, shows top 3 gainers/losers, cached per-day
- Built P&L sorting + enhanced display - positions sorted by absolute P&L, percentage badge, colored borders
- Built Watchlist/favorites - star system on every stock, Watchlist filter pill, max 20, persisted via SaveManager
- Built trade feedback animations - button flash on buy/sell, cash display highlight, quarterly level-up celebration
- Built guided first trade tutorial - 3-step spotlight overlay, auto-advances on player actions
- Created Midjourney art guide (MIDJOURNEY_ART_GUIDE.md) - needs style iteration
- Fixed Top Movers flickering (was rebuilding DOM every tick)
- Fixed Top Movers toggle (wasn't responding to clicks, styled as button instead of section label)
- 12 commits this session

### What was changed
- `css/style.css` - Color softening, touch targets, top movers (collapsible), watchlist star, position card enhancements, trade animations, guided tutorial overlay
- `js/ui.js` - Top movers rendering (collapsible, cached), P&L sorting, watchlist toggle/filter, trade flash methods, guided tutorial step tracking
- `js/market.js` - getTopMovers() with per-day cache
- `js/main.js` - Guided tutorial system, quarterly level-up flash trigger
- `js/progression.js` - Watchlist array in default save data
- `index.html` - Top movers div, guided tutorial overlay HTML
- `.gitignore` - Added exclusions for media, build output, local settings
- `MIDJOURNEY_ART_GUIDE.md` - Created (asset list + prompts, style needs work)

### What is broken or incomplete
- Midjourney art prompts need more iteration. Three rounds of prompts all looked too AI-generated. The right direction is "painted illustration style, atmospheric, muted palette, no people" but needs hands-on Midjourney experimentation to nail it. Reference that worked: HM Treasury building prompt.
- Achievement icons deferred until main art style is locked in
- All new features need continued playtesting (Dominic started testing, found Top Movers flicker + toggle bugs which were fixed)
- Changes not yet pushed to remote

### Next steps
1. Continue playtesting all features in Electron (npm start) - report any bugs
2. Experiment with Midjourney art style in Midjourney directly until it looks right
3. Once art style is nailed, generate all 24 assets per MIDJOURNEY_ART_GUIDE.md
4. Integrate artwork into game and Steam store page
5. Push changes to origin when satisfied
6. Take new screenshots and record new trailer with improved UX
7. Update Steam store page

### Open questions
- What Midjourney style looks right? Needs hands-on experimentation, not more prompt writing
- Top Movers: is 3 per side the right number? Is collapsible the right UX or should it just always show?
- Do trade feedback animations feel right at high game speeds (20x, 50x)?
- Should the guided tutorial pause the game or let time tick? (Currently pauses)

---

## Session: 2026-03-28

### What was done
- Changed demo start year from 2007 to 2020 (COVID pandemic era) based on player feedback that 2007 was too easy
- Updated build script date range from 2005–2009 to 2020–2021 so baked-in stock data covers the new era
- Fixed preset button styling in CSS — 2008 Crisis was incorrectly shown as active, 2020 Pandemic was incorrectly locked; swapped these
- Rebuilt the itch.io demo zip (now 8.7 MB, 167 tickers for 2020–2021)
- Drafted itch.io devlog post copy for the era change
- Drafted Reddit reply to player complaint about quarterly targets being too aggressive

### What was changed
- `js/ui.js` — demo mode year lock changed from 2007 → 2020
- `index.html` — slider default value changed from 2008 → 2020
- `css/style.css` — demo preset button greyout: swapped data-start="2020" (was locked) ↔ data-start="2007" (now locked)
- `scripts/build_itchio.ps1` — date filter changed from 2005–2009 → 2020–2021

### What is broken or incomplete
- Changes not yet committed to git
- Demo not yet uploaded to itch.io — new zip is ready at itchio_build\SecondChanceAtABillion_Demo.zip
- Devlog post and Reddit reply drafted but not yet posted

### Next steps
1. Commit the 4 changed source files (ui.js, index.html, style.css, build_itchio.ps1)
2. Upload new itchio_build\SecondChanceAtABillion_Demo.zip to itch.io (delete old file first)
3. Test the demo — confirm year is locked to 2020, 2020 Pandemic button is active, others are greyed/locked
4. If it works: set itch.io page to Public, then post to r/WebGames, r/itchio, r/freegames
5. Post Reddit reply to Homer00's comment (copy drafted this session)

### Open questions
- Are the quarterly targets still too aggressive for 2020, or does the COVID recovery make Q1 ($15k) feel achievable?
- Should Comments be enabled on the itch.io devlog post?

---

## Session: 2026-03-26

### What was done
- Asked about stocks in the dataset that had dramatic 2008 crisis moves — confirmed AIG.json is in the dataset
- Wrote Reddit post copy for 4 subreddits: r/WebGames, r/itchio, r/freegames, r/incremental_games
- Fixed r/freegames wording — changed "free to play" to "free demo" to be accurate since full game is on Steam
- Placeholder links left for itch.io and Steam — to be filled in before posting
- Trailer will be attached to each post manually by Dominic

### What was changed
- Nothing in the codebase — session was marketing/copy focused

### What is broken or incomplete
- itch.io demo still not confirmed working (carried over from last session)
- Reddit posts not yet posted — awaiting itch.io URL and Steam link

### Next steps
1. Upload NEW itchio_build\SecondChanceAtABillion_Demo.zip to itch.io (delete old file first)
2. Test the demo — click Play, confirm stock data loads and gameplay works
3. Check demo banner and "Full Game Only" shop labels appear correctly
4. Once confirmed working: set itch.io page to Public
5. Fill in itch.io and Steam links in the 4 Reddit posts, attach trailer, then post to r/WebGames, r/itchio, r/freegames, r/incremental_games
6. Continue building Reddit comment karma (r/stocks needs 75, r/wallstreetbets needs ~500)
7. Record a gameplay clip for TikTok / YouTube Shorts / Twitter

### Open questions
- Does the itch.io demo actually work with inlined CSS/JS? (still untested)
- AI disclosure on itch.io: confirm "Code" is set before publishing
- Consider enabling Comments on itch.io page (currently Disabled)

---

## Session: 2026-03-25

### What was done
- Full project review: identified stale/outdated documentation
- Deleted PLAN.md and IMPLEMENTATION_SUMMARY.md (old planning docs, no longer useful)
- Rewrote QUICK_START.md to match the current actual game state
- Fixed one misleading line in README.md (now correctly says "500+ S&P 500 stocks 2000–2024")
- Reviewed Steam analytics (785 impressions, 597 visits, 37 wishlists in week 1) — numbers are modest but not alarming for week 1 with no ad spend
- Updated Steam tags: removed "Turn-Based Strategy" (inaccurate) and "Idler" (wrong audience), added "Management", reordered for better discoverability
- Built a full marketing plan with exact Reddit post copy, Twitter thread copy, trailer script, and Discord strategy
- Identified r/wallstreetbets as highest-value target but needs ~500 comment karma first
- Posted on r/gamedev (25/03) with data scientist / AI dev angle
- Built itch.io demo version of the game:
  - Added DEMO_MODE flag to config.js (false in main game, true in demo)
  - Limited to 3 preset starting years: 2008 Crisis, 2020 Pandemic, Dot-com Bubble
  - 11 unlockable upgrades (all illegal actions and advanced upgrades locked)
  - Demo banner linking to Steam page
  - "Full Game Only" labels on locked shop nodes
  - Created build_itchio.bat script and inline_css.ps1 to package the demo
  - Demo zip is 61MB using compressed market data
- Attempted to get itch.io demo working — CSS and JS are now inlined into index.html to fix MIME type issues

### What was changed
- PLAN.md — deleted
- IMPLEMENTATION_SUMMARY.md — deleted
- QUICK_START.md — full rewrite
- README.md — one line fix
- css/style.css — added demo-locked node styles and demo banner CSS
- index.html — added demo banner, demo-year-label, DEMO_MODE activation script
- js/config.js — added DEMO_MODE, DEMO_ALLOWED_UNLOCKS, DEMO_PRESET_YEARS constants
- js/ui.js — added demo-locked state in renderShop(), blocked demo-locked nodes in showNodeDetail()
- scripts/build_itchio.bat — new file: builds the itch.io demo zip
- scripts/inline_css.ps1 — new file: inlines CSS and all JS into index.html for the demo

### What is broken or incomplete
- itch.io demo not yet confirmed working — last upload had buttons not responding. New build inlines all CSS and JS which should fix it, but has NOT been tested yet. Needs a new upload and test.
- js/trading.js has uncommitted modifications (pre-existing from before this session — unrelated to today's work)
- itchio_build/ folder is untracked and not committed (intentional — build output)

### Next steps
1. Upload the NEW itchio_build\SecondChanceAtABillion_Demo.zip to itch.io (delete old file first)
2. Test the demo — click Play, select a year, confirm stock data loads and gameplay works
3. Check the demo banner appears at the bottom of the screen in-game
4. Check the shop shows "Full Game Only" on locked items
5. If it works: set itch.io page to Public, then post to r/WebGames, r/itchio, r/freegames
6. Continue building Reddit comment karma daily (target: r/stocks needs 75, r/wallstreetbets needs ~500)
7. Record a gameplay clip (needed for TikTok, YouTube Shorts, better Twitter posts)
8. Make the revised trailer using the script from this session
9. Commit today's code changes (all the demo mode infrastructure)

### Open questions
- Does the itch.io demo actually work now with inlined CSS/JS? (needs testing)
- Which 3 subreddits to post on next once karma allows: r/stocks (75), r/IndieDev (20), r/tycoon (check req)
- AI disclosure on itch.io: decided to disclose Code — confirm this is set before publishing
- Consider enabling Comments on itch.io page (currently Disabled)

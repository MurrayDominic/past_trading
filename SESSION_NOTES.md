## Session: 2026-06-13

### What was done
- Committed all outstanding work from March sessions (268 files: source changes, 243 stock data files, 11 scripts, docs cleanup)
- Updated .gitignore to exclude media assets (trailer 303MB, steam 12MB, shorts 7MB), itchio_build, steamworks, and .claude/settings.local.json
- Ran full CEO Review (/plan-ceo-review) in SELECTIVE EXPANSION mode
- Ran Design Review (/design-review) producing full audit report
- Game has 60 Steam sales, looking to improve UX for growth

### CEO Review Decisions
- Approach: Full UX Overhaul (all screens)
- 6 expansions accepted: guided first trade, watchlist/favorites (cap 20), trade feedback animations, enhanced sector tabs, P&L display with sorting, top movers panel
- 1 expansion skipped: compact menu header redesign
- 1 addition: artwork overhaul using Midjourney
- Spec review caught that sector tabs and P&L colors already partially exist in code, guided tutorial is Medium effort not Small

### Design Review Findings
- Design Score: C+ | AI Slop Score: A
- 10 findings: 4 high, 5 medium, 1 polish
- Top issues: Net Worth text wrap, only 2 of 9 sector filters shown, stock list has no visual differentiation, heading scale wildly inconsistent (H2 ranges 18-32px)
- Quick wins: fix text wrap, show all 9 category pills, color-code price changes, soften pure white on pure black

### What was changed
- Committed: all modified source files + new stock data + scripts
- .gitignore updated with new exclusions
- CEO plan written to ~/.gstack/projects/
- Design audit report written to .gstack/design-reports/

### Next steps
1. CSS/Layout fixes (10 design findings from audit)
2. Feature expansions (top movers, watchlist, guided tutorial, trade feedback)
3. Artwork generation in Midjourney + integration
4. Steam store page and trailer polish
5. Reports saved at:
   - CEO plan: ~/.gstack/projects/MurrayDominic-past_trading/ceo-plans/2026-06-13-ux-overhaul.md
   - Design audit: .gstack/design-reports/design-audit-localhost-2026-06-13.md

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
- `itchio_build/SecondChanceAtABillion_Demo.zip` — rebuilt (not committed, build output)

### What is broken or incomplete
- Changes not yet committed to git
- Demo not yet uploaded to itch.io — new zip is ready at itchio_build\SecondChanceAtABillion_Demo.zip
- Devlog post and Reddit reply drafted but not yet posted

### Next steps
1. Commit the 4 changed source files (ui.js, index.html, style.css, build_itchio.ps1)
2. Upload new itchio_build\SecondChanceAtABillion_Demo.zip to itch.io (delete old file first)
3. Test the demo — confirm year is locked to 2020, 2020 Pandemic button is active, others are greyed/locked
4. Post the devlog on itch.io (copy drafted this session)
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

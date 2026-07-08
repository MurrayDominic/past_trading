# Research 4: Making Dense Financial Data Feel Like a Game

Research for the "Second Chance at a Billion" v2 UI overhaul. All patterns below are drawn from named games with sources, and are chosen for direct applicability to a tick-based trading roguelike running at 0.5x-10x speed.

---

## 1. Case Studies: Data-Heavy Games That Still Feel Like Games

### Balatro (the North Star)
The key insight from multiple breakdowns ([Blake Crosley's juice analysis](https://blakecrosley.com/guides/design/balatro), [cccChoice's design analysis](https://medium.com/@yyh19971004/balatro-design-analysis-visual-packaging-and-interactive-feedback-cc6fa6a65370), [Indieklem's "100% interface games"](https://indieklem.substack.com/p/20-a-look-at-100-interface-games)): the juice IS the game, not decoration on top. Balatro is literally just arithmetic, but the audiovisual layer makes math feel like a slot machine. Patterns to steal:

- **Numbers as physical objects.** Score digits roll independently with ~50ms staggered delays per digit and a bouncy overshoot easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`), spinning like slot reels before landing. Your net worth counter should never snap to a new value; it should roll.
- **Magnitude-scaled screen shake as a data channel.** Small scores: 0.2s, +/-2px. Medium: 0.3s, +/-4px. Large: 0.5s, +/-8px with rotation. Players learn to feel "that was a big trade" from shake intensity before reading the number. Directly maps to trade profit size.
- **Sequential causality animation.** Jokers trigger left-to-right, each pulsing with the running total updating between triggers. 300ms of animation replaces a tutorial page by showing cause and effect. For you: when a position closes, animate proceeds minus fees minus interest as sequential line items ticking into cash, not one opaque delta.
- **Semantic color with zero labels.** Blue = chips, red = mult, gold = money, everywhere, always. This lets Balatro delete labels entirely. Define 4-5 sacred colors (cash, unrealized P&L, SEC heat, PP) and never reuse them for anything else.
- **Background as state signal.** The swirling background changes color and texture on Boss Blinds and booster packs, like stage lighting in a theater. For you: background tint shifts during crashes (2008, March 2020), SEC investigation stages, and the final quarter.

### Stonks-9800 (closest genre neighbor)
An 80s Japanese stock market sim in PC-98 anime aesthetic ([Steam](https://store.steampowered.com/app/1539140/STONKS9800_Stock_Market_Simulator/), [TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/Stonks9800StockMarketSimulator), [Legacy of Games impressions](https://legacyofgames.com/2025/12/03/first-impressions-stonks-9800/)). Patterns:

- **Period aesthetic makes numbers "fiction."** The retro terminal framing turns spreadsheet content into a diegetic object. Numbers on a CRT feel like a game; numbers in a modern flat UI feel like Excel. Your year-select premise (2000-2023) invites era-flavored skins (Bloomberg-terminal-green for 2000, etc.).
- **Movable, multi-window desktop-OS interface** as its evolution path: multiple chart windows open at once, switchable, draggable. This is progressive density: beginners keep one window, experts tile five.
- **News as foreshadowing mechanic, not log.** Headlines hint at upcoming price changes (product launches, crashes, regulation) so reading news IS playing. Your news feed should be predictive ammunition, not commentary wallpaper.

### The Invisible Hand (2021, stock-broker sim)
Most of the game happens across a diegetic multi-monitor trading terminal ([3rd-strike review](https://3rd-strike.com/the-invisible-hand-review/), [Gamecritics](https://gamecritics.com/david-bakker/the-invisible-hand-review/)). Lessons, including negative ones:

- **Three-zone terminal layout**: trade feed (what other brokers expect) left, tradeable list center, price history right. Clean separation of "signal," "selection," and "evidence."
- **Cautionary tale on screen sprawl**: it has four switchable screens but "only one sees the most action," with the upper two having "little to no value" per reviewers. Extra screens must earn their existence with a decision the player actually makes there.
- Reviewers also noted the broker UI is "confusing at first" for non-traders, which validates the onboarding-first instinct.

### Offworld Trading Company (real-time market UI, the best precedent)
Soren Johnson's economic RTS where "market forces are your weapons" ([Steam](https://store.steampowered.com/app/271240/), [Gamereactor review](https://www.gamereactor.eu/offworld-trading-company-review/), [Market wiki](https://offworldtradingcompany.fandom.com/wiki/Market)). Patterns:

- **The market lives in a persistent sidebar, one click from action.** The left sidebar simultaneously shows every resource's live price, your stockpile, and your surplus/deficit rate, and doubles as the buy/sell interface. No modal, no separate trade screen. Buying/selling is as fast as thinking. Compare to the current flow (select asset, then type quantity, then click); OTC proves instant single-click transactions at the point of information is what makes a market feel real-time.
- **Prices visibly tick with every transaction.** Because every buy pushes price up and every sell pushes it down, the number itself becomes animate and players "understand a number ticking upwards" as strategy. Even though our prices are historical replay, the tick-by-tick digit movement (with up/down flash) is what sells liveness.
- **A 20-minute match of "frantic, split-second buy-or-sell decisions"** shows dense economics can be an action game when latency between seeing and acting approaches zero.

### Football Manager (what to avoid, freshly demonstrated)
FM26's UI overhaul is a live case study in getting this wrong ([Absolute Geeks review](https://www.absolutegeeks.com/article/featured/football-manager-26-review-a-beautiful-game-trapped-in-an-ugly-interface/), [community thread](https://community.sports-interactive.com/bugtracker/1644_football-manager-26-bugs-tracker/user-interface/2166_advanced-access-betas-ui-issues/2074_general-user-interface-issues/a-passionate-plea-rethinking-ui-scaling-for-high-resolution-4k-displays-3840x2160-r37910/)):

- Critical data got buried behind clicks and "flashy tile-based menus that waste screen real estate"; data density was "sacrificed for a modern look." Fans are begging for a "High-Density / Data-First layout option."
- **Lesson**: game-like does not mean fewer numbers. It means better hierarchy, motion, and feedback around the same numbers. V2 must not fix "clunky" by hiding information experts use every tick; the FM26 backlash is exactly what happens.
- FM's historical strength (pre-26): every number is a link; clicking any stat drills into its source. Universal drill-in is worth stealing.

### Mini Metro / Mini Motorways
([Game Developer interview](https://www.gamedeveloper.com/audio/-i-mini-motorways-i-and-the-delicate-art-of-marrying-complexity-and-minimalism), [design analysis](https://medium.com/gaming-is-good/mini-metro-and-mini-motorways-the-art-of-elegant-constraint-optimization-2571a32fdfe2))

- **Encode state in the play surface itself, not in HUD widgets.** Congestion is visible as shape and color on the map; there is almost no chrome. For us: how much of risk/SEC state could live ON the chart and the positions themselves (position cards glowing hotter as SEC attention rises) instead of separate meters?
- **Ships three visual themes including a dedicated colorblind mode and dark mode** as first-class art directions, not filters.
- **Data-driven ambient audio**: each line plays a musical note; system state becomes soundscape. A run's audio could subtly reflect portfolio health (market drone rising with net worth, dissonance as SEC heat climbs), giving 10x-speed players ambient awareness without reading.

### Persona 5 (style as information)
([Ridwan Khan's UI/UX breakdown](https://ridwankhan.com/the-ui-and-ux-of-persona-5-183180eb7cce), [Game UI Database](https://www.gameuidatabase.com/gameData.php?id=72), [balance analysis](https://medium.com/design-bootcamp/how-persona-5s-ui-balances-both-style-and-substance-de8cb1b807ef))

- **One dominant color, defended ruthlessly.** The designers refused sub-colors that would dilute the red. A strong single accent makes even menus feel branded.
- **Every transition is animated in-fiction** (Joker's hand swipes in the menu; shopkeeper silhouettes flip between categories). Menus feel like part of the world, not pauses from it.
- **Counter-lesson**: critics note P5's angled, high-contrast layouts sometimes hurt scanability ([Michelle Kwan's critique](https://medium.com/design-bootcamp/is-persona-5s-ui-a-hit-or-a-miss-077c8dd94d43)). Style must bend around tabular data, not the reverse. Keep numbers on a rectilinear grid; spend the style budget on frames, transitions, and celebrations.

### Crusader Kings 3 (progressive disclosure at scale)
([Game Developer deep dive](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux), [Philip Ardeljan on nested tooltips](https://philip.design/blog/tooltips-in-tooltips/)) - covered in depth in section 2.

### Dave the Diver
([Sibylle Writes Games](https://www.sibyllewritesgames.com/p/dh-dave-the-diver)) - Juggles a dozen systems by **containerizing sub-systems in a diegetic phone**: sidequests, staff, research all live in phone apps, keeping the main play view clean. Our shop/titles/achievements/leaderboard meta could live in an in-fiction device (a 2000s Blackberry or Bloomberg pager) rather than generic menu tabs.

### Potionomics
([Game Developer Road-to-IGF interview](https://www.gamedeveloper.com/road-to-igf-2023/how-potionomics-turned-price-haggling-into-a-card-game)) - Two big steals:

- **Turned pricing (a slider in any other game) into a full card-battle minigame** with patience and interest meters. Radical, but shows any economic verb can be gamified if it has stakes, a resource, and a fail state.
- **"Characterful UI"**: character faces function as UI, always visible, with animation states reinforcing meters "on what is otherwise a very complicated screen." Our SEC agent could be a character whose portrait escalates (bored, curious, staring, subpoena in hand) as a companion display to the attention meter. Faces are pre-attentively readable at 10x speed in a way meters are not.

---

## 2. Progressive Disclosure: 5 Numbers for Beginners, 50 for Experts

- **Nested tooltips (CK3's signature pattern).** Every game term in a tooltip is itself hoverable, spawning a tooltip-within-tooltip; you can chase definitions to arbitrary depth without leaving context ([philip.design](https://philip.design/blog/tooltips-in-tooltips/), [CK3 Dev Diary #16](https://forum.paradoxplaza.com/forum/threads/ck3-dev-diary-16-tutorials-and-tooltips-and-encyclopedias-oh-my.1345581/)). CK3 pins tooltips with a keypress so they can be inspected. For a vanilla-JS game this is very implementable: hover "Sharpe" or "leverage 3x" anywhere and get a definition, with any linked term hoverable again.
- **Reveal panels only when relevant (CK3 tutorial).** CK3 hides parts of the character panel for new players and reveals sections "bit by bit" via events at the moment of relevance ([Game Developer](https://www.gamedeveloper.com/design/deep-dive-refreshing-the-crusader-kings-iii-tutorial-mode-through-optimized-ux)). We already have a natural key: unlocks. Don't show the SEC meter until attention first rises; don't show risk limits until leverage is unlocked; the shop already gates features, so let it gate UI panels too. First-run screens can be dramatically emptier than run 20 screens, and that's a progression reward, not a limitation.
- **Balatro's replacement of tutorials with hover.** No manual; hovering any card/icon yields a plain-language tooltip, and the scoring animation itself teaches the math ([cccChoice](https://medium.com/@yyh19971004/balatro-design-analysis-visual-packaging-and-interactive-feedback-cc6fa6a65370)).
- **Explicit density modes.** The FM26 community's request for a "Data-First layout option" shows expert players want a toggle, not a redesign ([SI community](https://community.sports-interactive.com/bugtracker/1644_football-manager-26-bugs-tracker/user-interface/2166_advanced-access-betas-ui-issues/2074_general-user-interface-issues/a-passionate-plea-rethinking-ui-scaling-for-high-resolution-4k-displays-3840x2160-r37910/)). Consider a per-panel expand: positions panel shows ticker/qty/P&L by default, expands to entry price, leverage, days held, liquidation distance.
- **Universal drill-in**: any number that is an aggregate (net worth, daily P&L, fees paid) should decompose on click. This is FM's core interaction and the single best cure for "spreadsheet feel," paradoxically, because it makes numbers into doors instead of cells.

---

## 3. Making the Price Chart a GAME Element

- **Trade markers on the chart.** Annotate the player's own buys/sells as pins on the line/candles (entry arrows with a dotted "cost basis" line extending forward, so unrealized P&L is visible as the gap between the price line and the entry line, shaded green/loss-color). No shipped game does this better than real platforms (TradingView-style markers), which is an opportunity: in a game you can be louder, e.g., a flag planted with a particle puff at buy, ripped out with profit confetti at sell.
- **Event flags as physical objects.** News events pinned to the timeline as small icons (the dot-com peak, Lehman collapse) that pulse before they arrive. Stonks-9800 proves news-as-foreshadowing is the fun of a period trading game ([Steam](https://store.steampowered.com/app/1539140/STONKS9800_Stock_Market_Simulator/)).
- **Foreknowledge as fuzzy memory (our unique mechanic).** Precedents to build from:
  - **Into the Breach** is the canonical "seeing the future" UI: every enemy attack is fully telegraphed with arrows and outcome previews, and the designers' principle was "sacrifice cool ideas for the sake of clarity every time" ([Game Developer](https://www.gamedeveloper.com/design/-i-into-the-breach-i-dev-on-ui-design-sacrifice-cool-ideas-for-the-sake-of-clarity-every-time-), [GDC postmortem PDF](https://ubm-twvideo01.s3.amazonaws.com/o1/vault/gdc2019/presentations/Into%20the%20Breach%20Postmortem%20Final.pdf)). Tactical Breach Wizards learned the same lesson: players will not enjoy testing 25 outcomes manually; show the preview ([Game Developer](https://www.gamedeveloper.com/design/tactical-breach-wizards-shows-how-strategy-games-can-tickle-the-funny-bone)).
  - **Outer Wilds' rumor map** is the best model for imperfect knowledge: discoveries are nodes, connections are edges, and "There's more to explore here" markers show where knowledge is incomplete without spoiling it ([Outer Wilds wiki](https://outerwilds.fandom.com/wiki/Computer), [UX analysis](https://medium.com/@claudmohe/how-outer-wilds-transcends-ux-to-become-human-experience-3ff41def8f8c)). The pattern: visualize the SHAPE of what you know and explicitly mark the fuzz.
  - Concrete synthesis for our game: render "memories" as a fuzzy translucent band on the chart's future region (wide = vague memory, narrow = sharp), or as hand-scrawled marginalia ("Apple... something big in October?") pinned to future dates. Insider tips or unlocks (Market Intel shop row) sharpen the band. This turns the insider-trading mechanic into literal chart UI: illegal tips temporarily draw the real future line for one stock, ghosted. Do not show the actual future line by default; show confidence intervals that gamble like a roguelike should.
- **Candlestick alternatives**: keep the line chart as default (candles read as "finance homework" to non-traders), but make the line itself juicy: it draws forward each tick with a glowing leading dot, thickens on high-volatility days, and the fill-under gradient shifts with trend. Candles can be the unlocked "pro view" (day-trading mode already implies them).

---

## 4. Feedback and Celebration (Without Noise at 10x)

- **Balatro's five-channel juice stack** (card motion + rolling counters + screen color pulse + particles + pitched audio, with notes stepping up C-D-E-F-G across a combo) is the template ([Blake Crosley](https://blakecrosley.com/guides/design/balatro)). Every profitable sell should fire a proportional subset of these channels.
- **Damage-number discipline.** Standard guidance: routine events use small white/neutral text and must NOT be visually noisy because they will flood the screen; crits (big wins) get 150-200% size with a pop-scale before floating; distinct colors per event class ([GameJuice](https://gamejuice.co.uk/articles/damage-numbers-satisfying-feedback), [Blood Moon Interactive on juice](https://www.bloodmooninteractive.com/articles/juice.html)). Map: daily unrealized ticks = no popup at all; realized profit = floating popup scaled to magnitude; quarterly target hit = full celebration takeover.
- **The Vampire Survivors warning**: with thousands of events, "enemies die so quickly, the numbers are meaningless" and players turn damage numbers off ([Steam discussion](https://steamcommunity.com/app/1794680/discussions/0/3470612993483101082/)). At 10x speed we are Vampire Survivors. Techniques for feedback scaling when events outpace animations:
  - **Coalesce, don't queue.** A rolling counter absorbs any event rate: new deltas retarget the count-up animation rather than spawning new animations. This is why Balatro-style rolling numbers are the correct primitive for a variable-speed game.
  - **Aggregate popups**: if 3+ P&L events land within ~400ms, merge into one popup showing the sum ("+$48,200 (3 trades)"), sized by total.
  - **Feedback budgets by tier**: reserve screen shake, particles, and time-stop for rare tiers (quarter passed, $1M milestone, arrest). Tie celebration thresholds to log-scale net worth so a $500 win celebrates at game start but is silent when you're worth $100M; Balatro's magnitude-relative shake implies exactly this.
  - **Brief time dilation for landmark moments** (a few frames of slow-down when a quarterly target is hit) reads clearly even at 10x, a fighting-game hit-stop technique ([Game Dev on juice](https://gamedev4u.medium.com/when-you-play-a-great-game-it-feels-good-d23761b6eccf)).
  - **Audio scales better than visuals at speed**: pitch-stepped ticks (rising arpeggio while profit accrues) layer gracefully where particles become soup, per Balatro's staggered pitch notes and Mini Metro's data-driven music ([Game Developer](https://www.gamedeveloper.com/audio/-i-mini-motorways-i-and-the-delicate-art-of-marrying-complexity-and-minimalism)).

---

## 5. Screen Architecture: Cockpit vs Scenes

- **The genre precedents split**: Offworld is a pure single-screen cockpit because decisions are second-to-second and the market must always be one click away ([Gamereactor](https://www.gamereactor.eu/offworld-trading-company-review/)). Stonks-9800 uses scenes/windows (desk, phone, newspaper, movable chart windows) because it is a slow, chill, pause-friendly game ([Legacy of Games](https://legacyofgames.com/2025/12/03/first-impressions-stonks-9800/)). The Invisible Hand's four screens partially failed: reviewers found only one screen mattered ([3rd-strike](https://3rd-strike.com/the-invisible-hand-review/)).
- **The deciding variable is decision cadence.** Anything the player acts on every few ticks (prices, positions, cash, SEC heat) must be on the always-visible cockpit; anything consulted between decisions (deep stats, run history, shop) can be a scene. Our game at 10x is closer to Offworld than Stonks-9800, so the core loop should stay single-screen, but the current 3-column everything-at-once dashboard is the "spreadsheet" culprit. The fix is hierarchy within one screen, not more screens.
- **Diegetic framing is a coat, not a floor plan.** The diegetic-UI literature is consistent: full diegetic interfaces become a "cognitive burden" when systematic; real-time-critical data should stay non-diegetic/instant, while contextual data (news, research) can be diegetic objects the player deliberately opens ([Indieklem's diegetic dilemma](https://indieklem.substack.com/p/19-the-diegetic-dilemma-benefits), [nastyrodent's 4-type framework](https://nastyrodent.com/diegetic-and-non-diegetic-ui/)). Papers, Please works because inspecting documents IS the game ([TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Main/DiegeticInterface)). Practical hybrid: frame the cockpit as a trader's desk (monitor bezels, a period phone for illegal actions, a newspaper that slides in for daily news, Dave the Diver's phone-app pattern for meta menus) while keeping prices/positions as clean instant UI. Scene changes are for run boundaries (year select as a time machine, run-end as an office being packed into boxes when fired versus an FBI raid when arrested), where pacing WANTS a hard cut.

---

## 6. Typography and Number Readability

- **Tabular (monospaced-width) numerals are non-negotiable.** Fast-changing numbers in proportional figures jitter horizontally as digits change width, which reads as visual noise at 10x. Use a font with tabular figures or CSS `font-variant-numeric: tabular-nums`; accessible-numeric guidance also points to mono-style faces like IBM Plex Mono for data ([UI UX docs example](https://ui-ux-pro-max-skill.com/docs/examples/)). Balatro's chunky pixel numerals are effectively tabular; "in score-driven games, typography IS mechanics" ([halabaojia breakdown](https://halabaojia.com/collection/20260212-balatro-visual-design-analysis/)).
- **Two-font system**: a characterful display face for headings, event flags, and celebrations (the Copperplate branding), and a workhorse tabular face for every live number. Persona 5 shows display type carries style; its critics show body data must stay boring ([Michelle Kwan](https://medium.com/design-bootcamp/is-persona-5s-ui-a-hit-or-a-miss-077c8dd94d43)).
- **Beyond red/green**: deuteranopia (most common colorblindness) renders red and green as brown and tan ([atmos.style](https://atmos.style/blog/color-blindness-in-ui-design), [Chris Fairfield's game guide](https://chrisfairfield.com/unlocking-colorblind-friendly-game-design/)). Never encode gain/loss by hue alone: pair color with direction glyphs (triangles up/down), sign prefixes, and position/weight. The standard safe pairing is blue/orange (Mini Motorways ships a colorblind theme as a first-class style; [Game Developer](https://www.gamedeveloper.com/audio/-i-mini-motorways-i-and-the-delicate-art-of-marrying-complexity-and-minimalism)). A "colorblind" toggle that swaps the gain/loss hue pair is cheap since colors are centralized.
- **Precision tiers.** Idle-game practice: full digits feel visceral up to ~6-7 digits, then abbreviate (1.23M, 4.56B) because "otherwise your whole screen would be filled with numbers" ([InnoGames blog](https://blog.innogames.com/dealing-with-huge-numbers-in-idle-games/), [Game Developer on large-number names](https://www.gamedeveloper.com/design/names-of-large-numbers-for-idle-games)). Recommended rule set for a $10K-to-$1B arc: cents only in the trade ticket and per-share prices; whole dollars with thousands separators up to $999,999; abbreviated with 3 significant figures above $1M for ambient displays, with the full figure available on hover (drill-in from section 2). Crucially, keep the HERO number (net worth) rolling digit-by-digit even when abbreviated, because the motion, not the precision, carries the feeling of money moving.
- **Hierarchy by size, not by count.** FM26's failure shows shrinking the number count is wrong; Balatro shows the answer is making the ONE number that matters right now enormous (score at hand-play, net worth at quarter end) while everything else stays small and stable.

---

### Cross-cutting takeaways for v2

1. Adopt Balatro's primitive everywhere: rolling, magnitude-eased counters as the atom of the UI; they inherently solve 10x-speed feedback coalescing.
2. Steal Offworld's "market in the sidebar, one click to trade" to kill the current multi-step trade flow.
3. Make the chart the stage: player trade markers, event flags, and fuzzy "memory of the future" bands (Into the Breach clarity + Outer Wilds incomplete-knowledge marking) are our most differentiating UI feature.
4. Progressive disclosure through the meta-progression we already have: panels and data columns as unlocks, plus CK3-style nested tooltips.
5. Single-screen cockpit with diegetic garnish (desk frame, phone for crimes, newspaper for news), scene cuts only at run boundaries.
6. Tabular numerals, one accent color defended Persona-5-style, blue/orange-capable P&L encoding, and precision that degrades gracefully from cents to $1.23B.

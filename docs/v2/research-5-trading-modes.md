# Research 5: New Trading Modes — Data Feasibility + Mechanical Design (raw agent output)

**Framing note on the law before the per-mode detail.** Two principles drive everything below. First, raw price facts are not copyrightable in the US (*Feist v. Rural*), but most data vendors bind you **contractually** via API/download terms, and US equity/options intraday data sits under **exchange licensing regimes** (NYSE, Nasdaq, OPRA) that are enforced aggressively. Second, **US government data is public domain** and **crypto exchanges are unregulated data sources with no exchange-fee regime**, which is why some modes are trivially shippable and others are landmines. The safest sources for a paid indie game are, in order: US government agencies (public domain), central banks (free with attribution), crypto exchange public dumps, then everything else.

---

## 1. CRYPTO

### Data: EXCELLENT (best of the five)

- **Binance public data dumps** (https://data.binance.vision/, repo: https://github.com/binance/binance-public-data) — bulk ZIP downloads of klines at every granularity from 1s to 1mo, all pairs, from each pair's listing (BTC/ETH majors from **August 2017**). The GitHub tooling repo is MIT-licensed; the data itself ships with **no click-through TOS and no stated license**. Crypto prices aren't exchange-fee regulated like equities, and Binance explicitly publishes this for public consumption. Risk: low but not formally zero (no explicit redistribution grant). Daily klines for ~100 coins would be **well under 5 MB gzipped**.
- **Bitstamp BTC/USD 1-minute data since January 2012** — maintained on Kaggle (https://www.kaggle.com/datasets/mczielinski/bitcoin-historical-data) and GitHub (https://github.com/ff137/bitstamp-btcusd-minute-data), auto-updated daily. This is the key to pre-2017 history: the **2013 bull run and the Mt Gox collapse era**. Check the license badge on the Kaggle page before shipping (it has historically been CC BY-SA 4.0; ShareAlike applies to the *dataset*, not your game code, but verify — worst case, pull the same candles from Bitstamp's own public API).
- **CryptoDataDownload** (https://www.cryptodatadownload.com/terms-of-use/) — **RULED OUT**: CC BY-NC-SA 4.0, explicitly non-commercial, explicitly prohibits redistributing raw datasets.
- **CoinGecko** (https://www.coingecko.com/en/api_terms) — **RULED OUT for embedding**: TOS prohibits redistribution/syndication without an Enterprise custom license; standard commercial use requires live attribution, not bundled files.

**Verdict on data:** Ship Bitstamp for BTC 2012–2017, Binance dumps for everything 2017+. Since the game ticks 1 day = 1 second, you only need **daily** candles: tiny files, full real OHLC, same pipeline as stocks.

### Mechanics: the most distinct mode

- **24/7 market**: no weekends, no closes. The stock mode's rhythm of gaps disappears; the game never pauses for the calendar. Volatility is 5–10x stocks, so the existing risk meter needs recalibration, not redesign.
- **Replace the SEC with exchange/custody risk**: crypto's historical villain isn't the regulator, it's the exchange. New meter: **"Exchange Exposure"** — cash and coins held on-exchange can be *lost entirely* in historical collapse events (Mt Gox Feb 2014, FTX Nov 2022) unless moved to a cold wallet. Cold wallet = safe but a withdrawal delay/fee before you can trade (liquidity vs. safety tradeoff). This is a genuinely new decision layer the stock mode has nothing like.
- **Absurd leverage** (up to 100x, historically accurate) with liquidation cascades; **staking/yield traps** (Anchor's 20% APY before LUNA/UST died in May 2022 is a perfect "too good to be true" event); **rug-pull small caps** where the satirical tone writes itself.
- **Foreknowledge plays**: buy BTC at ~$10 in 2012, top-tick November 2013 at $1,150, *withdraw from Mt Gox before February 2014*, re-enter the $200 bottom in 2015, exit December 2017 at $19.6k, ride ETH from $8 in Jan 2017, dodge COVID March 2020, top-tick $69k Nov 2021, short LUNA and FTT. The event density is unmatched.
- SEC returns only in late-era runs (2023+ enforcement wave) — a nice historical joke.

---

## 2. FOREX

### Data: EXCELLENT legally, adequate in drama

- **Federal Reserve H.10 release** (https://www.federalreserve.gov/releases/h10/hist/) — daily noon exchange rates for ~23 major currencies, **back to 1971, US government work = public domain**. Zero legal risk, zero cost, kilobytes in size.
- **ECB euro reference rates** (https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.xml) — daily rates for ~30 currencies vs EUR **since 1999**, single XML/CSV file, ECB permits reproduction with source acknowledgment. Cross-rates give you any pair.
- **HistData.com** (https://www.histdata.com/) — free **1-minute and tick data** for 60+ pairs plus gold/oil/indices, back to the early 2000s. No formal license; FAQ only says "use at your own will and risk." Widely redistributed (e.g. GPL-3.0 repo https://github.com/philipperemy/FX-1-Minute-Data). Informal but low-risk; useful for zoom-in event moments, not needed for the base daily mode.
- **Dukascopy** — **RULED OUT**: TOS is personal, non-commercial, explicitly prohibits building databases and redistribution (https://www.dukascopy.com/europe/english/legal-pages/terms-of-use/).
- **FRED**: fine as a *reference*, but its TOS restricts commercial redistribution of third-party series (https://fred.stlouisfed.org/legal/) — go to the underlying public-domain sources (H.10) instead.

### Mechanics: the leverage-and-macro mode

- Daily FX moves are ~0.5%, boring at 1x. The whole mode is **leverage** (50:1–500:1, historically real) and **margin stop-outs**: the first mode where a single bad day can zero you without any crime involved.
- **Carry trade as a core mechanic**: each day holding a position pays/charges the interest-rate differential (real central bank rates are also public domain — Fed, BoJ, SNB). AUD/JPY carry printing money 2004–2007, then the 2008 unwind vaporizing it, is a built-in narrative arc.
- **Macro event calendar**: rate decisions, interventions. Foreknowledge plays: short GBP into **Brexit night June 2016**, be short EUR/CHF before the **SNB depeg January 15, 2015** (daily data still shows a -17% day — instant 10x on a levered short, or instant liquidation on the wrong side), yen intervention 2022, EUR/USD parity 2022, GBP flash crash Oct 2016.
- Replace SEC with **broker margin desk + central bank intervention risk**; pairs replace tickers (only ~20 assets, so depth comes from leverage sizing, not breadth).

---

## 3. COMMODITIES

### Data: GOOD via a two-source strategy

- **EIA (US Energy Information Administration)** (https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm) — daily spot prices, **public domain** (US government), attribution requested only. WTI from **1986**, Brent from **1987**, plus natural gas (Henry Hub), gasoline, heating oil, propane. Critically, the Cushing WTI spot series **captures negative oil: -$36.98 on April 20, 2020**. Bulk CSV via https://github.com/datasets/oil-prices.
- **World Bank Pink Sheet** (https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/world-bank-commodities-price-data-the-pink-sheet) — ~70 commodities monthly since 1960, World Bank data is CC BY 4.0. **Monthly is too coarse** for a 1-tick-per-day game; don't interpolate (that would be faking data). Use only for background/context or long-cycle assets if ever needed.
- **Metals and agriculture daily**: LBMA gold/silver fixes are proprietary (the FRED gold series is Cboe/LBMA-licensed — avoid). The clean answer: **commodity ETFs through your existing stock-data pipeline** — GLD (gold, 2004+), SLV (silver, 2006+), USO (oil, 2006+), UNG (natgas, 2007+), DBA (agriculture, 2007+), CORN/WEAT (2010+). Same source and license posture as the 733 stocks you already ship. CME futures data directly is **ruled out** (CME charges for historical redistribution).
- Stooq (https://stooq.com/db/) has free daily futures downloads but publishes no clear license — treat as backup, not foundation.

### Mechanics: the futures mode

- **Contracts expire.** This is the defining difference: you don't own a thing, you own a promise dated March 2020. Approaching expiry forces a decision: close, or **roll** (pay the contango spread). Contango bleed punishes lazy longs — USO holders in 2020 learned this in real life.
- **Physical delivery as a comedy mechanic**: fail to close a long before expiry and the game "delivers" 1,000 barrels of crude to your apartment (fee + news item). Negative oil day makes this literal: April 20, 2020 is the mode's signature moment — with foreknowledge, you can be short WTI as it goes *below zero*.
- **Seasonality and supply shocks**: natgas winter spikes, harvest cycles, OPEC announcements, wheat limit-up on the February 2022 Ukraine invasion, oil $147→$32 across 2008, silver's 2011 blowoff, gold 2011/2020 tops.
- Replace SEC with **CFTC position limits**: get too big in one commodity and you're "cornering the market" (a nod to the Hunt brothers), triggering margin hikes — exactly what killed the 1980 silver corner.

---

## 4. DAY TRADING (INTRADAY)

### Data: THE HARD ONE, as suspected — partially solvable

- **Individual US stocks intraday: effectively unshippable.** Polygon prohibits redistribution and embedding without written consent (https://polygon.io/legal/market-data-terms-of-service). Alpha Vantage requires commercial licensing for redistribution (https://www.alphavantage.co/terms_of_service/). FirstRate Data (~$100–1,000s, 1-min back 15+ years) **prohibits redistributing raw data**; only derivative works like charts in reports are allowed (https://firstratedata.com/about/license). Databento's US Equities Mini is the *only* redistribution-friendly US equities feed (https://databento.com/blog/databento-us-equities-mini-now-available) but its **history begins March 28, 2023** — useless for a time-travel game that needs the Flash Crash and GME. Kaggle intraday datasets (e.g. https://www.kaggle.com/datasets/gratefuldata/intraday-stock-data-1-min-sp-500-200821) exist but are scrapes of licensed exchange data with dubious provenance — shipping them in a paid game inherits that risk.
- **The workable pivot: index futures/CFDs, FX, gold, and oil at 1-minute from HistData.com** — SPX500, NAS100, DAX, WTI, XAU/USD, majors, back to the 2000s, free, informal "at your own risk" terms, already redistributed publicly in GPL repos. Index CFD prices aren't NYSE/Nasdaq-licensed data.
- **File size**: a full year of 1-min bars is ~370k rows (~1–2 MB gzipped) per instrument. Shipping 20 years × 10 instruments = 200–400 MB — too much. **Ship a curated library of ~100–200 famous trading days** instead: trivially small, and curation *is* the game design.

### Mechanics: a different tempo entirely

- **One real historical trading day per "life."** 390 one-minute bars at 1 tick/sec = a tense 6.5-minute session; a roguelike run = one trading week (5 days), survive or blow up. This inverts the base game's pacing completely.
- **The player picks days like the base game picks years**: May 6, 2010 (Flash Crash — the market drops 9% and recovers in 36 minutes; with foreknowledge you catch the exact bottom), September 15, 2008 (Lehman), August 24, 2015, February 5, 2018 (Volmageddon), March 16, 2020 (limit-down open).
- **Pattern Day Trader rule as a mechanic**: under $25k equity, only 3 day trades per rolling week — a real, hated rule that becomes a resource-management constraint and an unlock ("PDT exemption: offshore broker").
- Replace SEC with **broker risk desk**: intraday margin, forced flattening at the close, halts/circuit breakers replaying at their real historical timestamps.
- **Honest tension flag**: "day trade GME in January 2021" is not legally shippable with free data. Options: (a) accept index/futures scope, (b) pay FirstRate AND negotiate a redistribution rider (they say no by default), or (c) interpolate daily OHLC into fake intraday paths — **(c) violates the game's sacred rule and I recommend refusing it**; the game's credibility is "this really happened, minute by minute."

---

## 5. OPTIONS

### Data: WORST of the five

- **DoltHub `post-no-preference/options`** (https://www.dolthub.com/repositories/post-no-preference/options) — free, ~2,100 underlyings, but only **2019–mid-2024**, ~6 GB raw, and **no formal license**; it's community-scraped OPRA-derived quote data. Shipping it in a paid game: legally gray (OPRA licensing regime) and physically too large.
- **OptionsDX** (https://www.optionsdx.com/) — free/cheap EOD chains with greeks back to ~2012, but redistribution terms are not published; assume no embedding without asking.
- OptionMetrics/CBOE DataShop/DeltaNeutral: institutional pricing, redistribution negotiated and expensive.
- **Conclusion: real historical option chains cannot be shipped in this game at indie scale.**

### The redesign (flagged honestly)

Option **premiums are derived instruments**: price them at runtime with **Black-Scholes/binomial off the REAL underlying daily closes you already ship**, using historically-realized volatility. The underlying path — the thing the time-traveler actually knows — remains 100% real; the premium is *computed*, the same way brokers and market makers compute fair value. This bends the sacred rule but does not fake market history; frame it in-game as "your broker quotes you fair value." What it loses: real IV spikes (you can approximate by keying vol to realized vol windows) and real bid-ask blowouts. What it enables: **any strike, any expiry, all 24 years, zero data shipped.**

### Mechanics
- **Theta decay you can watch**: at 1 day/sec, a 30-day option visibly bleeds every second you hesitate. Expiry dates create built-in deadlines; **0DTE** unlocks as the endgame degenerate tier.
- **Convexity is the fantasy amplifier**: foreknowledge + options = the maximum expression of this game. Puts before Lehman/COVID (VIX 82), calls before earnings you "remember," the **GME January 2021 gamma squeeze** (model-priced calls on the real GME path still 100x), Volmageddon short-vol wipeout as a trap event.
- SEC angle is natural: massive OTM call buys right before events are *exactly* what real SEC insider-trading surveillance flags — mechanically, options profits should generate outsized SEC attention.

---

## RANKED VERDICT (data feasibility × distinctiveness × audience appeal)

| Rank | Mode | Data | Distinctiveness | Appeal | Call |
|---|---|---|---|---|---|
| 1 | **Crypto** | A (Bitstamp 2012+, Binance 2017+, tiny files) | A (24/7, custody risk, collapses) | A (perfect tonal fit) | **Build first** |
| 2 | **Forex** | A+ (public domain central banks) | B+ (leverage, carry, macro) | B- | Build second — cheapest legal win |
| 3 | **Commodities** | B+ (EIA public domain + ETF proxies) | A- (expiry, contango, negative oil) | B | Build third |
| 4 | **Day trading** | C (indices-only via HistData; stocks unshippable) | A (tempo inversion) | A- | Build fourth, **scoped to famous days on indices/futures** |
| 5 | **Options** | D (chains unlicensable/huge) | A | A (WSB energy) | Build last, **redesigned around model-priced premiums on real underlyings** |

**Recommended order: Crypto → Forex → Commodities → Day Trading → Options.** Crypto is the only mode that is simultaneously easy, legal, distinct, and on-brand. Forex and Commodities ride on public-domain government data and share the existing daily-tick engine. Day Trading needs a scope compromise (indices, curated days) that should be decided before any engine work. Options needs a design decision (accept computed premiums or shelve it) that only Dominic can make, since it's the one mode that touches the "never fake data" rule — the researcher's recommendation is that pricing a derivative off real data is not faking data, but it should be a conscious, documented exception.

Key sources: [Binance public data](https://github.com/binance/binance-public-data) · [Bitstamp 1-min Kaggle](https://www.kaggle.com/datasets/mczielinski/bitcoin-historical-data) · [CryptoDataDownload terms](https://www.cryptodatadownload.com/terms-of-use/) · [CoinGecko API terms](https://www.coingecko.com/en/api_terms) · [Fed H.10](https://www.federalreserve.gov/releases/h10/hist/) · [ECB reference rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) · [HistData](https://www.histdata.com/) · [Dukascopy terms](https://www.dukascopy.com/europe/english/legal-pages/terms-of-use/) · [EIA spot prices](https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm) · [World Bank Pink Sheet](https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/world-bank-commodities-price-data-the-pink-sheet) · [Polygon market data TOS](https://polygon.io/legal/market-data-terms-of-service) · [FirstRate license](https://firstratedata.com/about/license) · [Databento US Equities Mini](https://databento.com/blog/databento-us-equities-mini-now-available) · [Databento licensing primer](https://databento.com/blog/introduction-market-data-licensing) · [Alpha Vantage TOS](https://www.alphavantage.co/terms_of_service/) · [DoltHub options DB](https://www.dolthub.com/repositories/post-no-preference/options) · [OptionsDX](https://www.optionsdx.com/) · [FRED legal](https://fred.stlouisfed.org/legal/)

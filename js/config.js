// ============================================================================
// PAST TRADING - Game Configuration
// ============================================================================

const CONFIG = {
  // --- Time ---
  TICK_MS: 1000,            // 1 second per game day
  DEFAULT_RUN_DAYS: 365,    // 1 year per run
  SPEED_OPTIONS: [0.5, 1, 2, 5, 10, 20, 50],
  GAME_START_DATE: new Date('2000-01-01'),  // Fixed start date

  // Intraday mode (day trading)
  INTRADAY_TICK_MS: 1538,           // Day trading: 1.538 seconds per minute
  INTRADAY_TOTAL_TICKS: 390,        // 9:30 AM - 4:00 PM = 390 minutes
  MARKET_OPEN_HOUR: 9,              // 9:30 AM
  MARKET_OPEN_MINUTE: 30,
  MARKET_CLOSE_HOUR: 16,            // 4:00 PM
  MARKET_CLOSE_MINUTE: 0,

  // --- Starting Values ---
  STARTING_CASH: 10000,
  STARTING_SEC_ATTENTION: 0,
  STARTING_RISK: 0,

  // --- Trading ---
  BASE_FEE_PERCENT: 0.1,     // 0.1% per trade
  BASE_COOLDOWN_MS: 2000,    // 2 second cooldown between trades
  MAX_POSITIONS: 999,        // effectively unlimited positions

  // --- SEC ---
  SEC_DECAY_PER_DAY: 0.15,   // passive SEC attention decay per day
  SEC_THRESHOLDS: {
    SAFE: 30,
    INQUIRY: 60,
    INVESTIGATION: 80,
    GRAND_JURY: 95,
    ARRESTED: 100
  },
  SEC_LABELS: {
    0:  'Off the radar',
    30: 'Routine monitoring',
    60: 'Under inquiry',
    80: 'Formal investigation',
    95: 'Grand jury convened'
  },
  INSIDER_TRADE_SEC_HIT: 12,
  FRONT_RUN_SEC_HIT: 15,
  SUSPICIOUS_RETURN_THRESHOLD: 0.15, // 15% daily return triggers suspicion
  SUSPICIOUS_RETURN_SEC_HIT: 3,

  // --- Political Donations ---
  DONATION_BASE_COST: 5000,
  DONATION_SEC_REDUCTION: 8,
  DONATION_COST_MULTIPLIER: 1.8,  // each donation costs 1.8x more

  // --- Risk ---
  RISK_PER_POSITION_PERCENT: 10,  // each position adds to risk
  LEVERAGE_RISK_MULTIPLIER: 1.5,  // risk scales with leverage
  RISK_LIMIT_PERCENT: 100,        // Fired at 100%
  RISK_WARNING_PERCENT: 75,       // Yellow warning
  RISK_DANGER_PERCENT: 90,        // Red warning

  // --- Market ---
  BASE_VOLATILITY: 0.02,          // 2% daily volatility
  EVENT_CHANCE_PER_DAY: 0.08,     // 8% chance of market event per day
  CRASH_CHANCE_PER_DAY: 0.005,    // 0.5% chance of crash event
  BULL_DRIFT: 0.0003,             // slight upward bias

  // --- Prestige (Skill-Based) ---
  BASE_PRESTIGE_PER_RUN: 10,              // Base PP for completing a run
  SHARPE_DIVISOR: 2.0,                    // Sharpe 2.0 = 1x multiplier
  WIN_RATE_BASELINE: 0.3,                 // Below 30% = 0x multiplier
  WIN_RATE_SCALE: 3,                      // Each 10% above baseline = 0.3x
  DRAWDOWN_BONUS_THRESHOLD: 0.2,          // <20% max drawdown = bonus
  DRAWDOWN_BONUS_MULTIPLIER: 1.5,         // 1.5x multiplier for low drawdown

  // --- Leaderboard ---
  MAX_LEADERBOARD_ENTRIES: 20,

  // --- Quarterly Targets ---
  QUARTER_DAYS: 91,
  FIXED_RUN_YEARS: 2,
  TOTAL_QUARTERS: 8,
  QUARTERLY_TARGETS: [
    { level: 1, label: 'Q1 Y1', target: 15000, pp: 2 },         // $15K net worth (50% growth)
    { level: 2, label: 'Q2 Y1', target: 50000, pp: 3 },         // $50K
    { level: 3, label: 'Q3 Y1', target: 250000, pp: 4 },        // $250K
    { level: 4, label: 'Q4 Y1', target: 1000000, pp: 5 },       // $1M
    { level: 5, label: 'Q1 Y2', target: 10000000, pp: 7 },      // $10M
    { level: 6, label: 'Q2 Y2', target: 100000000, pp: 9 },     // $100M
    { level: 7, label: 'Q3 Y2', target: 500000000, pp: 12 },    // $500M
    { level: 8, label: 'Q4 Y2', target: 1000000000, pp: 16 },   // $1B
  ],
  ALL_QUARTERS_BONUS_PP: 10,
};

// ============================================================================
// STOCK CATEGORIES
// ============================================================================

const STOCK_CATEGORIES = {
  utilities: {
    name: 'Utilities',
    description: 'Boring but stable. Electric, water, gas companies.',
    icon: '⚡',
    unlocked: true,  // Default unlocked
    sortOrder: 1
  },
  consumer: {
    name: 'Consumer Staples',
    description: 'Food, household goods. Everyone needs toilet paper.',
    icon: '🛒',
    unlocked: true,  // Default unlocked
    sortOrder: 2
  },
  finance: {
    name: 'Finance',
    description: 'Banks and financial services.',
    icon: '🏦',
    unlocked: false,
    sortOrder: 3
  },
  healthcare: {
    name: 'Healthcare',
    description: 'Pharma and medical devices.',
    icon: '💊',
    unlocked: false,
    sortOrder: 4
  },
  industrials: {
    name: 'Industrials',
    description: 'Manufacturing and heavy industry.',
    icon: '🏭',
    unlocked: false,
    sortOrder: 5
  },
  energy: {
    name: 'Energy',
    description: 'Oil, gas, renewables.',
    icon: '🛢️',
    unlocked: false,
    sortOrder: 6
  },
  tech: {
    name: 'Technology',
    description: 'Growth stocks. High risk, high reward.',
    icon: '💻',
    unlocked: false,
    sortOrder: 7
  },
  meme: {
    name: 'Meme Stocks',
    description: 'WSB favorites. 🚀',
    icon: '🚀',
    unlocked: false,
    sortOrder: 8
  }
};

// ============================================================================
// TRADING MODES
// ============================================================================

const TRADING_MODES = {
  stocks: {
    name: 'Stocks',
    description: 'Trade stocks across multiple sectors. Unlock more categories as you progress.',
    unlockRun: 0,
    unlockCost: 0,      // Free starter mode
    volatilityMod: 1.0,
    feeMod: 1.0,
    secHeatMod: 1.0,
    assets: SP500_ASSETS  // Defined in sp500_tickers.js
  },
  dayTrading: {
    name: 'Day Trading',
    description: 'Fast trades, pattern rules apply. Male astrology.',
    comingSoon: true,
    unlockRun: 0,
    unlockCost: 5,      // 5 PP to unlock
    volatilityMod: 1.3,
    feeMod: 0.8,
    secHeatMod: 0.8,
    assets: [
      { ticker: 'SPY', name: 'S&P 500 ETF', basePrice: 440 },
      { ticker: 'QQQ', name: 'Nasdaq ETF', basePrice: 370 },
      { ticker: 'IWM', name: 'Small Cap ETF', basePrice: 220 },
      { ticker: 'DIA', name: 'Dow ETF', basePrice: 350 },
    ]
  },
  options: {
    name: 'Options',
    description: 'Calls, puts, and the greeks. Leveraged chaos.',
    comingSoon: true,
    unlockRun: 2,
    unlockCost: 15,     // 15 PP to unlock
    volatilityMod: 2.0,
    feeMod: 1.5,
    secHeatMod: 1.0,
    assets: [
      { ticker: 'AAPL-C', name: 'Appulse Call', basePrice: 8, isOption: true, optionType: 'call', strike: 155, expiry: 30 },
      { ticker: 'AAPL-P', name: 'Appulse Put', basePrice: 5, isOption: true, optionType: 'put', strike: 145, expiry: 30 },
      { ticker: 'TSLA-C', name: 'Tessler Call', basePrice: 15, isOption: true, optionType: 'call', strike: 260, expiry: 30 },
      { ticker: 'TSLA-P', name: 'Tessler Put', basePrice: 12, isOption: true, optionType: 'put', strike: 240, expiry: 30 },
      { ticker: 'SPY-C', name: 'SPY Call', basePrice: 6, isOption: true, optionType: 'call', strike: 445, expiry: 30 },
      { ticker: 'SPY-P', name: 'SPY Put', basePrice: 4, isOption: true, optionType: 'put', strike: 435, expiry: 30 },
    ]
  },
  forex: {
    name: 'Forex',
    description: 'Currency pairs. The market that never sleeps.',
    comingSoon: true,
    unlockRun: 3,
    unlockCost: 20,     // 20 PP to unlock
    volatilityMod: 0.6,
    feeMod: 0.3,
    secHeatMod: 0.5,
    assets: [
      { ticker: 'EUR/USD', name: 'Euro / Dollar', basePrice: 1.0850 },
      { ticker: 'GBP/USD', name: 'Pound / Dollar', basePrice: 1.2650 },
      { ticker: 'USD/JPY', name: 'Dollar / Yen', basePrice: 149.50 },
      { ticker: 'USD/CHF', name: 'Dollar / Franc', basePrice: 0.8750 },
      { ticker: 'AUD/USD', name: 'Aussie / Dollar', basePrice: 0.6550 },
    ]
  },
  commodities: {
    name: 'Commodities',
    description: 'Oil, gold, wheat. Geopolitics is your friend.',
    comingSoon: true,
    unlockRun: 4,
    unlockCost: 25,     // 25 PP to unlock
    volatilityMod: 1.2,
    feeMod: 1.2,
    secHeatMod: 0.7,
    assets: [
      { ticker: 'GOLD', name: 'Gold', basePrice: 1950 },
      { ticker: 'OIL', name: 'Crude Oil', basePrice: 78 },
      { ticker: 'SLVR', name: 'Silver', basePrice: 24 },
      { ticker: 'WHEAT', name: 'Wheat', basePrice: 6.50 },
      { ticker: 'NAT.G', name: 'Natural Gas', basePrice: 2.80 },
    ]
  },
  crypto: {
    name: 'Crypto',
    description: 'Wild west. No regulation, max degen.',
    comingSoon: true,
    unlockRun: 5,
    unlockCost: 30,     // 30 PP to unlock
    volatilityMod: 3.0,
    feeMod: 0.5,
    secHeatMod: 0.3,
    assets: [
      { ticker: 'BTC', name: 'Bitcoin', basePrice: 42000 },
      { ticker: 'ETH', name: 'Ethereum', basePrice: 2200 },
      { ticker: 'DOGE', name: 'Dogebiscuit', basePrice: 0.08 },
      { ticker: 'SOL', name: 'Solarium', basePrice: 95 },
      { ticker: 'PEPE', name: 'PepeCoin', basePrice: 0.000001 },
      { ticker: 'MOON', name: 'MoonRug Token', basePrice: 0.50 },
    ]
  }
};

// ============================================================================
// META UNLOCKS
// ============================================================================

const UNLOCKS = {
  // Early game unlocks (0.5-2 PP) - accessible after first 1-2 runs
  leverage2x:    { name: 'Leverage 2x', cost: 0.5, description: 'Double your position sizes', category: 'trading', leverageLevel: 2 },
  reducedFees1:  { name: 'Reduced Fees I', cost: 1, description: 'Fees reduced by 25%', category: 'trading', feeReduction: 0.25 },

  // Basic unlocks (2-5 PP) - mid-early game
  financeStocks: {
    name: 'Finance Sector',
    cost: 2,
    description: 'Unlock banks and financial services stocks',
    category: 'sectors',
    unlocksCategory: 'finance'
  },
  healthcareStocks: {
    name: 'Healthcare Sector',
    cost: 3,
    description: 'Unlock pharmaceutical and medical stocks',
    category: 'sectors',
    unlocksCategory: 'healthcare'
  },
  leverage5x:    { name: 'Leverage 5x', cost: 3, description: '5x position sizes', category: 'trading', leverageLevel: 5, requires: 'leverage2x' },
  betterRep1:    { name: 'Analyst', cost: 4, description: 'Start as an analyst. Slightly better info.', category: 'career', repLevel: 1 },
  morePositions: { name: 'Portfolio Expansion', cost: 4, description: 'Hold up to 10 positions', category: 'trading', maxPositions: 10 },
  industrialsStocks: {
    name: 'Industrials Sector',
    cost: 5,
    description: 'Unlock manufacturing and industrial stocks',
    category: 'sectors',
    unlocksCategory: 'industrials'
  },

  // Mid-game unlocks (6-12 PP)
  energyStocks: {
    name: 'Energy Sector',
    cost: 6,
    description: 'Unlock oil, gas, and energy stocks',
    category: 'sectors',
    unlocksCategory: 'energy'
  },
  politicalDonations: { name: 'PAC Access', cost: 6, description: 'Donate to reduce SEC heat', category: 'illegal' },
  startingCash2x:{ name: 'Trust Fund Kid', cost: 6, description: 'Start with $20,000', category: 'starting', cashMultiplier: 2 },
  reducedFees2:  { name: 'Reduced Fees II', cost: 8, description: 'Fees reduced by 50%', category: 'trading', feeReduction: 0.50, requires: 'reducedFees1' },
  insiderNetwork:{ name: 'Insider Network', cost: 8, description: 'Access to insider tips (risky)', category: 'illegal' },
  techStocks: {
    name: 'Tech Sector',
    cost: 8,
    description: 'Unlock high-growth technology stocks',
    category: 'sectors',
    unlocksCategory: 'tech'
  },
  lowerSurv1:    { name: 'Low Profile I', cost: 10, description: 'SEC attention grows 20% slower', category: 'stealth', survReduction: 0.20 },
  betterRep2:    { name: 'Trader', cost: 10, description: 'Start as a trader. Access to better tools.', category: 'career', repLevel: 2, requires: 'betterRep1' },
  algoEngine:    { name: 'Algo Engine', cost: 12, description: 'Unlock algo trading mode', category: 'trading' },

  // Late game unlocks (15-25 PP)
  leverage10x:   { name: 'Leverage 10x', cost: 15, description: '10x position sizes', category: 'trading', leverageLevel: 10, requires: 'leverage5x' },
  hedgeFund:     { name: 'Hedge Fund Access', cost: 15, description: 'Trade with firm capital. Higher stakes.', category: 'career', repLevel: 3, requires: 'betterRep2' },
  reducedFees3:  { name: 'Reduced Fees III', cost: 18, description: 'Fees reduced by 75%', category: 'trading', feeReduction: 0.75, requires: 'reducedFees2' },
  memeStocks: {
    name: 'Meme Stocks',
    cost: 20,
    description: 'Unlock WSB favorites. YOLO.',
    category: 'sectors',
    unlocksCategory: 'meme',
    requires: 'techStocks'  // Requires tech first
  },
  lowerSurv2:    { name: 'Low Profile II', cost: 20, description: 'SEC attention grows 40% slower', category: 'stealth', survReduction: 0.40, requires: 'lowerSurv1' },
  fundManager:   { name: 'Fund Manager', cost: 25, description: 'Manage OPM. AUM bonuses.', category: 'career', repLevel: 4, requires: 'hedgeFund' },
  startingCash5x:{ name: 'Rich Parents', cost: 25, description: 'Start with $50,000', category: 'starting', cashMultiplier: 5, requires: 'startingCash2x' },

  // Endgame unlocks (40+ PP)
  leverage50x:   { name: 'Leverage 50x', cost: 40, description: 'Degenerate leverage', category: 'trading', leverageLevel: 50, requires: 'leverage10x' },

  // --- Risk Management ---
  riskManager1:  { name: 'Risk Manager I', cost: 3, description: 'Internal risk reduced by 20%', category: 'risk', riskReduction: 0.20 },
  riskManager2:  { name: 'Risk Manager II', cost: 8, description: 'Internal risk reduced by 40%', category: 'risk', riskReduction: 0.40, requires: 'riskManager1' },
  riskManager3:  { name: 'Risk Manager III', cost: 15, description: 'Internal risk reduced by 60%', category: 'risk', riskReduction: 0.60, requires: 'riskManager2' },
  riskImmunity:  { name: 'Risk Immunity', cost: 30, description: 'Risk cap raised to 150%. Live dangerously.', category: 'risk', riskLimitOverride: 150, requires: 'riskManager3' },

  // --- Starting Capital Extensions ---
  silverSpoon:   { name: 'Silver Spoon', cost: 35, description: 'Start with $100,000', category: 'starting', cashMultiplier: 10, requires: 'startingCash5x' },
  oligarchHeir:  { name: "Oligarch's Heir", cost: 50, description: 'Start with $250,000', category: 'starting', cashMultiplier: 25, requires: 'silverSpoon' },

  // --- Market Intel ---
  bloombergTerminal: { name: 'Bloomberg Terminal', cost: 5, description: 'See 5-day price trend arrows on assets', category: 'intel' },
  analystReports:    { name: 'Analyst Reports', cost: 12, description: 'See sector momentum indicators', category: 'intel', requires: 'bloombergTerminal' },
  timeTravelersAlmanac: { name: "Time Traveler's Almanac", cost: 25, description: 'Preview market events 3 days early', category: 'intel', requires: 'analystReports' },

  // --- Stealth Extension ---
  ghostMode:     { name: 'Ghost Mode', cost: 35, description: 'SEC attention grows 60% slower', category: 'stealth', survReduction: 0.60, requires: 'lowerSurv2' },

  // --- Time Extension ---
  timeInMarket1: { name: 'Time in the Market I', cost: 8, description: '1 year head start — 1 year and 1 quarter to hit your first target', category: 'time', extraYears: 1 },
  timeInMarket2: { name: 'Time in the Market II', cost: 18, description: '2 year head start — 2 years and 1 quarter to hit your first target', category: 'time', extraYears: 2, requires: 'timeInMarket1' },
  timeInMarket3: { name: 'Time in the Market III', cost: 35, description: '3 year head start — 3 years and 1 quarter to hit your first target', category: 'time', extraYears: 3, requires: 'timeInMarket2' },

  // --- Passive Income ---
  dividendPortfolio: { name: 'Dividend Portfolio', cost: 10, description: 'Earn 0.1% of net worth per day passively', category: 'passive', passivePercent: 0.001 },
  hedgeFundFee:      { name: 'Hedge Fund Fee', cost: 20, description: 'Earn 0.2% of net worth per day passively', category: 'passive', passivePercent: 0.002, requires: 'dividendPortfolio' },

  // --- Naughty Activities Extensions ---
  burnerPhone:     { name: 'Burner Phone', cost: 8, description: 'Illegal actions generate 30% less SEC heat', category: 'illegal', illegalSecReduction: 0.30, requires: 'insiderNetwork' },
  caymanShellCorp: { name: 'Cayman Shell Corp', cost: 25, description: 'Double profits from illegal actions', category: 'illegal', illegalProfitMultiplier: 2.0, requires: 'burnerPhone' },

  // --- Connections ---
  darkPoolAccess:    { name: 'Dark Pool Access', cost: 10, description: 'Large trades generate 50% less SEC attention', category: 'connections', largeTradeSECReduction: 0.50 },
  offshoreAccounts:  { name: 'Offshore Accounts', cost: 15, description: 'Hide 25% of net worth from SEC suspicion', category: 'connections', netWorthHidePercent: 0.25, requires: 'darkPoolAccess' },
  politicianRetainer:{ name: 'Politician on Retainer', cost: 12, description: 'Political donations reduce 2x more SEC heat', category: 'connections', donationEffectiveness: 2.0, requires: 'offshoreAccounts' },
  lobbyistNetwork:   { name: 'Lobbyist Network', cost: 18, description: 'SEC attention decay rate doubled', category: 'connections', decayMultiplier: 2.0, requires: 'politicianRetainer' },

  // --- Survival ---
  goldenParachute: { name: 'Golden Parachute', cost: 20, description: 'Earn 50% bonus points when fired for missing targets', category: 'survival' },
  fallGuy:         { name: 'Fall Guy', cost: 30, description: 'Once per run: blame someone else (-40 SEC attention)', category: 'survival', secReduction: 40, requires: 'goldenParachute' },
  bailFund:        { name: 'Bail Fund', cost: 40, description: 'Survive one arrest per run (SEC resets to 60)', category: 'survival', requires: 'fallGuy' },
};

// ============================================================================
// EQUIPABLE TOOLS
// ============================================================================

const EQUIPABLE_TOOLS = {
  scalping: {
    name: 'Scalping Bot',
    description: 'Passive micro-profits while you trade. Stacks with active trading.',
    cost: 10,
    passiveIncomePerDay: 50,
    requires: 'algoEngine'
  },
  arbitrage: {
    name: 'Arbitrage Scanner',
    description: 'Automatically exploit price differences. Stacks with active trading.',
    cost: 15,
    passiveIncomePerDay: 200,
    requires: 'algoEngine'
  },
  marketMaking: {
    name: 'Market Making Bot',
    description: 'Earn the spread passively. Stacks with active trading.',
    cost: 20,
    passiveIncomePerDay: 500,
    requires: 'algoEngine'
  },
  algoTrading: {
    name: 'Algo Trading Suite',
    description: 'Automated strategy execution. Stacks with active trading.',
    cost: 25,
    passiveIncomePerDay: 1000,
    requires: 'algoEngine'
  }
};

// ============================================================================
// ACHIEVEMENTS & TITLES
// ============================================================================

const ACHIEVEMENTS = {
  maleAstrology: {
    name: 'Male Astrology',
    description: 'Day trade 100+ times in one run',
    check: (stats) => stats.dayTrades >= 100,
    title: true,
    titleBonus: { cooldownReduction: 0.3 },
    titleDescription: '30% faster trade cooldown'
  },
  diamondHands: {
    name: 'Diamond Hands',
    description: 'Hold a losing position for 30+ days, then profit',
    check: (stats) => stats.longestLosingHoldThenProfit >= 30,
    title: true,
    titleBonus: { holdReturnBonus: 0.10 },
    titleDescription: '+10% returns on held positions'
  },
  paperHands: {
    name: 'Paper Hands',
    description: 'Sell within 1 day 50 times',
    check: (stats) => stats.quickSells >= 50,
    title: true,
    titleBonus: { sellSpeedBonus: 0.5 },
    titleDescription: '50% faster sell execution'
  },
  theOracle: {
    name: 'The Oracle',
    description: '10 correct directional trades in a row',
    check: (stats) => stats.maxWinStreak >= 10,
    title: true,
    titleBonus: { priceInfoBonus: true },
    titleDescription: 'See price trend indicators'
  },
  teflonDon: {
    name: 'Teflon Don',
    description: 'Reach 90+ SEC attention and survive the run',
    check: (stats) => stats.maxSecAttention >= 90 && stats.survived,
    title: true,
    titleBonus: { secGrowthReduction: 0.25 },
    titleDescription: '25% slower SEC attention growth'
  },
  wolfOfWallSt: {
    name: 'Wolf of Wall St',
    description: 'Make $10M+ in a single run',
    check: (stats) => stats.maxNetWorth >= 10000000,
    title: true,
    titleBonus: { startingCashBonus: 5000 },
    titleDescription: 'Start with extra $5,000'
  },
  marginCallSurvivor: {
    name: 'Margin Call Survivor',
    description: 'Get margin called and recover to profit',
    check: (stats) => stats.marginCallsRecovered >= 1,
    title: true,
    titleBonus: { marginLimitBonus: 0.20 },
    titleDescription: '+20% margin before call'
  },
  hodlKing: {
    name: 'HODL King',
    description: 'Hold crypto through a 50%+ crash and still profit',
    check: (stats) => stats.cryptoCrashHold,
    title: true,
    titleBonus: { cryptoVolBonus: 0.15 },
    titleDescription: '15% reduced crypto volatility'
  },
  theLobbyist: {
    name: 'The Lobbyist',
    description: 'Spend $1M+ on political donations in one run',
    check: (stats) => stats.totalDonations >= 1000000,
    title: true,
    titleBonus: { donationDiscount: 0.30 },
    titleDescription: '30% cheaper political donations'
  },
  cleanHands: {
    name: 'Clean Hands',
    description: 'Complete a full run with 0 illegal actions',
    check: (stats) => stats.illegalActions === 0 && stats.survived,
    title: true,
    titleBonus: { prestigeBonus: 0.50 },
    titleDescription: '+50% points'
  },
  speedDemon: {
    name: 'Speed Demon',
    description: '500+ trades in one run',
    check: (stats) => stats.totalTrades >= 500,
    title: true,
    titleBonus: { turboMode: true },
    titleDescription: 'Unlock 20x speed option'
  },
  literallyCriminal: {
    name: 'Literally Criminal',
    description: 'Get arrested 5 times across all runs',
    check: (stats) => stats.totalArrests >= 5,
    title: true,
    titleBonus: { consultantRole: true },
    titleDescription: 'Unlock "Consultant" career path'
  },
  firstMillion: {
    name: 'Comma Club',
    description: 'Reach $1,000,000 net worth',
    check: (stats) => stats.maxNetWorth >= 1000000,
  },
  bankrupt: {
    name: 'GUH',
    description: 'Go completely bankrupt',
    check: (stats) => stats.wentBankrupt,
  },
  perfectTiming: {
    name: 'Bought the Dip',
    description: 'Buy at the lowest price of the run',
    check: (stats) => stats.boughtAtBottom,
  },
  soldTheTop: {
    name: 'Sold the Top',
    description: 'Sell at the highest price of the run',
    check: (stats) => stats.soldAtTop,
  }
};

// ============================================================================
// ILLEGAL ACTIONS
// ============================================================================

const ILLEGAL_ACTIONS = {
  insiderTrading: {
    name: 'Insider Trading',
    description: 'Trade on non-public information. Big edge, big risk.',
    secHit: CONFIG.INSIDER_TRADE_SEC_HIT,
    profitMultiplier: 1.5,
    requires: 'insiderNetwork'
  },
  frontRunning: {
    name: 'Front Running',
    description: 'Trade ahead of large orders you know about.',
    secHit: CONFIG.FRONT_RUN_SEC_HIT,
    profitMultiplier: 1.3,
    requires: 'hedgeFund'
  },
};

// ============================================================================
// NEWS / EVENTS
// ============================================================================

const MARKET_EVENTS = [
  { text: 'Fed raises rates unexpectedly', effect: -0.05, type: 'macro' },
  { text: 'Fed cuts rates in emergency session', effect: 0.06, type: 'macro' },
  { text: 'Inflation comes in hotter than expected', effect: -0.03, type: 'macro' },
  { text: 'Jobs report smashes expectations', effect: 0.03, type: 'macro' },
  { text: 'Major bank reports record earnings', effect: 0.02, type: 'sector' },
  { text: 'Tech giant misses earnings by a mile', effect: -0.04, type: 'sector' },
  { text: 'Oil supply disruption in Middle East', effect: 0.04, type: 'commodity' },
  { text: 'New trade war tariffs announced', effect: -0.04, type: 'macro' },
  { text: 'Crypto exchange hacked, millions stolen', effect: -0.08, type: 'crypto' },
  { text: 'Elon tweets about Dogebiscuit', effect: 0.15, type: 'crypto' },
  { text: 'Congress considers banning crypto', effect: -0.10, type: 'crypto' },
  { text: 'Short squeeze on meme stock', effect: 0.20, type: 'sector' },
  { text: 'Pandemic variant discovered', effect: -0.06, type: 'macro' },
  { text: 'Vaccine breakthrough announced', effect: 0.05, type: 'macro' },
  { text: 'Housing market shows signs of bubble', effect: -0.02, type: 'macro' },
  { text: 'AI company IPO breaks records', effect: 0.04, type: 'sector' },
  { text: 'Major data breach at retail giant', effect: -0.03, type: 'sector' },
  { text: 'Gold hits all-time high on uncertainty', effect: 0.03, type: 'commodity' },
  { text: 'MoonRug Token team disappears with funds', effect: -0.50, type: 'crypto' },
  { text: 'CEO arrested for fraud', effect: -0.08, type: 'sector' },
];

const SATIRICAL_NEWS = [
  'SEC commissioner distracted by Congressional hearing on TikTok',
  'Senator thanks "generous constituent" for donation to re-election campaign',
  'Former regulator joins hedge fund as "Senior Advisor"',
  'Wall Street lobbyist argues regulations are "anti-freedom"',
  'SEC budget cut by 30% after industry lobbying',
  'Congressman who oversees banking committee buys bank stocks',
  'Federal Reserve member\'s spouse made "coincidental" trades before announcement',
  'New SEC chair vows to crack down, immediately caves to pressure',
  'Whistleblower fired, rehired as consultant at 3x salary',
  'Analyst upgrades stock to "Strong Buy" after yacht trip with CEO',
  '"Too big to fail" bank pays fine equal to 0.1% of profits',
  'Hedge fund manager calls retail traders "unsophisticated"',
  'Crypto bro explains why this time is different (it wasn\'t)',
  'Market maker accidentally reveals they can see your orders',
  'Financial advisor recommends stocks he\'s secretly shorting',
  'Bank creates synthetic CDO of synthetic CDOs',
  'Rating agency gives AAA to pile of garbage wrapped in a bond',
  'CEO gets $50M golden parachute after destroying company',
  'Insider trading tip shared on golf course, nobody investigates',
  'Quant fund\'s algorithm becomes sentient, starts a podcast',
  'Day trader discovers "one weird trick" (it\'s gambling)',
  'Congress passes law making stock trading by members slightly less obviously corrupt',
  'Federal judge who owns oil stocks rules in favor of oil company',
  'Billionaire complains that taxes are too high from his tax-free yacht',
  'Prison for white collar crime described as "basically a resort"',
];

// ============================================================================
// HISTORICAL SCENARIOS (future expansion)
// ============================================================================

const SCENARIOS = {
  default: {
    name: 'Modern Market',
    year: 2024,
    description: 'Trade in the current market. You know what\'s coming.',
    durationDays: 365
  }
};

// ============================================================================
// HELPER: Format currency
// ============================================================================

function formatMoney(amount) {
  if (Math.abs(amount) >= 1e9) return '$' + (amount / 1e9).toFixed(2) + 'B';
  if (Math.abs(amount) >= 1e6) return '$' + (amount / 1e6).toFixed(2) + 'M';
  if (Math.abs(amount) >= 1e3) return '$' + (amount / 1e3).toFixed(1) + 'K';
  return '$' + amount.toFixed(2);
}

function formatPercent(value) {
  return (value * 100).toFixed(1) + '%';
}

function formatPrice(price) {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
}

// Bug Fix #33: Format days with Infinity handling
function formatDays(days) {
  if (!isFinite(days) || days === Infinity) {
    return 'Not achieved';
  }
  return days + ' days';
}

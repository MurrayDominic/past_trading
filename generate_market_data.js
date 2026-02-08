// Script to generate all market data JSON files
const fs = require('fs');
const path = require('path');

function generateOHLC(ticker, name, basePrice, volatility, trend, days = 365) {
  const data = {
    ticker,
    name,
    period: {
      start: '2020-01-01',
      end: '2020-12-31',
      days
    },
    ohlc: [],
    events: []
  };

  let currentPrice = basePrice;

  for (let day = 0; day < days; day++) {
    const date = new Date(2020, 0, 1 + day);
    const dateStr = date.toISOString().split('T')[0];

    // Random walk with trend and mean reversion
    const deviation = (currentPrice - basePrice) / basePrice;
    const meanReversion = -deviation * 0.05;
    const randomChange = (Math.random() - 0.5) * volatility;
    const change = randomChange + trend + meanReversion;

    const open = currentPrice;
    const close = open * (1 + change);

    // Generate realistic wicks
    const wickSize = Math.random() * volatility * 0.6;
    const high = Math.max(open, close) * (1 + wickSize);
    const low = Math.min(open, close) * (1 - wickSize);

    data.ohlc.push({
      day,
      date: dateStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor((basePrice * 100000) + Math.random() * (basePrice * 200000))
    });

    currentPrice = close;
  }

  return data;
}

// Stocks
const stocks = [
  { ticker: 'AMZN', name: 'Amazon.com Inc.', basePrice: 1850, volatility: 0.025, trend: 0.002 },
  { ticker: 'GOOG', name: 'Alphabet Inc.', basePrice: 1350, volatility: 0.02, trend: 0.001 },
  { ticker: 'META', name: 'Meta Platforms Inc.', basePrice: 205, volatility: 0.03, trend: 0.0008 },
  { ticker: 'NFLX', name: 'Netflix Inc.', basePrice: 325, volatility: 0.035, trend: 0.002 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', basePrice: 60, volatility: 0.04, trend: 0.003 },
  { ticker: 'JPM', name: 'JPMorgan Chase', basePrice: 140, volatility: 0.025, trend: 0.0005 }
];

// ETFs
const etfs = [
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', basePrice: 320, volatility: 0.015, trend: 0.0008 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', basePrice: 210, volatility: 0.02, trend: 0.0012 },
  { ticker: 'IWM', name: 'iShares Russell 2000', basePrice: 165, volatility: 0.022, trend: 0.0006 },
  { ticker: 'DIA', name: 'SPDR Dow Jones Industrial', basePrice: 285, volatility: 0.015, trend: 0.0007 }
];

// Commodities
const commodities = [
  { ticker: 'GOLD', name: 'Gold Futures', basePrice: 1520, volatility: 0.018, trend: 0.001 },
  { ticker: 'OIL', name: 'Crude Oil Futures', basePrice: 61, volatility: 0.05, trend: -0.002 },
  { ticker: 'SLVR', name: 'Silver Futures', basePrice: 18, volatility: 0.025, trend: 0.0015 },
  { ticker: 'WHEAT', name: 'Wheat Futures', basePrice: 550, volatility: 0.03, trend: 0.0005 },
  { ticker: 'NAT.G', name: 'Natural Gas Futures', basePrice: 2.1, volatility: 0.04, trend: -0.001 }
];

// Crypto
const crypto = [
  { ticker: 'BTC', name: 'Bitcoin', basePrice: 7200, volatility: 0.06, trend: 0.004 },
  { ticker: 'ETH', name: 'Ethereum', basePrice: 130, volatility: 0.065, trend: 0.0045 },
  { ticker: 'DOGE', name: 'Dogecoin', basePrice: 0.002, volatility: 0.08, trend: 0.003 },
  { ticker: 'SOL', name: 'Solana', basePrice: 0.8, volatility: 0.075, trend: 0.005 }
];

// Generate all files
const categories = [
  { name: 'stocks', assets: stocks },
  { name: 'etfs', assets: etfs },
  { name: 'commodities', assets: commodities },
  { name: 'crypto', assets: crypto }
];

categories.forEach(({ name, assets }) => {
  const dir = path.join('assets', 'market_data', name);

  assets.forEach(asset => {
    const data = generateOHLC(asset.ticker, asset.name, asset.basePrice, asset.volatility, asset.trend);

    // Add some random events
    const numEvents = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numEvents; i++) {
      const day = Math.floor(Math.random() * 365);
      data.events.push({
        day,
        date: new Date(2020, 0, 1 + day).toISOString().split('T')[0],
        type: ['earnings', 'product', 'regulatory', 'macro'][Math.floor(Math.random() * 4)],
        impact: (Math.random() - 0.3) * 0.1,
        headline: `${asset.name} ${['announces', 'reports', 'releases'][Math.floor(Math.random() * 3)]} ${['strong', 'record', 'unexpected'][Math.floor(Math.random() * 3)]} results`
      });
    }
    data.events.sort((a, b) => a.day - b.day);

    const filePath = path.join(dir, `${asset.ticker}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Generated ${filePath}`);
  });
});

// Generate news events file
const newsEvents = {
  market_events: [
    {
      day: 59,
      date: '2020-02-29',
      type: 'macro',
      severity: 'high',
      headline: 'Fed signals potential rate cuts amid virus concerns',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM'],
      impact_range: [-0.02, 0.05]
    },
    {
      day: 67,
      date: '2020-03-08',
      type: 'macro',
      severity: 'critical',
      headline: 'Fed announces emergency rate cut to near zero',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM', 'GOLD'],
      impact_range: [-0.08, 0.02]
    },
    {
      day: 74,
      date: '2020-03-15',
      type: 'macro',
      severity: 'critical',
      headline: 'Markets plunge on pandemic fears, circuit breakers triggered',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM', 'AAPL', 'TSLA', 'AMZN'],
      impact_range: [-0.12, -0.05]
    },
    {
      day: 91,
      date: '2020-04-01',
      type: 'macro',
      severity: 'high',
      headline: 'Congress passes $2 trillion stimulus package',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM'],
      impact_range: [0.03, 0.08]
    },
    {
      day: 150,
      date: '2020-05-30',
      type: 'tech',
      severity: 'medium',
      headline: 'Tech stocks rally on work-from-home demand',
      tickers_affected: ['QQQ', 'AAPL', 'AMZN', 'GOOG', 'NFLX'],
      impact_range: [0.02, 0.06]
    },
    {
      day: 245,
      date: '2020-09-02',
      type: 'tech',
      severity: 'medium',
      headline: 'Apple announces 4-for-1 stock split',
      tickers_affected: ['AAPL'],
      impact_range: [0.03, 0.07]
    },
    {
      day: 305,
      date: '2020-11-01',
      type: 'politics',
      severity: 'high',
      headline: 'Election week volatility hits markets',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM'],
      impact_range: [-0.04, 0.04]
    },
    {
      day: 350,
      date: '2020-12-16',
      type: 'macro',
      severity: 'medium',
      headline: 'Vaccine approval sends markets to record highs',
      tickers_affected: ['SPY', 'QQQ', 'DIA', 'IWM'],
      impact_range: [0.04, 0.08]
    }
  ]
};

fs.writeFileSync(
  path.join('assets', 'market_data', 'news_events.json'),
  JSON.stringify(newsEvents, null, 2)
);
console.log('Generated news_events.json');

console.log('\nAll market data files generated successfully!');

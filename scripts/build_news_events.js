// ============================================================================
// PAST TRADING - Historical Events Pack builder (v2, Phase 4)
// Writes assets/market_data/news_events.json. Every event is a REAL dated
// happening; headlines are written in the game's voice but nothing is
// invented. Events are matched in-game by date (data_loader v2).
// Run: node scripts/build_news_events.js
// ============================================================================

const fs = require('fs');
const path = require('path');

const E = (date, type, severity, headline, tickers = [], impact = [0, 0]) =>
  ({ day: 0, date, type, severity, headline, tickers_affected: tickers, impact_range: impact });

const EVENTS = [
  // ---- Dot-com era ----
  E('2000-01-10', 'corporate', 'medium', 'AOL to buy Time Warner in the largest merger ever. Old media surrenders to the internet'),
  E('2000-03-10', 'macro', 'high', 'NASDAQ closes above 5,000. Analysts agree: valuations are a social construct', ['CSCO', 'INTC', 'MSFT', 'QQQ']),
  E('2000-04-14', 'crash', 'high', 'Tech stocks in freefall. The geniuses are suddenly asking a lot of questions', ['CSCO', 'INTC', 'MSFT', 'QQQ']),
  E('2001-01-03', 'macro', 'medium', 'Surprise Fed rate cut. The market parties like the problem is solved'),
  E('2001-09-17', 'crash', 'high', 'Markets reopen after the September 11 attacks. Heaviest selling in decades', ['SPY', 'DIA']),
  E('2001-12-02', 'corporate', 'high', 'Enron files for bankruptcy. The smartest guys in the room were lying'),
  E('2002-07-21', 'corporate', 'high', 'WorldCom collapses in the largest bankruptcy in US history. Auditors shocked, shocked'),
  E('2002-10-09', 'macro', 'medium', 'Markets hit multi-year lows. Nobody rings a bell at the bottom, but this was it', ['SPY', 'QQQ']),
  E('2003-03-20', 'macro', 'medium', 'Invasion of Iraq begins. Oil traders very busy', ['XOM', 'CVX']),
  E('2004-08-19', 'corporate', 'medium', 'Google goes public at $85. Founders wear hoodies to the stock exchange', ['GOOG']),
  E('2005-08-29', 'macro', 'high', 'Hurricane Katrina devastates the Gulf Coast. Energy prices surge', ['XOM', 'CVX']),
  E('2006-05-10', 'macro', 'low', 'Housing prices hit record highs. Your taxi driver owns four condos in Vegas'),

  // ---- Global Financial Crisis ----
  E('2007-02-08', 'macro', 'medium', 'HSBC warns on subprime losses. A very boring press release everyone should have read', ['C', 'BAC']),
  E('2007-08-09', 'macro', 'high', 'BNP Paribas freezes funds. The mortgage machine makes a horrible grinding noise', ['C', 'BAC', 'LEH']),
  E('2007-10-09', 'macro', 'medium', 'Stocks close at all-time highs. The music is still playing', ['SPY', 'DIA']),
  E('2008-03-16', 'corporate', 'high', 'Bear Stearns sold for $2 a share. Its building is worth more than the company', ['LEH', 'GS', 'MS', 'C']),
  E('2008-09-07', 'macro', 'high', 'Fannie Mae and Freddie Mac nationalized. Nothing to see here', ['C', 'BAC', 'WFC']),
  E('2008-09-15', 'crash', 'high', 'LEHMAN BROTHERS FILES FOR BANKRUPTCY. The music stops', ['LEH', 'GS', 'MS', 'C', 'BAC', 'AIG', 'SPY']),
  E('2008-09-16', 'corporate', 'high', 'AIG bailed out with $85 billion hours after Lehman was allowed to die. Rules are feelings', ['AIG']),
  E('2008-09-29', 'crash', 'high', 'Congress rejects the bailout. Dow drops 777 points while lawmakers check their portfolios', ['SPY', 'DIA', 'C', 'BAC']),
  E('2008-10-03', 'macro', 'high', 'The $700 billion bailout passes on the second try. Amazing what a crash does for votes', ['SPY', 'C', 'BAC']),
  E('2008-11-20', 'crash', 'high', 'Markets hit new lows. Citigroup trades like a penny stock with a marble lobby', ['C', 'SPY']),
  E('2009-03-09', 'macro', 'high', 'Stocks touch a 12-year low. This, it turns out, was the bottom of the crisis', ['SPY', 'QQQ', 'C', 'BAC']),

  // ---- 2010s ----
  E('2010-04-20', 'macro', 'high', 'Deepwater Horizon explodes in the Gulf. BP about to learn what liability means', ['XOM', 'CVX']),
  E('2010-05-06', 'crash', 'high', 'FLASH CRASH: the Dow drops 9% in minutes, then mostly recovers. Nobody knows why', ['SPY', 'DIA', 'QQQ']),
  E('2011-08-05', 'macro', 'high', 'S&P strips America of its AAA rating. America responds by buying more Treasuries', ['SPY', 'DIA']),
  E('2012-05-18', 'corporate', 'medium', 'Facebook IPO stumbles out of the gate. Early investors describe feelings of feelings', ['META']),
  E('2012-07-26', 'macro', 'medium', 'Draghi promises "whatever it takes" to save the euro. Three words move trillions'),
  E('2013-05-22', 'macro', 'medium', 'The Fed hints at easing off the money printer. Markets throw the Taper Tantrum', ['SPY', 'QQQ']),
  E('2014-11-27', 'macro', 'high', 'OPEC declines to cut production. Oil begins a historic collapse', ['XOM', 'CVX']),
  E('2015-08-24', 'crash', 'high', 'China fears trigger a global rout. The Dow opens down 1,000 points', ['SPY', 'QQQ', 'DIA']),
  E('2016-06-24', 'macro', 'high', 'BREXIT: Britain votes to leave the EU. Pollsters and pounds both collapse', ['SPY', 'DIA']),
  E('2016-11-09', 'macro', 'high', 'Election shock: futures crash overnight, then stage a face-ripping reversal by lunch', ['SPY', 'DIA']),
  E('2018-02-05', 'crash', 'high', 'VOLMAGEDDON: volatility products implode and take the market with them', ['SPY', 'QQQ']),
  E('2018-12-24', 'crash', 'medium', 'The worst Christmas Eve in market history. Santa sells everything', ['SPY', 'QQQ']),
  E('2019-09-17', 'macro', 'medium', 'Repo rates spike overnight. The plumbing of finance briefly screams'),

  // ---- COVID era ----
  E('2020-02-19', 'macro', 'medium', 'Markets close at record highs. A virus is in the news, but it is very far away', ['SPY', 'QQQ']),
  E('2020-02-24', 'crash', 'high', 'Virus fears go global. The fastest correction in history begins', ['SPY', 'QQQ', 'DIA', 'IWM']),
  E('2020-03-09', 'crash', 'high', 'Oil war plus virus: circuit breakers halt trading. Twice in one week', ['SPY', 'XOM', 'CVX']),
  E('2020-03-12', 'crash', 'high', 'Worst day since 1987. The word "unprecedented" loses all meaning', ['SPY', 'QQQ', 'DIA']),
  E('2020-03-16', 'crash', 'high', 'Markets plunge on pandemic fears, circuit breakers triggered', ['SPY', 'QQQ', 'DIA', 'IWM']),
  E('2020-03-23', 'macro', 'high', 'The Fed goes unlimited. This, it turns out, was the bottom', ['SPY', 'QQQ']),
  E('2020-04-20', 'crash', 'high', 'OIL GOES NEGATIVE. Sellers pay buyers to take barrels. Economics textbooks weep', ['XOM', 'CVX']),
  E('2020-11-09', 'macro', 'high', 'Vaccine works: the greatest sector rotation in a decade happens before lunch', ['SPY', 'DIA', 'IWM']),

  // ---- Meme era & after ----
  E('2021-01-27', 'meme', 'high', 'GAMESTOP GOES VERTICAL. A subreddit turns short sellers into paste', ['GME', 'AMC']),
  E('2021-03-26', 'corporate', 'medium', 'Archegos implodes: block trades vaporize $20 billion nobody knew existed', ['GS', 'MS']),
  E('2021-11-08', 'macro', 'low', 'Everything is at all-time highs. This is fine. Everything is fine', ['SPY', 'QQQ']),
  E('2022-02-24', 'macro', 'high', 'Russia invades Ukraine. Commodities convulse; wheat and oil go vertical', ['XOM', 'CVX']),
  E('2022-06-15', 'macro', 'high', 'The Fed hikes 75 basis points, the biggest since 1994. The bill for free money arrives', ['SPY', 'QQQ']),
  E('2022-11-10', 'macro', 'high', 'Cool inflation print: the market has its best day in two years', ['SPY', 'QQQ']),
  E('2023-03-10', 'crash', 'high', 'Silicon Valley Bank collapses in 48 hours. Venture capitalists discover bank runs via group chat', ['C', 'BAC', 'WFC']),
  E('2023-05-24', 'corporate', 'high', 'NVIDIA guides so far above estimates that analysts assume a typo. The AI era begins', ['NVDA', 'QQQ']),

  // ---- Crypto history (fires in any mode; the coins must be live) ----
  E('2013-04-01', 'crypto', 'medium', 'Bitcoin crosses $100. Your most annoying friend becomes more annoying', ['BTC']),
  E('2013-11-27', 'crypto', 'high', 'Bitcoin crosses $1,000. Magic internet money refuses to stop existing', ['BTC']),
  E('2014-02-07', 'crypto', 'medium', 'Mt. Gox halts withdrawals, citing "technical issues." Nothing says fine like frozen funds', ['BTC']),
  E('2014-02-24', 'crypto', 'high', 'MT. GOX GOES DARK. 850,000 bitcoins are just... gone', ['BTC']),
  E('2016-07-09', 'crypto', 'low', 'The second Bitcoin halving. Supply drops; almost nobody notices', ['BTC']),
  E('2016-08-02', 'crypto', 'high', 'Bitfinex hacked: 120,000 BTC stolen. Every account takes a 36% haircut', ['BTC']),
  E('2017-09-04', 'crypto', 'medium', 'China bans ICOs and exchanges. Crypto dips, shrugs, continues', ['BTC', 'ETH']),
  E('2017-11-28', 'crypto', 'high', 'Bitcoin crosses $10,000. CNBC now has a coin ticker. Your uncle is all-in', ['BTC', 'ETH', 'LTC']),
  E('2017-12-17', 'crypto', 'high', 'Bitcoin touches $19,800 as futures launch. This is the top, though nobody says it out loud', ['BTC', 'ETH', 'LTC', 'XRP']),
  E('2018-01-16', 'crypto', 'high', 'Crypto winter arrives: everything is down 50% from the highs and still falling', ['BTC', 'ETH', 'LTC', 'XRP']),
  E('2020-05-11', 'crypto', 'medium', 'The third Bitcoin halving. The believers whisper: it is happening again', ['BTC']),
  E('2021-02-08', 'crypto', 'high', 'Tesla buys $1.5 billion of Bitcoin. Corporate treasuries discover the casino', ['BTC', 'DOGE']),
  E('2021-04-14', 'crypto', 'high', 'Coinbase goes public. The casino now has a ticker symbol', ['BTC', 'ETH']),
  E('2021-05-08', 'meme', 'high', 'Dogecoin peaks as its champion hosts Saturday Night Live. Sell the joke', ['DOGE']),
  E('2021-09-07', 'crypto', 'medium', 'El Salvador adopts Bitcoin as legal tender. IMF very unamused', ['BTC']),
  E('2021-11-10', 'crypto', 'high', 'Bitcoin touches $69,000. The number is a joke; the top is not', ['BTC', 'ETH', 'SOL', 'ADA']),
  E('2022-05-09', 'crypto', 'high', 'TERRA/LUNA DEATH SPIRAL: a $40 billion "stablecoin" discovers gravity', ['BTC', 'ETH', 'SOL', 'ADA']),
  E('2022-06-12', 'crypto', 'high', 'Celsius freezes withdrawals. The yield was never real', ['BTC', 'ETH']),
  E('2022-11-02', 'crypto', 'medium', 'A leaked balance sheet raises questions about FTX. The questions have teeth', ['BTC', 'ETH', 'SOL']),
  E('2022-11-08', 'crypto', 'high', 'FTX halts withdrawals. The white knight of crypto needs a knight', ['BTC', 'ETH', 'SOL']),
  E('2022-11-11', 'crypto', 'high', 'FTX FILES FOR BANKRUPTCY. Eight billion dollars of customer money is missing', ['BTC', 'ETH', 'SOL', 'ADA', 'DOGE']),
  E('2023-01-14', 'crypto', 'medium', 'Bitcoin quietly reclaims $20,000. The survivors start buying', ['BTC', 'ETH']),
  E('2024-01-10', 'crypto', 'high', 'Spot Bitcoin ETFs approved after a decade of rejections. Wall Street joins the casino', ['BTC', 'ETH']),
];

// Sanity: dates must be valid and sorted uniqueness not required
for (const ev of EVENTS) {
  if (isNaN(new Date(ev.date).getTime())) {
    throw new Error('Bad date: ' + ev.date + ' ' + ev.headline);
  }
}
EVENTS.sort((a, b) => a.date.localeCompare(b.date));

const out = { market_events: EVENTS };
const outPath = path.join(__dirname, '..', 'assets', 'market_data', 'news_events.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`Wrote ${EVENTS.length} events to ${outPath}`);

#!/usr/bin/env python3
"""
Fetch historical stock data for S&P 500 companies from Yahoo Finance.
Requires: pip install yfinance pandas
"""

import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

# Top 50 S&P 500 tickers by market cap (expandable to full 500)
SP500_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B',
    'JPM', 'JNJ', 'V', 'PG', 'XOM', 'UNH', 'MA', 'HD', 'CVX', 'MRK',
    'ABBV', 'PFE', 'KO', 'PEP', 'COST', 'AVGO', 'TMO', 'CSCO', 'ACN',
    'WMT', 'DIS', 'NFLX', 'ADBE', 'CRM', 'ABT', 'NKE', 'MCD', 'LLY',
    'INTC', 'AMD', 'QCOM', 'TXN', 'DHR', 'PM', 'UNP', 'NEE', 'BMY',
    'UPS', 'LOW', 'RTX', 'AMGN', 'HON'
]

def fetch_sp500_data():
    """Fetch historical data for S&P 500 stocks from 2000 to present."""
    output_dir = '../assets/market_data/stocks'
    os.makedirs(output_dir, exist_ok=True)

    successful = 0
    failed = 0

    for ticker in SP500_TICKERS:
        print(f'Fetching {ticker}...', end=' ')

        try:
            # Download data from 2000-01-01 to present
            data = yf.download(ticker, start='2000-01-01', end='2025-12-31', progress=False)

            if data.empty:
                print(f'❌ No data')
                failed += 1
                continue

            # Get company info
            stock = yf.Ticker(ticker)
            try:
                info = stock.info
                company_name = info.get('longName', ticker)
            except:
                company_name = ticker

            # Convert to game format
            ohlc = []
            for i, (date, row) in enumerate(data.iterrows()):
                ohlc.append({
                    'day': i,
                    'date': date.strftime('%Y-%m-%d'),
                    'open': round(float(row['Open']), 2),
                    'high': round(float(row['High']), 2),
                    'low': round(float(row['Low']), 2),
                    'close': round(float(row['Close']), 2),
                    'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
                })

            # Create output JSON
            output = {
                'ticker': ticker,
                'name': company_name,
                'period': {
                    'start': '2000-01-01',
                    'end': data.index[-1].strftime('%Y-%m-%d'),
                    'days': len(ohlc)
                },
                'ohlc': ohlc
            }

            # Write to file
            output_path = os.path.join(output_dir, f'{ticker}.json')
            with open(output_path, 'w') as f:
                json.dump(output, f, indent=2)

            print(f'✓ {len(ohlc)} days')
            successful += 1

        except Exception as e:
            print(f'❌ Error: {e}')
            failed += 1

    print(f'\nCompleted: {successful} successful, {failed} failed')
    print(f'Data saved to: {os.path.abspath(output_dir)}')

if __name__ == '__main__':
    print('Fetching S&P 500 historical data from Yahoo Finance...')
    print(f'Tickers to fetch: {len(SP500_TICKERS)}')
    print('This may take a few minutes...\n')

    fetch_sp500_data()

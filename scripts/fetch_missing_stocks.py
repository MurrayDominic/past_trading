#!/usr/bin/env python3
"""
Fetch historical data for missing stock tickers.
Downloads 2000-2025 data for stocks that are in config but missing data files.
"""

import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

# Missing tickers that need data files
MISSING_TICKERS = [
    'Jazz', 'EXEL', 'NBIX', 'ALNY', 'SGEN', 'BMRN', 'XRAY', 'TNDM',
    'UTHR', 'RARE', 'IONS', 'SRPT', 'NTRA', 'LEGN', 'INSM', 'RGEN',
    'MEDP', 'KVUE', 'AAP', 'GPS', 'VFC', 'HBI', 'PVH', 'NWL', 'HAS',
    'MAT', 'BBWI', 'DRI', 'QSR', 'WEN', 'TXRH', 'BJRI', 'BLMN', 'BWLD',
    'CBRL', 'AES', 'VST', 'CEG', 'PCG', 'ANSS', 'GME', 'AMC', 'BB',
    'NOK', 'BBBY', 'WISH', 'CLOV', 'PLUG', 'RIVN', 'LCID'
]

def fetch_data_for_ticker(ticker):
    """
    Fetch historical data for a single ticker.

    Args:
        ticker: Ticker symbol

    Returns:
        tuple: (success: bool, days_downloaded: int)
    """
    output_dir = '../assets/market_data/stocks'
    os.makedirs(output_dir, exist_ok=True)

    print(f'Fetching {ticker}...', end=' ', flush=True)

    try:
        # Download data from 2000-01-01 to 2025-12-31
        data = yf.download(ticker, start='2000-01-01', end='2025-12-31', progress=False)

        # Flatten MultiIndex columns if present
        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        if data.empty:
            print(f'FAILED - No data available')
            return False, 0

        # Get asset info
        asset = yf.Ticker(ticker)
        try:
            info = asset.info
            asset_name = info.get('longName', ticker)
        except:
            asset_name = ticker

        # Convert to game format
        ohlc = []
        for i in range(len(data)):
            date = data.index[i]

            # Extract volume safely
            vol = data['Volume'].iloc[i]
            volume = int(vol) if pd.notna(vol) and vol == vol else 0

            ohlc.append({
                'day': i,
                'date': date.strftime('%Y-%m-%d'),
                'open': round(float(data['Open'].iloc[i]), 2),
                'high': round(float(data['High'].iloc[i]), 2),
                'low': round(float(data['Low'].iloc[i]), 2),
                'close': round(float(data['Close'].iloc[i]), 2),
                'volume': volume
            })

        # Create output JSON
        output = {
            'ticker': ticker,
            'name': asset_name,
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

        print(f'OK - {len(ohlc)} days ({data.index[0].strftime("%Y-%m-%d")} to {data.index[-1].strftime("%Y-%m-%d")})')
        return True, len(ohlc)

    except Exception as e:
        print(f'FAILED - Error: {e}')
        return False, 0

if __name__ == '__main__':
    print('=' * 80)
    print('PAST TRADING - Missing Stock Data Fetcher')
    print('=' * 80)
    print(f'Downloading data for {len(MISSING_TICKERS)} missing stocks...')
    print('Source: Yahoo Finance via yfinance library\n')

    successful = 0
    failed = 0
    failed_tickers = []
    total_days = 0

    for ticker in MISSING_TICKERS:
        success, days = fetch_data_for_ticker(ticker)
        if success:
            successful += 1
            total_days += days
        else:
            failed += 1
            failed_tickers.append(ticker)

    print('\n' + '=' * 80)
    print(f'RESULTS: {successful} successful, {failed} failed')
    print('=' * 80)

    if successful > 0:
        avg_days = total_days // successful
        print(f'\n✓ Successfully downloaded {successful} stocks')
        print(f'  Average: ~{avg_days} trading days per stock (~{avg_days/252:.1f} years)')
        print(f'  Files saved to: ../assets/market_data/stocks/')

    if failed > 0:
        print(f'\n✗ Failed to download {failed} stocks:')
        for ticker in failed_tickers:
            print(f'  - {ticker}')
        print('\n  NOTE: Some tickers may be delisted, renamed, or not available on Yahoo Finance.')
        print('  You may need to find alternative ticker symbols or remove them from sp500_tickers.js')

    print('\nDone!')

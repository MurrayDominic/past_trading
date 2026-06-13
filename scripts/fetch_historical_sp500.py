#!/usr/bin/env python3
"""
Fetch historical S&P 500 constituent data and download price history for
every company that has ever been in the index (2000-present).

Sources:
  - Wikipedia: current S&P 500 list + historical changes table
  - Yahoo Finance (yfinance): OHLC price data

Output:
  - assets/market_data/stocks/<TICKER>.json  for each new ticker
  - scripts/historical_sp500_report.txt      summary for updating sp500_tickers.js

Requires: pip install yfinance pandas requests lxml
"""

import yfinance as yf
import pandas as pd
import json
import os
import time
import sys
from datetime import datetime, date

OUTPUT_DIR = os.path.join('..', 'assets', 'market_data', 'stocks')
REPORT_PATH = os.path.join(os.path.dirname(__file__), 'historical_sp500_report.txt')

# ── Yahoo Finance sector → game category mapping ──────────────────────────
SECTOR_MAP = {
    'Technology':               'tech',
    'Information Technology':   'tech',
    'Communication Services':   'tech',
    'Financials':               'finance',
    'Financial Services':       'finance',
    'Health Care':              'healthcare',
    'Healthcare':               'healthcare',
    'Consumer Discretionary':   'consumer',
    'Consumer Staples':         'consumer',
    'Industrials':              'industrials',
    'Energy':                   'energy',
    'Materials':                'materials',
    'Real Estate':              'realestate',
    'Utilities':                'utilities',
}


def get_existing_tickers():
    """Return set of tickers that already have JSON data files."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    return {f[:-5] for f in os.listdir(OUTPUT_DIR) if f.endswith('.json')}


def get_wikipedia_sp500():
    """
    Pull current S&P 500 members + full historical changes table from Wikipedia.
    Returns (current_df, changes_df).
    """
    import requests
    url = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies'
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        )
    }
    print('Fetching S&P 500 constituent history from Wikipedia...')
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
    tables = pd.read_html(response.text)

    current_df = tables[0]   # Current constituents
    changes_df = tables[1]   # Historical additions / removals

    return current_df, changes_df


def build_historical_ticker_set(current_df, changes_df):
    """
    Combine current members with all historical additions to get every
    ticker ever in the index since records began.
    Returns a set of ticker symbols.
    """
    tickers = set()

    # Current members
    for ticker in current_df['Symbol'].dropna():
        tickers.add(str(ticker).strip().replace('.', '-'))

    # Historical additions (they were in the index at some point)
    try:
        added_col = None
        for col in changes_df.columns:
            col_str = str(col).lower()
            if 'added' in col_str and 'ticker' in col_str:
                added_col = col
                break
            if col_str in ('added', 'ticker added', 'symbol added'):
                added_col = col
                break

        # Flatten MultiIndex columns if needed
        if isinstance(changes_df.columns, pd.MultiIndex):
            # Try to find Added/Ticker column
            for level0, level1 in changes_df.columns:
                if 'added' in str(level0).lower() and 'ticker' in str(level1).lower():
                    added_col = (level0, level1)
                    break

        if added_col is not None:
            for ticker in changes_df[added_col].dropna():
                tickers.add(str(ticker).strip().replace('.', '-'))

        removed_col = None
        for col in changes_df.columns:
            col_str = str(col).lower()
            if 'removed' in col_str and 'ticker' in col_str:
                removed_col = col
                break

        if removed_col is not None:
            for ticker in changes_df[removed_col].dropna():
                tickers.add(str(ticker).strip().replace('.', '-'))

    except Exception as e:
        print(f'  Warning: could not fully parse changes table: {e}')

    # Remove empty/invalid
    tickers = {t for t in tickers if t and len(t) <= 6 and t.replace('-', '').isalpha()}
    return tickers


def fetch_ticker(ticker, report_lines):
    """
    Download OHLC data from Yahoo Finance and save as game-format JSON.
    Returns (success, category, name, start_date, end_date).
    """
    print(f'  {ticker}...', end=' ', flush=True)

    try:
        data = yf.download(ticker, start='2000-01-01', end='2025-12-31',
                           progress=False, auto_adjust=True)

        if isinstance(data.columns, pd.MultiIndex):
            data.columns = data.columns.get_level_values(0)

        if data.empty:
            print('NO DATA')
            report_lines.append(f'SKIP\t{ticker}\tno data from yfinance')
            return False, None, None, None, None

        # Try to get sector / name from yfinance info
        category = 'finance'  # sensible default for unknowns (finance is the most common historical)
        name = ticker
        try:
            info = yf.Ticker(ticker).info
            name = info.get('longName') or info.get('shortName') or ticker
            sector = info.get('sector', '')
            category = SECTOR_MAP.get(sector, 'finance')
        except Exception:
            pass

        # Build OHLC array in game format
        ohlc = []
        for i in range(len(data)):
            row_date = data.index[i]
            try:
                o = round(float(data['Open'].iloc[i]), 2)
                h = round(float(data['High'].iloc[i]), 2)
                l = round(float(data['Low'].iloc[i]), 2)
                c = round(float(data['Close'].iloc[i]), 2)
                vol_raw = data['Volume'].iloc[i]
                vol = int(vol_raw) if pd.notna(vol_raw) else 0
            except Exception:
                continue

            if any(x != x for x in [o, h, l, c]):  # NaN check
                continue

            ohlc.append({
                'day':    i,
                'date':   row_date.strftime('%Y-%m-%d'),
                'open':   o,
                'high':   h,
                'low':    l,
                'close':  c,
                'volume': vol,
            })

        if not ohlc:
            print('NO VALID ROWS')
            report_lines.append(f'SKIP\t{ticker}\tall rows invalid')
            return False, None, None, None, None

        start_date = ohlc[0]['date']
        end_date   = ohlc[-1]['date']

        output = {
            'ticker': ticker,
            'name':   name,
            'period': {
                'start': start_date,
                'end':   end_date,
                'days':  len(ohlc),
            },
            'ohlc': ohlc,
        }

        out_path = os.path.join(OUTPUT_DIR, f'{ticker}.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False)

        print(f'OK  {len(ohlc)} days  {start_date} → {end_date}  [{category}]')
        report_lines.append(f'ADD\t{ticker}\t{name}\t{category}\t{start_date}\t{end_date}')
        return True, category, name, start_date, end_date

    except Exception as e:
        print(f'ERROR: {e}')
        report_lines.append(f'FAIL\t{ticker}\t{e}')
        return False, None, None, None, None


def main():
    print('=' * 70)
    print('PAST TRADING — Historical S&P 500 Data Fetcher')
    print('Real data only. Source: Wikipedia + Yahoo Finance.')
    print('=' * 70)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    existing = get_existing_tickers()
    print(f'\nExisting data files: {len(existing)} tickers\n')

    # Get full historical constituent list from Wikipedia
    try:
        current_df, changes_df = get_wikipedia_sp500()
        all_tickers = build_historical_ticker_set(current_df, changes_df)
    except Exception as e:
        print(f'Failed to load Wikipedia data: {e}')
        sys.exit(1)

    missing = sorted(all_tickers - existing)
    print(f'Total historical tickers found: {len(all_tickers)}')
    print(f'Already downloaded:             {len(existing)}')
    print(f'Need to download:               {len(missing)}\n')

    if not missing:
        print('Nothing to download — all tickers already present.')
        return

    report_lines = [
        f'Historical S&P 500 download report — {datetime.now().strftime("%Y-%m-%d %H:%M")}',
        f'New tickers attempted: {len(missing)}',
        '',
        'STATUS\tTICKER\tNAME\tCATEGORY\tSTART\tEND',
        '-' * 80,
    ]

    success = 0
    failed  = 0

    for i, ticker in enumerate(missing, 1):
        print(f'[{i}/{len(missing)}] ', end='')
        ok, *_ = fetch_ticker(ticker, report_lines)
        if ok:
            success += 1
        else:
            failed += 1
        # Polite rate limiting — Yahoo Finance blocks aggressive scrapers
        time.sleep(0.3)

    print(f'\n{"=" * 70}')
    print(f'Done: {success} downloaded, {failed} failed/skipped')
    print(f'{"=" * 70}')

    report_lines.extend([
        '',
        f'TOTAL: {success} downloaded, {failed} failed/skipped',
    ])
    with open(REPORT_PATH, 'w', encoding='utf-8', errors='replace') as f:
        f.write('\n'.join(report_lines))
    print(f'\nFull report saved to: {REPORT_PATH}')
    print('Use the ADD lines in the report to update sp500_tickers.js.')


if __name__ == '__main__':
    main()

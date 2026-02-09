#!/usr/bin/env python3
"""
Fetch historical market data from Yahoo Finance for all asset types.
Requires: pip install yfinance pandas
Downloads 2000-2025 data for stocks, ETFs, commodities, and cryptocurrencies.
"""

import yfinance as yf
import pandas as pd
import json
import os
from datetime import datetime

# All S&P 500 tickers from sp500_tickers.js (452 stocks)
SP500_TICKERS = [
    # Technology (70)
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'NVDA', 'META', 'TSLA', 'AVGO', 'CSCO', 'ACN',
    'ADBE', 'CRM', 'INTC', 'AMD', 'QCOM', 'TXN', 'ORCL', 'NOW', 'IBM', 'INTU',
    'AMAT', 'MU', 'ADI', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'PANW', 'CRWD', 'ADSK',
    'MSCI', 'ROP', 'FTNT', 'MCHP', 'ANSS', 'HPQ', 'NTAP', 'TEAM', 'WDAY', 'ZS',
    'DDOG', 'SNOW', 'NET', 'AKAM', 'VRSN', 'JNPR', 'FFIV', 'GDDY', 'ENPH', 'ON',
    'SMCI', 'DELL', 'HPE', 'WDC', 'STX', 'NXPI', 'MRVL', 'SWKS', 'QRVO', 'MPWR',
    'FSLR', 'TER', 'GLW', 'APH', 'TYL', 'ZBRA', 'KEYS', 'EPAM', 'GEN', 'PLTR',
    # Finance (60)
    'JPM', 'V', 'MA', 'BAC', 'WFC', 'MS', 'GS', 'BLK', 'C', 'SCHW',
    'AXP', 'SPGI', 'CB', 'PGR', 'MMC', 'USB', 'PNC', 'AON', 'TFC', 'CME',
    'ICE', 'TRV', 'AIG', 'AFL', 'ALL', 'MET', 'PRU', 'FIS', 'AJG', 'FITB',
    'BK', 'STT', 'COF', 'DFS', 'TROW', 'BEN', 'RF', 'KEY', 'CFG', 'HBAN',
    'CINF', 'NTRS', 'MTB', 'SYF', 'L', 'GL', 'WRB', 'IVZ', 'ZION', 'RJF',
    'JKHY', 'BRO', 'EQH', 'AIZ', 'RE', 'FNF', 'PFG', 'AMP', 'CBOE', 'NDAQ',
    # Healthcare (60)
    'UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'PFE', 'BMY',
    'AMGN', 'SYK', 'GILD', 'VRTX', 'CVS', 'CI', 'REGN', 'BSX', 'MDT', 'ISRG',
    'ELV', 'ZTS', 'HCA', 'MCK', 'COR', 'HUM', 'DXCM', 'A', 'IQV', 'BDX',
    'EW', 'RMD', 'IDXX', 'STE', 'ALGN', 'MTD', 'WST', 'HOLX', 'PODD', 'DGX',
    'LH', 'CRL', 'CAH', 'VTRS', 'TECH', 'TFX', 'RVTY', 'COO', 'BAX', 'GEHC',
    'WAT', 'HSIC', 'MRNA', 'BIIB', 'INCY', 'EXAS', 'MOH', 'DVA', 'UHS', 'HLF',
    # Consumer (50)
    'AMZN', 'WMT', 'HD', 'MCD', 'NKE', 'COST', 'SBUX', 'LOW', 'TGT', 'TJX',
    'BKNG', 'CMG', 'MAR', 'ORLY', 'AZO', 'HLT', 'ABNB', 'GM', 'F', 'YUM',
    'ROST', 'DHI', 'LEN', 'DG', 'DLTR', 'TSCO', 'EBAY', 'ETSY', 'POOL', 'ULTA',
    'BBY', 'GPC', 'DPZ', 'DECK', 'NVR', 'PHM', 'KMX', 'TPR', 'RL', 'UAA',
    'NCLH', 'RCL', 'CCL', 'LVS', 'MGM', 'WYNN', 'CZR', 'PENN', 'MHK', 'WHR',
    # Consumer Staples (40)
    'PG', 'KO', 'PEP', 'MDLZ', 'PM', 'MO', 'CL', 'GIS', 'KMB', 'MNST',
    'KHC', 'HSY', 'SYY', 'K', 'CLX', 'TSN', 'HRL', 'CAG', 'CPB', 'MKC',
    'CHD', 'TAP', 'LW', 'DG', 'KR', 'SJM', 'BG', 'ADM', 'EL', 'STZ',
    'KDP', 'WBA', 'TAP', 'BF.B', 'COKE', 'DINO', 'SPB', 'POST', 'INGR', 'FLO',
    # Energy (30)
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'PXD',
    'HES', 'WMB', 'KMI', 'HAL', 'BKR', 'DVN', 'FANG', 'MRO', 'OKE', 'TRGP',
    'EQT', 'APA', 'CTRA', 'TPL', 'CNQ', 'SU', 'IMO', 'CVE', 'TRP', 'ENB',
    # Industrials (50)
    'UNP', 'RTX', 'HON', 'UPS', 'CAT', 'DE', 'BA', 'GE', 'LMT', 'MMM',
    'ADP', 'GD', 'ITW', 'NOC', 'EMR', 'ETN', 'PCAR', 'TT', 'PH', 'CARR',
    'JCI', 'FDX', 'NSC', 'CMI', 'OTIS', 'ROK', 'AME', 'FAST', 'PAYX', 'VRSK',
    'ODFL', 'IR', 'WM', 'RSG', 'XYL', 'IEX', 'CPRT', 'LDOS', 'URI', 'PWR',
    'J', 'SWK', 'CHRW', 'EXPD', 'WAB', 'DOV', 'HUBB', 'GNRC', 'AOS', 'BLDR',
    # Materials (30)
    'LIN', 'APD', 'SHW', 'FCX', 'ECL', 'NEM', 'CTVA', 'DD', 'NUE', 'DOW',
    'VMC', 'MLM', 'PPG', 'ALB', 'BALL', 'AVY', 'AMCR', 'PKG', 'IP', 'CE',
    'EMN', 'CF', 'MOS', 'FMC', 'IFF', 'LYB', 'SEE', 'WRK', 'HUN', 'NTR',
    # Real Estate (30)
    'PLD', 'AMT', 'EQIX', 'CCI', 'PSA', 'WELL', 'DLR', 'O', 'SBAC', 'VICI',
    'AVB', 'EQR', 'SPG', 'ARE', 'VTR', 'INVH', 'MAA', 'ESS', 'KIM', 'REG',
    'UDR', 'HST', 'BXP', 'PEAK', 'DOC', 'FRT', 'CPT', 'AIV', 'VNO', 'SLG',
    # Utilities (30)
    'NEE', 'SO', 'DUK', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'PEG', 'ED',
    'EIX', 'WEC', 'ES', 'AWK', 'DTE', 'PPL', 'FE', 'AEE', 'ETR', 'CMS',
    'CNP', 'NI', 'LNT', 'EVRG', 'ATO', 'PNW', 'NWE', 'OGE', 'AVA', 'SJW',
    # Communications (12)
    'GOOGL', 'META', 'DIS', 'NFLX', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'EA',
    'TTWO', 'MTCH'
]

# ETFs for day trading mode
ETF_TICKERS = [
    'SPY',   # S&P 500 ETF
    'QQQ',   # Nasdaq-100 ETF
    'IWM',   # Russell 2000 Small Cap ETF
    'DIA'    # Dow Jones Industrial Average ETF
]

# Commodities (Yahoo Finance futures symbols)
COMMODITY_TICKERS = [
    'GC=F',  # Gold Futures
    'SI=F',  # Silver Futures
    'CL=F',  # Crude Oil Futures
    'NG=F',  # Natural Gas Futures
    'HG=F',  # Copper Futures
]

# Cryptocurrencies (Yahoo Finance crypto symbols)
CRYPTO_TICKERS = [
    'BTC-USD',  # Bitcoin
    'ETH-USD',  # Ethereum
    'DOGE-USD', # Dogecoin
    'SOL-USD',  # Solana
]

def fetch_data_for_tickers(tickers, category, output_subdir):
    """
    Fetch historical data for a list of tickers.

    Args:
        tickers: List of ticker symbols
        category: Category name for display (e.g., 'stocks', 'ETFs', 'crypto')
        output_subdir: Subdirectory name under assets/market_data/
    """
    output_dir = f'../assets/market_data/{output_subdir}'
    os.makedirs(output_dir, exist_ok=True)

    successful = 0
    failed = 0

    print(f'\n=== Fetching {category} ({len(tickers)} tickers) ===')

    for ticker in tickers:
        print(f'Fetching {ticker}...', end=' ')

        try:
            # Download data from 2000-01-01 to 2025-12-31
            data = yf.download(ticker, start='2000-01-01', end='2025-12-31', progress=False)

            # Flatten MultiIndex columns if present
            if isinstance(data.columns, pd.MultiIndex):
                data.columns = data.columns.get_level_values(0)

            if data.empty:
                print(f'FAILED No data')
                failed += 1
                continue

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
                volume = int(vol) if pd.notna(vol) and vol == vol else 0  # vol == vol checks for NaN

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

            # Clean ticker for filename (remove special characters)
            clean_ticker = ticker.replace('=F', '').replace('-USD', '').replace('.', '_')

            # Write to file
            output_path = os.path.join(output_dir, f'{clean_ticker}.json')
            with open(output_path, 'w') as f:
                json.dump(output, f, indent=2)

            print(f'OK {len(ohlc)} days')
            successful += 1

        except Exception as e:
            print(f'FAILED Error: {e}')
            failed += 1

    print(f'{category} completed: {successful} successful, {failed} failed')
    print(f'Data saved to: {os.path.abspath(output_dir)}')

    return successful, failed

if __name__ == '__main__':
    print('=' * 70)
    print('PAST TRADING - Historical Market Data Fetcher')
    print('=' * 70)
    print('Downloading 25 years of real market data (2000-2025)')
    print('Source: Yahoo Finance via yfinance library')
    print('This may take 15-30 minutes depending on API rate limits...\n')

    total_success = 0
    total_failed = 0

    # Fetch S&P 500 stocks
    success, failed = fetch_data_for_tickers(SP500_TICKERS, 'S&P 500 Stocks', 'stocks')
    total_success += success
    total_failed += failed

    # Fetch ETFs
    success, failed = fetch_data_for_tickers(ETF_TICKERS, 'ETFs', 'etfs')
    total_success += success
    total_failed += failed

    # Fetch commodities
    success, failed = fetch_data_for_tickers(COMMODITY_TICKERS, 'Commodities', 'commodities')
    total_success += success
    total_failed += failed

    # Fetch cryptocurrencies
    success, failed = fetch_data_for_tickers(CRYPTO_TICKERS, 'Cryptocurrencies', 'crypto')
    total_success += success
    total_failed += failed

    print('\n' + '=' * 70)
    print(f'TOTAL: {total_success} successful, {total_failed} failed')
    print('=' * 70)
    print('\nData files created in: ../assets/market_data/')
    print('  - stocks/     (452 S&P 500 stocks)')
    print('  - etfs/       (4 major ETFs)')
    print('  - commodities/ (5 futures)')
    print('  - crypto/     (4 cryptocurrencies)')
    print('\nEach file contains ~6,300 days of OHLC data (2000-2025)')
    print('Ready to use in the game with ZERO artificial modifications!')

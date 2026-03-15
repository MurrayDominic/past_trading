"""
Fetch real historical OHLC data for crypto assets using yfinance.
Run once to generate JSON data files for the game.

Requirements: pip install yfinance
"""

import json
import os
import sys
from datetime import datetime, date

try:
    import yfinance as yf
except ImportError:
    print("yfinance not found. Installing...")
    os.system(f"{sys.executable} -m pip install yfinance")
    import yfinance as yf

# Crypto assets: (game_ticker, yfinance_symbol, full_name, base_price_fallback)
CRYPTO_ASSETS = [
    ("BTC",  "BTC-USD",  "Bitcoin",      42000),
    ("ETH",  "ETH-USD",  "Ethereum",     2200),
    ("LTC",  "LTC-USD",  "Litecoin",     80),
    ("XRP",  "XRP-USD",  "Ripple",       0.55),
    ("BNB",  "BNB-USD",  "Binance Coin", 380),
    ("SOL",  "SOL-USD",  "Solana",       95),
    ("DOGE", "DOGE-USD", "Dogecoin",     0.08),
    ("ADA",  "ADA-USD",  "Cardano",      0.45),
]

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def fetch_and_save(ticker, yf_symbol, name, base_price):
    print(f"Fetching {name} ({yf_symbol})...")

    try:
        data = yf.download(yf_symbol, start="2010-01-01", end="2025-12-31",
                           interval="1d", auto_adjust=True, progress=False)
    except Exception as e:
        print(f"  ERROR downloading {yf_symbol}: {e}")
        return False

    if data is None or len(data) == 0:
        print(f"  No data returned for {yf_symbol}")
        return False

    # Flatten multi-level columns (newer yfinance versions use ticker-prefixed columns)
    if isinstance(data.columns, __import__('pandas').MultiIndex):
        data.columns = data.columns.get_level_values(0)

    # Drop rows with NaN in Close
    data = data.dropna(subset=["Close"])

    if len(data) == 0:
        print(f"  No valid rows for {yf_symbol}")
        return False

    ohlc_entries = []
    for day_idx, (ts, row) in enumerate(data.iterrows()):
        try:
            date_str = ts.strftime("%Y-%m-%d")
            o = round(float(row["Open"]),   8)
            h = round(float(row["High"]),   8)
            l = round(float(row["Low"]),    8)
            c = round(float(row["Close"]),  8)
            v = int(row["Volume"]) if not __import__('math').isnan(float(row["Volume"])) else 0
        except Exception:
            continue

        ohlc_entries.append({
            "day":    day_idx,
            "date":   date_str,
            "open":   o,
            "high":   h,
            "low":    l,
            "close":  c,
            "volume": v,
        })

    if len(ohlc_entries) == 0:
        print(f"  No OHLC entries built for {yf_symbol}")
        return False

    period_start = ohlc_entries[0]["date"]
    period_end   = ohlc_entries[-1]["date"]

    output = {
        "ticker": ticker,
        "name":   name,
        "period": {
            "start": period_start,
            "end":   period_end,
            "days":  len(ohlc_entries),
        },
        "ohlc": ohlc_entries,
    }

    out_path = os.path.join(OUTPUT_DIR, f"{ticker}.json")
    with open(out_path, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    size_kb = os.path.getsize(out_path) / 1024
    print(f"  Done: {len(ohlc_entries)} days ({period_start} to {period_end}), {size_kb:.0f} KB -> {ticker}.json")
    return True


if __name__ == "__main__":
    print(f"Output directory: {OUTPUT_DIR}\n")
    success = 0
    for ticker, yf_sym, name, base in CRYPTO_ASSETS:
        if fetch_and_save(ticker, yf_sym, name, base):
            success += 1
        print()

    print(f"Done: {success}/{len(CRYPTO_ASSETS)} assets fetched successfully.")

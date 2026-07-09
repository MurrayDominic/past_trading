"""
Fetch real historical FX rates from the ECB and build game data files.

Source: ECB euro foreign exchange reference rates, daily since 1999-01-04.
https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip
The ECB permits reproduction with source attribution. Rates are one daily
reference fix per currency (vs EUR); pairs are computed as cross rates.
OHLC rows are flattened (open=high=low=close=the daily fix) because only
one real rate per day exists. Nothing is interpolated or invented.

Run: python scripts/fetch_forex.py
"""

import csv
import io
import json
import os
import urllib.request
import zipfile

URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-hist.zip'
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets', 'market_data', 'forex')

# ticker -> (numerator currency, denominator currency); 'EUR' handled specially
# Rate table gives CCY per 1 EUR.
PAIRS = {
    'EURUSD': ('USD', 'EUR'),   # USD per EUR = USD column directly
    'GBPUSD': ('USD', 'GBP'),   # USD per GBP = USD/GBP
    'USDJPY': ('JPY', 'USD'),   # JPY per USD = JPY/USD
    'USDCHF': ('CHF', 'USD'),   # CHF per USD = CHF/USD
    'AUDUSD': ('USD', 'AUD'),   # USD per AUD = USD/AUD
}
NAMES = {
    'EURUSD': 'Euro / US Dollar',
    'GBPUSD': 'British Pound / US Dollar',
    'USDJPY': 'US Dollar / Japanese Yen',
    'USDCHF': 'US Dollar / Swiss Franc',
    'AUDUSD': 'Australian Dollar / US Dollar',
}


def main():
    print('Downloading ECB reference rates...')
    with urllib.request.urlopen(URL, timeout=60) as resp:
        blob = resp.read()
    zf = zipfile.ZipFile(io.BytesIO(blob))
    csv_name = [n for n in zf.namelist() if n.endswith('.csv')][0]
    rows = list(csv.DictReader(io.TextIOWrapper(zf.open(csv_name), encoding='utf-8')))
    rows.sort(key=lambda r: r['Date'])
    print(f'{len(rows)} daily rows from {rows[0]["Date"]} to {rows[-1]["Date"]}')

    os.makedirs(OUT_DIR, exist_ok=True)

    def rate(row, ccy):
        if ccy == 'EUR':
            return 1.0
        v = (row.get(ccy) or '').strip()
        if not v or v == 'N/A':
            return None
        return float(v)

    for ticker, (num, den) in PAIRS.items():
        ohlc = []
        day = 0
        for row in rows:
            n = rate(row, num)
            d = rate(row, den)
            if n is None or d is None or d == 0:
                continue
            px = round(n / d, 6)
            ohlc.append({
                'day': day,
                'date': row['Date'],
                'open': px, 'high': px, 'low': px, 'close': px,
                'volume': 0,
            })
            day += 1
        data = {
            'ticker': ticker,
            'name': NAMES[ticker],
            'period': {'start': ohlc[0]['date'], 'end': ohlc[-1]['date']},
            'source': 'ECB euro foreign exchange reference rates',
            'ohlc': ohlc,
        }
        out = os.path.join(OUT_DIR, f'{ticker}.json')
        with open(out, 'w') as f:
            json.dump(data, f)
        print(f'{ticker}: {len(ohlc)} rows -> {out}')

    print('Done.')


if __name__ == '__main__':
    main()

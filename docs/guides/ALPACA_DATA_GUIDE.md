# Alpaca Market Data Guide

## Phase 3.5 Tri-Runtime Standard

This guide covers accessing real-time and historical market data using the Alpaca Markets API, optimized for the Tri-Runtime (Rust/Python/Go) architecture.

---

## 1. Authentication & Setup

Alpaca uses API Key IDs and Secret Keys. Store these in your `.env` file:

```bash
ALPACA_API_KEY=your_key_id
ALPACA_API_SECRET=your_secret_key
ALPACA_BASE_URL=https://paper-api.alpaca.markets
```

---

## 2. Real-Time Streaming (WebSocket)

For live trading, the **Rust Market Data Service** handles the WebSocket connection for maximum performance.

### Rust Implementation (Service)

The `market-data` crate connects to `wss://stream.data.alpaca.markets/v2/sip` and publishes to ZeroMQ (Port 5555).

### Python Subscription (Research/Strategy)

If you need to listen to real-time data in Python for research:

```python
from src.bridge.zmq_bridge import ZMQReceiver

# Connect to the Rust Market Data Service
receiver = ZMQReceiver(addr="tcp://localhost:5555")
for msg in receiver.listen():
    print(f"Received market data: {msg}")
```

---

## 3. Historical Data Download

We provide a production-grade downloader script in `scripts/download_historical_data.py`.

### Features

- **Dual Format**: Saves in CSV (human-readable) and Parquet (performance).
- **Auto-Retry**: Exponential backoff for rate limits.
- **Validation**: Checks for data gaps and price integrity.

### Usage

```bash
# Download 1 year of daily data for tech stocks
python scripts/download_historical_data.py \
  --symbols AAPL MSFT GOOGL \
  --start 2024-01-01 \
  --end 2024-12-31 \
  --output-dir data/historical
```

---

## 4. Historical Data Access (Python API)

For ad-hoc research in Jupyter or Python scripts:

```python
from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame
from datetime import datetime

client = StockHistoricalDataClient(api_key, secret_key)

request = StockBarsRequest(
    symbol_or_symbols="AAPL",
    timeframe=TimeFrame.Day,
    start=datetime(2024, 1, 1)
)

bars = client.get_stock_bars(request)
df = bars.df  # Convert to Pandas DataFrame
```

---

## 5. Best Practices

1. **Use Parquet**: For large datasets (>100k bars), use Parquet to reduce disk I/O and memory usage.
2. **Timezone Awareness**: Alpaca returns UTC. Always convert to `US/Eastern` for market hour analysis.
3. **Pagination**: The API has a 10,000 bar limit per request. Our `download_historical_data.py` script handles pagination automatically.
4. **Data Integrity**: Before training ML models, use `scripts/validate_data_integrity.py` to check for missing bars during market hours.

---
**Architect**: Antigravity AI
**Updated**: May 11, 2026

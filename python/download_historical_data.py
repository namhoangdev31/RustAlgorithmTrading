import os
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import pandas as pd
from loguru import logger

from alpaca.data.historical import StockHistoricalDataClient
from alpaca.data.requests import StockBarsRequest
from alpaca.data.timeframe import TimeFrame


# Support equality comparison for Alpaca TimeFrame objects
def _timeframe_eq(self: Any, other: Any) -> bool:
    if not isinstance(other, TimeFrame):
        return False
    return self.value == other.value and self.unit == other.unit


TimeFrame.__eq__ = _timeframe_eq  # type: ignore[method-assign]


@dataclass
class DownloadConfig:
    """
    Configuration for Alpaca historical data downloader.
    """

    symbols: List[str]
    start_date: str
    end_date: str
    timeframe: str = "1Day"
    save_csv: bool = True
    save_parquet: bool = True
    retry_attempts: int = 3
    retry_delay: float = 1.0
    feed: str = "iex"
    output_dir: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DownloadConfig":
        return cls(
            symbols=data.get("symbols", []),
            start_date=data.get("start_date", ""),
            end_date=data.get("end_date", ""),
            timeframe=data.get("timeframe", "1Day"),
            save_csv=data.get("save_csv", True),
            save_parquet=data.get("save_parquet", True),
            retry_attempts=data.get("retry_attempts", 3),
            retry_delay=data.get("retry_delay", 1.0),
            feed=data.get("feed", "iex"),
            output_dir=data.get("output_dir"),
            api_key=data.get("api_key"),
            api_secret=data.get("api_secret"),
        )


class AlpacaDataDownloader:
    """
    Alpaca data downloader with retry mechanisms, validation, and serialization.
    """

    def __init__(self, config: DownloadConfig):
        self.config = config
        self.output_dir = Path(self.config.output_dir or "./data")
        self.csv_dir = self.output_dir / "csv"
        self.parquet_dir = self.output_dir / "parquet"

        # Ensure directories exist
        self.csv_dir.mkdir(parents=True, exist_ok=True)
        self.parquet_dir.mkdir(parents=True, exist_ok=True)

        self.stats = {
            "total_symbols": len(self.config.symbols),
            "successful_downloads": 0,
            "failed_downloads": 0,
        }

        api_key = self.config.api_key or os.environ.get("APCA_API_KEY_ID")
        api_secret = self.config.api_secret or os.environ.get("APCA_API_SECRET_KEY")

        self.client = StockHistoricalDataClient(
            api_key=api_key or "DUMMY_KEY",
            api_secret=api_secret or "DUMMY_SECRET",
        )

    def _parse_timeframe(self, timeframe_str: str) -> TimeFrame:
        if timeframe_str == "1Day":
            return TimeFrame.Day
        elif timeframe_str == "1Hour":
            return TimeFrame.Hour
        elif timeframe_str == "1Min":
            return TimeFrame.Minute
        else:
            logger.warning(f"Unknown timeframe {timeframe_str}, defaulting to 1Day")
            return TimeFrame.Day

    def _validate_dataframe(self, df: pd.DataFrame, symbol: str) -> bool:
        if df.empty:
            logger.warning(f"DataFrame is empty for {symbol}")
            return False

        required_cols = ["timestamp", "open", "high", "low", "close", "volume"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            logger.warning(f"Missing columns {missing_cols} for {symbol}")
            return False

        price_cols = ["open", "high", "low", "close"]
        for col in price_cols:
            if (df[col] < 0).any():
                logger.warning(f"Negative price found in {col} for {symbol}")
                return False

        if (df["high"] < df["low"]).any():
            logger.warning(f"High price less than low price for {symbol}")
            return False

        return True

    def _save_csv(self, df: pd.DataFrame, symbol: str) -> bool:
        try:
            filename = (
                self.csv_dir / f"{symbol}_{self.config.start_date}_to_{self.config.end_date}.csv"
            )
            df.to_csv(filename, index=False)
            logger.info(f"Saved CSV for {symbol} to {filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to save CSV for {symbol}: {e}")
            return False

    def _save_parquet(self, df: pd.DataFrame, symbol: str) -> bool:
        try:
            filename = (
                self.parquet_dir
                / f"{symbol}_{self.config.start_date}_to_{self.config.end_date}.parquet"
            )
            df.to_parquet(filename, index=False)
            logger.info(f"Saved Parquet for {symbol} to {filename}")
            return True
        except Exception as e:
            logger.error(f"Failed to save Parquet for {symbol}: {e}")
            return False

    def _fetch_data_with_retry(self, symbol: str) -> Optional[pd.DataFrame]:
        attempts = 0
        limit = self.config.retry_attempts
        delay = self.config.retry_delay

        timeframe = self._parse_timeframe(self.config.timeframe)
        try:
            start_dt = datetime.strptime(self.config.start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(self.config.end_date, "%Y-%m-%d")
        except Exception:
            start_dt = self.config.start_date
            end_dt = self.config.end_date

        while attempts < limit:
            try:
                request = StockBarsRequest(
                    symbol_or_symbols=symbol,
                    timeframe=timeframe,
                    start=start_dt,
                    end=end_dt,
                    feed=self.config.feed,
                )
                bars = self.client.get_stock_bars(request)
                if bars is not None and hasattr(bars, "df"):
                    df = bars.df.copy()
                    if "symbol" not in df.columns:
                        if isinstance(df.index, pd.MultiIndex):
                            df = df.reset_index()
                        else:
                            df["symbol"] = symbol
                    return df
                return None
            except Exception as e:
                attempts += 1
                if attempts >= limit:
                    logger.error(f"Failed to fetch {symbol} after {limit} attempts: {e}")
                    return None
                time.sleep(delay)
        return None

    def download(self) -> Dict[str, Any]:
        """
        Download, validate and save data for all configured symbols.
        """
        for symbol in self.config.symbols:
            logger.info(f"Downloading historical data for {symbol}")
            df = self._fetch_data_with_retry(symbol)
            if df is not None:
                if self._validate_dataframe(df, symbol):
                    success = False
                    if self.config.save_csv:
                        if self._save_csv(df, symbol):
                            success = True
                    if self.config.save_parquet:
                        if self._save_parquet(df, symbol):
                            success = True
                    if success:
                        self.stats["successful_downloads"] += 1
                    else:
                        self.stats["failed_downloads"] += 1
                else:
                    self.stats["failed_downloads"] += 1
            else:
                self.stats["failed_downloads"] += 1
        return self.stats

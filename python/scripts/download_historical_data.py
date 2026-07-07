import argparse
import sys
from pathlib import Path

# Add python/ directory to sys.path to import download_historical_data
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from download_historical_data import DownloadConfig, AlpacaDataDownloader


def main() -> None:
    parser = argparse.ArgumentParser(description="Alpaca historical data downloader.")
    parser.add_argument(
        "--symbols", nargs="+", required=True, help="List of ticker symbols to download."
    )
    parser.add_argument(
        "--start", "--start-date", dest="start_date", required=True, help="Start date (YYYY-MM-DD)."
    )
    parser.add_argument(
        "--end", "--end-date", dest="end_date", required=True, help="End date (YYYY-MM-DD)."
    )
    parser.add_argument("--timeframe", default="1Day", help="Timeframe (e.g. 1Day, 1Hour, 1Min).")
    parser.add_argument("--feed", default="iex", choices=["iex", "sip"], help="Data feed.")
    parser.add_argument("--output-dir", default="./data", help="Output directory.")
    parser.add_argument("--no-csv", action="store_true", help="Do not save as CSV.")
    parser.add_argument("--no-parquet", action="store_true", help="Do not save as Parquet.")
    parser.add_argument("--retry-attempts", type=int, default=3, help="Number of retry attempts.")
    parser.add_argument(
        "--retry-delay", type=float, default=1.0, help="Delay between retries in seconds."
    )

    args = parser.parse_args()

    config = DownloadConfig(
        symbols=args.symbols,
        start_date=args.start_date,
        end_date=args.end_date,
        timeframe=args.timeframe,
        feed=args.feed,
        output_dir=args.output_dir,
        save_csv=not args.no_csv,
        save_parquet=not args.no_parquet,
        retry_attempts=args.retry_attempts,
        retry_delay=args.retry_delay,
    )

    downloader = AlpacaDataDownloader(config)
    stats = downloader.download()

    print(f"Download complete: {stats}")
    if stats["failed_downloads"] > 0 and stats["successful_downloads"] == 0:
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()

"""
Observability Storage Module

Provides high-performance time-series and operational data storage:
- DuckDB: Analytics and time-series data (OLAP)
- Postgres: Operational data and metadata (OLTP)
"""

from .duckdb_client import DuckDBClient
from .schemas import (
    MetricRecord,
    CandleRecord,
    PerformanceRecord,
    TimeInterval,
)

__all__ = [
    "DuckDBClient",
    "MetricRecord",
    "CandleRecord",
    "PerformanceRecord",
    "TimeInterval",
]

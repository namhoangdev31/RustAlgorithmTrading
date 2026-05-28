"""
Observability Storage Integration Helpers

Provides storage integration helpers for control-plane and collectors.
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import logging
import os

from .duckdb_client import DuckDBClient
from .postgres_client import PostgresClient
from .schemas import MetricRecord, TimeInterval

logger = logging.getLogger(__name__)


class StorageManager:
    """
    Unified storage manager for observability runtime

    Manages DuckDB (analytics) and operational storage (Postgres).
    """

    def __init__(
        self,
        duckdb_path: str = "data/observability.duckdb",
        postgres_dsn: Optional[str] = os.getenv("DATABASE_URL"),
    ):
        """
        Initialize storage manager

        Args:
            duckdb_path: Path to DuckDB database
            postgres_dsn: DSN for PostgreSQL (optional)
        """
        self.duckdb_path = duckdb_path
        self.postgres_dsn = postgres_dsn or "postgresql://postgres:postgres@localhost:5432/trading"
        
        self._duckdb: Optional[DuckDBClient] = None
        self._postgres: Optional[PostgresClient] = None
        self._initialized = False

    async def initialize(self) -> None:
        """Initialize database connections"""
        if self._initialized:
            return

        self._duckdb = DuckDBClient(self.duckdb_path)
        await self._duckdb.initialize()

        self._postgres = PostgresClient(self.postgres_dsn)
        await self._postgres.initialize()

        self._initialized = True
        logger.info("[cid:INIT] Storage manager initialized")

    async def close(self) -> None:
        """Close all database connections"""
        if self._duckdb:
            await self._duckdb.close()
        if self._postgres:
            await self._postgres.close()
        self._initialized = False
        logger.info("[cid:INIT] Storage manager closed")

    @property
    def duckdb(self) -> DuckDBClient:
        """Get DuckDB client"""
        if not self._initialized or not self._duckdb:
            raise RuntimeError("StorageManager not initialized")
        return self._duckdb

    @property
    def operational(self) -> PostgresClient:
        """Get operational storage client (Postgres)"""
        if not self._initialized or not self._postgres:
            raise RuntimeError("StorageManager not initialized or PostgreSQL not connected")
        return self._postgres

    # ========== Convenience Methods ==========

    async def record_metric(
        self,
        metric_name: str,
        value: float,
        symbol: Optional[str] = None,
        labels: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Record a single metric"""
        metric = MetricRecord(
            timestamp=datetime.now(timezone.utc),
            metric_name=metric_name,
            value=value,
            symbol=symbol,
            labels=labels,
        )
        await self.duckdb.insert_metric(metric)

    async def get_recent_metrics(
        self,
        metric_name: str,
        minutes: int = 60,
        symbol: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get recent metrics"""
        try:
            return await self.duckdb.get_metrics(
                metric_name=metric_name,
                start_time=datetime.now(timezone.utc) - timedelta(minutes=minutes),
                symbol=symbol,
            )
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to get metrics: {e}")
            raise RuntimeError(str(e))

    async def log_trade_execution(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        order_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Log a trade execution in operational storage"""
        try:
            return await self.operational.log_trade(
                timestamp=datetime.now(timezone.utc),
                symbol=symbol,
                side=side,
                quantity=quantity,
                price=price,
                order_id=order_id,
                status="executed",
                metadata=metadata,
            )
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to log trade: {e}")
            raise RuntimeError(str(e))

    async def get_trades(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        symbol: Optional[str] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Query trades from operational storage"""
        try:
            return await self.operational.get_trades(
                start_time=start_time,
                end_time=end_time,
                symbol=symbol,
                limit=limit
            )
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to get trades: {e}")
            raise RuntimeError(str(e))

    async def log_event(
        self,
        event_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> int:
        """Log a system event in operational storage"""
        try:
            return await self.operational.log_event(
                event_type=event_type,
                severity=severity,
                message=message,
                details=details,
                timestamp=datetime.now(timezone.utc)
            )
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to log event: {e}")
            raise RuntimeError(str(e))

    async def get_events(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Query events from operational storage"""
        try:
            return await self.operational.get_events(
                start_time=start_time,
                end_time=end_time,
                event_type=event_type,
                severity=severity,
                limit=limit
            )
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to get events: {e}")
            raise RuntimeError(str(e))

    async def get_trading_summary(
        self,
        hours: int = 24,
    ) -> Dict[str, Any]:
        """Get trading summary"""
        try:
            start_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            trade_stats = await self.operational.get_trade_stats(start_time)
            performance = await self.duckdb.get_performance_summary(start_time)

            return {
                "period": f"last_{hours}h",
                "trades": trade_stats,
                "performance": performance,
            }
        except Exception as e:
            logger.error(f"[cid:INIT] Failed to get trading summary: {e}")
            raise RuntimeError(str(e))


# Global storage manager instance
_storage_manager: Optional[StorageManager] = None


def get_storage_manager() -> StorageManager:
    """Get global storage manager instance"""
    global _storage_manager
    if _storage_manager is None:
        _storage_manager = StorageManager()
    return _storage_manager


@asynccontextmanager
async def storage_lifespan(app: Any) -> Any:
    """Storage lifespan context manager."""
    storage = get_storage_manager()
    await storage.initialize()
    yield {"storage": storage}
    await storage.close()


async def get_storage() -> StorageManager:
    """Return initialized storage manager."""
    storage = get_storage_manager()
    if not storage._initialized:
        await storage.initialize()
    return storage


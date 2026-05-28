"""
PostgreSQL Storage Client

Handles operational data persistence using PostgreSQL.
Used for trades, orders, and system events.
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

try:
    import asyncpg
except ImportError:
    asyncpg = None

logger = logging.getLogger(__name__)


class PostgresClient:
    """
    Asynchronous PostgreSQL client for operational data.
    Features parity with SQLiteClient for easy transition.
    """

    def __init__(self, dsn: str):
        """
        Initialize the Postgres client.

        Args:
            dsn: PostgreSQL connection string (dsn)
        """
        self.dsn = dsn
        self.pool = None
        if asyncpg is None:
            logger.warning(
                "asyncpg not installed. PostgreSQL storage will be unavailable."
            )

    async def initialize(self) -> bool:
        """Establish connection pool to PostgreSQL"""
        if asyncpg is None:
            return False

        try:
            # Using a pool for better performance in concurrent environments
            self.pool = await asyncpg.create_pool(
                dsn=self.dsn,
                min_size=1,
                max_size=10
            )
            logger.info("Connected to PostgreSQL pool")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return False

    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("PostgreSQL connection pool closed")

    # ========== Trade/Order Operations ==========

    async def log_trade(
        self,
        timestamp: datetime,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        order_id: Optional[str] = None,
        status: str = "filled",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> int:
        """
        Log a trade execution in PostgreSQL 'orders' table.
        Matches method signature of SQLiteClient.
        """
        if not self.pool:
            logger.error("Postgres pool not initialized")
            return 0

        try:
            # Ensure timestamp is UTC
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)

            # Using canonical 'orders' table from PRODUCTION_DEPLOYMENT.md
            query = """
                INSERT INTO orders (
                    order_id, symbol, side, order_type, quantity, price, status, submitted_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
            """
            val = await self.pool.fetchval(
                query,
                order_id or f"internal_{int(timestamp.timestamp())}",
                symbol.upper(),
                side.lower(),
                "market",
                quantity,
                price,
                status.lower(),
                timestamp,
            )
            return int(val) if val else 0
        except Exception as e:
            logger.error(f"Failed to log trade in Postgres: {e}")
            return 0

    async def get_trades(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        symbol: Optional[str] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Retrieve recent trades with filtering"""
        if not self.pool:
            return []

        try:
            if end_time is None:
                end_time = datetime.now(timezone.utc)
            
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)

            query = "SELECT * FROM orders WHERE submitted_at >= $1 AND submitted_at <= $2"
            params: List[Any] = [start_time, end_time]
            
            if symbol:
                query += " AND symbol = $3"
                params.append(symbol.upper())
            
            query += f" ORDER BY submitted_at DESC LIMIT ${len(params) + 1}"
            params.append(limit)

            rows = await self.pool.fetch(query, *params)
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to query trades from Postgres: {e}")
            return []

    async def get_trade_stats(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """Get aggregated trade statistics from Postgres"""
        if not self.pool:
            return {}

        try:
            if end_time is None:
                end_time = datetime.now(timezone.utc)
            
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)

            query = """
                SELECT
                    COUNT(*) as total_trades,
                    COUNT(DISTINCT symbol) as symbols_traded,
                    SUM(CASE WHEN lower(side) = 'buy' THEN 1 ELSE 0 END) as buy_count,
                    SUM(CASE WHEN lower(side) = 'sell' THEN 1 ELSE 0 END) as sell_count,
                    SUM(quantity * price) as total_volume
                FROM orders
                WHERE submitted_at >= $1 AND submitted_at <= $2
                  AND (lower(status) = 'filled' OR lower(status) = 'executed')
            """
            row = await self.pool.fetchrow(query, start_time, end_time)
            if not row:
                return {}

            return {
                "total_trades": row["total_trades"] or 0,
                "symbols_traded": row["symbols_traded"] or 0,
                "buy_count": row["buy_count"] or 0,
                "sell_count": row["sell_count"] or 0,
                "total_volume": float(row["total_volume"] or 0.0),
            }
        except Exception as e:
            logger.error(f"Failed to get trade stats from Postgres: {e}")
            return {}

    # ========== System Events Operations ==========

    async def log_event(
        self,
        event_type: str,
        severity: str,
        message: str,
        details: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> int:
        """Log a system event in Postgres 'risk_events' table"""
        if not self.pool:
            logger.error("Postgres pool not initialized")
            return 0

        try:
            if timestamp is None:
                timestamp = datetime.now(timezone.utc)
            elif timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=timezone.utc)

            query = """
                INSERT INTO risk_events (
                    event_type, severity, message, metadata, occurred_at
                ) VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            """
            # asyncpg handles dict to jsonb conversion automatically
            val = await self.pool.fetchval(
                query,
                event_type,
                severity.lower(),
                message,
                details, 
                timestamp,
            )
            return int(val) if val else 0
        except Exception as e:
            logger.error(f"Failed to log event in Postgres: {e}")
            return 0

    async def get_events(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 1000,
    ) -> List[Dict[str, Any]]:
        """Query system events from Postgres"""
        if not self.pool:
            return []

        try:
            if end_time is None:
                end_time = datetime.now(timezone.utc)
            
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)

            query = "SELECT * FROM risk_events WHERE occurred_at >= $1 AND occurred_at <= $2"
            params: List[Any] = [start_time, end_time]

            if event_type:
                query += f" AND event_type = ${len(params) + 1}"
                params.append(event_type)

            if severity:
                query += f" AND severity = ${len(params) + 1}"
                params.append(severity.lower())

            query += f" ORDER BY occurred_at DESC LIMIT ${len(params) + 1}"
            params.append(limit)

            rows = await self.pool.fetch(query, *params)
            return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Failed to query events from Postgres: {e}")
            return []

    async def get_event_counts(
        self,
        start_time: datetime,
        end_time: Optional[datetime] = None,
    ) -> Dict[str, Dict[str, int]]:
        """Get event counts grouped by type and severity"""
        if not self.pool:
            return {}

        try:
            if end_time is None:
                end_time = datetime.now(timezone.utc)
            
            if start_time.tzinfo is None:
                start_time = start_time.replace(tzinfo=timezone.utc)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)

            query = """
                SELECT event_type, severity, COUNT(*) as count
                FROM risk_events
                WHERE occurred_at >= $1 AND occurred_at <= $2
                GROUP BY event_type, severity
            """
            rows = await self.pool.fetch(query, start_time, end_time)

            counts: Dict[str, Dict[str, int]] = {}
            for row in rows:
                etype = row["event_type"]
                sev = row["severity"]
                if etype not in counts:
                    counts[etype] = {}
                counts[etype][sev] = row["count"]

            return counts
        except Exception as e:
            logger.error(f"Failed to get event counts from Postgres: {e}")
            return {}

    async def get_db_size(self) -> int:
        """Get total size of the database in bytes (Postgres specific)"""
        if not self.pool:
            return 0
        try:
            query = "SELECT pg_database_size(current_database())"
            val = await self.pool.fetchval(query)
            return int(val) if val else 0
        except Exception:
            return 0

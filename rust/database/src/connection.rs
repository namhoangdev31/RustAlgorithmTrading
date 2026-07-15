//! QuestDB database connection via ILP (InfluxDB Line Protocol)
//!
//! Writes time-series data to QuestDB using the high-performance ILP protocol.
//! Read queries are handled by the Go gateway via PgWire (port 8812).

use crate::error::{DatabaseError, Result};
use crate::models::*;

use questdb::ingress::{Buffer, Sender, SenderBuilder, TimestampNanos};
use std::sync::Mutex;
use std::time::Instant;

fn ilp_err(e: impl std::fmt::Display) -> DatabaseError {
    DatabaseError::Ilp(e.to_string())
}

/// High-level database manager using QuestDB ILP for writes.
///
/// Write path: Rust → ILP TCP → QuestDB:9009
/// Read path:  Go   → PgWire  → QuestDB:8812 (not handled here)
#[derive(Clone)]
pub struct DatabaseManager {
    inner: std::sync::Arc<Mutex<Sender>>,
    addr: String,
}

impl DatabaseManager {
    /// Create a new database manager connected to QuestDB via ILP.
    ///
    /// # Example
    ///
    /// ```no_run
    /// use database::DatabaseManager;
    ///
    /// # async fn example() -> anyhow::Result<()> {
    /// let db = DatabaseManager::new("questdb:9009").await?;
    /// # Ok(())
    /// # }
    /// ```
    pub async fn new<S: AsRef<str>>(addr: S) -> Result<Self> {
        let addr = addr.as_ref().to_string();
        let (host, port) = addr.rsplit_once(':')
            .ok_or_else(|| DatabaseError::Ilp(format!("invalid addr format '{}', expected host:port", addr)))?;
        let port: u16 = port.parse()
            .map_err(|e| DatabaseError::Ilp(format!("invalid port in '{}': {}", addr, e)))?;

        let sender = SenderBuilder::new(
            questdb::ingress::Protocol::Tcp,
            host,
            port,
        )
        .build()
        .map_err(|e| DatabaseError::Ilp(format!("failed to connect to QuestDB at {}: {}", addr, e)))?;

        tracing::info!("Connected to QuestDB ILP at {}", addr);

        Ok(Self {
            inner: std::sync::Arc::new(Mutex::new(sender)),
            addr,
        })
    }

    /// Initialize is a no-op for QuestDB — schema is created via init.sql.
    pub async fn initialize(&self) -> Result<()> {
        tracing::info!("QuestDB schema managed externally via init.sql");
        Ok(())
    }

    /// Create a new buffer from the sender (inherits config).
    fn new_buffer(&self) -> Result<Buffer> {
        let sender = self.inner.lock().map_err(|e| {
            DatabaseError::Ilp(format!("mutex poisoned: {}", e))
        })?;
        Ok(sender.new_buffer())
    }

    /// Insert a single metric record.
    pub async fn insert_metric(&self, metric: &MetricRecord) -> Result<()> {
        let mut buf = self.new_buffer()?;
        {
            let mut row = buf.table("trading_metrics").map_err(ilp_err)?;
            row = row.symbol("metric_name", &metric.metric_name).map_err(ilp_err)?;
            if let Some(ref sym) = metric.symbol {
                row = row.symbol("symbol", sym).map_err(ilp_err)?;
            }
            row = row.column_f64("value", metric.value).map_err(ilp_err)?;
            if let Some(ref labels) = metric.labels {
                let json = serde_json::to_string(labels)?;
                row = row.column_str("labels", &json).map_err(ilp_err)?;
            }
            row.at(TimestampNanos::from_datetime(metric.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_metrics_inserted_total").increment(1);
        Ok(())
    }

    /// Insert multiple metrics in a batch (high performance via ILP).
    pub async fn insert_metrics(&self, metrics: &[MetricRecord]) -> Result<()> {
        self.insert_metrics_blocking(metrics)
    }

    /// Insert multiple metrics from a blocking runtime.
    pub fn insert_metrics_blocking(&self, metrics: &[MetricRecord]) -> Result<()> {
        if metrics.is_empty() {
            return Ok(());
        }

        let start = Instant::now();
        let mut buf = self.new_buffer()?;

        for metric in metrics {
            let mut row = buf.table("trading_metrics").map_err(ilp_err)?;
            row = row.symbol("metric_name", &metric.metric_name).map_err(ilp_err)?;
            if let Some(ref sym) = metric.symbol {
                row = row.symbol("symbol", sym).map_err(ilp_err)?;
            }
            row = row.column_f64("value", metric.value).map_err(ilp_err)?;
            if let Some(ref labels) = metric.labels {
                let json = serde_json::to_string(labels)?;
                row = row.column_str("labels", &json).map_err(ilp_err)?;
            }
            row.at(TimestampNanos::from_datetime(metric.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }

        self.flush_buffer(&mut buf)?;

        let elapsed = start.elapsed();
        metrics::counter!("database_metrics_inserted_total").increment(metrics.len() as u64);
        metrics::histogram!("database_batch_insert_duration_ms").record(elapsed.as_millis() as f64);

        tracing::debug!("Inserted {} metrics in {:?}", metrics.len(), elapsed);
        Ok(())
    }

    /// Insert a strategy performance snapshot.
    pub async fn insert_performance_record(&self, record: &PerformanceRecord) -> Result<()> {
        self.insert_performance_records(std::slice::from_ref(record)).await
    }

    /// Insert multiple performance snapshots.
    pub async fn insert_performance_records(&self, records: &[PerformanceRecord]) -> Result<()> {
        self.insert_performance_records_blocking(records)
    }

    /// Insert multiple performance snapshots from a blocking runtime.
    pub fn insert_performance_records_blocking(&self, records: &[PerformanceRecord]) -> Result<()> {
        if records.is_empty() {
            return Ok(());
        }

        let start = Instant::now();
        let mut buf = self.new_buffer()?;

        for record in records {
            let mut row = buf.table("performance_history").map_err(ilp_err)?;
            row = row.column_f64("portfolio_value", record.portfolio_value).map_err(ilp_err)?;
            row = row.column_f64("pnl", record.pnl).map_err(ilp_err)?;
            if let Some(sr) = record.sharpe_ratio {
                row = row.column_f64("sharpe_ratio", sr).map_err(ilp_err)?;
            }
            if let Some(md) = record.max_drawdown {
                row = row.column_f64("max_drawdown", md).map_err(ilp_err)?;
            }
            if let Some(wr) = record.win_rate {
                row = row.column_f64("win_rate", wr).map_err(ilp_err)?;
            }
            row = row.column_i64("total_trades", record.total_trades as i64).map_err(ilp_err)?;
            row.at(TimestampNanos::from_datetime(record.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }

        self.flush_buffer(&mut buf)?;

        let elapsed = start.elapsed();
        metrics::counter!("database_performance_records_inserted_total").increment(records.len() as u64);
        metrics::histogram!("database_performance_batch_insert_duration_ms").record(elapsed.as_millis() as f64);

        tracing::debug!("Inserted {} performance records in {:?}", records.len(), elapsed);
        Ok(())
    }

    /// Insert a candle record.
    pub async fn insert_candle(&self, candle: &CandleRecord) -> Result<()> {
        let mut buf = self.new_buffer()?;
        {
            let mut row = buf.table("trading_candles").map_err(ilp_err)?;
            row = row.symbol("symbol", &candle.symbol).map_err(ilp_err)?;
            row = row.column_f64("open", candle.open).map_err(ilp_err)?;
            row = row.column_f64("high", candle.high).map_err(ilp_err)?;
            row = row.column_f64("low", candle.low).map_err(ilp_err)?;
            row = row.column_f64("close", candle.close).map_err(ilp_err)?;
            row = row.column_i64("volume", candle.volume).map_err(ilp_err)?;
            if let Some(tc) = candle.trade_count {
                row = row.column_i64("trade_count", tc as i64).map_err(ilp_err)?;
            }
            row.at(TimestampNanos::from_datetime(candle.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_candles_inserted_total").increment(1);
        Ok(())
    }

    /// Batch-write normalized quotes. One ILP flush is used for the entire batch.
    pub async fn insert_quant_quotes(&self, records: &[QuantQuoteRecord]) -> Result<()> {
        if records.is_empty() {
            return Ok(());
        }
        let mut buf = self.new_buffer()?;
        for record in records {
            let mut row = buf.table("quant_quotes_v1").map_err(ilp_err)?;
            row = row.symbol("provider", &record.provider).map_err(ilp_err)?;
            row = row.symbol("asset_class", &record.asset_class).map_err(ilp_err)?;
            row = row.symbol("symbol", &record.symbol).map_err(ilp_err)?;
            if let Some(value) = record.bid {
                row = row.column_f64("bid", value).map_err(ilp_err)?;
            }
            if let Some(value) = record.ask {
                row = row.column_f64("ask", value).map_err(ilp_err)?;
            }
            if let Some(value) = record.bid_size {
                row = row.column_f64("bid_size", value).map_err(ilp_err)?;
            }
            if let Some(value) = record.ask_size {
                row = row.column_f64("ask_size", value).map_err(ilp_err)?;
            }
            if let Some(value) = record.last {
                row = row.column_f64("last", value).map_err(ilp_err)?;
            }
            row = row.column_i64("source_sequence", record.source_sequence).map_err(ilp_err)?;
            row = row.column_bool("is_snapshot", record.is_snapshot).map_err(ilp_err)?;
            row.at(TimestampNanos::from_datetime(record.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_quant_quotes_inserted_total").increment(records.len() as u64);
        Ok(())
    }

    /// Batch-write normalized candles to quant_candles_v2.
    pub async fn insert_quant_candles(&self, records: &[QuantCandleRecord]) -> Result<()> {
        if records.is_empty() {
            return Ok(());
        }
        let mut buf = self.new_buffer()?;
        for record in records {
            let mut row = buf.table("quant_candles_v2").map_err(ilp_err)?;
            row = row.symbol("provider", &record.provider).map_err(ilp_err)?;
            row = row.symbol("asset_class", &record.asset_class).map_err(ilp_err)?;
            row = row.symbol("symbol", &record.symbol).map_err(ilp_err)?;
            row = row.symbol("interval", &record.interval).map_err(ilp_err)?;
            row = row.column_f64("open", record.open).map_err(ilp_err)?;
            row = row.column_f64("high", record.high).map_err(ilp_err)?;
            row = row.column_f64("low", record.low).map_err(ilp_err)?;
            row = row.column_f64("close", record.close).map_err(ilp_err)?;
            row = row.column_f64("volume", record.volume).map_err(ilp_err)?;
            if let Some(value) = record.vwap {
                row = row.column_f64("vwap", value).map_err(ilp_err)?;
            }
            if let Some(value) = record.trade_count {
                row = row.column_i64("trade_count", value).map_err(ilp_err)?;
            }
            row = row.column_i64("source_sequence", record.source_sequence).map_err(ilp_err)?;
            row = row.column_bool("is_final", record.is_final).map_err(ilp_err)?;
            row.at(TimestampNanos::from_datetime(record.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_quant_candles_inserted_total").increment(records.len() as u64);
        Ok(())
    }

    /// Insert a trade record (analytics copy — canonical in PostgreSQL).
    pub async fn insert_trade(&self, trade: &TradeRecord) -> Result<()> {
        let mut buf = self.new_buffer()?;
        {
            let mut row = buf.table("trading_trades").map_err(ilp_err)?;
            row = row.symbol("symbol", &trade.symbol).map_err(ilp_err)?;
            row = row.symbol("side", &trade.side).map_err(ilp_err)?;
            row = row.column_str("trade_id", &trade.trade_id).map_err(ilp_err)?;
            row = row.column_str("order_id", &trade.order_id).map_err(ilp_err)?;
            row = row.column_f64("quantity", trade.quantity).map_err(ilp_err)?;
            row = row.column_f64("price", trade.price).map_err(ilp_err)?;
            row = row.column_f64("commission", trade.commission).map_err(ilp_err)?;
            row = row.column_f64("trade_value", trade.trade_value).map_err(ilp_err)?;
            if let Some(ref liq) = trade.liquidity {
                row = row.symbol("liquidity", liq).map_err(ilp_err)?;
            }
            row.at(TimestampNanos::from_datetime(trade.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_trades_inserted_total").increment(1);
        Ok(())
    }

    /// Log a system event.
    pub async fn insert_event(&self, event: &SystemEvent) -> Result<()> {
        self.insert_event_blocking(event)
    }

    /// Log a system event from a blocking runtime.
    pub fn insert_event_blocking(&self, event: &SystemEvent) -> Result<()> {
        let mut buf = self.new_buffer()?;
        {
            let mut row = buf.table("system_events").map_err(ilp_err)?;
            row = row.symbol("event_type", &event.event_type).map_err(ilp_err)?;
            row = row.symbol("severity", &event.severity).map_err(ilp_err)?;
            row = row.column_str("message", &event.message).map_err(ilp_err)?;
            if let Some(ref details) = event.details {
                let json = serde_json::to_string(details)?;
                row = row.column_str("details", &json).map_err(ilp_err)?;
            }
            row.at(TimestampNanos::from_datetime(event.timestamp).map_err(ilp_err)?).map_err(ilp_err)?;
        }
        self.flush_buffer(&mut buf)?;
        metrics::counter!("database_events_logged_total").increment(1);
        Ok(())
    }

    /// Alias for insert_event for backward compatibility
    pub async fn log_event(&self, event: &SystemEvent) -> Result<()> {
        self.insert_event(event).await
    }

    /// Flush a buffer to QuestDB. Graceful degradation: log warning but don't crash.
    fn flush_buffer(&self, buf: &mut Buffer) -> Result<()> {
        let mut sender = self.inner.lock().map_err(|e| {
            DatabaseError::Ilp(format!("mutex poisoned: {}", e))
        })?;
        sender.flush(buf).map_err(|e| {
            tracing::warn!("QuestDB flush failed (degraded mode): {}", e);
            metrics::counter!("database_flush_failures_total").increment(1);
            DatabaseError::Ilp(e.to_string())
        })
    }

    /// Get the QuestDB ILP address.
    pub fn addr(&self) -> &str {
        &self.addr
    }
}

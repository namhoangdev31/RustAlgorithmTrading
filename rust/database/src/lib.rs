//! QuestDB Database Layer for Trading System
//!
//! This module provides a high-performance, type-safe database layer using QuestDB
//! for time-series analytics data storage via ILP (InfluxDB Line Protocol).
//!
//! # Architecture
//!
//! - **Write path**: Rust → ILP TCP → QuestDB:9009 (this crate)
//! - **Read path**:  Go   → PgWire  → QuestDB:8812 (gateway service)
//!
//! # Features
//!
//! - **High-throughput writes**: ILP protocol (~4M rows/sec)
//! - **Type-Safe Models**: Compile-time query validation
//! - **Graceful Degradation**: QuestDB down → log warning, don't crash
//!
//! # Example
//!
//! ```no_run
//! use database::{DatabaseManager, MetricRecord};
//! use chrono::Utc;
//!
//! # async fn example() -> anyhow::Result<()> {
//! // Connect to QuestDB
//! let db = DatabaseManager::new("questdb:9009").await?;
//!
//! // Insert metric
//! let metric = MetricRecord {
//!     timestamp: Utc::now(),
//!     metric_name: "order_latency_ms".to_string(),
//!     value: 42.5,
//!     symbol: Some("BTC/USD".to_string()),
//!     labels: None,
//! };
//! db.insert_metric(&metric).await?;
//! # Ok(())
//! # }
//! ```

pub mod connection;
pub mod error;
pub mod models;

// Re-exports for convenience
pub use connection::DatabaseManager;
pub use error::{DatabaseError, Result};
pub use models::*;

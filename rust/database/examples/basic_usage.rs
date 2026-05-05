//! Basic usage example for the database module

use chrono::Utc;
use database::{CandleRecord, DatabaseManager, MetricRecord, SystemEvent, TimeInterval};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Create database
    let db = DatabaseManager::new("examples/trading_metrics.duckdb").await?;
    db.initialize().await?;

    println!("✓ Database initialized");

    // Insert single metric
    let metric = MetricRecord::new("order_latency_ms", 42.5)
        .with_symbol("BTC/USD")
        .add_label("exchange", "alpaca");

    db.insert_metric(&metric).await?;
    println!("✓ Inserted single metric");

    // Insert batch of metrics
    let metrics: Vec<MetricRecord> = (0..100)
        .map(|i| MetricRecord::new("price", 50000.0 + i as f64).with_symbol("BTC/USD"))
        .collect();

    db.insert_metrics(&metrics).await?;
    println!("✓ Inserted {} metrics", metrics.len());

    // Query metrics
    let retrieved = db.get_metrics("price", Some("BTC/USD"), None, 10).await?;
    println!(
        "✓ Retrieved {} metrics (showing latest 10)",
        retrieved.len()
    );

    for metric in retrieved.iter().take(3) {
        println!("  - {}: {}", metric.metric_name, metric.value);
    }

    // Insert candles
    let candle = CandleRecord::new(
        Utc::now(),
        "ETH/USD",
        3000.0,
        3100.0,
        2900.0,
        3050.0,
        1000000,
    );

    db.insert_candle(&candle).await?;
    println!("✓ Inserted candle");

    // Get aggregated metrics
    let aggregated = db
        .get_aggregated_metrics("price", TimeInterval::Minute, None, "avg")
        .await?;

    println!("✓ Retrieved {} aggregated metrics", aggregated.len());

    // Log system events
    let event = SystemEvent::info("Example completed successfully");
    db.log_event(&event).await?;
    println!("✓ Logged system event");

    // Get database statistics
    let stats = db.get_table_stats().await?;
    println!("\n📊 Database Statistics:");
    for stat in stats {
        println!("  Table: {}", stat.table_name);
        println!("    Rows: {}", stat.row_count);
        if let (Some(min), Some(max)) = (stat.min_timestamp, stat.max_timestamp) {
            println!(
                "    Time range: {} to {}",
                min.format("%Y-%m-%d %H:%M:%S"),
                max.format("%Y-%m-%d %H:%M:%S")
            );
        }
    }

    // Connection pool stats
    let pool_stats = db.pool_stats();
    println!("\n🔌 Connection Pool:");
    println!("  Connections: {}", pool_stats.connections);
    println!("  Idle: {}", pool_stats.idle_connections);

    // Optimize database
    db.optimize().await?;
    println!("\n✓ Database optimized");

    println!("\n✅ Example completed successfully!");
    println!("Database file: {}", db.path().display());

    Ok(())
}

use chrono::Utc;
use common::config::RiskConfig;
use common::types::{Position, Price, Quantity, Side, Symbol};
use risk_manager::stops::{StopLossConfig, StopManager};
use std::time::Instant;

#[test]
fn test_stop_manager_lookup_performance_1000() {
    let config = RiskConfig {
        stop_loss_percent: 5.0,
        ..RiskConfig::default()
    };

    let mut manager = StopManager::new(config);
    let mut positions = Vec::new();

    // Setup 1000 positions with stops
    for i in 0..1000 {
        let symbol = Symbol(format!("SYM{}", i));
        let position = Position {
            symbol: symbol.clone(),
            side: Side::Bid,
            quantity: Quantity(100.0),
            entry_price: Price(150.0),
            current_price: Price(150.0),
            unrealized_pnl: 0.0,
            realized_pnl: 0.0,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let stop_config = StopLossConfig::static_stop(5.0).unwrap();
        manager
            .set_stop(&position, stop_config)
            .expect("Set stop failed");
        positions.push(position);
    }

    // Measure performance of 10,000 checks (10 passes over all positions)
    let iterations = 10;
    let started = Instant::now();

    for _ in 0..iterations {
        for pos in &positions {
            let _ = manager.check(pos, "bench-cid");
        }
    }

    let elapsed = started.elapsed().as_secs_f64();
    let total_checks = (iterations * 1000) as f64;
    let avg_ms = (elapsed * 1000.0) / total_checks;

    println!("StopManager check performance: {:.6}ms per check", avg_ms);

    // KPI Requirement: <= 0.2ms
    assert!(
        avg_ms <= 0.2,
        "Average stop-loss check latency too high: {:.6}ms (threshold 0.2ms)",
        avg_ms
    );
}

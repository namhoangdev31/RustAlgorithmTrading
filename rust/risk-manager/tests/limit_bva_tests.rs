use common::types::{Order, Symbol, Side, OrderType, Quantity, Price, RiskDecision, RiskReason};
use common::config::RiskConfig;
use risk_manager::LimitChecker;
use chrono::Utc;
use std::time::Instant;

#[test]
fn test_symbol_volume_limit_bva() {
    let mut config = RiskConfig::default();
    config.max_position_size = 1000.0; // $1000 limit
    
    let checker = LimitChecker::new(config);
    let sym = Symbol("AAPL".to_string());
    
    // 1. limit - 1 ($999) => ALLOW
    let order_under = Order {
        order_id: "1".into(), client_order_id: "c1".into(),
        symbol: sym.clone(), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(9.99), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_under, "cid-under");
    assert_eq!(report.decision, RiskDecision::Allow);
    
    // 2. limit ($1000) => ALLOW (as per policy: limit should pass)
    let order_at = Order {
        order_id: "2".into(), client_order_id: "c2".into(),
        symbol: sym.clone(), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(10.0), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_at, "cid-at");
    assert_eq!(report.decision, RiskDecision::Allow);
    
    // 3. limit + 1 ($1001) => REJECT
    let order_over = Order {
        order_id: "3".into(), client_order_id: "c3".into(),
        symbol: sym.clone(), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(10.01), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_over, "cid-over");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(report.reason_code, Some(RiskReason::SymbolVolumeLimitExceeded));
    assert!(report.limit_snapshot.is_some());
}

#[test]
fn test_strategy_allocation_limit_bva() {
    let mut config = RiskConfig::default();
    config.max_position_size = 10_000.0;       // Keep symbol-level check permissive
    config.max_notional_exposure = 1_000.0;    // Strategy-level guardrail under test

    let checker = LimitChecker::new(config);
    let sym = Symbol("AAPL".to_string());

    // 1. limit - 1 ($999) => ALLOW
    let order_under = Order {
        order_id: "s1".into(), client_order_id: "sc1".into(),
        symbol: sym.clone(), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(9.99), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_under, "cid-strategy-under");
    assert_eq!(report.decision, RiskDecision::Allow);

    // 2. limit ($1000) => ALLOW
    let order_at = Order {
        order_id: "s2".into(), client_order_id: "sc2".into(),
        symbol: sym.clone(), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(10.0), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_at, "cid-strategy-at");
    assert_eq!(report.decision, RiskDecision::Allow);

    // 3. limit + 1 ($1001) => REJECT
    let order_over = Order {
        order_id: "s3".into(), client_order_id: "sc3".into(),
        symbol: sym, side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(10.01), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };
    let report = checker.check_with_report(&order_over, "cid-strategy-over");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(report.reason_code, Some(RiskReason::StrategyAllocationLimitExceeded));
    assert!(report.limit_snapshot.is_some());
}

#[test]
fn test_risk_lookup_overhead_within_threshold() {
    let mut config = RiskConfig::default();
    config.max_position_size = 10_000.0;
    config.max_notional_exposure = 50_000.0;

    let checker = LimitChecker::new(config);
    let order = Order {
        order_id: "perf-1".into(), client_order_id: "perf-c1".into(),
        symbol: Symbol("AAPL".to_string()), side: Side::Bid, order_type: OrderType::Limit,
        quantity: Quantity(1.0), price: Some(Price(100.0)),
        stop_price: None, status: common::types::OrderStatus::Pending,
        filled_quantity: Quantity(0.0), average_price: None,
        created_at: Utc::now(), updated_at: Utc::now(),
    };

    let iterations: u32 = 20_000;
    let started = Instant::now();
    for _ in 0..iterations {
        let report = checker.check_with_report(&order, "cid-perf");
        assert_eq!(report.decision, RiskDecision::Allow);
    }
    let elapsed = started.elapsed().as_secs_f64();
    let avg_ms = (elapsed * 1000.0) / f64::from(iterations);

    // W05 guardrail: overhead should not exceed 0.2ms per lookup.
    assert!(
        avg_ms <= 0.2,
        "Average risk lookup overhead too high: {:.6}ms (threshold 0.2ms)",
        avg_ms
    );
}

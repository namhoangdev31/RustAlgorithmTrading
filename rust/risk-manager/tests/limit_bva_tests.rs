use common::types::{
    Order, OrderStatus, OrderType, Position, Price, Quantity, RiskDecision, RiskReason, Side,
    Symbol,
};
use common::config::RiskConfig;
use risk_manager::LimitChecker;
use chrono::Utc;
use std::time::Instant;

fn create_order(symbol: &str, side: Side, quantity: f64, price: Option<f64>) -> Order {
    Order {
        order_id: format!("order-{}-{}", symbol, quantity),
        client_order_id: format!("client-{}-{}", symbol, quantity),
        symbol: Symbol(symbol.to_string()),
        side,
        order_type: match price {
            Some(_) => OrderType::Limit,
            None => OrderType::Market,
        },
        quantity: Quantity(quantity),
        price: price.map(Price),
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

fn create_position(symbol: &str, side: Side, quantity: f64, price: f64) -> Position {
    Position {
        symbol: Symbol(symbol.to_string()),
        side,
        quantity: Quantity(quantity),
        entry_price: Price(price),
        current_price: Price(price),
        unrealized_pnl: 0.0,
        realized_pnl: 0.0,
        opened_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

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

#[test]
fn test_max_open_positions_projected_rejection() {
    let mut config = RiskConfig::default();
    config.max_position_size = 10_000.0;
    config.max_notional_exposure = 100_000.0;
    config.max_open_positions = 2;

    let mut checker = LimitChecker::new(config);
    checker.update_position(create_position("AAPL", Side::Bid, 10.0, 100.0));
    checker.update_position(create_position("MSFT", Side::Bid, 10.0, 100.0));

    let order = create_order("NVDA", Side::Bid, 1.0, Some(100.0));
    let report = checker.check_with_report(&order, "cid-open-limit");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(
        report.reason_code,
        Some(RiskReason::StrategyAllocationLimitExceeded)
    );

    let snapshot = report.limit_snapshot.expect("snapshot must be present");
    assert_eq!(snapshot["current_open_positions"].as_u64(), Some(2));
    assert_eq!(snapshot["projected_open_positions"].as_u64(), Some(3));
    assert_eq!(snapshot["max_open_positions"].as_u64(), Some(2));
}

#[test]
fn test_position_projection_allows_reducing_order() {
    let mut config = RiskConfig::default();
    config.max_position_size = 10_000.0;
    config.max_notional_exposure = 100_000.0;

    let mut checker = LimitChecker::new(config);
    checker.update_position(create_position("AAPL", Side::Bid, 100.0, 100.0));

    // Existing exposure = 10,000. Selling 20 should reduce projected exposure to 8,000.
    let reduce_order = create_order("AAPL", Side::Ask, 20.0, Some(100.0));
    let report = checker.check_with_report(&reduce_order, "cid-reduce");
    assert_eq!(report.decision, RiskDecision::Allow);
}

#[test]
fn test_position_projection_handles_reversal_without_false_reject() {
    let mut config = RiskConfig::default();
    // Keep order-size gate permissive so this test isolates projected-position behavior.
    config.max_position_size = 20_000.0;
    config.max_notional_exposure = 100_000.0;

    let mut checker = LimitChecker::new(config);
    checker.update_position(create_position("AAPL", Side::Bid, 100.0, 100.0));

    // Reverse from +100 to -50 -> projected notional is 5,000 (should pass max_position_size).
    let reverse_order = create_order("AAPL", Side::Ask, 150.0, Some(100.0));
    let report = checker.check_with_report(&reverse_order, "cid-reversal");
    assert_eq!(report.decision, RiskDecision::Allow);
}

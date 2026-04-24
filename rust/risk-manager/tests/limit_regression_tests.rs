use chrono::Utc;
use common::config::RiskConfig;
use common::types::{
    Order, OrderStatus, OrderType, Position, Price, Quantity, RiskDecision, RiskReason, Side,
    Symbol,
};
use risk_manager::LimitChecker;

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
fn test_market_order_without_price_is_allowed() {
    let checker = LimitChecker::new(RiskConfig::default());
    let order = create_order("GOOG", Side::Bid, 10.0, None);
    let report = checker.check_with_report(&order, "cid-market");
    assert_eq!(report.decision, RiskDecision::Allow);
}

#[test]
fn test_zero_quantity_order_is_allowed() {
    let checker = LimitChecker::new(RiskConfig::default());
    let mut order = create_order("MSFT", Side::Bid, 0.0, Some(300.0));
    order.status = OrderStatus::Rejected;
    let report = checker.check_with_report(&order, "cid-zero");
    assert_eq!(report.decision, RiskDecision::Allow);
}

#[test]
fn test_negative_ask_quantity_is_allowed() {
    let checker = LimitChecker::new(RiskConfig::default());
    let order = create_order("AMD", Side::Ask, -100.0, Some(120.0));
    let report = checker.check_with_report(&order, "cid-negative");
    // Negative quantity with ASK side effectively increases projected long exposure.
    // System must reject this ambiguous payload under current guardrails.
    assert_eq!(report.decision, RiskDecision::Reject);
}

#[test]
fn test_large_notional_order_is_rejected() {
    let checker = LimitChecker::new(RiskConfig::default());
    let order = create_order("TSLA", Side::Bid, 1_000.0, Some(250.0));
    let report = checker.check_with_report(&order, "cid-large");
    assert_eq!(report.decision, RiskDecision::Reject);
}

#[test]
fn test_fractional_price_still_enforces_limits() {
    let checker = LimitChecker::new(RiskConfig::default());
    let order = create_order("AAPL", Side::Bid, 100.0, Some(150.12345));
    let report = checker.check_with_report(&order, "cid-fractional");
    assert_eq!(report.decision, RiskDecision::Reject);
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

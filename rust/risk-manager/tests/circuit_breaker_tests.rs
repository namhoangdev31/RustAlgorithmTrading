use chrono::{Duration, Utc};
use common::config::RiskConfig;
use common::types::{Order, OrderStatus, OrderType, Price, Quantity, RiskDecision, Side, Symbol};
use risk_manager::{CircuitBreakerState, RiskManagerService, TripReason};

fn test_config() -> RiskConfig {
    RiskConfig {
        max_position_size: 100_000.0,
        max_notional_exposure: 250_000.0,
        max_open_positions: 5,
        stop_loss_percent: 5.0,
        trailing_stop_percent: 3.0,
        enable_circuit_breaker: true,
        max_loss_threshold: 10_000.0,
        sizing_amount: 0.0,
    }
}

fn build_order(symbol: &str) -> Order {
    Order {
        order_id: format!("order-{symbol}"),
        client_order_id: format!("client-{symbol}"),
        symbol: Symbol(symbol.to_string()),
        side: Side::Bid,
        order_type: OrderType::Limit,
        quantity: Quantity(1.0),
        price: Some(Price(100.0)),
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

fn advance_cooldown(service: &mut RiskManagerService) {
    service.set_circuit_breaker_tripped_at_for_test(Utc::now() - Duration::minutes(61));
    let report = service.validate_order(&build_order("AAPL"), "cid-cooldown-probe");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(
        service.circuit_breaker_state(),
        CircuitBreakerState::ResetPending
    );
}

#[test]
fn test_cb_closed_allows_valid_order() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    let report = service.validate_order(&build_order("AAPL"), "cid-closed");

    assert_eq!(report.decision, RiskDecision::Allow);
    assert_eq!(report.correlation_id, "cid-closed");
    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Closed);
}

#[test]
fn test_cb_trip_to_open_rejects_orders() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");

    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);

    let report = service.validate_order(&build_order("AAPL"), "cid-open-reject");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(
        report.reason_code,
        Some(common::types::RiskReason::CircuitBreakerTripped)
    );
    assert_eq!(report.correlation_id, "cid-open-reject");
}

#[test]
fn test_cb_reject_path_preserves_correlation_id() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::SystemHealth, "cid-trip-system");

    let report = service.validate_order(&build_order("AAPL"), "cid-reject-preserve");

    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(report.correlation_id, "cid-reject-preserve");
    assert_eq!(
        report.reason_code,
        Some(common::types::RiskReason::CircuitBreakerTripped)
    );
}

#[test]
fn test_cb_idempotent_trip_does_not_reset_cooldown() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-first");
    service.set_circuit_breaker_tripped_at_for_test(Utc::now() - Duration::minutes(61));

    service.trip_circuit_breaker(TripReason::DailyLoss, "cid-second");
    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);

    let report = service.validate_order(&build_order("AAPL"), "cid-after-cooldown");
    assert_eq!(report.decision, RiskDecision::Reject);
    assert_eq!(
        service.circuit_breaker_state(),
        CircuitBreakerState::ResetPending
    );
}

#[test]
fn test_cb_reset_before_cooldown_is_denied() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");

    service.approve_circuit_breaker_reset("cid-reset-early");
    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);
}

#[test]
fn test_cb_after_cooldown_moves_to_reset_pending() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");

    advance_cooldown(&mut service);
}

#[test]
fn test_cb_approved_reset_moves_to_half_open() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");
    advance_cooldown(&mut service);

    service.approve_circuit_breaker_reset("cid-reset-approved");
    assert_eq!(
        service.circuit_breaker_state(),
        CircuitBreakerState::HalfOpen
    );
}

#[test]
fn test_cb_probe_success_to_closed() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");
    advance_cooldown(&mut service);
    service.approve_circuit_breaker_reset("cid-reset-approved");

    service.record_circuit_breaker_probe_result(true, "cid-probe-pass");
    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Closed);

    let report = service.validate_order(&build_order("AAPL"), "cid-after-recover");
    assert_eq!(report.decision, RiskDecision::Allow);
}

#[test]
fn test_cb_probe_fail_to_open() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");
    advance_cooldown(&mut service);
    service.approve_circuit_breaker_reset("cid-reset-approved");

    service.record_circuit_breaker_probe_result(false, "cid-probe-fail");
    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);

    let report = service.validate_order(&build_order("AAPL"), "cid-after-fail");
    assert_eq!(report.decision, RiskDecision::Reject);
}

#[test]
fn test_cb_disabled_config() {
    let mut config = test_config();
    config.enable_circuit_breaker = false;
    let mut service = RiskManagerService::new(config).unwrap();

    assert_eq!(
        service.circuit_breaker_state(),
        CircuitBreakerState::Disabled
    );

    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");
    assert_eq!(
        service.circuit_breaker_state(),
        CircuitBreakerState::Disabled
    );

    let report = service.validate_order(&build_order("AAPL"), "cid-any");
    assert_eq!(report.decision, RiskDecision::Allow);
}

#[test]
fn test_cb_hot_reload_does_not_disable_open_breaker() {
    let mut service = RiskManagerService::new(test_config()).unwrap();
    service.trip_circuit_breaker(TripReason::Manual, "cid-trip");

    let mut reloaded = test_config();
    reloaded.enable_circuit_breaker = false;
    service.reload_risk_config(reloaded);

    assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);
    let report = service.validate_order(&build_order("AAPL"), "cid-still-open");
    assert_eq!(report.decision, RiskDecision::Reject);
}

#[test]
fn test_cb_stress_repeated_trip_recover_has_no_loop_trip() {
    let mut service = RiskManagerService::new(test_config()).unwrap();

    for idx in 0..5 {
        service.trip_circuit_breaker(TripReason::Manual, &format!("cid-trip-{idx}"));
        service.trip_circuit_breaker(TripReason::DailyLoss, &format!("cid-trip-repeat-{idx}"));
        assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Open);

        advance_cooldown(&mut service);
        service.approve_circuit_breaker_reset(&format!("cid-reset-{idx}"));
        assert_eq!(
            service.circuit_breaker_state(),
            CircuitBreakerState::HalfOpen
        );
        service.record_circuit_breaker_probe_result(true, &format!("cid-probe-{idx}"));
        assert_eq!(service.circuit_breaker_state(), CircuitBreakerState::Closed);
    }
}

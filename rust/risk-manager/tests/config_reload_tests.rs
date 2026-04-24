use chrono::Utc;
use common::config::RiskConfig;
use common::types::{Order, OrderStatus, OrderType, Price, Quantity, RiskDecision, Side, Symbol};
use risk_manager::{reload::parse_risk_config_toml, RiskManagerService};

fn build_order(symbol: &str, quantity: f64, price: f64) -> Order {
    Order {
        order_id: format!("order-{}-{}", symbol, quantity),
        client_order_id: format!("client-{}-{}", symbol, quantity),
        symbol: Symbol(symbol.to_string()),
        side: Side::Bid,
        order_type: OrderType::Limit,
        quantity: Quantity(quantity),
        price: Some(Price(price)),
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    }
}

fn valid_risk_limits_toml(max_notional_per_position: f64, max_daily_loss: f64) -> String {
    format!(
        r#"
[position_limits]
max_notional_per_position = {max_notional_per_position}
max_total_exposure = 50000.0
max_open_positions = 5

[loss_limits]
max_daily_loss = {max_daily_loss}

[stop_loss]
default_stop_loss_percent = 2.0
trailing_stop_percent = 1.0

[circuit_breaker]
enabled = true
daily_loss_threshold = {max_daily_loss}
"#
    )
}

#[test]
fn test_parse_risk_limits_toml_valid_mapping() {
    let cfg = parse_risk_config_toml(&valid_risk_limits_toml(12_500.0, 3_000.0)).unwrap();
    assert_eq!(cfg.max_position_size, 12_500.0);
    assert_eq!(cfg.max_notional_exposure, 50_000.0);
    assert_eq!(cfg.max_open_positions, 5);
    assert_eq!(cfg.stop_loss_percent, 2.0);
    assert_eq!(cfg.trailing_stop_percent, 1.0);
    assert!(cfg.enable_circuit_breaker);
    assert_eq!(cfg.max_loss_threshold, 3_000.0);
}

#[test]
fn test_parse_risk_limits_toml_daily_loss_mismatch_fails() {
    let content = r#"
[position_limits]
max_notional_per_position = 10000.0
max_total_exposure = 50000.0
max_open_positions = 5

[loss_limits]
max_daily_loss = 3000.0

[stop_loss]
default_stop_loss_percent = 2.0
trailing_stop_percent = 1.0

[circuit_breaker]
enabled = true
daily_loss_threshold = 2500.0
"#;

    let err = parse_risk_config_toml(content).unwrap_err();
    let msg = err.to_string();
    assert!(msg.contains("daily loss mismatch"));
}

#[test]
fn test_parse_risk_limits_toml_missing_required_field_fails() {
    let content = r#"
[position_limits]
max_notional_per_position = 10000.0
max_total_exposure = 50000.0
# max_open_positions missing

[loss_limits]
max_daily_loss = 3000.0

[stop_loss]
default_stop_loss_percent = 2.0
trailing_stop_percent = 1.0

[circuit_breaker]
enabled = true
daily_loss_threshold = 3000.0
"#;

    assert!(parse_risk_config_toml(content).is_err());
}

#[test]
fn test_hot_reload_success_updates_new_decisions() {
    let mut initial_cfg = RiskConfig::default();
    initial_cfg.max_position_size = 1_000.0;
    initial_cfg.max_notional_exposure = 100_000.0;

    let mut service = RiskManagerService::new(initial_cfg).unwrap();
    let order = build_order("AAPL", 15.0, 100.0); // notional = 1500

    let before = service.validate_order(&order, "cid-reload-before");
    assert_eq!(before.decision, RiskDecision::Reject);

    let reloaded_cfg = parse_risk_config_toml(&valid_risk_limits_toml(2_000.0, 3_000.0)).unwrap();
    service.reload_risk_config(reloaded_cfg);

    let after = service.validate_order(&order, "cid-reload-after");
    assert_eq!(after.decision, RiskDecision::Allow);
}

#[test]
fn test_hot_reload_failure_keeps_previous_effective_config() {
    let mut initial_cfg = RiskConfig::default();
    initial_cfg.max_position_size = 1_000.0;
    initial_cfg.max_notional_exposure = 100_000.0;

    let service = RiskManagerService::new(initial_cfg).unwrap();
    let order = build_order("AAPL", 15.0, 100.0); // notional = 1500

    let before = service.validate_order(&order, "cid-failed-reload-before");
    assert_eq!(before.decision, RiskDecision::Reject);

    // Simulate failed reload branch: parse fails so no config is applied.
    let failed_parse = parse_risk_config_toml(
        r#"
[position_limits]
max_notional_per_position = 5000.0
max_total_exposure = 50000.0
max_open_positions = 5

[loss_limits]
max_daily_loss = 4000.0

[stop_loss]
default_stop_loss_percent = 2.0
trailing_stop_percent = 1.0

[circuit_breaker]
enabled = true
daily_loss_threshold = 3000.0
"#,
    );
    assert!(failed_parse.is_err());

    let after = service.validate_order(&order, "cid-failed-reload-after");
    assert_eq!(after.decision, RiskDecision::Reject);
}

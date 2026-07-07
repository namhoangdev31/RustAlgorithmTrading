use chrono::Utc;
use common::config::{ExecutionConfig, ExecutionPolicy};
use common::types::{
    Order, OrderStatus, OrderType, Price, Quantity, RiskDecision, RiskReason, RiskReport, Side,
    Symbol, TradingMode,
};
use execution_engine::router::OrderRouter;
use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

fn get_test_config(mode: TradingMode) -> ExecutionConfig {
    let mut allowlist = Vec::new();
    allowlist.push("acc_allow_123".to_string());

    ExecutionConfig {
        trading_mode: mode,
        exchange_api_url: match mode {
            TradingMode::Live => "https://api.alpaca.markets/v2".to_string(),
            _ => "https://paper-api.alpaca.markets/v2".to_string(),
        },
        api_key: Some(match mode {
            TradingMode::Live => "AK_LIVE_123".to_string(),
            _ => "PK_PAPER_123".to_string(),
        }),
        api_secret: Some("secret_123".to_string()),
        rate_limit_per_second: 100,
        max_slippage_bps: 50.0,
        retry_attempts: 1,
        retry_delay_ms: 5,
        policy: ExecutionPolicy {
            live_trading_enabled: true,
            allowlist_accounts: allowlist,
            kill_switch_enabled: false,
        },
        zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
    }
}

fn get_valid_order() -> Order {
    Order {
        order_id: "ord_123".to_string(),
        client_order_id: "c_ord_123".to_string(),
        symbol: Symbol("AAPL".to_string()),
        side: Side::Bid,
        order_type: OrderType::Market,
        quantity: Quantity(10.0),
        price: None,
        stop_price: None,
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        account_id: Some("acc_allow_123".to_string()),
        external_proof: Some("proof_valid_123".to_string()),
    }
}

#[tokio::test]
async fn test_simulated_mode_fills_instantly() {
    let config = get_test_config(TradingMode::Simulated);
    let router = OrderRouter::new(config).unwrap();
    let order = get_valid_order();

    let result = router.route(order, None).await.unwrap();
    assert_eq!(result.status, OrderStatus::Filled);
    assert_eq!(result.filled_qty.0, 10.0);
}

#[tokio::test]
async fn test_live_fail_fast_policy_disabled() {
    let mut config = get_test_config(TradingMode::Live);
    config.policy.live_trading_enabled = false;

    let router = OrderRouter::new(config);
    assert!(router.is_err());
    let err = router.err().unwrap().to_string();
    assert!(err.contains("live trading must be enabled"));
}

#[tokio::test]
async fn test_live_fail_fast_paper_endpoint() {
    let mut config = get_test_config(TradingMode::Live);
    config.exchange_api_url = "https://paper-api.alpaca.markets/v2".to_string();

    let router = OrderRouter::new(config);
    assert!(router.is_err());
    let err = router.err().unwrap().to_string();
    assert!(err.contains("live config cannot use paper API endpoint"));
}

#[tokio::test]
async fn test_live_fail_fast_paper_credentials() {
    let mut config = get_test_config(TradingMode::Live);
    config.api_key = Some("PK_PAPER_123".to_string()); // starts with PK (paper)

    let router = OrderRouter::new(config);
    assert!(router.is_err());
    let err = router.err().unwrap().to_string();
    assert!(err.contains("live config cannot use paper credential profile"));
}

#[tokio::test]
async fn test_live_fail_fast_missing_allowlist() {
    let mut config = get_test_config(TradingMode::Live);
    config.policy.allowlist_accounts.clear();

    let router = OrderRouter::new(config);
    assert!(router.is_err());
    let err = router.err().unwrap().to_string();
    assert!(err.contains("live config lacks allowlist accounts"));
}

#[tokio::test]
async fn test_live_verify_external_preconditions_missing_account() {
    let config = get_test_config(TradingMode::Live);
    // Use simulated mode for routing tests so we don't hit Alpaca endpoints,
    // but check the routing pipeline's handling of Live checks.
    // Wait, the router checks config.trading_mode inside the route pipeline.
    // If we use Live mode, the router constructor requires correct credentials.
    // We configured correct keys and URLs, but submitting will make real HTTP calls to Alpaca!
    // Since we mock broker_client dynamically depending on mode, in our test config we can use
    // simulated mode but manually test validation, OR we can test the validation logic
    // which rejects BEFORE calling broker_client!
    // That means we can construct a Live router and it will reject because of missing account
    // or proof without ever calling the broker (since validations run first).
    let router = OrderRouter::new(config).unwrap();

    let mut order = get_valid_order();
    order.account_id = None;

    let result = router.route(order, None).await;
    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("Live orders must specify a non-empty account_id"));
}

#[tokio::test]
async fn test_live_verify_external_preconditions_invalid_account() {
    let config = get_test_config(TradingMode::Live);
    let router = OrderRouter::new(config).unwrap();

    let mut order = get_valid_order();
    order.account_id = Some("acc_unauthorized_999".to_string());

    let result = router.route(order, None).await;
    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("not in the allowlist"));
}

#[tokio::test]
async fn test_live_verify_external_preconditions_missing_proof() {
    let config = get_test_config(TradingMode::Live);
    let router = OrderRouter::new(config).unwrap();

    let mut order = get_valid_order();
    order.external_proof = None;

    let result = router.route(order, None).await;
    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("Live orders must specify a non-empty external_proof"));
}

#[tokio::test]
async fn test_live_verify_preconditions_runtime_kill_switch() {
    let config = get_test_config(TradingMode::Live);
    let router = OrderRouter::new(config).unwrap();
    router.trigger_runtime_kill_switch(true, "test-kill-switch-1");

    let order = get_valid_order();
    let result = router.route(order, None).await;
    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("Runtime kill switch is active"));
}

#[tokio::test]
async fn test_slippage_validation() {
    // Slippage checks run in all modes
    let config = get_test_config(TradingMode::Simulated);
    let router = OrderRouter::new(config).unwrap();

    let mut order = get_valid_order();
    order.order_type = OrderType::Limit;
    order.price = Some(Price(105.0)); // 105.0 limit price vs 100.0 market price = 5% = 500 bps

    // 500 bps is > 50 bps max allowed slippage in config
    let result = router
        .route_with_cb_hook(order, Some(100.0), None, None)
        .await;

    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("Slippage too high"));
}

#[tokio::test]
async fn test_risk_manager_callback_rejection() {
    let config = get_test_config(TradingMode::Simulated);
    let router = OrderRouter::new(config).unwrap();
    let order = get_valid_order();

    let risk_checker = Arc::new(|_ord: &Order, _cid: &str| RiskReport {
        decision: RiskDecision::Reject,
        reason_code: Some(RiskReason::MaxNotionalExposureExceeded),
        message: "Exposure limit reached".to_string(),
    });

    let result = router
        .route_with_cb_hook(order, None, None, Some(risk_checker))
        .await;

    assert!(result.is_err());
    let err = result.err().unwrap().to_string();
    assert!(err.contains("Risk check rejected order"));
}

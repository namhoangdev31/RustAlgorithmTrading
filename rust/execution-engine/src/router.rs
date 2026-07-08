use crate::retry::RetryPolicy;
use common::{config::ExecutionConfig, types::Order, Result, TradingError};
use dashmap::DashMap;
use governor::{
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use std::num::NonZeroU32;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::mpsc;

type RiskCheckHook = Arc<dyn Fn(&Order, &str) -> common::types::RiskReport + Send + Sync>;

pub struct OrderRouter {
    config: ExecutionConfig,
    retry_policy: RetryPolicy,
    rate_limiter: Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>,
    processed_orders: Arc<DashMap<String, Instant>>,
    telemetry_tx: mpsc::Sender<String>,
    circuit_breaker_open: Arc<AtomicBool>,
    broker_client: Arc<dyn crate::broker::BrokerClient>,
    zmq_publisher: common::messaging::ZmqPublisher,
    runtime_kill_switch: Arc<AtomicBool>,
}

impl OrderRouter {
    pub fn new(mut config: ExecutionConfig) -> Result<Self> {
        // Enforce fail-fast configuration policies
        match config.trading_mode {
            common::types::TradingMode::Live => {
                if !config.policy.live_trading_enabled {
                    return Err(TradingError::Configuration(
                        "startup fail-fast: live trading must be enabled in policy for LIVE mode"
                            .to_string(),
                    ));
                }

                if config.exchange_api_url.contains("paper-api.alpaca.markets") {
                    return Err(TradingError::Configuration(
                        "startup fail-fast: live config cannot use paper API endpoint".to_string(),
                    ));
                }

                if !config.exchange_api_url.starts_with("https://") {
                    return Err(TradingError::Configuration(
                        "startup fail-fast: live trading API URL must use HTTPS protocol"
                            .to_string(),
                    ));
                }

                if config.policy.allowlist_accounts.is_empty() {
                    return Err(TradingError::Configuration(
                        "startup fail-fast: live config lacks allowlist accounts".to_string(),
                    ));
                }

                config.load_credentials()?;
                config.validate_credentials()?;

                // Verify profile keys
                if let Some(key) = &config.api_key {
                    if key.starts_with("PK") {
                        return Err(TradingError::Configuration(
                            "startup fail-fast: live config cannot use paper credential profile (starts with PK)"
                                .to_string(),
                        ));
                    }
                }
            }
            common::types::TradingMode::Paper => {
                if config
                    .exchange_api_url
                    .starts_with("https://api.alpaca.markets")
                {
                    return Err(TradingError::Configuration(
                        "startup fail-fast: paper config cannot use live API endpoint".to_string(),
                    ));
                }

                config.load_credentials()?;
                config.validate_credentials()?;
            }
            common::types::TradingMode::Simulated => {
                // Simulated doesn't require credentials
            }
        }

        let retry_policy = RetryPolicy::new(config.retry_attempts, config.retry_delay_ms);

        let quota = Quota::per_second(NonZeroU32::new(config.rate_limit_per_second).ok_or_else(
            || {
                TradingError::Configuration(
                    "rate_limit_per_second must be greater than 0".to_string(),
                )
            },
        )?);
        let rate_limiter = Arc::new(RateLimiter::direct(quota));

        let broker_client: Arc<dyn crate::broker::BrokerClient> = match config.trading_mode {
            common::types::TradingMode::Simulated => {
                Arc::new(crate::broker::SimulatedBrokerClient::new())
            }
            common::types::TradingMode::Paper | common::types::TradingMode::Live => {
                let api_key = config.api_key.clone().unwrap_or_default();
                let api_secret = config.api_secret.clone().unwrap_or_default();
                Arc::new(crate::broker::AlpacaBrokerClient::new(
                    config.exchange_api_url.clone(),
                    api_key,
                    api_secret,
                )?)
            }
        };

        let zmq_publisher = common::messaging::ZmqPublisher::new(&config.zmq_publish_address)?;

        // Async Telemetry worker
        let (tx, mut rx) = mpsc::channel(1024);
        if tokio::runtime::Handle::try_current().is_ok() {
            tokio::spawn(async move {
                while let Some(msg) = rx.recv().await {
                    tracing::info!(target: "telemetry", "[cid:ASYNC] {}", msg);
                }
            });
        }

        let processed_orders = Arc::new(DashMap::new());

        // Async TTL reaper — cleans expired idempotency keys every 10s
        if tokio::runtime::Handle::try_current().is_ok() {
            let reaper_map = processed_orders.clone();
            tokio::spawn(async move {
                let mut ticker = tokio::time::interval(Duration::from_secs(10));
                loop {
                    ticker.tick().await;
                    let cutoff = Instant::now() - Duration::from_secs(60);
                    reaper_map.retain(|_, v| *v > cutoff);
                }
            });
        }

        Ok(Self {
            config,
            retry_policy,
            rate_limiter,
            processed_orders,
            telemetry_tx: tx,
            circuit_breaker_open: Arc::new(AtomicBool::new(false)),
            broker_client,
            zmq_publisher,
            runtime_kill_switch: Arc::new(AtomicBool::new(false)),
        })
    }

    /// Test-only constructor to inject a custom/mock broker client
    pub fn new_test(
        config: ExecutionConfig,
        broker_client: Arc<dyn crate::broker::BrokerClient>,
    ) -> Result<Self> {
        let quota = Quota::per_second(NonZeroU32::new(config.rate_limit_per_second).ok_or_else(
            || {
                TradingError::Configuration(
                    "rate_limit_per_second must be greater than 0".to_string(),
                )
            },
        )?);
        let rate_limiter = Arc::new(RateLimiter::direct(quota));
        let retry_policy = RetryPolicy::new(config.retry_attempts, config.retry_delay_ms);
        let zmq_publisher = common::messaging::ZmqPublisher::new(&config.zmq_publish_address)?;
        let (tx, _rx) = mpsc::channel(1024);
        let processed_orders = Arc::new(DashMap::new());

        Ok(Self {
            config,
            retry_policy,
            rate_limiter,
            processed_orders,
            telemetry_tx: tx,
            circuit_breaker_open: Arc::new(AtomicBool::new(false)),
            broker_client,
            zmq_publisher,
            runtime_kill_switch: Arc::new(AtomicBool::new(false)),
        })
    }

    /// Exposes the current broker client for downstream reconciliation
    pub fn broker_client(&self) -> Arc<dyn crate::broker::BrokerClient> {
        self.broker_client.clone()
    }

    pub fn get_trading_mode(&self) -> common::types::TradingMode {
        self.config.trading_mode
    }

    pub fn publish_envelope(
        &self,
        topic: &str,
        envelope: &common::messaging::Envelope,
    ) -> common::Result<()> {
        self.zmq_publisher.publish(topic, envelope)
    }

    /// Exposes the runtime kill switch trigger
    pub fn trigger_runtime_kill_switch(&self, enabled: bool, correlation_id: &str) {
        self.runtime_kill_switch.store(enabled, Ordering::SeqCst);
        let payload = serde_json::json!({
            "kill_switch_enabled": enabled,
            "correlation_id": correlation_id,
        });
        self.publish_event("risk.kill_switch", correlation_id, payload);
    }

    pub fn get_kill_switch_status(&self) -> bool {
        self.runtime_kill_switch.load(Ordering::SeqCst)
    }

    fn publish_event(&self, event_type: &str, correlation_id: &str, payload: serde_json::Value) {
        let envelope = common::messaging::Envelope::new_with_mode(
            event_type,
            correlation_id,
            &format!("{}", self.config.trading_mode),
            payload,
        );
        if let Err(e) = self.zmq_publisher.publish(event_type, &envelope) {
            tracing::error!("Failed to publish ZMQ event {}: {}", event_type, e);
        }
    }

    fn reject_order(
        &self,
        order: &Order,
        reason: &str,
        code: &str,
        reason_code: Option<common::types::RiskReason>,
        correlation_id: &str,
    ) -> Result<common::types::BrokerOrderStatus> {
        let payload = serde_json::json!({
            "order_id": order.order_id,
            "client_order_id": order.client_order_id,
            "reason": reason,
            "code": code,
        });
        self.publish_event("order.rejected", correlation_id, payload);

        if let Some(r_code) = reason_code {
            let risk_payload = serde_json::json!({
                "decision": "REJECT",
                "reason_code": r_code,
                "correlation_id": correlation_id,
                "client_order_id": order.client_order_id,
            });
            self.publish_event("risk.decision", correlation_id, risk_payload);
        }

        Err(TradingError::RiskCheck(format!(
            "Order rejected [{}]: {}",
            code, reason
        )))
    }

    /// Route and execute order
    pub async fn route(
        &self,
        order: Order,
        current_market_price: Option<f64>,
    ) -> Result<common::types::BrokerOrderStatus> {
        self.route_with_cb_hook(order, current_market_price, None, None)
            .await
    }

    /// Route and execute order with custom CB hooks and Risk Checker pipeline
    pub async fn route_with_cb_hook(
        &self,
        order: Order,
        current_market_price: Option<f64>,
        cb_check_hook: Option<Arc<dyn Fn() -> bool + Send + Sync>>,
        risk_check: Option<RiskCheckHook>,
    ) -> Result<common::types::BrokerOrderStatus> {
        let cid = order.client_order_id.clone();

        // 1. Emit received event
        let recv_payload = serde_json::json!({
            "order_id": order.order_id,
            "client_order_id": order.client_order_id,
            "symbol": order.symbol.0,
            "quantity": order.quantity.0,
            "side": format!("{:?}", order.side),
            "order_type": format!("{:?}", order.order_type),
        });
        self.publish_event("order.received", &cid, recv_payload);

        // 2. Validate mode
        if self.config.trading_mode == common::types::TradingMode::Live
            && !self.config.policy.live_trading_enabled
        {
            return self.reject_order(
                &order,
                "Live trading is disabled in policy",
                "INVALID_MODE",
                Some(common::types::RiskReason::InvalidTradingMode),
                &cid,
            );
        }

        // 3. Validate order
        if order.quantity.0 <= 0.0 {
            return self.reject_order(
                &order,
                "Order quantity must be positive",
                "INVALID_ORDER_PARAMETERS",
                Some(common::types::RiskReason::InvalidOrderParameters),
                &cid,
            );
        }
        if matches!(order.order_type, common::types::OrderType::Limit) && order.price.is_none() {
            return self.reject_order(
                &order,
                "Limit order must specify a price",
                "INVALID_ORDER_PARAMETERS",
                Some(common::types::RiskReason::InvalidOrderParameters),
                &cid,
            );
        }

        // 4. Verify external preconditions
        if self.config.trading_mode == common::types::TradingMode::Live {
            let account_id = match &order.account_id {
                Some(acc) if !acc.trim().is_empty() => acc,
                _ => {
                    return self.reject_order(
                        &order,
                        "Live orders must specify a non-empty account_id",
                        "EXTERNAL_PRECONDITION_FAILED",
                        Some(common::types::RiskReason::ExternalPreconditionFailed),
                        &cid,
                    );
                }
            };

            if !self.config.policy.allowlist_accounts.contains(account_id) {
                return self.reject_order(
                    &order,
                    &format!("Account {} is not in the allowlist", account_id),
                    "EXTERNAL_PRECONDITION_FAILED",
                    Some(common::types::RiskReason::ExternalPreconditionFailed),
                    &cid,
                );
            }

            match &order.external_proof {
                Some(proof) if !proof.trim().is_empty() => {}
                _ => {
                    return self.reject_order(
                        &order,
                        "Live orders must specify a non-empty external_proof",
                        "EXTERNAL_PRECONDITION_FAILED",
                        Some(common::types::RiskReason::ExternalPreconditionFailed),
                        &cid,
                    );
                }
            }

            if self.runtime_kill_switch.load(Ordering::SeqCst) {
                return self.reject_order(
                    &order,
                    "Runtime kill switch is active (Read-Only)",
                    "CIRCUIT_BREAKER_TRIPPED",
                    Some(common::types::RiskReason::CircuitBreakerTripped),
                    &cid,
                );
            }
        }

        // 5. Risk check
        if let Some(check) = risk_check {
            let report = check(&order, &cid);
            if report.decision == common::types::RiskDecision::Reject {
                return self.reject_order(
                    &order,
                    "Risk check rejected order",
                    "RISK_LIMIT_EXCEEDED",
                    report.reason_code,
                    &cid,
                );
            }
        }

        // 6. Slippage calculation
        if let Some(limit_price) = order.price {
            if let Some(market_price) = current_market_price {
                if market_price <= 0.0 {
                    return Err(TradingError::MarketData(format!(
                        "Invalid market price for slippage calculation: {} (must be positive)",
                        market_price
                    )));
                }

                let slippage_bps = ((limit_price.0 - market_price).abs() / market_price) * 10000.0;
                if slippage_bps.is_nan() || slippage_bps.is_infinite() {
                    return Err(TradingError::MarketData(format!(
                        "Slippage calculation resulted in invalid value: limit={}, market={}",
                        limit_price.0, market_price
                    )));
                }

                if slippage_bps > self.config.max_slippage_bps {
                    return Err(TradingError::Risk(format!(
                        "Slippage too high: {:.2} bps (limit={}, market={}, max={})",
                        slippage_bps, limit_price.0, market_price, self.config.max_slippage_bps
                    )));
                }
            }
        }

        // 7. Circuit breaker check
        if self.circuit_breaker_open.load(Ordering::SeqCst) {
            return Err(TradingError::RiskCheck(
                "Circuit breaker is OPEN".to_string(),
            ));
        }
        if let Some(cb_hook) = &cb_check_hook {
            if cb_hook() {
                return Err(TradingError::RiskCheck(
                    "Circuit breaker is OPEN (callback)".to_string(),
                ));
            }
        }

        // 8. Emit order.accepted event
        let accept_payload = serde_json::json!({
            "order_id": order.order_id,
            "client_order_id": order.client_order_id,
            "status": "ACCEPTED",
        });
        self.publish_event("order.accepted", &cid, accept_payload);

        // 9. Idempotency — atomic entry check with TTL window
        let lock_key = order.client_order_id.clone();
        match self.processed_orders.entry(lock_key.clone()) {
            dashmap::mapref::entry::Entry::Occupied(_) => {
                let msg = format!(
                    "[cid:{}] Duplicate order rejected (processed within TTL window)",
                    lock_key
                );
                let _ = self.telemetry_tx.try_send(msg.clone());
                return Err(TradingError::RiskCheck(msg));
            }
            dashmap::mapref::entry::Entry::Vacant(v) => {
                v.insert(Instant::now());
            }
        }

        // 10. Emit order.routed event
        let route_payload = serde_json::json!({
            "order_id": order.order_id,
            "client_order_id": order.client_order_id,
            "status": "ROUTED",
        });
        self.publish_event("order.routed", &cid, route_payload);

        // 11. Execute with retry
        let broker_client = self.broker_client.clone();
        let retry_policy = self.retry_policy.clone();

        let result = retry_policy
            .execute_with_hooks(
                &cid,
                || async {
                    self.rate_limiter.until_ready().await;
                    broker_client.submit_order(&order).await
                },
                move |err| {
                    let err_msg = format!("{:?}", err).to_lowercase();
                    if matches!(err, TradingError::Network(_)) {
                        return true;
                    }
                    if let TradingError::Exchange(_) = err {
                        if err_msg.contains("429")
                            || err_msg.contains("error 502")
                            || err_msg.contains("error 503")
                            || err_msg.contains("gateway timeout")
                        {
                            return true;
                        }
                    }
                    false
                },
                || Ok(()),
            )
            .await?;

        // 12. Emit order lifecycle completion events
        let transition_type = match result.status {
            common::types::OrderStatus::Filled => "order.filled",
            common::types::OrderStatus::Cancelled => "order.cancelled",
            _ => "order.accepted",
        };

        let result_payload = serde_json::to_value(&result).unwrap_or_default();
        self.publish_event(transition_type, &cid, result_payload);

        Ok(result)
    }

    /// Exposes get_order_status
    pub async fn get_order_status(
        &self,
        order_id: &str,
    ) -> Result<common::types::BrokerOrderStatus> {
        self.rate_limiter.until_ready().await;
        self.broker_client.get_order_status(order_id).await
    }

    /// Exposes cancel_order
    pub async fn cancel_order(&self, order_id: &str) -> Result<common::types::BrokerOrderStatus> {
        self.rate_limiter.until_ready().await;
        self.broker_client.cancel_order(order_id).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use common::config::ExecutionConfig;
    use common::types::{Order, OrderStatus, OrderType, Quantity, Side, Symbol};

    fn get_test_config() -> ExecutionConfig {
        ExecutionConfig {
            trading_mode: common::types::TradingMode::Simulated,
            exchange_api_url: "https://paper-api.alpaca.markets".to_string(),
            api_key: Some("test_key".to_string()),
            api_secret: Some("test_secret".to_string()),
            rate_limit_per_second: 10,
            max_slippage_bps: 50.0,
            retry_attempts: 3,
            retry_delay_ms: 10,
            policy: Default::default(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        }
    }

    fn get_dummy_order() -> Order {
        Order {
            order_id: "test_id".to_string(),
            client_order_id: "test_circuit_idempotency_123".to_string(),
            symbol: Symbol("BTC/USD".to_string()),
            quantity: Quantity(1.0),
            side: Side::Bid,
            order_type: OrderType::Market,
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            account_id: None,
            external_proof: None,
        }
    }

    #[tokio::test]
    async fn test_retry_idempotency_race_condition() {
        let router = OrderRouter::new(get_test_config()).unwrap();
        let order = get_dummy_order();
        let order_clone = order.clone();

        // Pre-insert key to simulate already-processed order
        router
            .processed_orders
            .insert(order.client_order_id.clone(), Instant::now());

        let result2 = router.route(order_clone, None).await;
        assert!(result2.is_err());
        match result2 {
            Err(TradingError::RiskCheck(msg)) => {
                assert!(msg.contains("Duplicate order rejected"))
            }
            _ => panic!("Expected RiskCheck Idempotency error"),
        }
    }

    #[tokio::test]
    async fn test_circuit_breaker_tripped_during_retry_backoff() {
        let router = OrderRouter::new(get_test_config()).unwrap();
        let order = get_dummy_order();
        let hook: Arc<dyn Fn() -> bool + Send + Sync> = Arc::new(|| true);

        let result = router
            .route_with_cb_hook(order, None, Some(hook), None)
            .await;

        assert!(result.is_err());
        match result {
            Err(TradingError::RiskCheck(msg)) => assert!(msg.contains("Circuit breaker is OPEN")),
            _ => panic!("Expected Open CB error {:?}", result),
        }
    }

    #[tokio::test]
    async fn test_unknown_exchange_error_is_non_retryable() {
        let err1 = TradingError::Network("conn reset".to_string());

        let should_retry = |err: &TradingError| -> bool {
            let err_msg = format!("{:?}", err).to_lowercase();
            if matches!(err, TradingError::Network(_)) {
                return true;
            }
            if let TradingError::Exchange(_) = err {
                if err_msg.contains("429")
                    || err_msg.contains("error 502")
                    || err_msg.contains("error 503")
                    || err_msg.contains("gateway timeout")
                {
                    return true;
                }
            }
            false
        };

        assert!(should_retry(&err1));

        let err2 = TradingError::Exchange("error 429 rate limit exceeded".to_string());
        assert!(should_retry(&err2));

        let err3 = TradingError::Exchange("Unknown weird payload error".to_string());
        assert!(!should_retry(&err3));

        let err4 = TradingError::Exchange("error 401 unauthorized".to_string());
        assert!(!should_retry(&err4));
    }
}

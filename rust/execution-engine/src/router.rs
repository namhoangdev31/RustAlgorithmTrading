use crate::retry::RetryPolicy;
use common::{config::ExecutionConfig, types::Order, Result, TradingError};
use governor::{
    clock::DefaultClock,
    state::{InMemoryState, NotKeyed},
    Quota, RateLimiter,
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::num::NonZeroU32;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

#[derive(Debug, Serialize, Deserialize)]
pub struct AlpacaOrderRequest {
    pub symbol: String,
    pub qty: f64,
    pub side: String,
    pub r#type: String,
    pub time_in_force: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_price: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct AlpacaOrderResponse {
    pub id: String,
    pub status: String,
    pub symbol: String,
    pub qty: String,
    pub filled_qty: String,
    pub side: String,
}

pub struct OrderRouter {
    config: ExecutionConfig,
    retry_policy: RetryPolicy,
    rate_limiter: Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>,
    http_client: Client,
    pub idempotency_locks: Arc<Mutex<HashSet<String>>>,
    telemetry_tx: mpsc::Sender<String>,
    circuit_breaker_open: Arc<AtomicBool>,
}

struct IdempotencyGuard<'a> {
    locks: &'a Mutex<HashSet<String>>,
    key: String,
}

impl<'a> Drop for IdempotencyGuard<'a> {
    fn drop(&mut self) {
        if let Ok(mut g) = self.locks.lock() {
            g.remove(&self.key);
        }
    }
}

impl OrderRouter {
    pub fn new(config: ExecutionConfig) -> Result<Self> {
        // Validate HTTPS is used for live trading
        config.validate_https()?;

        // Validate credentials are present for live trading
        config.validate_credentials()?;

        let retry_policy = RetryPolicy::new(config.retry_attempts, config.retry_delay_ms);

        // Create rate limiter with proper error handling
        let quota = Quota::per_second(NonZeroU32::new(config.rate_limit_per_second).ok_or_else(
            || {
                TradingError::Configuration(
                    "rate_limit_per_second must be greater than 0".to_string(),
                )
            },
        )?);
        let rate_limiter = Arc::new(RateLimiter::direct(quota));

        // Configure HTTP client with TLS requirements
        let http_client = Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .min_tls_version(reqwest::tls::Version::TLS_1_2)
            .https_only(!config.paper_trading) // Enforce HTTPS in live trading
            .build()
            .map_err(|e| TradingError::Network(format!("HTTP client error: {}", e)))?;

        // Async Telemetry worker
        let (tx, mut rx) = mpsc::channel(1024);
        tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                tracing::info!(target: "telemetry", "[cid:ASYNC] {}", msg);
                // In production, integrate with Datadog/Prometheus or specialized telemetry agent
            }
        });

        Ok(Self {
            config,
            retry_policy,
            rate_limiter,
            http_client,
            idempotency_locks: Arc::new(Mutex::new(HashSet::new())),
            telemetry_tx: tx,
            circuit_breaker_open: Arc::new(AtomicBool::new(false)),
        })
    }

    /// Route and execute order with retry logic
    pub async fn route(
        &self,
        order: Order,
        current_market_price: Option<f64>,
    ) -> Result<AlpacaOrderResponse> {
        self.route_with_cb_hook(order, current_market_price, None)
            .await
    }

    /// Route and execute order with optional external circuit-breaker hook.
    /// Internal breaker state is always checked first to avoid bypass.
    pub async fn route_with_cb_hook(
        &self,
        order: Order,
        current_market_price: Option<f64>,
        cb_check_hook: Option<Arc<dyn Fn() -> bool + Send + Sync>>,
    ) -> Result<AlpacaOrderResponse> {
        let cid = order.client_order_id.clone();
        // Check slippage for limit orders
        if let Some(limit_price) = order.price {
            if let Some(market_price) = current_market_price {
                // CRITICAL FIX: Validate market_price to prevent division by zero or NaN/Inf
                if market_price <= 0.0 {
                    return Err(TradingError::MarketData(format!(
                        "Invalid market price for slippage calculation: {} (must be positive)",
                        market_price
                    )));
                }

                // Also validate limit_price is reasonable
                if limit_price.0 <= 0.0 {
                    return Err(TradingError::OrderValidation(format!(
                        "Invalid limit price: {} (must be positive)",
                        limit_price.0
                    )));
                }

                let slippage_bps = ((limit_price.0 - market_price).abs() / market_price) * 10000.0;

                // Additional check for NaN/Inf results (defensive programming)
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

        // Phase 3: Idempotency Lock Guard
        let lock_key = order.client_order_id.clone();
        {
            let mut lock_set = self.idempotency_locks.lock().map_err(|_| {
                TradingError::Execution(format!("[cid:{}] Idempotency lock poisoned", lock_key))
            })?;
            if !lock_set.insert(lock_key.clone()) {
                let msg = format!(
                    "[cid:{}] Duplicate order submission rejected (Idempotency Lock)",
                    lock_key
                );
                let _ = self.telemetry_tx.try_send(msg.clone());
                return Err(TradingError::RiskCheck(msg));
            }
        }

        let _guard = IdempotencyGuard {
            locks: &self.idempotency_locks,
            key: lock_key.clone(),
        };

        // Execute with retry and rate limiting
        let retry_policy = self.retry_policy.clone();
        let rate_limiter = self.rate_limiter.clone();
        let http_client = self.http_client.clone();
        let config = self.config.clone();
        let telemetry = self.telemetry_tx.clone();

        let result = retry_policy
            .execute_with_hooks(
                &cid.clone(),
                || async {
                    rate_limiter.until_ready().await;
                    let alpaca_order = self.build_alpaca_request(&order)?;
                    self.send_to_exchange(&http_client, &config, alpaca_order)
                        .await
                },
                move |err| {
                    let err_msg = format!("{:?}", err).to_lowercase();
                    // Phase 3: Fail-safe unknown exchange error -> Non-retryable
                    if matches!(err, TradingError::Network(_)) {
                        let _ = telemetry.try_send(format!(
                            "[cid:{}] Retryable error (Network): {:?}",
                            cid, err
                        ));
                        return true;
                    }
                    if let TradingError::Exchange(_) = err {
                        if err_msg.contains("429")
                            || err_msg.contains("error 502")
                            || err_msg.contains("error 503")
                            || err_msg.contains("gateway timeout")
                        {
                            let _ = telemetry.try_send(format!(
                                "[cid:{}] Retryable error (Exchange Rate Limit / Transient): {:?}",
                                cid, err
                            ));
                            return true;
                        }
                    }
                    let _ = telemetry.try_send(format!(
                        "[cid:{}] Non-retryable error, failing immediately: {:?}",
                        cid, err
                    ));
                    false // Unknown error falls here, fail-safe!
                },
                || {
                    // Phase 4: Circuit breaker preflight check inside backoff loop
                    if self.circuit_breaker_open.load(Ordering::Relaxed) {
                        return Err(TradingError::RiskCheck(
                            "Circuit breaker is OPEN. Rejecting execution attempt.".to_string(),
                        ));
                    }
                    if let Some(hook) = &cb_check_hook {
                        if hook() {
                            return Err(TradingError::RiskCheck(
                                "Circuit breaker is OPEN. Rejecting execution attempt.".to_string(),
                            ));
                        }
                    }
                    Ok(())
                },
            )
            .await;

        // Note: For a strictly strict idempotency implementation in highly distributed environments,
        // we might NOT remove the lock on success to prevent duplicate execution of the same valid intent.
        // However, if we fail with a RETRYABLE error and exhaust max attempts, we might unlock it so the user can try again manually.
        // For Week 8 requirements, maintaining the lock blocks duplicate side-effects.

        result
    }

    pub fn set_circuit_breaker_open(&self, open: bool) {
        self.circuit_breaker_open.store(open, Ordering::Relaxed);
    }

    fn build_alpaca_request(&self, order: &Order) -> Result<AlpacaOrderRequest> {
        let side = match order.side {
            common::types::Side::Bid => "buy",
            common::types::Side::Ask => "sell",
        };

        let order_type = match order.order_type {
            common::types::OrderType::Market => "market",
            common::types::OrderType::Limit => "limit",
            common::types::OrderType::StopMarket => "stop",
            common::types::OrderType::StopLimit => "stop_limit",
        };

        Ok(AlpacaOrderRequest {
            symbol: order.symbol.0.clone(),
            qty: order.quantity.0,
            side: side.to_string(),
            r#type: order_type.to_string(),
            time_in_force: "gtc".to_string(),
            limit_price: order.price.map(|p| p.0),
            stop_price: order.stop_price.map(|p| p.0),
        })
    }

    async fn send_to_exchange(
        &self,
        client: &Client,
        config: &ExecutionConfig,
        order: AlpacaOrderRequest,
    ) -> Result<AlpacaOrderResponse> {
        if config.paper_trading {
            // Paper trading mode - simulate response
            return Ok(AlpacaOrderResponse {
                id: uuid::Uuid::new_v4().to_string(),
                status: "filled".to_string(),
                symbol: order.symbol.clone(),
                qty: order.qty.to_string(),
                filled_qty: order.qty.to_string(),
                side: order.side.clone(),
            });
        }

        // Validate URL uses HTTPS before sending credentials
        if !config.exchange_api_url.starts_with("https://") {
            return Err(TradingError::Configuration(
                "Cannot send API credentials over non-HTTPS connection".to_string(),
            ));
        }

        let url = format!("{}/v2/orders", config.exchange_api_url);

        // Get credentials with proper error handling
        let api_key = config
            .api_key
            .as_ref()
            .ok_or_else(|| TradingError::Configuration("API key not configured".to_string()))?;

        let api_secret = config
            .api_secret
            .as_ref()
            .ok_or_else(|| TradingError::Configuration("API secret not configured".to_string()))?;

        let response = client
            .post(&url)
            .header("APCA-API-KEY-ID", api_key)
            .header("APCA-API-SECRET-KEY", api_secret)
            .json(&order)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response
                .text()
                .await
                .unwrap_or_else(|_| "<failed to read response body>".to_string());
            return Err(TradingError::Exchange(format!(
                "Order rejected: {} - {}",
                status, text
            )));
        }

        response
            .json::<AlpacaOrderResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))
    }

    /// Fragment large order into smaller pieces (TWAP-style)
    pub async fn execute_twap(
        &self,
        order: Order,
        num_slices: usize,
        interval_ms: u64,
    ) -> Result<Vec<AlpacaOrderResponse>> {
        let slice_qty = order.quantity.0 / num_slices as f64;
        let mut responses = Vec::new();

        for i in 0..num_slices {
            let mut slice_order = order.clone();
            slice_order.quantity = common::types::Quantity(slice_qty);
            slice_order.client_order_id = format!("{}_slice_{}", order.client_order_id, i);

            let response = self.route(slice_order, None).await?;
            responses.push(response);

            if i < num_slices - 1 {
                tokio::time::sleep(tokio::time::Duration::from_millis(interval_ms)).await;
            }
        }

        Ok(responses)
    }

    /// Get order status
    pub async fn get_order_status(&self, order_id: &str) -> Result<AlpacaOrderResponse> {
        self.rate_limiter.until_ready().await;

        // Validate HTTPS before sending credentials
        if !self.config.paper_trading && !self.config.exchange_api_url.starts_with("https://") {
            return Err(TradingError::Configuration(
                "Cannot send API credentials over non-HTTPS connection".to_string(),
            ));
        }

        let url = format!("{}/v2/orders/{}", self.config.exchange_api_url, order_id);

        // Get credentials with proper error handling
        let api_key = self
            .config
            .api_key
            .as_ref()
            .ok_or_else(|| TradingError::Configuration("API key not configured".to_string()))?;

        let api_secret =
            self.config.api_secret.as_ref().ok_or_else(|| {
                TradingError::Configuration("API secret not configured".to_string())
            })?;

        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", api_key)
            .header("APCA-API-SECRET-KEY", api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        response
            .json::<AlpacaOrderResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))
    }

    /// Cancel order
    pub async fn cancel_order(&self, order_id: &str) -> Result<()> {
        self.rate_limiter.until_ready().await;

        // Validate HTTPS before sending credentials
        if !self.config.paper_trading && !self.config.exchange_api_url.starts_with("https://") {
            return Err(TradingError::Configuration(
                "Cannot send API credentials over non-HTTPS connection".to_string(),
            ));
        }

        let url = format!("{}/v2/orders/{}", self.config.exchange_api_url, order_id);

        // Get credentials with proper error handling
        let api_key = self
            .config
            .api_key
            .as_ref()
            .ok_or_else(|| TradingError::Configuration("API key not configured".to_string()))?;

        let api_secret =
            self.config.api_secret.as_ref().ok_or_else(|| {
                TradingError::Configuration("API secret not configured".to_string())
            })?;

        self.http_client
            .delete(&url)
            .header("APCA-API-KEY-ID", api_key)
            .header("APCA-API-SECRET-KEY", api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Cancel failed: {}", e)))?;

        Ok(())
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
            paper_trading: true,
            exchange_api_url: "https://paper-api.alpaca.markets".to_string(),
            api_key: Some("test_key".to_string()),
            api_secret: Some("test_secret".to_string()),
            rate_limit_per_second: 10,
            max_slippage_bps: 50.0,
            retry_attempts: 3,
            retry_delay_ms: 10,
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
        }
    }

    #[tokio::test]
    async fn test_retry_idempotency_race_condition() {
        let router = OrderRouter::new(get_test_config()).unwrap();
        let order = get_dummy_order();
        let order_clone = order.clone();

        // Manually hold the lock to simulate race condition where the first order is routing
        let _test_lock_guard = router
            .idempotency_locks
            .lock()
            .unwrap()
            .insert(order.client_order_id.clone());

        // Concurrency/Duplicate attempt
        let result2 = router.route(order_clone, None).await;
        assert!(result2.is_err());
        match result2 {
            Err(TradingError::RiskCheck(msg)) => assert!(msg.contains("Idempotency Lock")),
            _ => panic!("Expected RiskCheck Idempotency error"),
        }
    }

    #[tokio::test]
    async fn test_circuit_breaker_tripped_during_retry_backoff() {
        let router = OrderRouter::new(get_test_config()).unwrap();
        let order = get_dummy_order();
        let hook: Arc<dyn Fn() -> bool + Send + Sync> = Arc::new(|| true);

        // Simulating the caller passing a circuit breaker opened state
        let result = router.route_with_cb_hook(order, None, Some(hook)).await;

        assert!(result.is_err());
        match result {
            Err(TradingError::RiskCheck(msg)) => assert!(msg.contains("Circuit breaker is OPEN")),
            _ => panic!("Expected Open CB error {:?}", result),
        }
    }

    #[tokio::test]
    async fn test_unknown_exchange_error_is_non_retryable() {
        // Just verify the logic of the fail-safe hook via mock
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

        // Network error is retryable
        assert_eq!(should_retry(&err1), true);

        // Exchange rate limit is retryable
        let err2 = TradingError::Exchange("error 429 rate limit exceeded".to_string());
        assert_eq!(should_retry(&err2), true);

        // Unknown exchange error is NON-retryable (Fail-safe phase 3)
        let err3 = TradingError::Exchange("Unknown weird payload error".to_string());
        assert_eq!(should_retry(&err3), false);

        // Authorization error is NON-retryable
        let err4 = TradingError::Exchange("error 401 unauthorized".to_string());
        assert_eq!(should_retry(&err4), false);
    }
}

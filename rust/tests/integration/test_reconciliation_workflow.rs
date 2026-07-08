use chrono::Utc;
use common::config::{ExecutionConfig, RiskConfig};
use common::types::*;
use common::Result;
use async_trait::async_trait;
use execution_engine::broker::BrokerClient;
use execution_engine::reconciliation::ReconciliationWorker;
use execution_engine::router::OrderRouter;
use risk_manager::{CircuitBreakerState, RiskManagerService};
use std::sync::{Arc, Mutex, RwLock};

struct MockReconciliationBroker {
    positions: Mutex<Vec<BrokerPosition>>,
    account: Mutex<BrokerAccountSnapshot>,
}

impl MockReconciliationBroker {
    fn new(positions: Vec<BrokerPosition>, account: BrokerAccountSnapshot) -> Self {
        Self {
            positions: Mutex::new(positions),
            account: Mutex::new(account),
        }
    }
}

#[async_trait]
impl BrokerClient for MockReconciliationBroker {
    async fn submit_order(&self, _order: &Order) -> Result<BrokerOrderStatus> {
        unimplemented!()
    }
    async fn cancel_order(&self, _order_id: &str) -> Result<BrokerOrderStatus> {
        unimplemented!()
    }
    async fn get_order_status(&self, _order_id: &str) -> Result<BrokerOrderStatus> {
        unimplemented!()
    }
    async fn list_open_orders(&self) -> Result<Vec<BrokerOrderStatus>> {
        Ok(Vec::new())
    }
    async fn list_positions(&self) -> Result<Vec<BrokerPosition>> {
        Ok(self.positions.lock().unwrap().clone())
    }
    async fn get_account_snapshot(&self) -> Result<BrokerAccountSnapshot> {
        Ok(self.account.lock().unwrap().clone())
    }
    async fn list_fills(
        &self,
        _since: chrono::DateTime<chrono::Utc>,
    ) -> Result<Vec<BrokerFill>> {
        Ok(Vec::new())
    }
}

fn test_exec_config() -> ExecutionConfig {
    ExecutionConfig {
        exchange_api_url: "https://paper-api.alpaca.markets".to_string(),
        api_key: Some("test_key".to_string()),
        api_secret: Some("test_secret".to_string()),
        trading_mode: common::types::TradingMode::Simulated,
        rate_limit_per_second: 10,
        retry_attempts: 3,
        retry_delay_ms: 10,
        max_slippage_bps: 50.0,
        policy: Default::default(),
        zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
    }
}

fn test_risk_config() -> RiskConfig {
    RiskConfig {
        max_position_size: 100_000.0,
        max_notional_exposure: 250_000.0,
        max_open_positions: 5,
        stop_loss_percent: 5.0,
        trailing_stop_percent: 3.0,
        enable_circuit_breaker: true,
        max_loss_threshold: 10_000.0,
        sizing_amount: 0.0,
        ..Default::default()
    }
}

#[tokio::test]
async fn test_reconciliation_ideal_match() {
    let broker_positions = vec![BrokerPosition {
        symbol: Symbol("AAPL".to_string()),
        quantity: Quantity(100.0),
        average_entry_price: Price(150.0),
        market_value: 15000.0,
        unrealized_pnl: 0.0,
    }];
    let account = BrokerAccountSnapshot {
        equity: 100000.0,
        cash: 85000.0,
        buying_power: 400000.0,
        timestamp: Utc::now(),
    };

    let broker = Arc::new(MockReconciliationBroker::new(broker_positions, account));
    let router = Arc::new(OrderRouter::new_test(test_exec_config(), broker).unwrap());

    let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(test_risk_config()).unwrap()));

    // Seed internal position to match broker
    {
        let mut mgr = risk_manager.write().unwrap();
        mgr.update_position(
            Position {
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                quantity: Quantity(100.0),
                entry_price: Price(150.0),
                current_price: Price(150.0),
                unrealized_pnl: 0.0,
                realized_pnl: 0.0,
                opened_at: Utc::now(),
                updated_at: Utc::now(),
            },
            "seed-cid",
        );
    }

    let worker = ReconciliationWorker::new(router, risk_manager.clone(), 10);
    
    // Run reconciliation - should not trip circuit breaker
    let res = worker.reconcile_positions().await;
    assert!(res.is_ok());

    let cb_state = risk_manager.read().unwrap().circuit_breaker_state();
    assert_eq!(cb_state, CircuitBreakerState::Closed);
}

#[tokio::test]
async fn test_reconciliation_missing_broker_trips_cb() {
    let broker_positions = vec![]; // Broker has nothing
    let account = BrokerAccountSnapshot {
        equity: 100000.0,
        cash: 100000.0,
        buying_power: 400000.0,
        timestamp: Utc::now(),
    };

    let broker = Arc::new(MockReconciliationBroker::new(broker_positions, account));
    let router = Arc::new(OrderRouter::new_test(test_exec_config(), broker).unwrap());
    let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(test_risk_config()).unwrap()));

    // Seed internal position (we think we have AAPL but broker has nothing)
    {
        let mut mgr = risk_manager.write().unwrap();
        mgr.update_position(
            Position {
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                quantity: Quantity(100.0),
                entry_price: Price(150.0),
                current_price: Price(150.0),
                unrealized_pnl: 0.0,
                realized_pnl: 0.0,
                opened_at: Utc::now(),
                updated_at: Utc::now(),
            },
            "seed-cid",
        );
    }

    let worker = ReconciliationWorker::new(router, risk_manager.clone(), 10);
    
    // Run reconciliation - should trip circuit breaker because of Critical missing position at broker
    let res = worker.reconcile_positions().await;
    assert!(res.is_ok());

    let cb_state = risk_manager.read().unwrap().circuit_breaker_state();
    assert_eq!(cb_state, CircuitBreakerState::Open);
}

#[tokio::test]
async fn test_reconciliation_missing_internal_trips_cb() {
    let broker_positions = vec![BrokerPosition {
        symbol: Symbol("AAPL".to_string()),
        quantity: Quantity(100.0),
        average_entry_price: Price(150.0),
        market_value: 15000.0,
        unrealized_pnl: 0.0,
    }]; // Broker has position, we don't
    let account = BrokerAccountSnapshot {
        equity: 100000.0,
        cash: 85000.0,
        buying_power: 400000.0,
        timestamp: Utc::now(),
    };

    let broker = Arc::new(MockReconciliationBroker::new(broker_positions, account));
    let router = Arc::new(OrderRouter::new_test(test_exec_config(), broker).unwrap());
    let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(test_risk_config()).unwrap()));

    // We do not seed anything internally (quantity = 0.0)
    let worker = ReconciliationWorker::new(router, risk_manager.clone(), 10);
    
    // Run reconciliation - should trip circuit breaker because of Critical missing position internally
    let res = worker.reconcile_positions().await;
    assert!(res.is_ok());

    let cb_state = risk_manager.read().unwrap().circuit_breaker_state();
    assert_eq!(cb_state, CircuitBreakerState::Open);
}

#[tokio::test]
async fn test_reconciliation_qty_break_trips_cb() {
    let broker_positions = vec![BrokerPosition {
        symbol: Symbol("AAPL".to_string()),
        quantity: Quantity(100.0),
        average_entry_price: Price(150.0),
        market_value: 15000.0,
        unrealized_pnl: 0.0,
    }];
    let account = BrokerAccountSnapshot {
        equity: 100000.0,
        cash: 85000.0,
        buying_power: 400000.0,
        timestamp: Utc::now(),
    };

    let broker = Arc::new(MockReconciliationBroker::new(broker_positions, account));
    let router = Arc::new(OrderRouter::new_test(test_exec_config(), broker).unwrap());
    let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(test_risk_config()).unwrap()));

    // Seed internal position with a large discrepancy (80 shares instead of 100)
    {
        let mut mgr = risk_manager.write().unwrap();
        mgr.update_position(
            Position {
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                quantity: Quantity(80.0),
                entry_price: Price(150.0),
                current_price: Price(150.0),
                unrealized_pnl: 0.0,
                realized_pnl: 0.0,
                opened_at: Utc::now(),
                updated_at: Utc::now(),
            },
            "seed-cid",
        );
    }

    let worker = ReconciliationWorker::new(router, risk_manager.clone(), 10);
    
    // Run reconciliation - should trip circuit breaker because diff = 20.0 (> 10.0 critical limit)
    let res = worker.reconcile_positions().await;
    assert!(res.is_ok());

    let cb_state = risk_manager.read().unwrap().circuit_breaker_state();
    assert_eq!(cb_state, CircuitBreakerState::Open);
}

#[tokio::test]
async fn test_reconciliation_qty_break_warning_does_not_trip_cb() {
    let broker_positions = vec![BrokerPosition {
        symbol: Symbol("AAPL".to_string()),
        quantity: Quantity(100.0),
        average_entry_price: Price(150.0),
        market_value: 15000.0,
        unrealized_pnl: 0.0,
    }];
    let account = BrokerAccountSnapshot {
        equity: 100000.0,
        cash: 85000.0,
        buying_power: 400000.0,
        timestamp: Utc::now(),
    };

    let broker = Arc::new(MockReconciliationBroker::new(broker_positions, account));
    let router = Arc::new(OrderRouter::new_test(test_exec_config(), broker).unwrap());
    let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(test_risk_config()).unwrap()));

    // Seed internal position with a small warning-level discrepancy (98.0 shares instead of 100)
    // Diff is 2.0 (< 10.0 warning limit, but > 0.01 info limit)
    {
        let mut mgr = risk_manager.write().unwrap();
        mgr.update_position(
            Position {
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                quantity: Quantity(98.0),
                entry_price: Price(150.0),
                current_price: Price(150.0),
                unrealized_pnl: 0.0,
                realized_pnl: 0.0,
                opened_at: Utc::now(),
                updated_at: Utc::now(),
            },
            "seed-cid",
        );
    }

    let worker = ReconciliationWorker::new(router, risk_manager.clone(), 10);
    
    // Run reconciliation - should NOT trip CB
    let res = worker.reconcile_positions().await;
    assert!(res.is_ok());

    let cb_state = risk_manager.read().unwrap().circuit_breaker_state();
    assert_eq!(cb_state, CircuitBreakerState::Closed);
}

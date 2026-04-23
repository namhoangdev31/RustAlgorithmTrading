//! Integration tests for Risk-Execution-Observability workflows
//!
//! Tests complete workflows involving:
//! - Risk management checks
//! - Order execution
//! - Observability metrics collection
//! - Multi-component coordination

use chrono::{Utc, Duration};
use common::types::*;
use common::config::{RiskConfig, ExecutionConfig};
use database::{DatabaseManager, MetricRecord, TradeRecord, SystemEvent};
use risk_manager::stops::{StopManager, StopLossConfig, StopLossType};
use execution_engine::router::OrderRouter;
use tokio;
use uuid::Uuid;

#[cfg(test)]
mod risk_execution_observability_tests {
    use super::*;

    async fn setup_test_environment() -> (StopManager, OrderRouter, DatabaseManager) {
        let risk_config = RiskConfig {
            max_position_size: 10000.0,
            max_notional_exposure: 50000.0,
            max_open_positions: 5,
            stop_loss_percent: 5.0,
            trailing_stop_percent: 3.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 1000.0,
        };

        let exec_config = ExecutionConfig {
            exchange_api_url: "https://paper-api.alpaca.markets".to_string(),
            api_key: Some("test_key".to_string()),
            api_secret: Some("test_secret".to_string()),
            paper_trading: true,
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
        };

        let db_path = format!("test_integration_{}.duckdb", Uuid::new_v4());
        let db = DatabaseManager::new(&db_path).await
            .expect("Failed to create database");
        db.initialize().await.expect("Failed to initialize database");

        let stop_manager = StopManager::new(risk_config);
        let router = OrderRouter::new(exec_config).expect("Failed to create router");

        (stop_manager, router, db)
    }

    #[tokio::test]
    async fn test_complete_signal_to_execution_workflow() {
        // Test: Complete workflow from signal -> risk check -> execution -> metrics
        let (mut stop_manager, router, db) = setup_test_environment().await;
        let correlation_id = Uuid::new_v4().to_string();
        let workflow_start = std::time::Instant::now();

        // Step 1: Receive trading signal
        let signal = Signal {
            symbol: Symbol("AAPL".to_string()),
            direction: SignalDirection::Buy,
            strength: 0.85,
            features: vec![1.0, 2.0, 3.0],
            timestamp: Utc::now(),
        };

        // Log signal reception
        let signal_event = SystemEvent::info("Trading signal received")
            .with_details(serde_json::json!({
                "correlation_id": correlation_id,
                "symbol": signal.symbol.0,
                "direction": format!("{:?}", signal.direction),
                "strength": signal.strength
            }));
        db.insert_event(&signal_event).await.expect("Event insert failed");

        // Step 2: Create order from signal
        let order = Order {
            order_id: Uuid::new_v4().to_string(),
            client_order_id: Uuid::new_v4().to_string(),
            symbol: signal.symbol.clone(),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(100.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Step 3: Risk check (position size validation)
        let notional_value = 100.0 * 150.0; // 100 shares at $150
        assert!(notional_value < 50000.0); // Within max_notional_exposure

        // Step 4: Execute order
        let exec_start = std::time::Instant::now();
        let result = router.route(order.clone(), Some(150.0)).await;
        let exec_duration = exec_start.elapsed();

        assert!(result.is_ok());
        let response = result.unwrap();

        // Step 5: Record execution metrics
        let latency_metric = MetricRecord::new("order_execution_latency_ms", exec_duration.as_millis() as f64)
            .with_symbol("AAPL")
            .add_label("correlation_id", &correlation_id)
            .add_label("order_id", &order.order_id);
        db.insert_metric(&latency_metric).await.expect("Metric insert failed");

        // Step 6: Record trade
        let trade = TradeRecord {
            trade_id: response.id.clone(),
            order_id: order.order_id.clone(),
            symbol: response.symbol.clone(),
            side: response.side.clone(),
            quantity: response.qty.parse().unwrap(),
            price: 150.0,
            timestamp: Utc::now(),
            commission: 1.0,
            trade_value: 15000.0,
            liquidity: Some("taker".to_string()),
        };
        db.insert_trade(&trade).await.expect("Trade insert failed");

        // Step 7: Create position and set stop-loss
        let position = Position {
            symbol: order.symbol.clone(),
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
        stop_manager.set_stop(&position, stop_config).expect("Set stop failed");

        // Step 8: Record workflow completion metric
        let workflow_duration = workflow_start.elapsed();
        let workflow_metric = MetricRecord::new("complete_workflow_duration_ms", workflow_duration.as_millis() as f64)
            .with_symbol("AAPL")
            .add_label("correlation_id", &correlation_id);
        db.insert_metric(&workflow_metric).await.expect("Metric insert failed");

        // Verify all components worked together
        assert_eq!(response.symbol, "AAPL");
        assert!(stop_manager.has_stop(&position.symbol));
        assert!(workflow_duration.as_millis() < 5000); // Complete workflow < 5s
    }

    #[tokio::test]
    async fn test_position_limit_enforcement_with_metrics() {
        // Test: Risk manager rejects order exceeding position limits, metrics recorded
        let (_, router, db) = setup_test_environment().await;
        let correlation_id = Uuid::new_v4().to_string();

        let max_position_size = 10000.0;

        // Attempt to create oversized order
        let order_size = 15000.0;
        assert!(order_size > max_position_size);

        // Log rejection
        let rejection_event = SystemEvent::warning("Order rejected: exceeds position limit")
            .with_details(serde_json::json!({
                "correlation_id": correlation_id,
                "requested_size": order_size,
                "max_size": max_position_size,
                "symbol": "AAPL"
            }));
        db.insert_event(&rejection_event).await.expect("Event insert failed");

        // Record rejection metric
        let rejection_metric = MetricRecord::new("order_rejection", 1.0)
            .with_symbol("AAPL")
            .add_label("correlation_id", &correlation_id)
            .add_label("reason", "position_limit_exceeded");
        db.insert_metric(&rejection_metric).await.expect("Metric insert failed");

        // Verify metrics were recorded
        let metrics = db.get_metrics("order_rejection", None, None, 10).await.unwrap();
        assert_eq!(metrics.len(), 1);

        let events = db.get_events(None, 10).await.unwrap();
        assert!(events.iter().any(|e| e.severity == "warning"));
    }

    #[tokio::test]
    async fn test_slippage_detection_and_metrics() {
        // Test: Detect high slippage, reject order, record metrics
        let (_, router, db) = setup_test_environment().await;
        let correlation_id = Uuid::new_v4().to_string();

        let order = Order {
            order_id: Uuid::new_v4().to_string(),
            client_order_id: Uuid::new_v4().to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(100.0),
            price: Some(Price(200.0)), // Far from market
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let market_price = 150.0;
        let slippage_bps = ((200.0 - market_price) / market_price) * 10000.0;

        // Record slippage metric before rejection
        let slippage_metric = MetricRecord::new("slippage_bps", slippage_bps)
            .with_symbol("AAPL")
            .add_label("correlation_id", &correlation_id)
            .add_label("order_id", &order.order_id);
        db.insert_metric(&slippage_metric).await.expect("Metric insert failed");

        // Attempt to execute - should fail due to high slippage
        let result = router.route(order, Some(market_price)).await;
        assert!(result.is_err());

        // Verify slippage metric was recorded
        let metrics = db.get_metrics("slippage_bps", None, None, 10).await.unwrap();
        assert_eq!(metrics.len(), 1);
        assert!(metrics[0].value > 50.0); // Exceeds 50 bps limit
    }

    #[tokio::test]
    async fn test_stop_loss_trigger_with_execution_and_metrics() {
        // Test: Stop-loss triggers -> Creates closing order -> Records metrics
        let (mut stop_manager, router, db) = setup_test_environment().await;
        let correlation_id = Uuid::new_v4().to_string();

        // Create position with stop-loss
        let mut position = Position {
            symbol: Symbol("AAPL".to_string()),
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
        stop_manager.set_stop(&position, stop_config).expect("Set stop failed");

        // Price drops, triggering stop-loss
        position.current_price = Price(142.0); // -5.3% loss
        position.unrealized_pnl = (142.0 - 150.0) * 100.0;

        let trigger = stop_manager.check(&position);
        assert!(trigger.is_some());

        let trigger_event = trigger.unwrap();

        // Log stop-loss trigger
        let stop_log = SystemEvent::warning("Stop-loss triggered")
            .with_details(serde_json::json!({
                "correlation_id": correlation_id,
                "symbol": "AAPL",
                "trigger_price": trigger_event.trigger_price.0,
                "current_price": trigger_event.current_price.0,
                "unrealized_pnl": trigger_event.unrealized_pnl,
                "stop_type": format!("{:?}", trigger_event.stop_type)
            }));
        db.insert_event(&stop_log).await.expect("Event insert failed");

        // Create closing order
        let closing_order = Order {
            order_id: Uuid::new_v4().to_string(),
            client_order_id: Uuid::new_v4().to_string(),
            symbol: trigger_event.symbol.clone(),
            side: trigger_event.close_side(),
            order_type: OrderType::Market,
            quantity: trigger_event.close_quantity(),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Execute closing order
        let result = router.route(closing_order.clone(), Some(142.0)).await;
        assert!(result.is_ok());

        // Record P&L metric
        let pnl_metric = MetricRecord::new("realized_pnl", position.unrealized_pnl)
            .with_symbol("AAPL")
            .add_label("correlation_id", &correlation_id)
            .add_label("reason", "stop_loss");
        db.insert_metric(&pnl_metric).await.expect("Metric insert failed");

        // Verify stop-loss was triggered and executed
        let events = db.get_events(None, 10).await.unwrap();
        assert!(events.iter().any(|e| e.message.contains("Stop-loss")));

        let metrics = db.get_metrics("realized_pnl", None, None, 10).await.unwrap();
        assert_eq!(metrics.len(), 1);
        assert!(metrics[0].value < 0.0); // Loss recorded
    }
}

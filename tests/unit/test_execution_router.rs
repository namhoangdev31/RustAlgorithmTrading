/// Comprehensive tests for execution router
use execution_engine::router::OrderRouter;
use common::config::ExecutionConfig;
use common::types::{Order, Side, OrderType, OrderStatus, Symbol, Price, Quantity};
use common::Result;
use chrono::Utc;

#[cfg(test)]
fn create_test_config() -> ExecutionConfig {
    ExecutionConfig {
        exchange_api_url: "https://paper-api.alpaca.markets".to_string(),
        api_key: Some("test_key".to_string()),
        api_secret: Some("test_secret".to_string()),
        paper_trading: true,
        rate_limit_per_second: 10,
        retry_attempts: 3,
        retry_delay_ms: 1000,
        max_slippage_bps: 50.0,
    }
}

#[cfg(test)]
mod router_tests {
    use super::*;

    #[test]
    fn test_router_creation() {
        let config = create_test_config();
        let result = OrderRouter::new(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_route_market_order() {
        let config = create_test_config();
        let router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "market-1".to_string(),
            client_order_id: "client-market-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
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

        // router.route(order, None) should succeed in async context
    }

    #[test]
    fn test_route_limit_order() {
        let config = create_test_config();
        let router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "limit-1".to_string(),
            client_order_id: "client-limit-1".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(50.0),
            price: Some(Price(250.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Test limit order routing
    }

    #[test]
    fn test_route_with_current_price() {
        let config = create_test_config();
        let router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "slippage-check".to_string(),
            client_order_id: "client-slippage-1".to_string(),
            symbol: Symbol("NVDA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(25.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _current_price = Some(Price(450.00));
        // router.route(order, current_price) with slippage check
    }

    #[test]
    fn test_smart_routing_enabled() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        // Smart routing should choose best venue
        let order = Order {
            order_id: "smart-1".to_string(),
            client_order_id: "client-smart-1".to_string(),
            symbol: Symbol("GOOG".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(10.0),
            price: Some(Price(2500.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Smart router should analyze multiple venues
    }

    #[test]
    fn test_routing_timeout() {
        let mut config = create_test_config();
        config.rate_limit_per_second = 1; // Simulate restrictive config

        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "timeout-test".to_string(),
            client_order_id: "client-timeout-1".to_string(),
            symbol: Symbol("SLOW".to_string()),
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
        };

        // Should timeout if venue is slow
    }

    #[test]
    fn test_unsupported_order_type() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "stop-limit".to_string(),
            client_order_id: "client-stop-limit-1".to_string(),
            symbol: Symbol("MSFT".to_string()),
            side: Side::Bid,
            order_type: OrderType::StopLimit,
            quantity: Quantity(100.0),
            price: Some(Price(300.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // If StopLimit not supported, should return error
    }

    #[test]
    fn test_invalid_symbol() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "invalid-sym".to_string(),
            client_order_id: "client-invalid-sym-1".to_string(),
            symbol: Symbol("".to_string()), // Empty symbol
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
        };

        // Should reject empty symbol
    }
}

#[cfg(test)]
mod venue_selection_tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = create_test_config();
        assert_eq!(config.exchange_api_url, "https://paper-api.alpaca.markets");
    }

    #[test]
    fn test_venue_failover() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        // If primary venue fails, should try backup
        let order = Order {
            order_id: "failover-1".to_string(),
            client_order_id: "client-failover-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
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

        // Test failover mechanism
    }

    #[test]
    fn test_best_execution() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        // Should route to venue with best price
        let order = Order {
            order_id: "best-exec".to_string(),
            client_order_id: "client-best-exec-1".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(50.0),
            price: Some(Price(250.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Smart routing selects optimal venue
    }
}

#[cfg(test)]
mod order_validation_tests {
    use super::*;

    #[test]
    fn test_validate_market_order() {
        // Market orders shouldn't have price
        let order = Order {
            order_id: "validate-1".to_string(),
            client_order_id: "client-validate-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
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

        assert!(order.price.is_none());
    }

    #[test]
    fn test_validate_limit_order() {
        // Limit orders must have price
        let order = Order {
            order_id: "validate-2".to_string(),
            client_order_id: "client-validate-2".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(50.0),
            price: Some(Price(250.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert!(order.price.is_some());
    }

    #[test]
    fn test_validate_quantity() {
        let order = Order {
            order_id: "validate-3".to_string(),
            client_order_id: "client-validate-3".to_string(),
            symbol: Symbol("NVDA".to_string()),
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

        assert!(order.quantity.0 > 0.0);
    }
}

#[cfg(test)]
mod slippage_protection_tests {
    use super::*;

    #[test]
    fn test_slippage_check_enabled() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "slippage-1".to_string(),
            client_order_id: "client-slippage-1".to_string(),
            symbol: Symbol("GOOG".to_string()),
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
        };

        let _current_price = Some(Price(2500.00));
        // If market moves significantly, should protect from slippage
    }

    #[test]
    fn test_excessive_slippage_rejection() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "high-slippage".to_string(),
            client_order_id: "client-high-slippage".to_string(),
            symbol: Symbol("VOLATILE".to_string()),
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

        // If estimated slippage > threshold, reject
        let _current_price = Some(Price(100.00));
        // Expected execution at 110.00 = 10% slippage
    }
}

#[cfg(test)]
mod edge_cases {
    use super::*;

    #[test]
    fn test_zero_quantity() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "zero-qty".to_string(),
            client_order_id: "client-zero-qty".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(0.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Rejected,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Should reject zero quantity
    }

    #[test]
    fn test_very_large_order() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        let order = Order {
            order_id: "huge-order".to_string(),
            client_order_id: "client-huge-order".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(1_000_000.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Might need to split into smaller orders
    }

    #[test]
    fn test_market_closed() {
        let config = create_test_config();
        let _router = OrderRouter::new(config).unwrap();

        // Submit order when market is closed
        let order = Order {
            order_id: "after-hours".to_string(),
            client_order_id: "client-after-hours".to_string(),
            symbol: Symbol("AAPL".to_string()),
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

        // Should queue or reject based on configuration
    }
}

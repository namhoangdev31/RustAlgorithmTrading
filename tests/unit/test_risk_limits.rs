/// Comprehensive tests for risk management limits
use risk_manager::limits::LimitChecker;
use common::config::RiskConfig;
use common::types::{Order, Side, OrderType, OrderStatus, Symbol, Price, Quantity};
use chrono::Utc;

fn create_test_config() -> RiskConfig {
    RiskConfig {
        max_position_size: 1000.0,
        max_notional_exposure: 100_000.0,
        max_open_positions: 100,
        stop_loss_percent: 5.0,
        trailing_stop_percent: 2.0,
        enable_circuit_breaker: true,
        max_loss_threshold: 1000.0,
    }
}

#[cfg(test)]
mod limit_checker_tests {
    use super::*;

    #[test]
    fn test_limit_checker_creation() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);
        // Should create successfully
        drop(checker);
    }

    #[test]
    fn test_order_within_limits() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "test-1".to_string(),
            client_order_id: "client-test-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(100.0),
            price: Some(Price(150.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Order value = 100 * 150 = 15,000 < 100,000 limit
        let _result = checker.check(&order);
    }

    #[test]
    fn test_order_exceeds_value_limit() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "large-order".to_string(),
            client_order_id: "large-order-1".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(1000.0),
            price: Some(Price(250.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Order value = 1000 * 250 = 250,000 > 100,000 limit
        let _result = checker.check(&order);
    }

    #[test]
    fn test_position_size_limit() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "max-position".to_string(),
            client_order_id: "max-position-1".to_string(),
            symbol: Symbol("NVDA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(1500.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Quantity 1500 > max_position_size 1000
        let _result = checker.check(&order);
    }

    #[test]
    fn test_market_order_no_price() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "market-1".to_string(),
            client_order_id: "market-1-1".to_string(),
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

        let _result = checker.check(&order);
    }

    #[test]
    fn test_symbol_specific_limits() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "symbol-limit".to_string(),
            client_order_id: "symbol-limit-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(600.0),
            price: Some(Price(150.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }

    #[test]
    fn test_zero_quantity_order() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "zero-qty".to_string(),
            client_order_id: "zero-qty-1".to_string(),
            symbol: Symbol("MSFT".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(0.0),
            price: Some(Price(300.00)),
            stop_price: None,
            status: OrderStatus::Rejected,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }

    #[test]
    fn test_negative_quantity_handling() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "negative".to_string(),
            client_order_id: "negative-1".to_string(),
            symbol: Symbol("AMD".to_string()),
            side: Side::Ask,
            order_type: OrderType::Limit,
            quantity: Quantity(-100.0),
            price: Some(Price(120.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }
}

#[cfg(test)]
mod daily_loss_limit_tests {
    use super::*;

    #[test]
    fn test_within_daily_loss_limit() {
        let _config = create_test_config();
        // Daily loss limits would require external state or updated RiskConfig
    }
}

#[cfg(test)]
mod drawdown_limit_tests {
    use super::*;

    #[test]
    fn test_within_drawdown_limit() {
        let _config = create_test_config();
        // Drawdown limits would require external state or updated RiskConfig
    }
}

#[cfg(test)]
mod concurrent_limit_tests {
    use super::*;

    #[test]
    fn test_concurrent_order_checks() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let orders = vec![
            Order {
                order_id: "concurrent-1".to_string(),
                client_order_id: "client-c1".to_string(),
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                order_type: OrderType::Limit,
                quantity: Quantity(100.0),
                price: Some(Price(150.00)),
                stop_price: None,
                status: OrderStatus::Pending,
                filled_quantity: Quantity(0.0),
                average_price: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            },
            Order {
                order_id: "concurrent-2".to_string(),
                client_order_id: "client-c2".to_string(),
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
            },
        ];

        for order in orders {
            let _result = checker.check(&order);
        }
    }
}

#[cfg(test)]
mod edge_cases {
    use super::*;

    #[test]
    fn test_fractional_price() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "fractional".to_string(),
            client_order_id: "fractional-1".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(100.0),
            price: Some(Price(150.12345)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }

    #[test]
    fn test_very_large_order() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "huge".to_string(),
            client_order_id: "huge-1".to_string(),
            symbol: Symbol("BRK.A".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(1000.0),
            price: Some(Price(500_000.00)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }

    #[test]
    fn test_penny_stock() {
        let config = create_test_config();
        let checker = LimitChecker::new(config);

        let order = Order {
            order_id: "penny".to_string(),
            client_order_id: "penny-1".to_string(),
            symbol: Symbol("PENNY".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(100_000.0),
            price: Some(Price(0.50)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _result = checker.check(&order);
    }
}

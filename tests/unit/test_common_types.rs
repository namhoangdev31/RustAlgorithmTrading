/// Comprehensive unit tests for common::types module
///
/// Tests all trading domain types including Order, Position, Trade, OrderBook, etc.
use common::types::*;
use chrono::Utc;
use serde_json;

#[cfg(test)]
mod order_tests {
    use super::*;

    #[test]
    fn test_order_creation() {
        let order = Order {
            order_id: "order-123".to_string(),
            client_order_id: "client-123".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(100.0),
            price: Some(Price(150.50)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(order.symbol.0, "AAPL");
        assert_eq!(order.quantity.0, 100.0);
        assert!(matches!(order.side, Side::Bid));
        assert!(matches!(order.order_type, OrderType::Limit));
    }

    #[test]
    fn test_order_serialization() {
        let order = Order {
            order_id: "order-456".to_string(),
            client_order_id: "client-456".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Ask,
            order_type: OrderType::Market,
            quantity: Quantity(50.0),
            price: None,
            stop_price: None,
            status: OrderStatus::Filled,
            filled_quantity: Quantity(50.0),
            average_price: Some(Price(250.0)),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&order).expect("Serialization failed");
        let deserialized: Order = serde_json::from_str(&json).expect("Deserialization failed");

        assert_eq!(order.order_id, deserialized.order_id);
        assert_eq!(order.symbol.0, deserialized.symbol.0);
        assert_eq!(order.quantity.0, deserialized.quantity.0);
    }

    #[test]
    fn test_order_side_variants() {
        let buy = Side::Bid;
        let sell = Side::Ask;

        assert!(matches!(buy, Side::Bid));
        assert!(matches!(sell, Side::Ask));
    }

    #[test]
    fn test_order_type_variants() {
        let types = vec![
            OrderType::Market,
            OrderType::Limit,
            OrderType::StopMarket,
            OrderType::StopLimit,
        ];

        for order_type in types {
            let json = serde_json::to_string(&order_type).unwrap();
            let _deserialized: OrderType = serde_json::from_str(&json).unwrap();
        }
    }

    #[test]
    fn test_order_status_variants() {
        let statuses = vec![
            OrderStatus::Pending,
            OrderStatus::PartiallyFilled,
            OrderStatus::Filled,
            OrderStatus::Cancelled,
            OrderStatus::Rejected,
        ];

        for status in statuses {
            let json = serde_json::to_string(&status).unwrap();
            let _deserialized: OrderStatus = serde_json::from_str(&json).unwrap();
        }
    }
}

#[cfg(test)]
mod position_tests {
    use super::*;

    #[test]
    fn test_position_creation() {
        let position = Position {
            symbol: Symbol("NVDA".to_string()),
            side: Side::Bid,
            quantity: Quantity(200.0),
            entry_price: Price(450.50),
            current_price: Price(455.00),
            unrealized_pnl: 900.00,
            realized_pnl: 0.0,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        };

        assert_eq!(position.symbol.0, "NVDA");
        assert_eq!(position.quantity.0, 200.0);
        assert!(position.unrealized_pnl > 0.0);
    }

    #[test]
    fn test_position_pnl_snapshot() {
        let position = Position {
            symbol: Symbol("MSFT".to_string()),
            side: Side::Bid,
            quantity: Quantity(100.0),
            entry_price: Price(300.00),
            current_price: Price(310.00),
            unrealized_pnl: 1000.00,
            realized_pnl: 500.00,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let total_pnl = position.unrealized_pnl + position.realized_pnl;
        assert_eq!(total_pnl, 1500.00);
    }

    #[test]
    fn test_position_serialization() {
        let position = Position {
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            quantity: Quantity(75.0),
            entry_price: Price(180.00),
            current_price: Price(185.00),
            unrealized_pnl: 375.00,
            realized_pnl: 100.00,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let json = serde_json::to_string(&position).unwrap();
        let deserialized: Position = serde_json::from_str(&json).unwrap();

        assert_eq!(position.symbol.0, deserialized.symbol.0);
        assert_eq!(position.quantity.0, deserialized.quantity.0);
    }
}

#[cfg(test)]
mod trade_tests {
    use super::*;

    #[test]
    fn test_trade_creation() {
        let trade = Trade {
            trade_id: "trade-789".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            quantity: Quantity(25.0),
            price: Price(250.00),
            timestamp: Utc::now(),
        };

        assert_eq!(trade.symbol.0, "TSLA");
        assert_eq!(trade.quantity.0, 25.0);
        assert_eq!(trade.trade_id, "trade-789");
    }

    #[test]
    fn test_trade_serialization() {
        let trade = Trade {
            trade_id: "trade-202".to_string(),
            symbol: Symbol("AMD".to_string()),
            side: Side::Bid,
            quantity: Quantity(100.0),
            price: Price(120.00),
            timestamp: Utc::now(),
        };

        let json = serde_json::to_string(&trade).unwrap();
        let deserialized: Trade = serde_json::from_str(&json).unwrap();

        assert_eq!(trade.trade_id, deserialized.trade_id);
        assert_eq!(trade.price.0, deserialized.price.0);
    }
}

#[cfg(test)]
mod level_tests {
    use super::*;

    #[test]
    fn test_level_creation() {
        let level = Level {
            price: Price(150.50),
            quantity: Quantity(1000.0),
            timestamp: Utc::now(),
        };

        assert_eq!(level.price.0, 150.50);
        assert_eq!(level.quantity.0, 1000.0);
    }
}

#[cfg(test)]
mod market_data_tests {
    use super::*;

    #[test]
    fn test_bar_creation() {
        let now = Utc::now();
        let bar = Bar {
            symbol: Symbol("TSLA".to_string()),
            open: Price(250.00),
            high: Price(255.00),
            low: Price(248.00),
            close: Price(252.00),
            volume: Quantity(50000.0),
            timestamp: now,
        };

        assert!(bar.high.0 >= bar.open.0);
        assert!(bar.high.0 >= bar.close.0);
        assert!(bar.low.0 <= bar.open.0);
        assert!(bar.low.0 <= bar.close.0);
    }

    #[test]
    fn test_orderbook_creation() {
        let book = OrderBook {
            symbol: Symbol("BTCUSDT".to_string()),
            bids: vec![],
            asks: vec![],
            timestamp: Utc::now(),
            sequence: 1,
        };

        assert_eq!(book.symbol.0, "BTCUSDT");
        assert_eq!(book.sequence, 1);
    }
}

#[cfg(test)]
mod signal_tests {
    use super::*;

    #[test]
    fn test_signal_creation() {
        let signal = Signal {
            symbol: Symbol("ETHUSDT".to_string()),
            direction: SignalDirection::Buy,
            strength: 0.85,
            features: vec![1.0, 2.0],
            timestamp: Utc::now(),
        };

        assert_eq!(signal.symbol.0, "ETHUSDT");
        assert!(matches!(signal.direction, SignalDirection::Buy));
        assert_eq!(signal.strength, 0.85);
    }
}

#[cfg(test)]
mod edge_cases {
    use super::*;

    #[test]
    fn test_zero_quantity_order() {
        let order = Order {
            order_id: "zero-qty".to_string(),
            client_order_id: "zero-qty".to_string(),
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

        assert_eq!(order.quantity.0, 0.0);
        assert!(matches!(order.status, OrderStatus::Rejected));
    }
}

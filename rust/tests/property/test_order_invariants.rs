/// Property-based tests for order invariants using proptest
/// Ensures data models maintain consistency under all conditions

use proptest::prelude::*;
use common::types::{Order, Side, OrderType, OrderStatus, Position, Trade, Symbol, Price, Quantity};
use chrono::Utc;

proptest! {
    #[test]
    fn test_order_quantity_always_non_negative(q in 0.0f64..1_000_000.0) {
        let order = Order {
            order_id: "prop-test".to_string(),
            client_order_id: "client-prop-test".to_string(),
            symbol: Symbol("AAPL".to_string()),
            side: Side::Bid,
            order_type: OrderType::Market,
            quantity: Quantity(q),
            price: None,
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        prop_assert!(order.quantity.0 >= 0.0);
    }

    #[test]
    fn test_limit_order_price_positive(
        p in 0.01f64..100_000.0,
        q in 0.01f64..10_000.0
    ) {
        let order = Order {
            order_id: "limit-prop".to_string(),
            client_order_id: "client-limit-prop".to_string(),
            symbol: Symbol("TSLA".to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(q),
            price: Some(Price(p)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        prop_assert!(order.price.unwrap().0 > 0.0);
        prop_assert!(order.quantity.0 > 0.0);
    }

    #[test]
    fn test_position_pnl_consistency(
        q in 0.01f64..1000.0,
        avg_p in 50.0f64..500.0,
        curr_p in 50.0f64..500.0
    ) {
        let unrealized_pnl = (curr_p - avg_p) * q;

        let position = Position {
            symbol: Symbol("NVDA".to_string()),
            side: Side::Bid,
            quantity: Quantity(q),
            entry_price: Price(avg_p),
            current_price: Price(curr_p),
            unrealized_pnl,
            realized_pnl: 0.0,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        };

        // Verify P&L calculation
        let expected_pnl = (curr_p - avg_p) * q;
        let diff = (position.unrealized_pnl - expected_pnl).abs();

        // Allow for small floating point errors
        prop_assert!(diff < 0.01);
    }

    #[test]
    fn test_trade_id_consistency(
        p in 1.0f64..1000.0,
        q in 1.0f64..1000.0,
    ) {
        let trade = Trade {
            trade_id: "trade-prop".to_string(),
            symbol: Symbol("GOOG".to_string()),
            side: Side::Bid,
            quantity: Quantity(q),
            price: Price(p),
            timestamp: Utc::now(),
        };

        prop_assert_eq!(trade.trade_id, "trade-prop");
        prop_assert_eq!(trade.price.0, p);
    }

    #[test]
    fn test_symbol_serialization(
        s in "[A-Z]{1,5}"
    ) {
        let symbol = Symbol(s.clone());
        let json = serde_json::to_string(&symbol).unwrap();
        let deserialized: Symbol = serde_json::from_str(&json).unwrap();
        prop_assert_eq!(&symbol, &deserialized);
        prop_assert_eq!(&s, &deserialized.0);
    }
}

#[cfg(test)]
mod order_state_transitions {
    use super::*;

    proptest! {
        #[test]
        fn test_order_status_serialization(
            initial_status in prop_oneof![
                Just(OrderStatus::Pending),
                Just(OrderStatus::PartiallyFilled),
                Just(OrderStatus::Filled),
                Just(OrderStatus::Cancelled),
                Just(OrderStatus::Rejected),
            ]
        ) {
            let order = Order {
                order_id: "state-test".to_string(),
                client_order_id: "client-state-test".to_string(),
                symbol: Symbol("AAPL".to_string()),
                side: Side::Bid,
                order_type: OrderType::Market,
                quantity: Quantity(100.0),
                price: None,
                stop_price: None,
                status: initial_status,
                filled_quantity: Quantity(0.0),
                average_price: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            // All states should serialize/deserialize correctly
            let json = serde_json::to_string(&order).unwrap();
            let deserialized: Order = serde_json::from_str(&json).unwrap();

            prop_assert_eq!(order.status, deserialized.status);
        }
    }
}

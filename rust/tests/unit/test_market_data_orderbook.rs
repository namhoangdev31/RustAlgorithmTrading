/// Comprehensive tests for OrderBook implementation
use market_data::orderbook::OrderBookManager;
use common::types::{Price, Quantity, Symbol};

#[cfg(test)]
mod orderbook_manager_tests {
    use super::*;

    #[test]
    fn test_orderbook_manager_creation() {
        let manager = OrderBookManager::new();
        // Manager should be created successfully
        drop(manager);
    }

    #[test]
    fn test_add_bid_level() {
        let mut manager = OrderBookManager::new();
        let symbol = "AAPL";

        // Add bid level at $150.00 with 1000 shares
        manager.update_bid(symbol, Price(150.00), Quantity(1000.0));
        
        let book = manager.get_snapshot(symbol, 1).unwrap();
        assert_eq!(book.bids.len(), 1);
        assert_eq!(book.bids[0].price, Price(150.00));
        assert_eq!(book.bids[0].quantity, Quantity(1000.0));
    }

    #[test]
    fn test_add_ask_level() {
        let mut manager = OrderBookManager::new();
        let symbol = "TSLA";

        manager.update_ask(symbol, Price(250.50), Quantity(500.0));
        
        let book = manager.get_snapshot(symbol, 1).unwrap();
        assert_eq!(book.asks.len(), 1);
        assert_eq!(book.asks[0].price, Price(250.50));
    }

    #[test]
    fn test_bid_ask_spread() {
        let mut manager = OrderBookManager::new();
        let symbol = "NVDA";

        manager.update_bid(symbol, Price(450.00), Quantity(2000.0));
        manager.update_ask(symbol, Price(450.50), Quantity(1500.0));

        let book = manager.get_or_create(symbol);
        let spread = book.spread_bps().unwrap();
        assert!((spread - 11.11).abs() < 0.01); // (0.5 / 450.25) * 10000
    }

    #[test]
    fn test_orderbook_depth() {
        let mut manager = OrderBookManager::new();
        let symbol = "GOOG";

        // Add multiple bid levels
        for i in 0..10 {
            manager.update_bid(symbol, Price(2500.00 - (i as f64 * 0.10)), Quantity(100.0 * (i + 1) as f64));
        }

        // Add multiple ask levels
        for i in 0..10 {
            manager.update_ask(symbol, Price(2500.50 + (i as f64 * 0.10)), Quantity(100.0 * (i + 1) as f64));
        }

        let book = manager.get_snapshot(symbol, 10).unwrap();
        assert_eq!(book.bids.len(), 10);
        assert_eq!(book.asks.len(), 10);
    }

    #[test]
    fn test_update_existing_level() {
        let mut manager = OrderBookManager::new();
        let symbol = "MSFT";

        manager.update_bid(symbol, Price(300.00), Quantity(1000.0));
        manager.update_bid(symbol, Price(300.00), Quantity(1500.0));

        let book = manager.get_snapshot(symbol, 1).unwrap();
        assert_eq!(book.bids[0].quantity, Quantity(1500.0));
    }

    #[test]
    fn test_remove_level() {
        let mut manager = OrderBookManager::new();
        let symbol = "AMZN";

        manager.update_bid(symbol, Price(150.00), Quantity(500.0));
        manager.update_bid(symbol, Price(150.00), Quantity(0.0));

        let book = manager.get_snapshot(symbol, 1).unwrap();
        assert!(book.bids.is_empty());
    }

    #[test]
    fn test_best_bid_ask() {
        let mut manager = OrderBookManager::new();
        let symbol = "META";

        manager.update_bid(symbol, Price(345.00), Quantity(100.0));
        manager.update_bid(symbol, Price(346.00), Quantity(200.0));
        manager.update_bid(symbol, Price(344.00), Quantity(300.0));

        {
            let book = manager.get_or_create(symbol);
            assert_eq!(book.best_bid(), Some(Price(346.00)));
        }

        manager.update_ask(symbol, Price(347.00), Quantity(100.0));
        manager.update_ask(symbol, Price(346.50), Quantity(200.0));
        
        {
            let book = manager.get_or_create(symbol);
            assert_eq!(book.best_ask(), Some(Price(346.50)));
        }
    }

    #[test]
    fn test_mid_price() {
        let mut manager = OrderBookManager::new();
        let symbol = "NFLX";

        manager.update_bid(symbol, Price(400.00), Quantity(100.0));
        manager.update_ask(symbol, Price(402.00), Quantity(100.0));

        let book = manager.get_or_create(symbol);
        assert_eq!(book.mid_price(), Some(Price(401.00)));
    }

    #[test]
    fn test_cross_imbalance() {
        let mut manager = OrderBookManager::new();
        let symbol = "IMB";

        manager.update_bid(symbol, Price(100.0), Quantity(300.0));
        manager.update_ask(symbol, Price(101.0), Quantity(100.0));

        let book = manager.get_or_create(symbol);
        let imbalance = book.imbalance(1);
        assert!((imbalance - 0.5).abs() < 0.01);
    }
}

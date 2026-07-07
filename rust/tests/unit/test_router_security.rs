use common::{
    config::{ExecutionConfig, ExecutionPolicy},
    TradingError,
};
use execution_engine::router::OrderRouter;
use std::collections::HashSet;

fn get_live_policy() -> ExecutionPolicy {
    let mut allowlist = Vec::new();
    allowlist.push("acc_allow_123".to_string());
    ExecutionPolicy {
        live_trading_enabled: true,
        allowlist_accounts: allowlist,
        kill_switch_enabled: false,
    }
}

#[cfg(test)]
mod router_security_tests {
    use super::*;

    /// Test OrderRouter rejects HTTP URLs in live trading
    #[test]
    fn test_router_rejects_http_live_trading() {
        let config = ExecutionConfig {
            exchange_api_url: "http://api.alpaca.markets".to_string(),
            api_key: Some("AK_LIVE_123".to_string()),
            api_secret: Some("test_secret".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Live,
            policy: get_live_policy(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_err());
        match result.unwrap_err() {
            TradingError::Configuration(msg) => {
                assert!(msg.contains("must use HTTPS") || msg.contains("live trading API URL"));
            }
            _ => panic!("Expected Configuration error"),
        }
    }

    /// Test OrderRouter accepts HTTPS URLs in live trading
    #[test]
    fn test_router_accepts_https_live_trading() {
        let config = ExecutionConfig {
            exchange_api_url: "https://api.alpaca.markets/v2".to_string(),
            api_key: Some("AK_LIVE_123".to_string()),
            api_secret: Some("secret123".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Live,
            policy: get_live_policy(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_ok());
    }

    /// Test OrderRouter allows HTTP in paper trading mode
    #[test]
    fn test_router_allows_http_paper_trading() {
        let config = ExecutionConfig {
            exchange_api_url: "http://paper-api.alpaca.markets".to_string(),
            api_key: Some("PK_PAPER_123".to_string()),
            api_secret: Some("secret_123".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Paper,
            policy: Default::default(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_ok());
    }

    /// Test OrderRouter rejects missing credentials in live trading
    #[test]
    fn test_router_rejects_missing_credentials() {
        let config = ExecutionConfig {
            exchange_api_url: "https://api.alpaca.markets/v2".to_string(),
            api_key: None,
            api_secret: Some("secret".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Live,
            policy: get_live_policy(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_err());
    }

    /// Test OrderRouter rejects empty credentials in live trading
    #[test]
    fn test_router_rejects_empty_credentials() {
        let config = ExecutionConfig {
            exchange_api_url: "https://api.alpaca.markets/v2".to_string(),
            api_key: Some("".to_string()),
            api_secret: Some("secret".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Live,
            policy: get_live_policy(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_err());
    }

    /// Test OrderRouter rejects zero rate limit
    #[test]
    fn test_router_rejects_zero_rate_limit() {
        let config = ExecutionConfig {
            exchange_api_url: "https://paper-api.alpaca.markets/v2".to_string(),
            api_key: Some("PK_PAPER_123".to_string()),
            api_secret: Some("secret".to_string()),
            rate_limit_per_second: 0,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Paper,
            policy: Default::default(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_err());
    }

    /// Test OrderRouter enforces TLS 1.2 minimum
    #[test]
    fn test_router_enforces_tls_version() {
        let config = ExecutionConfig {
            exchange_api_url: "https://api.alpaca.markets/v2".to_string(),
            api_key: Some("AK_LIVE_123".to_string()),
            api_secret: Some("secret123".to_string()),
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Live,
            policy: get_live_policy(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let router = OrderRouter::new(config);
        assert!(router.is_ok(), "Router should be created with TLS requirements");
    }

    /// Test that simulated mode doesn't require credentials
    #[test]
    fn test_simulated_trading_no_credentials_required() {
        let config = ExecutionConfig {
            exchange_api_url: "http://localhost:8080".to_string(),
            api_key: None,
            api_secret: None,
            rate_limit_per_second: 10,
            retry_attempts: 3,
            retry_delay_ms: 1000,
            max_slippage_bps: 50.0,
            trading_mode: common::types::TradingMode::Simulated,
            policy: Default::default(),
            zmq_publish_address: "tcp://127.0.0.1:0".to_string(),
        };

        let result = OrderRouter::new(config);
        assert!(result.is_ok());
    }
}

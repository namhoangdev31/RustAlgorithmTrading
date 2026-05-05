pub mod circuit_breaker;
/// Risk Management Component
///
/// Enforces position limits, tracks P&L, and manages stop-loss triggers.
pub mod limits;
pub mod pnl;
pub mod reload;
pub mod stops;

pub use circuit_breaker::{CircuitBreaker, CircuitBreakerState, TripReason};
pub use limits::LimitChecker;
pub use pnl::PnLTracker;
pub use stops::{StopLossConfig, StopLossTrigger, StopLossType, StopManager};

use common::{
    types::{Order, Position},
    Result,
};
use tracing::{info, warn};

pub struct RiskManagerService {
    limit_checker: LimitChecker,
    pnl_tracker: PnLTracker,
    stop_manager: StopManager,
    circuit_breaker: CircuitBreaker,
}

impl RiskManagerService {
    pub fn new(config: common::config::RiskConfig) -> Result<Self> {
        info!("[cid:INIT] Initializing Risk Manager Service");
        Ok(Self {
            limit_checker: LimitChecker::new(config.clone()),
            pnl_tracker: PnLTracker::new(),
            stop_manager: StopManager::new(config.clone()),
            circuit_breaker: CircuitBreaker::new(config),
        })
    }

    pub fn check_order(&mut self, order: &Order) -> Result<bool> {
        // Legacy compatibility wrapper
        self.circuit_breaker.check()?;
        self.limit_checker.check(order)?;
        Ok(true)
    }

    /// Primary entry point for order validation.
    /// Changed to &mut self in CR-W07-001 to support stateful circuit breaker.
    pub fn validate_order(
        &mut self,
        order: &Order,
        correlation_id: &str,
    ) -> common::types::RiskReport {
        // Level 1: Circuit Breaker (Must be first gate in W07)
        if self.circuit_breaker.check().is_err() {
            let reject_report = common::types::RiskReport {
                decision: common::types::RiskDecision::Reject,
                reason_code: Some(common::types::RiskReason::CircuitBreakerTripped),
                limit_snapshot: None,
                correlation_id: correlation_id.to_string(),
            };
            common::metrics::risk::record_risk_check_result(
                "REJECT",
                &reason_label(reject_report.reason_code),
            );
            return reject_report;
        }

        // Level 2: Limit Checker (Symbol/Strategy caps)
        let report = self.limit_checker.check_with_report(order, correlation_id);
        if report.decision == common::types::RiskDecision::Reject {
            common::metrics::risk::record_risk_check_result(
                "REJECT",
                &reason_label(report.reason_code),
            );
            return report;
        }

        // Default: Allow
        let allow_report = common::types::RiskReport {
            decision: common::types::RiskDecision::Allow,
            reason_code: None,
            limit_snapshot: None,
            correlation_id: correlation_id.to_string(),
        };
        common::metrics::risk::record_risk_check_result("ALLOW", "NONE");
        allow_report
    }

    // Circuit Breaker Management Methods (W07)

    pub fn trip_circuit_breaker(&mut self, reason: TripReason, correlation_id: &str) {
        let before = self.circuit_breaker.state();
        self.circuit_breaker.trip(reason, correlation_id);
        let after = self.circuit_breaker.state();

        if after == CircuitBreakerState::Open && before != CircuitBreakerState::Disabled {
            common::metrics::risk::record_circuit_breaker_trip(reason.as_token());
            common::metrics::risk::set_circuit_breaker_status(true);
        }
    }

    pub fn approve_circuit_breaker_reset(&mut self, correlation_id: &str) {
        self.circuit_breaker.approve_reset(correlation_id);
    }

    pub fn record_circuit_breaker_probe_result(&mut self, success: bool, correlation_id: &str) {
        self.circuit_breaker
            .record_probe_result(success, correlation_id);
        if success {
            common::metrics::risk::set_circuit_breaker_status(false);
        } else {
            common::metrics::risk::record_circuit_breaker_trip("PROBE_FAILED");
            common::metrics::risk::set_circuit_breaker_status(true);
        }
    }

    pub fn circuit_breaker_state(&self) -> CircuitBreakerState {
        self.circuit_breaker.state()
    }

    #[doc(hidden)]
    pub fn set_circuit_breaker_tripped_at_for_test(&mut self, time: chrono::DateTime<chrono::Utc>) {
        self.circuit_breaker.set_tripped_at_for_test(time);
    }

    /// Reload runtime risk config for new decisions only.
    /// Existing active stop state is intentionally preserved.
    pub fn reload_risk_config(&mut self, config: common::config::RiskConfig) {
        self.limit_checker.update_config(config.clone());
        self.stop_manager.update_config(config.clone());
        self.circuit_breaker.update_config(config);

        let tripped = self.circuit_breaker.state() != CircuitBreakerState::Closed
            && self.circuit_breaker.state() != CircuitBreakerState::Disabled;
        common::metrics::risk::set_circuit_breaker_status(tripped);
    }

    pub fn update_position(
        &mut self,
        position: Position,
        correlation_id: &str,
    ) -> Option<StopLossTrigger> {
        // Update P&L tracking
        self.pnl_tracker.update(&position);
        self.limit_checker.update_position(position.clone());

        if position.quantity.0.abs() <= 1e-12 {
            self.stop_manager.remove_stop(&position.symbol);
            return None;
        }

        // Check stop-loss and return trigger if activated
        let trigger = self.stop_manager.check(&position, correlation_id);

        if trigger.is_some() {
            warn!(
                "[cid:{}] Stop-loss triggered for position: {:?}",
                correlation_id, position.symbol
            );
        }

        trigger
    }

    /// Set a custom stop-loss for a position
    pub fn set_stop_loss(&mut self, position: &Position, config: StopLossConfig) -> Result<()> {
        self.stop_manager.set_stop(position, config)
    }

    /// Remove stop-loss for a symbol
    pub fn remove_stop_loss(&mut self, symbol: &common::types::Symbol) {
        self.stop_manager.remove_stop(symbol);
    }

    /// Get stop manager for direct access
    pub fn stop_manager(&self) -> &StopManager {
        &self.stop_manager
    }

    /// Get mutable stop manager for direct access
    pub fn stop_manager_mut(&mut self) -> &mut StopManager {
        &mut self.stop_manager
    }

    /// Get limit checker for direct access
    pub fn limit_checker(&self) -> &LimitChecker {
        &self.limit_checker
    }

    /// Get P&L tracker for direct access
    pub fn pnl_tracker(&self) -> &PnLTracker {
        &self.pnl_tracker
    }
}

fn reason_label(reason: Option<common::types::RiskReason>) -> String {
    match reason {
        Some(code) => serde_json::to_string(&code)
            .map(|raw| raw.trim_matches('"').to_string())
            .unwrap_or_else(|_| "UNKNOWN".to_string()),
        None => "NONE".to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use common::types::{
        Order, OrderStatus, OrderType, Position, Price, Quantity, RiskDecision, Side, Symbol,
    };

    fn test_config() -> common::config::RiskConfig {
        common::config::RiskConfig {
            max_position_size: 100_000.0,
            max_notional_exposure: 250_000.0,
            max_open_positions: 1,
            stop_loss_percent: 5.0,
            trailing_stop_percent: 3.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 10_000.0,
        }
    }

    fn position(symbol: &str, quantity: f64) -> Position {
        Position {
            symbol: Symbol(symbol.to_string()),
            side: Side::Bid,
            quantity: Quantity(quantity),
            entry_price: Price(100.0),
            current_price: Price(100.0),
            unrealized_pnl: 0.0,
            realized_pnl: 0.0,
            opened_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    fn order(symbol: &str) -> Order {
        Order {
            order_id: format!("order-{symbol}"),
            client_order_id: format!("client-{symbol}"),
            symbol: Symbol(symbol.to_string()),
            side: Side::Bid,
            order_type: OrderType::Limit,
            quantity: Quantity(1.0),
            price: Some(Price(100.0)),
            stop_price: None,
            status: OrderStatus::Pending,
            filled_quantity: Quantity(0.0),
            average_price: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn update_position_closes_limit_checker_position() {
        let mut service = RiskManagerService::new(test_config()).unwrap();
        service.update_position(position("AAPL", 1.0), "cid-1");

        let rejected = service.validate_order(&order("MSFT"), "cid-open");
        assert_eq!(rejected.decision, RiskDecision::Reject);

        service.update_position(position("AAPL", 0.0), "test-cid");

        let allowed = service.validate_order(&order("MSFT"), "cid-closed");
        assert_eq!(allowed.decision, RiskDecision::Allow);
    }

    #[test]
    fn update_position_removes_stale_stop_when_position_closes() {
        let mut service = RiskManagerService::new(test_config()).unwrap();
        let open = position("AAPL", 1.0);

        service
            .set_stop_loss(&open, StopLossConfig::static_stop(5.0).unwrap())
            .unwrap();
        assert!(service.stop_manager().has_stop(&open.symbol));

        service.update_position(position("AAPL", 0.0), "test-cid");

        assert!(!service.stop_manager().has_stop(&open.symbol));
    }
}

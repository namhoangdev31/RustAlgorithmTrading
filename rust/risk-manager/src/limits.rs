use common::{Result, TradingError, types::{Order, Position, RiskDecision, RiskReason, RiskReport}, config::RiskConfig};
use std::collections::HashMap;
use serde_json::json;

pub struct LimitChecker {
    config: RiskConfig,
    positions: HashMap<String, Position>,
    open_order_count: usize,
    daily_pnl: f64,
}

impl LimitChecker {
    pub fn new(config: RiskConfig) -> Self {
        Self {
            config,
            positions: HashMap::new(),
            open_order_count: 0,
            daily_pnl: 0.0,
        }
    }

    /// Multi-level risk check returning a structured report (W5)
    pub fn check_with_report(&self, order: &Order, correlation_id: &str) -> RiskReport {
        // Level 1: Order size check
        if let Err(reason) = self.check_order_size(order) {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(json!({"max_order_size": self.config.max_position_size})),
                correlation_id: correlation_id.to_string(),
            };
        }

        // Level 2: Position size check
        if let Err(reason) = self.check_position_size(order) {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(json!({"max_position_size": self.config.max_position_size})),
                correlation_id: correlation_id.to_string(),
            };
        }

        // Level 3: Notional exposure check
        if let Err(reason) = self.check_notional_exposure(order) {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(json!({"max_notional": self.config.max_notional_exposure})),
                correlation_id: correlation_id.to_string(),
            };
        }

        // Level 4: Daily loss limit check
        if let Err(reason) = self.check_daily_loss() {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(json!({"daily_pnl": self.daily_pnl, "threshold": self.config.max_loss_threshold})),
                correlation_id: correlation_id.to_string(),
            };
        }

        // Default: Allow
        RiskReport {
            decision: RiskDecision::Allow,
            reason_code: None,
            limit_snapshot: None,
            correlation_id: correlation_id.to_string(),
        }
    }

    /// Legacy check for compatibility
    pub fn check(&self, order: &Order) -> Result<()> {
        let report = self.check_with_report(order, "legacy-cid");
        if report.decision == RiskDecision::Reject {
            return Err(TradingError::Risk(format!(
                "Risk check failed: {:?}", report.reason_code
            )));
        }
        Ok(())
    }

    fn check_order_size(&self, order: &Order) -> std::result::Result<(), RiskReason> {
        let order_value = match order.price {
            Some(price) => price.0 * order.quantity.0,
            None => 0.0,
        };

        if order_value > self.config.max_position_size {
            return Err(RiskReason::SymbolVolumeLimitExceeded);
        }

        Ok(())
    }

    fn check_position_size(&self, order: &Order) -> std::result::Result<(), RiskReason> {
        if let Some(position) = self.positions.get(&order.symbol.0) {
            let current_value = position.quantity.0 * position.current_price.0;
            let order_value = order.quantity.0 * order.price.unwrap_or(position.current_price).0;

            let new_value = current_value + order_value;

            if new_value > self.config.max_position_size {
                return Err(RiskReason::SymbolPositionLimitExceeded);
            }
        }

        Ok(())
    }

    fn check_notional_exposure(&self, order: &Order) -> std::result::Result<(), RiskReason> {
        let total_exposure: f64 = self
            .positions
            .values()
            .map(|p| p.quantity.0 * p.current_price.0)
            .sum();

        let order_value = order.quantity.0
            * order
                .price
                .unwrap_or_else(|| self.positions.get(&order.symbol.0).map(|p| p.current_price).unwrap_or(common::types::Price(0.0)))
                .0;

        if total_exposure + order_value > self.config.max_notional_exposure {
            return Err(RiskReason::StrategyAllocationLimitExceeded);
        }

        Ok(())
    }

    fn check_daily_loss(&self) -> std::result::Result<(), RiskReason> {
        if self.daily_pnl < -self.config.max_loss_threshold {
            return Err(RiskReason::StrategyDailyLossLimitBreach);
        }

        Ok(())
    }

    /// Update position tracking
    pub fn update_position(&mut self, position: Position) {
        let symbol = position.symbol.0.clone();
        self.daily_pnl += position.realized_pnl;

        if position.quantity.0 == 0.0 {
            self.positions.remove(&symbol);
            if self.open_order_count > 0 {
                self.open_order_count -= 1;
            }
        } else {
            if !self.positions.contains_key(&symbol) {
                self.open_order_count += 1;
            }
            self.positions.insert(symbol, position);
        }
    }

    /// Reset daily P&L (call at start of trading day)
    pub fn reset_daily_pnl(&mut self) {
        self.daily_pnl = 0.0;
    }

    /// Get current positions
    pub fn get_positions(&self) -> &HashMap<String, Position> {
        &self.positions
    }

    /// Get current daily P&L
    pub fn get_daily_pnl(&self) -> f64 {
        self.daily_pnl
    }
}

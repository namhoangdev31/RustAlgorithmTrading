use common::{
    Result,
    TradingError,
    config::RiskConfig,
    types::{Order, Position, Price, RiskDecision, RiskReason, RiskReport, Side},
};
use serde_json::json;
use std::collections::HashMap;

pub struct LimitChecker {
    config: RiskConfig,
    positions: HashMap<String, Position>,
    daily_pnl: f64,
}

impl LimitChecker {
    const ZERO_TOLERANCE: f64 = 1e-12;

    pub fn new(config: RiskConfig) -> Self {
        Self {
            config,
            positions: HashMap::new(),
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

        // Level 4: Open positions count check
        if let Err(reason) = self.check_open_positions(order) {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(json!({
                    "current_open_positions": self.positions.len(),
                    "projected_open_positions": self.projected_open_positions_count(order),
                    "max_open_positions": self.config.max_open_positions
                })),
                correlation_id: correlation_id.to_string(),
            };
        }

        // Level 5: Daily loss limit check
        if let Err(reason) = self.check_daily_loss() {
            return RiskReport {
                decision: RiskDecision::Reject,
                reason_code: Some(reason),
                limit_snapshot: Some(
                    json!({"daily_pnl": self.daily_pnl, "threshold": self.config.max_loss_threshold}),
                ),
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
                "Risk check failed: {:?}",
                report.reason_code
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
        let projected_notional = self.projected_symbol_notional(order);
        if projected_notional > self.config.max_position_size {
            return Err(RiskReason::SymbolPositionLimitExceeded);
        }
        Ok(())
    }

    fn check_notional_exposure(&self, order: &Order) -> std::result::Result<(), RiskReason> {
        let current_total = self.total_notional_exposure();
        let current_symbol = self.current_symbol_notional(&order.symbol.0);
        let projected_symbol = self.projected_symbol_notional(order);
        let projected_total = current_total - current_symbol + projected_symbol;

        if projected_total > self.config.max_notional_exposure {
            return Err(RiskReason::StrategyAllocationLimitExceeded);
        }

        Ok(())
    }

    fn check_open_positions(&self, order: &Order) -> std::result::Result<(), RiskReason> {
        let projected_open_positions = self.projected_open_positions_count(order);
        if projected_open_positions > self.config.max_open_positions {
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
        } else {
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

    fn side_sign(side: Side) -> f64 {
        match side {
            Side::Bid => 1.0,
            Side::Ask => -1.0,
        }
    }

    fn signed_position_quantity(position: &Position) -> f64 {
        Self::side_sign(position.side) * position.quantity.0
    }

    fn signed_order_quantity(order: &Order) -> f64 {
        Self::side_sign(order.side) * order.quantity.0
    }

    fn is_zero(value: f64) -> bool {
        value.abs() <= Self::ZERO_TOLERANCE
    }

    fn reference_price(&self, order: &Order) -> Price {
        order.price.unwrap_or_else(|| {
            self.positions
                .get(&order.symbol.0)
                .map(|position| position.current_price)
                .unwrap_or(Price(0.0))
        })
    }

    fn current_symbol_signed_quantity(&self, symbol: &str) -> f64 {
        self.positions
            .get(symbol)
            .map(Self::signed_position_quantity)
            .unwrap_or(0.0)
    }

    fn projected_symbol_signed_quantity(&self, order: &Order) -> f64 {
        self.current_symbol_signed_quantity(&order.symbol.0) + Self::signed_order_quantity(order)
    }

    fn current_symbol_notional(&self, symbol: &str) -> f64 {
        self.positions
            .get(symbol)
            .map(|position| Self::signed_position_quantity(position).abs() * position.current_price.0)
            .unwrap_or(0.0)
    }

    fn projected_symbol_notional(&self, order: &Order) -> f64 {
        self.projected_symbol_signed_quantity(order).abs() * self.reference_price(order).0
    }

    fn total_notional_exposure(&self) -> f64 {
        self.positions
            .values()
            .map(|position| Self::signed_position_quantity(position).abs() * position.current_price.0)
            .sum()
    }

    fn projected_open_positions_count(&self, order: &Order) -> usize {
        let mut projected_count = self.positions.len();
        let current_signed = self.current_symbol_signed_quantity(&order.symbol.0);
        let projected_signed = self.projected_symbol_signed_quantity(order);
        let is_current_open = !Self::is_zero(current_signed);
        let is_projected_open = !Self::is_zero(projected_signed);

        match (is_current_open, is_projected_open) {
            (true, false) => projected_count = projected_count.saturating_sub(1),
            (false, true) => projected_count += 1,
            _ => {}
        }

        projected_count
    }
}

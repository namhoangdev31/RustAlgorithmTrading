use chrono::{DateTime, Utc};
use common::config::RiskConfig;
use common::types::{
    Order, OrderStatus, OrderType, Position, Price, Quantity, RiskDecision, RiskReason, Side,
    Symbol,
};
use execution_engine::slippage::SlippageEstimator;
use risk_manager::limits::LimitChecker;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::collections::{HashMap, VecDeque};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fill {
    pub symbol: String,
    pub quantity: f64,
    pub price: f64,
    pub side: String,
    pub commission: f64,
    pub timestamp: DateTime<Utc>,
    pub order_id: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ExecutionStats {
    pub events_processed: u64,
    pub signals_processed: u64,
    pub orders_placed: u64,
    pub fills_executed: u64,
    pub total_commission: f64,
    pub risk_allows: u64,
    pub risk_rejects: u64,
    pub risk_blocked: u64,
}

#[derive(Debug, Clone)]
struct PendingSignal {
    symbol: String,
    signal_type: String,
    strength: f64,
    strategy_id: String,
    timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
struct PendingOrder {
    order: Order,
    signal_type: String,
    strategy_id: String,
    timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
enum RuntimeEvent {
    Signal(PendingSignal),
    Order(PendingOrder),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskDecisionTrace {
    pub timestamp: DateTime<Utc>,
    pub symbol: String,
    pub signal_type: String,
    pub strategy_id: String,
    pub sequence_no: u64,
    pub decision: String,
    pub reason_code: String,
}

pub struct BacktestRuntime {
    pub cash: f64,
    pub initial_capital: f64,
    pub positions: HashMap<String, Position>,
    pub fills: Vec<Fill>,
    pub stats: ExecutionStats,
    pub risk_config: RiskConfig,
    pub limit_checker: LimitChecker,
    pub slippage_estimator: SlippageEstimator,
    pub current_prices: HashMap<String, f64>,
    pub last_timestamps: HashMap<String, DateTime<Utc>>,
    pub symbols: Vec<String>,
    pub seed: u64,
    pub realized_pnl_total: f64,
    pub risk_decision_trace: Vec<RiskDecisionTrace>,
    pub decision_sequence_no: u64,
    event_queue: VecDeque<RuntimeEvent>,
}

impl BacktestRuntime {
    pub fn new(initial_capital: f64, symbols: Vec<String>, risk_config: RiskConfig, seed: u64) -> Self {
        Self {
            cash: initial_capital,
            initial_capital,
            positions: HashMap::new(),
            fills: Vec::new(),
            stats: ExecutionStats::default(),
            risk_config: risk_config.clone(),
            limit_checker: LimitChecker::new(risk_config),
            slippage_estimator: SlippageEstimator::new(),
            current_prices: HashMap::new(),
            last_timestamps: HashMap::new(),
            symbols,
            seed,
            realized_pnl_total: 0.0,
            risk_decision_trace: Vec::new(),
            decision_sequence_no: 0,
            event_queue: VecDeque::new(),
        }
    }

    pub fn init_state(
        &mut self,
        initial_capital: f64,
        symbols: Vec<String>,
        risk_config: RiskConfig,
        seed: u64,
    ) {
        *self = Self::new(initial_capital, symbols, risk_config, seed);
    }

    pub fn reset(&mut self, seed: u64) {
        self.init_state(
            self.initial_capital,
            self.symbols.clone(),
            self.risk_config.clone(),
            seed,
        );
    }

    pub fn ingest_bar(
        &mut self,
        symbol: String,
        timestamp: i64,
        _open: f64,
        _high: f64,
        _low: f64,
        close: f64,
        _volume: f64,
    ) {
        if !close.is_finite() || close <= 0.0 {
            return;
        }

        let dt = DateTime::from_timestamp(timestamp, 0).unwrap_or_else(Utc::now);
        self.current_prices.insert(symbol.clone(), close);
        self.last_timestamps.insert(symbol.clone(), dt);

        if let Some(pos) = self.positions.get_mut(&symbol) {
            pos.current_price = Price(close);
            pos.updated_at = dt;
            let qty = pos.quantity.0;
            let entry = pos.entry_price.0;
            pos.unrealized_pnl = if pos.side == Side::Bid {
                (close - entry) * qty
            } else {
                (entry - close) * qty
            };
        }

        self.stats.events_processed += 1;
    }

    pub fn process_signal(&mut self, symbol: String, signal_type: String, strength: f64, strategy_id: String) {
        if !self.current_prices.contains_key(&symbol) || !strength.is_finite() {
            return;
        }

        if !self.symbols.is_empty() && !self.symbols.contains(&symbol) {
            return;
        }

        let timestamp = self
            .last_timestamps
            .get(&symbol)
            .cloned()
            .unwrap_or_else(Utc::now);

        let signal = PendingSignal {
            symbol,
            signal_type,
            strength,
            strategy_id,
            timestamp,
        };

        self.event_queue.push_back(RuntimeEvent::Signal(signal));
        self.stats.signals_processed += 1;
    }

    pub fn dispatch_until_idle(&mut self) {
        while let Some(event) = self.event_queue.pop_front() {
            self.stats.events_processed += 1;

            match event {
                RuntimeEvent::Signal(signal) => {
                    if let Some(order) = self.signal_to_order(&signal) {
                        self.stats.orders_placed += 1;
                        self.event_queue.push_back(RuntimeEvent::Order(order));
                    }
                }
                RuntimeEvent::Order(pending_order) => {
                    if self.is_reduce_only_order(&pending_order.order) {
                        self.stats.risk_allows += 1;
                        self.execute_order(pending_order.order);
                        continue;
                    }

                    let report = self
                        .limit_checker
                        .check_with_report(&pending_order.order, "backtest_cid");
                    match report.decision {
                        RiskDecision::Allow => {
                            self.stats.risk_allows += 1;
                            self.record_risk_decision(
                                &pending_order,
                                "ALLOW",
                                report.reason_code,
                            );
                            self.execute_order(pending_order.order);
                        }
                        RiskDecision::Reject => {
                            self.stats.risk_rejects += 1;
                            self.record_risk_decision(
                                &pending_order,
                                "REJECT",
                                report.reason_code,
                            );
                        }
                    }
                }
            }
        }
    }

    fn is_reduce_only_order(&self, order: &Order) -> bool {
        let Some(position) = self.positions.get(&order.symbol.0) else {
            return false;
        };

        if position.quantity.0 <= 0.0 {
            return false;
        }

        let opposite_side = position.side != order.side;
        let closes_no_more_than_current = order.quantity.0 <= position.quantity.0;

        opposite_side && closes_no_more_than_current
    }

    fn signal_to_order(&mut self, signal: &PendingSignal) -> Option<PendingOrder> {
        let price = *self.current_prices.get(&signal.symbol)?;
        let normalized = signal.signal_type.to_ascii_uppercase();

        let (side, quantity) = if normalized == "EXIT" {
            let position = self.positions.get(&signal.symbol)?;
            if position.quantity.0 <= 0.0 {
                return None;
            }
            let exit_side = if position.side == Side::Bid {
                Side::Ask
            } else {
                Side::Bid
            };
            (exit_side, position.quantity.0)
        } else {
            let side = match normalized.as_str() {
                "LONG" | "BUY" => Side::Bid,
                "SHORT" | "SELL" => Side::Ask,
                _ => return None,
            };

            let strength = signal.strength.abs().clamp(0.0, 1.0);
            let target_value = self.get_equity() * 0.10 * strength;
            let qty = (target_value / price).floor();
            if qty <= 0.0 {
                return None;
            }
            (side, qty)
        };

        Some(PendingOrder {
            order: Order {
                order_id: format!("ord_{}_{}", signal.strategy_id, self.stats.orders_placed),
                client_order_id: format!("c_ord_{}", self.stats.orders_placed),
                symbol: Symbol(signal.symbol.clone()),
                side,
                order_type: OrderType::Market,
                quantity: Quantity(quantity),
                price: Some(Price(price)),
                stop_price: None,
                status: OrderStatus::Pending,
                filled_quantity: Quantity(0.0),
                average_price: None,
                created_at: signal.timestamp,
                updated_at: signal.timestamp,
            },
            signal_type: signal.signal_type.to_ascii_uppercase(),
            strategy_id: signal.strategy_id.clone(),
            timestamp: signal.timestamp,
        })
    }

    fn canonical_reason_code(reason: Option<RiskReason>) -> String {
        match reason {
            Some(value) => serde_json::to_value(value)
                .ok()
                .and_then(|token| token.as_str().map(str::to_string))
                .unwrap_or_else(|| "UNKNOWN".to_string()),
            None => "NONE".to_string(),
        }
    }

    fn record_risk_decision(
        &mut self,
        pending_order: &PendingOrder,
        decision: &str,
        reason: Option<RiskReason>,
    ) {
        self.decision_sequence_no += 1;
        self.risk_decision_trace.push(RiskDecisionTrace {
            timestamp: pending_order.timestamp,
            symbol: pending_order.order.symbol.0.clone(),
            signal_type: pending_order.signal_type.clone(),
            strategy_id: pending_order.strategy_id.clone(),
            sequence_no: self.decision_sequence_no,
            decision: decision.to_string(),
            reason_code: Self::canonical_reason_code(reason),
        });
    }

    fn execute_order(&mut self, order: Order) {
        let symbol = order.symbol.0.clone();
        let base_price = self
            .current_prices
            .get(&symbol)
            .copied()
            .or(order.price.map(|p| p.0));

        let Some(price) = base_price else {
            return;
        };

        if !price.is_finite() || price <= 0.0 {
            return;
        }

        let slippage_bps = self.slippage_estimator.estimate(&order);
        let slippage_amount = price * (slippage_bps / 10000.0);

        let fill_price = if order.side == Side::Bid {
            (price + slippage_amount).max(0.01)
        } else {
            (price - slippage_amount).max(0.01)
        };

        let quantity = order.quantity.0;
        if !quantity.is_finite() || quantity <= 0.0 {
            return;
        }

        let notional = quantity * fill_price;
        let commission = notional * 0.001;

        if order.side == Side::Bid {
            self.cash -= notional + commission;
        } else {
            self.cash += notional - commission;
        }

        let now = order.updated_at;
        let realized_delta = self.update_position_after_fill(&symbol, order.side, quantity, fill_price, now);
        self.realized_pnl_total += realized_delta;

        if let Some(pos) = self.positions.get(&symbol) {
            self.limit_checker.update_position(pos.clone());
        } else {
            self.limit_checker.update_position(Position {
                symbol: Symbol(symbol.clone()),
                side: Side::Bid,
                quantity: Quantity(0.0),
                entry_price: Price(fill_price),
                current_price: Price(fill_price),
                unrealized_pnl: 0.0,
                realized_pnl: 0.0,
                opened_at: now,
                updated_at: now,
            });
        }

        self.fills.push(Fill {
            symbol: symbol.clone(),
            quantity,
            price: fill_price,
            side: format!("{:?}", order.side),
            commission,
            timestamp: now,
            order_id: order.order_id.clone(),
        });

        self.stats.fills_executed += 1;
        self.stats.total_commission += commission;
    }

    fn update_position_after_fill(
        &mut self,
        symbol: &str,
        fill_side: Side,
        fill_qty: f64,
        fill_price: f64,
        timestamp: DateTime<Utc>,
    ) -> f64 {
        let mut realized_delta = 0.0;

        match self.positions.remove(symbol) {
            None => {
                self.positions.insert(
                    symbol.to_string(),
                    Position {
                        symbol: Symbol(symbol.to_string()),
                        side: fill_side,
                        quantity: Quantity(fill_qty),
                        entry_price: Price(fill_price),
                        current_price: Price(fill_price),
                        unrealized_pnl: 0.0,
                        realized_pnl: 0.0,
                        opened_at: timestamp,
                        updated_at: timestamp,
                    },
                );
            }
            Some(mut existing) => {
                existing.current_price = Price(fill_price);
                existing.updated_at = timestamp;

                if existing.side == fill_side {
                    let total_qty = existing.quantity.0 + fill_qty;
                    let total_cost = existing.quantity.0 * existing.entry_price.0 + fill_qty * fill_price;
                    existing.quantity = Quantity(total_qty);
                    existing.entry_price = Price(total_cost / total_qty);
                    self.positions.insert(symbol.to_string(), existing);
                } else {
                    let close_qty = existing.quantity.0.min(fill_qty);
                    let realized = if existing.side == Side::Bid {
                        (fill_price - existing.entry_price.0) * close_qty
                    } else {
                        (existing.entry_price.0 - fill_price) * close_qty
                    };
                    realized_delta += realized;
                    existing.realized_pnl += realized;

                    if fill_qty < existing.quantity.0 {
                        existing.quantity = Quantity(existing.quantity.0 - fill_qty);
                        self.positions.insert(symbol.to_string(), existing);
                    } else if (fill_qty - existing.quantity.0).abs() < f64::EPSILON {
                        // fully closed; do not reinsert
                    } else {
                        let remaining = fill_qty - existing.quantity.0;
                        self.positions.insert(
                            symbol.to_string(),
                            Position {
                                symbol: Symbol(symbol.to_string()),
                                side: fill_side,
                                quantity: Quantity(remaining),
                                entry_price: Price(fill_price),
                                current_price: Price(fill_price),
                                unrealized_pnl: 0.0,
                                realized_pnl: existing.realized_pnl,
                                opened_at: timestamp,
                                updated_at: timestamp,
                            },
                        );
                    }
                }
            }
        }

        realized_delta
    }

    pub fn get_new_fills(&mut self) -> Vec<Fill> {
        let fills = self.fills.clone();
        self.fills.clear();
        fills
    }

    pub fn get_new_risk_decisions(&mut self) -> Vec<RiskDecisionTrace> {
        let decisions = self.risk_decision_trace.clone();
        self.risk_decision_trace.clear();
        decisions
    }

    pub fn get_equity(&self) -> f64 {
        let positions_value: f64 = self
            .positions
            .values()
            .map(|pos| {
                let signed_qty = if pos.side == Side::Bid {
                    pos.quantity.0
                } else {
                    -pos.quantity.0
                };
                signed_qty * pos.current_price.0
            })
            .sum();

        self.cash + positions_value
    }

    pub fn execution_stats_snapshot(&self) -> serde_json::Value {
        json!({
            "events_processed": self.stats.events_processed,
            "signals_processed": self.stats.signals_processed,
            "orders_placed": self.stats.orders_placed,
            "fills_executed": self.stats.fills_executed,
            "total_commission": self.stats.total_commission,
            "risk_allows": self.stats.risk_allows,
            "risk_rejects": self.stats.risk_rejects,
            "risk_blocked": self.stats.risk_blocked,
        })
    }

    pub fn state_snapshot(&self) -> serde_json::Value {
        let unrealized_pnl_total: f64 = self.positions.values().map(|p| p.unrealized_pnl).sum();
        let open_orders = self
            .event_queue
            .iter()
            .filter(|evt| matches!(evt, RuntimeEvent::Order(_)))
            .count();

        let positions: Vec<serde_json::Value> = self
            .positions
            .iter()
            .map(|(symbol, pos)| {
                let signed_qty = if pos.side == Side::Bid {
                    pos.quantity.0
                } else {
                    -pos.quantity.0
                };
                json!({
                    "symbol": symbol,
                    "side": format!("{:?}", pos.side),
                    "quantity": pos.quantity.0,
                    "signed_quantity": signed_qty,
                    "entry_price": pos.entry_price.0,
                    "current_price": pos.current_price.0,
                    "realized_pnl": pos.realized_pnl,
                    "unrealized_pnl": pos.unrealized_pnl,
                })
            })
            .collect();

        json!({
            "cash": self.cash,
            "equity": self.get_equity(),
            "realized_pnl": self.realized_pnl_total,
            "unrealized_pnl": unrealized_pnl_total,
            "positions": positions,
            "open_orders": open_orders,
            "fills_count": self.fills.len(),
            "risk_decision_counters": {
                "allow": self.stats.risk_allows,
                "reject": self.stats.risk_rejects,
                "blocked": self.stats.risk_blocked,
            },
            "execution_stats": self.execution_stats_snapshot(),
            "risk_decision_trace_len": self.risk_decision_trace.len(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn risk_config() -> RiskConfig {
        RiskConfig {
            max_position_size: 1_000_000.0,
            max_notional_exposure: 10_000_000.0,
            max_open_positions: 10,
            stop_loss_percent: 2.0,
            trailing_stop_percent: 1.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 1_000_000.0,
        }
    }

    #[test]
    fn dispatch_preserves_signal_order_and_generates_fill() {
        let mut runtime = BacktestRuntime::new(
            100_000.0,
            vec!["AAPL".to_string()],
            risk_config(),
            42,
        );

        runtime.ingest_bar("AAPL".to_string(), 1_700_000_000, 99.0, 101.0, 98.0, 100.0, 1000.0);
        runtime.process_signal("AAPL".to_string(), "LONG".to_string(), 1.0, "S1".to_string());
        runtime.dispatch_until_idle();

        let stats = runtime.execution_stats_snapshot();
        assert_eq!(stats["signals_processed"], 1);
        assert_eq!(stats["orders_placed"], 1);
        assert_eq!(stats["fills_executed"], 1);
        assert_eq!(stats["risk_allows"], 1);
        assert_eq!(stats["risk_rejects"], 0);

        let fills = runtime.get_new_fills();
        assert_eq!(fills.len(), 1);
        assert_eq!(fills[0].symbol, "AAPL");
    }

    #[test]
    fn runtime_is_deterministic_for_same_inputs_and_seed() {
        let mut left = BacktestRuntime::new(100_000.0, vec!["AAPL".to_string()], risk_config(), 7);
        let mut right = BacktestRuntime::new(100_000.0, vec!["AAPL".to_string()], risk_config(), 7);

        for runtime in [&mut left, &mut right] {
            runtime.ingest_bar("AAPL".to_string(), 1_700_000_000, 99.0, 101.0, 98.0, 100.0, 1000.0);
            runtime.process_signal("AAPL".to_string(), "LONG".to_string(), 1.0, "S1".to_string());
            runtime.dispatch_until_idle();
        }

        assert_eq!(left.state_snapshot(), right.state_snapshot());
        assert_eq!(left.execution_stats_snapshot(), right.execution_stats_snapshot());
    }

    #[test]
    fn risk_reject_increments_counter_and_prevents_fill() {
        let strict_config = RiskConfig {
            max_position_size: 10.0,
            max_notional_exposure: 100.0,
            max_open_positions: 1,
            stop_loss_percent: 2.0,
            trailing_stop_percent: 1.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 1000.0,
        };

        let mut runtime = BacktestRuntime::new(100_000.0, vec!["AAPL".to_string()], strict_config, 1);
        runtime.ingest_bar("AAPL".to_string(), 1_700_000_000, 99.0, 101.0, 98.0, 100.0, 1000.0);
        runtime.process_signal("AAPL".to_string(), "LONG".to_string(), 1.0, "S1".to_string());
        runtime.dispatch_until_idle();

        let stats = runtime.execution_stats_snapshot();
        assert_eq!(stats["fills_executed"], 0);
        assert_eq!(stats["risk_rejects"], 1);
    }

    #[test]
    fn risk_decision_trace_contains_canonical_reason_code() {
        let strict_config = RiskConfig {
            max_position_size: 10.0,
            max_notional_exposure: 100.0,
            max_open_positions: 1,
            stop_loss_percent: 2.0,
            trailing_stop_percent: 1.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 1000.0,
        };

        let mut runtime = BacktestRuntime::new(100_000.0, vec!["AAPL".to_string()], strict_config, 1);
        runtime.ingest_bar("AAPL".to_string(), 1_700_000_000, 99.0, 101.0, 98.0, 100.0, 1000.0);
        runtime.process_signal("AAPL".to_string(), "LONG".to_string(), 1.0, "S1".to_string());
        runtime.dispatch_until_idle();

        let decisions = runtime.get_new_risk_decisions();
        assert_eq!(decisions.len(), 1);
        assert_eq!(decisions[0].decision, "REJECT");
        assert_eq!(decisions[0].reason_code, "SYMBOL_VOLUME_LIMIT_EXCEEDED");
    }
}

use crate::router::OrderRouter;
use common::types::ReconciliationSeverity;
use risk_manager::{RiskManagerService, TripReason};
use std::sync::{Arc, RwLock};
use std::time::Duration;

pub struct ReconciliationWorker {
    router: Arc<OrderRouter>,
    risk_manager: Arc<RwLock<RiskManagerService>>,
    order_interval: Duration,
    position_interval: Duration,
}

impl ReconciliationWorker {
    pub fn new(
        router: Arc<OrderRouter>,
        risk_manager: Arc<RwLock<RiskManagerService>>,
        order_interval_seconds: u64,
    ) -> Self {
        Self {
            router,
            risk_manager,
            order_interval: Duration::from_secs(order_interval_seconds),
            position_interval: Duration::from_secs(300), // 5 minutes spacing for position recon
        }
    }

    pub async fn run(&self) {
        tracing::info!(
            "Starting Reconciliation Worker: order_interval={:?}, position_interval={:?}",
            self.order_interval,
            self.position_interval
        );

        let mut order_ticker = tokio::time::interval(self.order_interval);
        let mut position_ticker = tokio::time::interval(self.position_interval);

        loop {
            tokio::select! {
                _ = order_ticker.tick() => {
                    if let Err(e) = self.reconcile_orders().await {
                        tracing::error!("Order reconciliation failed: {:?}", e);
                    }
                }
                _ = position_ticker.tick() => {
                    if let Err(e) = self.reconcile_positions().await {
                        tracing::error!("Position reconciliation failed: {:?}", e);
                    }
                    if let Err(e) = self.reconcile_account().await {
                        tracing::error!("Account reconciliation failed: {:?}", e);
                    }
                }
            }
        }
    }

    /// Reconcile open orders at the broker
    async fn reconcile_orders(&self) -> common::Result<()> {
        let broker = self.router.broker_client();
        let open_orders = broker.list_open_orders().await?;

        tracing::debug!(
            "Reconciliation worker found {} open orders at broker",
            open_orders.len()
        );

        for order_status in open_orders {
            let payload = serde_json::to_value(&order_status).unwrap_or_default();
            let corr_id = format!(
                "recon-{}-{}",
                order_status.client_order_id,
                chrono::Utc::now().timestamp()
            );

            let envelope = common::messaging::Envelope::new_with_mode(
                "order.reconciled",
                &corr_id,
                &format!("{}", self.router.get_trading_mode()),
                payload,
            );

            if let Err(e) = self.router.publish_envelope("order.reconciled", &envelope) {
                tracing::error!(
                    "Failed to publish correction event for order {}: {:?}",
                    order_status.client_order_id,
                    e
                );
            }
        }

        Ok(())
    }

    /// Reconcile positions between internal risk manager and broker API
    pub async fn reconcile_positions(&self) -> common::Result<()> {
        let broker = self.router.broker_client();
        let broker_positions = broker.list_positions().await?;

        let internal_positions = {
            let mgr = self.risk_manager.read().map_err(|_| {
                common::TradingError::RiskCheck("Risk manager RwLock poisoned".to_string())
            })?;
            mgr.current_positions()
        };

        for bp in &broker_positions {
            let symbol_key = bp.symbol.0.clone();
            match internal_positions.get(&symbol_key) {
                Some(ip) => {
                    let severity = self.grade_qty_break(bp.quantity.0, ip.quantity.0);
                    if severity != ReconciliationSeverity::Info {
                        self.emit_break(
                            "POSITION_QTY_MISMATCH",
                            &symbol_key,
                            &format!(
                                "broker_qty={} internal_qty={}",
                                bp.quantity.0, ip.quantity.0
                            ),
                            severity,
                        );
                    }
                }
                None => {
                    if bp.quantity.0.abs() > 1e-6 {
                        // Position missing internally
                        self.emit_break(
                            "POSITION_MISSING_INTERNAL",
                            &symbol_key,
                            &format!("broker_qty={} internal_qty=0.0", bp.quantity.0),
                            ReconciliationSeverity::Critical, // Data mismatch is critical
                        );
                    }
                }
            }
        }

        // Check for internal positions that are missing at the broker
        for (symbol_key, ip) in &internal_positions {
            if ip.quantity.0.abs() > 1e-6
                && !broker_positions.iter().any(|bp| bp.symbol.0 == *symbol_key)
            {
                self.emit_break(
                    "POSITION_MISSING_BROKER",
                    symbol_key,
                    &format!("broker_qty=0.0 internal_qty={}", ip.quantity.0),
                    ReconciliationSeverity::Critical, // Missing at broker is critical
                );
            }
        }

        Ok(())
    }

    /// Reconcile cash/PnL/equity
    pub async fn reconcile_account(&self) -> common::Result<()> {
        let broker = self.router.broker_client();
        let snapshot = broker.get_account_snapshot().await?;

        let internal_pnl = {
            let mgr = self.risk_manager.read().map_err(|_| {
                common::TradingError::RiskCheck("Risk manager RwLock poisoned".to_string())
            })?;
            mgr.daily_pnl()
        };

        // Log the account status for production observation
        tracing::info!(
            "Account reconciliation check: equity={:.2} cash={:.2} buying_power={:.2} internal_daily_pnl={:.2}",
            snapshot.equity,
            snapshot.cash,
            snapshot.buying_power,
            internal_pnl
        );

        // TODO: Compare internal cash/equity when Portfolio/Accounting Engine is implemented

        Ok(())
    }

    fn grade_qty_break(&self, broker_qty: f64, internal_qty: f64) -> ReconciliationSeverity {
        let diff = (broker_qty - internal_qty).abs();
        if diff < 0.01 {
            ReconciliationSeverity::Info // rounding noise
        } else if diff < 10.0 {
            ReconciliationSeverity::Warning // small drift
        } else {
            ReconciliationSeverity::Critical // major mismatch -> auto-trips CB
        }
    }

    fn emit_break(
        &self,
        break_type: &str,
        symbol: &str,
        detail: &str,
        severity: ReconciliationSeverity,
    ) {
        let payload = serde_json::json!({
            "break_type": break_type,
            "symbol": symbol,
            "detail": detail,
            "severity": severity,
            "timestamp": chrono::Utc::now().to_rfc3339(),
        });

        let corr_id = format!("recon-break-{}-{}", symbol, chrono::Utc::now().timestamp());
        let envelope = common::messaging::Envelope::new_with_mode(
            "reconciliation.break",
            &corr_id,
            &format!("{}", self.router.get_trading_mode()),
            payload,
        );

        if let Err(e) = self
            .router
            .publish_envelope("reconciliation.break", &envelope)
        {
            tracing::error!("Failed to publish reconciliation break event: {:?}", e);
        }

        // Auto-trip circuit breaker for Critical confirmed data mismatches
        if severity == ReconciliationSeverity::Critical {
            tracing::error!(
                "CRITICAL reconciliation break ({} for {}) - Automatically tripping circuit breaker",
                break_type,
                symbol
            );
            if let Ok(mut mgr) = self.risk_manager.write() {
                mgr.trip_circuit_breaker(TripReason::RiskFailure, &corr_id);
            } else {
                tracing::error!(
                    "Failed to acquire risk manager write lock to trip circuit breaker"
                );
            }
        }
    }
}

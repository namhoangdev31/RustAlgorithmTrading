pub mod broker;
pub mod reconciliation;
pub mod retry;
/// Execution Engine Component
///
/// Handles order routing, smart order execution, and slippage minimization.
pub mod router;
pub mod slippage;
pub mod stop_loss_executor;

pub use broker::{AlpacaBrokerClient, BrokerClient, SimulatedBrokerClient};
pub use reconciliation::ReconciliationWorker;
pub use retry::RetryPolicy;
pub use router::OrderRouter;
pub use slippage::SlippageEstimator;
pub use stop_loss_executor::StopLossExecutor;

use common::{types::Order, Result, TradingError};
use risk_manager::RiskManagerService;

use std::sync::{Arc, RwLock};

pub struct ExecutionEngineService {
    router: Arc<OrderRouter>,
    slippage_estimator: SlippageEstimator,
    risk_manager: Arc<RwLock<RiskManagerService>>,
}

impl ExecutionEngineService {
    pub async fn new(
        config: common::config::ExecutionConfig,
        risk_config: common::config::RiskConfig,
    ) -> Result<Self> {
        let risk_manager = Arc::new(RwLock::new(RiskManagerService::new(risk_config)?));
        let router = Arc::new(OrderRouter::new(config)?);
        let slippage_estimator = SlippageEstimator::new();

        let mode = router.get_trading_mode();
        if mode == common::types::TradingMode::Paper || mode == common::types::TradingMode::Live {
            let recon_router = router.clone();
            let recon_risk = risk_manager.clone();
            tokio::spawn(async move {
                let worker = ReconciliationWorker::new(recon_router, recon_risk, 10);
                worker.run().await;
            });
        }

        Ok(Self {
            router,
            slippage_estimator,
            risk_manager,
        })
    }

    /// Submit order — mandatory pre-trade risk check, no opt-out.
    /// Risk validation uses RwLock read guard (concurrent, non-blocking for reads).
    /// Circuit breaker rejection blocks new orders but cancel_order() always passes.
    pub async fn submit_order(&self, order: Order) -> Result<()> {
        let _estimated_slippage = self.slippage_estimator.estimate(&order);
        let cid = order.client_order_id.clone();

        // 1. Mandatory pre-trade risk check (read lock — short scope, no .await)
        {
            let mgr = self
                .risk_manager
                .read()
                .map_err(|_| TradingError::RiskCheck("Risk manager RwLock poisoned".to_string()))?;
            let report = mgr.validate_order_read(&order, &cid);
            if report.decision == common::types::RiskDecision::Reject {
                return Err(TradingError::RiskCheck(format!(
                    "Pre-trade risk rejected: {:?}",
                    report.reason_code
                )));
            }
        }
        // Lock dropped here before any .await

        // 2. Route to broker (risk already validated above — no callback needed)
        self.router.route(order, None).await?;

        Ok(())
    }

    /// Cancel order — always allowed, even when circuit breaker is open.
    /// This is a production safety rule: cancels must never be blocked.
    pub async fn cancel_order(&self, order_id: &str) -> Result<common::types::BrokerOrderStatus> {
        self.router.cancel_order(order_id).await
    }

    /// Expose risk manager for position updates, CB management, and reconciliation.
    pub fn risk_manager(&self) -> Arc<RwLock<RiskManagerService>> {
        self.risk_manager.clone()
    }

    /// Expose router for direct access (health checks, mode queries).
    pub fn router(&self) -> Arc<OrderRouter> {
        self.router.clone()
    }
}

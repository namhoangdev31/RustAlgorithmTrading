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

use common::{types::Order, Result};

use std::sync::Arc;

pub struct ExecutionEngineService {
    router: Arc<OrderRouter>,
    slippage_estimator: SlippageEstimator,
}

impl ExecutionEngineService {
    pub async fn new(config: common::config::ExecutionConfig) -> Result<Self> {
        let router = Arc::new(OrderRouter::new(config)?);
        let slippage_estimator = SlippageEstimator::new();

        let mode = router.get_trading_mode();
        if mode == common::types::TradingMode::Paper || mode == common::types::TradingMode::Live {
            let recon_router = router.clone();
            tokio::spawn(async move {
                let worker = ReconciliationWorker::new(recon_router, 10);
                worker.run().await;
            });
        }

        Ok(Self {
            router,
            slippage_estimator,
        })
    }

    pub async fn submit_order(
        &self,
        order: Order,
        cb_check_hook: Option<std::sync::Arc<dyn Fn() -> bool + Send + Sync>>,
    ) -> Result<()> {
        let _estimated_slippage = self.slippage_estimator.estimate(&order);

        self.router
            .route_with_cb_hook(order, None, cb_check_hook, None)
            .await?;

        Ok(())
    }
}

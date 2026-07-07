use crate::router::OrderRouter;
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

pub struct ReconciliationWorker {
    router: Arc<OrderRouter>,
    interval: Duration,
}

impl ReconciliationWorker {
    pub fn new(router: Arc<OrderRouter>, interval_seconds: u64) -> Self {
        Self {
            router,
            interval: Duration::from_secs(interval_seconds),
        }
    }

    pub async fn run(&self) {
        tracing::info!(
            "Starting Reconciliation Worker with interval {:?}",
            self.interval
        );

        loop {
            sleep(self.interval).await;

            if let Err(e) = self.reconcile().await {
                tracing::error!("Reconciliation run failed: {:?}", e);
            }
        }
    }

    async fn reconcile(&self) -> common::Result<()> {
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
}

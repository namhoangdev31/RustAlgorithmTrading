use common::metrics::{start_metrics_server, MetricsConfig};
use telemetry_engine::{ObservabilityConfig, ObservabilityEngine};
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    tracing::info!("[cid:INIT] Observability Engine starting...");

    let config = ObservabilityConfig::from_env()?;
    tracing::info!(
        "[cid:INIT] QuestDB ILP addr: {}; scrape_interval_ms: {}; targets: {}",
        config.questdb_ilp_addr,
        config.scrape_interval.as_millis(),
        config.targets.len()
    );

    let metrics_handle = match start_metrics_server(MetricsConfig::telemetry_engine()) {
        Ok(handle) => {
            tracing::info!("[cid:INIT] Metrics server started on port 9095");
            Some(handle)
        }
        Err(err) => {
            tracing::warn!(
                "[cid:INIT] Failed to start metrics server: {}. Continuing without metrics.",
                err
            );
            None
        }
    };

    let engine = ObservabilityEngine::new(config).await?;
    let result = engine.run_until_shutdown().await;

    if let Some(handle) = metrics_handle {
        handle.abort();
        tracing::info!("[cid:SHUTDOWN] Metrics server stopped");
    }

    result
}

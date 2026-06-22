use common::config::SystemConfig;
use common::health::HealthCheck;
use common::metrics::{start_metrics_server, MetricsConfig};
use signal_bridge::SignalBridgeService;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    tracing::info!("[cid:INIT] Signal Bridge Service starting...");

    // Load configuration with validation
    let config = match SystemConfig::from_file("ops/config/system.json") {
        Ok(cfg) => {
            tracing::info!(
                "[cid:INIT] Configuration loaded successfully - Environment: {}",
                cfg.environment()
            );
            cfg
        }
        Err(e) => {
            tracing::error!("[cid:INIT] Failed to load configuration: {}", e);
            return Err(anyhow::anyhow!("Configuration error: {}", e));
        }
    };

    // Log signal configuration
    tracing::info!("[cid:INIT] Signal Configuration:");
    tracing::info!("[cid:INIT]   Model Path: {}", config.signal.model_path);
    tracing::info!("[cid:INIT]   Features: {:?}", config.signal.features);
    tracing::info!(
        "[cid:INIT]   Update Interval: {}ms",
        config.signal.update_interval_ms
    );
    tracing::info!(
        "[cid:INIT]   ZMQ Subscribe: {}",
        config.signal.zmq_subscribe_address
    );
    tracing::info!(
        "[cid:INIT]   ZMQ Publish: {}",
        config.signal.zmq_publish_address
    );

    // Create health status tracker
    let health = Arc::new(RwLock::new(HealthCheck::healthy("signal-bridge")));

    let metrics_handle = match start_metrics_server(MetricsConfig::signal_bridge()) {
        Ok(handle) => {
            tracing::info!("[cid:INIT] Metrics server started on port 9094");
            Some(handle)
        }
        Err(e) => {
            tracing::warn!(
                "[cid:INIT] Failed to start metrics server: {}. Continuing without metrics.",
                e
            );
            None
        }
    };

    // Store values before move
    let features_count = config.signal.features.len();

    // Initialize service
    let _service = match SignalBridgeService::new(config.signal) {
        Ok(svc) => {
            tracing::info!("[cid:INIT] ✓ Signal Bridge initialized successfully");
            svc
        }
        Err(e) => {
            tracing::error!("[cid:INIT] Failed to initialize service: {}", e);
            let mut h = health.write().await;
            *h = HealthCheck::unhealthy("signal-bridge", format!("Initialization failed: {}", e));
            return Err(anyhow::anyhow!("Service initialization error: {}", e));
        }
    };

    // Update health status
    {
        let mut h = health.write().await;
        *h = HealthCheck::healthy("signal-bridge")
            .with_metric("status", "ready")
            .with_metric("features_count", features_count.to_string())
            .with_message("Ready for Python ML integration");
    }

    tracing::info!("[cid:INIT] 🚀 Signal Bridge ready for Python integration");

    // Keep service running
    tokio::signal::ctrl_c().await?;
    tracing::info!("[cid:INIT] Shutdown signal received, stopping Signal Bridge...");

    if let Some(handle) = metrics_handle {
        handle.abort();
    }

    Ok(())
}

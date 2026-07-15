use common::config::SystemConfig;
use common::health::HealthCheck;
use common::metrics::{start_metrics_server, MetricsConfig};
use execution_engine::ExecutionEngineService;
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

    tracing::info!("[cid:INIT] Execution Engine Service starting...");

    // Load configuration with validation
    let config = match SystemConfig::from_file("ops/config/system.json") {
        Ok(cfg) => {
            tracing::info!(
                "[cid:INIT] Configuration loaded successfully - Environment: {}, Trading Mode: {}, Live Enabled: {}, Kill Switch: {}",
                cfg.environment(),
                cfg.execution.trading_mode,
                cfg.execution.policy.live_trading_enabled,
                cfg.execution.policy.kill_switch_enabled
            );
            cfg
        }
        Err(e) => {
            tracing::error!("[cid:INIT] Failed to load configuration: {}", e);
            return Err(anyhow::anyhow!("Configuration error: {}", e));
        }
    };

    // Production safety check
    if config.is_production() && config.is_paper_trading() {
        tracing::warn!("[cid:INIT] ⚠️  Production environment with paper trading enabled!");
    }

    if config.is_production() && config.is_live_trading() {
        tracing::warn!("[cid:INIT] 🔴 LIVE TRADING MODE - Real money at risk!");
        tracing::warn!("[cid:INIT] API URL: {}", config.execution.exchange_api_url);
    }

    // Create health status tracker
    let health = Arc::new(RwLock::new(HealthCheck::healthy("execution-engine")));

    // Start metrics server
    let metrics_config = MetricsConfig::execution_engine();
    let metrics_handle = match start_metrics_server(metrics_config) {
        Ok(handle) => {
            tracing::info!("[cid:INIT] ✓ Metrics server started on port 9092");
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
    let trading_mode = config.execution.trading_mode;
    let live_enabled = config.execution.policy.live_trading_enabled;
    let kill_switch = config.execution.policy.kill_switch_enabled;
    let environment = config.environment();
    let risk_config = config.risk.clone();

    // Initialize service
    let service = match ExecutionEngineService::new(config.execution, risk_config).await {
        Ok(svc) => {
            tracing::info!("[cid:INIT] ✓ Execution Engine initialized successfully");
            svc
        }
        Err(e) => {
            tracing::error!("[cid:INIT] Failed to initialize service: {}", e);
            let mut h = health.write().await;
            *h =
                HealthCheck::unhealthy("execution-engine", format!("Initialization failed: {}", e));
            return Err(anyhow::anyhow!("Service initialization error: {}", e));
        }
    };

    // Update health status
    {
        let mut h = health.write().await;
        *h = HealthCheck::healthy("execution-engine")
            .with_metric("status", "ready")
            .with_metric("trading_mode", trading_mode.to_string())
            .with_metric("live_enabled", live_enabled.to_string())
            .with_metric("kill_switch", kill_switch.to_string())
            .with_metric("environment", &environment);
    }

    tracing::info!("[cid:INIT] 🚀 Execution Engine is ready");

    let service = Arc::new(service);
    if let Ok(address) = std::env::var("QUANTANT_NATS_ADDRESS") {
        let delivery_subject = std::env::var("QUANTANT_EXECUTION_DELIVERY_SUBJECT")
            .unwrap_or_else(|_| "quantant.execution.engine".to_string());
        let consumer_service = service.clone();
        tokio::spawn(async move {
            if let Err(error) =
                execution_engine::nats_consumer::run(consumer_service, address, delivery_subject)
                    .await
            {
                tracing::error!("[cid:INIT] QuantAnt command consumer stopped: {error}");
            }
        });
    } else {
        tracing::warn!("[cid:INIT] QUANTANT_NATS_ADDRESS unset; command consumer disabled");
    }

    // Keep service running
    tokio::signal::ctrl_c().await?;
    tracing::info!("[cid:INIT] Shutdown signal received, stopping Execution Engine...");

    // Stop metrics server
    if let Some(handle) = metrics_handle {
        handle.abort();
        tracing::info!("[cid:INIT] Metrics server stopped");
    }

    Ok(())
}

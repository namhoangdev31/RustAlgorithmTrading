use common::config::SystemConfig;
use common::health::HealthCheck;
use common::metrics::{risk as risk_metrics, start_metrics_server, MetricsConfig};
use risk_manager::{reload::load_risk_config_from_toml, RiskManagerService};
use std::sync::Arc;
#[cfg(unix)]
use tokio::signal::unix::{signal, SignalKind};
use tokio::sync::RwLock;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

const RISK_LIMITS_CONFIG_PATH: &str = "config/risk_limits.toml";

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    tracing::info!("[cid:INIT] Risk Manager Service starting...");

    // Load configuration with validation
    let config = match SystemConfig::from_file("config/system.json") {
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

    // Log risk limits
    tracing::info!("[cid:INIT] Risk Limits:");
    tracing::info!(
        "[cid:INIT]   Max Position Size: {}",
        config.risk.max_position_size
    );
    tracing::info!(
        "[cid:INIT]   Max Notional Exposure: ${}",
        config.risk.max_notional_exposure
    );
    tracing::info!(
        "[cid:INIT]   Max Open Positions: {}",
        config.risk.max_open_positions
    );
    tracing::info!("[cid:INIT]   Stop Loss: {}%", config.risk.stop_loss_percent);
    tracing::info!(
        "[cid:INIT]   Trailing Stop: {}%",
        config.risk.trailing_stop_percent
    );
    tracing::info!(
        "[cid:INIT]   Circuit Breaker: {}",
        if config.risk.enable_circuit_breaker {
            "ENABLED"
        } else {
            "DISABLED"
        }
    );
    tracing::info!(
        "[cid:INIT]   Max Loss Threshold: ${}",
        config.risk.max_loss_threshold
    );

    // Create health status tracker
    let health = Arc::new(RwLock::new(HealthCheck::healthy("risk-manager")));

    // Start metrics server
    let metrics_config = MetricsConfig::risk_manager();
    let metrics_handle = match start_metrics_server(metrics_config) {
        Ok(handle) => {
            tracing::info!("[cid:INIT] ✓ Metrics server started on port 9093");
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

    // Store values needed after moving config.risk
    let circuit_breaker_enabled = config.risk.enable_circuit_breaker;
    let max_positions = config.risk.max_open_positions;

    // Initialize service
    let service = match RiskManagerService::new(config.risk) {
        Ok(svc) => {
            tracing::info!("[cid:INIT] ✓ Risk Manager initialized successfully");
            Arc::new(RwLock::new(svc))
        }
        Err(e) => {
            tracing::error!("[cid:INIT] Failed to initialize service: {}", e);
            let mut h = health.write().await;
            *h = HealthCheck::unhealthy("risk-manager", format!("Initialization failed: {}", e));
            return Err(anyhow::anyhow!("Service initialization error: {}", e));
        }
    };

    // Update health status
    {
        let mut h = health.write().await;
        *h = HealthCheck::healthy("risk-manager")
            .with_metric("status", "monitoring")
            .with_metric("circuit_breaker", circuit_breaker_enabled.to_string())
            .with_metric("max_positions", max_positions.to_string());
    }

    tracing::info!("[cid:INIT] 🚀 Risk Manager is monitoring");

    #[cfg(unix)]
    let mut sighup = signal(SignalKind::hangup())
        .map_err(|e| anyhow::anyhow!("Failed to register SIGHUP handler: {}", e))?;

    loop {
        #[cfg(unix)]
        tokio::select! {
            _ = tokio::signal::ctrl_c() => {
                tracing::info!("[cid:INIT] Shutdown signal received, stopping Risk Manager...");
                break;
            }
            maybe_hup = sighup.recv() => {
                if maybe_hup.is_some() {
                    tracing::info!("[cid:INIT] SIGHUP received, reloading risk config from {}", RISK_LIMITS_CONFIG_PATH);
                    reload_risk_limits(&service).await;
                }
            }
        }

        #[cfg(not(unix))]
        {
            tokio::signal::ctrl_c().await?;
            tracing::info!("[cid:INIT] Shutdown signal received, stopping Risk Manager...");
            break;
        }
    }

    // Stop metrics server
    if let Some(handle) = metrics_handle {
        handle.abort();
        tracing::info!("[cid:INIT] Metrics server stopped");
    }

    Ok(())
}

async fn reload_risk_limits(service: &Arc<RwLock<RiskManagerService>>) {
    match load_risk_config_from_toml(RISK_LIMITS_CONFIG_PATH) {
        Ok(new_config) => {
            {
                let mut svc = service.write().await;
                svc.reload_risk_config(new_config);
            }
            risk_metrics::record_config_reload("success", "NONE");
            tracing::info!("[cid:INIT] Risk config hot-reload applied successfully");
        }
        Err(e) => {
            let reason = classify_reload_failure(&e.to_string());
            risk_metrics::record_config_reload("failed", reason);
            tracing::error!(
                "[cid:INIT] Risk config hot-reload failed ({}): {}",
                reason,
                e
            );
        }
    }
}

fn classify_reload_failure(message: &str) -> &'static str {
    if message.contains("daily loss mismatch") {
        "DAILY_LOSS_MISMATCH"
    } else if message.contains("failed to read risk limits file") {
        "IO_ERROR"
    } else if message.contains("failed to parse risk_limits.toml") {
        "PARSE_ERROR"
    } else {
        "VALIDATION_ERROR"
    }
}

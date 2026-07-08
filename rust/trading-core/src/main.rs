use common::config::SystemConfig;
use common::metrics::{start_metrics_server, MetricsConfig};
use execution_engine::ExecutionEngineService;
use market_data::MarketDataService;
use observability_engine::{ObservabilityConfig, ObservabilityEngine, ScrapeTarget};
use std::sync::Arc;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::registry()
        .with(fmt::layer())
        .with(EnvFilter::from_default_env())
        .init();

    tracing::info!("[cid:INIT] Trading Core starting...");

    let config = SystemConfig::from_file("ops/config/system.json")
        .map_err(|err| anyhow::anyhow!("configuration error: {}", err))?;

    if config.is_production() && config.is_paper_trading() {
        tracing::warn!("[cid:INIT] Production environment with paper trading enabled");
    }
    if config.is_production() && config.is_live_trading() {
        tracing::warn!("[cid:INIT] LIVE TRADING MODE - real money at risk");
    }

    let metrics_handle = match start_metrics_server(trading_core_metrics_config()) {
        Ok(handle) => {
            tracing::info!("[cid:INIT] Trading Core metrics server started");
            Some(handle)
        }
        Err(err) => {
            tracing::warn!(
                "[cid:INIT] Failed to start Trading Core metrics server: {}. Continuing.",
                err
            );
            None
        }
    };

    let execution = Arc::new(
        ExecutionEngineService::new(config.execution.clone(), config.risk.clone()).await?,
    );
    tracing::info!("[cid:INIT] Execution and risk modules initialized in-process");

    #[cfg(unix)]
    {
        let exec_clone = execution.clone();
        tokio::spawn(async move {
            use tokio::signal::unix::{signal, SignalKind};
            let mut sighup = match signal(SignalKind::hangup()) {
                Ok(s) => s,
                Err(err) => {
                    tracing::error!("[cid:CONFIG] Failed to register SIGHUP signal: {}", err);
                    return;
                }
            };
            loop {
                sighup.recv().await;
                tracing::info!("[cid:CONFIG] SIGHUP received, reloading risk limits from ops/config/risk_limits.toml");
                match risk_manager::reload::load_risk_config_from_toml("ops/config/risk_limits.toml") {
                    Ok(new_limits) => {
                        let risk_mgr = exec_clone.risk_manager();
                        match risk_mgr.write() {
                            Ok(mut writer) => {
                                writer.reload_risk_config(new_limits);
                                common::metrics::risk::record_config_reload("success", "NONE");
                                tracing::info!("[cid:CONFIG] Risk limits hot-reload applied successfully");
                            }
                            Err(_) => {
                                common::metrics::risk::record_config_reload("failed", "VALIDATION_ERROR");
                                tracing::error!("[cid:CONFIG] Risk manager RwLock poisoned, cannot reload");
                            }
                        };
                    }
                    Err(err) => {
                        let err_msg = err.to_string();
                        let reason = if err_msg.contains("daily loss mismatch") {
                            "DAILY_LOSS_MISMATCH"
                        } else if err_msg.contains("failed to read risk limits file") {
                            "IO_ERROR"
                        } else if err_msg.contains("failed to parse risk_limits.toml") {
                            "PARSE_ERROR"
                        } else {
                            "VALIDATION_ERROR"
                        };
                        common::metrics::risk::record_config_reload("failed", reason);
                        tracing::error!("[cid:CONFIG] Risk config hot-reload failed ({}): {}", reason, err_msg);
                    }
                }
            }
        });
    }

    let observability_config = trading_core_observability_config()?;
    let mut observability_task = tokio::spawn(run_observability(observability_config));

    let market_config = config.market_data.clone();
    let trading_mode = config.execution.trading_mode;
    let mut market_task = tokio::spawn(async move {
        let mut service = MarketDataService::new(market_config, trading_mode).await?;
        service.run().await
    });

    tracing::info!("[cid:INIT] Trading Core is ready");

    tokio::select! {
        signal = tokio::signal::ctrl_c() => {
            signal?;
            tracing::info!("[cid:SHUTDOWN] Trading Core shutdown signal received");
        }
        result = &mut market_task => {
            result??;
            tracing::warn!("[cid:SHUTDOWN] Market data task exited");
        }
        result = &mut observability_task => {
            result??;
            tracing::warn!("[cid:SHUTDOWN] Observability task exited");
        }
    }

    market_task.abort();
    observability_task.abort();
    if let Some(handle) = metrics_handle {
        handle.abort();
    }

    Ok(())
}

async fn run_observability(config: ObservabilityConfig) -> anyhow::Result<()> {
    let interval = config.scrape_interval;
    let engine = ObservabilityEngine::new(config).await?;
    let mut ticker = tokio::time::interval(interval);

    loop {
        ticker.tick().await;
        if let Err(err) = engine.run_once().await {
            tracing::error!("trading-core observability cycle failed: {}", err);
            metrics::counter!("observability_engine_ingestion_failures_total").increment(1);
        }
    }
}

fn trading_core_metrics_config() -> MetricsConfig {
    MetricsConfig {
        host: env_or(
            "TRADING_CORE_METRICS_HOST",
            env_or("METRICS_HOST", "0.0.0.0"),
        ),
        port: env_u16("TRADING_CORE_METRICS_PORT", 9090),
    }
}

fn trading_core_observability_config() -> anyhow::Result<ObservabilityConfig> {
    let mut config = ObservabilityConfig::from_env()?;
    let default_url = "http://127.0.0.1:9090/metrics".to_string();

    for target in &mut config.targets {
        let env_key = match target.service.as_str() {
            "market_data" => "MARKET_DATA_METRICS_URL",
            "execution" => "EXECUTION_METRICS_URL",
            "risk" => "RISK_METRICS_URL",
            _ => "",
        };
        if !env_key.is_empty() && std::env::var_os(env_key).is_none() {
            target.url = default_url.clone();
        }
    }

    if config.targets.is_empty() {
        config.targets = ["market_data", "execution", "risk"]
            .into_iter()
            .map(|service| ScrapeTarget {
                service: service.to_string(),
                url: default_url.clone(),
            })
            .collect();
    }

    Ok(config)
}

fn env_or(key: &str, fallback: impl Into<String>) -> String {
    std::env::var(key).unwrap_or_else(|_| fallback.into())
}

fn env_u16(key: &str, fallback: u16) -> u16 {
    std::env::var(key)
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(fallback)
}

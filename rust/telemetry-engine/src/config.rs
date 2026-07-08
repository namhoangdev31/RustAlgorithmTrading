use std::path::PathBuf;
use std::time::Duration;

use crate::integrity::Thresholds;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ScrapeTarget {
    pub service: String,
    pub url: String,
}

#[derive(Debug, Clone)]
pub struct ObservabilityConfig {
    pub duckdb_path: PathBuf,
    pub scrape_interval: Duration,
    pub scrape_timeout: Duration,
    pub integrity_thresholds: Thresholds,
    pub targets: Vec<ScrapeTarget>,
}

impl ObservabilityConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let duckdb_path = env_or("TELEMETRY_DUCKDB_PATH", "data/telemetry.duckdb");
        let scrape_interval = duration_from_ms_env("OBSERVABILITY_SCRAPE_INTERVAL_MS", 1000)?;
        let scrape_timeout = duration_from_ms_env("OBSERVABILITY_SCRAPE_TIMEOUT_MS", 5000)?;
        let integrity_thresholds = Thresholds::from_env()?;

        let targets = [
            (
                "market_data",
                env_or("MARKET_DATA_METRICS_URL", "http://127.0.0.1:9091/metrics"),
            ),
            (
                "execution",
                env_or("EXECUTION_METRICS_URL", "http://127.0.0.1:9092/metrics"),
            ),
            (
                "risk",
                env_or("RISK_METRICS_URL", "http://127.0.0.1:9093/metrics"),
            ),
        ]
        .into_iter()
        .filter(|(_, url)| !url.trim().is_empty())
        .map(|(service, url)| ScrapeTarget {
            service: service.to_string(),
            url,
        })
        .collect();

        Ok(Self {
            duckdb_path: PathBuf::from(duckdb_path),
            scrape_interval,
            scrape_timeout,
            integrity_thresholds,
            targets,
        })
    }
}

fn env_or(key: &str, default: &str) -> String {
    std::env::var(key).unwrap_or_else(|_| default.to_string())
}

fn duration_from_ms_env(key: &str, default_ms: u64) -> anyhow::Result<Duration> {
    let value = std::env::var(key)
        .ok()
        .map(|raw| {
            raw.parse::<u64>()
                .map_err(|e| anyhow::anyhow!("invalid {} value {}: {}", key, raw, e))
        })
        .transpose()?
        .unwrap_or(default_ms);

    Ok(Duration::from_millis(value.max(100)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_duration_env_uses_default() {
        let value =
            duration_from_ms_env("OBSERVABILITY_ENGINE_TEST_MISSING_DURATION", 1250).unwrap();

        assert_eq!(value, Duration::from_millis(1250));
    }
}

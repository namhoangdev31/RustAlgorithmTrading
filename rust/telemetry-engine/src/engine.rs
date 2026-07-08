use crate::config::ObservabilityConfig;
use crate::integrity::{IntegrityEngine, IntegrityReport};
use crate::scraper::Scraper;
use database::{DatabaseManager, MetricRecord, SystemEvent};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IngestionStats {
    pub targets: usize,
    pub failed_targets: usize,
    pub inserted_metrics: usize,
}

#[derive(Clone)]
pub struct ObservabilityEngine {
    config: ObservabilityConfig,
    db: DatabaseManager,
    scraper: Scraper,
    integrity: IntegrityEngine,
}

impl ObservabilityEngine {
    pub async fn new(config: ObservabilityConfig) -> anyhow::Result<Self> {
        let db = DatabaseManager::new(&config.duckdb_path).await?;
        db.initialize().await?;
        let scraper = Scraper::new(config.scrape_timeout)?;
        let integrity = IntegrityEngine::new(config.integrity_thresholds.clone());

        Ok(Self {
            config,
            db,
            scraper,
            integrity,
        })
    }

    pub async fn run_until_shutdown(&self) -> anyhow::Result<()> {
        let mut ticker = tokio::time::interval(self.config.scrape_interval);

        loop {
            tokio::select! {
                _ = ticker.tick() => {
                    if let Err(err) = self.run_once().await {
                        tracing::error!("observability ingestion cycle failed: {}", err);
                        metrics::counter!("telemetry_engine_ingestion_failures_total").increment(1);
                    }
                }
                signal = tokio::signal::ctrl_c() => {
                    signal?;
                    tracing::info!("telemetry-engine shutdown signal received");
                    break;
                }
            }
        }

        Ok(())
    }

    pub async fn run_once(&self) -> anyhow::Result<IngestionStats> {
        let results = self.scraper.scrape_all(&self.config.targets).await;
        let mut failed_targets = 0;
        let mut records = Vec::new();

        for result in results {
            if let Some(error) = result.error {
                failed_targets += 1;
                tracing::warn!(service = result.service, error, "metrics scrape failed");
                continue;
            }

            records.extend(metrics_to_records(result.service.as_str(), result.metrics));
        }

        let inserted_metrics = records.len();
        let report = self.integrity.evaluate_records(&records);
        let integrity_event = (!report.is_valid).then(|| integrity_event(&report));
        if inserted_metrics > 0 || integrity_event.is_some() {
            let db = self.db.clone();
            tokio::task::spawn_blocking(move || {
                if inserted_metrics > 0 {
                    db.insert_metrics_blocking(&records)?;
                }
                if let Some(event) = integrity_event {
                    db.insert_event_blocking(&event)?;
                }
                database::Result::Ok(())
            })
            .await??;
        }

        metrics::counter!("telemetry_engine_scrape_targets_total")
            .increment(self.config.targets.len() as u64);
        metrics::counter!("telemetry_engine_scrape_target_failures_total")
            .increment(failed_targets as u64);
        metrics::counter!("telemetry_engine_metrics_inserted_total")
            .increment(inserted_metrics as u64);
        metrics::gauge!("telemetry_engine_integrity_valid").set(if report.is_valid {
            1.0
        } else {
            0.0
        });
        if !report.is_valid {
            metrics::counter!("telemetry_engine_kill_switch_requests_total").increment(1);
            tracing::error!(
                reasons = ?report.reasons,
                "integrity validation failed; kill switch requested"
            );
        }

        tracing::debug!(
            targets = self.config.targets.len(),
            failed_targets,
            inserted_metrics,
            "observability ingestion cycle completed"
        );

        Ok(IngestionStats {
            targets: self.config.targets.len(),
            failed_targets,
            inserted_metrics,
        })
    }

    pub fn database(&self) -> &DatabaseManager {
        &self.db
    }
}

fn integrity_event(report: &IntegrityReport) -> SystemEvent {
    SystemEvent::new(
        "risk.kill_switch",
        "CRITICAL",
        "Integrity validation failed; kill switch requested",
    )
    .with_details(serde_json::json!({
        "is_valid": report.is_valid,
        "reasons": report.reasons,
        "metrics": report.metrics,
        "source": "telemetry-engine"
    }))
}

fn metrics_to_records(
    service: &str,
    metrics: Vec<crate::parser::ParsedMetric>,
) -> Vec<MetricRecord> {
    metrics
        .into_iter()
        .map(|metric| metric.into_record(service))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::ScrapeTarget;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio::net::TcpListener;

    #[tokio::test]
    async fn run_once_ingests_fixture_metrics() {
        let url = spawn_fixture_server(
            "# TYPE engine_metric gauge\nengine_metric{symbol=\"AAPL\"} 12.5\n",
        )
        .await;
        let dir = tempfile::tempdir().unwrap();
        let config = ObservabilityConfig {
            duckdb_path: dir.path().join("telemetry.duckdb"),
            scrape_interval: std::time::Duration::from_secs(60),
            scrape_timeout: std::time::Duration::from_secs(2),
            integrity_thresholds: crate::integrity::Thresholds::default(),
            targets: vec![ScrapeTarget {
                service: "fixture".to_string(),
                url,
            }],
        };
        let engine = ObservabilityEngine::new(config).await.unwrap();

        let stats = engine.run_once().await.unwrap();
        let rows = engine
            .database()
            .get_metrics("engine_metric", Some("AAPL"), None, 10)
            .await
            .unwrap();

        assert_eq!(stats.inserted_metrics, 1);
        assert_eq!(rows.len(), 1);
    }

    #[tokio::test]
    async fn run_once_logs_integrity_breach_event() {
        let url = spawn_fixture_server("pnl_drift_pct 0.5\n").await;
        let dir = tempfile::tempdir().unwrap();
        let config = ObservabilityConfig {
            duckdb_path: dir.path().join("telemetry.duckdb"),
            scrape_interval: std::time::Duration::from_secs(60),
            scrape_timeout: std::time::Duration::from_secs(2),
            integrity_thresholds: crate::integrity::Thresholds::default(),
            targets: vec![ScrapeTarget {
                service: "fixture".to_string(),
                url,
            }],
        };
        let engine = ObservabilityEngine::new(config).await.unwrap();

        engine.run_once().await.unwrap();
        let events = engine
            .database()
            .get_events(Some("CRITICAL"), 10)
            .await
            .unwrap();

        assert_eq!(events.len(), 1);
        assert_eq!(events[0].event_type, "risk.kill_switch");
    }

    async fn spawn_fixture_server(body: &'static str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let addr = listener.local_addr().unwrap();

        tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut buffer = [0_u8; 1024];
            let _ = socket.read(&mut buffer).await.unwrap();
            let response = format!(
                "HTTP/1.1 200 OK\r\nContent-Length: {}\r\n\r\n{}",
                body.len(),
                body
            );
            socket.write_all(response.as_bytes()).await.unwrap();
        });

        format!("http://{}", addr)
    }
}

use database::MetricRecord;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Thresholds {
    pub max_pnl_drift_pct: f64,
    pub max_exposure_drift_bps: f64,
    pub max_latency_regression_ratio: f64,
    pub allow_fallbacks: bool,
    pub allow_reconciliation_failures: bool,
}

impl Default for Thresholds {
    fn default() -> Self {
        Self {
            max_pnl_drift_pct: 0.10,
            max_exposure_drift_bps: 5.0,
            max_latency_regression_ratio: 1.50,
            allow_fallbacks: false,
            allow_reconciliation_failures: false,
        }
    }
}

impl Thresholds {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Self {
            max_pnl_drift_pct: env_f64("INTEGRITY_MAX_PNL_DRIFT_PCT", 0.10)?,
            max_exposure_drift_bps: env_f64("INTEGRITY_MAX_EXPOSURE_DRIFT_BPS", 5.0)?,
            max_latency_regression_ratio: env_f64("INTEGRITY_MAX_LATENCY_REGRESSION_RATIO", 1.50)?,
            allow_fallbacks: env_bool("INTEGRITY_ALLOW_FALLBACKS", false)?,
            allow_reconciliation_failures: env_bool(
                "INTEGRITY_ALLOW_RECONCILIATION_FAILURES",
                false,
            )?,
        })
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct IntegrityMetrics {
    pub pnl_drift_pct: f64,
    pub exposure_drift_bps: f64,
    pub false_allow_delta: i32,
    pub false_reject_delta: i32,
    pub blocked_delta: i32,
    pub timeout_count: i32,
    pub crash_count: i32,
    pub fallback_count: i32,
    pub reconciliation_failure_count: i32,
    pub latency_regression_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IntegrityReport {
    pub is_valid: bool,
    pub reasons: Vec<String>,
    pub metrics: IntegrityMetrics,
}

#[derive(Debug, Clone)]
pub struct IntegrityEngine {
    thresholds: Thresholds,
}

impl IntegrityEngine {
    pub fn new(thresholds: Thresholds) -> Self {
        Self { thresholds }
    }

    pub fn evaluate_records(&self, records: &[MetricRecord]) -> IntegrityReport {
        self.validate(&IntegrityMetrics::from_records(records))
    }

    pub fn validate(&self, metrics: &IntegrityMetrics) -> IntegrityReport {
        validate_run_integrity(metrics, &self.thresholds)
    }
}

impl IntegrityMetrics {
    pub fn from_records(records: &[MetricRecord]) -> Self {
        let mut metrics = Self::default();

        for record in records {
            match normalize_metric_name(&record.metric_name).as_str() {
                "pnl_drift_pct" => metrics.pnl_drift_pct = record.value,
                "exposure_drift_bps" => metrics.exposure_drift_bps = record.value,
                "false_allow_delta" => metrics.false_allow_delta = value_to_i32(record.value),
                "false_reject_delta" => metrics.false_reject_delta = value_to_i32(record.value),
                "blocked_delta" => metrics.blocked_delta = value_to_i32(record.value),
                "timeout_count" => metrics.timeout_count = value_to_i32(record.value),
                "crash_count" => metrics.crash_count = value_to_i32(record.value),
                "fallback_count" => metrics.fallback_count = value_to_i32(record.value),
                "reconciliation_failure_count" => {
                    metrics.reconciliation_failure_count = value_to_i32(record.value)
                }
                "latency_regression_ratio" => metrics.latency_regression_ratio = record.value,
                _ => {}
            }
        }

        metrics
    }
}

pub fn validate_run_integrity(
    metrics: &IntegrityMetrics,
    thresholds: &Thresholds,
) -> IntegrityReport {
    let mut reasons = Vec::new();

    if metrics.pnl_drift_pct > thresholds.max_pnl_drift_pct {
        reasons.push(format!(
            "PnL drift breach: {:.4}% > {:.4}%",
            metrics.pnl_drift_pct, thresholds.max_pnl_drift_pct
        ));
    }
    if metrics.exposure_drift_bps > thresholds.max_exposure_drift_bps {
        reasons.push(format!(
            "Exposure drift breach: {:.4} bps > {:.4} bps",
            metrics.exposure_drift_bps, thresholds.max_exposure_drift_bps
        ));
    }
    if metrics.false_allow_delta != 0 {
        reasons.push(format!(
            "False-allow delta detected: {}",
            metrics.false_allow_delta
        ));
    }
    if metrics.false_reject_delta != 0 {
        reasons.push(format!(
            "False-reject delta detected: {}",
            metrics.false_reject_delta
        ));
    }
    if metrics.blocked_delta != 0 {
        reasons.push(format!(
            "Blocked signal delta detected: {}",
            metrics.blocked_delta
        ));
    }
    if metrics.crash_count > 0 {
        reasons.push(format!("Runtime crashes detected: {}", metrics.crash_count));
    }
    if metrics.timeout_count > 0 {
        reasons.push(format!(
            "Runtime timeouts detected: {}",
            metrics.timeout_count
        ));
    }
    if !thresholds.allow_fallbacks && metrics.fallback_count > 0 {
        reasons.push(format!(
            "Unsanctioned fallback to legacy code: {}",
            metrics.fallback_count
        ));
    }
    if !thresholds.allow_reconciliation_failures && metrics.reconciliation_failure_count > 0 {
        reasons.push(format!(
            "State reconciliation failures: {}",
            metrics.reconciliation_failure_count
        ));
    }
    if metrics.latency_regression_ratio > thresholds.max_latency_regression_ratio {
        reasons.push(format!(
            "Latency regression: {:.2}x > {:.2}x",
            metrics.latency_regression_ratio, thresholds.max_latency_regression_ratio
        ));
    }

    IntegrityReport {
        is_valid: reasons.is_empty(),
        reasons,
        metrics: metrics.clone(),
    }
}

fn normalize_metric_name(name: &str) -> String {
    let suffix = name.rsplit(['.', ':']).next().unwrap_or(name);
    suffix.replace('-', "_").to_ascii_lowercase()
}

fn value_to_i32(value: f64) -> i32 {
    value.round() as i32
}

fn env_f64(key: &str, default: f64) -> anyhow::Result<f64> {
    std::env::var(key)
        .ok()
        .map(|raw| {
            raw.parse::<f64>()
                .map_err(|e| anyhow::anyhow!("invalid {} value {}: {}", key, raw, e))
        })
        .transpose()
        .map(|value| value.unwrap_or(default))
}

fn env_bool(key: &str, default: bool) -> anyhow::Result<bool> {
    std::env::var(key)
        .ok()
        .map(|raw| match raw.to_ascii_lowercase().as_str() {
            "1" | "true" | "yes" | "on" => Ok(true),
            "0" | "false" | "no" | "off" => Ok(false),
            _ => Err(anyhow::anyhow!("invalid {} value {}", key, raw)),
        })
        .transpose()
        .map(|value| value.unwrap_or(default))
}

#[cfg(test)]
mod tests {
    use super::*;
    use database::MetricRecord;

    #[test]
    fn validates_safe_metrics() {
        let report = validate_run_integrity(&IntegrityMetrics::default(), &Thresholds::default());

        assert!(report.is_valid);
        assert!(report.reasons.is_empty());
    }

    #[test]
    fn reports_all_breaches() {
        let metrics = IntegrityMetrics {
            pnl_drift_pct: 0.2,
            exposure_drift_bps: 8.0,
            false_allow_delta: 1,
            false_reject_delta: -1,
            blocked_delta: 2,
            timeout_count: 1,
            crash_count: 1,
            fallback_count: 1,
            reconciliation_failure_count: 1,
            latency_regression_ratio: 2.0,
        };

        let report = validate_run_integrity(&metrics, &Thresholds::default());

        assert!(!report.is_valid);
        assert_eq!(report.reasons.len(), 10);
    }

    #[test]
    fn builds_metrics_from_records() {
        let records = vec![
            MetricRecord::new("integrity.pnl_drift_pct", 0.12),
            MetricRecord::new("latency_regression_ratio", 1.7),
            MetricRecord::new("reconciliation_failure_count", 2.0),
        ];

        let metrics = IntegrityMetrics::from_records(&records);

        assert_eq!(metrics.pnl_drift_pct, 0.12);
        assert_eq!(metrics.latency_regression_ratio, 1.7);
        assert_eq!(metrics.reconciliation_failure_count, 2);
    }
}

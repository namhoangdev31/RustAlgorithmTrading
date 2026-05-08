use common::{config::RiskConfig, Result, TradingError};
use serde::Deserialize;

const DAILY_LOSS_EPSILON: f64 = 1e-9;

#[derive(Debug, Deserialize)]
struct RiskLimitsToml {
    position_limits: PositionLimits,
    loss_limits: LossLimits,
    stop_loss: StopLoss,
    circuit_breaker: CircuitBreaker,
}

#[derive(Debug, Deserialize)]
struct PositionLimits {
    max_notional_per_position: f64,
    max_total_exposure: f64,
    max_open_positions: usize,
}

#[derive(Debug, Deserialize)]
struct LossLimits {
    max_daily_loss: f64,
}

#[derive(Debug, Deserialize)]
struct StopLoss {
    default_stop_loss_percent: f64,
    trailing_stop_percent: f64,
}

#[derive(Debug, Deserialize)]
struct CircuitBreaker {
    enabled: bool,
    daily_loss_threshold: f64,
}

/// Parse risk limits TOML content into runtime RiskConfig.
pub fn parse_risk_config_toml(content: &str) -> Result<RiskConfig> {
    let parsed: RiskLimitsToml = toml::from_str(content).map_err(|e| {
        TradingError::Configuration(format!("failed to parse risk_limits.toml: {}", e))
    })?;

    if (parsed.loss_limits.max_daily_loss - parsed.circuit_breaker.daily_loss_threshold).abs()
        > DAILY_LOSS_EPSILON
    {
        return Err(TradingError::Configuration(format!(
            "daily loss mismatch: loss_limits.max_daily_loss ({}) != circuit_breaker.daily_loss_threshold ({})",
            parsed.loss_limits.max_daily_loss, parsed.circuit_breaker.daily_loss_threshold
        )));
    }

    let cfg = RiskConfig {
        max_position_size: parsed.position_limits.max_notional_per_position,
        max_notional_exposure: parsed.position_limits.max_total_exposure,
        max_open_positions: parsed.position_limits.max_open_positions,
        stop_loss_percent: parsed.stop_loss.default_stop_loss_percent,
        trailing_stop_percent: parsed.stop_loss.trailing_stop_percent,
        enable_circuit_breaker: parsed.circuit_breaker.enabled,
        max_loss_threshold: parsed.loss_limits.max_daily_loss,
        sizing_amount: 0.0,
    };

    cfg.validate()?;
    Ok(cfg)
}

/// Load risk limits from TOML file and map to runtime RiskConfig.
pub fn load_risk_config_from_toml(path: &str) -> Result<RiskConfig> {
    let content = std::fs::read_to_string(path).map_err(|e| {
        TradingError::Configuration(format!("failed to read risk limits file {}: {}", path, e))
    })?;
    parse_risk_config_toml(&content)
}

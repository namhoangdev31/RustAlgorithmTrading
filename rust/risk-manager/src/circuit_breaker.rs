use chrono::{DateTime, Duration, Utc};
use common::{config::RiskConfig, Result, TradingError};
use serde::{Deserialize, Serialize};
use tracing::{info, warn};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CircuitBreakerState {
    Closed,
    Open,
    ResetPending,
    HalfOpen,
    Disabled,
}

impl CircuitBreakerState {
    pub fn as_token(&self) -> &'static str {
        match self {
            CircuitBreakerState::Closed => "CLOSED",
            CircuitBreakerState::Open => "OPEN",
            CircuitBreakerState::ResetPending => "RESET_PENDING",
            CircuitBreakerState::HalfOpen => "HALF_OPEN",
            CircuitBreakerState::Disabled => "DISABLED",
        }
    }

    fn is_risk_off(&self) -> bool {
        matches!(
            self,
            CircuitBreakerState::Open
                | CircuitBreakerState::ResetPending
                | CircuitBreakerState::HalfOpen
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TripReason {
    DailyLoss,
    Manual,
    Emergency,
    RiskFailure,
    SystemHealth,
    ProbeFailed,
    ResetApproved,
}

impl TripReason {
    pub fn as_token(&self) -> &'static str {
        match self {
            TripReason::DailyLoss => "DAILY_LOSS",
            TripReason::Manual => "MANUAL",
            TripReason::Emergency => "EMERGENCY",
            TripReason::RiskFailure => "RISK_FAILURE",
            TripReason::SystemHealth => "SYSTEM_HEALTH",
            TripReason::ProbeFailed => "PROBE_FAILED",
            TripReason::ResetApproved => "RESET_APPROVED",
        }
    }
}

pub struct CircuitBreaker {
    config: RiskConfig,
    state: CircuitBreakerState,
    tripped_at: Option<DateTime<Utc>>,
    reason: Option<TripReason>,
    last_correlation_id: Option<String>,
}

impl CircuitBreaker {
    pub fn new(config: RiskConfig) -> Self {
        let state = if config.enable_circuit_breaker {
            CircuitBreakerState::Closed
        } else {
            CircuitBreakerState::Disabled
        };

        Self {
            config,
            state,
            tripped_at: None,
            reason: None,
            last_correlation_id: None,
        }
    }

    pub fn check(&mut self) -> Result<()> {
        self.transition_on_cooldown();

        match self.state {
            CircuitBreakerState::Closed | CircuitBreakerState::Disabled => Ok(()),
            CircuitBreakerState::HalfOpen => Ok(()), // Probes are allowed
            CircuitBreakerState::Open => Err(TradingError::RiskCheck(format!(
                "Circuit breaker is OPEN. Tripped at: {:?}, Reason: {:?}",
                self.tripped_at, self.reason
            ))),
            CircuitBreakerState::ResetPending => Err(TradingError::RiskCheck(
                "Circuit breaker is RESET_PENDING. Awaiting manual approval.".to_string(),
            )),
        }
    }

    fn transition_on_cooldown(&mut self) {
        if self.state != CircuitBreakerState::Open {
            return;
        }

        if let Some(tripped_at) = self.tripped_at {
            let cooldown = Duration::minutes(60); // Default per spec
            if Utc::now() > tripped_at + cooldown {
                let prev = self.state;
                self.state = CircuitBreakerState::ResetPending;
                let correlation_id = self.last_correlation_id.as_deref().unwrap_or("INIT");
                info!(
                    "[cid:{}] Circuit breaker state TRANSITION. previous_state={}, next_state={}, reason_code=COOLDOWN_EXPIRED, disposition=RESET_PENDING",
                    correlation_id, prev.as_token(), self.state.as_token()
                );
            }
        }
    }

    pub fn trip(&mut self, reason: TripReason, correlation_id: &str) {
        if self.state == CircuitBreakerState::Disabled {
            return;
        }

        // Idempotent trip: don't reset tripped_at if already in a non-closed state
        if self.state == CircuitBreakerState::Closed || self.state == CircuitBreakerState::HalfOpen
        {
            let prev = self.state;
            self.state = CircuitBreakerState::Open;
            self.tripped_at = Some(Utc::now());
            self.reason = Some(reason);
            self.last_correlation_id = Some(correlation_id.to_string());

            info!(
                "[cid:{}] Circuit breaker state TRANSITION. previous_state={}, next_state={}, reason_code={}, disposition=OPEN",
                correlation_id, prev.as_token(), self.state.as_token(), reason.as_token()
            );
        }
    }

    pub fn approve_reset(&mut self, correlation_id: &str) {
        if self.state == CircuitBreakerState::ResetPending {
            let prev = self.state;
            self.state = CircuitBreakerState::HalfOpen;
            self.last_correlation_id = Some(correlation_id.to_string());

            info!(
                "[cid:{}] Circuit breaker state TRANSITION. previous_state={}, next_state={}, reason_code=RESET_APPROVED, disposition=HALF_OPEN",
                correlation_id, prev.as_token(), self.state.as_token()
            );
        } else {
            warn!(
                "[cid:{}] Manual reset attempt rejected. Breaker is in state {}. Must wait for cooldown and transition to RESET_PENDING.",
                correlation_id, self.state.as_token()
            );
        }
    }

    #[doc(hidden)]
    pub fn set_tripped_at_for_test(&mut self, time: DateTime<Utc>) {
        self.tripped_at = Some(time);
    }

    pub fn record_probe_result(&mut self, success: bool, correlation_id: &str) {
        if self.state != CircuitBreakerState::HalfOpen {
            return;
        }

        let prev = self.state;
        let (next, reason_code, disposition) = if success {
            (CircuitBreakerState::Closed, "PROBE_SUCCESS", "CLOSED")
        } else {
            (CircuitBreakerState::Open, "PROBE_FAILED", "OPEN")
        };

        self.state = next;
        if !success {
            self.tripped_at = Some(Utc::now());
            self.reason = Some(TripReason::ProbeFailed);
        } else {
            self.tripped_at = None;
            self.reason = None;
        }
        self.last_correlation_id = Some(correlation_id.to_string());

        info!(
            "[cid:{}] Circuit breaker state TRANSITION. previous_state={}, next_state={}, reason_code={}, disposition={}",
            correlation_id, prev.as_token(), self.state.as_token(), reason_code, disposition
        );
    }

    pub fn reset(&mut self) {
        self.state = CircuitBreakerState::Closed;
        self.tripped_at = None;
        self.reason = None;
    }

    pub fn state(&self) -> CircuitBreakerState {
        self.state
    }

    /// Update runtime config for future circuit-breaker checks.
    pub fn update_config(&mut self, config: RiskConfig) {
        self.config = config;
        // Hot-reload must never close/bypass an active risk-off state.
        if !self.config.enable_circuit_breaker && !self.state.is_risk_off() {
            self.state = CircuitBreakerState::Disabled;
        } else if self.state == CircuitBreakerState::Disabled {
            self.state = CircuitBreakerState::Closed;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> RiskConfig {
        RiskConfig {
            max_position_size: 100_000.0,
            max_notional_exposure: 250_000.0,
            max_open_positions: 5,
            stop_loss_percent: 5.0,
            trailing_stop_percent: 3.0,
            enable_circuit_breaker: true,
            max_loss_threshold: 10_000.0,
        }
    }

    #[test]
    fn test_internal_cooldown_transition() {
        let mut cb = CircuitBreaker::new(test_config());
        cb.trip(TripReason::Manual, "cid-trip");
        assert_eq!(cb.state(), CircuitBreakerState::Open);

        // 59 minutes pass -> still Open
        cb.tripped_at = Some(Utc::now() - Duration::minutes(59));
        cb.check().unwrap_err();
        assert_eq!(cb.state(), CircuitBreakerState::Open);

        // 61 minutes pass -> ResetPending
        cb.tripped_at = Some(Utc::now() - Duration::minutes(61));
        cb.check().unwrap_err();
        assert_eq!(cb.state(), CircuitBreakerState::ResetPending);
    }
}

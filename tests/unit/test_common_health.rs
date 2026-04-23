/// Unit tests for health check system
use common::{HealthCheck, HealthStatus, SystemHealth};

#[cfg(test)]
mod health_status_tests {
    use super::*;

    #[test]
    fn test_health_status_healthy() {
        let status = HealthStatus::Healthy;
        assert!(matches!(status, HealthStatus::Healthy));
    }

    #[test]
    fn test_health_status_degraded() {
        let status = HealthStatus::Degraded;
        assert!(matches!(status, HealthStatus::Degraded));
    }

    #[test]
    fn test_health_status_unhealthy() {
        let status = HealthStatus::Unhealthy;
        assert!(matches!(status, HealthStatus::Unhealthy));
    }
}

#[cfg(test)]
mod health_check_tests {
    use super::*;

    #[test]
    fn test_health_check_creation() {
        let health = HealthCheck::healthy("market-data")
            .with_message("All systems operational");

        assert!(matches!(health.status, HealthStatus::Healthy));
        assert_eq!(health.component, "market-data");
    }

    #[test]
    fn test_degraded_health_with_message() {
        let health = HealthCheck::degraded("execution-engine", "High latency detected");

        assert!(matches!(health.status, HealthStatus::Degraded));
        assert!(health.message.unwrap().contains("latency"));
    }

    #[test]
    fn test_unhealthy_component() {
        let health = HealthCheck::unhealthy("risk-manager", "Database connection failed");

        assert!(matches!(health.status, HealthStatus::Unhealthy));
        assert!(health.message.unwrap().contains("failed"));
    }
}

#[cfg(test)]
mod system_health_tests {
    use super::*;

    #[test]
    fn test_system_health_all_healthy() {
        let market_data = HealthCheck::healthy("market-data")
            .with_message("WebSocket connected");

        let execution = HealthCheck::healthy("execution-engine")
            .with_message("Router operational");

        let system = SystemHealth::new()
            .add_component(market_data)
            .add_component(execution);

        assert!(matches!(system.status, HealthStatus::Healthy));
        assert_eq!(system.components.len(), 2);
    }

    #[test]
    fn test_system_health_partial_degradation() {
        let system = SystemHealth::new()
            .add_component(HealthCheck::healthy("market-data").with_message("OK"))
            .add_component(HealthCheck::degraded("risk-manager", "Slow response"));

        assert!(matches!(system.status, HealthStatus::Degraded));
    }

    #[test]
    fn test_system_health_critical_failure() {
        let system = SystemHealth::new()
            .add_component(HealthCheck::healthy("market-data").with_message("OK"))
            .add_component(HealthCheck::unhealthy("execution-engine", "Critical error"));

        assert!(matches!(system.status, HealthStatus::Unhealthy));
        assert!(system.components.iter().any(|c| matches!(c.status, HealthStatus::Unhealthy)));
    }

    #[test]
    fn test_empty_components() {
        let system = SystemHealth::new();
        assert_eq!(system.components.len(), 0);
    }

    #[test]
    fn test_multiple_degraded_components() {
        let system = SystemHealth::new()
            .add_component(HealthCheck::degraded("market-data", "High CPU"))
            .add_component(HealthCheck::degraded("risk-manager", "High memory"))
            .add_component(HealthCheck::degraded("execution-engine", "Network latency"));

        let degraded_count = system.components.iter()
            .filter(|c| matches!(c.status, HealthStatus::Degraded))
            .count();

        assert_eq!(degraded_count, 3);
    }
}

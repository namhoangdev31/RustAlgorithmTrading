use chrono::Utc;
use common::messaging::ErrorDisposition;
use common::types::{RiskDecision, RiskReason};
use common::{Envelope, ErrorPayload, Message, SCHEMA_VERSION};
use serde_json::json;

#[test]
fn test_envelope_serialization() {
    let payload = json!({
        "type": "Heartbeat",
        "data": {
            "component": "test-component",
            "timestamp": Utc::now().to_rfc3339()
        }
    });

    let envelope = Envelope::new("Heartbeat", "test-corr-id", payload);
    let serialized = serde_json::to_string(&envelope).unwrap();

    let deserialized: Envelope = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.schema_version, SCHEMA_VERSION);
    assert_eq!(deserialized.correlation_id, "test-corr-id");
    assert_eq!(deserialized.event_type, "Heartbeat");
}

#[test]
fn test_message_deserialization_from_payload() {
    let raw_payload = json!({
        "type": "Heartbeat",
        "data": {
            "component": "market-data",
            "timestamp": Utc::now().to_rfc3339()
        }
    });

    let message: Message = serde_json::from_value(raw_payload).unwrap();
    if let Message::Heartbeat { data } = message {
        assert_eq!(data.component, "market-data");
    } else {
        panic!("Expected Heartbeat message");
    }
}

#[test]
fn test_error_payload_serialization() {
    let error = ErrorPayload {
        error_code: "SCHEMA_MISMATCH".to_string(),
        correlation_id: "err-123".to_string(),
        reason: "Missing field 'price'".to_string(),
        disposition: ErrorDisposition::Quarantine,
        payload_preview: Some("{\"type\": \"OrderBookUpdate\", ...}".to_string()),
    };

    let message = Message::Error { data: error };
    let envelope = Envelope::new("Error", "err-123", serde_json::to_value(message).unwrap());

    let serialized = serde_json::to_string(&envelope).unwrap();
    assert!(serialized.contains("SCHEMA_MISMATCH"));
    assert!(serialized.contains("QUARANTINE"));
}

#[test]
fn test_negative_parser_missing_fields() {
    let malformed_envelope = json!({
        "schema_version": "v1.0.0",
        // missing correlation_id
        "event_type": "Heartbeat",
        "timestamp": Utc::now().to_rfc3339(),
        "payload": {}
    });

    let result = serde_json::from_value::<Envelope>(malformed_envelope);
    assert!(result.is_err());
}

#[test]
fn test_negative_parser_wrong_type() {
    let malformed_payload = json!({
        "type": "Heartbeat",
        "data": {
            "component": 123, // Should be string
            "timestamp": Utc::now().to_rfc3339()
        }
    });

    let result = serde_json::from_value::<Message>(malformed_payload);
    assert!(result.is_err());
}

#[test]
fn test_negative_parser_invalid_timestamp() {
    let malformed_payload = json!({
        "type": "Heartbeat",
        "data": {
            "component": "market-data",
            "timestamp": "not-a-timestamp"
        }
    });

    let result = serde_json::from_value::<Message>(malformed_payload);
    assert!(result.is_err());
}

#[test]
fn test_risk_enum_canonical_serialization() {
    let decision = serde_json::to_string(&RiskDecision::Reject).unwrap();
    assert_eq!(decision, "\"REJECT\"");

    let reason = serde_json::to_string(&RiskReason::StrategyAllocationLimitExceeded).unwrap();
    assert_eq!(reason, "\"STRATEGY_ALLOCATION_LIMIT_EXCEEDED\"");

    let cb_reason = serde_json::to_string(&RiskReason::CircuitBreakerTripped).unwrap();
    assert_eq!(cb_reason, "\"CIRCUIT_BREAKER_TRIPPED\"");
}

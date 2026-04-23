use serde::{Deserialize, Serialize};
use crate::types::{Order, OrderBook, Trade, Bar, Signal, Position};
use chrono::{DateTime, Utc};

/// Version of the message schema
pub const SCHEMA_VERSION: &str = "v1.0.0";

/// Unified message envelope for all inter-component communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Envelope {
    pub schema_version: String,
    pub correlation_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub payload: serde_json::Value,
}

impl Envelope {
    pub fn new(event_type: &str, correlation_id: &str, payload: serde_json::Value) -> Self {
        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            correlation_id: correlation_id.to_string(),
            event_type: event_type.to_string(),
            timestamp: Utc::now(),
            payload,
        }
    }
}

/// Structured error payload for contract mismatches and failures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorPayload {
    pub error_code: String,
    pub correlation_id: String,
    pub reason: String,
    pub disposition: ErrorDisposition,
    pub payload_preview: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorDisposition {
    DropSafe,
    Retry,
    Quarantine,
}

/// Message types for inter-component communication via ZMQ
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Message {
    /// Market data messages
    #[serde(rename_all = "camelCase")]
    OrderBookUpdate { data: OrderBook },
    #[serde(rename_all = "camelCase")]
    TradeUpdate { data: Trade },
    #[serde(rename_all = "camelCase")]
    BarUpdate { data: Bar },

    /// Signal messages
    #[serde(rename_all = "camelCase")]
    SignalGenerated { data: Signal },

    /// Execution messages
    #[serde(rename_all = "camelCase")]
    OrderRequest { data: Order },
    #[serde(rename_all = "camelCase")]
    OrderResponse { data: OrderResponse },

    /// Risk management messages
    #[serde(rename_all = "camelCase")]
    PositionUpdate { data: Position },
    #[serde(rename_all = "camelCase")]
    RiskCheck { data: RiskCheckRequest },
    #[serde(rename_all = "camelCase")]
    RiskCheckResult { data: RiskCheckResult },

    /// System messages
    #[serde(rename_all = "camelCase")]
    Heartbeat { data: Heartbeat },
    
    #[serde(rename_all = "camelCase")]
    Error { data: ErrorPayload },
    
    Shutdown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderResponse {
    pub order_id: String,
    pub client_order_id: String,
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskCheckRequest {
    pub order: Order,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskCheckResult {
    pub approved: bool,
    pub reason: Option<String>,
    pub reason_code: Option<String>,
    pub limit_snapshot: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Heartbeat {
    pub component: String,
    pub timestamp: DateTime<Utc>,
}

/// ZMQ topic prefixes for PUB/SUB pattern
pub mod topics {
    pub const MARKET_DATA: &str = "market";
    pub const SIGNALS: &str = "signal";
    pub const ORDERS: &str = "order";
    pub const POSITIONS: &str = "position";
    pub const RISK: &str = "risk";
    pub const SYSTEM: &str = "system";
}

use crate::types::{Bar, Order, OrderBook, Position, Signal, Trade};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Version of the message schema
pub const SCHEMA_VERSION: &str = "v1.0.0";

fn default_event_id() -> String {
    format!(
        "evt_legacy_{}",
        chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0)
    )
}

fn default_source() -> String {
    "legacy".to_string()
}

fn default_trading_mode() -> String {
    "Simulated".to_string()
}

/// Unified message envelope for all inter-component communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Envelope {
    pub schema_version: String,
    pub correlation_id: String,
    pub event_type: String,
    pub timestamp: DateTime<Utc>,
    pub payload: serde_json::Value,

    // New metadata fields
    #[serde(default = "default_event_id")]
    pub event_id: String,
    #[serde(default = "default_source")]
    pub source: String,
    #[serde(default)]
    pub sequence: u64,
    #[serde(default = "default_trading_mode")]
    pub trading_mode: String,
}

impl Envelope {
    pub fn new(event_type: &str, correlation_id: &str, payload: serde_json::Value) -> Self {
        use std::sync::atomic::{AtomicU64, Ordering};
        static SEQUENCE: AtomicU64 = AtomicU64::new(1);
        let seq = SEQUENCE.fetch_add(1, Ordering::Relaxed);
        let event_id = format!("{}-{}", Utc::now().timestamp_nanos_opt().unwrap_or(0), seq);

        Self {
            schema_version: SCHEMA_VERSION.to_string(),
            correlation_id: correlation_id.to_string(),
            event_type: event_type.to_string(),
            timestamp: Utc::now(),
            payload,
            event_id,
            source: "rust-trading-engine".to_string(),
            sequence: seq,
            trading_mode: "SIMULATED".to_string(),
        }
    }

    pub fn new_with_mode(
        event_type: &str,
        correlation_id: &str,
        trading_mode: &str,
        payload: serde_json::Value,
    ) -> Self {
        let mut env = Self::new(event_type, correlation_id, payload);
        env.trading_mode = trading_mode.to_string();
        env
    }

    pub fn validate_schema_version(&self) -> bool {
        self.schema_version == SCHEMA_VERSION
    }

    pub fn validate_required_fields(&self) -> Result<(), String> {
        if self.correlation_id.trim().is_empty() {
            return Err("correlation_id cannot be empty".to_string());
        }
        if self.event_type.trim().is_empty() {
            return Err("event_type cannot be empty".to_string());
        }
        if self.payload.is_null() {
            return Err("payload cannot be null".to_string());
        }
        if self.event_id.trim().is_empty() {
            return Err("event_id cannot be empty".to_string());
        }
        if self.source.trim().is_empty() {
            return Err("source cannot be empty".to_string());
        }
        Ok(())
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
    OrderBookUpdate {
        data: OrderBook,
    },
    #[serde(rename_all = "camelCase")]
    TradeUpdate {
        data: Trade,
    },
    #[serde(rename_all = "camelCase")]
    BarUpdate {
        data: Bar,
    },

    /// Signal messages
    #[serde(rename_all = "camelCase")]
    SignalGenerated {
        data: Signal,
    },

    /// Execution messages
    #[serde(rename_all = "camelCase")]
    OrderRequest {
        data: Order,
    },
    #[serde(rename_all = "camelCase")]
    OrderResponse {
        data: OrderResponse,
    },

    /// Risk management messages
    #[serde(rename_all = "camelCase")]
    PositionUpdate {
        data: Position,
    },
    #[serde(rename_all = "camelCase")]
    RiskCheck {
        data: RiskCheckRequest,
    },
    #[serde(rename_all = "camelCase")]
    RiskCheckResult {
        data: RiskCheckResult,
    },

    /// System messages
    #[serde(rename_all = "camelCase")]
    Heartbeat {
        data: Heartbeat,
    },

    #[serde(rename_all = "camelCase")]
    Error {
        data: ErrorPayload,
    },

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
    pub decision: crate::types::RiskDecision,
    pub reason: Option<String>,
    pub reason_code: Option<crate::types::RiskReason>,
    pub limit_snapshot: Option<serde_json::Value>,
    pub disposition: Option<String>, // "ALLOW" or "REJECT"
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

/// ZmqPublisher publishes messages to a ZMQ PUB socket thread-safely
#[derive(Clone)]
pub struct ZmqPublisher {
    sender: Option<std::sync::mpsc::Sender<(String, String)>>,
}

impl ZmqPublisher {
    pub fn new(address: &str) -> crate::Result<Self> {
        if address.is_empty() {
            return Ok(Self { sender: None });
        }

        let context = zmq::Context::new();
        let socket = context.socket(zmq::PUB).map_err(|e| {
            crate::TradingError::Network(format!("Failed to create ZMQ PUB socket: {}", e))
        })?;

        socket.bind(address).map_err(|e| {
            crate::TradingError::Network(format!("Failed to bind ZMQ socket to {}: {}", address, e))
        })?;

        let (sender, receiver) = std::sync::mpsc::channel::<(String, String)>();

        // Background worker to send messages since ZMQ sockets are !Sync
        std::thread::spawn(move || {
            while let Ok((topic, payload)) = receiver.recv() {
                if let Err(e) = socket.send(topic.as_bytes(), zmq::SNDMORE) {
                    tracing::error!("Failed to send ZMQ topic {}: {}", topic, e);
                    continue;
                }
                if let Err(e) = socket.send(payload.as_bytes(), 0) {
                    tracing::error!("Failed to send ZMQ payload: {}", e);
                }
            }
        });

        Ok(Self {
            sender: Some(sender),
        })
    }

    pub fn publish(&self, topic: &str, envelope: &Envelope) -> crate::Result<()> {
        let Some(ref sender) = self.sender else {
            return Ok(());
        };
        let payload = serde_json::to_string(envelope)?;
        sender.send((topic.to_string(), payload)).map_err(|e| {
            crate::TradingError::Execution(format!("ZmqPublisher channel send error: {}", e))
        })?;
        Ok(())
    }
}

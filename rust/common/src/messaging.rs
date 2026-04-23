use serde::{Deserialize, Serialize};
use crate::types::{Order, OrderBook, Trade, Bar, Signal, Position};

/// Message types for inter-component communication via ZMQ
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum Message {
    /// Market data messages
    #[serde(rename_all = "camelCase")]
    OrderBookUpdate { 
        data: OrderBook, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },
    #[serde(rename_all = "camelCase")]
    TradeUpdate { 
        data: Trade, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },
    #[serde(rename_all = "camelCase")]
    BarUpdate { 
        data: Bar, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },

    /// Signal messages
    #[serde(rename_all = "camelCase")]
    SignalGenerated { 
        data: Signal, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },

    /// Execution messages
    #[serde(rename_all = "camelCase")]
    OrderRequest { 
        data: Order, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },
    #[serde(rename_all = "camelCase")]
    OrderResponse { 
        data: OrderResponse, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },

    /// Risk management messages
    #[serde(rename_all = "camelCase")]
    PositionUpdate { 
        data: Position, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },
    #[serde(rename_all = "camelCase")]
    RiskCheck { 
        data: RiskCheckRequest, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },
    #[serde(rename_all = "camelCase")]
    RiskCheckResult { 
        data: RiskCheckResult, 
        #[serde(default)] 
        correlation_id: Option<String> 
    },

    /// System messages
    #[serde(rename_all = "camelCase")]
    Heartbeat { 
        data: Heartbeat, 
        #[serde(default)] 
        correlation_id: Option<String> 
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
    pub reason: Option<String>,
    pub reason_code: Option<String>,
    pub limit_snapshot: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Heartbeat {
    pub component: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
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

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Represents a trading symbol (e.g., "BTCUSDT", "AAPL")
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Symbol(pub String);

impl fmt::Display for Symbol {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Price representation with high precision
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct Price(pub f64);

impl fmt::Display for Price {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.8}", self.0)
    }
}

/// Quantity/Volume representation
#[derive(Debug, Clone, Copy, PartialEq, PartialOrd, Serialize, Deserialize)]
pub struct Quantity(pub f64);

impl fmt::Display for Quantity {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{:.8}", self.0)
    }
}

/// Order book side
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Side {
    Bid,
    Ask,
}

/// Order type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderType {
    Market,
    Limit,
    StopMarket,
    StopLimit,
}

/// Order status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OrderStatus {
    Pending,
    PartiallyFilled,
    Filled,
    Cancelled,
    Rejected,
}

/// A single order book level (price and quantity)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Level {
    pub price: Price,
    pub quantity: Quantity,
    pub timestamp: DateTime<Utc>,
}

/// Market trade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    pub symbol: Symbol,
    pub price: Price,
    pub quantity: Quantity,
    pub side: Side,
    pub timestamp: DateTime<Utc>,
    pub trade_id: String,
}

/// OHLCV bar
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bar {
    pub symbol: Symbol,
    pub open: Price,
    pub high: Price,
    pub low: Price,
    pub close: Price,
    pub volume: Quantity,
    pub timestamp: DateTime<Utc>,
}

/// Order book snapshot
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderBook {
    pub symbol: Symbol,
    pub bids: Vec<Level>,
    pub asks: Vec<Level>,
    pub timestamp: DateTime<Utc>,
    pub sequence: u64,
}

/// Trading order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Order {
    pub order_id: String,
    pub client_order_id: String,
    pub symbol: Symbol,
    pub side: Side,
    pub order_type: OrderType,
    pub quantity: Quantity,
    pub price: Option<Price>,
    pub stop_price: Option<Price>,
    pub status: OrderStatus,
    pub filled_quantity: Quantity,
    pub average_price: Option<Price>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub account_id: Option<String>,
    #[serde(default)]
    pub external_proof: Option<String>,
}

/// Position tracking
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub symbol: Symbol,
    pub side: Side,
    pub quantity: Quantity,
    pub entry_price: Price,
    pub current_price: Price,
    pub unrealized_pnl: f64,
    pub realized_pnl: f64,
    pub opened_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Trading signal from strategy
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    pub symbol: Symbol,
    pub direction: SignalDirection,
    pub strength: f64,
    pub features: Vec<f64>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignalDirection {
    Buy,
    Sell,
    Hold,
}

/// Risk decision outcomes for Week 5.
/// Serialized in SCREAMING_SNAKE_CASE to keep wire semantics stable (ALLOW/REJECT).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RiskDecision {
    Allow,
    Reject,
}

/// Detailed reason for risk rejection (W5 canonical enums).
/// Keep compile-time canonical enum and stable wire tokens.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RiskReason {
    SymbolPositionLimitExceeded,
    SymbolVolumeLimitExceeded,
    StrategyMaxDrawdownBreach,
    StrategyDailyLossLimitBreach,
    StrategyAllocationLimitExceeded,
    CircuitBreakerTripped,
    StopLossTriggered,
    MaxLossExceeded,
    InvalidOrderParameters,
    InvalidTradingMode,
    ExternalPreconditionFailed,
}

/// Structured outcome of a risk check (W5 canonical interface)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskReport {
    pub decision: RiskDecision,
    pub reason_code: Option<RiskReason>,
    pub limit_snapshot: Option<serde_json::Value>,
    pub correlation_id: String,
}

/// Trading modes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TradingMode {
    Simulated,
    Paper,
    Live,
}

impl Default for TradingMode {
    fn default() -> Self {
        TradingMode::Simulated
    }
}

impl fmt::Display for TradingMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            TradingMode::Simulated => write!(f, "SIMULATED"),
            TradingMode::Paper => write!(f, "PAPER"),
            TradingMode::Live => write!(f, "LIVE"),
        }
    }
}

/// Broker order status details
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BrokerOrderStatus {
    pub broker_order_id: String,
    pub client_order_id: String,
    pub status: OrderStatus,
    pub filled_qty: Quantity,
    pub avg_fill_price: Option<Price>,
    pub error_message: Option<String>,
}

/// Structured details for order routing rejections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionRejection {
    pub client_order_id: String,
    pub reason: String,
    pub code: String,
}

/// State transition details for an order
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderTransition {
    pub order_id: String,
    pub client_order_id: String,
    pub previous_status: Option<OrderStatus>,
    pub new_status: OrderStatus,
    pub timestamp: DateTime<Utc>,
    pub filled_qty: Quantity,
    pub average_price: Option<Price>,
    pub transition_type: String,
    pub details: Option<String>,
}

/// Execution event details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderExecution {
    pub order: Order,
    pub mode: TradingMode,
    pub broker_status: Option<BrokerOrderStatus>,
    pub rejection: Option<ExecutionRejection>,
}

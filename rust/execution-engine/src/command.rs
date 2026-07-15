use crate::ExecutionEngineService;
use chrono::{DateTime, Utc};
use common::types::{Order, OrderStatus, OrderType, Price, Quantity, Side, Symbol, TradingMode};
use common::{Result, TradingError};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct ExecutionCommand {
    pub schema_version: u16,
    pub command_id: String,
    pub correlation_id: String,
    #[serde(rename = "type")]
    pub command_type: CommandType,
    pub payload: CommandPayload,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum CommandType {
    SubmitOrder,
    CancelOrder,
    ClosePosition,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum CommandPayload {
    Submit(SubmitOrderCommand),
    Cancel(CancelOrderCommand),
    Close(ClosePositionCommand),
}

#[derive(Debug, Deserialize)]
pub struct SubmitOrderCommand {
    pub account_id: String,
    pub client_order_id: String,
    pub idempotency_key: String,
    pub symbol: String,
    pub side: String,
    pub order_type: String,
    pub quantity: String,
    pub limit_price: Option<String>,
    pub stop_price: Option<String>,
    pub mode: String,
    pub market_data_observed_at: DateTime<Utc>,
    pub risk_snapshot_hash: String,
    pub strategy_version_hash: Option<String>,
    pub live_session_expires_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct CancelOrderCommand {
    pub order_id: String,
}

#[derive(Debug, Deserialize)]
pub struct ClosePositionCommand {
    pub symbol: String,
    pub quantity: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CommandResult {
    pub command_id: String,
    pub correlation_id: String,
    pub status: &'static str,
    pub broker_order_id: Option<String>,
}

pub async fn process_command(
    service: Arc<ExecutionEngineService>,
    command: ExecutionCommand,
) -> Result<CommandResult> {
    if command.schema_version != 1 {
        return Err(TradingError::Parse(format!(
            "Unsupported execution command schema {}",
            command.schema_version
        )));
    }
    match (&command.command_type, command.payload) {
        (CommandType::SubmitOrder, CommandPayload::Submit(payload)) => {
            validate_submit(&service, &payload)?;
            let order = into_order(payload)?;
            service.submit_order(order).await?;
            Ok(CommandResult {
                command_id: command.command_id,
                correlation_id: command.correlation_id,
                status: "accepted",
                broker_order_id: None,
            })
        }
        (CommandType::CancelOrder, CommandPayload::Cancel(payload)) => {
            let result = service.cancel_order(&payload.order_id).await?;
            Ok(CommandResult {
                command_id: command.command_id,
                correlation_id: command.correlation_id,
                status: "cancelled",
                broker_order_id: Some(result.broker_order_id),
            })
        }
        (CommandType::ClosePosition, CommandPayload::Close(payload)) => {
            let quantity = payload
                .quantity
                .as_deref()
                .map(parse_positive)
                .transpose()?
                .map(Quantity);
            let result = service.close_position(&payload.symbol, quantity).await?;
            Ok(CommandResult {
                command_id: command.command_id,
                correlation_id: command.correlation_id,
                status: "closed",
                broker_order_id: Some(result.broker_order_id),
            })
        }
        _ => Err(TradingError::Parse(
            "Execution command type does not match payload".to_string(),
        )),
    }
}

fn validate_submit(service: &ExecutionEngineService, payload: &SubmitOrderCommand) -> Result<()> {
    if payload.client_order_id != payload.idempotency_key {
        return Err(TradingError::RiskCheck(
            "client_order_id must equal the persistent idempotency key".to_string(),
        ));
    }
    if payload.risk_snapshot_hash.is_empty() {
        return Err(TradingError::RiskCheck(
            "Missing risk snapshot hash".to_string(),
        ));
    }
    if Utc::now()
        .signed_duration_since(payload.market_data_observed_at)
        .num_seconds()
        > 5
    {
        return Err(TradingError::MarketData("Market data is stale".to_string()));
    }
    let requested_mode = parse_mode(&payload.mode)?;
    if service.router().get_trading_mode() != requested_mode {
        return Err(TradingError::Configuration(
            "Command trading mode does not match execution runtime".to_string(),
        ));
    }
    if requested_mode == TradingMode::Live
        && payload
            .live_session_expires_at
            .is_none_or(|value| value <= Utc::now())
    {
        return Err(TradingError::RiskCheck(
            "Live command requires a valid step-up session".to_string(),
        ));
    }
    Ok(())
}

fn into_order(payload: SubmitOrderCommand) -> Result<Order> {
    let order_type = match payload.order_type.as_str() {
        "market" => OrderType::Market,
        "limit" => OrderType::Limit,
        "stop" => OrderType::StopMarket,
        "stop_limit" => OrderType::StopLimit,
        "bracket" | "trailing_stop" => {
            return Err(TradingError::Configuration(format!(
                "required_capability: order_type.{}",
                payload.order_type
            )))
        }
        value => return Err(TradingError::Parse(format!("Unknown order type {value}"))),
    };
    let side = match payload.side.as_str() {
        "buy" => Side::Bid,
        "sell" => Side::Ask,
        value => return Err(TradingError::Parse(format!("Unknown side {value}"))),
    };
    let now = Utc::now();
    Ok(Order {
        order_id: payload.client_order_id.clone(),
        client_order_id: payload.client_order_id,
        symbol: Symbol(payload.symbol),
        side,
        order_type,
        quantity: Quantity(parse_positive(&payload.quantity)?),
        price: payload
            .limit_price
            .as_deref()
            .map(parse_positive)
            .transpose()?
            .map(Price),
        stop_price: payload
            .stop_price
            .as_deref()
            .map(parse_positive)
            .transpose()?
            .map(Price),
        status: OrderStatus::Pending,
        filled_quantity: Quantity(0.0),
        average_price: None,
        created_at: now,
        updated_at: now,
        account_id: Some(payload.account_id),
        external_proof: payload.strategy_version_hash,
    })
}

fn parse_positive(value: &str) -> Result<f64> {
    let parsed = value
        .parse::<f64>()
        .map_err(|error| TradingError::Parse(format!("Invalid decimal {value}: {error}")))?;
    if !parsed.is_finite() || parsed <= 0.0 {
        return Err(TradingError::Parse(format!(
            "Decimal must be positive: {value}"
        )));
    }
    Ok(parsed)
}

fn parse_mode(value: &str) -> Result<TradingMode> {
    match value {
        "paper" => Ok(TradingMode::Paper),
        "live" => Ok(TradingMode::Live),
        _ => Err(TradingError::Parse(format!("Unknown trading mode {value}"))),
    }
}

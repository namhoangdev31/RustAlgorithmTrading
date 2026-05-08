use chrono::Utc;
use common::types::{Position, Price, Quantity, Side, Symbol};
use risk_manager::stops::{StopLossConfig, StopManager};
use serde::{Deserialize, Serialize};
use std::io::{self, Read};

#[derive(Debug, Deserialize)]
struct PricePoint {
    price: f64,
    pnl: f64,
}

#[derive(Debug, Deserialize)]
struct ParityRequest {
    symbol: String,
    side: String,
    entry_price: f64,
    quantity: f64,
    correlation_id: String,
    config: StopLossConfig,
    price_stream: Vec<PricePoint>,
}

#[derive(Debug, Serialize)]
struct ParityResponse {
    triggered: bool,
    trigger_index: Option<usize>,
    stop_type: Option<String>,
    reason_code: Option<String>,
    reason: Option<String>,
    correlation_id: Option<String>,
    trigger_price: Option<f64>,
    current_price: Option<f64>,
}

fn main() -> anyhow::Result<()> {
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer)?;

    let req: ParityRequest = serde_json::from_str(&buffer)?;
    if req.correlation_id.trim().is_empty() {
        anyhow::bail!("correlation_id is required");
    }
    if req.price_stream.is_empty() {
        anyhow::bail!("price_stream must not be empty");
    }

    let side = match req.side.to_lowercase().as_str() {
        "long" | "bid" | "buy" => Side::Bid,
        "short" | "ask" | "sell" => Side::Ask,
        _ => anyhow::bail!("invalid side: {}", req.side),
    };

    let mut manager = StopManager::new(common::config::RiskConfig {
        max_position_size: 1_000_000.0,
        max_notional_exposure: 1_000_000.0,
        max_open_positions: 100,
        stop_loss_percent: 5.0,
        trailing_stop_percent: 3.0,
        enable_circuit_breaker: true,
        max_loss_threshold: 10_000.0,
        sizing_amount: 0.0,
    });

    let base_position = Position {
        symbol: Symbol(req.symbol.clone()),
        side,
        quantity: Quantity(req.quantity),
        entry_price: Price(req.entry_price),
        current_price: Price(req.entry_price),
        unrealized_pnl: 0.0,
        realized_pnl: 0.0,
        opened_at: Utc::now(),
        updated_at: Utc::now(),
    };
    manager.set_stop(&base_position, req.config)?;

    for (idx, point) in req.price_stream.iter().enumerate() {
        let position = Position {
            current_price: Price(point.price),
            unrealized_pnl: point.pnl,
            updated_at: Utc::now(),
            ..base_position.clone()
        };

        if let Some(trigger) = manager.check(&position, &req.correlation_id) {
            let response = ParityResponse {
                triggered: true,
                trigger_index: Some(idx),
                stop_type: Some(
                    serde_json::to_value(trigger.stop_type)?
                        .as_str()
                        .unwrap_or("UNKNOWN")
                        .to_string(),
                ),
                reason_code: Some(
                    serde_json::to_value(trigger.reason_code)?
                        .as_str()
                        .unwrap_or("UNKNOWN")
                        .to_string(),
                ),
                reason: Some(trigger.reason),
                correlation_id: Some(trigger.correlation_id),
                trigger_price: Some(trigger.trigger_price.0),
                current_price: Some(trigger.current_price.0),
            };
            println!("{}", serde_json::to_string(&response)?);
            return Ok(());
        }
    }

    let response = ParityResponse {
        triggered: false,
        trigger_index: None,
        stop_type: None,
        reason_code: None,
        reason: None,
        correlation_id: Some(req.correlation_id),
        trigger_price: None,
        current_price: None,
    };
    println!("{}", serde_json::to_string(&response)?);
    Ok(())
}

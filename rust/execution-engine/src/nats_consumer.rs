use crate::command::{process_command, ExecutionCommand};
use crate::ExecutionEngineService;
use common::{Result, TradingError};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use tokio::time::{sleep, Duration};

/// Consumes a JetStream durable push consumer's delivery subject using the NATS protocol.
/// The durable consumer itself is created by ops provisioning and uses explicit ACKs.
pub async fn run(
    service: Arc<ExecutionEngineService>,
    address: String,
    delivery_subject: String,
) -> Result<()> {
    loop {
        if let Err(error) = consume_once(service.clone(), &address, &delivery_subject).await {
            tracing::error!("QuantAnt command consumer disconnected: {error}");
            sleep(Duration::from_secs(2)).await;
        }
    }
}

async fn consume_once(
    service: Arc<ExecutionEngineService>,
    address: &str,
    delivery_subject: &str,
) -> Result<()> {
    let host = address
        .trim_start_matches("nats://")
        .split('/')
        .next()
        .unwrap_or(address);
    let stream = TcpStream::connect(host)
        .await
        .map_err(|error| TradingError::Network(format!("NATS connect failed: {error}")))?;
    let (read_half, mut write_half) = stream.into_split();
    let mut reader = BufReader::new(read_half);
    let mut info = String::new();
    reader
        .read_line(&mut info)
        .await
        .map_err(|error| TradingError::Network(format!("NATS INFO failed: {error}")))?;
    if !info.starts_with("INFO ") {
        return Err(TradingError::Network(
            "NATS server did not send INFO".to_string(),
        ));
    }
    write_half
        .write_all(
            format!(
                "CONNECT {{\"name\":\"quantant-execution-engine\",\"verbose\":false,\"pedantic\":true}}\r\nSUB {delivery_subject} 1\r\nPING\r\n"
            )
            .as_bytes(),
        )
        .await
        .map_err(|error| TradingError::Network(format!("NATS subscribe failed: {error}")))?;

    loop {
        let mut line = String::new();
        let count = reader
            .read_line(&mut line)
            .await
            .map_err(|error| TradingError::Network(format!("NATS read failed: {error}")))?;
        if count == 0 {
            return Err(TradingError::Network("NATS connection closed".to_string()));
        }
        if line == "PING\r\n" {
            write_half
                .write_all(b"PONG\r\n")
                .await
                .map_err(nats_write_error)?;
            continue;
        }
        if !line.starts_with("MSG ") {
            continue;
        }
        let parts = line.split_whitespace().collect::<Vec<_>>();
        if parts.len() < 4 {
            return Err(TradingError::Parse("Malformed NATS MSG".to_string()));
        }
        let (reply, length) = if parts.len() == 5 {
            (Some(parts[3]), parts[4])
        } else {
            (None, parts[3])
        };
        let length = length
            .parse::<usize>()
            .map_err(|error| TradingError::Parse(format!("NATS message length: {error}")))?;
        let mut payload = vec![0_u8; length];
        reader
            .read_exact(&mut payload)
            .await
            .map_err(nats_read_error)?;
        let mut crlf = [0_u8; 2];
        reader
            .read_exact(&mut crlf)
            .await
            .map_err(nats_read_error)?;

        let command = serde_json::from_slice::<ExecutionCommand>(&payload);
        let succeeded = match command {
            Ok(command) => match process_command(service.clone(), command).await {
                Ok(result) => {
                    tracing::info!(
                        command_id = result.command_id,
                        correlation_id = result.correlation_id,
                        status = result.status,
                        "Execution command completed"
                    );
                    true
                }
                Err(error) => {
                    tracing::error!("Execution command rejected: {error}");
                    false
                }
            },
            Err(error) => {
                tracing::error!("Invalid execution command: {error}");
                false
            }
        };
        if let Some(reply) = reply {
            let acknowledgement = if succeeded { "+ACK" } else { "-NAK" };
            write_half
                .write_all(
                    format!(
                        "PUB {reply} {}\r\n{acknowledgement}\r\n",
                        acknowledgement.len()
                    )
                    .as_bytes(),
                )
                .await
                .map_err(nats_write_error)?;
        }
    }
}

fn nats_read_error(error: std::io::Error) -> TradingError {
    TradingError::Network(format!("NATS payload read failed: {error}"))
}

fn nats_write_error(error: std::io::Error) -> TradingError {
    TradingError::Network(format!("NATS write failed: {error}"))
}

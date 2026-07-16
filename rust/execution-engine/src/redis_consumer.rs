use crate::command::{process_command, ExecutionCommand};
use crate::ExecutionEngineService;
use common::{Result, TradingError};
use std::sync::Arc;
use tokio::time::{sleep, Duration};

pub async fn run(
    service: Arc<ExecutionEngineService>,
    redis_url: String,
    stream_key: String,
) -> Result<()> {
    loop {
        if let Err(error) = consume_once(service.clone(), &redis_url, &stream_key).await {
            tracing::error!("QuantAnt command consumer disconnected: {error}");
            sleep(Duration::from_secs(2)).await;
        }
    }
}

async fn consume_once(
    service: Arc<ExecutionEngineService>,
    redis_url: &str,
    stream_key: &str,
) -> Result<()> {
    let client = redis::Client::open(redis_url)
        .map_err(|e| TradingError::Network(format!("Redis client open failed: {e}")))?;
    let mut conn = client.get_multiplexed_tokio_connection().await
        .map_err(|e| TradingError::Network(format!("Redis connection failed: {e}")))?;

    let mut last_id = "$".to_string();

    tracing::info!("Connected to Redis Stream command consumer on stream: {}", stream_key);

    loop {
        let reply: redis::Value = redis::cmd("XREAD")
            .arg("COUNT")
            .arg(1)
            .arg("BLOCK")
            .arg(2000)
            .arg("STREAMS")
            .arg(stream_key)
            .arg(&last_id)
            .query_async(&mut conn)
            .await
            .map_err(|e| TradingError::Network(format!("Redis XREAD failed: {e}")))?;

        if let redis::Value::Bulk(streams) = &reply {
            if streams.is_empty() {
                continue;
            }
            if let redis::Value::Bulk(stream_data) = &streams[0] {
                if stream_data.len() >= 2 {
                    if let redis::Value::Bulk(messages) = &stream_data[1] {
                        for message in messages {
                            if let redis::Value::Bulk(message_data) = message {
                                if message_data.len() >= 2 {
                                    let msg_id = match &message_data[0] {
                                        redis::Value::Data(bytes) => String::from_utf8_lossy(bytes).into_owned(),
                                        _ => continue,
                                    };

                                    if let redis::Value::Bulk(fields) = &message_data[1] {
                                        let mut payload_bytes = None;
                                        for chunk in fields.chunks_exact(2) {
                                            let key = match &chunk[0] {
                                                redis::Value::Data(b) => String::from_utf8_lossy(b).into_owned(),
                                                _ => continue,
                                            };
                                            if key == "payload" {
                                                if let redis::Value::Data(val_bytes) = &chunk[1] {
                                                    payload_bytes = Some(val_bytes.clone());
                                                }
                                            }
                                        }

                                        if let Some(payload) = payload_bytes {
                                            let command = serde_json::from_slice::<ExecutionCommand>(&payload);
                                            match command {
                                                Ok(command) => {
                                                    match process_command(service.clone(), command).await {
                                                        Ok(result) => {
                                                            tracing::info!(
                                                                command_id = result.command_id,
                                                                correlation_id = result.correlation_id,
                                                                status = result.status,
                                                                "Execution command completed"
                                                            );
                                                        }
                                                        Err(error) => {
                                                            tracing::error!("Execution command rejected: {error}");
                                                        }
                                                    }
                                                }
                                                Err(error) => {
                                                    tracing::error!("Invalid execution command payload: {error}");
                                                }
                                            }
                                        }
                                    }

                                    last_id = msg_id;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

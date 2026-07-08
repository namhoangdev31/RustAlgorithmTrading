pub mod aggregation;
pub mod orderbook;
pub mod publisher;
pub mod websocket;

pub use aggregation::{BarAggregator, TimeWindow};
pub use orderbook::OrderBookManager;
pub use publisher::MarketDataPublisher;
pub use websocket::WebSocketClient;

use common::messaging::Message;
use common::{Result, TradingError};
use tracing::info;

/// Main market data service
pub struct MarketDataService {
    ws_client: WebSocketClient,
    orderbook_manager: OrderBookManager,
    bar_aggregator: BarAggregator,
    publisher: MarketDataPublisher,
    trading_mode: common::types::TradingMode,
    symbols: Vec<String>,
}

impl MarketDataService {
    pub async fn new(
        config: common::config::MarketDataConfig,
        trading_mode: common::types::TradingMode,
    ) -> Result<Self> {
        info!(
            "Initializing Market Data Service for exchange: {}",
            config.exchange
        );

        // Load API credentials from environment
        let (api_key, api_secret) = if trading_mode == common::types::TradingMode::Simulated {
            (
                std::env::var("ALPACA_API_KEY").unwrap_or_default(),
                std::env::var("ALPACA_SECRET_KEY").unwrap_or_default(),
            )
        } else {
            let key = std::env::var("ALPACA_API_KEY").map_err(|_| {
                TradingError::Configuration("ALPACA_API_KEY environment variable not set".to_string())
            })?;
            let secret = std::env::var("ALPACA_SECRET_KEY").map_err(|_| {
                TradingError::Configuration(
                    "ALPACA_SECRET_KEY environment variable not set".to_string(),
                )
            })?;
            (key, secret)
        };

        // Create WebSocket client with proper parameters
        let ws_client = WebSocketClient::new(api_key, api_secret, config.symbols.clone())?;

        let orderbook_manager = OrderBookManager::new();

        // Create BarAggregator with default time windows
        let time_windows = vec![
            TimeWindow::Minutes1,
            TimeWindow::Minutes5,
            TimeWindow::Minutes15,
        ];
        let bar_aggregator = BarAggregator::new(time_windows);

        let publisher =
            MarketDataPublisher::new(&config.zmq_publish_address, &format!("{}", trading_mode))?;

        Ok(Self {
            ws_client,
            orderbook_manager,
            bar_aggregator,
            publisher,
            trading_mode,
            symbols: config.symbols,
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        info!("Starting Market Data Service");

        if self.trading_mode == common::types::TradingMode::Simulated {
            info!("Running in SIMULATED mode. Spawning mock market data feed.");
            let publisher = self.publisher.clone();
            let symbols = self.symbols.clone();

            tokio::spawn(async move {
                use rand::Rng;
                // Store a starting price for each symbol
                let mut prices: std::collections::HashMap<String, f64> = symbols
                    .iter()
                    .map(|s| {
                        let base = match s.as_str() {
                            "AAPL" => 180.0,
                            "MSFT" => 420.0,
                            "GOOGL" => 170.0,
                            "AMZN" => 180.0,
                            "TSLA" => 170.0,
                            "NVDA" => 120.0,
                            "META" => 480.0,
                            "NFLX" => 600.0,
                            _ => 100.0,
                        };
                        (s.clone(), base)
                    })
                    .collect();

                let mut trade_id_counter = 0u64;

                loop {
                    tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

                    let mut rng = rand::thread_rng();
                    for symbol in &symbols {
                        // Generate a small price change
                        let current_price = match prices.get_mut(symbol) {
                            Some(p) => p,
                            None => continue,
                        };
                        let change_pct = (rng.gen::<f64>() - 0.5) * 0.002; // max 0.1% change
                        *current_price *= 1.0 + change_pct;

                        let price = *current_price;
                        let size = (rng.gen_range(1..10) * 10) as f64;
                        let timestamp = chrono::Utc::now();
                        trade_id_counter += 1;

                        // Publish trade
                        let trade = common::types::Trade {
                            symbol: common::types::Symbol(symbol.clone()),
                            price: common::types::Price(price),
                            quantity: common::types::Quantity(size),
                            side: if rng.gen::<bool>() { common::types::Side::Bid } else { common::types::Side::Ask },
                            timestamp,
                            trade_id: trade_id_counter.to_string(),
                        };
                        let md_msg = Message::TradeUpdate { data: trade };
                        let _ = publisher.publish("market.trade", md_msg);

                        // Publish quote (orderbook snapshot)
                        let snapshot = common::types::OrderBook {
                            symbol: common::types::Symbol(symbol.clone()),
                            bids: vec![common::types::Level {
                                price: common::types::Price(price - 0.05),
                                quantity: common::types::Quantity(size * 1.5),
                                timestamp,
                            }],
                            asks: vec![common::types::Level {
                                price: common::types::Price(price + 0.05),
                                quantity: common::types::Quantity(size * 1.5),
                                timestamp,
                            }],
                            timestamp,
                            sequence: trade_id_counter,
                        };
                        let md_msg2 = Message::OrderBookUpdate { data: snapshot };
                        let _ = publisher.publish("market.quote", md_msg2);

                        // Publish bar update
                        let bar = common::types::Bar {
                            symbol: common::types::Symbol(symbol.clone()),
                            open: common::types::Price(price * (1.0 - 0.0005)),
                            high: common::types::Price(price * (1.0 + 0.001)),
                            low: common::types::Price(price * (1.0 - 0.001)),
                            close: common::types::Price(price),
                            volume: common::types::Quantity(size * 10.0),
                            timestamp,
                        };
                        let bar_msg = Message::BarUpdate { data: bar };
                        let _ = publisher.publish("market.bar", bar_msg);
                    }
                }
            });

            // Keep alive
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(3600)).await;
            }
        }

        let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel::<websocket::AlpacaMessage>();
        let ws_client = self.ws_client.clone();

        tokio::spawn(async move {
            if let Err(e) = ws_client
                .connect(move |msg| {
                    let _ = tx.send(msg);
                    Ok(())
                })
                .await
            {
                tracing::error!("WebSocket client error: {:?}", e);
            }
        });

        while let Some(msg) = rx.recv().await {
            match msg {
                websocket::AlpacaMessage::Trade {
                    symbol,
                    price,
                    size,
                    timestamp,
                    id,
                } => {
                    let ts = timestamp
                        .parse::<chrono::DateTime<chrono::Utc>>()
                        .unwrap_or_else(|_| chrono::Utc::now());
                    let trade = common::types::Trade {
                        symbol: common::types::Symbol(symbol.clone()),
                        price: common::types::Price(price),
                        quantity: common::types::Quantity(size),
                        side: common::types::Side::Bid,
                        timestamp: ts,
                        trade_id: id.to_string(),
                    };

                    let completed_bars = self.bar_aggregator.process_trade(&trade);

                    let md_msg = Message::TradeUpdate { data: trade };
                    if let Err(e) = self.publisher.publish("market.trade", md_msg) {
                        tracing::error!("Failed to publish trade: {:?}", e);
                    }

                    for bar in completed_bars {
                        let bar_msg = Message::BarUpdate { data: bar };
                        if let Err(e) = self.publisher.publish("market.bar", bar_msg) {
                            tracing::error!("Failed to publish aggregated bar: {:?}", e);
                        }
                    }
                }
                websocket::AlpacaMessage::Quote {
                    symbol,
                    bid_price,
                    bid_size,
                    ask_price,
                    ask_size,
                    timestamp: _,
                } => {
                    self.orderbook_manager.update_bid(
                        &symbol,
                        common::types::Price(bid_price),
                        common::types::Quantity(bid_size),
                    );
                    self.orderbook_manager.update_ask(
                        &symbol,
                        common::types::Price(ask_price),
                        common::types::Quantity(ask_size),
                    );

                    if let Some(snapshot) = self.orderbook_manager.get_snapshot(&symbol, 10) {
                        let md_msg = Message::OrderBookUpdate { data: snapshot };
                        if let Err(e) = self.publisher.publish("market.quote", md_msg) {
                            tracing::error!("Failed to publish orderbook quote: {:?}", e);
                        }
                    }
                }
                websocket::AlpacaMessage::Bar {
                    symbol,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    timestamp,
                } => {
                    let ts = timestamp
                        .parse::<chrono::DateTime<chrono::Utc>>()
                        .unwrap_or_else(|_| chrono::Utc::now());
                    let bar = common::types::Bar {
                        symbol: common::types::Symbol(symbol.clone()),
                        open: common::types::Price(open),
                        high: common::types::Price(high),
                        low: common::types::Price(low),
                        close: common::types::Price(close),
                        volume: common::types::Quantity(volume),
                        timestamp: ts,
                    };
                    let bar_msg = Message::BarUpdate { data: bar };
                    if let Err(e) = self.publisher.publish("market.bar", bar_msg) {
                        tracing::error!("Failed to publish bar: {:?}", e);
                    }
                }
                websocket::AlpacaMessage::Unknown => {}
            }
        }

        Ok(())
    }
}

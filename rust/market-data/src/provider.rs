use chrono::{TimeZone, Utc};
use common::{Result, TradingError};
use serde::Deserialize;
use serde_json::{json, Value};
use url::Url;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssetClass {
    Equity,
    Crypto,
    Forex,
    Index,
    CommodityFuture,
}

impl AssetClass {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Equity => "equity",
            Self::Crypto => "crypto",
            Self::Forex => "forex",
            Self::Index => "index",
            Self::CommodityFuture => "commodity_future",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum MarketDataEvent {
    Trade {
        symbol: String,
        price: f64,
        size: f64,
        timestamp: String,
        id: u64,
    },
    Quote {
        symbol: String,
        bid_price: f64,
        bid_size: f64,
        ask_price: f64,
        ask_size: f64,
        timestamp: String,
    },
    Bar {
        symbol: String,
        open: f64,
        high: f64,
        low: f64,
        close: f64,
        volume: f64,
        timestamp: String,
    },
}

pub trait MarketDataProvider: Send + Sync {
    fn name(&self) -> &'static str;
    fn asset_class(&self) -> AssetClass;
    fn websocket_url(&self) -> Result<Url>;
    fn authentication_messages(&self) -> Vec<Value>;
    fn subscription_messages(&self, symbols: &[String]) -> Vec<Value>;
    fn decode(&self, text: &str) -> Result<Vec<MarketDataEvent>>;
}

pub struct AlpacaProvider {
    api_key: String,
    api_secret: String,
}

impl AlpacaProvider {
    pub fn new(api_key: String, api_secret: String) -> Self {
        Self {
            api_key,
            api_secret,
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(tag = "T")]
enum AlpacaWireEvent {
    #[serde(rename = "t")]
    Trade {
        #[serde(rename = "S")]
        symbol: String,
        #[serde(rename = "p")]
        price: f64,
        #[serde(rename = "s")]
        size: f64,
        #[serde(rename = "t")]
        timestamp: String,
        #[serde(rename = "i")]
        id: u64,
    },
    #[serde(rename = "q")]
    Quote {
        #[serde(rename = "S")]
        symbol: String,
        #[serde(rename = "bp")]
        bid_price: f64,
        #[serde(rename = "bs")]
        bid_size: f64,
        #[serde(rename = "ap")]
        ask_price: f64,
        #[serde(rename = "as")]
        ask_size: f64,
        #[serde(rename = "t")]
        timestamp: String,
    },
    #[serde(rename = "b")]
    Bar {
        #[serde(rename = "S")]
        symbol: String,
        #[serde(rename = "o")]
        open: f64,
        #[serde(rename = "h")]
        high: f64,
        #[serde(rename = "l")]
        low: f64,
        #[serde(rename = "c")]
        close: f64,
        #[serde(rename = "v")]
        volume: f64,
        #[serde(rename = "t")]
        timestamp: String,
    },
    #[serde(other)]
    Control,
}

impl MarketDataProvider for AlpacaProvider {
    fn name(&self) -> &'static str {
        "alpaca"
    }

    fn asset_class(&self) -> AssetClass {
        AssetClass::Equity
    }

    fn websocket_url(&self) -> Result<Url> {
        parse_url("wss://stream.data.alpaca.markets/v2/iex")
    }

    fn authentication_messages(&self) -> Vec<Value> {
        vec![json!({
            "action": "auth",
            "key": self.api_key,
            "secret": self.api_secret
        })]
    }

    fn subscription_messages(&self, symbols: &[String]) -> Vec<Value> {
        vec![json!({
            "action": "subscribe",
            "trades": symbols,
            "quotes": symbols,
            "bars": symbols
        })]
    }

    fn decode(&self, text: &str) -> Result<Vec<MarketDataEvent>> {
        let events = serde_json::from_str::<Vec<AlpacaWireEvent>>(text).unwrap_or_default();
        Ok(events
            .into_iter()
            .filter_map(|event| match event {
                AlpacaWireEvent::Trade {
                    symbol,
                    price,
                    size,
                    timestamp,
                    id,
                } => Some(MarketDataEvent::Trade {
                    symbol,
                    price,
                    size,
                    timestamp,
                    id,
                }),
                AlpacaWireEvent::Quote {
                    symbol,
                    bid_price,
                    bid_size,
                    ask_price,
                    ask_size,
                    timestamp,
                } => Some(MarketDataEvent::Quote {
                    symbol,
                    bid_price,
                    bid_size,
                    ask_price,
                    ask_size,
                    timestamp,
                }),
                AlpacaWireEvent::Bar {
                    symbol,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    timestamp,
                } => Some(MarketDataEvent::Bar {
                    symbol,
                    open,
                    high,
                    low,
                    close,
                    volume,
                    timestamp,
                }),
                AlpacaWireEvent::Control => None,
            })
            .collect())
    }
}

pub struct MassiveProvider {
    api_key: String,
    asset_class: AssetClass,
}

impl MassiveProvider {
    pub fn new(api_key: String, asset_class: AssetClass) -> Result<Self> {
        Ok(Self {
            api_key,
            asset_class,
        })
    }

    fn cluster(&self) -> &'static str {
        match self.asset_class {
            AssetClass::Equity => "stocks",
            AssetClass::Crypto => "crypto",
            AssetClass::Forex => "forex",
            AssetClass::Index => "indices",
            AssetClass::CommodityFuture => "futures",
        }
    }

    fn canonical_symbol(&self, provider_symbol: &str) -> String {
        provider_symbol
            .trim_start_matches("X:")
            .trim_start_matches("C:")
            .trim_start_matches("I:")
            .to_string()
    }
}

impl MarketDataProvider for MassiveProvider {
    fn name(&self) -> &'static str {
        "massive"
    }

    fn asset_class(&self) -> AssetClass {
        self.asset_class
    }

    fn websocket_url(&self) -> Result<Url> {
        parse_url(&format!("wss://socket.massive.com/{}", self.cluster()))
    }

    fn authentication_messages(&self) -> Vec<Value> {
        vec![json!({ "action": "auth", "params": self.api_key })]
    }

    fn subscription_messages(&self, symbols: &[String]) -> Vec<Value> {
        let channels = symbols
            .iter()
            .flat_map(|symbol| {
                [
                    format!("T.{symbol}"),
                    format!("Q.{symbol}"),
                    format!("AM.{symbol}"),
                ]
            })
            .collect::<Vec<_>>()
            .join(",");
        vec![json!({ "action": "subscribe", "params": channels })]
    }

    fn decode(&self, text: &str) -> Result<Vec<MarketDataEvent>> {
        let values: Vec<Value> = serde_json::from_str(text)
            .map_err(|error| TradingError::MarketData(format!("Massive payload: {error}")))?;
        Ok(values
            .into_iter()
            .filter_map(|value| {
                let event = value.get("ev")?.as_str()?;
                let raw_symbol = value.get("sym")?.as_str()?;
                let symbol = self.canonical_symbol(raw_symbol);
                let timestamp = millis_to_rfc3339(value.get("t").and_then(Value::as_i64));
                match event {
                    "T" | "XT" => Some(MarketDataEvent::Trade {
                        symbol,
                        price: value.get("p")?.as_f64()?,
                        size: value.get("s")?.as_f64()?,
                        timestamp,
                        id: value.get("i").and_then(Value::as_u64).unwrap_or_default(),
                    }),
                    "Q" | "XQ" => Some(MarketDataEvent::Quote {
                        symbol,
                        bid_price: value.get("bp")?.as_f64()?,
                        bid_size: value.get("bs").and_then(Value::as_f64).unwrap_or_default(),
                        ask_price: value.get("ap")?.as_f64()?,
                        ask_size: value.get("as").and_then(Value::as_f64).unwrap_or_default(),
                        timestamp,
                    }),
                    "AM" | "XA" => Some(MarketDataEvent::Bar {
                        symbol,
                        open: value.get("o")?.as_f64()?,
                        high: value.get("h")?.as_f64()?,
                        low: value.get("l")?.as_f64()?,
                        close: value.get("c")?.as_f64()?,
                        volume: value.get("v").and_then(Value::as_f64).unwrap_or_default(),
                        timestamp,
                    }),
                    _ => None,
                }
            })
            .collect())
    }
}

fn parse_url(value: &str) -> Result<Url> {
    Url::parse(value)
        .map_err(|error| TradingError::Configuration(format!("Invalid provider URL: {error}")))
}

fn millis_to_rfc3339(timestamp: Option<i64>) -> String {
    timestamp
        .and_then(|value| Utc.timestamp_millis_opt(value).single())
        .unwrap_or_else(Utc::now)
        .to_rfc3339()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn massive_trade_is_normalized() {
        let provider = MassiveProvider::new("test".to_string(), AssetClass::Equity).unwrap();
        let events = provider
            .decode(r#"[{"ev":"T","sym":"AAPL","p":210.25,"s":5,"t":1704067200000,"i":7}]"#)
            .unwrap();
        assert!(matches!(&events[0], MarketDataEvent::Trade { symbol, .. } if symbol == "AAPL"));
    }
}

use common::{
    types::{
        BrokerAccountSnapshot, BrokerFill, BrokerOrderStatus, BrokerPosition, Order, OrderStatus,
        Price, Quantity, Symbol,
    },
    Result, TradingError,
};
use serde::{Deserialize, Serialize};

#[async_trait::async_trait]
pub trait BrokerClient: Send + Sync {
    async fn submit_order(&self, order: &Order) -> Result<BrokerOrderStatus>;
    async fn cancel_order(&self, order_id: &str) -> Result<BrokerOrderStatus>;
    async fn get_order_status(&self, order_id: &str) -> Result<BrokerOrderStatus>;
    async fn list_open_orders(&self) -> Result<Vec<BrokerOrderStatus>>;
    async fn list_positions(&self) -> Result<Vec<BrokerPosition>>;
    async fn get_account_snapshot(&self) -> Result<BrokerAccountSnapshot>;
    async fn list_fills(&self, since: chrono::DateTime<chrono::Utc>) -> Result<Vec<BrokerFill>>;
}

/// Local simulated broker for testing and simulation mode
pub struct SimulatedBrokerClient {
    orders: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, BrokerOrderStatus>>>,
}

impl SimulatedBrokerClient {
    pub fn new() -> Self {
        Self {
            orders: std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new())),
        }
    }
}

impl Default for SimulatedBrokerClient {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl BrokerClient for SimulatedBrokerClient {
    async fn submit_order(&self, order: &Order) -> Result<BrokerOrderStatus> {
        let status = BrokerOrderStatus {
            broker_order_id: format!("sim-{}", uuid::Uuid::new_v4()),
            client_order_id: order.client_order_id.clone(),
            status: OrderStatus::Filled,
            filled_qty: order.quantity,
            avg_fill_price: order.price.or(order.stop_price).or(Some(Price(100.0))),
            error_message: None,
        };
        self.orders
            .lock()
            .unwrap()
            .insert(order.client_order_id.clone(), status.clone());
        Ok(status)
    }

    async fn cancel_order(&self, client_order_id: &str) -> Result<BrokerOrderStatus> {
        let mut guard = self.orders.lock().unwrap();
        if let Some(status) = guard.get_mut(client_order_id) {
            status.status = OrderStatus::Cancelled;
            Ok(status.clone())
        } else {
            Ok(BrokerOrderStatus {
                broker_order_id: format!("sim-{}", uuid::Uuid::new_v4()),
                client_order_id: client_order_id.to_string(),
                status: OrderStatus::Cancelled,
                filled_qty: Quantity(0.0),
                avg_fill_price: None,
                error_message: None,
            })
        }
    }

    async fn get_order_status(&self, client_order_id: &str) -> Result<BrokerOrderStatus> {
        if let Some(status) = self.orders.lock().unwrap().get(client_order_id) {
            Ok(status.clone())
        } else {
            Ok(BrokerOrderStatus {
                broker_order_id: format!("sim-{}", uuid::Uuid::new_v4()),
                client_order_id: client_order_id.to_string(),
                status: OrderStatus::Filled,
                filled_qty: Quantity(1.0),
                avg_fill_price: Some(Price(100.0)),
                error_message: None,
            })
        }
    }

    async fn list_open_orders(&self) -> Result<Vec<BrokerOrderStatus>> {
        let guard = self.orders.lock().unwrap();
        let open_orders: Vec<BrokerOrderStatus> = guard
            .values()
            .filter(|o| o.status == OrderStatus::Pending)
            .cloned()
            .collect();
        Ok(open_orders)
    }

    async fn list_positions(&self) -> Result<Vec<BrokerPosition>> {
        Ok(Vec::new())
    }

    async fn get_account_snapshot(&self) -> Result<BrokerAccountSnapshot> {
        Ok(BrokerAccountSnapshot {
            equity: 100000.0,
            cash: 100000.0,
            buying_power: 400000.0,
            timestamp: chrono::Utc::now(),
        })
    }

    async fn list_fills(&self, _since: chrono::DateTime<chrono::Utc>) -> Result<Vec<BrokerFill>> {
        Ok(Vec::new())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlpacaOrderRequest {
    pub symbol: String,
    pub qty: f64,
    pub side: String,
    pub r#type: String,
    pub time_in_force: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit_price: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stop_price: Option<f64>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AlpacaOrderResponse {
    pub id: String,
    pub status: String,
    pub symbol: String,
    pub qty: String,
    pub filled_qty: String,
    pub side: String,
    pub client_order_id: Option<String>,
}

impl AlpacaOrderResponse {
    pub fn to_broker_order_status(&self) -> BrokerOrderStatus {
        let status = match self.status.as_str() {
            "new" | "partially_filled" | "accepted" | "pending_new" | "accepted_for_bidding" => {
                OrderStatus::Pending
            }
            "filled" => OrderStatus::Filled,
            "done_for_day" | "canceled" | "expired" => OrderStatus::Cancelled,
            "rejected" | "suspended" => OrderStatus::Rejected,
            _ => OrderStatus::Pending,
        };
        BrokerOrderStatus {
            broker_order_id: self.id.clone(),
            client_order_id: self.client_order_id.clone().unwrap_or_default(),
            status,
            filled_qty: Quantity(self.filled_qty.parse::<f64>().unwrap_or(0.0)),
            avg_fill_price: None,
            error_message: None,
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct AlpacaPositionResponse {
    pub symbol: String,
    pub qty: String,
    pub avg_entry_price: String,
    pub market_value: String,
    pub unrealized_pl: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AlpacaAccountResponse {
    pub equity: String,
    pub cash: String,
    pub buying_power: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AlpacaFillResponse {
    pub order_id: String,
    pub symbol: String,
    pub side: String,
    pub qty: String,
    pub price: String,
    pub transaction_time: String,
}

pub struct AlpacaBrokerClient {
    api_url: String,
    api_key: String,
    api_secret: String,
    http_client: reqwest::Client,
}

impl AlpacaBrokerClient {
    pub fn new(api_url: String, api_key: String, api_secret: String) -> Result<Self> {
        let http_client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .min_tls_version(reqwest::tls::Version::TLS_1_2)
            .build()
            .map_err(|e| TradingError::Network(format!("HTTP client error: {}", e)))?;
        Ok(Self {
            api_url,
            api_key,
            api_secret,
            http_client,
        })
    }

    fn build_alpaca_request(&self, order: &Order) -> Result<AlpacaOrderRequest> {
        let side = match order.side {
            common::types::Side::Bid => "buy",
            common::types::Side::Ask => "sell",
        };

        let order_type = match order.order_type {
            common::types::OrderType::Market => "market",
            common::types::OrderType::Limit => "limit",
            common::types::OrderType::StopMarket => "stop",
            common::types::OrderType::StopLimit => "stop_limit",
        };

        Ok(AlpacaOrderRequest {
            symbol: order.symbol.0.clone(),
            qty: order.quantity.0,
            side: side.to_string(),
            r#type: order_type.to_string(),
            time_in_force: "gtc".to_string(),
            limit_price: order.price.map(|p| p.0),
            stop_price: order.stop_price.map(|p| p.0),
        })
    }
}

#[async_trait::async_trait]
impl BrokerClient for AlpacaBrokerClient {
    async fn submit_order(&self, order: &Order) -> Result<BrokerOrderStatus> {
        let alpaca_order = self.build_alpaca_request(order)?;
        let url = format!("{}/v2/orders", self.api_url);
        let response = self
            .http_client
            .post(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .json(&alpaca_order)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "Order rejected: {} - {}",
                status, text
            )));
        }

        let alpaca_resp = response
            .json::<AlpacaOrderResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;

        let mut status = alpaca_resp.to_broker_order_status();
        if status.client_order_id.is_empty() {
            status.client_order_id = order.client_order_id.clone();
        }
        Ok(status)
    }

    async fn cancel_order(&self, order_id: &str) -> Result<BrokerOrderStatus> {
        let url = format!("{}/v2/orders/{}", self.api_url, order_id);
        let response = self
            .http_client
            .delete(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "Cancel failed: {} - {}",
                status, text
            )));
        }

        let alpaca_resp = response
            .json::<AlpacaOrderResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;
        Ok(alpaca_resp.to_broker_order_status())
    }

    async fn get_order_status(&self, order_id: &str) -> Result<BrokerOrderStatus> {
        let url = format!("{}/v2/orders/{}", self.api_url, order_id);
        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "Get order status failed: {} - {}",
                status, text
            )));
        }

        let alpaca_resp = response
            .json::<AlpacaOrderResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;
        Ok(alpaca_resp.to_broker_order_status())
    }

    async fn list_open_orders(&self) -> Result<Vec<BrokerOrderStatus>> {
        let url = format!("{}/v2/orders?status=open", self.api_url);
        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "List open orders failed: {} - {}",
                status, text
            )));
        }

        let alpaca_resps = response
            .json::<Vec<AlpacaOrderResponse>>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;
        Ok(alpaca_resps
            .into_iter()
            .map(|r| r.to_broker_order_status())
            .collect())
    }

    async fn list_positions(&self) -> Result<Vec<BrokerPosition>> {
        let url = format!("{}/v2/positions", self.api_url);
        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "List positions failed: {} - {}",
                status, text
            )));
        }

        let alpaca_resps = response
            .json::<Vec<AlpacaPositionResponse>>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;

        Ok(alpaca_resps
            .into_iter()
            .map(|r| {
                let symbol = Symbol(r.symbol);
                let qty = Quantity(r.qty.parse::<f64>().unwrap_or(0.0));
                let avg_price = Price(r.avg_entry_price.parse::<f64>().unwrap_or(0.0));
                let market_value = r.market_value.parse::<f64>().unwrap_or(0.0);
                let unrealized_pnl = r.unrealized_pl.parse::<f64>().unwrap_or(0.0);

                BrokerPosition {
                    symbol,
                    quantity: qty,
                    average_entry_price: avg_price,
                    market_value,
                    unrealized_pnl,
                }
            })
            .collect())
    }

    async fn get_account_snapshot(&self) -> Result<BrokerAccountSnapshot> {
        let url = format!("{}/v2/account", self.api_url);
        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "Get account failed: {} - {}",
                status, text
            )));
        }

        let r = response
            .json::<AlpacaAccountResponse>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;

        Ok(BrokerAccountSnapshot {
            equity: r.equity.parse::<f64>().unwrap_or(0.0),
            cash: r.cash.parse::<f64>().unwrap_or(0.0),
            buying_power: r.buying_power.parse::<f64>().unwrap_or(0.0),
            timestamp: chrono::Utc::now(),
        })
    }

    async fn list_fills(&self, since: chrono::DateTime<chrono::Utc>) -> Result<Vec<BrokerFill>> {
        let since_str = since.to_rfc3339();
        let url = format!(
            "{}/v2/account/activities?activity_types=FILL&after={}",
            self.api_url, since_str
        );
        let response = self
            .http_client
            .get(&url)
            .header("APCA-API-KEY-ID", &self.api_key)
            .header("APCA-API-SECRET-KEY", &self.api_secret)
            .send()
            .await
            .map_err(|e| TradingError::Network(format!("Request failed: {}", e)))?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await.unwrap_or_default();
            return Err(TradingError::Exchange(format!(
                "List fills failed: {} - {}",
                status, text
            )));
        }

        let alpaca_resps = response
            .json::<Vec<AlpacaFillResponse>>()
            .await
            .map_err(|e| TradingError::Parse(format!("Response parse error: {}", e)))?;

        Ok(alpaca_resps
            .into_iter()
            .map(|r| {
                let side = if r.side.to_lowercase() == "buy" {
                    common::types::Side::Bid
                } else {
                    common::types::Side::Ask
                };

                BrokerFill {
                    order_id: r.order_id,
                    symbol: Symbol(r.symbol),
                    side,
                    quantity: Quantity(r.qty.parse::<f64>().unwrap_or(0.0)),
                    price: Price(r.price.parse::<f64>().unwrap_or(0.0)),
                    timestamp: chrono::DateTime::parse_from_rfc3339(&r.transaction_time)
                        .map(|dt| dt.with_timezone(&chrono::Utc))
                        .unwrap_or_else(|_| chrono::Utc::now()),
                }
            })
            .collect())
    }
}

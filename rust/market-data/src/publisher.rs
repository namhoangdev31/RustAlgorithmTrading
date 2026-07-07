use common::messaging::{Envelope, Message, ZmqPublisher};
use common::Result;

#[derive(Clone)]
pub struct MarketDataPublisher {
    inner: ZmqPublisher,
    trading_mode: String,
}

impl MarketDataPublisher {
    pub fn new(address: &str, trading_mode: &str) -> Result<Self> {
        let inner = ZmqPublisher::new(address)?;
        Ok(Self {
            inner,
            trading_mode: trading_mode.to_string(),
        })
    }

    pub fn publish(&self, topic: &str, message: Message) -> Result<()> {
        let envelope = Envelope::new_with_mode(
            topic,
            &format!("md-{}-{}", topic, chrono::Utc::now().timestamp_millis()),
            &self.trading_mode,
            serde_json::to_value(&message).unwrap_or(serde_json::Value::Null),
        );
        self.inner.publish(topic, &envelope)
    }
}

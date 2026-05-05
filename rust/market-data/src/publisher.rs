use common::messaging::Message;
use common::Result;

pub struct MarketDataPublisher {
    _address: String,
}

impl MarketDataPublisher {
    pub fn new(address: &str) -> Result<Self> {
        Ok(Self {
            _address: address.to_string(),
        })
    }

    pub fn publish(&self, _message: Message) -> Result<()> {
        // TODO: Implement ZMQ publishing
        Ok(())
    }
}

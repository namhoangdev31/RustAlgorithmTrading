CREATE TABLE IF NOT EXISTS exchange_markets (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    mic_code VARCHAR(10) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO exchange_markets (id, name, mic_code, timezone, is_active) VALUES
('NASDAQ', 'NASDAQ Stock Market', 'XNAS', 'America/New_York', TRUE),
('NYSE', 'New York Stock Exchange', 'XNYS', 'America/New_York', TRUE),
('BINANCE', 'Binance Cryptocurrency Exchange', 'BNCY', 'UTC', TRUE),
('COINBASE', 'Coinbase Exchange', 'COIN', 'UTC', TRUE)
ON CONFLICT (id) DO NOTHING;

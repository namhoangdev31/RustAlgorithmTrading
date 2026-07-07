CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    precision INTEGER NOT NULL DEFAULT 2
);

INSERT INTO currencies (code, name, precision) VALUES
('USD', 'US Dollar', 2),
('EUR', 'Euro', 2),
('GBP', 'British Pound', 2),
('JPY', 'Japanese Yen', 0),
('BTC', 'Bitcoin', 8),
('ETH', 'Ethereum', 18)
ON CONFLICT (code) DO NOTHING;

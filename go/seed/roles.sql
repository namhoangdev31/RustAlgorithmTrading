CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO roles (id, description) VALUES
('admin', 'System Administrator with full access'),
('trader', 'Standard Trader who can view portfolio and place orders'),
('analyst', 'Market Analyst with read-only access to charts and metrics'),
('risk_manager', 'Risk Manager who controls trading limits and kill-switches')
ON CONFLICT (id) DO NOTHING;

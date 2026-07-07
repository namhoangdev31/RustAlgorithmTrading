CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    permission VARCHAR(100) NOT NULL,
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission)
);

INSERT INTO role_permissions (role_id, permission) VALUES
('admin', '*'),
('trader', 'market:read'),
('trader', 'portfolio:read'),
('trader', 'positions:read'),
('trader', 'orders:read'),
('trader', 'orders:write'),
('trader', 'fills:read'),
('trader', 'trades:read'),
('trader', 'alerts:read'),
('trader', 'alerts:write'),
('trader', 'notifications:read'),
('trader', 'notifications:write'),
('analyst', 'market:read'),
('analyst', 'portfolio:read'),
('analyst', 'positions:read'),
('analyst', 'fills:read'),
('analyst', 'trades:read'),
('analyst', 'observability:read'),
('risk_manager', 'market:read'),
('risk_manager', 'portfolio:read'),
('risk_manager', 'positions:read'),
('risk_manager', 'orders:read'),
('risk_manager', 'risk:read'),
('risk_manager', 'risk:write'),
('risk_manager', 'admin:risk')
ON CONFLICT ON CONSTRAINT unique_role_permission DO NOTHING;

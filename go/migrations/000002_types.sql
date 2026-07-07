CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE order_side AS ENUM ('buy', 'sell');
CREATE TYPE order_type AS ENUM ('market', 'limit', 'stop', 'stop_limit');
CREATE TYPE order_status AS ENUM ('received', 'previewed', 'accepted', 'routed', 'broker_acknowledged', 'partially_filled', 'filled', 'cancel_requested', 'canceled', 'rejected', 'expired', 'failed');
CREATE TYPE risk_decision_status AS ENUM ('approved', 'rejected');

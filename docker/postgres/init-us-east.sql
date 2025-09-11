-- PostgreSQL initialization for US East region (Chaos Testing)
-- This file is executed when the container starts for the first time

-- Create test schema
CREATE SCHEMA IF NOT EXISTS dojopool_test;

-- Create test tables
CREATE TABLE IF NOT EXISTS dojopool_test.health_check (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50) DEFAULT 'us-east',
    status VARCHAR(50) DEFAULT 'healthy',
    response_time INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dojopool_test.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dojopool_test.matches (
    id SERIAL PRIMARY KEY,
    player_a_id INTEGER REFERENCES dojopool_test.users(id),
    player_b_id INTEGER REFERENCES dojopool_test.users(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Insert test data
INSERT INTO dojopool_test.health_check (region, status) VALUES
    ('us-east', 'healthy'),
    ('us-east', 'healthy'),
    ('us-east', 'healthy');

INSERT INTO dojopool_test.users (email, username) VALUES
    ('test1@example.com', 'testuser1'),
    ('test2@example.com', 'testuser2'),
    ('test3@example.com', 'testuser3');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_check_region ON dojopool_test.health_check(region);
CREATE INDEX IF NOT EXISTS idx_health_check_timestamp ON dojopool_test.health_check(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON dojopool_test.users(email);
CREATE INDEX IF NOT EXISTS idx_matches_status ON dojopool_test.matches(status);

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA dojopool_test TO dojopool_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dojopool_test TO dojopool_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dojopool_test TO dojopool_user;

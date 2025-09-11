-- PostgreSQL initialization for EU West region (Chaos Testing)
-- This file is executed when the container starts for the first time

-- Create test schema
CREATE SCHEMA IF NOT EXISTS dojopool_test;

-- Create test tables
CREATE TABLE IF NOT EXISTS dojopool_test.health_check (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50) DEFAULT 'eu-west',
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

-- Insert test data
INSERT INTO dojopool_test.health_check (region, status) VALUES
    ('eu-west', 'healthy'),
    ('eu-west', 'healthy');

INSERT INTO dojopool_test.users (email, username) VALUES
    ('eu-test1@example.com', 'eutestuser1'),
    ('eu-test2@example.com', 'eutestuser2');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_check_region ON dojopool_test.health_check(region);
CREATE INDEX IF NOT EXISTS idx_health_check_timestamp ON dojopool_test.health_check(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_email ON dojopool_test.users(email);

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA dojopool_test TO dojopool_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA dojopool_test TO dojopool_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA dojopool_test TO dojopool_user;

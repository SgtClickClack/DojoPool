-- DojoPool Staging Database Initialization
-- This script sets up the staging database with production-like schema

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS dojopool_staging;

-- Connect to the staging database
\c dojopool_staging;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_buffercache";

-- Create indexes for performance monitoring
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pg_stat_statements ON pg_stat_statements(query, calls);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pg_buffercache ON pg_buffercache(bufferid);

-- Create monitoring role for exporters
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'monitoring') THEN
        CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_password';
        GRANT pg_monitor TO monitoring;
        GRANT CONNECT ON DATABASE dojopool_staging TO monitoring;
    END IF;
END
$$;

-- Grant permissions for monitoring
GRANT USAGE ON SCHEMA public TO monitoring;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO monitoring;

-- Create staging-specific tables for testing
CREATE TABLE IF NOT EXISTS staging_health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_time INTEGER,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_staging_health_checks_service ON staging_health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_staging_health_checks_status ON staging_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_staging_health_checks_checked_at ON staging_health_checks(checked_at);

-- Create staging performance metrics table
CREATE TABLE IF NOT EXISTS staging_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(255) NOT NULL,
    value NUMERIC,
    unit VARCHAR(50),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_staging_performance_metrics_name ON staging_performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_staging_performance_metrics_recorded_at ON staging_performance_metrics(recorded_at);

-- Insert initial health check record
INSERT INTO staging_health_checks (service_name, status, response_time, details)
VALUES ('database', 'healthy', 0, '{"message": "Staging database initialized successfully"}')
ON CONFLICT DO NOTHING;

-- Log initialization completion
DO $$
BEGIN
    RAISE NOTICE 'DojoPool staging database initialized successfully at %', NOW();
END
$$;

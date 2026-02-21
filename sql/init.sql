-- FinDash Production Database Initialization

-- Enable TimescaleDB extension for time-series data
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Create necessary schemas
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions to application user
GRANT USAGE ON SCHEMA public TO findash_user;
GRANT CREATE ON SCHEMA public TO findash_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO findash_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO findash_user;

-- Comment for context
COMMENT ON DATABASE findash IS 'FinDash Personal Finance Dashboard Production Database';

-- Log initialization
SELECT 'Database initialization completed at ' || NOW()::text AS status;

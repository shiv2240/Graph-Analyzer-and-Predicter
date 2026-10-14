-- Database initialization script for PostgreSQL container
-- Extensions and default settings

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timezone default
SET timezone = 'UTC';

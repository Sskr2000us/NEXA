# Installing TimescaleDB

## Why TimescaleDB?
TimescaleDB provides optimized time-series data handling with automatic partitioning, compression, and continuous aggregates - essential for NEXA's high-volume telemetry data.

## Installation Options

### Option 1: Using Docker (Easiest)

```bash
# Pull TimescaleDB image
docker pull timescale/timescaledb-ha:pg15-latest

# Run container
docker run -d \
  --name nexa-timescaledb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=your_password \
  timescale/timescaledb-ha:pg15-latest

# Connect
psql -h localhost -U postgres -d postgres
```

### Option 2: Ubuntu/Debian

```bash
# Add repository
sudo sh -c "echo 'deb https://packagecloud.io/timescale/timescaledb/ubuntu/ $(lsb_release -c -s) main' > /etc/apt/sources.list.d/timescaledb.list"

# Import GPG key
wget --quiet -O - https://packagecloud.io/timescale/timescaledb/gpgkey | sudo apt-key add -

# Install
sudo apt-get update
sudo apt-get install timescaledb-2-postgresql-15

# Configure
sudo timescaledb-tune --quiet --yes

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Option 3: macOS (Homebrew)

```bash
# Install TimescaleDB
brew install timescaledb

# Configure
timescaledb-tune --quiet --yes

# Restart PostgreSQL
brew services restart postgresql@15
```

### Option 4: Windows

1. Download installer from: https://www.timescale.com/download
2. Run the installer and follow prompts
3. Restart PostgreSQL service

### Option 5: Supabase (Cloud)

**Note:** Standard Supabase projects do NOT include TimescaleDB. You need:

1. **Supabase Pro/Enterprise** - Contact Supabase support to enable TimescaleDB
2. **Self-hosted Supabase** - Install TimescaleDB extension manually

## Verify Installation

```sql
-- Connect to database
psql -U postgres -d nexa

-- Create extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Verify
\dx timescaledb

-- Check version
SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';
```

## If You Can't Install TimescaleDB

Use the alternative schema files without TimescaleDB (see `00_core_schema_no_timescale.sql`)

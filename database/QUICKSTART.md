# NEXA Database - Quick Start Guide

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
# Install PostgreSQL 15+ and TimescaleDB
# Ubuntu/Debian
sudo apt-get install postgresql-15 postgresql-15-timescaledb

# macOS (Homebrew)
brew install postgresql@15 timescaledb

# Enable TimescaleDB extension
sudo timescaledb-tune --quiet --yes
```

### 2. Create Database

```bash
# Create database
createdb -U postgres nexa

# Or via psql
psql -U postgres
CREATE DATABASE nexa;
\c nexa
```

### 3. Run Migrations

Execute SQL files in order:

```bash
cd database

# FIRST: Install TimescaleDB helpers (makes TimescaleDB optional)
psql -U postgres -d nexa -f 00_timescaledb_helpers.sql

# Core schema
psql -U postgres -d nexa -f 01_core_schema.sql

# Telemetry & monitoring
psql -U postgres -d nexa -f 02_telemetry_diagnostics.sql

# AI & predictions
psql -U postgres -d nexa -f 03_ai_predictive.sql

# Automation & self-healing
psql -U postgres -d nexa -f 04_automation_self_healing.sql

# Security & alerts
psql -U postgres -d nexa -f 05_security_alerts.sql

# Subscriptions & billing
psql -U postgres -d nexa -f 06_subscription_billing.sql

# Performance optimizations
psql -U postgres -d nexa -f 07_indexes_views.sql

# Row-level security
psql -U postgres -d nexa -f 08_rls_policies.sql

# Triggers & functions
psql -U postgres -d nexa -f 09_triggers_functions.sql
```

Or ru0_*.sql 01_*.sql 02_*.sql 03_*.sql 04_*.sql 05_*.sql 06_*.sql 07_*.sql 08_*.sql 09_*.sql | psql -U postgres -d nexa
```

**Note:** If you don't have TimescaleDB installed, the schema will still work but with reduced performance for time-series data. See [INSTALL_TIMESCALEDB.md](INSTALL_TIMESCALEDB.md) for installation instructions.
```bash
cat 01_*.sql 02_*.sql 03_*.sql 04_*.sql 05_*.sql 06_*.sql 07_*.sql 08_*.sql 09_*.sql | psql -U postgres -d nexa
```

### 4. Verify Installation

```sql
-- Connect to database
psql -U postgres -d nexa

-- Check tables
\dt public.*

-- Check extensions
\dx

-- Verify TimescaleDB
SELECT * FROM timescaledb_information.hypertables;

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📁 File Structure

```
database/
├── 01_core_schema.sql              # Users, homes, devices, brands
├── 02_telemetry_diagnostics.sql    # Time-series data, diagnostics
├── 03_ai_predictive.sql            # ML models, predictions, anomalies
├── 04_automation_self_healing.sql  # Automations, scenes, self-healing
├── 05_security_alerts.sql          # Security, alerts, notifications
├── 06_subscription_billing.sql     # Plans, subscriptions, billing
├── 07_indexes_views.sql            # Indexes, materialized views
├── 08_rls_policies.sql             # Row-level security policies
├── 09_triggers_functions.sql       # Triggers, functions, audit
├── README.md                       # Full documentation
├── QUICKSTART.md                   # This file
└── migrations/                     # Future migration files
    └── seeds/                      # Seed data for development
```

## 🔑 Environment Setup

### Supabase Configuration

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Get your API keys from project settings
3. Add to `.env`:

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
```

### Local Development

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexa
REDIS_URL=redis://localhost:6379
```

## 📊 Common Queries

### Get Home Dashboard

```sql
SELECT * FROM home_dashboard_summary 
WHERE home_id = 'xxx';
```

### List All Devices for a Home

```sql
SELECT 
    d.id,
    d.device_name,
    d.device_type,
    d.is_online,
    d.health_score,
    d.battery_level,
    r.name as room_name
FROM devices d
LEFT JOIN rooms r ON d.room_id = r.id
WHERE d.home_id = 'xxx' 
AND d.deleted_at IS NULL
ORDER BY r.name, d.device_name;
```

### Get Recent Alerts

```sql
SELECT 
    alert_type,
    severity,
    title,
    message,
    time,
    status
FROM alerts
WHERE home_id = 'xxx'
AND time > NOW() - INTERVAL '7 days'
ORDER BY time DESC;
```

### Device Health Summary

```sql
SELECT * FROM device_health_summary
WHERE home_id = 'xxx'
ORDER BY health_score ASC;
```

### Energy Usage (Last 30 Days)

```sql
SELECT 
    day,
    total_energy_kwh,
    total_cost,
    peak_hour_energy_kwh,
    off_peak_energy_kwh
FROM energy_usage_summary
WHERE home_id = 'xxx'
AND day >= NOW() - INTERVAL '30 days'
ORDER BY day DESC;
```

### Active Failure Predictions

```sql
SELECT 
    d.device_name,
    fp.failure_type,
    fp.risk_score,
    fp.predicted_failure_date,
    fp.preventive_actions
FROM failure_predictions fp
JOIN devices d ON fp.device_id = d.id
WHERE fp.home_id = 'xxx'
AND fp.prediction_status = 'active'
ORDER BY fp.risk_score DESC;
```

## 🔧 Maintenance Commands

### Refresh Materialized Views

```sql
-- Refresh all views (run daily)
SELECT refresh_materialized_views();

-- Or refresh individually
REFRESH MATERIALIZED VIEW CONCURRENTLY home_dashboard_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY device_health_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY energy_usage_summary;
```

### Update Statistics

```sql
-- Analyze specific table
ANALYZE devices;

-- Analyze all tables
ANALYZE;
```

### Check Table Sizes

```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
```

### Monitor Compression

```sql
SELECT 
    hypertable_name,
    total_chunks,
    number_compressed_chunks,
    pg_size_pretty(uncompressed_heap_size) as uncompressed,
    pg_size_pretty(compressed_heap_size) as compressed,
    ROUND((1 - compressed_heap_size::float / uncompressed_heap_size) * 100, 2) as compression_ratio
FROM timescaledb_information.compression_stats;
```

## 🐛 Troubleshooting

### Issue: TimescaleDB extension not available

**Error:** `extension "timescaledb" is not available`

**Solutions:**

1. **Install TimescaleDB** (Recommended for production):
   ```bash
   # See INSTALL_TIMESCALEDB.md for detailed instructions
   
   # Quick Docker option:
   docker run -d --name nexa-timescaledb \
     -p 5432:5432 \
     -e POSTGRES_PASSWORD=postgres \
     timescale/timescaledb-ha:pg15-latest
   ```

2. **Use without TimescaleDB** (Development only):
   ```bash
   # The updated schema will work without TimescaleDB
   # Run the helper script first:
   psql -U postgres -d nexa -f 00_timescaledb_helpers.sql
   
   # Then run other schema files normally
   psql -U postgres -d nexa -f 01_core_schema.sql
   # ... etc
   ```

**Impact without TimescaleDB:**
- ✅ All features still work
- ⚠️ Reduced performance for large time-series datasets
- ⚠️ No automatic compression (manual cleanup needed)
- ⚠️ No continuous aggregates (use materialized views instead)

### Issue: TimescaleDB not working

```sql
-- Check if extension is enabled
\dx timescaledb

-- If not, enable it
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

### Issue: RLS blocking queries

```sql
-- Check which policies are applied
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Temporarily disable RLS (development only!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Issue: Slow queries

```sql
-- Find slow queries
SELECT * FROM slow_queries LIMIT 10;

-- Analyze specific query
EXPLAIN ANALYZE
SELECT ... your query here ...;
```

### Issue: Table bloat

```sql
-- Check bloat
SELECT * FROM table_bloat
WHERE dead_tuple_percent > 10
ORDER BY dead_tuple_percent DESC;

-- Vacuum to clean up
VACUUM ANALYZE table_name;

-- Full vacuum (locks table)
VACUUM FULL table_name;
```

## 📚 Next Steps

1. **Read full documentation**: See `README.md` for comprehensive guide
2. **Add seed data**: Populate with test data (see `seeds/` folder)
3. **Set up backup**: Configure automated backups
4. **Configure monitoring**: Set up database monitoring tools
5. **Performance tuning**: Adjust based on your workload

## 🆘 Support

- **Documentation**: See README.md
- **TimescaleDB**: https://docs.timescale.com
- **Supabase**: https://supabase.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/

## ✅ Checklist

After setup, verify:

- [ ] All SQL files executed without errors
- [ ] TimescaleDB extension enabled
- [ ] Hypertables created (check with `\d+ device_telemetry`)
- [ ] RLS policies enabled (check with `\d+ devices`)
- [ ] Indexes created (check with `\di`)
- [ ] Materialized views populated
- [ ] Can query sample data
- [ ] Compression policies active
- [ ] Retention policies set

---

**You're all set! Start building with NEXA! 🚀**

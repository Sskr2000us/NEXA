# NEXA Smart Home Intelligence OS
## Enterprise Database Architecture Documentation

**Version:** 1.0.0  
**Database:** PostgreSQL 15+ / Supabase  
**Architecture:** MFE/BFF with TimescaleDB Time-Series Optimization

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture Design](#architecture-design)
3. [Database Schema](#database-schema)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [Key Features](#key-features)
6. [Performance Optimizations](#performance-optimizations)
7. [Security](#security)
8. [Deployment Guide](#deployment-guide)
9. [Maintenance](#maintenance)

---

## 🎯 Overview

NEXA is a universal smart home intelligence platform providing monitoring, diagnostics, predictive failure AI, self-healing automation, and multi-brand integration. The database architecture is designed to support:

- **Multi-tenancy** with row-level security
- **High-volume time-series data** (sensor readings, telemetry)
- **Real-time device monitoring** across multiple homes
- **AI/ML predictions** and anomaly detection
- **Complex automation** and self-healing workflows
- **Enterprise-grade security** scanning and alerting
- **Subscription-based SaaS** with B2B partnerships

---

## 🏗️ Architecture Design

### Technology Stack

- **Database:** PostgreSQL 15+
- **Extensions:** TimescaleDB, pg_stat_statements, pgcrypto
- **Backend:** Supabase (Auth, Storage, Functions)
- **API Layer:** Render (BFF/Microservices)
- **Frontend:** Vercel (Next.js/React)

### Design Principles

1. **Normalization:** 3NF with strategic denormalization for performance
2. **Time-Series Optimization:** TimescaleDB hypertables for telemetry data
3. **Multi-Tenancy:** Row-Level Security (RLS) for data isolation
4. **Scalability:** Partitioning, compression, and retention policies
5. **Audit Trail:** Comprehensive logging for compliance
6. **Performance:** Strategic indexes, materialized views, JSONB for flexibility

---

## 📊 Database Schema

### Core Modules

#### 1. **Core Schema** (`01_core_schema.sql`)
- **Users & Authentication**
  - `users` - User profiles extending Supabase auth
  - `user_sessions` - Login session tracking
  
- **Homes & Locations**
  - `homes` - Properties containing smart devices
  - `home_members` - Multi-user home access control
  - `rooms` - Room/zone organization
  
- **Devices & Brands**
  - `brands` - Device manufacturers
  - `device_models` - Device catalog with capabilities
  - `ecosystems` - Smart home platforms (Alexa, Google Home, etc.)
  - `devices` - Main device registry
  - `device_states` - Historical state changes (time-series)
  - `device_groups` - Device groupings

**Key Tables:**
```sql
users (id, email, role, preferences)
  └─► homes (id, owner_id, name, address)
       └─► devices (id, home_id, device_type, health_score)
            └─► device_states (time, device_id, state)
```

#### 2. **Telemetry & Diagnostics** (`02_telemetry_diagnostics.sql`)
- **Time-Series Data** (TimescaleDB Hypertables)
  - `device_telemetry` - High-frequency sensor data
  - `energy_usage` - Power consumption metrics
  - `network_metrics` - WiFi/connectivity data
  - `device_error_logs` - Error and exception logs
  
- **Diagnostics**
  - `diagnostic_runs` - Diagnostic scan execution
  - `diagnostic_issues` - Discovered issues
  - `device_health_history` - Health score timeline
  - `firmware_updates` - Update tracking

**Continuous Aggregates:**
- `device_telemetry_hourly` - Hourly averages
- `device_telemetry_daily` - Daily statistics
- `energy_usage_hourly` - Energy rollups

#### 3. **AI/ML & Predictions** (`03_ai_predictive.sql`)
- **Machine Learning**
  - `ml_models` - AI model registry
  - `ml_predictions_log` - Prediction audit trail
  
- **Predictive Analytics**
  - `failure_predictions` - Device failure forecasts
  - `anomaly_detections` - Behavioral anomalies
  - `device_usage_patterns` - Learned behaviors
  - `ai_insights` - Actionable recommendations
  - `device_benchmarks` - Performance comparisons

#### 4. **Automation & Self-Healing** (`04_automation_self_healing.sql`)
- **Automation**
  - `automations` - User and system automations
  - `automation_executions` - Execution history
  - `scenes` - Pre-configured device states
  - `scene_activations` - Scene usage tracking
  
- **Self-Healing**
  - `self_healing_actions` - Available healing actions
  - `self_healing_executions` - Healing attempt logs
  - `automation_health_checks` - Automation monitoring
  - `ecosystem_sync_status` - Cross-platform sync

#### 5. **Security & Alerts** (`05_security_alerts.sql`)
- **Security**
  - `security_scans` - Security assessment runs
  - `security_vulnerabilities` - CVE tracking
  - `security_incidents` - Threat detection
  - `network_access_rules` - Access control
  
- **Notifications**
  - `alert_rules` - Alert conditions
  - `alerts` - Generated alerts
  - `user_notifications` - Sent notifications
  - `user_notification_preferences` - User settings

#### 6. **Subscription & Billing** (`06_subscription_billing.sql`)
- **SaaS Revenue**
  - `subscription_plans` - Available tiers
  - `user_subscriptions` - Active subscriptions
  - `invoices` - Billing invoices
  - `payment_transactions` - Payment history
  - `coupons` - Promotional codes
  
- **B2B/OEM**
  - `oem_partners` - Business partnerships
  - `oem_api_keys` - Partner API access
  - `b2b_revenue` - Revenue sharing
  - `api_usage` - Metered billing tracking

---

## 🔗 Entity Relationship Diagram

### High-Level Architecture

```
┌─────────────┐
│   USERS     │
└──────┬──────┘
       │ owns
       ▼
┌─────────────┐      ┌──────────────┐
│   HOMES     │◄────►│ HOME_MEMBERS │
└──────┬──────┘      └──────────────┘
       │ contains
       ├────────┬────────┬──────────┐
       ▼        ▼        ▼          ▼
   ┌───────┐ ┌──────┐ ┌──────┐ ┌────────┐
   │DEVICES│ │ROOMS │ │ALERTS│ │SECURITY│
   └───┬───┘ └──────┘ └──────┘ └────────┘
       │
       ├─────────┬───────────┬──────────┐
       ▼         ▼           ▼          ▼
  ┌─────────┐ ┌──────┐ ┌─────────┐ ┌────────┐
  │TELEMETRY│ │AI/ML │ │AUTOMATION│ │ENERGY  │
  └─────────┘ └──────┘ └─────────┘ └────────┘
```

### Core Relationships

1. **User → Homes** (1:Many)
   - User can own multiple homes
   - User can be member of multiple homes

2. **Home → Devices** (1:Many)
   - Each device belongs to one home
   - Devices organized into rooms

3. **Device → Telemetry** (1:Many)
   - Time-series data streams
   - High-frequency sensor readings

4. **Device → Predictions** (1:Many)
   - AI-generated failure forecasts
   - Anomaly detections

5. **Home → Automations** (1:Many)
   - User-created rules
   - System-generated automations

---

## 🚀 Key Features

### 1. Time-Series Optimization (TimescaleDB)

**Hypertables:**
- Automatic partitioning by time
- Compression after 7-30 days
- Retention policies (90 days to 7 years)

**Continuous Aggregates:**
- Pre-computed hourly/daily rollups
- Real-time materialization
- Automatic refresh policies

```sql
-- Example: Hourly energy aggregation
SELECT * FROM energy_usage_hourly
WHERE home_id = 'xxx' 
AND hour >= NOW() - INTERVAL '7 days';
```

### 2. Row-Level Security (RLS)

**Multi-tenant isolation:**
- Users only access their homes
- Home members have controlled access
- Service role bypasses for backend operations

```sql
-- Policy: Users can view devices in their homes
CREATE POLICY devices_select ON devices
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));
```

### 3. Full-Text Search

**Searchable entities:**
- Devices (name, type, notes)
- Brands and models
- GIN indexes for fast lookups

```sql
SELECT * FROM devices
WHERE search_vector @@ to_tsquery('english', 'philips & hue');
```

### 4. JSONB Flexibility

**Semi-structured data:**
- Device capabilities
- Automation triggers/actions
- AI prediction indicators
- User preferences

```sql
-- Query JSONB: Find devices with specific capability
SELECT * FROM devices
WHERE capabilities @> '{"dim": true}'::jsonb;
```

### 5. Audit Trail

**Compliance logging:**
- All CRUD operations on sensitive tables
- User action tracking
- IP and user agent capture
- 7-year retention for compliance

---

## ⚡ Performance Optimizations

### Indexes

**Strategic indexing:**
- Composite indexes for common queries
- Partial indexes for filtered data
- GIN indexes for JSONB and full-text search
- TimescaleDB time-space partitioning

**Example optimizations:**
```sql
-- Fast device lookups by home and status
CREATE INDEX idx_devices_home_type_status 
    ON devices(home_id, device_type, connectivity_status) 
    WHERE deleted_at IS NULL;

-- Active high-risk predictions
CREATE INDEX idx_predictions_active_high_risk 
    ON failure_predictions(home_id, risk_score DESC, predicted_failure_date)
    WHERE prediction_status = 'active' AND risk_score >= 70;
```

### Materialized Views

**Pre-aggregated analytics:**
- `home_dashboard_summary` - Real-time home metrics
- `device_health_summary` - Device health rollups
- `energy_usage_summary` - Daily energy stats

**Refresh strategy:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY home_dashboard_summary;
```

### Compression & Retention

**Storage optimization:**
- Compress time-series data after 7-30 days
- 50-70% storage reduction
- Automatic retention policies

```sql
-- Compress after 7 days, retain for 1 year
SELECT add_compression_policy('device_telemetry', INTERVAL '7 days');
SELECT add_retention_policy('device_telemetry', INTERVAL '365 days');
```

---

## 🔒 Security

### Row-Level Security (RLS)

**Data isolation:**
- User-scoped data access
- Home-based multi-tenancy
- Role-based permissions (owner, admin, member, guest)

### Authentication

**Supabase Auth integration:**
- JWT-based authentication
- OAuth providers (Google, Apple, etc.)
- Magic link and OTP support
- Session management

### Encryption

**Data protection:**
- Passwords hashed with bcrypt
- API keys hashed and prefixed
- Sensitive data encrypted at rest
- TLS/SSL for data in transit

### Vulnerability Tracking

**Security monitoring:**
- CVE database integration
- Automated security scans
- CVSS scoring
- Remediation workflow

---

## 📦 Deployment Guide

### 1. Prerequisites

```bash
# Required extensions
- PostgreSQL 15+
- TimescaleDB 2.0+
- pg_stat_statements
- pgcrypto
```

### 2. Database Setup

```bash
# Execute in order:
psql -U postgres -d nexa -f 01_core_schema.sql
psql -U postgres -d nexa -f 02_telemetry_diagnostics.sql
psql -U postgres -d nexa -f 03_ai_predictive.sql
psql -U postgres -d nexa -f 04_automation_self_healing.sql
psql -U postgres -d nexa -f 05_security_alerts.sql
psql -U postgres -d nexa -f 06_subscription_billing.sql
psql -U postgres -d nexa -f 07_indexes_views.sql
psql -U postgres -d nexa -f 08_rls_policies.sql
psql -U postgres -d nexa -f 09_triggers_functions.sql
```

### 3. Supabase Configuration

```typescript
// supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Backend with elevated permissions
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 4. Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Database (for migrations)
DATABASE_URL=postgresql://user:pass@host:5432/nexa

# Redis (caching)
REDIS_URL=redis://localhost:6379
```

---

## 🔧 Maintenance

### Regular Tasks

**Daily:**
- Monitor slow queries (`slow_queries` view)
- Check RLS policy performance
- Review error logs

**Weekly:**
- Refresh materialized views
- Analyze table statistics
- Check compression effectiveness

**Monthly:**
- Review unused indexes (`unused_indexes` view)
- Vacuum and analyze tables
- Update table statistics targets
- Review table bloat (`table_bloat` view)

### Monitoring Queries

```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View slow queries
SELECT * FROM slow_queries LIMIT 10;

-- Check hypertable compression
SELECT * FROM timescaledb_information.compression_settings;
```

### Backup Strategy

**Recommended approach:**
- Daily automated backups
- Point-in-time recovery (PITR) enabled
- 30-day retention minimum
- Test restore procedures quarterly

```bash
# Backup command
pg_dump -U postgres -Fc nexa > nexa_backup_$(date +%Y%m%d).dump

# Restore command
pg_restore -U postgres -d nexa -c nexa_backup_20250101.dump
```

---

## 📈 Scalability Considerations

### Horizontal Scaling

**Read replicas:**
- Time-series queries to read replicas
- Dashboard queries to replicas
- Write operations to primary

**Partitioning:**
- TimescaleDB handles automatic partitioning
- Consider manual partitioning for very large non-TS tables
- Partition by home_id for large multi-tenant tables

### Caching Strategy

**Redis integration:**
- Dashboard summaries (5-minute TTL)
- Device states (1-minute TTL)
- User sessions
- API rate limiting

**Application-level:**
- Materialized views for expensive queries
- Client-side caching with SWR/React Query
- CDN for static assets

---

## 🎓 Best Practices

### Query Optimization

1. **Use prepared statements** to avoid SQL injection
2. **Limit SELECT columns** - don't use SELECT *
3. **Use EXISTS over COUNT(*)** for boolean checks
4. **Leverage partial indexes** for filtered queries
5. **Monitor query plans** with EXPLAIN ANALYZE

### JSONB Usage

1. **Index frequently queried paths** with GIN indexes
2. **Use JSONB operators** (@>, ?, ?&) for fast lookups
3. **Avoid deeply nested structures** (max 3-4 levels)
4. **Extract to columns** if queried frequently

### Time-Series Data

1. **Use continuous aggregates** for dashboards
2. **Set appropriate retention policies** to manage storage
3. **Enable compression** for historical data
4. **Use time_bucket** for grouping by time intervals

---

## 📞 Support & Resources

- **Documentation:** [TimescaleDB Docs](https://docs.timescale.com)
- **Supabase:** [Supabase Docs](https://supabase.com/docs)
- **PostgreSQL:** [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

## 📝 Schema Statistics

| Category | Tables | Indexes | Views | Functions |
|----------|--------|---------|-------|-----------|
| Core | 12 | 45 | 0 | 4 |
| Telemetry | 8 | 28 | 3 | 0 |
| AI/ML | 7 | 24 | 0 | 0 |
| Automation | 8 | 26 | 0 | 0 |
| Security | 10 | 34 | 0 | 0 |
| Billing | 13 | 38 | 0 | 0 |
| System | 1 | 3 | 3 | 12 |
| **Total** | **59** | **198** | **6** | **16** |

---

## 🏆 Enterprise Features

✅ **Multi-tenancy** with RLS  
✅ **Time-series optimization** (TimescaleDB)  
✅ **Predictive analytics** ready  
✅ **Audit trail** for compliance  
✅ **API usage tracking** for billing  
✅ **Full-text search** indexed  
✅ **Automated backups** supported  
✅ **Horizontal scaling** ready  
✅ **GDPR compliant** architecture  
✅ **SOC 2 ready** logging  

---

**Built with ❤️ for NEXA - The Intelligence Layer for Every Smart Home**

*Database Schema Version 1.0.0 | Last Updated: December 12, 2025*

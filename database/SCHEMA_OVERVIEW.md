# NEXA Database Schema Overview

## Database Entity Summary

### 📊 Total Statistics
- **Total Tables:** 59
- **Total Indexes:** 198+
- **Materialized Views:** 6
- **Functions:** 16
- **Triggers:** 20+
- **RLS Policies:** 50+

## 🗂️ Schema Organization

### 1. Core Infrastructure (12 tables)
```
users                          → User accounts & profiles
user_sessions                  → Login session tracking
homes                          → Properties/locations
home_members                   → Multi-user home access
rooms                          → Room organization
brands                         → Device manufacturers
device_models                  → Device catalog
ecosystems                     → Smart home platforms
user_ecosystem_connections     → OAuth connections
devices                        → Main device registry
device_states                  → State history (time-series)
device_groups                  → Device collections
device_group_members           → Group membership
```

### 2. Telemetry & Monitoring (8 tables)
```
device_telemetry              → Sensor data (hypertable)
device_telemetry_hourly       → Hourly aggregates
device_telemetry_daily        → Daily aggregates
energy_usage                  → Power consumption (hypertable)
energy_usage_hourly           → Energy rollups
diagnostic_runs               → Diagnostic executions
diagnostic_issues             → Discovered issues
device_error_logs             → Error tracking (hypertable)
network_metrics               → Connectivity data (hypertable)
device_health_history         → Health scores (hypertable)
firmware_updates              → Update tracking
```

### 3. AI & Machine Learning (7 tables)
```
ml_models                     → Model registry
ml_predictions_log            → Prediction audit (hypertable)
failure_predictions           → Device failure forecasts
anomaly_detections            → Behavioral anomalies (hypertable)
device_usage_patterns         → Learned behaviors
ai_insights                   → Recommendations
device_benchmarks             → Performance comparisons
```

### 4. Automation & Self-Healing (8 tables)
```
automations                   → Automation rules
automation_executions         → Execution history (hypertable)
automation_health_checks      → Health monitoring (hypertable)
scenes                        → Device state presets
scene_activations             → Scene usage (hypertable)
self_healing_actions          → Action registry
self_healing_executions       → Healing logs (hypertable)
ecosystem_sync_status         → Cross-platform sync
```

### 5. Security & Alerts (10 tables)
```
security_scans                → Security assessments
security_vulnerabilities      → CVE tracking
security_incidents            → Threat detection (hypertable)
network_access_rules          → Access control
alert_rules                   → Alert conditions
alerts                        → Generated alerts (hypertable)
notification_templates        → Message templates
user_notifications            → Sent notifications (hypertable)
user_notification_preferences → User settings
```

### 6. Subscription & Revenue (13 tables)
```
subscription_plans            → Available tiers
user_subscriptions            → Active subscriptions
invoices                      → Billing invoices
invoice_line_items            → Invoice details
payment_transactions          → Payment history
coupons                       → Promo codes
coupon_redemptions            → Redemption tracking
oem_partners                  → B2B partnerships
oem_api_keys                  → Partner API access
b2b_revenue                   → Revenue sharing
api_usage                     → Usage tracking (hypertable)
```

### 7. System & Audit (1 table)
```
audit_logs                    → Audit trail (hypertable)
```

## 🔑 Key Features by Category

### Time-Series Tables (TimescaleDB Hypertables)
✅ Automatic partitioning by time  
✅ Compression policies (7-90 days)  
✅ Retention policies (90 days - 7 years)  
✅ Continuous aggregates for fast queries  

**Hypertables:**
- device_telemetry
- device_states
- energy_usage
- device_error_logs
- network_metrics
- device_health_history
- anomaly_detections
- automation_executions
- scene_activations
- self_healing_executions
- automation_health_checks
- security_incidents
- alerts
- user_notifications
- ml_predictions_log
- api_usage
- audit_logs

### JSONB Columns (Flexible Schema)
- Device settings & capabilities
- Automation triggers & actions
- AI prediction indicators
- User preferences
- Error context
- Custom metadata

### Full-Text Search (GIN Indexes)
- Device names & notes
- Brand names
- Device model names
- Search across devices, brands, models

## 📈 Data Flow Examples

### Device Monitoring Flow
```
Device → device_telemetry (real-time)
       → device_telemetry_hourly (aggregated)
       → device_health_history (calculated)
       → device_health_summary (materialized view)
```

### Alert Flow
```
Device Issue → diagnostic_runs
            → diagnostic_issues
            → alerts (generated)
            → user_notifications (sent)
            → user receives push/email
```

### Predictive Flow
```
device_telemetry → ml_models (analyze)
                 → failure_predictions (forecast)
                 → alerts (warning)
                 → self_healing_actions (preventive)
```

### Automation Flow
```
Trigger Event → automations (check conditions)
              → automation_executions (execute)
              → device_states (update)
              → automation_health_checks (verify)
```

## 🎯 Query Patterns

### Dashboard Queries
```sql
-- Home overview
SELECT * FROM home_dashboard_summary WHERE home_id = ?;

-- Device health
SELECT * FROM device_health_summary WHERE home_id = ?;

-- Energy usage
SELECT * FROM energy_usage_summary WHERE home_id = ? AND day >= ?;
```

### Time-Series Queries
```sql
-- Recent telemetry
SELECT * FROM device_telemetry 
WHERE device_id = ? AND time >= NOW() - INTERVAL '24 hours';

-- Hourly averages
SELECT * FROM device_telemetry_hourly
WHERE device_id = ? AND hour >= NOW() - INTERVAL '7 days';
```

### AI/ML Queries
```sql
-- Active predictions
SELECT * FROM failure_predictions 
WHERE home_id = ? AND prediction_status = 'active'
ORDER BY risk_score DESC;

-- Recent anomalies
SELECT * FROM anomaly_detections
WHERE device_id = ? AND time >= NOW() - INTERVAL '7 days'
ORDER BY anomaly_score DESC;
```

## 🔒 Security Features

### Row-Level Security (RLS)
- ✅ Enabled on all user-facing tables
- ✅ Home-based data isolation
- ✅ Role-based permissions
- ✅ Service role bypass for backend

### Audit Trail
- ✅ All INSERT/UPDATE/DELETE operations logged
- ✅ User action tracking
- ✅ 7-year retention for compliance
- ✅ IP address and user agent capture

### Data Protection
- ✅ Password hashing (bcrypt)
- ✅ API key hashing
- ✅ TLS/SSL encryption in transit
- ✅ Encrypted at rest (Supabase)

## ⚡ Performance Features

### Indexes (198+)
- **B-tree indexes:** Fast lookups and sorting
- **GIN indexes:** JSONB and full-text search
- **Partial indexes:** Filtered data only
- **Composite indexes:** Multi-column queries

### Materialized Views (6)
- home_dashboard_summary
- device_health_summary
- energy_usage_summary
- slow_queries (monitoring)
- unused_indexes (monitoring)
- table_bloat (monitoring)

### Compression & Retention
- Automatic compression (50-70% reduction)
- Configurable retention (90 days - 7 years)
- Background job scheduling

## 📦 Installation Order

1. **01_core_schema.sql** - Foundation tables
2. **02_telemetry_diagnostics.sql** - Time-series data
3. **03_ai_predictive.sql** - ML & predictions
4. **04_automation_self_healing.sql** - Automations
5. **05_security_alerts.sql** - Security & notifications
6. **06_subscription_billing.sql** - Revenue & billing
7. **07_indexes_views.sql** - Performance optimization
8. **08_rls_policies.sql** - Row-level security
9. **09_triggers_functions.sql** - Business logic

## 🔄 Maintenance Schedule

| Frequency | Task |
|-----------|------|
| **Real-time** | Continuous aggregates update |
| **Hourly** | Compression jobs run |
| **Daily** | Refresh materialized views |
| **Weekly** | Vacuum and analyze tables |
| **Monthly** | Review slow queries, unused indexes |
| **Quarterly** | Update statistics, test backups |

## 📞 Quick Reference

### Connection String
```
postgresql://user:pass@host:5432/nexa
```

### Key Commands
```bash
# Connect
psql -U postgres -d nexa

# List tables
\dt public.*

# Describe table
\d+ devices

# Show indexes
\di devices*

# Check hypertables
SELECT * FROM timescaledb_information.hypertables;
```

---

**NEXA Database v1.0.0** - World-class, enterprise-standard database architecture for smart home intelligence.

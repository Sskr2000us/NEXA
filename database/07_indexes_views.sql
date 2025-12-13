-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Advanced Indexes, Views & Performance Optimizations
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================================

-- Home Overview Dashboard View
CREATE MATERIALIZED VIEW home_dashboard_summary AS
SELECT 
    h.id as home_id,
    h.name as home_name,
    h.owner_id,
    
    -- Device Statistics
    COUNT(DISTINCT d.id) as total_devices,
    COUNT(DISTINCT d.id) FILTER (WHERE d.is_online = true) as online_devices,
    COUNT(DISTINCT d.id) FILTER (WHERE d.is_online = false) as offline_devices,
    COUNT(DISTINCT d.id) FILTER (WHERE d.connectivity_status = 'weak') as weak_signal_devices,
    COUNT(DISTINCT d.id) FILTER (WHERE d.battery_level < 20 AND d.battery_level IS NOT NULL) as low_battery_devices,
    
    -- Health Metrics
    AVG(d.health_score) as avg_health_score,
    MIN(d.health_score) as min_health_score,
    
    -- Automation Statistics
    COUNT(DISTINCT a.id) as total_automations,
    COUNT(DISTINCT a.id) FILTER (WHERE a.is_enabled = true) as enabled_automations,
    COUNT(DISTINCT a.id) FILTER (WHERE a.health_status IN ('failing', 'broken')) as broken_automations,
    
    -- Scene Statistics
    COUNT(DISTINCT s.id) as total_scenes,
    
    -- Active Alerts
    COUNT(DISTINCT al.id) FILTER (WHERE al.status = 'active' AND al.time > NOW() - INTERVAL '24 hours') as active_alerts_24h,
    COUNT(DISTINCT al.id) FILTER (WHERE al.severity = 'critical' AND al.status = 'active') as critical_alerts,
    
    -- Latest Updates
    MAX(d.last_seen_at) as last_device_activity
    
FROM public.homes h
LEFT JOIN public.devices d ON h.id = d.home_id AND d.deleted_at IS NULL
LEFT JOIN public.automations a ON h.id = a.home_id AND a.deleted_at IS NULL
LEFT JOIN public.scenes s ON h.id = s.home_id
LEFT JOIN public.alerts al ON h.id = al.home_id
WHERE h.is_active = true
GROUP BY h.id, h.name, h.owner_id;

CREATE UNIQUE INDEX idx_home_dashboard_home_id ON home_dashboard_summary(home_id);
CREATE INDEX idx_home_dashboard_owner ON home_dashboard_summary(owner_id);

-- Device Health Summary View
CREATE MATERIALIZED VIEW device_health_summary AS
SELECT 
    d.id as device_id,
    d.home_id,
    d.device_name,
    d.device_type,
    d.health_score,
    d.is_online,
    d.connectivity_status,
    d.last_seen_at,
    
    -- Recent Issues
    COUNT(DISTINCT dl.id) FILTER (WHERE dl.time > NOW() - INTERVAL '7 days') as errors_last_7_days,
    COUNT(DISTINCT dl.id) FILTER (WHERE dl.time > NOW() - INTERVAL '24 hours') as errors_last_24h,
    
    -- Diagnostics
    COUNT(DISTINCT di.id) FILTER (WHERE di.created_at > NOW() - INTERVAL '30 days') as diagnostics_last_30_days,
    COUNT(DISTINCT di.id) FILTER (WHERE di.severity IN ('error', 'critical')) as critical_issues,
    
    -- Predictions
    MAX(fp.risk_score) as highest_failure_risk,
    COUNT(DISTINCT fp.id) FILTER (WHERE fp.prediction_status = 'active') as active_predictions,
    
    -- Self-Healing
    COUNT(DISTINCT sh.id) FILTER (WHERE sh.time > NOW() - INTERVAL '30 days') as healing_attempts_30d,
    COUNT(DISTINCT sh.id) FILTER (WHERE sh.success = true AND sh.time > NOW() - INTERVAL '30 days') as successful_healings_30d,
    
    -- Anomalies
    COUNT(DISTINCT ad.id) FILTER (WHERE ad.time > NOW() - INTERVAL '7 days') as anomalies_last_7_days,
    
    NOW() as last_updated

FROM public.devices d
LEFT JOIN public.device_error_logs dl ON d.id = dl.device_id
LEFT JOIN public.diagnostic_issues di ON d.id = di.device_id AND di.status = 'open'
LEFT JOIN public.failure_predictions fp ON d.id = fp.device_id AND fp.prediction_status = 'active'
LEFT JOIN public.self_healing_executions sh ON d.id = sh.device_id
LEFT JOIN public.anomaly_detections ad ON d.id = ad.device_id
WHERE d.deleted_at IS NULL
GROUP BY d.id, d.home_id, d.device_name, d.device_type, d.health_score, 
         d.is_online, d.connectivity_status, d.last_seen_at;

CREATE UNIQUE INDEX idx_device_health_device_id ON device_health_summary(device_id);
CREATE INDEX idx_device_health_home ON device_health_summary(home_id);
CREATE INDEX idx_device_health_score ON device_health_summary(health_score);
CREATE INDEX idx_device_health_risk ON device_health_summary(highest_failure_risk DESC NULLS LAST);

-- Energy Usage Summary by Home
CREATE MATERIALIZED VIEW energy_usage_summary AS
SELECT 
    home_id,
    date_trunc('day', time) AS day,
    
    -- Energy Metrics
    SUM(energy_kwh) as total_energy_kwh,
    AVG(power_watts) as avg_power_watts,
    MAX(power_watts) as peak_power_watts,
    SUM(cost_estimate) as total_cost,
    
    -- Peak Analysis
    SUM(energy_kwh) FILTER (WHERE is_peak_hour = true) as peak_hour_energy_kwh,
    SUM(energy_kwh) FILTER (WHERE is_peak_hour = false) as off_peak_energy_kwh,
    
    -- Device Count
    COUNT(DISTINCT device_id) as devices_reporting,
    
    -- Sample Count
    COUNT(*) as sample_count

FROM public.energy_usage
GROUP BY home_id, date_trunc('day', time);

CREATE INDEX idx_energy_summary_home_day ON energy_usage_summary(home_id, day DESC);
CREATE INDEX idx_energy_summary_day ON energy_usage_summary(day DESC);

-- Refresh policy for materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY home_dashboard_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY device_health_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY energy_usage_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Multi-column indexes for common query patterns

-- Devices: Home + Type + Status (for filtered device lists)
CREATE INDEX idx_devices_home_type_status ON public.devices(home_id, device_type, connectivity_status) 
    WHERE deleted_at IS NULL;

-- Devices: Home + Online + Health (for dashboard)
CREATE INDEX idx_devices_home_online_health ON public.devices(home_id, is_online, health_score DESC) 
    WHERE deleted_at IS NULL;

-- Devices: Battery monitoring
CREATE INDEX idx_devices_battery_low ON public.devices(home_id, battery_level) 
    WHERE battery_level IS NOT NULL AND battery_level < 20 AND deleted_at IS NULL;

-- Failure Predictions: Active high-risk predictions
CREATE INDEX idx_predictions_active_high_risk ON public.failure_predictions(home_id, risk_score DESC, predicted_failure_date)
    WHERE prediction_status = 'active' AND risk_score >= 70;

-- Alerts: Active by severity and home
CREATE INDEX idx_alerts_active_severity ON public.alerts(home_id, severity, time DESC)
    WHERE status = 'active';

-- Diagnostic Issues: Open issues by device
CREATE INDEX idx_diagnostic_issues_open_device ON public.diagnostic_issues(device_id, severity, created_at DESC)
    WHERE status = 'open';

-- Automation Executions: Recent failures
CREATE INDEX idx_automation_exec_failures ON public.automation_executions(automation_id, time DESC)
    WHERE status = 'failed';

-- Security Vulnerabilities: Open critical vulnerabilities
CREATE INDEX idx_vulnerabilities_critical_open ON public.security_vulnerabilities(home_id, cvss_score DESC, detected_at DESC)
    WHERE status = 'open' AND severity IN ('error', 'critical');

-- User Subscriptions: Active subscriptions with renewal dates
CREATE INDEX idx_subscriptions_active_renewal ON public.user_subscriptions(user_id, next_billing_date)
    WHERE status = 'active' AND auto_renew = true;

-- =====================================================
-- FULL TEXT SEARCH INDEXES
-- =====================================================

-- Add tsvector columns for full-text search
ALTER TABLE public.devices ADD COLUMN search_vector tsvector;
ALTER TABLE public.brands ADD COLUMN search_vector tsvector;
ALTER TABLE public.device_models ADD COLUMN search_vector tsvector;

-- Create update triggers for search vectors
CREATE OR REPLACE FUNCTION devices_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.device_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.device_type::text, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER devices_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION devices_search_vector_update();

CREATE OR REPLACE FUNCTION brands_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.slug, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER brands_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION brands_search_vector_update();

CREATE OR REPLACE FUNCTION device_models_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.model_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.model_number, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.device_type::text, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_models_search_vector_trigger 
    BEFORE INSERT OR UPDATE ON public.device_models
    FOR EACH ROW EXECUTE FUNCTION device_models_search_vector_update();

-- GIN indexes for full-text search
CREATE INDEX idx_devices_search ON public.devices USING GIN(search_vector);
CREATE INDEX idx_brands_search ON public.brands USING GIN(search_vector);
CREATE INDEX idx_device_models_search ON public.device_models USING GIN(search_vector);

-- =====================================================
-- JSONB INDEXES FOR NESTED DATA
-- =====================================================

-- GIN indexes for JSONB columns (for faster JSON queries)
CREATE INDEX idx_devices_settings_gin ON public.devices USING GIN(settings);
CREATE INDEX idx_devices_capabilities_gin ON public.devices USING GIN(capabilities);
CREATE INDEX idx_automations_triggers_gin ON public.automations USING GIN(triggers);
CREATE INDEX idx_automations_actions_gin ON public.automations USING GIN(actions);
CREATE INDEX idx_device_models_capabilities_gin ON public.device_models USING GIN(capabilities);
CREATE INDEX idx_failure_predictions_indicators_gin ON public.failure_predictions USING GIN(primary_indicators);

-- =====================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- =====================================================

-- Only index active/relevant records to save space

-- Active users only
CREATE INDEX idx_users_active_email ON public.users(email) WHERE is_active = true;

-- Devices needing attention
CREATE INDEX idx_devices_needs_attention ON public.devices(home_id, health_score, last_seen_at)
    WHERE deleted_at IS NULL AND (
        health_score < 70 OR 
        is_online = false OR 
        connectivity_status IN ('offline', 'weak')
    );

-- Pending self-healing actions
CREATE INDEX idx_self_healing_pending ON public.self_healing_executions(device_id, time DESC)
    WHERE status IN ('pending', 'in_progress');

-- Unresolved vulnerabilities
CREATE INDEX idx_vulnerabilities_unresolved ON public.security_vulnerabilities(home_id, severity, cvss_score DESC)
    WHERE status IN ('open', 'acknowledged', 'in_progress');

-- Active subscriptions with renewal dates (for expiration monitoring queries)
CREATE INDEX idx_subscriptions_active_renewal_date ON public.user_subscriptions(user_id, current_period_end)
    WHERE status = 'active';

-- =====================================================
-- BTREE INDEXES FOR SORTING & RANGE QUERIES
-- =====================================================

-- Timestamp indexes for time-range queries (DESC for recent-first sorting)
CREATE INDEX idx_devices_last_seen_desc ON public.devices(last_seen_at DESC NULLS LAST) WHERE deleted_at IS NULL;
CREATE INDEX idx_alerts_time_desc ON public.alerts(time DESC);
CREATE INDEX idx_diagnostic_runs_started_desc ON public.diagnostic_runs(started_at DESC);
CREATE INDEX idx_firmware_updates_started_desc ON public.firmware_updates(started_at DESC);
CREATE INDEX idx_security_scans_started_desc ON public.security_scans(started_at DESC);

-- =====================================================
-- STATISTICS & QUERY OPTIMIZATION
-- =====================================================

-- Update table statistics for better query planning
ANALYZE public.users;
ANALYZE public.homes;
ANALYZE public.devices;
ANALYZE public.device_telemetry;
ANALYZE public.energy_usage;
ANALYZE public.failure_predictions;
ANALYZE public.automations;
ANALYZE public.alerts;
ANALYZE public.security_vulnerabilities;
ANALYZE public.user_subscriptions;

-- Increase statistics target for heavily queried columns
ALTER TABLE public.devices ALTER COLUMN home_id SET STATISTICS 1000;
ALTER TABLE public.devices ALTER COLUMN device_type SET STATISTICS 1000;
ALTER TABLE public.devices ALTER COLUMN health_score SET STATISTICS 1000;
ALTER TABLE public.device_telemetry ALTER COLUMN device_id SET STATISTICS 1000;
ALTER TABLE public.device_telemetry ALTER COLUMN metric_type SET STATISTICS 1000;

-- =====================================================
-- EXPLAIN HELPER VIEWS
-- =====================================================

-- View to monitor slow queries
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 50;

-- View to monitor index usage
CREATE VIEW unused_indexes AS
SELECT 
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexrelname NOT LIKE 'pg_toast%'
    AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- View to monitor table bloat
CREATE VIEW table_bloat AS
SELECT 
    schemaname,
    relname as tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||relname)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||relname) - pg_relation_size(schemaname||'.'||relname)) as indexes_size,
    n_live_tup,
    n_dead_tup,
    ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||relname) DESC;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON MATERIALIZED VIEW home_dashboard_summary IS 'Pre-aggregated home dashboard metrics for fast loading';
COMMENT ON MATERIALIZED VIEW device_health_summary IS 'Comprehensive device health metrics and issue summary';
COMMENT ON MATERIALIZED VIEW energy_usage_summary IS 'Daily energy consumption aggregates by home';
COMMENT ON VIEW slow_queries IS 'Monitor queries with high execution times';
COMMENT ON VIEW unused_indexes IS 'Identify unused indexes that can be dropped';
COMMENT ON VIEW table_bloat IS 'Monitor table and index bloat for maintenance';

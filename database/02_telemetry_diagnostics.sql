-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Telemetry, Diagnostics & Monitoring Tables
-- Optimized for Time-Series Data with TimescaleDB
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- TELEMETRY & SENSOR DATA (Time-Series)
-- =====================================================

-- Device Telemetry Stream (high-frequency sensor data)
CREATE TABLE public.device_telemetry (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL, -- temperature, humidity, power, motion, etc.
    value DOUBLE PRECISION,
    unit TEXT, -- celsius, fahrenheit, watts, kwh, etc.
    quality_score INTEGER, -- 0-100, data quality indicator
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create composite index for fast queries
CREATE INDEX idx_device_telemetry_device_metric 
    ON public.device_telemetry (device_id, metric_type, time DESC);
CREATE INDEX idx_device_telemetry_metric_time 
    ON public.device_telemetry (metric_type, time DESC);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('device_telemetry', 'time', if_not_exists => TRUE);
    
    -- Compression policy (compress data older than 7 days)
    ALTER TABLE device_telemetry SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id, metric_type',
        timescaledb.compress_orderby = 'time DESC'
    );
    PERFORM add_compression_policy('device_telemetry', INTERVAL '7 days');
    
    -- Retention policy (keep raw data for 1 year)
    PERFORM add_retention_policy('device_telemetry', INTERVAL '365 days');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to device_telemetry';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - device_telemetry will use standard table';
END
$$;

-- Continuous aggregates for fast analytics (TimescaleDB - optional)
DO $$
BEGIN
    CREATE MATERIALIZED VIEW device_telemetry_hourly
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 hour', time) AS hour,
        device_id,
        metric_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        STDDEV(value) as stddev_value,
        COUNT(*) as sample_count
    FROM device_telemetry
    GROUP BY hour, device_id, metric_type
    WITH NO DATA;
    
    PERFORM add_continuous_aggregate_policy('device_telemetry_hourly',
        start_offset => INTERVAL '3 hours',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour');
    
    RAISE NOTICE 'Created continuous aggregate: device_telemetry_hourly';
EXCEPTION
    WHEN undefined_function OR undefined_object THEN
        RAISE WARNING 'TimescaleDB continuous aggregates not available - skipping device_telemetry_hourly';
END
$$;

-- Daily aggregates (TimescaleDB - optional)
DO $$
BEGIN
    CREATE MATERIALIZED VIEW device_telemetry_daily
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 day', time) AS day,
        device_id,
        metric_type,
        AVG(value) as avg_value,
        MIN(value) as min_value,
        MAX(value) as max_value,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
        COUNT(*) as sample_count
    FROM device_telemetry
    GROUP BY day, device_id, metric_type
    WITH NO DATA;
    
    PERFORM add_continuous_aggregate_policy('device_telemetry_daily',
        start_offset => INTERVAL '3 days',
        end_offset => INTERVAL '1 day',
        schedule_interval => INTERVAL '1 day');
    
    RAISE NOTICE 'Created continuous aggregate: device_telemetry_daily';
EXCEPTION
    WHEN undefined_function OR undefined_object THEN
        RAISE WARNING 'TimescaleDB continuous aggregates not available - skipping device_telemetry_daily';
END
$$;

-- =====================================================
-- ENERGY MONITORING
-- =====================================================

-- Energy Usage (time-series)
CREATE TABLE public.energy_usage (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    power_watts DOUBLE PRECISION,
    energy_kwh DOUBLE PRECISION,
    voltage DOUBLE PRECISION,
    current_amps DOUBLE PRECISION,
    power_factor DOUBLE PRECISION,
    cost_estimate DECIMAL(10,4), -- Estimated cost in currency
    is_peak_hour BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_energy_usage_device ON public.energy_usage(device_id, time DESC);
CREATE INDEX idx_energy_usage_home ON public.energy_usage(home_id, time DESC);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('energy_usage', 'time', if_not_exists => TRUE);
    
    -- Energy compression and retention
    ALTER TABLE energy_usage SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id, home_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('energy_usage', INTERVAL '7 days');
    PERFORM add_retention_policy('energy_usage', INTERVAL '2 years');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to energy_usage';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - energy_usage will use standard table';
END
$$;

-- Energy aggregates by device (hourly) (TimescaleDB - optional)
DO $$
BEGIN
    CREATE MATERIALIZED VIEW energy_usage_hourly
    WITH (timescaledb.continuous) AS
    SELECT 
        time_bucket('1 hour', time) AS hour,
        device_id,
        home_id,
        AVG(power_watts) as avg_power_watts,
        MAX(power_watts) as peak_power_watts,
        SUM(energy_kwh) as total_energy_kwh,
        SUM(cost_estimate) as total_cost,
        COUNT(*) as sample_count
    FROM energy_usage
    GROUP BY hour, device_id, home_id
    WITH NO DATA;
    
    PERFORM add_continuous_aggregate_policy('energy_usage_hourly',
        start_offset => INTERVAL '3 hours',
        end_offset => INTERVAL '1 hour',
        schedule_interval => INTERVAL '1 hour');
    
    RAISE NOTICE 'Created continuous aggregate: energy_usage_hourly';
EXCEPTION
    WHEN undefined_function OR undefined_object THEN
        RAISE WARNING 'TimescaleDB continuous aggregates not available - skipping energy_usage_hourly';
END
$$;

-- =====================================================
-- DEVICE DIAGNOSTICS & HEALTH
-- =====================================================

-- Diagnostic Runs (when diagnostics are executed)
CREATE TABLE public.diagnostic_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES public.users(id),
    trigger_source TEXT DEFAULT 'manual', -- manual, scheduled, alert, self_healing
    
    -- Overall Results
    overall_status TEXT NOT NULL, -- healthy, warning, critical, failed
    health_score INTEGER, -- 0-100
    issues_found INTEGER DEFAULT 0,
    
    -- Diagnostic Modules Executed
    connectivity_check JSONB,
    firmware_check JSONB,
    sensor_check JSONB,
    automation_check JSONB,
    security_check JSONB,
    energy_check JSONB,
    
    -- Timing
    duration_ms INTEGER,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    
    -- Results
    findings JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_diagnostic_runs_device ON public.diagnostic_runs(device_id, created_at DESC);
CREATE INDEX idx_diagnostic_runs_home ON public.diagnostic_runs(home_id, created_at DESC);
CREATE INDEX idx_diagnostic_runs_status ON public.diagnostic_runs(overall_status);
CREATE INDEX idx_diagnostic_runs_started ON public.diagnostic_runs(started_at DESC);

-- Diagnostic Issues (individual issues found)
CREATE TABLE public.diagnostic_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    diagnostic_run_id UUID NOT NULL REFERENCES public.diagnostic_runs(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    
    issue_type TEXT NOT NULL, -- connectivity, firmware, sensor, automation, security, energy
    severity alert_severity NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    affected_component TEXT,
    error_code TEXT,
    
    -- Remediation
    recommended_action TEXT,
    can_auto_fix BOOLEAN DEFAULT false,
    fix_confidence_score INTEGER, -- 0-100
    
    -- Status
    status TEXT DEFAULT 'open', -- open, investigating, fixed, ignored
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_diagnostic_issues_run ON public.diagnostic_issues(diagnostic_run_id);
CREATE INDEX idx_diagnostic_issues_device ON public.diagnostic_issues(device_id, created_at DESC);
CREATE INDEX idx_diagnostic_issues_type_severity ON public.diagnostic_issues(issue_type, severity);
CREATE INDEX idx_diagnostic_issues_status ON public.diagnostic_issues(status);
CREATE INDEX idx_diagnostic_issues_auto_fix ON public.diagnostic_issues(can_auto_fix) WHERE can_auto_fix = true;

-- =====================================================
-- DEVICE ERROR LOGS
-- =====================================================

-- Error Logs (device errors, warnings, exceptions)
CREATE TABLE public.device_error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    error_level alert_severity NOT NULL,
    error_code TEXT,
    error_message TEXT,
    error_category TEXT, -- network, firmware, sensor, power, communication
    
    stack_trace TEXT,
    context JSONB DEFAULT '{}'::jsonb,
    
    -- AI Analysis
    ai_decoded_message TEXT,
    ai_suggested_fix TEXT,
    ai_confidence_score INTEGER,
    
    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_error_logs_device ON public.device_error_logs(device_id, time DESC);
CREATE INDEX idx_error_logs_home ON public.device_error_logs(home_id, time DESC);
CREATE INDEX idx_error_logs_level ON public.device_error_logs(error_level);
CREATE INDEX idx_error_logs_category ON public.device_error_logs(error_category);
CREATE INDEX idx_error_logs_unresolved ON public.device_error_logs(is_resolved) WHERE is_resolved = false;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('device_error_logs', 'time', if_not_exists => TRUE);
    
    -- Error log compression and retention
    ALTER TABLE device_error_logs SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id, error_level',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('device_error_logs', INTERVAL '30 days');
    PERFORM add_retention_policy('device_error_logs', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to device_error_logs';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - device_error_logs will use standard table';
END
$$;

-- =====================================================
-- CONNECTIVITY MONITORING
-- =====================================================

-- Network Metrics (WiFi, signal strength, latency)
CREATE TABLE public.network_metrics (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- WiFi Metrics
    signal_strength_dbm INTEGER,
    signal_quality_percent INTEGER,
    ssid TEXT,
    bssid MACADDR,
    channel INTEGER,
    frequency_mhz INTEGER,
    
    -- Network Performance
    latency_ms INTEGER,
    packet_loss_percent DECIMAL(5,2),
    bandwidth_mbps DECIMAL(10,2),
    
    -- Connection Status
    is_connected BOOLEAN DEFAULT true,
    disconnect_count INTEGER DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_network_metrics_device ON public.network_metrics(device_id, time DESC);
CREATE INDEX idx_network_metrics_home ON public.network_metrics(home_id, time DESC);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('network_metrics', 'time', if_not_exists => TRUE);
    
    -- Network compression
    ALTER TABLE network_metrics SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('network_metrics', INTERVAL '14 days');
    PERFORM add_retention_policy('network_metrics', INTERVAL '90 days');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to network_metrics';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - network_metrics will use standard table';
END
$$;

-- =====================================================
-- DEVICE HEALTH SCORE HISTORY
-- =====================================================

-- Health Score Timeline
CREATE TABLE public.device_health_history (
    time TIMESTAMPTZ NOT NULL,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    health_score INTEGER NOT NULL, -- 0-100
    
    -- Contributing Factors
    connectivity_score INTEGER,
    performance_score INTEGER,
    reliability_score INTEGER,
    security_score INTEGER,
    energy_efficiency_score INTEGER,
    
    -- Score Change
    previous_score INTEGER,
    score_change INTEGER,
    score_trend TEXT, -- improving, declining, stable
    
    -- Analysis
    factors JSONB DEFAULT '[]'::jsonb, -- What's affecting the score
    recommendations JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_health_history_device ON public.device_health_history(device_id, time DESC);
CREATE INDEX idx_health_history_score ON public.device_health_history(health_score);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('device_health_history', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE device_health_history SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('device_health_history', INTERVAL '30 days');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to device_health_history';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - device_health_history will use standard table';
END
$$;

-- =====================================================
-- FIRMWARE UPDATE TRACKING
-- =====================================================

-- Firmware Updates Log
CREATE TABLE public.firmware_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    
    -- Version Info
    from_version TEXT,
    to_version TEXT,
    
    -- Update Process
    update_status TEXT NOT NULL, -- pending, downloading, installing, completed, failed, rolled_back
    initiated_by UUID REFERENCES public.users(id),
    initiated_source TEXT, -- manual, auto, manufacturer
    
    -- Progress
    download_progress INTEGER DEFAULT 0, -- 0-100
    install_progress INTEGER DEFAULT 0, -- 0-100
    
    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Results
    success BOOLEAN,
    error_message TEXT,
    rollback_reason TEXT,
    
    -- Changelog
    release_notes TEXT,
    changelog_url TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_firmware_updates_device ON public.firmware_updates(device_id, created_at DESC);
CREATE INDEX idx_firmware_updates_status ON public.firmware_updates(update_status);
CREATE INDEX idx_firmware_updates_started ON public.firmware_updates(started_at DESC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.device_telemetry IS 'High-frequency time-series sensor data from devices';
COMMENT ON TABLE public.energy_usage IS 'Power consumption and energy usage metrics';
COMMENT ON TABLE public.diagnostic_runs IS 'Executed diagnostic scans on devices';
COMMENT ON TABLE public.diagnostic_issues IS 'Issues discovered during diagnostic runs';
COMMENT ON TABLE public.device_error_logs IS 'Device errors, warnings, and exceptions';
COMMENT ON TABLE public.network_metrics IS 'WiFi and network connectivity metrics';
COMMENT ON TABLE public.device_health_history IS 'Historical health scores and contributing factors';
COMMENT ON TABLE public.firmware_updates IS 'Firmware update history and status';

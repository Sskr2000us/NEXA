-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- AI, Predictive Analytics & Machine Learning Tables
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- PREDICTIVE FAILURE AI
-- =====================================================

-- AI/ML Models Registry
CREATE TABLE public.ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    model_type TEXT NOT NULL, -- predictive_failure, anomaly_detection, energy_optimization, etc.
    version TEXT NOT NULL,
    
    -- Model Details
    algorithm TEXT, -- random_forest, neural_network, gradient_boosting, etc.
    framework TEXT, -- tensorflow, pytorch, scikit-learn, etc.
    
    -- Training Info
    trained_on TIMESTAMPTZ,
    training_dataset_size INTEGER,
    training_duration_seconds INTEGER,
    
    -- Performance Metrics
    accuracy DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    auc_roc DECIMAL(5,4),
    
    -- Model Artifacts
    model_path TEXT, -- S3/storage path
    model_size_mb DECIMAL(10,2),
    
    -- Configuration
    hyperparameters JSONB DEFAULT '{}'::jsonb,
    feature_importance JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_production BOOLEAN DEFAULT false,
    
    -- Metadata
    description TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ml_models_type ON public.ml_models(model_type);
CREATE INDEX idx_ml_models_active ON public.ml_models(is_active, is_production);

-- Device Failure Predictions
CREATE TABLE public.failure_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    ml_model_id UUID REFERENCES public.ml_models(id),
    
    -- Prediction Type
    failure_type TEXT NOT NULL, -- compressor_failure, battery_death, offline_imminent, sensor_drift, etc.
    failure_category TEXT, -- hvac, camera, appliance, network, sensor
    
    -- Risk Assessment
    failure_probability DECIMAL(5,4) NOT NULL, -- 0.0000 to 1.0000
    risk_score INTEGER NOT NULL, -- 0-100
    confidence_level DECIMAL(5,4), -- Model confidence
    severity alert_severity NOT NULL,
    
    -- Time Predictions
    predicted_failure_date TIMESTAMPTZ,
    estimated_time_to_failure_days INTEGER,
    earliest_failure_date TIMESTAMPTZ,
    latest_failure_date TIMESTAMPTZ,
    
    -- Contributing Factors
    primary_indicators JSONB DEFAULT '[]'::jsonb, -- Top signals leading to prediction
    anomalies_detected JSONB DEFAULT '[]'::jsonb,
    historical_patterns JSONB DEFAULT '[]'::jsonb,
    
    -- Recommendations
    preventive_actions JSONB DEFAULT '[]'::jsonb,
    recommended_maintenance TEXT,
    estimated_cost_to_prevent DECIMAL(10,2),
    estimated_cost_if_failed DECIMAL(10,2),
    
    -- Tracking
    prediction_status TEXT DEFAULT 'active', -- active, monitoring, resolved, false_positive, occurred
    actual_failure_date TIMESTAMPTZ,
    was_prevented BOOLEAN,
    prevention_action_taken TEXT,
    
    -- User Interaction
    user_notified BOOLEAN DEFAULT false,
    user_acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.users(id),
    user_feedback TEXT,
    
    -- Metadata
    model_version TEXT,
    prediction_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_failure_predictions_device ON public.failure_predictions(device_id, created_at DESC);
CREATE INDEX idx_failure_predictions_home ON public.failure_predictions(home_id, created_at DESC);
CREATE INDEX idx_failure_predictions_risk ON public.failure_predictions(risk_score DESC);
CREATE INDEX idx_failure_predictions_status ON public.failure_predictions(prediction_status);
CREATE INDEX idx_failure_predictions_severity ON public.failure_predictions(severity);
CREATE INDEX idx_failure_predictions_type ON public.failure_predictions(failure_type);
CREATE INDEX idx_failure_predictions_active ON public.failure_predictions(prediction_status) 
    WHERE prediction_status = 'active';
CREATE INDEX idx_failure_predictions_unnotified ON public.failure_predictions(user_notified) 
    WHERE user_notified = false;

-- Anomaly Detection Events
CREATE TABLE public.anomaly_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    ml_model_id UUID REFERENCES public.ml_models(id),
    
    -- Anomaly Details
    anomaly_type TEXT NOT NULL, -- usage_pattern, sensor_reading, energy_consumption, connectivity, etc.
    anomaly_score DECIMAL(8,4) NOT NULL, -- How anomalous (higher = more abnormal)
    severity alert_severity NOT NULL,
    
    -- Data Context
    expected_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    deviation_percent DECIMAL(8,2),
    
    metric_name TEXT,
    metric_unit TEXT,
    
    -- Analysis
    description TEXT,
    possible_causes JSONB DEFAULT '[]'::jsonb,
    related_anomalies UUID[], -- References to other anomaly IDs
    
    -- Pattern Analysis
    is_recurring BOOLEAN DEFAULT false,
    occurrence_count INTEGER DEFAULT 1,
    first_occurrence_at TIMESTAMPTZ,
    last_occurrence_at TIMESTAMPTZ,
    
    -- Resolution
    status TEXT DEFAULT 'new', -- new, investigating, resolved, false_positive
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- AI Insights
    ai_analysis TEXT,
    ai_confidence DECIMAL(5,4),
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_anomaly_detections_device ON public.anomaly_detections(device_id, time DESC);
CREATE INDEX idx_anomaly_detections_home ON public.anomaly_detections(home_id, time DESC);
CREATE INDEX idx_anomaly_detections_type ON public.anomaly_detections(anomaly_type);
CREATE INDEX idx_anomaly_detections_severity ON public.anomaly_detections(severity);
CREATE INDEX idx_anomaly_detections_score ON public.anomaly_detections(anomaly_score DESC);
CREATE INDEX idx_anomaly_detections_status ON public.anomaly_detections(status);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('anomaly_detections', 'time', if_not_exists => TRUE);
    
    -- Compression and retention
    ALTER TABLE anomaly_detections SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id, anomaly_type',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('anomaly_detections', INTERVAL '30 days');
    PERFORM add_retention_policy('anomaly_detections', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to anomaly_detections';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - anomaly_detections will use standard table';
END
$$;

-- =====================================================
-- DEVICE USAGE PATTERNS & BEHAVIOR LEARNING
-- =====================================================

-- Usage Patterns (learned behavior)
CREATE TABLE public.device_usage_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Pattern Identification
    pattern_type TEXT NOT NULL, -- daily_schedule, weekly_routine, seasonal, event_based
    pattern_name TEXT,
    
    -- Time-based Patterns
    day_of_week INTEGER[], -- 0-6 (Sunday-Saturday)
    time_of_day_start TIME,
    time_of_day_end TIME,
    month_of_year INTEGER[], -- 1-12
    
    -- Usage Metrics
    average_usage_duration_minutes INTEGER,
    usage_frequency_per_week DECIMAL(5,2),
    typical_state JSONB, -- Typical device state during this pattern
    
    -- Statistical Data
    confidence_score DECIMAL(5,4), -- How confident we are in this pattern
    sample_size INTEGER, -- Number of observations
    first_observed_at TIMESTAMPTZ,
    last_observed_at TIMESTAMPTZ,
    
    -- Context
    conditions JSONB DEFAULT '{}'::jsonb, -- Weather, presence, other device states
    related_devices UUID[], -- Devices that are typically used together
    
    -- Pattern Quality
    is_active BOOLEAN DEFAULT true,
    reliability_score INTEGER, -- 0-100
    last_deviation_at TIMESTAMPTZ,
    deviation_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_usage_patterns_device ON public.device_usage_patterns(device_id);
CREATE INDEX idx_usage_patterns_home ON public.device_usage_patterns(home_id);
CREATE INDEX idx_usage_patterns_type ON public.device_usage_patterns(pattern_type);
CREATE INDEX idx_usage_patterns_active ON public.device_usage_patterns(is_active);

-- =====================================================
-- AI INSIGHTS & RECOMMENDATIONS
-- =====================================================

-- AI-Generated Insights
CREATE TABLE public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE, -- NULL for home-level insights
    
    -- Insight Details
    insight_type TEXT NOT NULL, -- energy_saving, security, automation, maintenance, cost_reduction
    insight_category TEXT, -- efficiency, safety, comfort, cost
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Impact Analysis
    priority TEXT DEFAULT 'medium', -- low, medium, high, critical
    potential_savings_annual DECIMAL(10,2), -- In currency
    potential_energy_savings_kwh DECIMAL(10,2),
    roi_estimate_months INTEGER,
    
    -- Recommendation
    recommended_action TEXT,
    action_complexity TEXT, -- easy, moderate, complex
    estimated_time_minutes INTEGER,
    requires_purchase BOOLEAN DEFAULT false,
    estimated_cost DECIMAL(10,2),
    
    -- AI Details
    ml_model_id UUID REFERENCES public.ml_models(id),
    confidence_score DECIMAL(5,4),
    data_sources JSONB DEFAULT '[]'::jsonb, -- What data was analyzed
    
    -- User Interaction
    status TEXT DEFAULT 'new', -- new, viewed, dismissed, implementing, implemented, not_applicable
    user_feedback TEXT,
    user_rating INTEGER, -- 1-5 stars
    
    viewed_at TIMESTAMPTZ,
    viewed_by UUID REFERENCES public.users(id),
    actioned_at TIMESTAMPTZ,
    actioned_by UUID REFERENCES public.users(id),
    
    -- Tracking
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ai_insights_home ON public.ai_insights(home_id, created_at DESC);
CREATE INDEX idx_ai_insights_device ON public.ai_insights(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_ai_insights_type ON public.ai_insights(insight_type);
CREATE INDEX idx_ai_insights_status ON public.ai_insights(status);
CREATE INDEX idx_ai_insights_priority ON public.ai_insights(priority);
CREATE INDEX idx_ai_insights_active_new ON public.ai_insights(is_active, status) 
    WHERE is_active = true AND status = 'new';

-- =====================================================
-- DEVICE SIMILARITY & COMPARISON
-- =====================================================

-- Device Benchmarking (compare against similar devices)
CREATE TABLE public.device_benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    device_model_id UUID REFERENCES public.device_models(id),
    
    -- Benchmark Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Performance Metrics (vs. similar devices)
    reliability_percentile INTEGER, -- 0-100 (higher is better)
    energy_efficiency_percentile INTEGER,
    uptime_percentile INTEGER,
    response_time_percentile INTEGER,
    
    -- Absolute Metrics
    uptime_percent DECIMAL(5,2),
    average_response_time_ms INTEGER,
    error_rate DECIMAL(8,4),
    energy_usage_kwh DECIMAL(10,2),
    
    -- Comparison Data
    peer_group_size INTEGER, -- Number of similar devices compared against
    peer_group_criteria JSONB, -- How peers were selected
    
    -- Rankings
    overall_rank INTEGER,
    total_devices_compared INTEGER,
    
    -- Insights
    strengths TEXT[],
    weaknesses TEXT[],
    improvement_suggestions JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_device_benchmarks_device ON public.device_benchmarks(device_id, period_start DESC);
CREATE INDEX idx_device_benchmarks_model ON public.device_benchmarks(device_model_id);

-- =====================================================
-- MODEL PREDICTIONS LOG (for ML monitoring)
-- =====================================================

-- Track all model predictions for monitoring and feedback loop
CREATE TABLE public.ml_predictions_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ml_model_id UUID NOT NULL REFERENCES public.ml_models(id),
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Prediction Details
    prediction_type TEXT NOT NULL,
    input_features JSONB NOT NULL,
    output_prediction JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    
    -- Actual Outcome (for model evaluation)
    actual_outcome JSONB,
    outcome_recorded_at TIMESTAMPTZ,
    prediction_correct BOOLEAN,
    
    -- Performance
    inference_time_ms INTEGER,
    model_version TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ml_predictions_model ON public.ml_predictions_log(ml_model_id, time DESC);
CREATE INDEX idx_ml_predictions_device ON public.ml_predictions_log(device_id) WHERE device_id IS NOT NULL;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('ml_predictions_log', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE ml_predictions_log SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'ml_model_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('ml_predictions_log', INTERVAL '60 days');
    PERFORM add_retention_policy('ml_predictions_log', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to ml_predictions_log';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - ml_predictions_log will use standard table';
END
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.ml_models IS 'Registry of AI/ML models used for predictions and analysis';
COMMENT ON TABLE public.failure_predictions IS 'Predictive failure analysis and risk assessments for devices';
COMMENT ON TABLE public.anomaly_detections IS 'AI-detected anomalies in device behavior and metrics';
COMMENT ON TABLE public.device_usage_patterns IS 'Learned usage patterns and behavioral profiles';
COMMENT ON TABLE public.ai_insights IS 'AI-generated insights and recommendations for users';
COMMENT ON TABLE public.device_benchmarks IS 'Performance benchmarking against similar devices';
COMMENT ON TABLE public.ml_predictions_log IS 'Audit log of all ML model predictions for monitoring';

-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Automation, Self-Healing & Scenes Tables
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- AUTOMATIONS & ROUTINES
-- =====================================================

-- Automations (user-created and system-created)
CREATE TABLE public.automations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),
    
    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    
    -- Automation Type
    automation_type TEXT NOT NULL, -- scheduled, trigger_based, condition_based, ai_suggested
    source TEXT DEFAULT 'user', -- user, system, ai, ecosystem
    
    -- Trigger Configuration
    triggers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of trigger definitions
    conditions JSONB DEFAULT '[]'::jsonb, -- Conditions that must be met
    actions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Actions to execute
    
    -- Execution Settings
    execution_mode TEXT DEFAULT 'sequential', -- sequential, parallel
    delay_between_actions_ms INTEGER DEFAULT 0,
    retry_on_failure BOOLEAN DEFAULT false,
    max_retries INTEGER DEFAULT 3,
    
    -- Schedule (for scheduled automations)
    schedule_type TEXT, -- once, daily, weekly, custom, cron
    schedule_config JSONB,
    timezone TEXT DEFAULT 'UTC',
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    pause_until TIMESTAMPTZ,
    
    -- Health Monitoring
    health_status TEXT DEFAULT 'healthy', -- healthy, degraded, failing, broken
    last_health_check_at TIMESTAMPTZ,
    failure_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    
    -- Execution Stats
    last_executed_at TIMESTAMPTZ,
    last_execution_status TEXT, -- success, failed, partial
    last_execution_duration_ms INTEGER,
    total_executions INTEGER DEFAULT 0,
    
    -- AI/Smart Features
    ai_optimized BOOLEAN DEFAULT false,
    learning_enabled BOOLEAN DEFAULT false,
    context_aware BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_automations_home ON public.automations(home_id);
CREATE INDEX idx_automations_type ON public.automations(automation_type);
CREATE INDEX idx_automations_enabled ON public.automations(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_automations_health ON public.automations(health_status);
CREATE INDEX idx_automations_created_by ON public.automations(created_by);

-- Automation Execution History
CREATE TABLE public.automation_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Execution Context
    triggered_by TEXT, -- schedule, device_event, manual, ecosystem
    trigger_data JSONB,
    
    -- Execution Flow
    status TEXT NOT NULL, -- success, failed, partial, cancelled, timeout
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Actions Executed
    actions_total INTEGER,
    actions_succeeded INTEGER,
    actions_failed INTEGER,
    action_results JSONB DEFAULT '[]'::jsonb,
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    retry_attempt INTEGER DEFAULT 0,
    
    -- Context
    device_states_before JSONB,
    device_states_after JSONB,
    environment_context JSONB, -- weather, time, presence, etc.
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_automation_executions_automation ON public.automation_executions(automation_id, time DESC);
CREATE INDEX idx_automation_executions_home ON public.automation_executions(home_id, time DESC);
CREATE INDEX idx_automation_executions_status ON public.automation_executions(status);
CREATE INDEX idx_automation_executions_failed ON public.automation_executions(status) WHERE status = 'failed';

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('automation_executions', 'time', if_not_exists => TRUE);
    
    -- Compression and retention
    ALTER TABLE automation_executions SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'automation_id, status',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('automation_executions', INTERVAL '30 days');
    PERFORM add_retention_policy('automation_executions', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to automation_executions';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - automation_executions will use standard table';
END
$$;

-- =====================================================
-- SCENES
-- =====================================================

-- Scenes (pre-configured device states)
CREATE TABLE public.scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.users(id),
    
    -- Scene Info
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    
    -- Scene Type
    scene_type TEXT DEFAULT 'custom', -- custom, preset, time_based, ai_suggested
    category TEXT, -- morning, evening, away, entertaining, sleep, etc.
    
    -- Device States
    device_states JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {device_id, desired_state}
    transition_duration_ms INTEGER DEFAULT 0, -- Fade time for lights, etc.
    
    -- Activation
    is_favorite BOOLEAN DEFAULT false,
    activation_count INTEGER DEFAULT 0,
    last_activated_at TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_synced BOOLEAN DEFAULT true, -- Synced across ecosystems
    sync_status JSONB DEFAULT '{}'::jsonb,
    
    -- Smart Features
    adaptive_brightness BOOLEAN DEFAULT false,
    context_aware BOOLEAN DEFAULT false,
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_scenes_home ON public.scenes(home_id);
CREATE INDEX idx_scenes_room ON public.scenes(room_id) WHERE room_id IS NOT NULL;
CREATE INDEX idx_scenes_type ON public.scenes(scene_type);
CREATE INDEX idx_scenes_favorite ON public.scenes(is_favorite) WHERE is_favorite = true;
CREATE INDEX idx_scenes_created_by ON public.scenes(created_by);

-- Scene Activation History
CREATE TABLE public.scene_activations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Activation Details
    activated_by UUID REFERENCES public.users(id),
    activation_source TEXT, -- manual, automation, voice, schedule
    
    -- Execution
    status TEXT NOT NULL, -- success, failed, partial
    devices_targeted INTEGER,
    devices_succeeded INTEGER,
    devices_failed INTEGER,
    execution_duration_ms INTEGER,
    
    -- Results
    failed_devices UUID[], -- Array of device IDs that failed
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_scene_activations_scene ON public.scene_activations(scene_id, time DESC);
CREATE INDEX idx_scene_activations_home ON public.scene_activations(home_id, time DESC);
CREATE INDEX idx_scene_activations_user ON public.scene_activations(activated_by);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('scene_activations', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE scene_activations SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'scene_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('scene_activations', INTERVAL '90 days');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to scene_activations';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - scene_activations will use standard table';
END
$$;

-- =====================================================
-- SELF-HEALING ENGINE
-- =====================================================

-- Self-Healing Actions Registry (available healing actions)
CREATE TABLE public.self_healing_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    action_type TEXT NOT NULL, -- reboot, repair, reconfigure, reset, optimize
    
    -- Action Details
    description TEXT,
    category TEXT, -- connectivity, firmware, automation, performance
    
    -- Applicability
    applicable_device_types device_type[],
    applicable_protocols protocol_type[],
    applicable_brands UUID[], -- NULL means all brands
    
    -- Configuration
    action_config JSONB DEFAULT '{}'::jsonb,
    parameters_schema JSONB, -- JSON schema for parameters
    
    -- Constraints
    requires_user_approval BOOLEAN DEFAULT false,
    max_retry_attempts INTEGER DEFAULT 3,
    cooldown_period_minutes INTEGER DEFAULT 60,
    risk_level TEXT DEFAULT 'low', -- low, medium, high
    
    -- Success Metrics
    average_success_rate DECIMAL(5,4),
    total_executions INTEGER DEFAULT 0,
    total_successes INTEGER DEFAULT 0,
    
    -- Metadata
    documentation_url TEXT,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_self_healing_actions_type ON public.self_healing_actions(action_type);
CREATE INDEX idx_self_healing_actions_category ON public.self_healing_actions(category);
CREATE INDEX idx_self_healing_actions_active ON public.self_healing_actions(is_active);

-- Self-Healing Execution Log
CREATE TABLE public.self_healing_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    action_id UUID NOT NULL REFERENCES public.self_healing_actions(id),
    
    -- Trigger Information
    triggered_by TEXT NOT NULL, -- diagnostic, prediction, alert, manual, scheduled
    trigger_source_id UUID, -- ID of diagnostic run, prediction, alert, etc.
    
    -- Issue Context
    issue_detected TEXT NOT NULL,
    issue_severity alert_severity,
    device_state_before JSONB,
    
    -- Execution Details
    status action_status NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    
    -- Configuration
    action_parameters JSONB DEFAULT '{}'::jsonb,
    retry_attempt INTEGER DEFAULT 0,
    
    -- Results
    success BOOLEAN,
    device_state_after JSONB,
    error_message TEXT,
    error_details JSONB,
    
    -- Verification
    issue_resolved BOOLEAN,
    verified_at TIMESTAMPTZ,
    verification_method TEXT,
    
    -- User Interaction
    required_user_approval BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    user_feedback TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_action TEXT,
    follow_up_scheduled_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_self_healing_executions_device ON public.self_healing_executions(device_id, time DESC);
CREATE INDEX idx_self_healing_executions_home ON public.self_healing_executions(home_id, time DESC);
CREATE INDEX idx_self_healing_executions_action ON public.self_healing_executions(action_id, time DESC);
CREATE INDEX idx_self_healing_executions_status ON public.self_healing_executions(status);
CREATE INDEX idx_self_healing_executions_trigger ON public.self_healing_executions(triggered_by);
CREATE INDEX idx_self_healing_executions_pending_approval ON public.self_healing_executions(required_user_approval) 
    WHERE required_user_approval = true AND approved_at IS NULL;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('self_healing_executions', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE self_healing_executions SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'device_id, action_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('self_healing_executions', INTERVAL '30 days');
    PERFORM add_retention_policy('self_healing_executions', INTERVAL '2 years');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to self_healing_executions';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - self_healing_executions will use standard table';
END
$$;

-- =====================================================
-- AUTOMATION HEALTH MONITORING
-- =====================================================

-- Automation Health Checks
CREATE TABLE public.automation_health_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Health Assessment
    health_status TEXT NOT NULL, -- healthy, degraded, failing, broken
    health_score INTEGER, -- 0-100
    
    -- Checks Performed
    trigger_valid BOOLEAN,
    conditions_valid BOOLEAN,
    actions_valid BOOLEAN,
    devices_accessible BOOLEAN,
    
    -- Issues Found
    issues_found JSONB DEFAULT '[]'::jsonb,
    warnings JSONB DEFAULT '[]'::jsonb,
    
    -- Recommendations
    recommended_fixes JSONB DEFAULT '[]'::jsonb,
    can_auto_repair BOOLEAN DEFAULT false,
    auto_repair_attempted BOOLEAN DEFAULT false,
    auto_repair_success BOOLEAN,
    
    -- Context
    devices_offline INTEGER DEFAULT 0,
    deprecated_features BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_automation_health_automation ON public.automation_health_checks(automation_id, time DESC);
CREATE INDEX idx_automation_health_status ON public.automation_health_checks(health_status);
CREATE INDEX idx_automation_health_broken ON public.automation_health_checks(health_status) 
    WHERE health_status IN ('failing', 'broken');

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('automation_health_checks', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE automation_health_checks SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'automation_id',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('automation_health_checks', INTERVAL '60 days');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to automation_health_checks';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - automation_health_checks will use standard table';
END
$$;

-- =====================================================
-- CROSS-ECOSYSTEM SYNC
-- =====================================================

-- Ecosystem Sync Status (track sync state across platforms)
CREATE TABLE public.ecosystem_sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    ecosystem_id UUID NOT NULL REFERENCES public.ecosystems(id) ON DELETE CASCADE,
    
    entity_type TEXT NOT NULL, -- automation, scene, device_group
    entity_id UUID NOT NULL,
    
    -- Sync Status
    sync_status TEXT NOT NULL, -- synced, pending, failed, conflict, unsupported
    last_synced_at TIMESTAMPTZ,
    last_sync_attempt_at TIMESTAMPTZ,
    
    -- External Reference
    external_entity_id TEXT, -- ID in the external ecosystem
    external_url TEXT,
    
    -- Sync Details
    sync_direction TEXT, -- nexa_to_ecosystem, ecosystem_to_nexa, bidirectional
    conflict_resolution TEXT, -- nexa_wins, ecosystem_wins, manual
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    
    -- Version Control
    local_version INTEGER DEFAULT 1,
    remote_version INTEGER,
    last_modified_locally_at TIMESTAMPTZ,
    last_modified_remotely_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(home_id, ecosystem_id, entity_type, entity_id)
);

CREATE INDEX idx_ecosystem_sync_home ON public.ecosystem_sync_status(home_id);
CREATE INDEX idx_ecosystem_sync_ecosystem ON public.ecosystem_sync_status(ecosystem_id);
CREATE INDEX idx_ecosystem_sync_entity ON public.ecosystem_sync_status(entity_type, entity_id);
CREATE INDEX idx_ecosystem_sync_status ON public.ecosystem_sync_status(sync_status);
CREATE INDEX idx_ecosystem_sync_failed ON public.ecosystem_sync_status(sync_status) 
    WHERE sync_status IN ('failed', 'conflict');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.automations IS 'User and system-created automation rules and routines';
COMMENT ON TABLE public.automation_executions IS 'Execution history of automation runs';
COMMENT ON TABLE public.scenes IS 'Pre-configured device state collections';
COMMENT ON TABLE public.scene_activations IS 'History of scene activations';
COMMENT ON TABLE public.self_healing_actions IS 'Registry of available self-healing actions';
COMMENT ON TABLE public.self_healing_executions IS 'Log of executed self-healing actions';
COMMENT ON TABLE public.automation_health_checks IS 'Health monitoring for automations';
COMMENT ON TABLE public.ecosystem_sync_status IS 'Cross-platform synchronization status';

-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Security, Alerts & Notification Tables
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SECURITY SCANNING & VULNERABILITIES
-- =====================================================

-- Security Scans
CREATE TABLE public.security_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    triggered_by UUID REFERENCES public.users(id),
    
    -- Scan Configuration
    scan_type TEXT NOT NULL, -- full, quick, targeted, scheduled
    scan_scope TEXT NOT NULL, -- all_devices, network, specific_devices
    target_devices UUID[], -- NULL for all devices
    
    -- Scan Status
    status TEXT NOT NULL, -- pending, running, completed, failed, cancelled
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    
    -- Scan Results
    devices_scanned INTEGER DEFAULT 0,
    vulnerabilities_found INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    info_issues INTEGER DEFAULT 0,
    
    -- Overall Assessment
    overall_risk_score INTEGER, -- 0-100 (higher is more risky)
    security_grade TEXT, -- A+, A, B, C, D, F
    
    -- Scan Modules Executed
    unauthorized_access_check BOOLEAN DEFAULT true,
    weak_password_check BOOLEAN DEFAULT true,
    open_ports_check BOOLEAN DEFAULT true,
    firmware_check BOOLEAN DEFAULT true,
    network_intrusion_check BOOLEAN DEFAULT true,
    device_exposure_check BOOLEAN DEFAULT true,
    
    -- Detailed Results
    findings JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    
    -- Error Handling
    error_message TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_security_scans_home ON public.security_scans(home_id, created_at DESC);
CREATE INDEX idx_security_scans_status ON public.security_scans(status);
CREATE INDEX idx_security_scans_started ON public.security_scans(started_at DESC);
CREATE INDEX idx_security_scans_risk ON public.security_scans(overall_risk_score DESC);

-- Security Vulnerabilities
CREATE TABLE public.security_vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    security_scan_id UUID REFERENCES public.security_scans(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    
    -- Vulnerability Details
    vulnerability_type TEXT NOT NULL, -- weak_password, open_port, outdated_firmware, unauthorized_access, exposed_device, etc.
    severity alert_severity NOT NULL,
    cvss_score DECIMAL(3,1), -- Common Vulnerability Scoring System (0.0-10.0)
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Technical Details
    cve_id TEXT, -- CVE identifier if applicable
    affected_component TEXT,
    attack_vector TEXT, -- network, adjacent, local, physical
    complexity TEXT, -- low, high
    
    -- Impact Assessment
    confidentiality_impact TEXT, -- none, low, high
    integrity_impact TEXT,
    availability_impact TEXT,
    
    -- Exposure
    publicly_accessible BOOLEAN DEFAULT false,
    exploitable BOOLEAN DEFAULT false,
    known_exploits_exist BOOLEAN DEFAULT false,
    
    -- Remediation
    remediation_steps TEXT,
    remediation_complexity TEXT, -- easy, moderate, complex
    estimated_fix_time_minutes INTEGER,
    requires_user_action BOOLEAN DEFAULT true,
    can_auto_fix BOOLEAN DEFAULT false,
    
    -- Patch Information
    patch_available BOOLEAN DEFAULT false,
    patch_version TEXT,
    patch_url TEXT,
    
    -- Status
    status TEXT DEFAULT 'open', -- open, acknowledged, in_progress, resolved, false_positive, risk_accepted
    detected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    resolution_notes TEXT,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT false,
    first_detected_at TIMESTAMPTZ,
    recurrence_count INTEGER DEFAULT 1,
    
    -- References
    external_references TEXT[],
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_vulnerabilities_scan ON public.security_vulnerabilities(security_scan_id);
CREATE INDEX idx_vulnerabilities_home ON public.security_vulnerabilities(home_id, created_at DESC);
CREATE INDEX idx_vulnerabilities_device ON public.security_vulnerabilities(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_vulnerabilities_type ON public.security_vulnerabilities(vulnerability_type);
CREATE INDEX idx_vulnerabilities_severity ON public.security_vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_status ON public.security_vulnerabilities(status);
CREATE INDEX idx_vulnerabilities_open ON public.security_vulnerabilities(status) WHERE status = 'open';
CREATE INDEX idx_vulnerabilities_cvss ON public.security_vulnerabilities(cvss_score DESC NULLS LAST);
CREATE INDEX idx_vulnerabilities_auto_fix ON public.security_vulnerabilities(can_auto_fix) WHERE can_auto_fix = true;

-- =====================================================
-- SECURITY INCIDENTS & THREATS
-- =====================================================

-- Security Incidents (detected threats and attacks)
CREATE TABLE public.security_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    
    -- Incident Details
    incident_type TEXT NOT NULL, -- unauthorized_access, brute_force, malware, ddos, suspicious_activity, data_breach
    severity alert_severity NOT NULL,
    confidence_score DECIMAL(5,4), -- Detection confidence
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Attack Details
    attack_source_ip INET,
    attack_source_country TEXT,
    attack_vector TEXT,
    attack_method TEXT,
    
    -- Detection
    detection_method TEXT, -- ids, behavior_analysis, signature, anomaly_detection
    detection_source TEXT, -- nexa, router, firewall, device
    
    -- Impact
    devices_affected UUID[],
    data_accessed BOOLEAN DEFAULT false,
    data_modified BOOLEAN DEFAULT false,
    data_exfiltrated BOOLEAN DEFAULT false,
    service_disrupted BOOLEAN DEFAULT false,
    
    -- Response
    status TEXT DEFAULT 'detected', -- detected, investigating, contained, resolved, false_positive
    auto_response_taken BOOLEAN DEFAULT false,
    response_actions JSONB DEFAULT '[]'::jsonb,
    
    -- Timeline
    detected_at TIMESTAMPTZ NOT NULL,
    contained_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    
    -- Investigation
    investigated_by UUID REFERENCES public.users(id),
    investigation_notes TEXT,
    root_cause TEXT,
    
    -- Evidence
    evidence JSONB DEFAULT '[]'::jsonb,
    logs JSONB DEFAULT '[]'::jsonb,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_security_incidents_home ON public.security_incidents(home_id, time DESC);
CREATE INDEX idx_security_incidents_device ON public.security_incidents(device_id) WHERE device_id IS NOT NULL;
CREATE INDEX idx_security_incidents_type ON public.security_incidents(incident_type);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_source_ip ON public.security_incidents(attack_source_ip) WHERE attack_source_ip IS NOT NULL;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('security_incidents', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE security_incidents SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'home_id, incident_type',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('security_incidents', INTERVAL '90 days');
    PERFORM add_retention_policy('security_incidents', INTERVAL '3 years');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to security_incidents';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - security_incidents will use standard table';
END
$$;

-- =====================================================
-- NETWORK SECURITY
-- =====================================================

-- Network Access Control List
CREATE TABLE public.network_access_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Rule Details
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- allow, deny, alert
    priority INTEGER DEFAULT 100,
    
    -- Source
    source_ip INET,
    source_ip_range CIDR,
    source_country TEXT[],
    source_mac MACADDR[],
    
    -- Destination
    destination_device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    destination_port INTEGER[],
    
    -- Protocol
    protocol TEXT[], -- tcp, udp, icmp, etc.
    
    -- Conditions
    time_restrictions JSONB, -- Time-based rules
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMPTZ,
    
    -- Metadata
    created_by UUID REFERENCES public.users(id),
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_network_rules_home ON public.network_access_rules(home_id);
CREATE INDEX idx_network_rules_device ON public.network_access_rules(destination_device_id);
CREATE INDEX idx_network_rules_enabled ON public.network_access_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_network_rules_priority ON public.network_access_rules(priority);

-- =====================================================
-- ALERTS & NOTIFICATIONS
-- =====================================================

-- Alert Rules (user-configured alert conditions)
CREATE TABLE public.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id),
    
    -- Rule Configuration
    rule_name TEXT NOT NULL,
    rule_type TEXT NOT NULL, -- device_state, threshold, anomaly, security, predictive
    description TEXT,
    
    -- Conditions
    conditions JSONB NOT NULL, -- Alert trigger conditions
    threshold_config JSONB,
    
    -- Target
    target_type TEXT, -- device, home, room, group
    target_id UUID, -- device_id, room_id, etc.
    
    -- Alert Settings
    severity alert_severity DEFAULT 'warning',
    priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
    
    -- Notification Channels
    notification_channels TEXT[] DEFAULT ARRAY['push']::TEXT[], -- push, email, sms, webhook
    
    -- Frequency Control
    cooldown_minutes INTEGER DEFAULT 15, -- Min time between repeat alerts
    max_alerts_per_day INTEGER,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    -- Status
    is_enabled BOOLEAN DEFAULT true,
    alert_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alert_rules_home ON public.alert_rules(home_id);
CREATE INDEX idx_alert_rules_type ON public.alert_rules(rule_type);
CREATE INDEX idx_alert_rules_enabled ON public.alert_rules(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_alert_rules_target ON public.alert_rules(target_type, target_id);

-- Alerts (generated alerts)
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
    
    -- Alert Details
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL,
    priority TEXT DEFAULT 'normal',
    
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Source
    source_device_id UUID REFERENCES public.devices(id) ON DELETE CASCADE,
    source_type TEXT, -- device, system, security, automation, prediction
    source_id UUID, -- Reference to source entity
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb,
    device_state JSONB,
    
    -- Actions
    actionable BOOLEAN DEFAULT false,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    action_taken TEXT,
    action_taken_at TIMESTAMPTZ,
    action_taken_by UUID REFERENCES public.users(id),
    
    -- Status
    status TEXT DEFAULT 'active', -- active, acknowledged, resolved, dismissed
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.users(id),
    dismissed_at TIMESTAMPTZ,
    dismissed_by UUID REFERENCES public.users(id),
    
    -- Notification Status
    notification_sent BOOLEAN DEFAULT false,
    notification_channels_used TEXT[],
    notification_sent_at TIMESTAMPTZ,
    notification_failed BOOLEAN DEFAULT false,
    notification_error TEXT,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_alerts_home ON public.alerts(home_id, time DESC);
CREATE INDEX idx_alerts_rule ON public.alerts(alert_rule_id);
CREATE INDEX idx_alerts_device ON public.alerts(source_device_id) WHERE source_device_id IS NOT NULL;
CREATE INDEX idx_alerts_type ON public.alerts(alert_type);
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_status ON public.alerts(status);
CREATE INDEX idx_alerts_active ON public.alerts(status) WHERE status = 'active';
CREATE INDEX idx_alerts_unacknowledged ON public.alerts(acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX idx_alerts_actionable ON public.alerts(actionable) WHERE actionable = true;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('alerts', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE alerts SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'home_id, alert_type, severity',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('alerts', INTERVAL '90 days');
    PERFORM add_retention_policy('alerts', INTERVAL '2 years');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to alerts';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - alerts will use standard table';
END
$$;

-- =====================================================
-- USER NOTIFICATIONS
-- =====================================================

-- Notification Templates
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name TEXT UNIQUE NOT NULL,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL, -- push, email, sms, webhook
    
    -- Template Content
    subject_template TEXT,
    body_template TEXT,
    html_body_template TEXT,
    
    -- Localization
    language TEXT DEFAULT 'en',
    
    -- Metadata
    variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notification_templates_type ON public.notification_templates(notification_type);
CREATE INDEX idx_notification_templates_channel ON public.notification_templates(channel);

-- User Notifications (sent notifications)
CREATE TABLE public.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE,
    
    -- Notification Details
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL, -- push, email, sms, webhook, in_app
    template_id UUID REFERENCES public.notification_templates(id),
    
    -- Content
    subject TEXT,
    body TEXT NOT NULL,
    
    -- Related Entities
    related_alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
    related_device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    
    -- Delivery
    status TEXT DEFAULT 'pending', -- pending, sent, delivered, failed, read
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Channel-specific data
    push_token TEXT,
    email_message_id TEXT,
    sms_message_id TEXT,
    webhook_url TEXT,
    webhook_response TEXT,
    
    -- User Interaction
    clicked BOOLEAN DEFAULT false,
    clicked_at TIMESTAMPTZ,
    action_taken TEXT,
    
    -- Priority
    priority TEXT DEFAULT 'normal',
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_notifications_user ON public.user_notifications(user_id, time DESC);
CREATE INDEX idx_user_notifications_home ON public.user_notifications(home_id, time DESC);
CREATE INDEX idx_user_notifications_alert ON public.user_notifications(related_alert_id) WHERE related_alert_id IS NOT NULL;
CREATE INDEX idx_user_notifications_status ON public.user_notifications(status);
CREATE INDEX idx_user_notifications_unread ON public.user_notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_user_notifications_pending ON public.user_notifications(status) WHERE status = 'pending';

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('user_notifications', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE user_notifications SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'user_id, channel',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('user_notifications', INTERVAL '30 days');
    PERFORM add_retention_policy('user_notifications', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to user_notifications';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - user_notifications will use standard table';
END
$$;

-- =====================================================
-- USER NOTIFICATION PREFERENCES
-- =====================================================

-- User Notification Preferences
CREATE TABLE public.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    home_id UUID REFERENCES public.homes(id) ON DELETE CASCADE, -- NULL for global preferences
    
    -- Channel Preferences
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    
    -- Notification Types
    device_alerts_enabled BOOLEAN DEFAULT true,
    security_alerts_enabled BOOLEAN DEFAULT true,
    energy_alerts_enabled BOOLEAN DEFAULT true,
    automation_alerts_enabled BOOLEAN DEFAULT true,
    predictive_alerts_enabled BOOLEAN DEFAULT true,
    system_alerts_enabled BOOLEAN DEFAULT true,
    marketing_enabled BOOLEAN DEFAULT false,
    
    -- Frequency
    digest_enabled BOOLEAN DEFAULT false,
    digest_frequency TEXT DEFAULT 'daily', -- daily, weekly
    digest_time TIME DEFAULT '09:00',
    
    -- Quiet Hours
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '07:00',
    
    -- Critical Override
    critical_override_quiet_hours BOOLEAN DEFAULT true,
    
    -- Severity Thresholds
    min_push_severity alert_severity DEFAULT 'warning',
    min_email_severity alert_severity DEFAULT 'info',
    min_sms_severity alert_severity DEFAULT 'critical',
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    UNIQUE(user_id, home_id)
);

CREATE INDEX idx_notification_prefs_user ON public.user_notification_preferences(user_id);
CREATE INDEX idx_notification_prefs_home ON public.user_notification_preferences(home_id);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.security_scans IS 'Security scanning runs and assessments';
COMMENT ON TABLE public.security_vulnerabilities IS 'Detected security vulnerabilities and weaknesses';
COMMENT ON TABLE public.security_incidents IS 'Security incidents, threats, and attacks';
COMMENT ON TABLE public.network_access_rules IS 'Network access control rules';
COMMENT ON TABLE public.alert_rules IS 'User-configured alert rule definitions';
COMMENT ON TABLE public.alerts IS 'Generated alerts and notifications';
COMMENT ON TABLE public.notification_templates IS 'Notification message templates';
COMMENT ON TABLE public.user_notifications IS 'Sent notifications to users';
COMMENT ON TABLE public.user_notification_preferences IS 'User notification channel and frequency preferences';

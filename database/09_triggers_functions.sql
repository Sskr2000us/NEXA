-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Database Triggers & Functions
-- Audit Trails, Automation & Business Logic
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- =====================================================

-- Generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_homes_updated_at BEFORE UPDATE ON public.homes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_home_members_updated_at BEFORE UPDATE ON public.home_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON public.rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON public.brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_device_models_updated_at BEFORE UPDATE ON public.device_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ecosystems_updated_at BEFORE UPDATE ON public.ecosystems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON public.devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_automations_updated_at BEFORE UPDATE ON public.automations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON public.scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ml_models_updated_at BEFORE UPDATE ON public.ml_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DEVICE STATE CHANGE TRACKING
-- =====================================================

-- Track device state changes automatically
CREATE OR REPLACE FUNCTION log_device_state_change()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
    state_snapshot JSONB;
BEGIN
    -- Only log if meaningful fields changed
    IF (OLD.connectivity_status IS DISTINCT FROM NEW.connectivity_status OR
        OLD.is_online IS DISTINCT FROM NEW.is_online OR
        OLD.battery_level IS DISTINCT FROM NEW.battery_level OR
        OLD.health_score IS DISTINCT FROM NEW.health_score OR
        OLD.firmware_version IS DISTINCT FROM NEW.firmware_version OR
        OLD.settings IS DISTINCT FROM NEW.settings) THEN
        
        -- Determine which fields changed
        changed_fields := ARRAY[]::TEXT[];
        
        IF OLD.connectivity_status IS DISTINCT FROM NEW.connectivity_status THEN
            changed_fields := array_append(changed_fields, 'connectivity_status');
        END IF;
        
        IF OLD.is_online IS DISTINCT FROM NEW.is_online THEN
            changed_fields := array_append(changed_fields, 'is_online');
        END IF;
        
        IF OLD.battery_level IS DISTINCT FROM NEW.battery_level THEN
            changed_fields := array_append(changed_fields, 'battery_level');
        END IF;
        
        IF OLD.health_score IS DISTINCT FROM NEW.health_score THEN
            changed_fields := array_append(changed_fields, 'health_score');
        END IF;
        
        IF OLD.firmware_version IS DISTINCT FROM NEW.firmware_version THEN
            changed_fields := array_append(changed_fields, 'firmware_version');
        END IF;
        
        IF OLD.settings IS DISTINCT FROM NEW.settings THEN
            changed_fields := array_append(changed_fields, 'settings');
        END IF;
        
        -- Create state snapshot
        state_snapshot := jsonb_build_object(
            'connectivity_status', NEW.connectivity_status,
            'is_online', NEW.is_online,
            'battery_level', NEW.battery_level,
            'health_score', NEW.health_score,
            'firmware_version', NEW.firmware_version,
            'signal_strength', NEW.signal_strength,
            'last_seen_at', NEW.last_seen_at
        );
        
        -- Insert state change record
        INSERT INTO public.device_states (device_id, state, changed_fields, change_source)
        VALUES (NEW.id, state_snapshot, changed_fields, 'device_update');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_state_change_trigger
    AFTER UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION log_device_state_change();

-- =====================================================
-- DEVICE HEALTH SCORE CALCULATION
-- =====================================================

-- Automatically calculate device health score
CREATE OR REPLACE FUNCTION calculate_device_health_score(device_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    health_score INTEGER := 100;
    days_since_seen DECIMAL;
    error_count_7d INTEGER;
    anomaly_count_7d INTEGER;
BEGIN
    -- Get device info
    SELECT 
        EXTRACT(EPOCH FROM (NOW() - last_seen_at)) / 86400
    INTO days_since_seen
    FROM public.devices
    WHERE id = device_uuid;
    
    -- Penalize for offline time
    IF days_since_seen > 7 THEN
        health_score := health_score - 50;
    ELSIF days_since_seen > 1 THEN
        health_score := health_score - 20;
    ELSIF days_since_seen > 0.1 THEN -- > 2.4 hours
        health_score := health_score - 10;
    END IF;
    
    -- Penalize for recent errors
    SELECT COUNT(*)
    INTO error_count_7d
    FROM public.device_error_logs
    WHERE device_id = device_uuid 
    AND time > NOW() - INTERVAL '7 days'
    AND error_level IN ('error', 'critical');
    
    health_score := health_score - LEAST(error_count_7d * 2, 30);
    
    -- Penalize for anomalies
    SELECT COUNT(*)
    INTO anomaly_count_7d
    FROM public.anomaly_detections
    WHERE device_id = device_uuid
    AND time > NOW() - INTERVAL '7 days'
    AND severity IN ('error', 'critical');
    
    health_score := health_score - LEAST(anomaly_count_7d * 3, 20);
    
    -- Ensure score is between 0 and 100
    health_score := GREATEST(0, LEAST(100, health_score));
    
    RETURN health_score;
END;
$$ LANGUAGE plpgsql;

-- Update device health score on relevant changes
CREATE OR REPLACE FUNCTION update_device_health_score()
RETURNS TRIGGER AS $$
DECLARE
    new_health_score INTEGER;
BEGIN
    new_health_score := calculate_device_health_score(NEW.device_id);
    
    UPDATE public.devices
    SET health_score = new_health_score
    WHERE id = NEW.device_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_health_on_error
    AFTER INSERT ON public.device_error_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_device_health_score();

CREATE TRIGGER update_health_on_anomaly
    AFTER INSERT ON public.anomaly_detections
    FOR EACH ROW
    EXECUTE FUNCTION update_device_health_score();

-- =====================================================
-- AUTOMATION HEALTH TRACKING
-- =====================================================

-- Update automation health status based on execution results
CREATE OR REPLACE FUNCTION update_automation_health()
RETURNS TRIGGER AS $$
DECLARE
    success_rate DECIMAL;
    recent_executions INTEGER;
    health_status TEXT;
BEGIN
    -- Calculate success rate from last 10 executions
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*)
    INTO recent_executions, success_rate
    FROM (
        SELECT status 
        FROM public.automation_executions
        WHERE automation_id = NEW.automation_id
        ORDER BY time DESC
        LIMIT 10
    ) recent;
    
    -- Determine health status
    IF recent_executions < 3 THEN
        health_status := 'healthy'; -- Not enough data
    ELSIF success_rate >= 0.9 THEN
        health_status := 'healthy';
    ELSIF success_rate >= 0.7 THEN
        health_status := 'degraded';
    ELSIF success_rate >= 0.5 THEN
        health_status := 'failing';
    ELSE
        health_status := 'broken';
    END IF;
    
    -- Update automation
    UPDATE public.automations
    SET 
        health_status = health_status,
        last_executed_at = NEW.time,
        last_execution_status = NEW.status,
        last_execution_duration_ms = NEW.duration_ms,
        total_executions = total_executions + 1,
        success_count = CASE WHEN NEW.status = 'success' THEN success_count + 1 ELSE success_count END,
        failure_count = CASE WHEN NEW.status = 'failed' THEN failure_count + 1 ELSE failure_count END
    WHERE id = NEW.automation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_health_trigger
    AFTER INSERT ON public.automation_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_automation_health();

-- =====================================================
-- ALERT GENERATION TRIGGERS
-- =====================================================

-- Generate alert when device goes offline
CREATE OR REPLACE FUNCTION generate_device_offline_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate alert if device was online and is now offline
    IF OLD.is_online = true AND NEW.is_online = false THEN
        INSERT INTO public.alerts (
            home_id,
            alert_type,
            severity,
            title,
            message,
            source_device_id,
            source_type,
            actionable,
            suggested_actions
        ) VALUES (
            NEW.home_id,
            'device_offline',
            'warning',
            'Device Offline: ' || NEW.device_name,
            NEW.device_name || ' has gone offline and is no longer responding.',
            NEW.id,
            'device',
            true,
            jsonb_build_array(
                jsonb_build_object(
                    'action', 'run_diagnostics',
                    'label', 'Run Diagnostics'
                ),
                jsonb_build_object(
                    'action', 'attempt_reconnect',
                    'label', 'Try to Reconnect'
                )
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_offline_alert_trigger
    AFTER UPDATE ON public.devices
    FOR EACH ROW
    WHEN (OLD.is_online IS DISTINCT FROM NEW.is_online)
    EXECUTE FUNCTION generate_device_offline_alert();

-- Generate alert for low battery
CREATE OR REPLACE FUNCTION generate_low_battery_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate alert if battery drops below 20%
    IF NEW.battery_level <= 20 AND (OLD.battery_level > 20 OR OLD.battery_level IS NULL) THEN
        INSERT INTO public.alerts (
            home_id,
            alert_type,
            severity,
            title,
            message,
            source_device_id,
            source_type,
            context
        ) VALUES (
            NEW.home_id,
            'battery_low',
            CASE 
                WHEN NEW.battery_level <= 10 THEN 'critical'
                WHEN NEW.battery_level <= 15 THEN 'error'
                ELSE 'warning'
            END,
            'Low Battery: ' || NEW.device_name,
            NEW.device_name || ' battery is at ' || NEW.battery_level || '%. Please replace or recharge soon.',
            NEW.id,
            'device',
            jsonb_build_object('battery_level', NEW.battery_level)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER low_battery_alert_trigger
    AFTER UPDATE ON public.devices
    FOR EACH ROW
    WHEN (NEW.battery_level IS DISTINCT FROM OLD.battery_level)
    EXECUTE FUNCTION generate_low_battery_alert();

-- =====================================================
-- NOTIFICATION GENERATION
-- =====================================================

-- Generate user notification from alert
CREATE OR REPLACE FUNCTION generate_notification_from_alert()
RETURNS TRIGGER AS $$
DECLARE
    user_rec RECORD;
    user_prefs RECORD;
    should_notify BOOLEAN;
BEGIN
    -- Only generate notifications for active alerts
    IF NEW.status = 'active' THEN
        -- Find all users who should be notified for this home
        FOR user_rec IN 
            SELECT DISTINCT u.id, u.email
            FROM public.users u
            LEFT JOIN public.homes h ON h.owner_id = u.id
            LEFT JOIN public.home_members hm ON hm.user_id = u.id
            WHERE (h.id = NEW.home_id OR hm.home_id = NEW.home_id)
            AND u.is_active = true
        LOOP
            -- Check user's notification preferences
            SELECT * INTO user_prefs
            FROM public.user_notification_preferences
            WHERE user_id = user_rec.id
            AND (home_id = NEW.home_id OR home_id IS NULL)
            ORDER BY home_id DESC NULLS LAST
            LIMIT 1;
            
            -- Default to enabled if no preferences found
            should_notify := true;
            
            IF user_prefs IS NOT NULL THEN
                -- Check if this type of alert is enabled
                should_notify := CASE NEW.alert_type
                    WHEN 'device_offline' THEN user_prefs.device_alerts_enabled
                    WHEN 'security_vulnerability' THEN user_prefs.security_alerts_enabled
                    WHEN 'unauthorized_access' THEN user_prefs.security_alerts_enabled
                    WHEN 'energy_anomaly' THEN user_prefs.energy_alerts_enabled
                    WHEN 'automation_failure' THEN user_prefs.automation_alerts_enabled
                    WHEN 'predictive_failure' THEN user_prefs.predictive_alerts_enabled
                    ELSE true
                END;
                
                -- Check severity threshold
                IF user_prefs.push_enabled AND should_notify THEN
                    should_notify := NEW.severity >= user_prefs.min_push_severity;
                END IF;
                
                -- Check quiet hours
                IF user_prefs.quiet_hours_enabled AND should_notify THEN
                    IF NEW.severity != 'critical' OR NOT user_prefs.critical_override_quiet_hours THEN
                        should_notify := NOT (
                            CURRENT_TIME >= user_prefs.quiet_hours_start AND
                            CURRENT_TIME <= user_prefs.quiet_hours_end
                        );
                    END IF;
                END IF;
            END IF;
            
            -- Generate notification
            IF should_notify THEN
                INSERT INTO public.user_notifications (
                    user_id,
                    home_id,
                    notification_type,
                    channel,
                    subject,
                    body,
                    related_alert_id,
                    related_device_id,
                    priority
                ) VALUES (
                    user_rec.id,
                    NEW.home_id,
                    NEW.alert_type::TEXT,
                    'push',
                    NEW.title,
                    NEW.message,
                    NEW.id,
                    NEW.source_device_id,
                    NEW.priority
                );
            END IF;
        END LOOP;
        
        -- Mark alert as notification sent
        UPDATE public.alerts
        SET notification_sent = true, notification_sent_at = NOW()
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_notification_trigger
    AFTER INSERT ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION generate_notification_from_alert();

-- =====================================================
-- SUBSCRIPTION LIFECYCLE
-- =====================================================

-- Handle subscription status changes
CREATE OR REPLACE FUNCTION handle_subscription_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- If subscription is cancelled, set end date
        IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
            NEW.cancelled_at := NOW();
            
            -- If not set to cancel at period end, end immediately
            IF NOT NEW.cancel_at_period_end THEN
                NEW.ended_at := NOW();
            END IF;
        END IF;
        
        -- If subscription is reactivated
        IF NEW.status = 'active' AND OLD.status IN ('cancelled', 'inactive', 'past_due') THEN
            NEW.cancelled_at := NULL;
            NEW.ended_at := NULL;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_status_change_trigger
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_subscription_status_change();

-- =====================================================
-- AUDIT TRAIL
-- =====================================================

-- Generic audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id),
    
    -- Action Details
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    table_name TEXT NOT NULL,
    record_id UUID,
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id, time DESC);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name, time DESC);
CREATE INDEX idx_audit_logs_record ON public.audit_logs(record_id) WHERE record_id IS NOT NULL;

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('audit_logs', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE audit_logs SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'table_name',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('audit_logs', INTERVAL '90 days');
    PERFORM add_retention_policy('audit_logs', INTERVAL '7 years'); -- Compliance requirement
    
    RAISE NOTICE 'TimescaleDB optimizations applied to audit_logs';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - audit_logs will use standard table';
END
$$;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[];
BEGIN
    -- Determine action
    IF TG_OP = 'DELETE' THEN
        old_data := row_to_json(OLD)::jsonb;
        
        INSERT INTO public.audit_logs (action, table_name, record_id, old_values)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, old_data);
        
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := row_to_json(OLD)::jsonb;
        new_data := row_to_json(NEW)::jsonb;
        
        -- Determine changed fields
        SELECT array_agg(key)
        INTO changed_fields
        FROM jsonb_each(new_data)
        WHERE jsonb_each.value IS DISTINCT FROM old_data->jsonb_each.key;
        
        INSERT INTO public.audit_logs (action, table_name, record_id, old_values, new_values, changed_fields)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, old_data, new_data, changed_fields);
        
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        new_data := row_to_json(NEW)::jsonb;
        
        INSERT INTO public.audit_logs (action, table_name, record_id, new_values)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, new_data);
        
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_user_subscriptions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_payment_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payment_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_security_vulnerabilities_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.security_vulnerabilities
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically update updated_at timestamp on row changes';
COMMENT ON FUNCTION log_device_state_change IS 'Track device state changes for history and analytics';
COMMENT ON FUNCTION calculate_device_health_score IS 'Calculate device health score based on multiple factors';
COMMENT ON FUNCTION update_automation_health IS 'Update automation health status based on execution history';
COMMENT ON FUNCTION generate_device_offline_alert IS 'Automatically create alert when device goes offline';
COMMENT ON FUNCTION generate_notification_from_alert IS 'Generate user notifications from alerts based on preferences';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for sensitive operations';

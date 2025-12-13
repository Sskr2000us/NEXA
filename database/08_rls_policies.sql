-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Row Level Security (RLS) Policies for Supabase
-- Multi-Tenant Data Isolation & Access Control
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

-- Core Tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Devices & Brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ecosystem_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_group_members ENABLE ROW LEVEL SECURITY;

-- Telemetry & Diagnostics
ALTER TABLE public.device_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_health_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firmware_updates ENABLE ROW LEVEL SECURITY;

-- AI & Predictions
ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failure_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_usage_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ml_predictions_log ENABLE ROW LEVEL SECURITY;

-- Automation
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scene_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_healing_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_healing_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecosystem_sync_status ENABLE ROW LEVEL SECURITY;

-- Security & Alerts
ALTER TABLE public.security_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_vulnerabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_access_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Billing & Subscriptions
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oem_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oem_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's accessible home IDs
CREATE OR REPLACE FUNCTION user_accessible_homes(uid UUID)
RETURNS TABLE (home_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT h.id
    FROM public.homes h
    LEFT JOIN public.home_members hm ON h.id = hm.home_id
    WHERE h.owner_id = uid 
       OR (hm.user_id = uid AND hm.is_active = true);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user has access to a home
CREATE OR REPLACE FUNCTION user_can_access_home(uid UUID, hid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.homes WHERE id = hid AND owner_id = uid
        UNION
        SELECT 1 FROM public.home_members 
        WHERE home_id = hid AND user_id = uid AND is_active = true
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check if user is home owner
CREATE OR REPLACE FUNCTION user_is_home_owner(uid UUID, hid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.homes WHERE id = hid AND owner_id = uid
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to check admin role
CREATE OR REPLACE FUNCTION user_is_admin(uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users WHERE id = uid AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY users_select_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY users_admin_all ON public.users
    FOR ALL
    USING (user_is_admin(auth.uid()));

-- =====================================================
-- HOMES TABLE POLICIES
-- =====================================================

-- Users can view homes they own or are members of
CREATE POLICY homes_select ON public.homes
    FOR SELECT
    USING (
        owner_id = auth.uid() 
        OR user_can_access_home(auth.uid(), id)
    );

-- Users can insert their own homes
CREATE POLICY homes_insert ON public.homes
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Users can update homes they own
CREATE POLICY homes_update ON public.homes
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Users can delete homes they own
CREATE POLICY homes_delete ON public.homes
    FOR DELETE
    USING (owner_id = auth.uid());

-- =====================================================
-- HOME MEMBERS TABLE POLICIES
-- =====================================================

-- Users can view members of homes they have access to
CREATE POLICY home_members_select ON public.home_members
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

-- Home owners can manage members
CREATE POLICY home_members_insert ON public.home_members
    FOR INSERT
    WITH CHECK (user_is_home_owner(auth.uid(), home_id));

CREATE POLICY home_members_update ON public.home_members
    FOR UPDATE
    USING (user_is_home_owner(auth.uid(), home_id));

CREATE POLICY home_members_delete ON public.home_members
    FOR DELETE
    USING (user_is_home_owner(auth.uid(), home_id));

-- =====================================================
-- ROOMS TABLE POLICIES
-- =====================================================

CREATE POLICY rooms_select ON public.rooms
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY rooms_manage ON public.rooms
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- DEVICES TABLE POLICIES
-- =====================================================

CREATE POLICY devices_select ON public.devices
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY devices_manage ON public.devices
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- DEVICE TELEMETRY POLICIES
-- =====================================================

CREATE POLICY device_telemetry_select ON public.device_telemetry
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices d 
            WHERE d.id = device_id 
            AND user_can_access_home(auth.uid(), d.home_id)
        )
    );

CREATE POLICY device_telemetry_insert ON public.device_telemetry
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.devices d 
            WHERE d.id = device_id 
            AND user_can_access_home(auth.uid(), d.home_id)
        )
    );

-- =====================================================
-- ENERGY USAGE POLICIES
-- =====================================================

CREATE POLICY energy_usage_select ON public.energy_usage
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY energy_usage_insert ON public.energy_usage
    FOR INSERT
    WITH CHECK (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- DIAGNOSTIC POLICIES
-- =====================================================

CREATE POLICY diagnostic_runs_select ON public.diagnostic_runs
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY diagnostic_runs_manage ON public.diagnostic_runs
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY diagnostic_issues_select ON public.diagnostic_issues
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.devices d 
            WHERE d.id = device_id 
            AND user_can_access_home(auth.uid(), d.home_id)
        )
    );

-- =====================================================
-- ERROR LOGS POLICIES
-- =====================================================

CREATE POLICY device_error_logs_select ON public.device_error_logs
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY device_error_logs_insert ON public.device_error_logs
    FOR INSERT
    WITH CHECK (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- AI & PREDICTIONS POLICIES
-- =====================================================

CREATE POLICY failure_predictions_select ON public.failure_predictions
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY anomaly_detections_select ON public.anomaly_detections
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY ai_insights_select ON public.ai_insights
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY ai_insights_update ON public.ai_insights
    FOR UPDATE
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- AUTOMATION POLICIES
-- =====================================================

CREATE POLICY automations_select ON public.automations
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY automations_manage ON public.automations
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY automation_executions_select ON public.automation_executions
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- SCENES POLICIES
-- =====================================================

CREATE POLICY scenes_select ON public.scenes
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY scenes_manage ON public.scenes
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY scene_activations_select ON public.scene_activations
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- SELF-HEALING POLICIES
-- =====================================================

-- Self-healing actions are globally readable
CREATE POLICY self_healing_actions_select ON public.self_healing_actions
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY self_healing_executions_select ON public.self_healing_executions
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- SECURITY & ALERTS POLICIES
-- =====================================================

CREATE POLICY security_scans_select ON public.security_scans
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY security_scans_manage ON public.security_scans
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY security_vulnerabilities_select ON public.security_vulnerabilities
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY security_incidents_select ON public.security_incidents
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY alerts_select ON public.alerts
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY alerts_update ON public.alerts
    FOR UPDATE
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY alert_rules_select ON public.alert_rules
    FOR SELECT
    USING (user_can_access_home(auth.uid(), home_id));

CREATE POLICY alert_rules_manage ON public.alert_rules
    FOR ALL
    USING (user_can_access_home(auth.uid(), home_id));

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

CREATE POLICY user_notifications_select ON public.user_notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY user_notifications_update ON public.user_notifications
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY user_notification_preferences_select ON public.user_notification_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY user_notification_preferences_manage ON public.user_notification_preferences
    FOR ALL
    USING (user_id = auth.uid());

-- Notification templates are readable by all authenticated users
CREATE POLICY notification_templates_select ON public.notification_templates
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- =====================================================
-- SUBSCRIPTION & BILLING POLICIES
-- =====================================================

-- Subscription plans are publicly readable
CREATE POLICY subscription_plans_select ON public.subscription_plans
    FOR SELECT
    TO authenticated
    USING (is_active = true AND is_public = true);

-- Users can view their own subscriptions
CREATE POLICY user_subscriptions_select ON public.user_subscriptions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY user_subscriptions_update ON public.user_subscriptions
    FOR UPDATE
    USING (user_id = auth.uid());

-- Users can view their own invoices
CREATE POLICY invoices_select ON public.invoices
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY invoice_line_items_select ON public.invoice_line_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id AND user_id = auth.uid()
        )
    );

-- Users can view their own transactions
CREATE POLICY payment_transactions_select ON public.payment_transactions
    FOR SELECT
    USING (user_id = auth.uid());

-- Coupons are publicly readable when active
CREATE POLICY coupons_select ON public.coupons
    FOR SELECT
    TO authenticated
    USING (
        is_active = true 
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
    );

-- Users can view their own coupon redemptions
CREATE POLICY coupon_redemptions_select ON public.coupon_redemptions
    FOR SELECT
    USING (user_id = auth.uid());

-- =====================================================
-- B2B / OEM POLICIES
-- =====================================================

-- OEM partners can only access their own data
CREATE POLICY oem_partners_select_own ON public.oem_partners
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'oem_partner'
        )
    );

-- API usage policies for partners
CREATE POLICY api_usage_select ON public.api_usage
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.oem_partners op
            WHERE op.id = partner_id 
            AND op.status = 'active'
        )
    );

-- =====================================================
-- PUBLIC/REFERENCE DATA POLICIES
-- =====================================================

-- Brands, device models, and ecosystems are readable by all authenticated users
CREATE POLICY brands_select ON public.brands
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY device_models_select ON public.device_models
    FOR SELECT
    TO authenticated
    USING (is_supported = true);

CREATE POLICY ecosystems_select ON public.ecosystems
    FOR SELECT
    TO authenticated
    USING (is_active = true);

CREATE POLICY ml_models_select ON public.ml_models
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- =====================================================
-- BYPASS POLICIES FOR SERVICE ROLE
-- =====================================================

-- Service role (backend services) can bypass RLS
-- This is configured at the Supabase project level, but we document it here

-- To use service role in your backend:
-- const supabase = createClient(url, SERVICE_ROLE_KEY)

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY users_select_own ON public.users IS 'Users can view their own profile';
COMMENT ON POLICY homes_select ON public.homes IS 'Users can view homes they own or are members of';
COMMENT ON POLICY devices_select ON public.devices IS 'Users can view devices in their accessible homes';
COMMENT ON FUNCTION user_can_access_home IS 'Check if user has access to a specific home';
COMMENT ON FUNCTION user_is_home_owner IS 'Check if user is the owner of a specific home';

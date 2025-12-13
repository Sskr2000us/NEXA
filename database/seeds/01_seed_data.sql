-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Seed Data for Development & Testing
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO public.subscription_plans (plan_code, tier, plan_name, display_name, description, monthly_price, annual_price, features, device_limit, device_monitoring, diagnostics, predictive_failure, self_healing, security_scanning, energy_optimization, automation_repair, ai_insights, priority_support) VALUES
('essential', 'essential', 'Essential', 'Essential Plan', 'Basic device monitoring and alerts', 5.99, 59.99, 
    '["Device monitoring", "Offline alerts", "Firmware notifications", "Basic support"]'::jsonb,
    50, true, true, false, false, false, false, false, false, false),

('secure', 'secure', 'Secure', 'Secure Plan', 'Enhanced security scanning and vulnerability detection', 9.99, 99.99,
    '["Everything in Essential", "Security scans", "Vulnerability reporting", "Unauthorized access alerts", "Priority support"]'::jsonb,
    100, true, true, false, false, true, false, false, false, true),

('optimize', 'optimize', 'Optimize', 'Optimize Plan', 'Energy optimization and automation health', 11.99, 119.99,
    '["Everything in Essential", "Energy optimization", "WiFi diagnostics", "Automation repair", "Advanced analytics"]'::jsonb,
    100, true, true, false, true, false, true, true, false, true),

('complete', 'complete', 'Complete', 'Complete Plan', 'Full-featured smart home intelligence', 17.99, 179.99,
    '["All features included", "Predictive failure AI", "Self-healing automation", "Security scanning", "Energy optimization", "Priority support", "API access"]'::jsonb,
    NULL, true, true, true, true, true, true, true, true, true);

-- =====================================================
-- BRANDS & ECOSYSTEMS
-- =====================================================

INSERT INTO public.brands (name, slug, logo_url, website, support_url, api_integration_available) VALUES
('Philips', 'philips', 'https://example.com/logos/philips.png', 'https://philips.com', 'https://philips.com/support', true),
('Amazon', 'amazon', 'https://example.com/logos/amazon.png', 'https://amazon.com', 'https://amazon.com/support', true),
('Google', 'google', 'https://example.com/logos/google.png', 'https://google.com', 'https://google.com/support', true),
('Samsung', 'samsung', 'https://example.com/logos/samsung.png', 'https://samsung.com', 'https://samsung.com/support', true),
('Wyze', 'wyze', 'https://example.com/logos/wyze.png', 'https://wyze.com', 'https://wyze.com/support', true),
('Ring', 'ring', 'https://example.com/logos/ring.png', 'https://ring.com', 'https://ring.com/support', true),
('Nest', 'nest', 'https://example.com/logos/nest.png', 'https://nest.com', 'https://nest.com/support', true),
('Ecobee', 'ecobee', 'https://example.com/logos/ecobee.png', 'https://ecobee.com', 'https://ecobee.com/support', true),
('Yale', 'yale', 'https://example.com/logos/yale.png', 'https://yale.com', 'https://yale.com/support', false),
('TP-Link', 'tp-link', 'https://example.com/logos/tplink.png', 'https://tp-link.com', 'https://tp-link.com/support', true);

INSERT INTO public.ecosystems (name, slug, provider, logo_url, api_version) VALUES
('Google Home', 'google-home', 'google', 'https://example.com/logos/google-home.png', 'v1'),
('Amazon Alexa', 'amazon-alexa', 'amazon', 'https://example.com/logos/alexa.png', 'v3'),
('Apple HomeKit', 'apple-homekit', 'apple', 'https://example.com/logos/homekit.png', 'v2'),
('Samsung SmartThings', 'samsung-smartthings', 'samsung', 'https://example.com/logos/smartthings.png', 'v1'),
('LG ThinQ', 'lg-thinq', 'lg', 'https://example.com/logos/thinq.png', 'v1');

-- =====================================================
-- DEVICE MODELS
-- =====================================================

INSERT INTO public.device_models (brand_id, model_number, model_name, device_type, supported_protocols, capabilities) 
SELECT 
    b.id,
    'A19-HUE-001',
    'Hue White and Color Ambiance A19',
    'light',
    ARRAY['zigbee', 'wifi']::protocol_type[],
    '{"dim": true, "color": true, "temperature": true, "max_brightness": 800, "min_temperature": 2000, "max_temperature": 6500}'::jsonb
FROM public.brands b WHERE b.slug = 'philips';

INSERT INTO public.device_models (brand_id, model_number, model_name, device_type, supported_protocols, capabilities)
SELECT 
    b.id,
    'ECHO-DOT-4',
    'Echo Dot (4th Gen)',
    'speaker',
    ARRAY['wifi', 'bluetooth']::protocol_type[],
    '{"voice_assistant": true, "smart_home_hub": true, "audio_streaming": true}'::jsonb
FROM public.brands b WHERE b.slug = 'amazon';

INSERT INTO public.device_models (brand_id, model_number, model_name, device_type, supported_protocols, capabilities)
SELECT 
    b.id,
    'T9-SMART',
    'Nest Learning Thermostat',
    'thermostat',
    ARRAY['wifi']::protocol_type[],
    '{"heating": true, "cooling": true, "scheduling": true, "geofencing": true, "learning": true}'::jsonb
FROM public.brands b WHERE b.slug = 'nest';

INSERT INTO public.device_models (brand_id, model_number, model_name, device_type, supported_protocols, capabilities)
SELECT 
    b.id,
    'CAMV3',
    'Wyze Cam v3',
    'camera',
    ARRAY['wifi']::protocol_type[],
    '{"night_vision": true, "motion_detection": true, "two_way_audio": true, "1080p": true, "sd_card": true}'::jsonb
FROM public.brands b WHERE b.slug = 'wyze';

-- =====================================================
-- SELF-HEALING ACTIONS
-- =====================================================

INSERT INTO public.self_healing_actions (name, action_type, description, category, applicable_device_types, requires_user_approval, risk_level) VALUES
('Device Reboot', 'reboot', 'Power cycle the device to resolve connectivity issues', 'connectivity', 
    ARRAY['camera', 'plug', 'switch', 'light', 'hub']::device_type[], false, 'low'),

('Re-pair Zigbee Device', 'repair', 'Re-establish Zigbee connection with the hub', 'connectivity',
    ARRAY['light', 'switch', 'sensor_motion', 'sensor_contact']::device_type[], false, 'medium'),

('WiFi Channel Switch', 'reconfigure', 'Switch to less congested WiFi channel', 'connectivity',
    ARRAY['router', 'hub']::device_type[], false, 'medium'),

('Mesh Network Rebalance', 'optimize', 'Rebalance device connections across mesh nodes', 'performance',
    ARRAY['router']::device_type[], false, 'low'),

('Firmware Repair', 'repair', 'Attempt to repair corrupted firmware', 'firmware',
    NULL, true, 'high'),

('Automation Rebuild', 'repair', 'Rebuild broken automation triggers', 'automation',
    NULL, false, 'low'),

('Factory Reset', 'reset', 'Reset device to factory defaults (last resort)', 'connectivity',
    NULL, true, 'high');

-- =====================================================
-- NOTIFICATION TEMPLATES
-- =====================================================

INSERT INTO public.notification_templates (template_name, notification_type, channel, subject_template, body_template) VALUES
('device_offline_push', 'device_offline', 'push', 'Device Offline', '{{device_name}} is offline and not responding.'),
('device_offline_email', 'device_offline', 'email', 'NEXA Alert: Device Offline', 
    'Your device "{{device_name}}" has gone offline. Last seen: {{last_seen}}. We recommend checking its power and network connection.'),

('battery_low_push', 'battery_low', 'push', 'Low Battery', '{{device_name}} battery is at {{battery_level}}%.'),
('battery_low_email', 'battery_low', 'email', 'NEXA Alert: Low Battery',
    'Your device "{{device_name}}" battery is running low ({{battery_level}}%). Please replace or recharge soon.'),

('security_vulnerability_push', 'security_vulnerability', 'push', 'Security Alert', 
    '{{severity}} security issue detected on {{device_name}}.'),
('security_vulnerability_email', 'security_vulnerability', 'email', 'NEXA Security Alert',
    'A {{severity}} security vulnerability has been detected on your device "{{device_name}}". {{description}}. Please take action.'),

('predictive_failure_push', 'predictive_failure', 'push', 'Potential Device Failure',
    '{{device_name}} may fail soon. Risk: {{risk_score}}/100'),
('predictive_failure_email', 'predictive_failure', 'email', 'NEXA Predictive Alert',
    'Our AI has detected that your device "{{device_name}}" may fail within {{estimated_days}} days (Risk Score: {{risk_score}}/100). {{recommended_action}}'),

('self_healing_completed_push', 'self_healing_completed', 'push', 'Issue Resolved',
    '{{device_name}} issue automatically fixed.'),
('self_healing_completed_email', 'self_healing_completed', 'email', 'NEXA: Issue Auto-Resolved',
    'Good news! The issue with "{{device_name}}" has been automatically resolved using {{action_name}}.');

-- =====================================================
-- COUPONS (Sample)
-- =====================================================

INSERT INTO public.coupons (code, name, discount_type, discount_value, duration, valid_from, valid_until, is_active) VALUES
('NEXA2025', 'New Year 2025 Promo', 'percent', 20.00, 'repeating', '2025-01-01', '2025-01-31', true),
('FIRSTHOME', 'First Home Discount', 'percent', 50.00, 'once', '2025-01-01', '2025-12-31', true),
('REFERRAL10', 'Referral Bonus', 'percent', 10.00, 'once', NULL, NULL, true),
('BETA100', 'Beta Tester Reward', 'fixed_amount', 100.00, 'once', '2025-01-01', '2025-06-30', true);

-- =====================================================
-- ML MODELS (Placeholder)
-- =====================================================

INSERT INTO public.ml_models (name, model_type, version, algorithm, framework, accuracy, is_active, is_production, description) VALUES
('hvac_failure_predictor_v1', 'predictive_failure', '1.0.0', 'random_forest', 'scikit-learn', 0.8750, true, true,
    'Predicts HVAC system failures based on temperature patterns, usage, and error logs'),

('camera_offline_predictor_v1', 'predictive_failure', '1.0.0', 'gradient_boosting', 'xgboost', 0.9100, true, true,
    'Predicts camera offline events based on network metrics and power patterns'),

('energy_anomaly_detector_v1', 'anomaly_detection', '1.0.0', 'isolation_forest', 'scikit-learn', 0.8900, true, true,
    'Detects abnormal energy consumption patterns'),

('device_health_scorer_v1', 'classification', '1.0.0', 'neural_network', 'tensorflow', 0.8650, true, true,
    'Calculates device health scores based on multiple factors');

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.subscription_plans IS 'Seeded with NEXA pricing tiers';
COMMENT ON TABLE public.brands IS 'Seeded with major smart home brands';
COMMENT ON TABLE public.ecosystems IS 'Seeded with popular smart home platforms';
COMMENT ON TABLE public.device_models IS 'Sample device models for testing';
COMMENT ON TABLE public.self_healing_actions IS 'Pre-configured self-healing actions';
COMMENT ON TABLE public.notification_templates IS 'Email and push notification templates';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'NEXA Database Seed Data Loaded Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Subscription Plans: %', (SELECT COUNT(*) FROM subscription_plans);
    RAISE NOTICE 'Brands: %', (SELECT COUNT(*) FROM brands);
    RAISE NOTICE 'Ecosystems: %', (SELECT COUNT(*) FROM ecosystems);
    RAISE NOTICE 'Device Models: %', (SELECT COUNT(*) FROM device_models);
    RAISE NOTICE 'Self-Healing Actions: %', (SELECT COUNT(*) FROM self_healing_actions);
    RAISE NOTICE 'Notification Templates: %', (SELECT COUNT(*) FROM notification_templates);
    RAISE NOTICE 'Coupons: %', (SELECT COUNT(*) FROM coupons);
    RAISE NOTICE 'ML Models: %', (SELECT COUNT(*) FROM ml_models);
    RAISE NOTICE '========================================';
END $$;

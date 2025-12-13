-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Database Schema - Core Tables
-- PostgreSQL 15+ / Supabase Compatible
-- Version: 1.0.0
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- TimescaleDB (optional - comment out if not available)
-- If you don't have TimescaleDB, the schema will work but without time-series optimizations
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;
    RAISE NOTICE 'TimescaleDB extension enabled successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'TimescaleDB not available. Time-series tables will use standard PostgreSQL partitioning.';
        RAISE WARNING 'For production use, install TimescaleDB for optimal performance. See INSTALL_TIMESCALEDB.md';
END
$$;

-- =====================================================
-- ENUMS & CUSTOM TYPES
-- =====================================================

-- User Roles
CREATE TYPE user_role AS ENUM (
    'homeowner',
    'renter',
    'property_manager',
    'installer',
    'oem_partner',
    'admin',
    'support'
);

-- Subscription Tiers
CREATE TYPE subscription_tier AS ENUM (
    'free',
    'essential',
    'secure',
    'optimize',
    'complete',
    'enterprise'
);

-- Subscription Status
CREATE TYPE subscription_status AS ENUM (
    'active',
    'inactive',
    'past_due',
    'cancelled',
    'trialing',
    'paused'
);

-- Device Types
CREATE TYPE device_type AS ENUM (
    'light',
    'switch',
    'plug',
    'thermostat',
    'camera',
    'doorbell',
    'lock',
    'sensor_motion',
    'sensor_contact',
    'sensor_temperature',
    'sensor_humidity',
    'sensor_leak',
    'sensor_smoke',
    'hvac',
    'appliance',
    'garage_door',
    'blind',
    'speaker',
    'hub',
    'router',
    'bridge',
    'other'
);

-- Connectivity Status
CREATE TYPE connectivity_status AS ENUM (
    'online',
    'offline',
    'weak',
    'degraded',
    'unknown'
);

-- Communication Protocols
CREATE TYPE protocol_type AS ENUM (
    'matter',
    'thread',
    'zigbee',
    'zwave',
    'wifi',
    'bluetooth',
    'ethernet',
    'proprietary'
);

-- Alert Severity
CREATE TYPE alert_severity AS ENUM (
    'info',
    'warning',
    'error',
    'critical'
);

-- Alert Type
CREATE TYPE alert_type AS ENUM (
    'device_offline',
    'battery_low',
    'firmware_update',
    'security_vulnerability',
    'unauthorized_access',
    'predictive_failure',
    'automation_failure',
    'energy_anomaly',
    'connectivity_issue',
    'self_healing_completed',
    'self_healing_failed'
);

-- Self Healing Action Status
CREATE TYPE action_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed',
    'skipped',
    'requires_manual'
);

-- =====================================================
-- CORE USER & AUTHENTICATION TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role user_role DEFAULT 'homeowner' NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- User Sessions & Devices (for tracking login devices, not smart home devices)
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ
);

-- =====================================================
-- HOMES & LOCATIONS
-- =====================================================

-- Homes/Properties
CREATE TABLE public.homes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    coordinates POINT, -- PostGIS: (latitude, longitude)
    timezone TEXT DEFAULT 'UTC',
    square_footage INTEGER,
    home_type TEXT, -- house, apartment, condo, etc.
    construction_year INTEGER,
    occupancy_status TEXT, -- owner_occupied, rented, vacant
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Home Members (multi-user access to a home)
CREATE TABLE public.home_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- owner, admin, member, guest
    permissions JSONB DEFAULT '{"view": true, "control": false, "configure": false}'::jsonb,
    invited_by UUID REFERENCES public.users(id),
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(home_id, user_id)
);

-- Rooms/Zones within a home
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    room_type TEXT, -- living_room, bedroom, kitchen, bathroom, etc.
    floor_level INTEGER DEFAULT 1,
    square_footage DECIMAL(10,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(home_id, name)
);

-- =====================================================
-- DEVICE MANUFACTURERS & BRANDS
-- =====================================================

-- Device Brands/Manufacturers
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    support_url TEXT,
    api_integration_available BOOLEAN DEFAULT false,
    oauth_config JSONB,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Device Models (catalog of all supported device models)
CREATE TABLE public.device_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    model_number TEXT NOT NULL,
    model_name TEXT NOT NULL,
    device_type device_type NOT NULL,
    supported_protocols protocol_type[] DEFAULT ARRAY[]::protocol_type[],
    capabilities JSONB DEFAULT '{}'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    firmware_info JSONB DEFAULT '{}'::jsonb,
    energy_profile JSONB,
    known_issues JSONB DEFAULT '[]'::jsonb,
    failure_patterns JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    manual_url TEXT,
    is_supported BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(brand_id, model_number)
);

-- =====================================================
-- SMART HOME ECOSYSTEMS & INTEGRATIONS
-- =====================================================

-- Supported Ecosystems (Google Home, Alexa, HomeKit, etc.)
CREATE TABLE public.ecosystems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL, -- google, amazon, apple, samsung, etc.
    logo_url TEXT,
    api_version TEXT,
    oauth_config JSONB,
    webhook_config JSONB,
    capabilities JSONB DEFAULT '{}'::jsonb,
    rate_limits JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User's ecosystem connections (OAuth tokens, etc.)
CREATE TABLE public.user_ecosystem_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    ecosystem_id UUID NOT NULL REFERENCES public.ecosystems(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    scope TEXT[],
    connection_status TEXT DEFAULT 'connected', -- connected, disconnected, error
    last_sync_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, home_id, ecosystem_id)
);

-- =====================================================
-- DEVICES
-- =====================================================

-- Main Devices Table
CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    device_model_id UUID REFERENCES public.device_models(id) ON DELETE SET NULL,
    
    -- Device Identity
    device_name TEXT NOT NULL,
    device_type device_type NOT NULL,
    manufacturer_device_id TEXT, -- Original ID from manufacturer
    ecosystem_device_id TEXT, -- ID from connected ecosystem (Alexa, Google, etc.)
    mac_address MACADDR,
    ip_address INET,
    
    -- Connectivity
    connectivity_status connectivity_status DEFAULT 'unknown',
    primary_protocol protocol_type,
    supported_protocols protocol_type[] DEFAULT ARRAY[]::protocol_type[],
    signal_strength INTEGER, -- 0-100 or RSSI in dBm
    network_ssid TEXT,
    
    -- Firmware & Software
    firmware_version TEXT,
    firmware_update_available BOOLEAN DEFAULT false,
    latest_firmware_version TEXT,
    last_firmware_update_at TIMESTAMPTZ,
    
    -- Power & Battery
    power_source TEXT, -- battery, wired, solar
    battery_level INTEGER, -- 0-100
    battery_voltage DECIMAL(5,2),
    is_charging BOOLEAN,
    
    -- Health & Status
    health_score INTEGER DEFAULT 100, -- 0-100
    is_online BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMPTZ,
    last_event_at TIMESTAMPTZ,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    
    -- Configuration
    settings JSONB DEFAULT '{}'::jsonb,
    capabilities JSONB DEFAULT '{}'::jsonb,
    
    -- Installation Info
    installed_at TIMESTAMPTZ,
    installed_by UUID REFERENCES public.users(id),
    warranty_expires_at TIMESTAMPTZ,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- Device State History (TimescaleDB hypertable for time-series optimization)
CREATE TABLE public.device_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    state JSONB NOT NULL, -- Full device state snapshot
    changed_fields TEXT[], -- List of fields that changed
    changed_by UUID REFERENCES public.users(id),
    change_source TEXT, -- manual, automation, self_healing, ecosystem
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Convert to hypertable for time-series optimization (optional - requires TimescaleDB)
DO $$
BEGIN
    PERFORM create_hypertable('device_states', 'created_at', if_not_exists => TRUE);
    RAISE NOTICE 'Hypertable created for device_states';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - device_states will use standard table';
END
$$;

-- Device Groups (for bulk operations)
CREATE TABLE public.device_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    group_type TEXT, -- room, category, custom
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(home_id, name)
);

-- Device Group Members
CREATE TABLE public.device_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.device_groups(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(group_id, device_id)
);

-- =====================================================
-- INDEXES FOR CORE TABLES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_users_last_login ON public.users(last_login_at);

-- Homes indexes
CREATE INDEX idx_homes_owner_id ON public.homes(owner_id);
CREATE INDEX idx_homes_is_active ON public.homes(is_active);
CREATE INDEX idx_homes_created_at ON public.homes(created_at);

-- Home Members indexes
CREATE INDEX idx_home_members_home_id ON public.home_members(home_id);
CREATE INDEX idx_home_members_user_id ON public.home_members(user_id);
CREATE INDEX idx_home_members_role ON public.home_members(role);

-- Rooms indexes
CREATE INDEX idx_rooms_home_id ON public.rooms(home_id);
CREATE INDEX idx_rooms_room_type ON public.rooms(room_type);

-- Brands indexes
CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_is_active ON public.brands(is_active);

-- Device Models indexes
CREATE INDEX idx_device_models_brand_id ON public.device_models(brand_id);
CREATE INDEX idx_device_models_device_type ON public.device_models(device_type);
CREATE INDEX idx_device_models_model_number ON public.device_models(model_number);

-- Devices indexes
CREATE INDEX idx_devices_home_id ON public.devices(home_id);
CREATE INDEX idx_devices_room_id ON public.devices(room_id);
CREATE INDEX idx_devices_brand_id ON public.devices(brand_id);
CREATE INDEX idx_devices_device_type ON public.devices(device_type);
CREATE INDEX idx_devices_connectivity_status ON public.devices(connectivity_status);
CREATE INDEX idx_devices_health_score ON public.devices(health_score);
CREATE INDEX idx_devices_is_online ON public.devices(is_online);
CREATE INDEX idx_devices_last_seen ON public.devices(last_seen_at DESC);
CREATE INDEX idx_devices_created_at ON public.devices(created_at);
CREATE INDEX idx_devices_deleted_at ON public.devices(deleted_at) WHERE deleted_at IS NOT NULL;

-- Device States indexes (for time-series queries)
CREATE INDEX idx_device_states_device_id ON public.device_states(device_id, created_at DESC);
CREATE INDEX idx_device_states_changed_by ON public.device_states(changed_by);

-- Ecosystems indexes
CREATE INDEX idx_ecosystems_provider ON public.ecosystems(provider);
CREATE INDEX idx_ecosystems_is_active ON public.ecosystems(is_active);

-- User Ecosystem Connections indexes
CREATE INDEX idx_user_ecosystem_user_id ON public.user_ecosystem_connections(user_id);
CREATE INDEX idx_user_ecosystem_home_id ON public.user_ecosystem_connections(home_id);
CREATE INDEX idx_user_ecosystem_status ON public.user_ecosystem_connections(connection_status);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'Core user accounts extending Supabase auth.users';
COMMENT ON TABLE public.homes IS 'Properties/locations containing smart home devices';
COMMENT ON TABLE public.home_members IS 'Multi-user access control for homes';
COMMENT ON TABLE public.rooms IS 'Rooms/zones within a home for device organization';
COMMENT ON TABLE public.brands IS 'Device manufacturers and brands';
COMMENT ON TABLE public.device_models IS 'Catalog of all supported device models with capabilities';
COMMENT ON TABLE public.ecosystems IS 'Smart home ecosystems (Google Home, Alexa, HomeKit, etc.)';
COMMENT ON TABLE public.devices IS 'Main device registry with real-time status and configuration';
COMMENT ON TABLE public.device_states IS 'Time-series history of device state changes';
COMMENT ON TABLE public.device_groups IS 'User-defined device groupings for bulk operations';

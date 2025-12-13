-- =====================================================
-- NEXA: Smart Home Intelligence OS
-- Subscription, Billing & B2B Revenue Tables
-- Version: 1.0.0
-- =====================================================

-- =====================================================
-- SUBSCRIPTION PLANS
-- =====================================================

-- Subscription Plans Catalog
CREATE TABLE public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_code TEXT UNIQUE NOT NULL,
    tier subscription_tier NOT NULL,
    
    -- Plan Details
    plan_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    tagline TEXT,
    
    -- Pricing
    monthly_price DECIMAL(10,2) NOT NULL,
    annual_price DECIMAL(10,2), -- NULL if annual not available
    currency TEXT DEFAULT 'USD',
    
    -- Billing
    billing_interval TEXT DEFAULT 'monthly', -- monthly, annual
    trial_period_days INTEGER DEFAULT 0,
    
    -- Features & Limits
    features JSONB DEFAULT '[]'::jsonb,
    device_limit INTEGER, -- NULL for unlimited
    home_limit INTEGER, -- NULL for unlimited
    user_limit INTEGER, -- NULL for unlimited
    automation_limit INTEGER,
    scene_limit INTEGER,
    
    -- API & Integration Limits
    api_rate_limit_per_hour INTEGER,
    webhook_limit INTEGER,
    data_retention_days INTEGER,
    
    -- Capabilities
    device_monitoring BOOLEAN DEFAULT true,
    diagnostics BOOLEAN DEFAULT true,
    predictive_failure BOOLEAN DEFAULT false,
    self_healing BOOLEAN DEFAULT false,
    security_scanning BOOLEAN DEFAULT false,
    energy_optimization BOOLEAN DEFAULT false,
    automation_repair BOOLEAN DEFAULT false,
    ai_insights BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    
    -- B2B Features
    is_b2b_plan BOOLEAN DEFAULT false,
    multi_property_support BOOLEAN DEFAULT false,
    white_label_available BOOLEAN DEFAULT false,
    api_access BOOLEAN DEFAULT false,
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true, -- False for invite-only or enterprise
    available_regions TEXT[] DEFAULT ARRAY['US']::TEXT[],
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_popular BOOLEAN DEFAULT false,
    
    -- Metadata
    marketing_benefits JSONB DEFAULT '[]'::jsonb,
    comparison_highlights JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscription_plans_tier ON public.subscription_plans(tier);
CREATE INDEX idx_subscription_plans_active ON public.subscription_plans(is_active, is_public);
CREATE INDEX idx_subscription_plans_b2b ON public.subscription_plans(is_b2b_plan);
CREATE INDEX idx_subscription_plans_sort ON public.subscription_plans(sort_order);

-- =====================================================
-- USER SUBSCRIPTIONS
-- =====================================================

-- User Subscriptions
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    home_id UUID REFERENCES public.homes(id) ON DELETE SET NULL, -- For home-specific subscriptions
    
    -- Subscription Status
    status subscription_status NOT NULL DEFAULT 'active',
    
    -- Billing Details
    billing_interval TEXT NOT NULL, -- monthly, annual
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Payment Method
    payment_provider TEXT, -- stripe, paypal, apple, google
    payment_provider_subscription_id TEXT,
    payment_method_id TEXT,
    
    -- Dates
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    ended_at TIMESTAMPTZ,
    
    -- Renewal
    auto_renew BOOLEAN DEFAULT true,
    next_billing_date TIMESTAMPTZ,
    
    -- Upgrades/Downgrades
    previous_plan_id UUID REFERENCES public.subscription_plans(id),
    scheduled_plan_change_id UUID REFERENCES public.subscription_plans(id),
    scheduled_change_date TIMESTAMPTZ,
    
    -- Promotions
    coupon_code TEXT,
    discount_amount DECIMAL(10,2),
    discount_percent DECIMAL(5,2),
    discount_ends_at TIMESTAMPTZ,
    
    -- Usage Tracking
    devices_used INTEGER DEFAULT 0,
    api_calls_this_period INTEGER DEFAULT 0,
    
    -- Billing Contact
    billing_email TEXT,
    billing_name TEXT,
    billing_address JSONB,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_plan ON public.user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_home ON public.user_subscriptions(home_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_active ON public.user_subscriptions(status) WHERE status = 'active';
CREATE INDEX idx_user_subscriptions_trial ON public.user_subscriptions(trial_ends_at) WHERE trial_ends_at IS NOT NULL;
CREATE INDEX idx_user_subscriptions_renewal ON public.user_subscriptions(next_billing_date) WHERE auto_renew = true;
CREATE INDEX idx_user_subscriptions_provider ON public.user_subscriptions(payment_provider, payment_provider_subscription_id);

-- =====================================================
-- BILLING & INVOICES
-- =====================================================

-- Invoices
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    -- Invoice Details
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Status
    status TEXT NOT NULL, -- draft, pending, paid, overdue, void, refunded
    paid_at TIMESTAMPTZ,
    
    -- Payment
    payment_provider TEXT,
    payment_provider_invoice_id TEXT,
    payment_intent_id TEXT,
    payment_method TEXT,
    
    -- Billing Period
    period_start DATE,
    period_end DATE,
    
    -- Billing Info
    billing_email TEXT,
    billing_name TEXT,
    billing_address JSONB,
    
    -- Files
    invoice_pdf_url TEXT,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoices_user ON public.invoices(user_id, invoice_date DESC);
CREATE INDEX idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_overdue ON public.invoices(status, due_date) WHERE status = 'overdue';
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_provider ON public.invoices(payment_provider, payment_provider_invoice_id);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Item Details
    description TEXT NOT NULL,
    item_type TEXT, -- subscription, addon, usage, fee
    
    -- Pricing
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Tax
    taxable BOOLEAN DEFAULT true,
    tax_rate DECIMAL(5,4),
    tax_amount DECIMAL(10,2),
    
    -- Period
    period_start DATE,
    period_end DATE,
    
    -- References
    plan_id UUID REFERENCES public.subscription_plans(id),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

-- Payment Transactions
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.invoices(id),
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    -- Transaction Details
    transaction_type TEXT NOT NULL, -- charge, refund, chargeback
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Status
    status TEXT NOT NULL, -- pending, processing, succeeded, failed, cancelled
    
    -- Payment Provider
    payment_provider TEXT NOT NULL, -- stripe, paypal, apple, google
    provider_transaction_id TEXT,
    provider_customer_id TEXT,
    payment_method_type TEXT, -- card, bank_account, apple_pay, google_pay
    
    -- Card Details (if applicable)
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    
    -- Timestamps
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Error Handling
    failure_code TEXT,
    failure_message TEXT,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_payment_transactions_invoice ON public.payment_transactions(invoice_id);
CREATE INDEX idx_payment_transactions_subscription ON public.payment_transactions(subscription_id);
CREATE INDEX idx_payment_transactions_provider ON public.payment_transactions(payment_provider, provider_transaction_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_transactions_date ON public.payment_transactions(transaction_date DESC);

-- =====================================================
-- COUPONS & PROMOTIONS
-- =====================================================

-- Coupons/Promo Codes
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    
    -- Discount Details
    discount_type TEXT NOT NULL, -- percent, fixed_amount
    discount_value DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD', -- Only for fixed_amount
    
    -- Applicability
    applies_to_plans UUID[], -- NULL for all plans
    applies_to_tiers subscription_tier[],
    
    -- Duration
    duration TEXT NOT NULL, -- once, repeating, forever
    duration_in_months INTEGER, -- For repeating
    
    -- Limits
    max_redemptions INTEGER, -- NULL for unlimited
    redemptions_count INTEGER DEFAULT 0,
    max_redemptions_per_user INTEGER DEFAULT 1,
    
    -- Validity
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active ON public.coupons(is_active, valid_until);
CREATE INDEX idx_coupons_validity ON public.coupons(valid_from, valid_until);

-- Coupon Redemptions
CREATE TABLE public.coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    -- Redemption Details
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discount_amount DECIMAL(10,2),
    
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_coupon_redemptions_coupon ON public.coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);
CREATE INDEX idx_coupon_redemptions_subscription ON public.coupon_redemptions(subscription_id);

-- =====================================================
-- B2B / OEM PARTNERSHIPS
-- =====================================================

-- OEM Partners
CREATE TABLE public.oem_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    partner_type TEXT NOT NULL, -- manufacturer, retailer, installer, property_manager
    
    -- Contact Info
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    
    -- Business Details
    tax_id TEXT,
    business_address JSONB,
    
    -- Partnership Details
    partnership_tier TEXT, -- bronze, silver, gold, platinum
    contract_start_date DATE,
    contract_end_date DATE,
    
    -- API Access
    api_access_enabled BOOLEAN DEFAULT false,
    api_key_prefix TEXT,
    api_rate_limit INTEGER,
    
    -- Revenue Sharing
    revenue_share_percent DECIMAL(5,2),
    referral_commission_percent DECIMAL(5,2),
    
    -- Integration
    integration_type TEXT[], -- api, oauth, webhook
    webhook_url TEXT,
    oauth_config JSONB,
    
    -- Status
    status TEXT DEFAULT 'active', -- active, inactive, suspended
    
    -- Branding
    logo_url TEXT,
    brand_colors JSONB,
    white_label_enabled BOOLEAN DEFAULT false,
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_oem_partners_type ON public.oem_partners(partner_type);
CREATE INDEX idx_oem_partners_status ON public.oem_partners(status);
CREATE INDEX idx_oem_partners_api_enabled ON public.oem_partners(api_access_enabled);

-- OEM API Keys
CREATE TABLE public.oem_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.oem_partners(id) ON DELETE CASCADE,
    
    -- Key Details
    key_name TEXT NOT NULL,
    api_key_hash TEXT NOT NULL UNIQUE, -- Hashed version
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    
    -- Permissions
    permissions JSONB DEFAULT '[]'::jsonb,
    scopes TEXT[],
    
    -- Rate Limiting
    rate_limit_per_hour INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    -- Expiration
    expires_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_oem_api_keys_partner ON public.oem_api_keys(partner_id);
CREATE INDEX idx_oem_api_keys_hash ON public.oem_api_keys(api_key_hash);
CREATE INDEX idx_oem_api_keys_active ON public.oem_api_keys(is_active);

-- B2B Revenue Tracking
CREATE TABLE public.b2b_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.oem_partners(id) ON DELETE CASCADE,
    
    -- Revenue Type
    revenue_type TEXT NOT NULL, -- subscription, api_usage, referral, integration_fee
    
    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Amounts
    gross_revenue DECIMAL(10,2) NOT NULL,
    partner_share DECIMAL(10,2) NOT NULL,
    nexa_share DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- Details
    transaction_count INTEGER,
    user_count INTEGER,
    device_count INTEGER,
    
    -- Payment Status
    payment_status TEXT DEFAULT 'pending', -- pending, paid, scheduled
    payment_date DATE,
    payment_reference TEXT,
    
    -- Breakdown
    revenue_breakdown JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_b2b_revenue_partner ON public.b2b_revenue(partner_id, period_start DESC);
CREATE INDEX idx_b2b_revenue_period ON public.b2b_revenue(period_start, period_end);
CREATE INDEX idx_b2b_revenue_status ON public.b2b_revenue(payment_status);
CREATE INDEX idx_b2b_revenue_type ON public.b2b_revenue(revenue_type);

-- =====================================================
-- USAGE TRACKING (for metered billing)
-- =====================================================

-- API Usage Tracking
CREATE TABLE public.api_usage (
    time TIMESTAMPTZ NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.oem_partners(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.user_subscriptions(id),
    
    -- Request Details
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    
    -- Usage Metrics
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    
    -- Identification
    api_key_id UUID REFERENCES public.oem_api_keys(id),
    ip_address INET,
    user_agent TEXT,
    
    -- Cost (if applicable)
    cost_units DECIMAL(10,4), -- API call cost in units
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_api_usage_user ON public.api_usage(user_id, time DESC);
CREATE INDEX idx_api_usage_partner ON public.api_usage(partner_id, time DESC);
CREATE INDEX idx_api_usage_subscription ON public.api_usage(subscription_id);
CREATE INDEX idx_api_usage_endpoint ON public.api_usage(endpoint, time DESC);

-- Convert to hypertable (TimescaleDB - optional)
DO $$
BEGIN
    PERFORM create_hypertable('api_usage', 'time', if_not_exists => TRUE);
    
    -- Compression
    ALTER TABLE api_usage SET (
        timescaledb.compress,
        timescaledb.compress_segmentby = 'user_id, partner_id, endpoint',
        timescaledb.compress_orderby = 'time DESC'
    );
    
    PERFORM add_compression_policy('api_usage', INTERVAL '30 days');
    PERFORM add_retention_policy('api_usage', INTERVAL '1 year');
    
    RAISE NOTICE 'TimescaleDB optimizations applied to api_usage';
EXCEPTION
    WHEN undefined_function THEN
        RAISE WARNING 'TimescaleDB not available - api_usage will use standard table';
END
$$;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.subscription_plans IS 'Available subscription plan tiers and pricing';
COMMENT ON TABLE public.user_subscriptions IS 'Active and historical user subscriptions';
COMMENT ON TABLE public.invoices IS 'Generated invoices for billing';
COMMENT ON TABLE public.invoice_line_items IS 'Line items for invoices';
COMMENT ON TABLE public.payment_transactions IS 'Payment transaction history';
COMMENT ON TABLE public.coupons IS 'Promotional coupons and discount codes';
COMMENT ON TABLE public.coupon_redemptions IS 'Coupon redemption history';
COMMENT ON TABLE public.oem_partners IS 'B2B partners and OEM relationships';
COMMENT ON TABLE public.oem_api_keys IS 'API keys for partner integrations';
COMMENT ON TABLE public.b2b_revenue IS 'B2B revenue tracking and partner payouts';
COMMENT ON TABLE public.api_usage IS 'API usage metrics for metered billing';

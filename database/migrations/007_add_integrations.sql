-- Create user_integrations table for OAuth tokens
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'google', 'alexa', 'apple'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, platform)
);

-- Create index for faster lookups
CREATE INDEX idx_user_integrations_user_platform ON user_integrations(user_id, platform);
CREATE INDEX idx_user_integrations_active ON user_integrations(is_active);

-- Add integration_platform column to devices table
ALTER TABLE devices ADD COLUMN IF NOT EXISTS integration_platform VARCHAR(50);
CREATE INDEX idx_devices_integration_platform ON devices(integration_platform);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_integrations
CREATE POLICY "Users can view own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid() = user_id);

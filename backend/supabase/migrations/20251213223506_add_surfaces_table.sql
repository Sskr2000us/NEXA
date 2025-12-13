-- Create surfaces table for client interfaces (smart displays, apps, etc.)
CREATE TABLE IF NOT EXISTS public.surfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id UUID NOT NULL REFERENCES public.homes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('smart_display', 'web_app', 'mobile_app', 'voice_assistant')),
  provider TEXT NOT NULL CHECK (provider IN ('google', 'amazon', 'apple', 'nexa')),
  external_id TEXT, -- Provider's device ID
  capabilities JSONB DEFAULT '[]'::jsonb, -- e.g., ["voice", "screen", "touch"]
  location TEXT, -- Room/location within home
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('online', 'offline', 'unknown')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_surfaces_home_id ON public.surfaces(home_id);
CREATE INDEX idx_surfaces_provider ON public.surfaces(provider);
CREATE UNIQUE INDEX idx_surfaces_provider_external_id ON public.surfaces(provider, external_id) WHERE external_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.surfaces ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only see surfaces for homes they own
CREATE POLICY "Users can view surfaces in their homes"
  ON public.surfaces
  FOR SELECT
  USING (
    home_id IN (
      SELECT id FROM public.homes WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Home owners can manage surfaces"
  ON public.surfaces
  FOR ALL
  USING (
    home_id IN (
      SELECT id FROM public.homes WHERE owner_id = auth.uid()
    )
  );

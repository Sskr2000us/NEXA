export interface Surface {
  id: string;
  home_id: string;
  name: string;
  type: 'smart_display' | 'web_app' | 'mobile_app' | 'voice_assistant';
  provider: 'google' | 'amazon' | 'apple' | 'nexa';
  external_id?: string; // Provider's device ID
  capabilities: string[]; // e.g., ['voice', 'screen', 'touch']
  location?: string; // Room/location within home
  status: 'online' | 'offline' | 'unknown';
  metadata?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleIntegrationService {
  private readonly logger = new Logger(GoogleIntegrationService.name);
  private oauth2Client: any;

  constructor(
    private configService: ConfigService,
    private supabaseService: SupabaseService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_REDIRECT_URI'),
    );
  }

  getAuthUrl(userId: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/sdm.service',
      'https://www.googleapis.com/auth/pubsub',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state for callback
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, userId: string) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      // Save tokens to database
      const client = this.supabaseService.getServiceClient();
      const { error } = await client
        .from('user_integrations')
        .upsert({
          user_id: userId,
          platform: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: new Date(tokens.expiry_date),
          is_active: true,
          last_synced_at: new Date(),
        });

      if (error) {
        this.logger.error(`Failed to save Google tokens: ${error.message}`);
        throw error;
      }

      // Trigger initial device sync
      await this.syncDevices(userId);

      return { success: true };
    } catch (error) {
      this.logger.error(`OAuth callback error: ${error.message}`);
      throw error;
    }
  }

  async syncDevices(userId: string) {
    try {
      const client = this.supabaseService.getServiceClient();

      // Get user's Google tokens
      const { data: integration, error: integrationError } = await client
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('platform', 'google')
        .eq('is_active', true)
        .single();

      if (integrationError || !integration) {
        throw new Error('Google integration not found');
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
      });

      // Get user's homes
      const { data: homes } = await client
        .from('homes')
        .select('id')
        .eq('owner_id', userId)
        .limit(1);

      if (!homes || homes.length === 0) {
        throw new Error('No home found for user');
      }

      const homeId = homes[0].id;

      // In production, you would call Google Home Graph API here
      // For now, we'll simulate with placeholder data
      const googleDevices = await this.fetchGoogleDevices(integration.access_token);

      // Import devices into NEXA
      for (const device of googleDevices) {
        await client
          .from('devices')
          .upsert({
            home_id: homeId,
            device_name: device.name,
            device_type: this.mapGoogleDeviceType(device.type),
            manufacturer_device_id: device.id,
            integration_platform: 'google',
            is_online: true,
            metadata: {
              google_type: device.type,
              google_traits: device.traits,
            },
          });
      }

      // Update last sync time
      await client
        .from('user_integrations')
        .update({ last_synced_at: new Date() })
        .eq('id', integration.id);

      return {
        success: true,
        devices_synced: googleDevices.length,
      };
    } catch (error) {
      this.logger.error(`Device sync error: ${error.message}`);
      throw error;
    }
  }

  async disconnect(userId: string) {
    const client = this.supabaseService.getServiceClient();
    
    const { error } = await client
      .from('user_integrations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('platform', 'google');

    if (error) {
      throw error;
    }

    return { success: true, message: 'Google Home disconnected' };
  }

  async getConnectionStatus(userId: string) {
    const client = this.supabaseService.getServiceClient();
    
    const { data, error } = await client
      .from('user_integrations')
      .select('is_active, last_synced_at')
      .eq('user_id', userId)
      .eq('platform', 'google')
      .single();

    if (error || !data) {
      return { connected: false };
    }

    return {
      connected: data.is_active,
      last_synced: data.last_synced_at,
    };
  }

  async handleSmartHomeIntent(body: any) {
    const { inputs } = body;
    const intent = inputs[0]?.intent;

    switch (intent) {
      case 'action.devices.SYNC':
        return this.handleSync(body);
      case 'action.devices.QUERY':
        return this.handleQuery(body);
      case 'action.devices.EXECUTE':
        return this.handleExecute(body);
      default:
        return { requestId: body.requestId };
    }
  }

  private async handleSync(body: any) {
    // Return user's devices to Google
    const userId = body.user?.userId;
    
    // Fetch devices from database
    const client = this.supabaseService.getServiceClient();
    const { data: devices } = await client
      .from('devices')
      .select('*')
      .eq('integration_platform', 'google');

    const payload = {
      agentUserId: userId,
      devices: devices?.map(device => ({
        id: device.id,
        type: this.mapToGoogleType(device.device_type),
        traits: this.getDeviceTraits(device.device_type),
        name: {
          name: device.device_name,
        },
        willReportState: true,
      })) || [],
    };

    return {
      requestId: body.requestId,
      payload,
    };
  }

  private async handleQuery(body: any) {
    // Return current device states
    const devices = body.inputs[0]?.payload?.devices || [];
    const deviceStates: any = {};

    for (const device of devices) {
      deviceStates[device.id] = {
        online: true,
        on: false, // Would fetch from database
      };
    }

    return {
      requestId: body.requestId,
      payload: {
        devices: deviceStates,
      },
    };
  }

  private async handleExecute(body: any) {
    // Execute commands on devices
    const commands = body.inputs[0]?.payload?.commands || [];
    const results: any[] = [];

    for (const command of commands) {
      for (const device of command.devices) {
        // Execute command and update database
        results.push({
          ids: [device.id],
          status: 'SUCCESS',
        });
      }
    }

    return {
      requestId: body.requestId,
      payload: {
        commands: results,
      },
    };
  }

  private async fetchGoogleDevices(accessToken: string): Promise<any[]> {
    // In production, call Google Home Graph API
    // For MVP, return placeholder data
    return [
      {
        id: 'google-device-1',
        name: 'Living Room Light',
        type: 'action.devices.types.LIGHT',
        traits: ['OnOff', 'Brightness'],
      },
      {
        id: 'google-device-2',
        name: 'Bedroom Thermostat',
        type: 'action.devices.types.THERMOSTAT',
        traits: ['TemperatureSetting'],
      },
    ];
  }

  private mapGoogleDeviceType(googleType: string): string {
    const typeMap: Record<string, string> = {
      'action.devices.types.LIGHT': 'light',
      'action.devices.types.SWITCH': 'switch',
      'action.devices.types.THERMOSTAT': 'thermostat',
      'action.devices.types.LOCK': 'lock',
      'action.devices.types.CAMERA': 'camera',
    };
    return typeMap[googleType] || 'other';
  }

  private mapToGoogleType(deviceType: string): string {
    const typeMap: Record<string, string> = {
      'light': 'action.devices.types.LIGHT',
      'switch': 'action.devices.types.SWITCH',
      'thermostat': 'action.devices.types.THERMOSTAT',
      'lock': 'action.devices.types.LOCK',
      'camera': 'action.devices.types.CAMERA',
    };
    return typeMap[deviceType] || 'action.devices.types.SWITCH';
  }

  private getDeviceTraits(deviceType: string): string[] {
    const traitsMap: Record<string, string[]> = {
      'light': ['action.devices.traits.OnOff', 'action.devices.traits.Brightness'],
      'switch': ['action.devices.traits.OnOff'],
      'thermostat': ['action.devices.traits.TemperatureSetting'],
      'lock': ['action.devices.traits.LockUnlock'],
      'camera': ['action.devices.traits.CameraStream'],
    };
    return traitsMap[deviceType] || ['action.devices.traits.OnOff'];
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LogTelemetryDto } from './dto/telemetry.dto';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);

  constructor(private supabaseService: SupabaseService) {}

  async logTelemetry(logTelemetryDto: LogTelemetryDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('device_telemetry')
      .insert(logTelemetryDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Log telemetry error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getTelemetry(deviceId: string, startDate?: string, endDate?: string, limit = 100) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('device_telemetry')
      .select('*')
      .eq('device_id', deviceId);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Get telemetry error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getLatestTelemetry(deviceId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('device_telemetry')
      .select('*')
      .eq('device_id', deviceId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      this.logger.error(`Get latest telemetry error: ${error.message}`);
      return null;
    }

    return data;
  }

  async getDeviceHealth(deviceId: string, hours = 24) {
    const client = this.supabaseService.getServiceClient();

    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const { data, error } = await client
      .from('device_health_history')
      .select('*')
      .eq('device_id', deviceId)
      .gte('measured_at', startTime.toISOString())
      .order('measured_at', { ascending: true });

    if (error) {
      this.logger.error(`Get device health error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async batchLogTelemetry(telemetryData: LogTelemetryDto[]) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('device_telemetry')
      .insert(telemetryData)
      .select();

    if (error) {
      this.logger.error(`Batch log telemetry error: ${error.message}`);
      throw error;
    }

    return {
      inserted: data?.length || 0,
      data,
    };
  }
}

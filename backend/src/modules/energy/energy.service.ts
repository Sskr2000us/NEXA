import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LogEnergyUsageDto } from './dto/energy.dto';

@Injectable()
export class EnergyService {
  private readonly logger = new Logger(EnergyService.name);

  constructor(private supabaseService: SupabaseService) {}

  async logUsage(logEnergyDto: LogEnergyUsageDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('energy_usage')
      .insert(logEnergyDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Log energy usage error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getUsage(deviceId: string, startDate?: string, endDate?: string) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('energy_usage')
      .select('*')
      .eq('device_id', deviceId);

    if (startDate) {
      query = query.gte('timestamp', startDate);
    }
    if (endDate) {
      query = query.lte('timestamp', endDate);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      this.logger.error(`Get energy usage error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getUsageSummary(homeId: string, period: 'hour' | 'day' = 'day', days = 7) {
    const client = this.supabaseService.getServiceClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use energy_usage_summary materialized view
    const { data, error } = await client
      .from('energy_usage_summary')
      .select('*')
      .eq('home_id', homeId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      this.logger.error(`Get energy usage summary error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getDeviceComparison(homeId: string, days = 7) {
    const client = this.supabaseService.getServiceClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await client
      .from('energy_usage')
      .select(`
        device_id,
        device:devices(device_name, device_type),
        energy_kwh
      `)
      .eq('devices.home_id', homeId)
      .gte('timestamp', startDate.toISOString());

    if (error) {
      this.logger.error(`Get device comparison error: ${error.message}`);
      throw error;
    }

    // Aggregate by device
    const deviceTotals = data.reduce((acc, record) => {
      const deviceId = record.device_id;
      if (!acc[deviceId]) {
        acc[deviceId] = {
          device_id: deviceId,
          device_name: record.device?.device_name,
          device_type: record.device?.device_type,
          total_kwh: 0,
          count: 0,
        };
      }
      acc[deviceId].total_kwh += record.energy_kwh || 0;
      acc[deviceId].count += 1;
      return acc;
    }, {});

    return Object.values(deviceTotals).sort((a: any, b: any) => b.total_kwh - a.total_kwh);
  }

  async getCostEstimate(homeId: string, days = 30, ratePerKwh = 0.12) {
    const client = this.supabaseService.getServiceClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await client
      .from('energy_usage')
      .select('energy_kwh')
      .eq('home_id', homeId)
      .gte('timestamp', startDate.toISOString());

    if (error) {
      this.logger.error(`Get cost estimate error: ${error.message}`);
      throw error;
    }

    const totalKwh = data.reduce((sum, record) => sum + (record.energy_kwh || 0), 0);
    const estimatedCost = totalKwh * ratePerKwh;

    return {
      period_days: days,
      total_kwh: totalKwh,
      rate_per_kwh: ratePerKwh,
      estimated_cost: estimatedCost,
      average_daily_cost: estimatedCost / days,
    };
  }
}

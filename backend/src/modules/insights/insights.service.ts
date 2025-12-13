import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async getHomeInsights(homeId: string, category?: string) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('ai_insights')
      .select('*')
      .eq('home_id', homeId)
      .order('generated_at', { ascending: false });

    if (category) {
      query = query.eq('insight_category', category);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      this.logger.error(`Get home insights error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getDeviceInsights(deviceId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('ai_insights')
      .select('*')
      .eq('device_id', deviceId)
      .order('generated_at', { ascending: false })
      .limit(10);

    if (error) {
      this.logger.error(`Get device insights error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getAnomalies(homeId: string, deviceId?: string, days = 7) {
    const client = this.supabaseService.getServiceClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = client
      .from('anomaly_detections')
      .select(`
        *,
        device:devices(id, device_name, device_type)
      `)
      .eq('home_id', homeId)
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: false });

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error(`Get anomalies error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getPredictions(homeId: string, predictionType?: string) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('ml_predictions_log')
      .select('*')
      .eq('home_id', homeId)
      .order('predicted_at', { ascending: false });

    if (predictionType) {
      query = query.eq('prediction_type', predictionType);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      this.logger.error(`Get predictions error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getUserBehaviorPatterns(homeId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('user_behavior_patterns')
      .select('*')
      .eq('home_id', homeId)
      .is('deleted_at', null)
      .order('confidence_score', { ascending: false });

    if (error) {
      this.logger.error(`Get user behavior patterns error: ${error.message}`);
      throw error;
    }

    return data;
  }
}

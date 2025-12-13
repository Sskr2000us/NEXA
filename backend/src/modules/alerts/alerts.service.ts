import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateAlertDto, UpdateAlertDto } from './dto/alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll(homeId: string, isResolved?: boolean) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('alerts')
      .select(`
        *,
        device:devices(id, device_name, device_type)
      `)
      .eq('home_id', homeId);

    if (isResolved !== undefined) {
      if (isResolved) {
        query = query.not('resolved_at', 'is', null);
      } else {
        query = query.is('resolved_at', null);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Find alerts error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async create(createAlertDto: CreateAlertDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('alerts')
      .insert(createAlertDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Create alert error: ${error.message}`);
      throw error;
    }

    // Create notification for home members
    await this.createNotifications(data.home_id, data.id, data.alert_message);

    return data;
  }

  async resolve(alertId: string, resolutionNotes?: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('alerts')
      .update({
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Resolve alert error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getNotifications(userId: string, isRead?: boolean) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('user_notifications')
      .select('*')
      .eq('user_id', userId);

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Get notifications error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async markNotificationRead(notificationId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Mark notification read error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async getSecurityIncidents(homeId: string, days = 30) {
    const client = this.supabaseService.getServiceClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await client
      .from('security_incidents')
      .select(`
        *,
        device:devices(id, device_name, device_type)
      `)
      .eq('home_id', homeId)
      .gte('occurred_at', startDate.toISOString())
      .order('occurred_at', { ascending: false });

    if (error) {
      this.logger.error(`Get security incidents error: ${error.message}`);
      throw error;
    }

    return data;
  }

  private async createNotifications(homeId: string, alertId: string, message: string) {
    const client = this.supabaseService.getServiceClient();

    // Get all home members
    const { data: members } = await client
      .from('home_members')
      .select('user_id')
      .eq('home_id', homeId)
      .eq('is_active', true);

    if (members && members.length > 0) {
      const notifications = members.map((member) => ({
        user_id: member.user_id,
        alert_id: alertId,
        notification_type: 'alert',
        notification_title: 'New Alert',
        notification_message: message,
      }));

      await client.from('user_notifications').insert(notifications);
    }
  }
}

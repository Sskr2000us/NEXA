import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceFilterDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  private readonly logger = new Logger(DevicesService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll(homeId: string, filters?: DeviceFilterDto) {
    const client = this.supabaseService.getServiceClient();

    let query = client
      .from('devices')
      .select(`
        *,
        room:rooms(id, name, room_type),
        brand:brands(id, name, logo_url),
        device_model:device_models(id, model_name, capabilities)
      `)
      .eq('home_id', homeId)
      .is('deleted_at', null);

    // Apply filters
    if (filters?.deviceType) {
      query = query.eq('device_type', filters.deviceType);
    }
    if (filters?.roomId) {
      query = query.eq('room_id', filters.roomId);
    }
    if (filters?.isOnline !== undefined) {
      query = query.eq('is_online', filters.isOnline);
    }
    if (filters?.isFavorite) {
      query = query.eq('is_favorite', true);
    }

    const { data, error } = await query.order('device_name');

    if (error) {
      this.logger.error(`Find devices error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async findOne(deviceId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('devices')
      .select(`
        *,
        room:rooms(id, name, room_type),
        brand:brands(id, name, logo_url),
        device_model:device_models(id, model_name, device_type, capabilities, specifications)
      `)
      .eq('id', deviceId)
      .single();

    if (error) {
      this.logger.error(`Find device error: ${error.message}`);
      throw new NotFoundException('Device not found');
    }

    return data;
  }

  async getHealth(deviceId: string) {
    const client = this.supabaseService.getServiceClient();

    // Use the device_health_summary materialized view
    const { data, error } = await client
      .from('device_health_summary')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (error) {
      this.logger.error(`Get device health error: ${error.message}`);
      throw new NotFoundException('Device health data not found');
    }

    return data;
  }

  async create(createDeviceDto: CreateDeviceDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('devices')
      .insert(createDeviceDto)
      .select()
      .single();

    if (error) {
      this.logger.error(`Create device error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async update(deviceId: string, updateDeviceDto: UpdateDeviceDto) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('devices')
      .update(updateDeviceDto)
      .eq('id', deviceId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update device error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async remove(deviceId: string) {
    const client = this.supabaseService.getServiceClient();

    // Soft delete
    const { error } = await client
      .from('devices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deviceId);

    if (error) {
      this.logger.error(`Delete device error: ${error.message}`);
      throw error;
    }

    return { message: 'Device deleted successfully' };
  }

  async updateState(deviceId: string, state: Record<string, any>, userId: string) {
    const client = this.supabaseService.getServiceClient();

    // Update device settings
    const { data, error } = await client
      .from('devices')
      .update({ settings: state })
      .eq('id', deviceId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update device state error: ${error.message}`);
      throw error;
    }

    // Log state change (trigger will handle this automatically)
    return data;
  }

  async getStates(deviceId: string, limit = 10) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('device_states')
      .select('*')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(`Get device states error: ${error.message}`);
      throw error;
    }

    return data;
  }
}

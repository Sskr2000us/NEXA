import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Surface } from './entities/surface.entity';

@Injectable()
export class SurfacesService {
  constructor(private supabaseService: SupabaseService) {}

  async findByHome(homeId: string): Promise<Surface[]> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('surfaces')
      .select('*')
      .eq('home_id', homeId)
      .order('name');

    if (error) throw new Error(`Failed to fetch surfaces: ${error.message}`);
    return data || [];
  }

  async create(surfaceData: Partial<Surface>): Promise<Surface> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('surfaces')
      .insert([surfaceData])
      .select()
      .single();

    if (error) throw new Error(`Failed to create surface: ${error.message}`);
    return data;
  }

  async upsert(surfaceData: Partial<Surface>): Promise<Surface> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('surfaces')
      .upsert([{ ...surfaceData, updated_at: new Date() }], {
        onConflict: 'provider,external_id',
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert surface: ${error.message}`);
    return data;
  }

  async update(id: string, updates: Partial<Surface>): Promise<Surface> {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('surfaces')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update surface: ${error.message}`);
    return data;
  }

  async delete(id: string): Promise<void> {
    const client = this.supabaseService.getClient();
    const { error } = await client.from('surfaces').delete().eq('id', id);

    if (error) throw new Error(`Failed to delete surface: ${error.message}`);
  }
}

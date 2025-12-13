import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { CreateHomeDto, UpdateHomeDto } from './dto/home.dto';

@Injectable()
export class HomesService {
  private readonly logger = new Logger(HomesService.name);

  constructor(private supabaseService: SupabaseService) {}

  async findAll(userId: string) {
    const client = this.supabaseService.getServiceClient();

    // Get homes where user is owner OR member
    // Use two separate queries and merge results to avoid complex OR with joins
    const [ownedHomes, memberHomes] = await Promise.all([
      // Homes where user is owner
      client
        .from('homes')
        .select(`
          *,
          home_members(user_id, role, permissions)
        `)
        .eq('owner_id', userId)
        .eq('is_active', true),
      
      // Homes where user is a member
      client
        .from('homes')
        .select(`
          *,
          home_members!inner(user_id, role, permissions)
        `)
        .eq('home_members.user_id', userId)
        .eq('is_active', true)
    ]);

    if (ownedHomes.error) {
      this.logger.error(`Find owned homes error: ${ownedHomes.error.message}`);
      throw ownedHomes.error;
    }

    if (memberHomes.error) {
      this.logger.error(`Find member homes error: ${memberHomes.error.message}`);
      throw memberHomes.error;
    }

    // Merge and deduplicate results by home id
    const allHomes = [...(ownedHomes.data || []), ...(memberHomes.data || [])];
    const uniqueHomes = allHomes.reduce((acc, home) => {
      if (!acc.find(h => h.id === home.id)) {
        acc.push(home);
      }
      return acc;
    }, []);

    return uniqueHomes;
  }

  async findOne(homeId: string, userId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('homes')
      .select(`
        *,
        home_members(id, user_id, role, permissions, is_active),
        rooms(id, name, room_type, floor_level)
      `)
      .eq('id', homeId)
      .single();

    if (error) {
      this.logger.error(`Find home error: ${error.message}`);
      throw new NotFoundException('Home not found');
    }

    // Check if user has access
    const hasAccess =
      (data as any).owner_id === userId ||
      (data as any).home_members?.some((m: any) => m.user_id === userId && m.is_active);

    if (!hasAccess) {
      throw new NotFoundException('Home not found');
    }

    return data;
  }

  async getDashboard(homeId: string, userId: string) {
    const client = this.supabaseService.getServiceClient();

    // Use the home_dashboard_summary materialized view
    const { data, error } = await client
      .from('home_dashboard_summary')
      .select('*')
      .eq('home_id', homeId)
      .single();

    if (error) {
      this.logger.error(`Get dashboard error: ${error.message}`);
      throw new NotFoundException('Dashboard data not found');
    }

    // Verify access
    await this.findOne(homeId, userId);

    return data;
  }

  async create(createHomeDto: CreateHomeDto, userId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('homes')
      .insert({
        ...createHomeDto,
        owner_id: userId,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Create home error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async update(homeId: string, updateHomeDto: UpdateHomeDto, userId: string) {
    // Verify access
    await this.findOne(homeId, userId);

    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('homes')
      .update(updateHomeDto)
      .eq('id', homeId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update home error: ${error.message}`);
      throw error;
    }

    return data;
  }

  async remove(homeId: string, userId: string) {
    const home = await this.findOne(homeId, userId);

    // Only owner can delete
    if ((home as any).owner_id !== userId) {
      throw new NotFoundException('Only home owner can delete');
    }

    const client = this.supabaseService.getServiceClient();

    const { error } = await client
      .from('homes')
      .update({ is_active: false })
      .eq('id', homeId);

    if (error) {
      this.logger.error(`Delete home error: ${error.message}`);
      throw error;
    }

    return { message: 'Home deleted successfully' };
  }

  async inviteMember(homeId: string, email: string, role: string, userId: string) {
    // Verify home access and ownership
    const home = await this.findOne(homeId, userId);
    if ((home as any).owner_id !== userId) {
      throw new NotFoundException('Only home owner can invite members');
    }

    const client = this.supabaseService.getServiceClient();

    // Find user by email
    const { data: invitedUser, error: userError } = await client
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !invitedUser) {
      throw new NotFoundException('User not found');
    }

    // Add member
    const { data, error } = await client
      .from('home_members')
      .insert({
        home_id: homeId,
        user_id: invitedUser.id,
        role,
        invited_by: userId,
        invited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Invite member error: ${error.message}`);
      throw error;
    }

    return data;
  }
}

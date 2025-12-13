import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;
  private serviceClient: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration is missing');
    }

    // Client for user-context operations (respects RLS)
    this.client = createClient(supabaseUrl, supabaseAnonKey);

    // Service client for admin operations (bypasses RLS)
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log('Supabase client initialized');
  }

  /**
   * Get Supabase client with user context (respects RLS)
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Get Supabase service client (bypasses RLS - use with caution)
   */
  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  /**
   * Create a client with specific user access token
   */
  getClientWithToken(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined');
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }

  /**
   * Execute raw SQL query (admin only)
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const { data, error } = await this.serviceClient.rpc('exec_sql', {
        query: sql,
        params: params || [],
      });

      if (error) throw error;
      return data;
    } catch (error) {
      this.logger.error(`Query error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh materialized views
   */
  async refreshMaterializedViews(): Promise<void> {
    try {
      const { error } = await this.serviceClient.rpc('refresh_materialized_views');
      if (error) throw error;
      this.logger.log('Materialized views refreshed successfully');
    } catch (error) {
      this.logger.error(`Failed to refresh materialized views: ${error.message}`);
      throw error;
    }
  }
}

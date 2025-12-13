import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { SignUpDto, SignInDto, AuthResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.auth.signUp({
      email: signUpDto.email,
      password: signUpDto.password,
      options: {
        data: {
          full_name: signUpDto.fullName,
          phone: signUpDto.phone,
        },
      },
    });

    if (error) {
      this.logger.error(`Sign up error: ${error.message}`);
      throw new UnauthorizedException(error.message);
    }

    // Create user profile in public.users table (use service client to bypass RLS)
    if (data.user) {
      const serviceClient = this.supabaseService.getServiceClient();
      const { error: profileError } = await serviceClient.from('users').insert({
        id: data.user.id,
        email: data.user.email,
        full_name: signUpDto.fullName,
        phone: signUpDto.phone,
        role: 'homeowner',
      });

      if (profileError) {
        this.logger.error(`Profile creation error: ${profileError.message}`);
      }
    }

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        fullName: signUpDto.fullName,
      },
      session: data.session!,
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.auth.signInWithPassword({
      email: signInDto.email,
      password: signInDto.password,
    });

    if (error) {
      this.logger.error(`Sign in error: ${error.message}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login (use service client to bypass RLS)
    const serviceClient = this.supabaseService.getServiceClient();
    await serviceClient
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user!.id);

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        fullName: data.user!.user_metadata?.full_name,
      },
      session: data.session!,
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
    };
  }

  async signOut(accessToken: string): Promise<void> {
    const client = this.supabaseService.getClientWithToken(accessToken);
    const { error } = await client.auth.signOut();

    if (error) {
      this.logger.error(`Sign out error: ${error.message}`);
      throw new UnauthorizedException(error.message);
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return {
      user: {
        id: data.user!.id,
        email: data.user!.email!,
        fullName: data.user!.user_metadata?.full_name,
      },
      session: data.session!,
      accessToken: data.session!.access_token,
      refreshToken: data.session!.refresh_token,
    };
  }

  async getCurrentUser(userId: string) {
    const client = this.supabaseService.getServiceClient();

    const { data, error } = await client
      .from('users')
      .select('id, email, full_name, role, avatar_url, preferences, timezone, language')
      .eq('id', userId)
      .single();

    if (error) {
      this.logger.error(`Get user error: ${error.message}`);
      throw new UnauthorizedException('User not found');
    }

    return data;
  }

  async validateUser(payload: any): Promise<any> {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const supabaseUrl = configService.get('SUPABASE_URL');
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }

    const client = jwksClient.default({
      jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      algorithms: ['ES256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const decoded = JSON.parse(
          Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString(),
        );
        
        client.getSigningKey(decoded.kid, (err, key) => {
          if (err) {
            return done(err, null);
          }
          const signingKey = key.getPublicKey();
          done(null, signingKey);
        });
      },
    });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.user_metadata?.role || payload.role,
      aud: payload.aud,
      exp: payload.exp,
    };
  }
}

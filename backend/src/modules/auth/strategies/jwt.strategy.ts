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
    const jwtJwk = configService.get('JWT_JWK');
    
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL is not configured');
    }

    // Support both JWK (ECC) and shared secret (HS256)
    const strategyOptions: any = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: `${supabaseUrl}/auth/v1`,
      audience: 'authenticated',
      algorithms: ['ES256', 'HS256'],
    };

    if (jwtJwk) {
      // Use ECC public key (ES256)
      try {
        const jwk = JSON.parse(jwtJwk);
        const client = jwksClient({
          jwksUri: `${supabaseUrl}/auth/v1/.well-known/jwks.json`,
          cache: true,
          rateLimit: true,
        });

        strategyOptions.secretOrKeyProvider = (request, rawJwtToken, done) => {
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64').toString(),
          );
          
          client.getSigningKey(header.kid, (err, key) => {
            if (err) {
              // Fallback to provided JWK
              done(null, jwk);
            } else {
              const signingKey = key.getPublicKey();
              done(null, signingKey);
            }
          });
        };
      } catch (error) {
        throw new Error('Invalid JWT_JWK format');
      }
    } else {
      // Fallback to shared secret (HS256)
      const jwtSecret = configService.get('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('Either JWT_JWK or JWT_SECRET must be configured');
      }
      strategyOptions.secretOrKey = jwtSecret;
    }

    super(strategyOptions);
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

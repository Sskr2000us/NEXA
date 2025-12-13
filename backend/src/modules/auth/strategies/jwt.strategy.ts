import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as jwksClient from 'jwks-rsa';
import * as jose from 'node-jose';

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

        strategyOptions.secretOrKeyProvider = async (request, rawJwtToken, done) => {
          try {
            const header = JSON.parse(
              Buffer.from(rawJwtToken.split('.')[0], 'base64').toString(),
            );
            
            // Try fetching from JWKS endpoint first
            client.getSigningKey(header.kid, async (err, key) => {
              if (!err && key) {
                const signingKey = key.getPublicKey();
                done(null, signingKey);
              } else {
                // Fallback: Convert provided JWK to PEM
                const keyStore = await jose.JWK.asKeyStore({ keys: [jwk] });
                const publicKey = keyStore.get(jwk.kid);
                const pem = publicKey.toPEM(false);
                done(null, pem);
              }
            });
          } catch (error) {
            done(error, null);
          }
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

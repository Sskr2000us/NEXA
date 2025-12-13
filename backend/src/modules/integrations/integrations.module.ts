import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GoogleIntegrationController } from './google/google.controller';
import { GoogleIntegrationService } from './google/google.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [GoogleIntegrationController],
  providers: [GoogleIntegrationService],
  exports: [GoogleIntegrationService],
})
export class IntegrationsModule {}

import { Module } from '@nestjs/common';
import { GoogleIntegrationController } from './google/google.controller';
import { GoogleIntegrationService } from './google/google.service';

@Module({
  controllers: [GoogleIntegrationController],
  providers: [GoogleIntegrationService],
  exports: [GoogleIntegrationService],
})
export class IntegrationsModule {}

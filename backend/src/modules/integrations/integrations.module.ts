import { Module } from '@nestjs/common';
import { GoogleIntegrationController } from './google/google.controller';
import { GoogleIntegrationService } from './google/google.service';
import { SurfacesModule } from '../surfaces/surfaces.module';

@Module({
  imports: [SurfacesModule],
  controllers: [GoogleIntegrationController],
  providers: [GoogleIntegrationService],
  exports: [GoogleIntegrationService],
})
export class IntegrationsModule {}

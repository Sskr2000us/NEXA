import { Module } from '@nestjs/common';
import { SurfacesService } from './surfaces.service';
import { SurfacesController } from './surfaces.controller';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [SurfacesService],
  controllers: [SurfacesController],
  exports: [SurfacesService],
})
export class SurfacesModule {}

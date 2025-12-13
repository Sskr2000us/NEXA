import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SurfacesService } from './surfaces.service';
import { Surface } from './entities/surface.entity';

@Controller('api/v1/surfaces')
@UseGuards(JwtAuthGuard)
export class SurfacesController {
  constructor(private surfacesService: SurfacesService) {}

  @Get('home/:homeId')
  async getSurfacesByHome(
    @Param('homeId') homeId: string,
  ): Promise<Surface[]> {
    return this.surfacesService.findByHome(homeId);
  }
}

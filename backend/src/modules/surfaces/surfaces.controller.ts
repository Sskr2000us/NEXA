import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
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

  @Post()
  async createSurface(@Body() surfaceData: Partial<Surface>): Promise<Surface> {
    return this.surfacesService.create(surfaceData);
  }

  @Put(':id')
  async updateSurface(
    @Param('id') id: string,
    @Body() updates: Partial<Surface>,
  ): Promise<Surface> {
    return this.surfacesService.update(id, updates);
  }

  @Delete(':id')
  async deleteSurface(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.surfacesService.delete(id);
    return { success: true };
  }
}

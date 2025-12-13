import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@ApiBearerAuth()
@Controller()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('homes/:homeId/insights')
  @ApiOperation({ summary: 'Get AI-generated insights for a home' })
  @ApiQuery({ name: 'category', required: false })
  getHomeInsights(@Param('homeId') homeId: string, @Query('category') category?: string) {
    return this.insightsService.getHomeInsights(homeId, category);
  }

  @Get('devices/:deviceId/insights')
  @ApiOperation({ summary: 'Get insights for a specific device' })
  getDeviceInsights(@Param('deviceId') deviceId: string) {
    return this.insightsService.getDeviceInsights(deviceId);
  }

  @Get('homes/:homeId/anomalies')
  @ApiOperation({ summary: 'Get detected anomalies' })
  @ApiQuery({ name: 'deviceId', required: false })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getAnomalies(
    @Param('homeId') homeId: string,
    @Query('deviceId') deviceId?: string,
    @Query('days') days?: number,
  ) {
    return this.insightsService.getAnomalies(homeId, deviceId, days);
  }

  @Get('homes/:homeId/predictions')
  @ApiOperation({ summary: 'Get ML predictions' })
  @ApiQuery({ name: 'predictionType', required: false })
  getPredictions(@Param('homeId') homeId: string, @Query('predictionType') predictionType?: string) {
    return this.insightsService.getPredictions(homeId, predictionType);
  }

  @Get('homes/:homeId/behavior-patterns')
  @ApiOperation({ summary: 'Get user behavior patterns' })
  getUserBehaviorPatterns(@Param('homeId') homeId: string) {
    return this.insightsService.getUserBehaviorPatterns(homeId);
  }
}

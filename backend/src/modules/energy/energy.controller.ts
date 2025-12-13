import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EnergyService } from './energy.service';
import { LogEnergyUsageDto } from './dto/energy.dto';

@ApiTags('energy')
@ApiBearerAuth()
@Controller()
export class EnergyController {
  constructor(private readonly energyService: EnergyService) {}

  @Post('devices/:deviceId/energy')
  @ApiOperation({ summary: 'Log energy usage for a device' })
  logUsage(@Param('deviceId') deviceId: string, @Body() logEnergyDto: LogEnergyUsageDto) {
    return this.energyService.logUsage({ ...logEnergyDto, device_id: deviceId });
  }

  @Get('devices/:deviceId/energy')
  @ApiOperation({ summary: 'Get energy usage for a device' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  getUsage(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.energyService.getUsage(deviceId, startDate, endDate);
  }

  @Get('homes/:homeId/energy/summary')
  @ApiOperation({ summary: 'Get energy usage summary (uses materialized view)' })
  @ApiQuery({ name: 'period', required: false, enum: ['hour', 'day'] })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getUsageSummary(
    @Param('homeId') homeId: string,
    @Query('period') period?: 'hour' | 'day',
    @Query('days') days?: number,
  ) {
    return this.energyService.getUsageSummary(homeId, period, days);
  }

  @Get('homes/:homeId/energy/comparison')
  @ApiOperation({ summary: 'Compare energy usage across devices' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getDeviceComparison(@Param('homeId') homeId: string, @Query('days') days?: number) {
    return this.energyService.getDeviceComparison(homeId, days);
  }

  @Get('homes/:homeId/energy/cost')
  @ApiOperation({ summary: 'Get estimated energy cost' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'ratePerKwh', required: false, type: Number })
  getCostEstimate(
    @Param('homeId') homeId: string,
    @Query('days') days?: number,
    @Query('ratePerKwh') ratePerKwh?: number,
  ) {
    return this.energyService.getCostEstimate(homeId, days, ratePerKwh);
  }
}

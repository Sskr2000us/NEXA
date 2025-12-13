import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { LogTelemetryDto } from './dto/telemetry.dto';

@ApiTags('telemetry')
@ApiBearerAuth()
@Controller('devices/:deviceId/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Post()
  @ApiOperation({ summary: 'Log telemetry data for a device' })
  logTelemetry(@Param('deviceId') deviceId: string, @Body() logTelemetryDto: LogTelemetryDto) {
    return this.telemetryService.logTelemetry({ ...logTelemetryDto, device_id: deviceId });
  }

  @Post('batch')
  @ApiOperation({ summary: 'Batch log telemetry data' })
  batchLogTelemetry(@Body() telemetryData: LogTelemetryDto[]) {
    return this.telemetryService.batchLogTelemetry(telemetryData);
  }

  @Get()
  @ApiOperation({ summary: 'Get telemetry history for a device' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTelemetry(
    @Param('deviceId') deviceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.telemetryService.getTelemetry(deviceId, startDate, endDate, limit);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest telemetry data' })
  getLatestTelemetry(@Param('deviceId') deviceId: string) {
    return this.telemetryService.getLatestTelemetry(deviceId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get device health history' })
  @ApiQuery({ name: 'hours', required: false, type: Number })
  getDeviceHealth(@Param('deviceId') deviceId: string, @Query('hours') hours?: number) {
    return this.telemetryService.getDeviceHealth(deviceId, hours);
  }
}

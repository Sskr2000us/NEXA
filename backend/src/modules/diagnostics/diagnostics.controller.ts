import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiagnosticsService } from './diagnostics.service';
import { RunDiagnosticsDto, ResolveIssueDto } from './dto/diagnostics.dto';

@ApiTags('diagnostics')
@ApiBearerAuth()
@Controller()
export class DiagnosticsController {
  constructor(private readonly diagnosticsService: DiagnosticsService) {}

  @Post('devices/:deviceId/diagnostics')
  @ApiOperation({ summary: 'Run diagnostics on a device' })
  runDiagnostics(
    @Param('deviceId') deviceId: string,
    @Body() runDiagnosticsDto: RunDiagnosticsDto,
  ) {
    return this.diagnosticsService.runDiagnostics(deviceId, runDiagnosticsDto);
  }

  @Get('devices/:deviceId/diagnostics/history')
  @ApiOperation({ summary: 'Get diagnostic run history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDiagnosticHistory(@Param('deviceId') deviceId: string, @Query('limit') limit?: number) {
    return this.diagnosticsService.getDiagnosticHistory(deviceId, limit);
  }

  @Get('devices/:deviceId/diagnostics/issues')
  @ApiOperation({ summary: 'Get unresolved diagnostic issues' })
  @ApiQuery({ name: 'severity', required: false, enum: ['low', 'medium', 'high', 'critical'] })
  getIssues(@Param('deviceId') deviceId: string, @Query('severity') severity?: string) {
    return this.diagnosticsService.getIssues(deviceId, severity);
  }

  @Patch('diagnostics/issues/:issueId/resolve')
  @ApiOperation({ summary: 'Mark diagnostic issue as resolved' })
  resolveIssue(@Param('issueId') issueId: string, @Body() resolveDto: ResolveIssueDto) {
    return this.diagnosticsService.resolveIssue(issueId, resolveDto.resolution);
  }

  @Get('devices/:deviceId/errors')
  @ApiOperation({ summary: 'Get device error logs' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDeviceErrors(@Param('deviceId') deviceId: string, @Query('limit') limit?: number) {
    return this.diagnosticsService.getDeviceErrors(deviceId, limit);
  }

  @Get('homes/:homeId/network-metrics')
  @ApiOperation({ summary: 'Get network metrics for home' })
  @ApiQuery({ name: 'hours', required: false, type: Number })
  getNetworkMetrics(@Param('homeId') homeId: string, @Query('hours') hours?: number) {
    return this.diagnosticsService.getNetworkMetrics(homeId, hours);
  }
}

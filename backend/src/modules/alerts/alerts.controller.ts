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
import { AlertsService } from './alerts.service';
import { CreateAlertDto, ResolveAlertDto } from './dto/alert.dto';
import { GetCurrentUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get('homes/:homeId/alerts')
  @ApiOperation({ summary: 'Get all alerts for a home' })
  @ApiQuery({ name: 'isResolved', required: false, type: Boolean })
  findAll(@Param('homeId') homeId: string, @Query('isResolved') isResolved?: boolean) {
    return this.alertsService.findAll(homeId, isResolved);
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create a new alert' })
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  @Patch('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  resolve(@Param('id') id: string, @Body() resolveDto: ResolveAlertDto) {
    return this.alertsService.resolve(id, resolveDto.resolutionNotes);
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications for current user' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  getNotifications(@GetCurrentUser() user: CurrentUser, @Query('isRead') isRead?: boolean) {
    return this.alertsService.getNotifications(user.id, isRead);
  }

  @Patch('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  markNotificationRead(@Param('id') id: string) {
    return this.alertsService.markNotificationRead(id);
  }

  @Get('homes/:homeId/security-incidents')
  @ApiOperation({ summary: 'Get security incidents for a home' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getSecurityIncidents(@Param('homeId') homeId: string, @Query('days') days?: number) {
    return this.alertsService.getSecurityIncidents(homeId, days);
  }
}

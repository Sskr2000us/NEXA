import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto, DeviceFilterDto, UpdateDeviceStateDto } from './dto/device.dto';
import { GetCurrentUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('devices')
@ApiBearerAuth()
@Controller('homes/:homeId/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all devices in a home' })
  @ApiQuery({ name: 'deviceType', required: false })
  @ApiQuery({ name: 'roomId', required: false })
  @ApiQuery({ name: 'isOnline', required: false, type: Boolean })
  @ApiQuery({ name: 'isFavorite', required: false, type: Boolean })
  findAll(@Param('homeId') homeId: string, @Query() filters: DeviceFilterDto) {
    return this.devicesService.findAll(homeId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device by ID' })
  findOne(@Param('id') id: string) {
    return this.devicesService.findOne(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get device health summary' })
  getHealth(@Param('id') id: string) {
    return this.devicesService.getHealth(id);
  }

  @Get(':id/states')
  @ApiOperation({ summary: 'Get device state history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getStates(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.devicesService.getStates(id, limit);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  create(@Param('homeId') homeId: string, @Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create({ ...createDeviceDto, home_id: homeId });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update device' })
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Post(':id/state')
  @ApiOperation({ summary: 'Update device state' })
  updateState(
    @Param('id') id: string,
    @Body() updateStateDto: UpdateDeviceStateDto,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.devicesService.updateState(id, updateStateDto.state, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete device (soft delete)' })
  remove(@Param('id') id: string) {
    return this.devicesService.remove(id);
  }
}

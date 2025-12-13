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
import { AutomationsService } from './automations.service';
import { CreateAutomationDto, UpdateAutomationDto, ExecuteAutomationDto } from './dto/automation.dto';

@ApiTags('automations')
@ApiBearerAuth()
@Controller('homes/:homeId/automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all automations for a home' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(@Param('homeId') homeId: string, @Query('isActive') isActive?: boolean) {
    return this.automationsService.findAll(homeId, isActive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get automation by ID' })
  findOne(@Param('id') id: string) {
    return this.automationsService.findOne(id);
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get automation execution history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getExecutionHistory(@Param('id') id: string, @Query('limit') limit?: number) {
    return this.automationsService.getExecutionHistory(id, limit);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Get automation health status' })
  getHealth(@Param('id') id: string) {
    return this.automationsService.getHealth(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new automation' })
  create(@Param('homeId') homeId: string, @Body() createAutomationDto: CreateAutomationDto) {
    return this.automationsService.create({ ...createAutomationDto, home_id: homeId });
  }

  @Post(':id/execute')
  @ApiOperation({ summary: 'Manually execute an automation' })
  execute(@Param('id') id: string, @Body() executeDto: ExecuteAutomationDto) {
    return this.automationsService.execute(id, executeDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update automation' })
  update(@Param('id') id: string, @Body() updateAutomationDto: UpdateAutomationDto) {
    return this.automationsService.update(id, updateAutomationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete automation' })
  remove(@Param('id') id: string) {
    return this.automationsService.remove(id);
  }
}

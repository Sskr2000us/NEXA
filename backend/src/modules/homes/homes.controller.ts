import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HomesService } from './homes.service';
import { CreateHomeDto, UpdateHomeDto, InviteMemberDto } from './dto/home.dto';
import { GetCurrentUser, CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('homes')
@ApiBearerAuth()
@Controller('homes')
export class HomesController {
  constructor(private readonly homesService: HomesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all homes for current user' })
  findAll(@GetCurrentUser() user: CurrentUser) {
    return this.homesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get home by ID' })
  findOne(@Param('id') id: string, @GetCurrentUser() user: CurrentUser) {
    return this.homesService.findOne(id, user.id);
  }

  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get home dashboard summary' })
  getDashboard(@Param('id') id: string, @GetCurrentUser() user: CurrentUser) {
    return this.homesService.getDashboard(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new home' })
  create(@Body() createHomeDto: CreateHomeDto, @GetCurrentUser() user: CurrentUser) {
    return this.homesService.create(createHomeDto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update home' })
  update(
    @Param('id') id: string,
    @Body() updateHomeDto: UpdateHomeDto,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.homesService.update(id, updateHomeDto, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete home (soft delete)' })
  remove(@Param('id') id: string, @GetCurrentUser() user: CurrentUser) {
    return this.homesService.remove(id, user.id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Invite member to home' })
  inviteMember(
    @Param('id') id: string,
    @Body() inviteMemberDto: InviteMemberDto,
    @GetCurrentUser() user: CurrentUser,
  ) {
    return this.homesService.inviteMember(id, inviteMemberDto.email, inviteMemberDto.role, user.id);
  }
}

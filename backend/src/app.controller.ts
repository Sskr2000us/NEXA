import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get API information' })
  getInfo() {
    return {
      message: 'NEXA Smart Home API',
      version: '1.0.0',
      documentation: '/api/docs',
      health: '/health',
    };
  }

  @Public()
  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

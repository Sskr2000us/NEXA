import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

@ApiTags('app')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

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
    this.logger.log('Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}

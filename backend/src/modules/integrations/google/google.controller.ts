import { Controller, Get, Post, Body, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { GoogleIntegrationService } from './google.service';
import { Public } from '../../../common/decorators/public.decorator';
import { GetCurrentUser, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtService } from '@nestjs/jwt';

@ApiTags('integrations')
@Controller('integrations/google')
export class GoogleIntegrationController {
  constructor(
    private readonly googleService: GoogleIntegrationService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Get('auth')
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  async initiateOAuth(
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    try {
      // Verify the JWT token from query parameter
      const decoded = this.jwtService.verify(token);
      const userId = decoded.sub;
      
      if (!userId) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      const authUrl = this.googleService.getAuthUrl(userId);
      res.redirect(authUrl);
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const userId = state; // state contains userId
      await this.googleService.handleCallback(code, userId);
      
      // Redirect to frontend settings page with success
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?google=connected`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?google=error`);
    }
  }

  @Post('sync')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync devices from Google Home' })
  async syncDevices(@GetCurrentUser() user: CurrentUser) {
    return this.googleService.syncDevices(user.id);
  }

  @Post('disconnect')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect Google Home integration' })
  async disconnect(@GetCurrentUser() user: CurrentUser) {
    return this.googleService.disconnect(user.id);
  }

  @Get('status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check Google Home connection status' })
  async getStatus(@GetCurrentUser() user: CurrentUser) {
    return this.googleService.getConnectionStatus(user.id);
  }

  // Google Smart Home fulfillment endpoints
  @Public()
  @Post('fulfillment')
  @ApiOperation({ summary: 'Google Smart Home fulfillment' })
  async handleFulfillment(@Body() body: any) {
    return this.googleService.handleSmartHomeIntent(body);
  }
}


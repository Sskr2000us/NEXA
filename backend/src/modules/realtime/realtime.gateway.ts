import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase/supabase.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(private supabaseService: SupabaseService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Authenticate client (simplified - in production, validate JWT token)
    const token = client.handshake.auth.token || client.handshake.headers.authorization;
    
    if (!token) {
      this.logger.warn(`Client ${client.id} connection rejected - no token`);
      client.disconnect();
      return;
    }

    // Store client metadata
    client.data.authenticated = true;
    this.logger.log(`Client ${client.id} authenticated`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:home')
  async handleSubscribeHome(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { homeId: string },
  ) {
    this.logger.log(`Client ${client.id} subscribing to home: ${data.homeId}`);
    
    // Join room for home updates
    client.join(`home:${data.homeId}`);
    
    // Set up Supabase Realtime subscription for device states
    const channel = this.supabaseService
      .getServiceClient()
      .channel(`home:${data.homeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_states',
          filter: `home_id=eq.${data.homeId}`,
        },
        (payload) => {
          this.logger.log(`Device state change: ${payload.eventType}`);
          this.server.to(`home:${data.homeId}`).emit('device:state-change', payload);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          filter: `home_id=eq.${data.homeId}`,
        },
        (payload) => {
          this.logger.log(`New alert: ${payload.new.id}`);
          this.server.to(`home:${data.homeId}`).emit('alert:new', payload.new);
        },
      )
      .subscribe();

    return { status: 'subscribed', homeId: data.homeId };
  }

  @SubscribeMessage('subscribe:device')
  async handleSubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    this.logger.log(`Client ${client.id} subscribing to device: ${data.deviceId}`);
    
    client.join(`device:${data.deviceId}`);
    
    // Set up Supabase Realtime subscription for device telemetry
    const channel = this.supabaseService
      .getServiceClient()
      .channel(`device:${data.deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_telemetry',
          filter: `device_id=eq.${data.deviceId}`,
        },
        (payload) => {
          this.logger.log(`Device telemetry: ${payload.new.id}`);
          this.server.to(`device:${data.deviceId}`).emit('device:telemetry', payload.new);
        },
      )
      .subscribe();

    return { status: 'subscribed', deviceId: data.deviceId };
  }

  @SubscribeMessage('unsubscribe:home')
  handleUnsubscribeHome(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { homeId: string },
  ) {
    this.logger.log(`Client ${client.id} unsubscribing from home: ${data.homeId}`);
    client.leave(`home:${data.homeId}`);
    return { status: 'unsubscribed', homeId: data.homeId };
  }

  @SubscribeMessage('unsubscribe:device')
  handleUnsubscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { deviceId: string },
  ) {
    this.logger.log(`Client ${client.id} unsubscribing from device: ${data.deviceId}`);
    client.leave(`device:${data.deviceId}`);
    return { status: 'unsubscribed', deviceId: data.deviceId };
  }

  // Emit device state change to all clients subscribed to the home
  emitDeviceStateChange(homeId: string, deviceId: string, state: any) {
    this.server.to(`home:${homeId}`).emit('device:state-change', {
      deviceId,
      state,
      timestamp: new Date().toISOString(),
    });
  }

  // Emit alert to all clients subscribed to the home
  emitAlert(homeId: string, alert: any) {
    this.server.to(`home:${homeId}`).emit('alert:new', alert);
  }

  // Emit automation execution to all clients subscribed to the home
  emitAutomationExecution(homeId: string, execution: any) {
    this.server.to(`home:${homeId}`).emit('automation:executed', execution);
  }
}

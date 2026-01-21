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
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket {
  userId?: string;
  id: string;
  handshake: {
    auth?: { token?: string };
    headers?: { authorization?: string };
  };
  disconnect: () => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
}

/**
 * WebSocket Gateway for real-time notifications
 *
 * Events emitted to clients:
 * - notification: New notification received
 * - notification:read: Notification marked as read
 * - notification:archived: Notification archived
 * - notification:deleted: Notification deleted
 * - notifications:all-read: All notifications marked as read
 * - stats:update: Notification stats updated
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private jwtService: JwtService) {}

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token ||
                    client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without auth token`);
        client.disconnect();
        return;
      }

      // Verify JWT and extract user ID
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.userId;

      if (!userId) {
        client.disconnect();
        return;
      }

      // Store user association
      client.userId = userId;

      // Track socket by user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Send initial connection acknowledgment
      client.emit('connected', { userId, socketId: client.id });

    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: AuthenticatedSocket): void {
    if (client.userId) {
      const userSocketSet = this.userSockets.get(client.userId);
      if (userSocketSet) {
        userSocketSet.delete(client.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(client.userId);
        }
      }
      this.logger.log(`Client ${client.id} disconnected for user ${client.userId}`);
    }
  }

  /**
   * Send notification to a specific user
   */
  sendToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  /**
   * Broadcast to all connected users
   */
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
  }

  /**
   * Send to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: any): void {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  }

  /**
   * Get count of connected users
   */
  getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if a user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * Handle ping from client (keep-alive)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): { event: string; data: any } {
    return { event: 'pong', data: { timestamp: Date.now() } };
  }

  /**
   * Handle subscription to specific notification types
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types?: string[] },
  ): { event: string; data: any } {
    // Client can subscribe to specific notification types
    if (data.types) {
      for (const type of data.types) {
        client.join(`type:${type}`);
      }
    }
    return { event: 'subscribed', data: { types: data.types } };
  }

  /**
   * Handle unsubscription from notification types
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { types?: string[] },
  ): { event: string; data: any } {
    if (data.types) {
      for (const type of data.types) {
        client.leave(`type:${type}`);
      }
    }
    return { event: 'unsubscribed', data: { types: data.types } };
  }

  /**
   * Handle presence update
   */
  @SubscribeMessage('presence')
  handlePresence(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { status: 'online' | 'away' | 'busy' },
  ): void {
    if (client.userId) {
      // Could broadcast presence to team members
      this.logger.debug(`User ${client.userId} status: ${data.status}`);
    }
  }
}

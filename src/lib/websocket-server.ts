import { WebSocketServer as WSServer } from 'ws';
import { Server as HTTPServer } from 'http';
import { AnyRealtimeEvent, WebSocketMessage } from '@/types/realtime';

/**
 * WebSocket Connection Manager
 * Manages client connections, subscriptions, and message broadcasting
 */

interface ClientConnection {
  userId: string;
  subscriptions: Set<string>;
  lastHeartbeat: number;
}

export class WebSocketManager {
  private wss: WSServer | null = null;
  private connections: Map<string, ClientConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    if (this.wss) return;

    this.wss = new WSServer({ server: httpServer });

    this.wss.on('connection', (ws, request) => {
      const clientId = generateClientId();
      console.log(`[WS] Client ${clientId} connected`);

      // Heartbeat check
      const heartbeatInterval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage;
          this.handleMessage(clientId, ws, message);
        } catch (error) {
          console.error(`[WS] Error parsing message from ${clientId}:`, error);
        }
      });

      ws.on('close', () => {
        clearInterval(heartbeatInterval);
        this.handleDisconnect(clientId);
        console.log(`[WS] Client ${clientId} disconnected`);
      });

      ws.on('error', (error) => {
        console.error(`[WS] Error from client ${clientId}:`, error);
      });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(
    clientId: string,
    ws: any,
    message: WebSocketMessage
  ): void {
    const connection = this.connections.get(clientId);

    if (!connection) {
      ws.close();
      return;
    }

    switch (message.type) {
      case 'subscribe':
        if (message.channel) {
          connection.subscriptions.add(message.channel);
          console.log(
            `[WS] Client ${clientId} subscribed to ${message.channel}`
          );
        }
        break;

      case 'unsubscribe':
        if (message.channel) {
          connection.subscriptions.delete(message.channel);
          console.log(
            `[WS] Client ${clientId} unsubscribed from ${message.channel}`
          );
        }
        break;

      case 'heartbeat':
        connection.lastHeartbeat = Date.now();
        ws.send(
          JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString(),
          })
        );
        break;

      default:
        console.warn(`[WS] Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (!connection) return;

    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(clientId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    this.connections.delete(clientId);
  }

  /**
   * Register a new connection
   */
  registerConnection(
    clientId: string,
    userId: string,
    channels: string[]
  ): void {
    const connection: ClientConnection = {
      userId,
      subscriptions: new Set(channels),
      lastHeartbeat: Date.now(),
    };

    this.connections.set(clientId, connection);

    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(clientId);
  }

  /**
   * Broadcast event to all connected clients of a user
   */
  broadcastToUser(userId: string, event: AnyRealtimeEvent): void {
    const clientIds = this.userConnections.get(userId);
    if (!clientIds) return;

    clientIds.forEach((clientId) => {
      const connection = this.connections.get(clientId);
      if (!connection) return;

      // Only send if client is subscribed to this channel
      const channel = this.extractChannel(event.type, userId);
      if (!connection.subscriptions.has(channel)) return;

      // Send via active connections
      this.wss?.clients.forEach((ws) => {
        if (
          ws.readyState === ws.OPEN &&
          this.isClientSubscribed(clientId, channel)
        ) {
          ws.send(JSON.stringify(event));
        }
      });
    });
  }

  /**
   * Extract channel name from event type
   */
  private extractChannel(eventType: string, userId: string): string {
    if (eventType.startsWith('transaction:')) {
      return `transactions:${userId}`;
    }
    if (eventType.startsWith('category:')) {
      return `categories:${userId}`;
    }
    if (eventType.startsWith('bank:') || eventType === 'dashboard:invalidate') {
      return `dashboard:${userId}`;
    }
    if (eventType.startsWith('fixed-cost:')) {
      return `fixed-costs:${userId}`;
    }
    if (eventType.startsWith('user:')) {
      return `presence:${userId}`;
    }
    return `default:${userId}`;
  }

  /**
   * Check if client is subscribed to channel
   */
  private isClientSubscribed(clientId: string, channel: string): boolean {
    const connection = this.connections.get(clientId);
    return connection?.subscriptions.has(channel) || false;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectedUsers: number;
    totalChannels: number;
  } {
    let totalChannels = 0;
    this.connections.forEach((conn) => {
      totalChannels += conn.subscriptions.size;
    });

    return {
      totalConnections: this.connections.size,
      connectedUsers: this.userConnections.size,
      totalChannels,
    };
  }
}

/**
 * Global WebSocket manager instance
 */
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager();
  }
  return wsManager;
}

/**
 * Generate unique client ID
 */
function generateClientId(): string {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * WebSocket Server for Real-Time Market Data
 * Handles live price updates, portfolio changes, and alerts
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { corsOptions } from '../config/security';

interface ConnectedClient {
  userId: string;
  socket: Socket;
  subscribedSymbols: Set<string>;
  connectedAt: Date;
}

class WebSocketServer {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private symbolSubscriptions: Map<string, Set<string>> = new Map(); // symbol -> Set<socketId>

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: corsOptions.origin,
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupEventHandlers();
    console.log('✅ WebSocket Server initialized');
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', (data: { userId: string; token: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle stock subscription
      socket.on('subscribe', (symbols: string[]) => {
        this.handleSubscription(socket, symbols);
      });

      // Handle stock unsubscription
      socket.on('unsubscribe', (symbols: string[]) => {
        this.handleUnsubscription(socket, symbols);
      });

      // Handle portfolio updates request
      socket.on('requestPortfolioUpdate', () => {
        this.handlePortfolioUpdateRequest(socket);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        console.log(`🔌 Client disconnected: ${socket.id} - Reason: ${reason}`);
        this.handleDisconnection(socket);
      });

      // Handle errors
      socket.on('error', (error: Error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle client authentication
   */
  private handleAuthentication(socket: Socket, data: { userId: string; token: string }): void {
    // TODO: Validate JWT token
    const { userId, token } = data;

    // For now, simple validation (add proper JWT validation later)
    if (!userId || !token) {
      socket.emit('authError', { message: 'Invalid credentials' });
      socket.disconnect();
      return;
    }

    // Register client
    const client: ConnectedClient = {
      userId,
      socket,
      subscribedSymbols: new Set(),
      connectedAt: new Date(),
    };

    this.connectedClients.set(socket.id, client);

    socket.emit('authenticated', {
      message: 'Authentication successful',
      userId,
    });

    console.log(`✅ Client authenticated: ${socket.id} (User: ${userId})`);
  }

  /**
   * Handle stock symbol subscriptions
   */
  private handleSubscription(socket: Socket, symbols: string[]): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) {
      socket.emit('error', { message: 'Not authenticated' });
      return;
    }

    symbols.forEach((symbol) => {
      // Add to client's subscriptions
      client.subscribedSymbols.add(symbol);

      // Add to global symbol subscriptions
      if (!this.symbolSubscriptions.has(symbol)) {
        this.symbolSubscriptions.set(symbol, new Set());
      }
      this.symbolSubscriptions.get(symbol)?.add(socket.id);
    });

    socket.emit('subscribed', { symbols });
    console.log(`📊 Client ${socket.id} subscribed to: ${symbols.join(', ')}`);
  }

  /**
   * Handle stock symbol unsubscriptions
   */
  private handleUnsubscription(socket: Socket, symbols: string[]): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    symbols.forEach((symbol) => {
      // Remove from client's subscriptions
      client.subscribedSymbols.delete(symbol);

      // Remove from global symbol subscriptions
      const subscribers = this.symbolSubscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.symbolSubscriptions.delete(symbol);
        }
      }
    });

    socket.emit('unsubscribed', { symbols });
    console.log(`📊 Client ${socket.id} unsubscribed from: ${symbols.join(', ')}`);
  }

  /**
   * Handle portfolio update request
   */
  private handlePortfolioUpdateRequest(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    // TODO: Fetch and send portfolio data
    // This will be implemented when we integrate with holdings service
    socket.emit('portfolioUpdate', {
      message: 'Portfolio update feature coming soon',
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: Socket): void {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    // Remove from all symbol subscriptions
    client.subscribedSymbols.forEach((symbol) => {
      const subscribers = this.symbolSubscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(socket.id);
        if (subscribers.size === 0) {
          this.symbolSubscriptions.delete(symbol);
        }
      }
    });

    // Remove client
    this.connectedClients.delete(socket.id);
  }

  /**
   * Broadcast price update to subscribed clients
   */
  broadcastPriceUpdate(symbol: string, priceData: any): void {
    const subscribers = this.symbolSubscriptions.get(symbol);
    if (!subscribers || subscribers.size === 0) return;

    subscribers.forEach((socketId) => {
      const client = this.connectedClients.get(socketId);
      if (client) {
        client.socket.emit('priceUpdate', {
          symbol,
          ...priceData,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Broadcast market status update to all clients
   */
  broadcastMarketStatus(status: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET'): void {
    if (!this.io) return;

    this.io.emit('marketStatus', {
      status,
      timestamp: new Date().toISOString(),
    });

    console.log(`📢 Market status broadcast: ${status}`);
  }

  /**
   * Send alert to specific user
   */
  sendAlertToUser(userId: string, alert: any): void {
    this.connectedClients.forEach((client) => {
      if (client.userId === userId) {
        client.socket.emit('alert', {
          ...alert,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.symbolSubscriptions.keys());
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      connectedClients: this.connectedClients.size,
      subscribedSymbols: this.symbolSubscriptions.size,
      totalSubscriptions: Array.from(this.symbolSubscriptions.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }
}

// Export singleton instance
export const wsServer = new WebSocketServer();

/**
 * WebSocket Server for Real-Time Market Data
 * Handles live price updates, portfolio changes, and alerts
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { corsOptions } from '../config/security';
import axios from 'axios';
import { getCurrentMarketStatus } from '../utils/marketHours';
import { alertService } from '../services/alertService';

interface ConnectedClient {
  userId: string;
  socket: Socket;
  subscribedSymbols: Set<string>;
  connectedAt: Date;
}

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

class WebSocketServer {
  private io: SocketIOServer | null = null;
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private symbolSubscriptions: Map<string, Set<string>> = new Map(); // symbol -> Set<socketId>
  private priceUpdateInterval: NodeJS.Timeout | null = null;
  private lastPrices: Map<string, number> = new Map(); // symbol -> last price

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
    this.startPriceUpdates();
    console.log('✅ WebSocket Server initialized');
  }

  /**
   * Start periodic price updates for subscribed symbols
   */
  private startPriceUpdates(): void {
    // Update prices every 2 seconds
    this.priceUpdateInterval = setInterval(() => {
      this.fetchAndBroadcastPrices();
    }, 2000);

    console.log('📊 Price update service started (2s interval)');
  }

  /**
   * Fetch prices and broadcast to subscribers
   */
  private async fetchAndBroadcastPrices(): Promise<void> {
    const symbols = Array.from(this.symbolSubscriptions.keys());

    if (symbols.length === 0) {
      return; // No subscriptions, skip
    }

    try {
      // For each subscribed symbol, generate mock price data
      // In production, this would fetch from Kite API or use Kite WebSocket
      for (const symbol of symbols) {
        const priceData = this.generateMockPriceData(symbol);
        this.broadcastPriceUpdate(symbol, priceData);

        // Update holding prices for all users who have this stock
        await this.updateHoldingPricesForSymbol(symbol, priceData.price);
      }

      // Check for exit strategy alerts after updating all prices
      await this.checkAndBroadcastAlerts();
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }

  /**
   * Update holding prices for all users holding a specific symbol
   */
  private async updateHoldingPricesForSymbol(symbol: string, price: number): Promise<void> {
    try {
      // Get all unique user IDs that have subscribed to this symbol
      const subscribers = this.symbolSubscriptions.get(symbol);
      if (!subscribers) return;

      const userIds = new Set<string>();
      subscribers.forEach((socketId) => {
        const client = this.connectedClients.get(socketId);
        if (client) {
          userIds.add(client.userId);
        }
      });

      // Update holding price for each user
      for (const userId of userIds) {
        await alertService.updateHoldingPrice(userId, symbol, price);
      }
    } catch (error) {
      console.error(`Error updating holding prices for ${symbol}:`, error);
    }
  }

  /**
   * Check exit strategies and broadcast alerts
   */
  private async checkAndBroadcastAlerts(): Promise<void> {
    try {
      const alerts = await alertService.checkExitStrategies();

      if (alerts.length > 0) {
        console.log(`🚨 ${alerts.length} alert(s) triggered`);

        // Send each alert to the respective user
        for (const alert of alerts) {
          this.sendAlertToUser(alert.userId, alert);
          console.log(`📢 Alert sent to user ${alert.userId}: ${alert.type} for ${alert.stockSymbol}`);
        }
      }
    } catch (error) {
      console.error('Error checking and broadcasting alerts:', error);
    }
  }

  /**
   * Generate mock price data for testing
   * TODO: Replace with actual Kite API integration
   */
  private generateMockPriceData(symbol: string): PriceData {
    // Get last price or generate a random starting price
    let lastPrice = this.lastPrices.get(symbol);
    if (!lastPrice) {
      // Generate random starting price between 100 and 5000
      lastPrice = Math.random() * 4900 + 100;
      this.lastPrices.set(symbol, lastPrice);
    }

    // Simulate price movement (-1% to +1%)
    const changePercent = (Math.random() - 0.5) * 2;
    const change = lastPrice * (changePercent / 100);
    const newPrice = lastPrice + change;

    // Update last price
    this.lastPrices.set(symbol, newPrice);

    return {
      symbol,
      price: newPrice,
      change,
      changePercent,
      volume: Math.floor(Math.random() * 1000000),
      timestamp: new Date().toISOString(),
    };
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

      // Handle alert dismissal
      socket.on('dismissAlert', (data: { holdingId: string; type: 'PROFIT_TARGET' | 'STOP_LOSS' }) => {
        this.handleDismissAlert(socket, data);
      });

      // Handle exit strategy reset
      socket.on('resetExitStrategy', (data: { holdingId: string }) => {
        this.handleResetExitStrategy(socket, data);
      });

      // Handle get active alerts request
      socket.on('getActiveAlerts', () => {
        this.handleGetActiveAlerts(socket);
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

    // Send current market status immediately after authentication
    const currentMarketStatus = getCurrentMarketStatus();
    socket.emit('marketStatus', {
      status: currentMarketStatus.status,
      timestamp: new Date().toISOString(),
    });

    console.log(`✅ Client authenticated: ${socket.id} (User: ${userId})`);
    console.log(`📊 Sent market status to ${socket.id}: ${currentMarketStatus.status}`);
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
   * Handle alert dismissal
   */
  private async handleDismissAlert(
    socket: Socket,
    data: { holdingId: string; type: 'PROFIT_TARGET' | 'STOP_LOSS' }
  ): Promise<void> {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    try {
      await alertService.dismissAlert(data.holdingId, data.type);
      socket.emit('alertDismissed', {
        success: true,
        holdingId: data.holdingId,
        type: data.type,
      });
      console.log(`✅ Alert dismissed for holding ${data.holdingId} (${data.type})`);
    } catch (error) {
      console.error('Error dismissing alert:', error);
      socket.emit('error', { message: 'Failed to dismiss alert' });
    }
  }

  /**
   * Handle exit strategy reset
   */
  private async handleResetExitStrategy(socket: Socket, data: { holdingId: string }): Promise<void> {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    try {
      await alertService.resetAlerts(data.holdingId);
      socket.emit('exitStrategyReset', {
        success: true,
        holdingId: data.holdingId,
      });
      console.log(`✅ Exit strategy reset for holding ${data.holdingId}`);
    } catch (error) {
      console.error('Error resetting exit strategy:', error);
      socket.emit('error', { message: 'Failed to reset exit strategy' });
    }
  }

  /**
   * Handle get active alerts request
   */
  private async handleGetActiveAlerts(socket: Socket): Promise<void> {
    const client = this.connectedClients.get(socket.id);
    if (!client) return;

    try {
      const alerts = await alertService.getActiveAlerts(client.userId);
      socket.emit('activeAlerts', { alerts });
      console.log(`📊 Sent ${alerts.length} active alerts to user ${client.userId}`);
    } catch (error) {
      console.error('Error getting active alerts:', error);
      socket.emit('error', { message: 'Failed to get active alerts' });
    }
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

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
      console.log('📊 Price update service stopped');
    }

    if (this.io) {
      this.io.close();
      console.log('✅ WebSocket Server shut down');
    }
  }
}

// Export singleton instance
export const wsServer = new WebSocketServer();

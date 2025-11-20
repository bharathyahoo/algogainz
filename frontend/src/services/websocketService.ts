/**
 * WebSocket Service - Frontend
 * Manages real-time connection to backend WebSocket server
 */

import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET';
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

interface MarketStatusUpdate {
  status: MarketStatus;
  timestamp: string;
}

interface Alert {
  type: 'PROFIT_TARGET' | 'STOP_LOSS' | 'PRICE_ALERT';
  symbol: string;
  message: string;
  currentPrice: number;
  targetPrice?: number;
  timestamp: string;
}

type PriceUpdateCallback = (data: PriceUpdate) => void;
type MarketStatusCallback = (data: MarketStatusUpdate) => void;
type AlertCallback = (data: Alert) => void;
type ConnectionStatusCallback = (status: ConnectionStatus) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private priceUpdateCallbacks: Set<PriceUpdateCallback> = new Set();
  private marketStatusCallbacks: Set<MarketStatusCallback> = new Set();
  private alertCallbacks: Set<AlertCallback> = new Set();
  private connectionStatusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private subscribedSymbols: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  /**
   * Connect to WebSocket server
   */
  connect(userId: string, token: string): void {
    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return;
    }

    this.updateConnectionStatus('connecting');

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.setupEventListeners();
    this.authenticate(userId, token);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.subscribedSymbols.clear();
      this.updateConnectionStatus('disconnected');
      console.log('[WebSocket] Disconnected');
    }
  }

  /**
   * Authenticate with server
   */
  private authenticate(userId: string, token: string): void {
    if (!this.socket) return;

    this.socket.emit('authenticate', { userId, token });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.updateConnectionStatus('connected');

      // Resubscribe to symbols after reconnection
      if (this.subscribedSymbols.size > 0) {
        this.subscribeToSymbols(Array.from(this.subscribedSymbols));
      }
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.updateConnectionStatus('disconnected');
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      this.updateConnectionStatus('error');
      this.reconnectAttempts++;
    });

    // Authentication events
    this.socket.on('authenticated', (data: any) => {
      console.log('[WebSocket] Authenticated:', data.message);
    });

    this.socket.on('authError', (data: any) => {
      console.error('[WebSocket] Authentication error:', data.message);
      this.updateConnectionStatus('error');
    });

    // Data events
    this.socket.on('priceUpdate', (data: PriceUpdate) => {
      this.priceUpdateCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on('marketStatus', (data: MarketStatusUpdate) => {
      console.log('[WebSocket] Received marketStatus event:', data);
      console.log('[WebSocket] Number of marketStatus callbacks:', this.marketStatusCallbacks.size);
      this.marketStatusCallbacks.forEach((callback) => callback(data));
    });

    this.socket.on('alert', (data: Alert) => {
      this.alertCallbacks.forEach((callback) => callback(data));
    });

    // Subscription events
    this.socket.on('subscribed', (data: { symbols: string[] }) => {
      console.log('[WebSocket] Subscribed to:', data.symbols.join(', '));
    });

    this.socket.on('unsubscribed', (data: { symbols: string[] }) => {
      console.log('[WebSocket] Unsubscribed from:', data.symbols.join(', '));
    });

    // Error events
    this.socket.on('error', (error: any) => {
      console.error('[WebSocket] Error:', error);
    });
  }

  /**
   * Subscribe to stock symbols for real-time updates
   */
  subscribeToSymbols(symbols: string[]): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot subscribe: not connected');
      return;
    }

    // Add to tracked subscriptions
    symbols.forEach((symbol) => this.subscribedSymbols.add(symbol));

    this.socket.emit('subscribe', symbols);
    console.log('[WebSocket] Subscribing to:', symbols.join(', '));
  }

  /**
   * Unsubscribe from stock symbols
   */
  unsubscribeFromSymbols(symbols: string[]): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot unsubscribe: not connected');
      return;
    }

    // Remove from tracked subscriptions
    symbols.forEach((symbol) => this.subscribedSymbols.delete(symbol));

    this.socket.emit('unsubscribe', symbols);
    console.log('[WebSocket] Unsubscribing from:', symbols.join(', '));
  }

  /**
   * Request portfolio update
   */
  requestPortfolioUpdate(): void {
    if (!this.socket?.connected) {
      console.warn('[WebSocket] Cannot request update: not connected');
      return;
    }

    this.socket.emit('requestPortfolioUpdate');
  }

  /**
   * Register callback for price updates
   */
  onPriceUpdate(callback: PriceUpdateCallback): () => void {
    this.priceUpdateCallbacks.add(callback);
    return () => this.priceUpdateCallbacks.delete(callback);
  }

  /**
   * Register callback for market status updates
   */
  onMarketStatus(callback: MarketStatusCallback): () => void {
    this.marketStatusCallbacks.add(callback);
    return () => this.marketStatusCallbacks.delete(callback);
  }

  /**
   * Register callback for alerts
   */
  onAlert(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.connectionStatusCallbacks.add(callback);
    // Immediately call with current status
    callback(this.connectionStatus);
    return () => this.connectionStatusCallbacks.delete(callback);
  }

  /**
   * Update connection status and notify callbacks
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.connectionStatusCallbacks.forEach((callback) => callback(status));
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get subscribed symbols
   */
  getSubscribedSymbols(): string[] {
    return Array.from(this.subscribedSymbols);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

/**
 * Kite Connect WebSocket Integration
 * Handles real-time market data from Zerodha Kite
 */

import WebSocket from 'ws';
import { wsServer } from './server';

interface KiteTick {
  instrument_token: number;
  last_price: number;
  change: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

interface SymbolMapping {
  symbol: string;
  instrumentToken: number;
  exchange: string;
}

class KiteWebSocketClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private accessToken: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;
  private symbolMappings: Map<number, SymbolMapping> = new Map();
  private subscribedTokens: Set<number> = new Set();
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(apiKey: string, accessToken: string) {
    this.apiKey = apiKey;
    this.accessToken = accessToken;
  }

  /**
   * Connect to Kite WebSocket
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Kite WebSocket URL format
        const wsUrl = `wss://ws.kite.trade?api_key=${this.apiKey}&access_token=${this.accessToken}`;

        this.ws = new WebSocket(wsUrl);

        this.ws.on('open', () => {
          console.log('✅ Connected to Kite WebSocket');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          resolve();
        });

        this.ws.on('message', (data: Buffer) => {
          this.handleMessage(data);
        });

        this.ws.on('error', (error: Error) => {
          console.error('❌ Kite WebSocket error:', error);
          this.isConnected = false;
          reject(error);
        });

        this.ws.on('close', (code: number, reason: string) => {
          console.log(`🔌 Kite WebSocket closed: ${code} - ${reason}`);
          this.isConnected = false;
          this.stopHeartbeat();
          this.attemptReconnect();
        });
      } catch (error) {
        console.error('❌ Failed to connect to Kite WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from Kite WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.subscribedTokens.clear();
      console.log('🔌 Disconnected from Kite WebSocket');
    }
  }

  /**
   * Subscribe to instruments
   */
  subscribe(symbols: SymbolMapping[]): void {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️  Cannot subscribe: Not connected to Kite WebSocket');
      return;
    }

    const tokens = symbols.map((s) => s.instrumentToken);

    // Store symbol mappings
    symbols.forEach((mapping) => {
      this.symbolMappings.set(mapping.instrumentToken, mapping);
      this.subscribedTokens.add(mapping.instrumentToken);
    });

    // Subscribe message format for Kite WebSocket
    const subscribeMessage = {
      a: 'subscribe',
      v: tokens,
    };

    this.ws.send(JSON.stringify(subscribeMessage));
    console.log(`📊 Subscribed to ${tokens.length} instruments`);
  }

  /**
   * Unsubscribe from instruments
   */
  unsubscribe(tokens: number[]): void {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️  Cannot unsubscribe: Not connected to Kite WebSocket');
      return;
    }

    const unsubscribeMessage = {
      a: 'unsubscribe',
      v: tokens,
    };

    this.ws.send(JSON.stringify(unsubscribeMessage));

    // Remove from subscribed tokens and mappings
    tokens.forEach((token) => {
      this.subscribedTokens.delete(token);
      this.symbolMappings.delete(token);
    });

    console.log(`📊 Unsubscribed from ${tokens.length} instruments`);
  }

  /**
   * Set mode for subscribed instruments
   * Modes: 'ltp' (last traded price), 'quote', 'full'
   */
  setMode(mode: 'ltp' | 'quote' | 'full', tokens: number[]): void {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️  Cannot set mode: Not connected to Kite WebSocket');
      return;
    }

    const modeMessage = {
      a: 'mode',
      v: [mode, tokens],
    };

    this.ws.send(JSON.stringify(modeMessage));
    console.log(`📊 Set mode '${mode}' for ${tokens.length} instruments`);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: Buffer): void {
    try {
      // Kite sends binary data, need to parse it
      // For simplicity, we'll assume JSON for now
      // In production, you need to use the Kite WebSocket binary parser

      const message = data.toString();
      const tick = JSON.parse(message);

      // Check if it's a tick message
      if (tick && tick.instrument_token) {
        this.processTick(tick);
      }
    } catch (error) {
      // Binary data parsing would go here
      // For now, we'll handle this in the actual Kite integration
      console.debug('Received binary data from Kite WebSocket');
    }
  }

  /**
   * Process tick data and broadcast to clients
   */
  private processTick(tick: KiteTick): void {
    const mapping = this.symbolMappings.get(tick.instrument_token);
    if (!mapping) return;

    const priceData = {
      price: tick.last_price,
      change: tick.change,
      changePercent: (tick.change / tick.ohlc.close) * 100,
      volume: tick.volume,
      ohlc: tick.ohlc,
      buyQuantity: tick.buy_quantity,
      sellQuantity: tick.sell_quantity,
    };

    // Broadcast to our WebSocket server
    wsServer.broadcastPriceUpdate(mapping.symbol, priceData);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.ping();
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    console.log(
      `🔄 Attempting to reconnect to Kite WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`
    );

    setTimeout(() => {
      this.connect()
        .then(() => {
          // Resubscribe to all previously subscribed instruments
          if (this.subscribedTokens.size > 0) {
            const symbols = Array.from(this.symbolMappings.values());
            this.subscribe(symbols);
          }
        })
        .catch((error) => {
          console.error('❌ Reconnection failed:', error);
        });
    }, delay);
  }

  /**
   * Check if connected
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get subscribed instrument tokens
   */
  getSubscribedTokens(): number[] {
    return Array.from(this.subscribedTokens);
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      connected: this.isConnected,
      subscribedInstruments: this.subscribedTokens.size,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance (will be initialized when needed with proper credentials)
let kiteWSClient: KiteWebSocketClient | null = null;

/**
 * Initialize Kite WebSocket client
 */
export function initializeKiteWebSocket(apiKey: string, accessToken: string): void {
  if (kiteWSClient) {
    kiteWSClient.disconnect();
  }

  kiteWSClient = new KiteWebSocketClient(apiKey, accessToken);
  kiteWSClient.connect().catch((error) => {
    console.error('❌ Failed to initialize Kite WebSocket:', error);
  });
}

/**
 * Get Kite WebSocket client instance
 */
export function getKiteWebSocketClient(): KiteWebSocketClient | null {
  return kiteWSClient;
}

/**
 * Disconnect Kite WebSocket
 */
export function disconnectKiteWebSocket(): void {
  if (kiteWSClient) {
    kiteWSClient.disconnect();
    kiteWSClient = null;
  }
}

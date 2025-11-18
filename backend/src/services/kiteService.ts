import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * Kite Connect API Service
 * Wrapper for all Zerodha Kite Connect API calls
 * Reference: https://kite.trade/docs/connect/v3/
 */

export interface KiteQuote {
  instrument_token: number;
  last_price: number;
  last_quantity: number;
  average_price: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  change: number;
}

export interface KiteOrder {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  quantity: number;
  order_type: 'MARKET' | 'LIMIT';
  price?: number;
  product: 'CNC' | 'MIS' | 'NRML';
  validity?: 'DAY' | 'IOC';
}

export interface KiteHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class KiteService {
  private apiKey: string;
  private accessToken: string;
  private client: AxiosInstance;

  constructor(accessToken: string) {
    this.apiKey = process.env.KITE_API_KEY || '';
    this.accessToken = accessToken;

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: 'https://api.kite.trade',
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${this.apiKey}:${this.accessToken}`
      },
      timeout: 10000 // 10 second timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        return this.handleError(error);
      }
    );
  }

  /**
   * Handle API errors with proper formatting
   */
  private handleError(error: AxiosError): Promise<never> {
    if (error.response) {
      // API responded with error
      const data: any = error.response.data;
      throw new Error(data.message || 'Kite API error');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from Kite API');
    } else {
      // Request setup error
      throw new Error(error.message || 'Failed to call Kite API');
    }
  }

  /**
   * Get user profile information
   * GET /user/profile
   */
  async getProfile() {
    const response = await this.client.get('/user/profile');
    return response.data.data;
  }

  /**
   * Get available margins
   * GET /user/margins
   */
  async getMargins(segment: 'equity' | 'commodity' = 'equity') {
    const response = await this.client.get(`/user/margins/${segment}`);
    return response.data.data;
  }

  /**
   * Get list of all tradeable instruments
   * GET /instruments
   */
  async getInstruments(exchange?: string) {
    const url = exchange ? `/instruments/${exchange}` : '/instruments';
    const response = await this.client.get(url);
    return response.data;
  }

  /**
   * Get live quote for instruments
   * GET /quote?i=NSE:INFY&i=NSE:RELIANCE
   */
  async getQuote(symbols: string[]): Promise<Record<string, KiteQuote>> {
    const params = symbols.map(symbol => `i=${symbol}`).join('&');
    const response = await this.client.get(`/quote?${params}`);
    return response.data.data;
  }

  /**
   * Get LTP (Last Traded Price) for instruments
   * GET /quote/ltp?i=NSE:INFY&i=NSE:RELIANCE
   */
  async getLTP(symbols: string[]): Promise<Record<string, { last_price: number }>> {
    const params = symbols.map(symbol => `i=${symbol}`).join('&');
    const response = await this.client.get(`/quote/ltp?${params}`);
    return response.data.data;
  }

  /**
   * Get historical data for an instrument
   * GET /instruments/historical/{instrument_token}/{interval}
   * interval: minute, day, 3minute, 5minute, 10minute, 15minute, 30minute, 60minute
   */
  async getHistoricalData(
    instrumentToken: string,
    interval: string,
    fromDate: string,
    toDate: string
  ): Promise<KiteHistoricalData[]> {
    const response = await this.client.get(
      `/instruments/historical/${instrumentToken}/${interval}`,
      {
        params: {
          from: fromDate,
          to: toDate
        }
      }
    );

    // Convert candle data to more usable format
    return response.data.data.candles.map((candle: any[]) => ({
      date: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5]
    }));
  }

  /**
   * Place a regular order
   * POST /orders/regular
   */
  async placeOrder(order: KiteOrder) {
    const response = await this.client.post('/orders/regular', {
      tradingsymbol: order.tradingsymbol,
      exchange: order.exchange,
      transaction_type: order.transaction_type,
      quantity: order.quantity,
      order_type: order.order_type,
      price: order.price,
      product: order.product,
      validity: order.validity || 'DAY'
    });

    return response.data.data;
  }

  /**
   * Modify an existing order
   * PUT /orders/regular/{order_id}
   */
  async modifyOrder(orderId: string, modifications: Partial<KiteOrder>) {
    const response = await this.client.put(`/orders/regular/${orderId}`, modifications);
    return response.data.data;
  }

  /**
   * Cancel an order
   * DELETE /orders/regular/{order_id}
   */
  async cancelOrder(orderId: string) {
    const response = await this.client.delete(`/orders/regular/${orderId}`);
    return response.data.data;
  }

  /**
   * Get list of all orders for the day
   * GET /orders
   */
  async getOrders() {
    const response = await this.client.get('/orders');
    return response.data.data;
  }

  /**
   * Get order history for a specific order
   * GET /orders/{order_id}
   */
  async getOrderHistory(orderId: string) {
    const response = await this.client.get(`/orders/${orderId}`);
    return response.data.data;
  }

  /**
   * Get list of trades for the day
   * GET /trades
   */
  async getTrades() {
    const response = await this.client.get('/trades');
    return response.data.data;
  }

  /**
   * Get trades for a specific order
   * GET /orders/{order_id}/trades
   */
  async getOrderTrades(orderId: string) {
    const response = await this.client.get(`/orders/${orderId}/trades`);
    return response.data.data;
  }

  /**
   * Get current positions
   * GET /portfolio/positions
   */
  async getPositions() {
    const response = await this.client.get('/portfolio/positions');
    return response.data.data;
  }

  /**
   * Get holdings (long-term positions)
   * GET /portfolio/holdings
   */
  async getHoldings() {
    const response = await this.client.get('/portfolio/holdings');
    return response.data.data;
  }

  /**
   * Convert position product type
   * PUT /portfolio/positions
   */
  async convertPosition(params: {
    exchange: string;
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    position_type: 'day' | 'overnight';
    quantity: number;
    old_product: string;
    new_product: string;
  }) {
    const response = await this.client.put('/portfolio/positions', params);
    return response.data.data;
  }
}

/**
 * Factory function to create KiteService instance
 */
export const createKiteService = (accessToken: string): KiteService => {
  return new KiteService(accessToken);
};

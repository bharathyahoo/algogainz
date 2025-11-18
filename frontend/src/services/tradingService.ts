import { apiService } from './api';

export interface OrderRequest {
  stockSymbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  instrumentToken: string;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
}

export interface OrderCharges {
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  total: number;
}

export interface OrderPreview {
  quantity: number;
  pricePerShare: number;
  grossAmount: number;
  charges: OrderCharges;
  netAmount: number;
  marginCheck?: {
    sufficient: boolean;
    available: number;
    required: number;
  };
}

export interface Order {
  id: string;
  stockSymbol: string;
  companyName: string;
  orderType: string;
  transactionType: string;
  quantity: number;
  price?: number;
  orderStatus: string;
  kiteOrderId?: string;
  placedAt: string;
}

class TradingService {
  /**
   * Get order preview with charges
   */
  async getOrderPreview(orderRequest: OrderRequest): Promise<OrderPreview> {
    try {
      const response = await apiService.post('/trading/preview', orderRequest);
      return response.data as OrderPreview;
    } catch (error: any) {
      console.error('Failed to get order preview:', error);
      throw new Error(error.message || 'Failed to get order preview');
    }
  }

  /**
   * Place order
   */
  async placeOrder(orderRequest: OrderRequest): Promise<Order> {
    try {
      const response = await apiService.post('/trading/place', orderRequest);
      return response.data as Order;
    } catch (error: any) {
      console.error('Failed to place order:', error);
      throw new Error(error.message || 'Failed to place order');
    }
  }

  /**
   * Get user's orders
   */
  async getOrders(status?: string): Promise<Order[]> {
    try {
      const response = await apiService.get('/trading/orders', status ? { status } : {});
      return response.data as Order[];
    } catch (error: any) {
      console.error('Failed to get orders:', error);
      throw new Error(error.message || 'Failed to get orders');
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiService.get(`/trading/orders/${orderId}`);
      return response.data as Order;
    } catch (error: any) {
      console.error('Failed to get order:', error);
      throw new Error(error.message || 'Failed to get order details');
    }
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const response = await apiService.delete(`/trading/orders/${orderId}`);
      return response.data as Order;
    } catch (error: any) {
      console.error('Failed to cancel order:', error);
      throw new Error(error.message || 'Failed to cancel order');
    }
  }
}

export const tradingService = new TradingService();

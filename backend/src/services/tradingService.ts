import { PrismaClient } from '@prisma/client';
import { createKiteService } from './kiteService';

const prisma = new PrismaClient();

/**
 * Check if market is currently open (IST timezone)
 */
function isMarketOpen(): boolean {
  // Get current time in IST (UTC+5:30)
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
  const istTime = new Date(now.getTime() + istOffset);

  const day = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Market is closed on Saturday (6) and Sunday (0)
  if (day === 0 || day === 6) {
    return false;
  }

  // Market hours: 9:15 AM (555 minutes) to 3:30 PM (930 minutes) IST
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM

  return totalMinutes >= marketOpen && totalMinutes <= marketClose;
}

export interface OrderRequest {
  stockSymbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  instrumentToken: string;
  orderType: 'MARKET' | 'LIMIT';
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price?: number; // For LIMIT orders
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
}

export class TradingService {
  /**
   * Check if market is currently open
   */
  isMarketOpen(): boolean {
    return isMarketOpen();
  }

  /**
   * Calculate order charges (approximate)
   * These are indicative charges - actual charges will come from Kite
   */
  calculateCharges(
    grossAmount: number,
    transactionType: 'BUY' | 'SELL'
  ): OrderCharges {
    // Zerodha charges (approximate for equity delivery)
    const brokerage = 0; // Zerodha is zero brokerage for delivery
    const exchangeCharges = grossAmount * 0.0000325; // ~0.00325%
    const sebiCharges = grossAmount * 0.000001; // Rs 10 per crore
    const stampDuty = transactionType === 'BUY' ? grossAmount * 0.00015 : 0; // 0.015% on buy side only
    const gst = (brokerage + exchangeCharges + sebiCharges) * 0.18; // 18% on brokerage + transaction charges

    const total = brokerage + exchangeCharges + gst + sebiCharges + stampDuty;

    return {
      brokerage,
      exchangeCharges: parseFloat(exchangeCharges.toFixed(2)),
      gst: parseFloat(gst.toFixed(2)),
      sebiCharges: parseFloat(sebiCharges.toFixed(2)),
      stampDuty: parseFloat(stampDuty.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
    };
  }

  /**
   * Get order preview with charges
   */
  async getOrderPreview(
    accessToken: string,
    orderRequest: OrderRequest
  ): Promise<OrderPreview> {
    const kite = createKiteService(accessToken);

    // Get current price if not provided (for MARKET orders)
    let pricePerShare = orderRequest.price || 0;
    if (orderRequest.orderType === 'MARKET') {
      const quote = await kite.getLTP([orderRequest.instrumentToken]);
      pricePerShare = quote[orderRequest.instrumentToken]?.last_price || 0;
    }

    const grossAmount = pricePerShare * orderRequest.quantity;
    const charges = this.calculateCharges(grossAmount, orderRequest.transactionType);
    const netAmount =
      orderRequest.transactionType === 'BUY'
        ? grossAmount + charges.total
        : grossAmount - charges.total;

    return {
      quantity: orderRequest.quantity,
      pricePerShare,
      grossAmount,
      charges,
      netAmount,
    };
  }

  /**
   * Check if user has sufficient margin
   */
  async checkMargin(
    accessToken: string,
    requiredAmount: number,
    transactionType: 'BUY' | 'SELL'
  ): Promise<{ sufficient: boolean; available: number; required: number }> {
    if (transactionType === 'SELL') {
      // For sell orders, we don't need margin check
      return { sufficient: true, available: 0, required: 0 };
    }

    try {
      const kite = createKiteService(accessToken);
      const margins = await kite.getMargins('equity');

      // Log the full response to debug
      console.log('Margins API Response:', JSON.stringify(margins, null, 2));

      // Try different possible paths in the response
      const available =
        margins.equity?.available?.cash ||
        margins.available?.cash ||
        margins.cash ||
        0;

      console.log('Available margin extracted:', available);
      console.log('Required amount:', requiredAmount);

      const sufficient = available >= requiredAmount;

      return {
        sufficient,
        available,
        required: requiredAmount,
      };
    } catch (error) {
      console.error('Margin check failed:', error);
      return { sufficient: false, available: 0, required: requiredAmount };
    }
  }

  /**
   * Place order through Kite API
   */
  async placeOrder(
    userId: string,
    accessToken: string,
    orderRequest: OrderRequest
  ): Promise<any> {
    const kite = createKiteService(accessToken);

    // Validate required fields
    if (!orderRequest.exchange || orderRequest.exchange.trim() === '') {
      throw new Error('Exchange is required');
    }

    if (!orderRequest.stockSymbol || orderRequest.stockSymbol.trim() === '') {
      throw new Error('Stock symbol is required');
    }

    console.log('Placing order with params:', {
      stockSymbol: orderRequest.stockSymbol,
      exchange: orderRequest.exchange,
      transactionType: orderRequest.transactionType,
      quantity: orderRequest.quantity,
      orderType: orderRequest.orderType,
    });

    // Check market hours for MARKET orders
    const marketOpen = isMarketOpen();
    if (!marketOpen && orderRequest.orderType === 'MARKET') {
      throw new Error(
        'Market is currently closed. MARKET orders can only be placed during market hours (9:15 AM - 3:30 PM IST, Mon-Fri). ' +
        'Please use a LIMIT order instead, which will be queued as an After Market Order (AMO).'
      );
    }

    // Build Kite order params
    const orderParams: any = {
      tradingsymbol: orderRequest.stockSymbol,
      exchange: orderRequest.exchange,
      transaction_type: orderRequest.transactionType,
      quantity: orderRequest.quantity,
      order_type: orderRequest.orderType,
      product: 'CNC', // Delivery
      validity: 'DAY',
    };

    // Add price for LIMIT orders
    if (orderRequest.orderType === 'LIMIT' && orderRequest.price) {
      orderParams.price = orderRequest.price;
    }

    // Place order via Kite API
    let kiteResponse;
    try {
      kiteResponse = await kite.placeOrder(orderParams);
    } catch (error: any) {
      // Handle specific Kite API errors with better messages
      if (error.message && error.message.includes('After Market Order')) {
        throw new Error(
          'Market is currently closed. MARKET orders cannot be placed outside market hours. ' +
          'Please use a LIMIT order instead, which will be queued as an After Market Order (AMO).'
        );
      }
      // Re-throw other errors
      throw error;
    }

    // Save order to database
    const order = await prisma.order.create({
      data: {
        userId,
        stockSymbol: orderRequest.stockSymbol,
        companyName: orderRequest.companyName,
        exchange: orderRequest.exchange,
        instrumentToken: orderRequest.instrumentToken,
        orderType: orderRequest.orderType,
        transactionType: orderRequest.transactionType,
        quantity: orderRequest.quantity,
        price: orderRequest.price,
        kiteOrderId: kiteResponse.order_id,
        orderStatus: 'PENDING',
      },
    });

    return {
      ...order,
      kiteOrderId: kiteResponse.order_id,
    };
  }

  /**
   * Get order status from Kite and update database
   */
  async updateOrderStatus(userId: string, accessToken: string, orderId: string): Promise<any> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order || !order.kiteOrderId) {
      throw new Error('Order not found');
    }

    const kite = createKiteService(accessToken);
    const kiteOrders = await kite.getOrders();
    const kiteOrder = kiteOrders.find((o: any) => o.order_id === order.kiteOrderId);

    if (!kiteOrder) {
      throw new Error('Order not found in Kite');
    }

    // Update order in database
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: kiteOrder.status,
        averagePrice: kiteOrder.average_price || undefined,
        filledQuantity: kiteOrder.filled_quantity || 0,
        statusMessage: kiteOrder.status_message || undefined,
      },
    });

    // If order is complete, create transaction
    if (kiteOrder.status === 'COMPLETE' && kiteOrder.filled_quantity > 0) {
      await this.createTransactionFromOrder(updated, kiteOrder);
    }

    return updated;
  }

  /**
   * Create transaction record from completed order
   */
  private async createTransactionFromOrder(order: any, kiteOrder: any): Promise<void> {
    // Check if transaction already exists
    const existing = await prisma.transaction.findFirst({
      where: {
        orderIdRef: order.kiteOrderId,
      },
    });

    if (existing) {
      return; // Transaction already created
    }

    const pricePerShare = kiteOrder.average_price || order.price || 0;
    const quantity = kiteOrder.filled_quantity || order.quantity;
    const grossAmount = pricePerShare * quantity;
    const charges = this.calculateCharges(grossAmount, order.transactionType);

    const netAmount =
      order.transactionType === 'BUY'
        ? grossAmount + charges.total
        : grossAmount - charges.total;

    await prisma.transaction.create({
      data: {
        userId: order.userId,
        stockSymbol: order.stockSymbol,
        companyName: order.companyName,
        type: order.transactionType,
        quantity,
        pricePerShare,
        grossAmount,
        brokerage: charges.brokerage,
        exchangeCharges: charges.exchangeCharges,
        gst: charges.gst,
        sebiCharges: charges.sebiCharges,
        stampDuty: charges.stampDuty,
        totalCharges: charges.total,
        netAmount,
        source: 'APP_EXECUTED',
        orderIdRef: order.kiteOrderId,
      },
    });
  }

  /**
   * Get user's orders
   */
  async getOrders(userId: string, status?: string): Promise<any[]> {
    const where: any = { userId };
    if (status) {
      where.orderStatus = status;
    }

    return prisma.order.findMany({
      where,
      orderBy: { placedAt: 'desc' },
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    userId: string,
    accessToken: string,
    orderId: string
  ): Promise<any> {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

    if (!order || !order.kiteOrderId) {
      throw new Error('Order not found');
    }

    // Cancel via Kite API
    const kite = createKiteService(accessToken);
    await kite.cancelOrder(order.kiteOrderId);

    // Update order status
    return prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'CANCELLED',
      },
    });
  }
}

export const tradingService = new TradingService();

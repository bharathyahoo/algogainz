import express, { Response } from 'express';
import { authMiddleware, AuthRequest, ensureValidKiteToken } from '../middleware/auth';
import { tradingService, type OrderRequest } from '../services/tradingService';

const router = express.Router();

/**
 * GET /api/trading/market-status
 * Check if market is currently open
 */
router.get('/market-status', (req, res) => {
  const isOpen = tradingService.isMarketOpen();
  res.json({
    success: true,
    data: {
      isOpen,
      message: isOpen
        ? 'Market is open (9:15 AM - 3:30 PM IST, Mon-Fri)'
        : 'Market is closed. Use LIMIT orders for After Market Orders (AMO).',
    },
  });
});

/**
 * POST /api/trading/preview
 * Get order preview with charges
 */
router.post('/preview', authMiddleware, ensureValidKiteToken, async (req: AuthRequest, res: Response) => {
  try {
    const kiteAccessToken = req.user?.kiteAccessToken;
    if (!kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kite access token not found',
        },
      });
    }

    const orderRequest: OrderRequest = req.body;

    // Validate required fields
    if (
      !orderRequest.stockSymbol ||
      !orderRequest.companyName ||
      !orderRequest.exchange ||
      !orderRequest.instrumentToken ||
      !orderRequest.orderType ||
      !orderRequest.transactionType ||
      !orderRequest.quantity
    ) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
        },
      });
    }

    // Validate quantity
    if (orderRequest.quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quantity must be greater than 0',
        },
      });
    }

    // Validate limit price for LIMIT orders
    if (orderRequest.orderType === 'LIMIT' && !orderRequest.price) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price is required for LIMIT orders',
        },
      });
    }

    const preview = await tradingService.getOrderPreview(kiteAccessToken, orderRequest);

    // Check margin for BUY orders
    if (orderRequest.transactionType === 'BUY') {
      const marginCheck = await tradingService.checkMargin(
        kiteAccessToken,
        preview.netAmount,
        'BUY'
      );

      return res.json({
        success: true,
        data: {
          ...preview,
          marginCheck,
        },
      });
    }

    res.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error('Order preview error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: error.message || 'Failed to generate order preview',
      },
    });
  }
});

/**
 * POST /api/trading/place
 * Place order through Kite API
 */
router.post('/place', authMiddleware, ensureValidKiteToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const kiteAccessToken = req.user?.kiteAccessToken;

    if (!userId || !kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const orderRequest: OrderRequest = req.body;

    // For BUY orders, check margin first
    if (orderRequest.transactionType === 'BUY') {
      const preview = await tradingService.getOrderPreview(kiteAccessToken, orderRequest);
      const marginCheck = await tradingService.checkMargin(
        kiteAccessToken,
        preview.netAmount,
        'BUY'
      );

      if (!marginCheck.sufficient) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_MARGIN',
            message: `Insufficient funds. Required: ₹${marginCheck.required.toFixed(2)}, Available: ₹${marginCheck.available.toFixed(2)}`,
          },
        });
      }
    }

    // Place order
    const order = await tradingService.placeOrder(userId, kiteAccessToken, orderRequest);

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully',
    });
  } catch (error: any) {
    console.error('Order placement error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ORDER_PLACEMENT_ERROR',
        message: error.message || 'Failed to place order',
      },
    });
  }
});

/**
 * GET /api/trading/orders
 * Get user's orders
 */
router.get('/orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const { status } = req.query;
    const orders = await tradingService.getOrders(userId, status as string);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ORDERS_ERROR',
        message: error.message || 'Failed to fetch orders',
      },
    });
  }
});

/**
 * GET /api/trading/orders/:id
 * Get order status and update from Kite
 */
router.get('/orders/:id', authMiddleware, ensureValidKiteToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const kiteAccessToken = req.user?.kiteAccessToken;
    const { id } = req.params;

    if (!userId || !kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const order = await tradingService.updateOrderStatus(userId, kiteAccessToken, id);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Get order status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ORDER_ERROR',
        message: error.message || 'Failed to fetch order status',
      },
    });
  }
});

/**
 * DELETE /api/trading/orders/:id
 * Cancel order
 */
router.delete('/orders/:id', authMiddleware, ensureValidKiteToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const kiteAccessToken = req.user?.kiteAccessToken;
    const { id } = req.params;

    if (!userId || !kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    const order = await tradingService.cancelOrder(userId, kiteAccessToken, id);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_ORDER_ERROR',
        message: error.message || 'Failed to cancel order',
      },
    });
  }
});

export default router;

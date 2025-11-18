import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/transactions/manual
 * Record a manual transaction (buy/sell executed outside the app)
 */
router.post('/manual', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const {
      transactionType,
      stockSymbol,
      companyName,
      quantity,
      pricePerShare,
      timestamp,
      charges,
      orderIdRef,
    } = req.body;

    // Validate required fields
    if (!transactionType || !stockSymbol || !companyName || !quantity || !pricePerShare || !timestamp) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields',
          details: {
            required: ['transactionType', 'stockSymbol', 'companyName', 'quantity', 'pricePerShare', 'timestamp'],
          },
        },
      });
    }

    // Validate transaction type
    if (!['BUY', 'SELL'].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transaction type. Must be BUY or SELL',
        },
      });
    }

    // Validate quantity and price
    if (quantity <= 0 || pricePerShare <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Quantity and price must be greater than 0',
        },
      });
    }

    // Validate date is not in future
    const transactionDate = new Date(timestamp);
    if (transactionDate > new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Transaction date cannot be in the future',
        },
      });
    }

    // For SELL orders, check if user has sufficient holdings
    if (transactionType === 'SELL') {
      const holding = await prisma.holding.findUnique({
        where: {
          userId_stockSymbol: {
            userId,
            stockSymbol,
          },
        },
      });

      if (!holding || holding.quantity < quantity) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_QUANTITY',
            message: `Cannot sell ${quantity} shares. You only hold ${holding?.quantity || 0} shares of ${stockSymbol}`,
          },
        });
      }
    }

    // Calculate amounts
    const grossAmount = pricePerShare * quantity;
    const totalCharges = charges
      ? (charges.brokerage || 0) +
        (charges.exchangeCharges || 0) +
        (charges.gst || 0) +
        (charges.sebiCharges || 0) +
        (charges.stampDuty || 0)
      : 0;

    const netAmount =
      transactionType === 'BUY'
        ? grossAmount + totalCharges
        : grossAmount - totalCharges;

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        stockSymbol,
        companyName,
        type: transactionType,
        quantity,
        pricePerShare,
        grossAmount,
        brokerage: charges?.brokerage || 0,
        exchangeCharges: charges?.exchangeCharges || 0,
        gst: charges?.gst || 0,
        sebiCharges: charges?.sebiCharges || 0,
        stampDuty: charges?.stampDuty || 0,
        totalCharges,
        netAmount,
        source: 'MANUALLY_RECORDED',
        orderIdRef: orderIdRef || null,
        timestamp: transactionDate,
      },
    });

    // Update holdings
    await updateHoldings(userId, stockSymbol, companyName, transactionType, quantity, pricePerShare, totalCharges);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Transaction recorded successfully',
    });
  } catch (error: any) {
    console.error('Manual transaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRANSACTION_ERROR',
        message: error.message || 'Failed to record transaction',
      },
    });
  }
});

/**
 * GET /api/transactions
 * Get user's transactions with filters
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    const { startDate, endDate, type, symbol, source } = req.query;

    // Build where clause
    const where: any = { userId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate as string);
      }
    }

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (symbol) {
      where.stockSymbol = symbol;
    }

    if (source && source !== 'ALL') {
      where.source = source;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TRANSACTIONS_ERROR',
        message: error.message || 'Failed to fetch transactions',
      },
    });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a manually recorded transaction
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Find transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    }

    // Only allow deleting manually recorded transactions
    if (transaction.source !== 'MANUALLY_RECORDED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OPERATION',
          message: 'Can only delete manually recorded transactions',
        },
      });
    }

    // Delete transaction
    await prisma.transaction.delete({
      where: { id },
    });

    // Recalculate holdings
    const reverseType = transaction.type === 'BUY' ? 'SELL' : 'BUY';
    await updateHoldings(
      userId,
      transaction.stockSymbol,
      transaction.companyName,
      reverseType,
      transaction.quantity,
      transaction.pricePerShare,
      transaction.totalCharges
    );

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_TRANSACTION_ERROR',
        message: error.message || 'Failed to delete transaction',
      },
    });
  }
});

/**
 * Helper function to update holdings based on transaction
 */
async function updateHoldings(
  userId: string,
  stockSymbol: string,
  companyName: string,
  transactionType: string,
  quantity: number,
  pricePerShare: number,
  charges: number
) {
  const holding = await prisma.holding.findUnique({
    where: {
      userId_stockSymbol: {
        userId,
        stockSymbol,
      },
    },
  });

  if (transactionType === 'BUY') {
    if (holding) {
      // Update existing holding
      const newQuantity = holding.quantity + quantity;
      const newTotalInvested = holding.totalInvested + (pricePerShare * quantity + charges);
      const newAvgBuyPrice = newTotalInvested / newQuantity;

      await prisma.holding.update({
        where: { id: holding.id },
        data: {
          quantity: newQuantity,
          avgBuyPrice: newAvgBuyPrice,
          totalInvested: newTotalInvested,
        },
      });
    } else {
      // Create new holding
      const totalInvested = pricePerShare * quantity + charges;
      await prisma.holding.create({
        data: {
          userId,
          stockSymbol,
          companyName,
          quantity,
          avgBuyPrice: pricePerShare,
          totalInvested,
        },
      });
    }
  } else if (transactionType === 'SELL') {
    if (holding) {
      const newQuantity = holding.quantity - quantity;

      if (newQuantity <= 0) {
        // Delete holding if all shares sold
        await prisma.holding.delete({
          where: { id: holding.id },
        });
      } else {
        // Reduce quantity, keep avg buy price
        const newTotalInvested = holding.avgBuyPrice * newQuantity;
        await prisma.holding.update({
          where: { id: holding.id },
          data: {
            quantity: newQuantity,
            totalInvested: newTotalInvested,
          },
        });
      }
    }
  }
}

export default router;

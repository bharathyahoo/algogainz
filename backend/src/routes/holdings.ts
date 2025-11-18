import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/holdings/:holdingId/exit-strategy
 * Create or update exit strategy for a holding
 */
router.post('/:holdingId/exit-strategy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { holdingId } = req.params;
    const { profitTargetPct, stopLossPct, alertEnabled } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Verify holding belongs to user
    const holding = await prisma.holding.findFirst({
      where: {
        id: holdingId,
        userId,
      },
    });

    if (!holding) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Holding not found',
        },
      });
    }

    // Validate percentages
    if (profitTargetPct !== null && profitTargetPct !== undefined && profitTargetPct <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Profit target percentage must be greater than 0',
        },
      });
    }

    if (stopLossPct !== null && stopLossPct !== undefined && stopLossPct <= 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Stop loss percentage must be greater than 0',
        },
      });
    }

    // Calculate target prices based on average buy price
    const profitTargetPrice = profitTargetPct
      ? holding.avgBuyPrice * (1 + profitTargetPct / 100)
      : null;

    const stopLossPrice = stopLossPct
      ? holding.avgBuyPrice * (1 - stopLossPct / 100)
      : null;

    // Upsert exit strategy
    const exitStrategy = await prisma.exitStrategy.upsert({
      where: {
        holdingId,
      },
      create: {
        holdingId,
        profitTargetPct,
        profitTargetPrice,
        stopLossPct,
        stopLossPrice,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : true,
      },
      update: {
        profitTargetPct,
        profitTargetPrice,
        stopLossPct,
        stopLossPrice,
        alertEnabled: alertEnabled !== undefined ? alertEnabled : undefined,
        // Reset alert triggers when strategy is updated
        profitAlertTriggered: false,
        stopLossAlertTriggered: false,
      },
    });

    res.json({
      success: true,
      data: exitStrategy,
      message: 'Exit strategy saved successfully',
    });
  } catch (error: any) {
    console.error('Exit strategy error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXIT_STRATEGY_ERROR',
        message: error.message || 'Failed to save exit strategy',
      },
    });
  }
});

/**
 * GET /api/holdings/:holdingId/exit-strategy
 * Get exit strategy for a holding
 */
router.get('/:holdingId/exit-strategy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { holdingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Verify holding belongs to user
    const holding = await prisma.holding.findFirst({
      where: {
        id: holdingId,
        userId,
      },
      include: {
        exitStrategy: true,
      },
    });

    if (!holding) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Holding not found',
        },
      });
    }

    res.json({
      success: true,
      data: holding.exitStrategy || null,
    });
  } catch (error: any) {
    console.error('Get exit strategy error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_EXIT_STRATEGY_ERROR',
        message: error.message || 'Failed to fetch exit strategy',
      },
    });
  }
});

/**
 * DELETE /api/holdings/:holdingId/exit-strategy
 * Delete exit strategy for a holding
 */
router.delete('/:holdingId/exit-strategy', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { holdingId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    }

    // Verify holding belongs to user
    const holding = await prisma.holding.findFirst({
      where: {
        id: holdingId,
        userId,
      },
    });

    if (!holding) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Holding not found',
        },
      });
    }

    // Delete exit strategy
    await prisma.exitStrategy.deleteMany({
      where: {
        holdingId,
      },
    });

    res.json({
      success: true,
      message: 'Exit strategy deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete exit strategy error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_EXIT_STRATEGY_ERROR',
        message: error.message || 'Failed to delete exit strategy',
      },
    });
  }
});

/**
 * GET /api/holdings
 * Get all holdings for user
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

    const holdings = await prisma.holding.findMany({
      where: {
        userId,
      },
      include: {
        exitStrategy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: holdings,
    });
  } catch (error: any) {
    console.error('Get holdings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_HOLDINGS_ERROR',
        message: error.message || 'Failed to fetch holdings',
      },
    });
  }
});

/**
 * GET /api/holdings/alerts
 * Get all triggered alerts for user's holdings
 */
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
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

    // Get holdings with exit strategies that have triggered alerts
    const holdings = await prisma.holding.findMany({
      where: {
        userId,
        exitStrategy: {
          OR: [
            { profitAlertTriggered: true },
            { stopLossAlertTriggered: true },
          ],
        },
      },
      include: {
        exitStrategy: true,
      },
    });

    const alerts = holdings.map((holding: any) => ({
      holdingId: holding.id,
      stockSymbol: holding.stockSymbol,
      companyName: holding.companyName,
      currentPrice: holding.currentPrice,
      quantity: holding.quantity,
      avgBuyPrice: holding.avgBuyPrice,
      unrealizedPnL: holding.unrealizedPnL,
      profitAlertTriggered: holding.exitStrategy?.profitAlertTriggered || false,
      stopLossAlertTriggered: holding.exitStrategy?.stopLossAlertTriggered || false,
      profitTargetPrice: holding.exitStrategy?.profitTargetPrice,
      stopLossPrice: holding.exitStrategy?.stopLossPrice,
    }));

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ALERTS_ERROR',
        message: error.message || 'Failed to fetch alerts',
      },
    });
  }
});

export default router;

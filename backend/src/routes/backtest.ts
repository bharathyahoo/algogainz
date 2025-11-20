/**
 * Backtest Routes - API endpoints for backtesting strategies
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { authMiddleware, ensureValidKiteToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();
const backtestService = require('../services/backtestService');

// Rate limiting for backtest operations (resource-intensive)
const backtestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 backtests per 15 minutes
  message: { error: { message: 'Too many backtest requests. Please try again later.' } },
});

/**
 * POST /api/backtest/run
 * Run a new backtest
 */
router.post('/run', authMiddleware, ensureValidKiteToken, backtestLimiter, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      strategyName,
      stockSymbol,
      startDate,
      endDate,
      initialCapital = 100000,
      entryConditions,
      exitConditions,
    } = req.body;

    // Validation
    if (!strategyName || !stockSymbol || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields' },
      });
    }

    if (!entryConditions || entryConditions.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one entry condition is required' },
      });
    }

    if (!exitConditions || exitConditions.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one exit condition is required' },
      });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: { message: 'End date must be after start date' },
      });
    }

    // Limit backtest period to 2 years
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 730) {
      return res.status(400).json({
        success: false,
        error: { message: 'Backtest period cannot exceed 2 years' },
      });
    }

    console.log(`Running backtest for ${stockSymbol} from ${startDate} to ${endDate}`);

    // Run backtest
    const result = await backtestService.runBacktest(
      {
        strategyName,
        stockSymbol,
        startDate,
        endDate,
        initialCapital,
        entryConditions,
        exitConditions,
      },
      userId
    );

    // Save result to database
    const savedResult = await prisma.backtestResult.create({
      data: {
        userId,
        strategyName: result.strategyName,
        stockSymbol: result.stockSymbol,
        companyName: result.companyName,
        startDate: new Date(result.startDate),
        endDate: new Date(result.endDate),
        initialCapital: result.initialCapital,
        entryConditions: result.entryConditions,
        exitConditions: result.exitConditions,
        totalTrades: result.totalTrades,
        winningTrades: result.winningTrades,
        losingTrades: result.losingTrades,
        winRate: result.winRate,
        totalReturn: result.totalReturn,
        totalReturnPct: result.totalReturnPct,
        finalCapital: result.finalCapital,
        avgProfitPerTrade: result.avgProfitPerTrade,
        avgLossPerTrade: result.avgLossPerTrade,
        profitFactor: result.profitFactor,
        largestWin: result.largestWin,
        largestLoss: result.largestLoss,
        maxDrawdown: result.maxDrawdown,
        maxDrawdownAmount: result.maxDrawdownAmount,
        sharpeRatio: result.sharpeRatio,
        avgTradeDuration: result.avgTradeDuration,
        tradeHistory: result.tradeHistory,
        equityCurve: result.equityCurve,
        status: 'COMPLETED',
        executionTime: result.executionTime,
      },
    });

    res.json({
      success: true,
      data: {
        id: savedResult.id,
        ...result,
      },
      message: 'Backtest completed successfully',
    });
  } catch (error: any) {
    console.error('Backtest error:', error);

    res.status(500).json({
      success: false,
      error: {
        code: 'BACKTEST_FAILED',
        message: error.message || 'Failed to run backtest',
      },
    });
  }
});

/**
 * GET /api/backtest/results
 * Get all backtest results for user
 */
router.get('/results', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit = 20, offset = 0, symbol, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const where: any = {
      userId,
      ...(symbol && { stockSymbol: symbol }),
    };

    const orderBy: any = {
      [sortBy as string]: sortOrder,
    };

    const results = await prisma.backtestResult.findMany({
      where,
      orderBy,
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        strategyName: true,
        stockSymbol: true,
        companyName: true,
        startDate: true,
        endDate: true,
        initialCapital: true,
        finalCapital: true,
        totalReturn: true,
        totalReturnPct: true,
        totalTrades: true,
        winRate: true,
        maxDrawdown: true,
        sharpeRatio: true,
        status: true,
        createdAt: true,
      },
    });

    const totalCount = await prisma.backtestResult.count({ where });

    res.json({
      success: true,
      data: results,
      pagination: {
        total: totalCount,
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset)),
      },
    });
  } catch (error) {
    console.error('Failed to get backtest results:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get backtest results',
      },
    });
  }
});

/**
 * GET /api/backtest/:id
 * Get detailed backtest result by ID
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const result = await prisma.backtestResult.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { message: 'Backtest result not found' },
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to get backtest result:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Failed to get backtest result' },
    });
  }
});

/**
 * DELETE /api/backtest/:id
 * Delete a backtest result
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Check if backtest exists and belongs to user
    const result = await prisma.backtestResult.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { message: 'Backtest result not found' },
      });
    }

    // Delete backtest
    await prisma.backtestResult.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Backtest result deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete backtest result:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete backtest result' },
    });
  }
});

/**
 * GET /api/backtest/compare
 * Compare multiple backtest results
 */
router.post('/compare', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { backtestIds } = req.body;

    if (!backtestIds || backtestIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one backtest ID is required' },
      });
    }

    if (backtestIds.length > 5) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot compare more than 5 backtests at once' },
      });
    }

    const results = await prisma.backtestResult.findMany({
      where: {
        id: { in: backtestIds },
        userId,
      },
      select: {
        id: true,
        strategyName: true,
        stockSymbol: true,
        totalReturnPct: true,
        totalTrades: true,
        winRate: true,
        profitFactor: true,
        maxDrawdown: true,
        sharpeRatio: true,
        avgTradeDuration: true,
      },
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Failed to compare backtests:', error);

    res.status(500).json({
      success: false,
      error: { message: 'Failed to compare backtests' },
    });
  }
});

export default router;

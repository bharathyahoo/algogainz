import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { technicalAnalysisService } from '../services/technicalAnalysisService';
import { createKiteService } from '../services/kiteService';

const router = express.Router();

/**
 * GET /api/analysis/:instrumentToken
 * Get technical analysis and trading recommendation for a stock
 */
router.get('/:instrumentToken', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { instrumentToken } = req.params;
    const { interval = 'day' } = req.query;
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

    // Get current price from Kite
    const kite = createKiteService(kiteAccessToken);
    const quote = await kite.getLTP([instrumentToken]);

    if (!quote || !quote[instrumentToken]) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Unable to fetch stock price',
        },
      });
    }

    const currentPrice = quote[instrumentToken].last_price;

    // Perform technical analysis
    const analysis = await technicalAnalysisService.analyzeStock(
      kiteAccessToken,
      instrumentToken,
      currentPrice,
      interval as string
    );

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('Technical analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error.message || 'Failed to perform technical analysis',
      },
    });
  }
});

/**
 * POST /api/analysis/batch
 * Get technical analysis for multiple stocks
 */
router.post('/batch', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { stocks } = req.body; // Array of { instrumentToken, symbol }
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

    if (!Array.isArray(stocks) || stocks.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'stocks array is required',
        },
      });
    }

    // Limit to 10 stocks at a time to avoid rate limiting
    const limitedStocks = stocks.slice(0, 10);
    const instrumentTokens = limitedStocks.map((s: any) => s.instrumentToken);

    // Get current prices
    const kite = createKiteService(kiteAccessToken);
    const quotes = await kite.getLTP(instrumentTokens);

    // Analyze each stock
    const analyses = await Promise.allSettled(
      limitedStocks.map(async (stock: any) => {
        const quote = quotes[stock.instrumentToken];
        if (!quote) {
          throw new Error(`Price not available for ${stock.symbol}`);
        }

        const analysis = await technicalAnalysisService.analyzeStock(
          kiteAccessToken,
          stock.instrumentToken,
          quote.last_price
        );

        return {
          symbol: stock.symbol,
          instrumentToken: stock.instrumentToken,
          ...analysis,
        };
      })
    );

    // Filter successful analyses
    const results = analyses
      .filter((result: any) => result.status === 'fulfilled')
      .map((result: any) => result.value);

    const errors = analyses
      .filter((result: any) => result.status === 'rejected')
      .map((result: any) => result.reason.message);

    res.json({
      success: true,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Batch analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BATCH_ANALYSIS_ERROR',
        message: error.message || 'Failed to perform batch analysis',
      },
    });
  }
});

/**
 * GET /api/analysis/:instrumentToken/indicators
 * Get only technical indicators without recommendation
 */
router.get('/:instrumentToken/indicators', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { instrumentToken } = req.params;
    const { interval = 'day' } = req.query;
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

    // Fetch historical data
    const candles = await technicalAnalysisService.getHistoricalData(
      kiteAccessToken,
      instrumentToken,
      interval as string,
      100
    );

    // Calculate indicators
    const indicators = technicalAnalysisService.calculateIndicators(candles);

    res.json({
      success: true,
      data: indicators,
    });
  } catch (error: any) {
    console.error('Indicators calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INDICATORS_ERROR',
        message: error.message || 'Failed to calculate indicators',
      },
    });
  }
});

export default router;

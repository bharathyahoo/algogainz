/**
 * AI Routes for AlgoGainz
 * API endpoints for AI-powered features
 */

import express, { Request, Response } from 'express';
import { aiService } from '../services/aiService';
import { aiFeatures } from '../config/ai';

const router = express.Router();

/**
 * Middleware to check if AI service is available
 */
const checkAIAvailability = (req: Request, res: Response, next: express.NextFunction) => {
  if (!aiService.isAvailable()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AI_SERVICE_UNAVAILABLE',
        message: 'AI features are currently unavailable',
      },
    });
  }
  next();
};

/**
 * GET /api/ai/status
 * Check AI service status and available features
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      available: aiService.isAvailable(),
      features: {
        conversationalAssistant: aiFeatures.conversationalAssistant,
        sentimentAnalysis: aiFeatures.sentimentAnalysis,
        enhancedRecommendations: aiFeatures.enhancedRecommendations,
        tradeJournalAnalysis: aiFeatures.tradeJournalAnalysis,
        automatedReports: aiFeatures.automatedReports,
      },
    },
  });
});

/**
 * POST /api/ai/ask
 * Conversational assistant - Ask any trading-related question
 *
 * Body: {
 *   question: string,
 *   context?: any
 * }
 */
router.post('/ask', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_QUESTION',
          message: 'Question is required and must be a string',
        },
      });
    }

    const answer = await aiService.askAssistant(question, context);

    res.json({
      success: true,
      data: {
        question,
        answer,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Ask Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'AI_REQUEST_FAILED',
        message: error.message || 'Failed to process AI request',
      },
    });
  }
});

/**
 * POST /api/ai/analyze-stock
 * Get AI-powered stock analysis
 *
 * Body: {
 *   symbol: string,
 *   indicators: object,
 *   marketData?: object
 * }
 */
router.post('/analyze-stock', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { symbol, indicators, marketData } = req.body;

    if (!symbol || !indicators) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'Symbol and indicators are required',
        },
      });
    }

    const analysis = await aiService.analyzeStock(symbol, indicators, marketData);

    res.json({
      success: true,
      data: {
        symbol,
        analysis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Stock Analysis Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: error.message || 'Failed to analyze stock',
      },
    });
  }
});

/**
 * POST /api/ai/sentiment
 * Analyze news sentiment for a stock
 *
 * Body: {
 *   symbol: string,
 *   newsArticles: string[]
 * }
 */
router.post('/sentiment', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { symbol, newsArticles } = req.body;

    if (!symbol || !newsArticles || !Array.isArray(newsArticles)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Symbol and newsArticles (array) are required',
        },
      });
    }

    const sentiment = await aiService.analyzeSentiment(symbol, newsArticles);

    res.json({
      success: true,
      data: {
        symbol,
        sentiment,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Sentiment Analysis Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SENTIMENT_ANALYSIS_FAILED',
        message: error.message || 'Failed to analyze sentiment',
      },
    });
  }
});

/**
 * POST /api/ai/portfolio-review
 * Get AI review of user's portfolio
 *
 * Body: {
 *   holdings: array,
 *   totalPnL: number,
 *   context?: any
 * }
 */
router.post('/portfolio-review', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { holdings, totalPnL, context } = req.body;

    if (!holdings || !Array.isArray(holdings)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HOLDINGS',
          message: 'Holdings must be an array',
        },
      });
    }

    const review = await aiService.reviewPortfolio(holdings, totalPnL || 0, context);

    res.json({
      success: true,
      data: {
        review,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Portfolio Review Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PORTFOLIO_REVIEW_FAILED',
        message: error.message || 'Failed to review portfolio',
      },
    });
  }
});

/**
 * POST /api/ai/trade-advice
 * Get AI advice for a potential trade
 *
 * Body: {
 *   symbol: string,
 *   action: 'BUY' | 'SELL',
 *   context: object
 * }
 */
router.post('/trade-advice', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { symbol, action, context } = req.body;

    if (!symbol || !action || !['BUY', 'SELL'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Symbol and action (BUY/SELL) are required',
        },
      });
    }

    const advice = await aiService.getTradeAdvice(symbol, action, context || {});

    res.json({
      success: true,
      data: {
        symbol,
        action,
        advice,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Trade Advice Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TRADE_ADVICE_FAILED',
        message: error.message || 'Failed to get trade advice',
      },
    });
  }
});

/**
 * POST /api/ai/analyze-journal
 * Analyze trading patterns from transaction history
 *
 * Body: {
 *   transactions: array
 * }
 */
router.post('/analyze-journal', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSACTIONS',
          message: 'Transactions must be an array',
        },
      });
    }

    const analysis = await aiService.analyzeTradeJournal(transactions);

    res.json({
      success: true,
      data: {
        analysis,
        transactionsAnalyzed: transactions.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Journal Analysis Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'JOURNAL_ANALYSIS_FAILED',
        message: error.message || 'Failed to analyze trade journal',
      },
    });
  }
});

/**
 * POST /api/ai/performance-report
 * Generate automated performance report
 *
 * Body: {
 *   metrics: object
 * }
 */
router.post('/performance-report', checkAIAvailability, async (req: Request, res: Response) => {
  try {
    const { metrics } = req.body;

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_METRICS',
          message: 'Metrics object is required',
        },
      });
    }

    const report = await aiService.generatePerformanceReport(metrics);

    res.json({
      success: true,
      data: {
        report,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[AI Performance Report Error]', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REPORT_GENERATION_FAILED',
        message: error.message || 'Failed to generate performance report',
      },
    });
  }
});

export default router;

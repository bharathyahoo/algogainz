import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { createKiteService } from '../services/kiteService';

const router = express.Router();

/**
 * GET /api/instruments/search?q=reliance
 * Search for stocks by name or symbol
 */
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    const kiteAccessToken = req.user?.kiteAccessToken;

    if (!kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kite access token not found'
        }
      });
    }

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Search query (q) is required'
        }
      });
    }

    const kite = createKiteService(kiteAccessToken);

    // Get NSE instruments (returns parsed array)
    const instruments = await kite.getInstruments('NSE');

    // Filter and map results
    const searchQuery = q.toLowerCase();
    const results = instruments
      .filter((item: any) => {
        // Only show EQ (equity) instruments
        if (item.instrument_type !== 'EQ') return false;

        // Search by symbol or name
        const symbol = (item.tradingsymbol || '').toLowerCase();
        const name = (item.name || '').toLowerCase();

        return symbol.includes(searchQuery) || name.includes(searchQuery);
      })
      .slice(0, 20) // Limit to 20 results
      .map((item: any) => ({
        instrumentToken: item.instrument_token,
        tradingsymbol: item.tradingsymbol,
        name: item.name,
        exchange: item.exchange,
        instrumentType: item.instrument_type
      }));

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    console.error('Instrument search error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to search instruments',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/instruments/quote?symbols=NSE:INFY,NSE:RELIANCE
 * Get live quotes for multiple symbols
 */
router.get('/quote', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { symbols } = req.query;
    const kiteAccessToken = req.user?.kiteAccessToken;

    if (!kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kite access token not found'
        }
      });
    }

    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'symbols query parameter is required (comma-separated, e.g., NSE:INFY,NSE:RELIANCE)'
        }
      });
    }

    const kite = createKiteService(kiteAccessToken);
    const symbolArray = symbols.split(',').map(s => s.trim());

    const quotes = await kite.getQuote(symbolArray);

    res.json({
      success: true,
      data: quotes
    });
  } catch (error: any) {
    console.error('Get quote error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch quotes',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/instruments/ltp?symbols=NSE:INFY,NSE:RELIANCE
 * Get last traded price for multiple symbols
 */
router.get('/ltp', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { symbols } = req.query;
    const kiteAccessToken = req.user?.kiteAccessToken;

    if (!kiteAccessToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Kite access token not found'
        }
      });
    }

    if (!symbols || typeof symbols !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'symbols query parameter is required'
        }
      });
    }

    const kite = createKiteService(kiteAccessToken);
    const symbolArray = symbols.split(',').map(s => s.trim());

    const ltpData = await kite.getLTP(symbolArray);

    res.json({
      success: true,
      data: ltpData
    });
  } catch (error: any) {
    console.error('Get LTP error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch LTP',
        details: error.message
      }
    });
  }
});

export default router;
